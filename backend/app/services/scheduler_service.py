"""
Scheduler Service - Agendamento automático de rotinas
Usa APScheduler para executar rotinas em horários específicos
"""
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from datetime import datetime
from zoneinfo import ZoneInfo
from typing import Dict, List
import asyncio

from app.core.database import SessionLocal
from app.crud.routine import crud_routine
from app.services.routine_service import routine_service
from app.models.enums import TriggerType, WeekDay
from app.utils.logger import logger

# Timezone de São Paulo
SAO_PAULO_TZ = ZoneInfo("America/Sao_Paulo")


class SchedulerService:
    """
    Gerencia agendamento de rotinas
    Sincroniza rotinas ativas com o scheduler
    """

    def __init__(self):
        self.scheduler = AsyncIOScheduler(timezone=SAO_PAULO_TZ)
        self.scheduled_jobs: Dict[str, str] = {}  # routine_id: job_id
        self._running = False

    def start(self):
        """Inicia o scheduler"""
        if not self._running:
            self.scheduler.start()
            self._running = True
            logger.info("✅ Scheduler iniciado")

            # Carregar rotinas existentes
            asyncio.create_task(self.sync_all_routines())

    def stop(self):
        """Para o scheduler"""
        if self._running:
            self.scheduler.shutdown()
            self._running = False
            logger.info("⏹️  Scheduler parado")

    async def sync_all_routines(self):
        """
        Sincroniza todas as rotinas de horário ativas
        Deve ser chamado ao iniciar o servidor
        Remove rotinas que não deveriam estar agendadas
        """
        db = SessionLocal()
        try:
            # Buscar rotinas ativas do banco
            active_routines = crud_routine.get_active_time_routines(db)
            active_routine_ids = {str(r.id) for r in active_routines}

            logger.info(f"🔄 Sincronizando {len(active_routines)} rotinas de horário")

            # Remover jobs de rotinas que não estão mais ativas
            jobs_to_remove = []
            for routine_id in list(self.scheduled_jobs.keys()):
                if routine_id not in active_routine_ids:
                    jobs_to_remove.append(routine_id)

            for routine_id in jobs_to_remove:
                self.unschedule_routine(routine_id)
                logger.info(f"🧹 Rotina {routine_id} removida (não está mais ativa)")

            # Agendar rotinas ativas
            for routine in active_routines:
                self.schedule_routine(str(routine.id), routine.trigger_time, routine.week_days)

            logger.info(f"✅ {len(active_routines)} rotinas sincronizadas")

        except Exception as e:
            logger.error(f"Erro ao sincronizar rotinas: {e}")
        finally:
            db.close()

    def schedule_routine(self, routine_id: str, trigger_time: datetime.time, week_days: List[WeekDay]):
        """
        Agenda uma rotina específica (idempotente)

        Args:
            routine_id: UUID da rotina
            trigger_time: Horário de execução
            week_days: Dias da semana
        """
        # Converter para string para consistência
        routine_id_str = str(routine_id)

        # Converter dias da semana para formato do cron
        day_of_week = self._convert_week_days(week_days)

        # Criar trigger cron com timezone de São Paulo
        trigger = CronTrigger(
            hour=trigger_time.hour,
            minute=trigger_time.minute,
            second=0,
            day_of_week=day_of_week,
            timezone=SAO_PAULO_TZ
        )

        job_id = f"routine_{routine_id_str}"

        # Verificar se já existe um job com a mesma configuração
        existing_job = self.scheduler.get_job(job_id)
        if existing_job:
            # Job já existe, apenas atualizar se necessário
            self.scheduled_jobs[routine_id_str] = job_id
            logger.debug(f"Rotina {routine_id_str} já está agendada, atualizando...")

        # Adicionar/atualizar job (replace_existing=True garante idempotência)
        job = self.scheduler.add_job(
            self._execute_scheduled_routine,
            trigger=trigger,
            args=[routine_id_str],
            id=job_id,
            name=f"Rotina {routine_id_str}",
            replace_existing=True
        )

        self.scheduled_jobs[routine_id_str] = job.id

        logger.info(
            f"📅 Rotina {routine_id_str} agendada: "
            f"{trigger_time.strftime('%H:%M')} nos dias {day_of_week}"
        )

    def unschedule_routine(self, routine_id: str):
        """
        Remove agendamento de uma rotina (idempotente)

        Args:
            routine_id: UUID da rotina
        """
        routine_id_str = str(routine_id)
        job_id = f"routine_{routine_id_str}"

        # Verificar se o job existe antes de tentar remover
        existing_job = self.scheduler.get_job(job_id)
        if not existing_job:
            # Job não existe, nada a fazer (idempotente)
            if routine_id_str in self.scheduled_jobs:
                del self.scheduled_jobs[routine_id_str]
            return

        try:
            self.scheduler.remove_job(job_id)
            if routine_id_str in self.scheduled_jobs:
                del self.scheduled_jobs[routine_id_str]
            logger.info(f"🗑️  Rotina {routine_id_str} desagendada")
        except Exception as e:
            logger.error(f"Erro ao desagendar rotina {routine_id_str}: {e}")

    async def _execute_scheduled_routine(self, routine_id: str):
        """
        Executa rotina agendada (chamada pelo scheduler)

        Args:
            routine_id: UUID da rotina
        """
        logger.info(f"⏰ Executando rotina agendada: {routine_id}")

        db = SessionLocal()
        try:
            # Buscar rotina para pegar user_id
            routine = crud_routine.get(db, id=routine_id)

            if not routine:
                logger.error(f"Rotina {routine_id} não encontrada")
                return

            if not routine.is_active:
                logger.warning(f"Rotina {routine_id} está inativa, pulando execução")
                return

            # Executar rotina
            success, result = await routine_service.execute_routine(
                db,
                routine_id=routine.id,
                user_id=routine.user_id
            )

            if success:
                logger.info(
                    f"✅ Rotina {routine.name} executada: "
                    f"{result['executed_actions']} ações, "
                    f"{result['execution_time_ms']}ms"
                )
            else:
                logger.error(f"❌ Erro ao executar rotina {routine.name}")

        except Exception as e:
            logger.error(f"Exceção ao executar rotina {routine_id}: {e}")
        finally:
            db.close()

    def _convert_week_days(self, week_days: List[WeekDay]) -> str:
        """
        Converte dias da semana do modelo para formato cron

        Args:
            week_days: Lista de WeekDay enums

        Returns:
            str: Dias no formato cron (ex: "mon,wed,fri")
        """
        day_map = {
            WeekDay.SEG: "mon",
            WeekDay.TER: "tue",
            WeekDay.QUA: "wed",
            WeekDay.QUI: "thu",
            WeekDay.SEX: "fri",
            WeekDay.SAB: "sat",
            WeekDay.DOM: "sun"
        }

        if not week_days:
            return "*"  # Todos os dias

        cron_days = [day_map[day] for day in week_days if day in day_map]
        return ",".join(cron_days)

    def get_scheduled_jobs(self) -> List[dict]:
        """
        Retorna lista de jobs agendados

        Returns:
            List de dicts com info dos jobs
        """
        jobs = []
        for job in self.scheduler.get_jobs():
            jobs.append({
                "id": job.id,
                "name": job.name,
                "next_run": job.next_run_time.isoformat() if job.next_run_time else None
            })
        return jobs


# Instância global
scheduler_service = SchedulerService()