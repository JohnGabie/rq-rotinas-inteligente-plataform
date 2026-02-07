"""
CRUD DeviceSession - Operações para sessões de dispositivos
"""
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_, func
from uuid import UUID
from datetime import datetime, timedelta

from app.crud.base import CRUDBase
from app.models.device_session import DeviceSession, TriggerSource
from app.models.device import Device
from pydantic import BaseModel


class DeviceSessionCreate(BaseModel):
    """Schema para criar sessão"""
    device_id: UUID
    user_id: UUID
    device_name: str
    started_at: datetime
    trigger_source: TriggerSource = TriggerSource.MANUAL


class DeviceSessionUpdate(BaseModel):
    """Schema para atualizar sessão"""
    ended_at: Optional[datetime] = None
    duration_seconds: Optional[int] = None


class CRUDDeviceSession(CRUDBase[DeviceSession, DeviceSessionCreate, DeviceSessionUpdate]):
    """CRUD operations for DeviceSession"""

    def start_session(
            self,
            db: Session,
            *,
            device_id: UUID,
            user_id: UUID,
            device_name: str,
            started_at: datetime,
            trigger_source: TriggerSource = TriggerSource.MANUAL
    ) -> DeviceSession:
        """
        Iniciar uma nova sessão para um dispositivo (quando ele é ligado)

        Args:
            db: Database session
            device_id: ID do dispositivo
            user_id: ID do usuário
            device_name: Nome do dispositivo (snapshot)
            started_at: Quando foi ligado
            trigger_source: O que causou a ação

        Returns:
            DeviceSession criada
        """
        session = DeviceSession(
            device_id=device_id,
            user_id=user_id,
            device_name=device_name,
            started_at=started_at,
            trigger_source=trigger_source
        )
        db.add(session)
        db.commit()
        db.refresh(session)
        return session

    def end_session(
            self,
            db: Session,
            *,
            device_id: UUID,
            ended_at: datetime
    ) -> Optional[DeviceSession]:
        """
        Finalizar a sessão ativa de um dispositivo (quando ele é desligado)

        Args:
            db: Database session
            device_id: ID do dispositivo
            ended_at: Quando foi desligado

        Returns:
            DeviceSession finalizada ou None se não havia sessão ativa
        """
        # Buscar sessão ativa (ended_at é NULL)
        session = (
            db.query(DeviceSession)
            .filter(
                DeviceSession.device_id == device_id,
                DeviceSession.ended_at.is_(None)
            )
            .first()
        )

        if session:
            session.end_session(ended_at)
            db.commit()
            db.refresh(session)

        return session

    def get_active_session(
            self,
            db: Session,
            *,
            device_id: UUID
    ) -> Optional[DeviceSession]:
        """
        Buscar sessão ativa de um dispositivo

        Args:
            db: Database session
            device_id: ID do dispositivo

        Returns:
            DeviceSession ativa ou None
        """
        return (
            db.query(DeviceSession)
            .filter(
                DeviceSession.device_id == device_id,
                DeviceSession.ended_at.is_(None)
            )
            .first()
        )

    def get_by_user(
            self,
            db: Session,
            *,
            user_id: UUID,
            skip: int = 0,
            limit: int = 100
    ) -> List[DeviceSession]:
        """
        Buscar todas as sessões de um usuário

        Returns:
            Lista de sessões ordenadas por mais recente
        """
        return (
            db.query(DeviceSession)
            .filter(DeviceSession.user_id == user_id)
            .order_by(DeviceSession.started_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_by_device(
            self,
            db: Session,
            *,
            device_id: UUID,
            skip: int = 0,
            limit: int = 100
    ) -> List[DeviceSession]:
        """
        Buscar todas as sessões de um dispositivo

        Returns:
            Lista de sessões ordenadas por mais recente
        """
        return (
            db.query(DeviceSession)
            .filter(DeviceSession.device_id == device_id)
            .order_by(DeviceSession.started_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_sessions_in_period(
            self,
            db: Session,
            *,
            user_id: UUID,
            start_date: datetime,
            end_date: datetime
    ) -> List[DeviceSession]:
        """
        Buscar sessões em um período

        Args:
            db: Database session
            user_id: ID do usuário
            start_date: Início do período
            end_date: Fim do período

        Returns:
            Lista de sessões no período
        """
        return (
            db.query(DeviceSession)
            .filter(
                DeviceSession.user_id == user_id,
                DeviceSession.started_at >= start_date,
                DeviceSession.started_at <= end_date
            )
            .order_by(DeviceSession.started_at.asc())
            .all()
        )

    def get_total_time_by_device(
            self,
            db: Session,
            *,
            user_id: UUID,
            start_date: datetime,
            end_date: datetime
    ) -> List[dict]:
        """
        Calcular tempo total ligado por dispositivo em um período

        Returns:
            Lista de dicts com device_id, device_name, total_seconds
        """
        results = (
            db.query(
                DeviceSession.device_id,
                DeviceSession.device_name,
                func.sum(DeviceSession.duration_seconds).label('total_seconds')
            )
            .filter(
                DeviceSession.user_id == user_id,
                DeviceSession.started_at >= start_date,
                DeviceSession.started_at <= end_date,
                DeviceSession.ended_at.isnot(None)  # Apenas sessões finalizadas
            )
            .group_by(DeviceSession.device_id, DeviceSession.device_name)
            .order_by(func.sum(DeviceSession.duration_seconds).desc())
            .all()
        )

        return [
            {
                "device_id": str(r.device_id),
                "device_name": r.device_name,
                "total_seconds": r.total_seconds or 0
            }
            for r in results
        ]

    def get_daily_usage(
            self,
            db: Session,
            *,
            user_id: UUID,
            start_date: datetime,
            end_date: datetime
    ) -> List[dict]:
        """
        Calcular uso diário total de dispositivos

        Returns:
            Lista de dicts com date, total_seconds
        """
        results = (
            db.query(
                func.date(DeviceSession.started_at).label('date'),
                func.sum(DeviceSession.duration_seconds).label('total_seconds')
            )
            .filter(
                DeviceSession.user_id == user_id,
                DeviceSession.started_at >= start_date,
                DeviceSession.started_at <= end_date,
                DeviceSession.ended_at.isnot(None)
            )
            .group_by(func.date(DeviceSession.started_at))
            .order_by(func.date(DeviceSession.started_at).asc())
            .all()
        )

        return [
            {
                "date": str(r.date),
                "total_seconds": r.total_seconds or 0
            }
            for r in results
        ]


# Instância global do CRUD
crud_device_session = CRUDDeviceSession(DeviceSession)
