"""
Routine & RoutineAction Models - Rotinas automatizadas
"""
import uuid
from sqlalchemy import Column, String, Boolean, Integer, Time, ForeignKey, Enum as SQLEnum, DateTime, JSON
from sqlalchemy.dialects.postgresql import ARRAY, UUID as PG_UUID
from sqlalchemy.orm import relationship
from backend.app.models.base import BaseModel, GUID # Importando nosso GUID customizado
from backend.app.models.enums import TriggerType, WeekDay, TriggerDeviceState

class Routine(BaseModel):
    """
    Modelo de rotina automatizada
    """
    __tablename__ = "routines"

    # CORREÇÃO: user_id usando GUID()
    user_id = Column(GUID(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=False, nullable=False, index=True)
    trigger_type = Column(SQLEnum(TriggerType), nullable=False, index=True)

    # Gatilho: Horário agendado
    trigger_time = Column(Time, nullable=True)

    # CORREÇÃO: ARRAY não existe no SQLite.
    # Usamos JSON com um variant para manter ARRAY no Postgres (Produção)
    week_days = Column(
        JSON().with_variant(ARRAY(SQLEnum(WeekDay)), "postgresql"),
        default=[],
        nullable=False
    )

    # CORREÇÃO: trigger_routine_id usando GUID()
    trigger_routine_id = Column(
        GUID(),
        ForeignKey("routines.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )

    # CORREÇÃO: trigger_device_id usando GUID()
    trigger_device_id = Column(
        GUID(),
        ForeignKey("devices.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )

    trigger_device_state = Column(SQLEnum(TriggerDeviceState), nullable=True)
    trigger_cooldown_minutes = Column(Integer, default=0, nullable=False)
    last_executed_at = Column(DateTime(timezone=True), nullable=True)

    # Relacionamentos
    user = relationship("User", back_populates="routines")
    actions = relationship(
        "RoutineAction",
        back_populates="routine",
        cascade="all, delete-orphan",
        order_by="RoutineAction.order"
    )

    trigger_routine = relationship(
        "Routine",
        remote_side="Routine.id",
        foreign_keys=[trigger_routine_id],
        uselist=False,
        post_update=True
    )

    triggered_by_this = relationship(
        "Routine",
        remote_side="Routine.trigger_routine_id",
        foreign_keys="Routine.trigger_routine_id",
        uselist=True,
        overlaps="trigger_routine"
    )

    trigger_device = relationship(
        "Device",
        back_populates="triggered_routines",
        foreign_keys=[trigger_device_id]
    )

    activity_logs = relationship(
        "ActivityLog",
        back_populates="routine",
        foreign_keys="[ActivityLog.routine_id]"
    )

    def __repr__(self):
        return f"<Routine(name={self.name}, type={self.trigger_type}, active={self.is_active})>"


class RoutineAction(BaseModel):
    """
    Ação individual de uma rotina
    """
    __tablename__ = "routine_actions"

    # CORREÇÃO: routine_id usando GUID()
    routine_id = Column(
        GUID(),
        ForeignKey("routines.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    # CORREÇÃO: device_id usando GUID()
    device_id = Column(
        GUID(),
        ForeignKey("devices.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    turn_on = Column(Boolean, nullable=False)
    order = Column(Integer, nullable=False, default=1)
    delay = Column(Integer, nullable=False, default=0)

    # Relacionamentos
    routine = relationship("Routine", back_populates="actions")
    device = relationship("Device", back_populates="routine_actions")

    def __repr__(self):
        return f"<RoutineAction(device={self.device_id}, turn_on={self.turn_on}, order={self.order})>"