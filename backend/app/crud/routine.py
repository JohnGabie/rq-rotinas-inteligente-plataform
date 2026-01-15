"""
CRUD Routine - Operações de banco para rotinas
"""
from typing import List, Optional
from sqlalchemy.orm import Session
from uuid import UUID
from datetime import datetime

from backend.app.crud.base import CRUDBase
from backend.app.models.routine import Routine, RoutineAction
from backend.app.schemas.routine import RoutineCreate, RoutineUpdate, RoutineActionCreate
from backend.app.models.enums import TriggerType


class CRUDRoutine(CRUDBase[Routine, RoutineCreate, RoutineUpdate]):
    """CRUD operations for Routine"""

    def get_by_user(
            self,
            db: Session,
            *,
            user_id: UUID,
            skip: int = 0,
            limit: int = 100
    ) -> List[Routine]:
        """Buscar rotinas de um usuário"""
        return (
            db.query(Routine)
            .filter(Routine.user_id == user_id)
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_user_routine(
            self,
            db: Session,
            *,
            routine_id: UUID,
            user_id: UUID
    ) -> Optional[Routine]:
        """Buscar rotina específica de um usuário"""
        return (
            db.query(Routine)
            .filter(
                Routine.id == routine_id,
                Routine.user_id == user_id
            )
            .first()
        )

    def create_with_user(
            self,
            db: Session,
            *,
            obj_in: RoutineCreate,
            user_id: UUID
    ) -> Routine:
        """Criar rotina com ações"""
        # Extrair ações
        actions_data = obj_in.actions
        obj_data = obj_in.model_dump(exclude={'actions'})

        # Criar rotina
        routine = Routine(**obj_data, user_id=user_id)
        db.add(routine)
        db.flush()  # Gera ID sem commit

        # Criar ações
        for action_data in actions_data:
            action = RoutineAction(
                **action_data.model_dump(),
                routine_id=routine.id
            )
            db.add(action)

        db.commit()
        db.refresh(routine)
        return routine

    def update_routine(
            self,
            db: Session,
            *,
            routine: Routine,
            obj_in: RoutineUpdate
    ) -> Routine:
        """Atualizar rotina e suas ações"""
        update_data = obj_in.model_dump(exclude_unset=True)

        # Se houver ações, deletar antigas e criar novas
        if 'actions' in update_data and update_data['actions']:
            # Deletar ações antigas
            db.query(RoutineAction).filter(
                RoutineAction.routine_id == routine.id
            ).delete()

            # Criar novas ações
            actions_data = update_data.pop('actions')
            for action_data in actions_data:
                action = RoutineAction(
                    **action_data.model_dump(),
                    routine_id=routine.id
                )
                db.add(action)

        # Atualizar campos da rotina
        for field, value in update_data.items():
            setattr(routine, field, value)

        db.add(routine)
        db.commit()
        db.refresh(routine)
        return routine

    def toggle_active(
            self,
            db: Session,
            *,
            routine_id: UUID,
            is_active: bool
    ) -> Optional[Routine]:
        """Ativar/desativar rotina"""
        routine = db.query(Routine).filter(Routine.id == routine_id).first()

        if routine:
            routine.is_active = is_active
            db.add(routine)
            db.commit()
            db.refresh(routine)

        return routine

    def update_last_executed(
            self,
            db: Session,
            *,
            routine_id: UUID,
            executed_at: datetime
    ) -> Optional[Routine]:
        """Atualizar timestamp de última execução"""
        routine = db.query(Routine).filter(Routine.id == routine_id).first()

        if routine:
            routine.last_executed_at = executed_at
            db.add(routine)
            db.commit()
            db.refresh(routine)

        return routine

    def get_active_time_routines(
            self,
            db: Session,
            *,
            user_id: Optional[UUID] = None
    ) -> List[Routine]:
        """Buscar rotinas ativas com gatilho de horário"""
        query = db.query(Routine).filter(
            Routine.is_active == True,
            Routine.trigger_type == TriggerType.TIME
        )

        if user_id:
            query = query.filter(Routine.user_id == user_id)

        return query.all()


# Instância global do CRUD
crud_routine = CRUDRoutine(Routine)