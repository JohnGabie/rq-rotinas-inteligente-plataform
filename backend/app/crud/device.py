"""
CRUD Device - Operações de banco para dispositivos
"""
from typing import List, Optional
from sqlalchemy.orm import Session
from uuid import UUID

from app.crud.base import CRUDBase
from app.models.device import Device
from app.schemas.device import DeviceCreate, DeviceUpdate
from app.models.enums import DeviceStatus


class CRUDDevice(CRUDBase[Device, DeviceCreate, DeviceUpdate]):
    """CRUD operations for Device"""

    def get_by_user(
            self,
            db: Session,
            *,
            user_id: UUID,
            skip: int = 0,
            limit: int = 100
    ) -> List[Device]:
        """
        Buscar dispositivos de um usuário específico

        Args:
            db: Database session
            user_id: UUID do usuário
            skip: Offset para paginação
            limit: Quantidade máxima

        Returns:
            Lista de dispositivos do usuário
        """
        return (
            db.query(Device)
            .filter(Device.user_id == user_id)
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_online_devices(
            self,
            db: Session,
            *,
            user_id: UUID
    ) -> List[Device]:
        """
        Buscar apenas dispositivos online de um usuário

        Args:
            db: Database session
            user_id: UUID do usuário

        Returns:
            Lista de dispositivos online
        """
        return (
            db.query(Device)
            .filter(
                Device.user_id == user_id,
                Device.status == DeviceStatus.ONLINE
            )
            .all()
        )

    def create_with_user(
            self,
            db: Session,
            *,
            obj_in: DeviceCreate,
            user_id: UUID
    ) -> Device:
        """
        Criar dispositivo associado a um usuário

        Args:
            db: Database session
            obj_in: DeviceCreate schema
            user_id: UUID do usuário dono

        Returns:
            Device criado
        """
        obj_in_data = obj_in.model_dump()
        db_obj = Device(**obj_in_data, user_id=user_id)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update_status(
            self,
            db: Session,
            *,
            device_id: UUID,
            status: DeviceStatus,
            is_on: Optional[bool] = None
    ) -> Optional[Device]:
        """
        Atualizar status e estado de um dispositivo

        Args:
            db: Database session
            device_id: UUID do dispositivo
            status: Novo status (online/offline)
            is_on: Estado ligado/desligado (opcional)

        Returns:
            Device atualizado ou None
        """
        device = db.query(Device).filter(Device.id == device_id).first()

        if device:
            device.status = status
            if is_on is not None:
                device.is_on = is_on

            db.add(device)
            db.commit()
            db.refresh(device)

        return device

    def get_user_device(
            self,
            db: Session,
            *,
            device_id: UUID,
            user_id: UUID
    ) -> Optional[Device]:
        """
        Buscar dispositivo específico de um usuário
        Garante que o device pertence ao usuário

        Args:
            db: Database session
            device_id: UUID do dispositivo
            user_id: UUID do usuário

        Returns:
            Device ou None
        """
        return (
            db.query(Device)
            .filter(
                Device.id == device_id,
                Device.user_id == user_id
            )
            .first()
        )


# Instância global do CRUD
crud_device = CRUDDevice(Device)