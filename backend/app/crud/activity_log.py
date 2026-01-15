"""
CRUD Activity Log - Operações de banco para logs
"""
from typing import List, Optional
from sqlalchemy.orm import Session
from uuid import UUID
from datetime import datetime

from backend.app.crud.base import CRUDBase
from backend.app.models.activity_log import ActivityLog
from backend.app.schemas.activity_log import ActivityLogCreate


class CRUDActivityLog(CRUDBase[ActivityLog, ActivityLogCreate, ActivityLogCreate]):
    """CRUD operations for ActivityLog"""

    def get_by_user(
            self,
            db: Session,
            *,
            user_id: UUID,
            skip: int = 0,
            limit: int = 100
    ) -> List[ActivityLog]:
        """
        Buscar logs de um usuário
        Ordenado por mais recente primeiro
        """
        return (
            db.query(ActivityLog)
            .filter(ActivityLog.user_id == user_id)
            .order_by(ActivityLog.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def create_with_user(
            self,
            db: Session,
            *,
            obj_in: ActivityLogCreate,
            user_id: UUID
    ) -> ActivityLog:
        """Criar log associado a um usuário"""
        obj_in_data = obj_in.model_dump()
        log = ActivityLog(**obj_in_data, user_id=user_id)
        db.add(log)
        db.commit()
        db.refresh(log)
        return log

    def get_count_by_user(
            self,
            db: Session,
            *,
            user_id: UUID
    ) -> int:
        """Contar total de logs de um usuário"""
        return db.query(ActivityLog).filter(
            ActivityLog.user_id == user_id
        ).count()

    def delete_old_logs(
            self,
            db: Session,
            *,
            user_id: UUID,
            keep_last: int = 100
    ) -> int:
        """
        Deletar logs antigos, mantendo apenas os N mais recentes

        Returns:
            int: Quantidade de logs deletados
        """
        # Buscar IDs dos logs a manter
        logs_to_keep = (
            db.query(ActivityLog.id)
            .filter(ActivityLog.user_id == user_id)
            .order_by(ActivityLog.created_at.desc())
            .limit(keep_last)
            .all()
        )

        keep_ids = [log.id for log in logs_to_keep]

        # Deletar logs que não estão na lista
        deleted = db.query(ActivityLog).filter(
            ActivityLog.user_id == user_id,
            ActivityLog.id.notin_(keep_ids)
        ).delete(synchronize_session=False)

        db.commit()
        return deleted


# Instância global do CRUD
crud_activity_log = CRUDActivityLog(ActivityLog)