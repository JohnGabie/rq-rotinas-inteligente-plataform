"""
Routine Service - Execução de rotinas e lógica de negócio
"""
import asyncio
from typing import Tuple, List, Dict
from sqlalchemy.orm import Session
from uuid import UUID
from datetime import datetime

from app.models.routine import Routine
from app.models.enums import ActivityType
from app.crud.routine import crud_routine
from app.crud.activity_log import crud_activity_log
from app.services.device_service import device_service
from app.schemas.activity_log import ActivityLogCreate
from app.utils.logger import logger


class RoutineService:
    """
    Serviço de alto nível para rotinas
    Orquestra execução de rotinas com delays
    """

    async def execute_routine(
            self,
            db: Session,
            *,
            routine_id: UUID,
            user_id: UUID
    ) -> Tuple[bool, Dict]:
        """
        Executa uma rotina completa

        Args:
            db: Database session
            routine_id: UUID da rotina
            user_id: UUID do usuário (validação)

        Returns:
            Tuple[success, result_data]
        """
        # Buscar rotina
        routine = crud_routine.get_user_routine(
            db,
            routine_id=routine_id,
            user_id=user_id
        )

        if not routine:
            return False, {"error": "Rotina não encontrada"}

        # Ordenar ações
        sorted_actions = sorted(routine.actions, key=lambda a: a.order)

        # Verificar se execução é simultânea ou sequencial
        is_simultaneous = all(action.delay == 0 for action in sorted_actions)

        # Iniciar execução
        start_time = datetime.utcnow()
        results = []
        executed = 0
        failed = 0

        logger.info(
            f"Executando rotina '{routine.name}' "
            f"com {len(sorted_actions)} ações "
            f"({'simultâneas' if is_simultaneous else 'sequenciais'})"
        )

        # Executar ações
        if is_simultaneous:
            # Execução simultânea (todos os delays = 0)
            for action in sorted_actions:
                success, error_msg = device_service.toggle_device(
                    db,
                    device_id=action.device_id,
                    user_id=user_id,
                    state=action.turn_on
                )

                results.append({
                    "device_id": str(action.device_id),
                    "success": success,
                    "executed_at": datetime.utcnow().isoformat(),
                    "error": error_msg
                })

                if success:
                    executed += 1
                else:
                    failed += 1
        else:
            # Execução sequencial (respeita delays)
            for i, action in enumerate(sorted_actions):
                # Aguardar delay da ação anterior (se houver)
                if i > 0 and sorted_actions[i - 1].delay > 0:
                    await asyncio.sleep(sorted_actions[i - 1].delay)

                success, error_msg = device_service.toggle_device(
                    db,
                    device_id=action.device_id,
                    user_id=user_id,
                    state=action.turn_on
                )

                results.append({
                    "device_id": str(action.device_id),
                    "success": success,
                    "executed_at": datetime.utcnow().isoformat(),
                    "error": error_msg
                })

                if success:
                    executed += 1
                else:
                    failed += 1

        # Calcular tempo de execução
        end_time = datetime.utcnow()
        execution_time_ms = int((end_time - start_time).total_seconds() * 1000)

        # Atualizar timestamp de última execução
        crud_routine.update_last_executed(
            db,
            routine_id=routine_id,
            executed_at=end_time
        )

        # Criar log de atividade
        self._create_execution_log(
            db,
            user_id=user_id,
            routine=routine,
            executed=executed,
            failed=failed,
            execution_time_ms=execution_time_ms
        )

        result_data = {
            "routine_id": str(routine_id),
            "executed_actions": executed,
            "failed_actions": failed,
            "execution_time_ms": execution_time_ms,
            "executed_at": end_time.isoformat(),
            "results": results
        }

        logger.info(
            f"Rotina '{routine.name}' executada: "
            f"{executed} sucessos, {failed} falhas, {execution_time_ms}ms"
        )

        return True, result_data

    def _create_execution_log(
            self,
            db: Session,
            *,
            user_id: UUID,
            routine: Routine,
            executed: int,
            failed: int,
            execution_time_ms: int
    ):
        """Cria log de execução de rotina"""
        description = (
            f"{executed} ação(ões) executada(s)"
            f"{f', {failed} falha(s)' if failed > 0 else ''} "
            f"({execution_time_ms}ms)"
        )

        log = ActivityLogCreate(
            type=ActivityType.ROUTINE_EXECUTED,
            title="Rotina executada",
            description=description,
            routine_id=routine.id,
            routine_name=routine.name
        )

        crud_activity_log.create_with_user(db, obj_in=log, user_id=user_id)

    def create_routine_log(
            self,
            db: Session,
            *,
            user_id: UUID,
            routine_id: UUID,
            routine_name: str,
            activity_type: ActivityType,
            title: str,
            description: str
    ):
        """Cria log genérico de rotina"""
        log = ActivityLogCreate(
            type=activity_type,
            title=title,
            description=description,
            routine_id=routine_id,
            routine_name=routine_name
        )

        crud_activity_log.create_with_user(db, obj_in=log, user_id=user_id)


# Instância global
routine_service = RoutineService()