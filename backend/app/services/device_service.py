"""
Device Service - Orquestra operações de dispositivos com hardware real
"""
from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from uuid import UUID

from app.models.device import Device
from app.models.enums import DeviceStatus, DeviceType
from app.crud.device import crud_device
from app.services.tuya_service import tuya_service
from app.services.snmp_service import snmp_service
from app.utils.logger import logger


class DeviceService:
    """
    Serviço de alto nível para dispositivos
    Orquestra CRUD + integração com hardware
    """

    def toggle_device(
            self,
            db: Session,
            *,
            device_id: UUID,
            state: bool
    ) -> Tuple[bool, Optional[str]]:
        """
        Alterna estado de um dispositivo (ligar/desligar)
        Chama o hardware real (Tuya ou SNMP)

        Args:
            db: Database session
            device_id: UUID do dispositivo
            state: True = ligar, False = desligar

        Returns:
            Tuple[success, error_message]
            - (True, None) se sucesso
            - (False, "mensagem de erro") se falha
        """
        # Buscar dispositivo
        device = crud_device.get(db, id=device_id)

        if not device:
            return False, "Dispositivo não encontrado"

        # Verificar se está online
        # if device.status == DeviceStatus.OFFLINE:
        #    return False, "Dispositivo offline"

        # Executar comando no hardware
        success = False

        try:
            if device.is_tuya:
                # Controle Tuya
                if state:
                    success = tuya_service.ligar(device.device_id)
                else:
                    success = tuya_service.desligar(device.device_id)

            elif device.is_snmp:
                # Controle SNMP
                if state:
                    success = snmp_service.ligar(
                        ip=str(device.ip),
                        porta=device.snmp_outlet_number,
                        community=device.community_string,
                        base_oid=device.snmp_base_oid
                    )
                else:
                    success = snmp_service.desligar(
                        ip=str(device.ip),
                        porta=device.snmp_outlet_number,
                        community=device.community_string,
                        base_oid=device.snmp_base_oid
                    )

            if success:
                # Atualizar estado no banco
                crud_device.update_status(
                    db,
                    device_id=device_id,
                    status=DeviceStatus.ONLINE,
                    is_on=state
                )
                return True, None
            else:
                return False, "Erro ao executar comando no dispositivo"

        except Exception as e:
            logger.error(f"Erro ao alternar device {device_id}: {e}")
            return False, str(e)

    def toggle_all_devices(
            self,
            db: Session,
            *,
            state: bool
    ) -> Tuple[int, int, List[UUID]]:
        """
        Alterna todos os dispositivos online

        Args:
            db: Database session
            state: True = ligar todos, False = desligar todos

        Returns:
            Tuple[toggled_count, failed_count, failed_device_ids]
        """
        # Buscar todos os dispositivos online
        devices = crud_device.get_all_online_devices(db)

        toggled = 0
        failed = 0
        failed_ids = []

        for device in devices:
            success, _ = self.toggle_device(
                db,
                device_id=device.id,
                state=state
            )

            if success:
                toggled += 1
            else:
                failed += 1
                failed_ids.append(device.id)

        return toggled, failed, failed_ids

    def check_device_health(
            self,
            db: Session,
            *,
            device_id: UUID
    ) -> DeviceStatus:
        """
        Verifica se dispositivo está acessível
        Atualiza status no banco

        Args:
            db: Database session
            device_id: UUID do dispositivo

        Returns:
            DeviceStatus (ONLINE ou OFFLINE)
        """
        device = crud_device.get(db, id=device_id)

        if not device:
            return DeviceStatus.OFFLINE

        is_online = False

        try:
            if device.is_tuya:
                # Verificar Tuya
                status = tuya_service.get_status(device.device_id)
                is_online = status is not None

            elif device.is_snmp:
                # Verificar SNMP
                is_online = snmp_service.check_connection(
                    ip=str(device.ip),
                    community=device.community_string
                )

            new_status = DeviceStatus.ONLINE if is_online else DeviceStatus.OFFLINE

            # Atualizar no banco
            crud_device.update_status(
                db,
                device_id=device_id,
                status=new_status
            )

            return new_status

        except Exception as e:
            logger.error(f"Erro ao verificar health do device {device_id}: {e}")
            crud_device.update_status(
                db,
                device_id=device_id,
                status=DeviceStatus.OFFLINE
            )
            return DeviceStatus.OFFLINE

    def sync_device_state(self, db: Session, *, device_id: UUID) -> Optional[bool]:
        """
        Sincroniza estado do banco com o hardware real

        Args:
            db: Database session
            device_id: UUID do dispositivo

        Returns:
            bool: Estado real do device (True=ON, False=OFF)
            None se erro
        """
        device = crud_device.get(db, id=device_id)

        if not device:
            return None

        try:
            real_state = None

            if device.is_tuya:
                real_state = tuya_service.get_status(device.device_id)

            elif device.is_snmp:
                real_state = snmp_service.get_status(
                    ip=str(device.ip),
                    porta=device.snmp_outlet_number,
                    community=device.community_string,
                    base_oid=device.snmp_base_oid
                )

            if real_state is not None:
                # Atualizar banco com estado real
                crud_device.update_status(
                    db,
                    device_id=device_id,
                    status=DeviceStatus.ONLINE,
                    is_on=real_state
                )
                return real_state
            else:
                # Hardware não respondeu
                crud_device.update_status(
                    db,
                    device_id=device_id,
                    status=DeviceStatus.OFFLINE
                )
                return None

        except Exception as e:
            logger.error(f"Erro ao sincronizar device {device_id}: {e}")
            return None


# Instância global
device_service = DeviceService()