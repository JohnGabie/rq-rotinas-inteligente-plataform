"""
Device Model - Dispositivos IoT (Tuya e SNMP)
Corrigido para compatibilidade SQLite (Testes) e PostgreSQL (Produção)
"""
from sqlalchemy import Column, String, Boolean, Integer, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship

# Importamos os tipos customizados e o BaseModel
from backend.app.models.base import BaseModel, GUID, IPAddress
from backend.app.models.enums import DeviceType, DeviceStatus, DeviceIcon


class Device(BaseModel):
    """
    Modelo de dispositivo IoT
    Suporta: Tuya (tomadas inteligentes) e SNMP (réguas de tomadas)
    """
    __tablename__ = "devices"

    # CORREÇÃO 1: user_id usa GUID() em vez de UUID nativo
    user_id = Column(
        GUID(),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    name = Column(String(255), nullable=False)
    type = Column(SQLEnum(DeviceType), nullable=False, index=True)
    icon = Column(SQLEnum(DeviceIcon), default=DeviceIcon.PLUG, nullable=False)
    is_on = Column(Boolean, default=False, nullable=False)
    status = Column(SQLEnum(DeviceStatus), default=DeviceStatus.OFFLINE, nullable=False, index=True)

    # Campos específicos do Tuya
    device_id = Column(String(255), nullable=True)
    local_key = Column(String(255), nullable=True)

    # CORREÇÃO 2: ip usa IPAddress() em vez de INET nativo
    ip = Column(IPAddress(), nullable=True)

    community_string = Column(String(255), nullable=True)
    port = Column(Integer, default=161, nullable=True)
    snmp_base_oid = Column(String(255), nullable=True)
    snmp_outlet_number = Column(Integer, nullable=True)

    # Relacionamentos
    user = relationship("User", back_populates="devices")

    routine_actions = relationship(
        "RoutineAction",
        back_populates="device",
        cascade="all, delete-orphan"
    )

    activity_logs = relationship(
        "ActivityLog",
        back_populates="device",
        foreign_keys="[ActivityLog.device_id]"
    )

    triggered_routines = relationship(
        "Routine",
        back_populates="trigger_device",
        foreign_keys="[Routine.trigger_device_id]"
    )

    def __repr__(self):
        return f"<Device(name={self.name}, type={self.type}, status={self.status})>"

    @property
    def is_tuya(self) -> bool:
        return self.type == DeviceType.TUYA

    @property
    def is_snmp(self) -> bool:
        return self.type == DeviceType.SNMP

    def validate_tuya_fields(self) -> bool:
        if self.is_tuya:
            return bool(self.device_id and self.local_key)
        return True

    def validate_snmp_fields(self) -> bool:
        if self.is_snmp:
            return bool(
                self.ip
                and self.community_string
                and self.snmp_base_oid
                and self.snmp_outlet_number
            )
        return True