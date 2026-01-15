"""
Scheduler Service - Agendamento automático de rotinas
Usa APScheduler para executar rotinas em horários específicos
"""
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from datetime import datetime
from typing import Dict, List
import asyncio

from backend.app.core.database import SessionLocal
from backend.app.crud.routine import crud_routine
from backend.app.services.routine_service import routine_service
from backend.app.models.enums import TriggerType, WeekDay
from backend.app.utils.logger import logger


class SchedulerService:
    """
    Gerencia agendamento de rotinas
    Sincroniza rotinas ativas com o scheduler
    """

    def __init__(self):
        self.scheduler = AsyncIOScheduler()
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
        """
        db = SessionLocal()
        try:
            routines = crud_routine.get_active_time_routines(db)

            logger.info(f"🔄 Sincronizando {len(routines)} rotinas de horário")

            for routine in routines:
                self.schedule_routine(routine.id, routine.trigger_time, routine.week_days)

            logger.info(f"✅ {len(routines)} rotinas agendadas")

        except Exception as e:
            logger.error(f"Erro ao sincronizar rotinas: {e}")
        finally:
            db.close()

    def schedule_routine(self, routine_id: str, trigger_time: datetime.time, week_days: List[WeekDay]):
        """
        Agenda uma rotina específica

        Args:
            routine_id: UUID da rotina
            trigger_time: Horário de execução
            week_days: Dias da semana
        """
        # Remover job existente se houver
        self.unschedule_routine(routine_id)

        # Converter dias da semana para formato do cron
        day_of_week = self._convert_week_days(week_days)

        # Criar trigger cron
        trigger = CronTrigger(
            hour=trigger_time.hour,
            minute=trigger_time.minute,
            second=0,
            day_of_week=day_of_week
        )

        # Adicionar job
        job = self.scheduler.add_job(
            self._execute_scheduled_routine,
            trigger=trigger,
            args=[routine_id],
            id=f"routine_{routine_id}",
            name=f"Rotina {routine_id}",
            replace_existing=True
        )

        self.scheduled_jobs[routine_id] = job.id

        logger.info(
            f"📅 Rotina {routine_id} agendada: "
            f"{trigger_time.strftime('%H:%M')} nos dias {day_of_week}"
        )

    def unschedule_routine(self, routine_id: str):
        """
        Remove agendamento de uma rotina

        Args:
            routine_id: UUID da rotina
        """
        job_id = self.scheduled_jobs.get(routine_id)

        if job_id:
            try:
                self.scheduler.remove_job(job_id)
                del self.scheduled_jobs[routine_id]
                logger.info(f"🗑️  Rotina {routine_id} desagendada")
            except Exception as e:
                logger.error(f"Erro ao desagendar rotina {routine_id}: {e}")

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