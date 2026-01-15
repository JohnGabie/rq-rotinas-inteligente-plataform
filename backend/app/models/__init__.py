"""
Models package - Importa todos os models para o Alembic detectar
IMPORTANTE: Manter essa ordem para evitar problemas de dependência circular
"""
from backend.app.models.base import BaseModel
from backend.app.models.enums import (
    DeviceType,
    DeviceStatus,
    DeviceIcon,
    TriggerType,
    WeekDay,
    TriggerDeviceState,
    ActivityType,
    UserRole
)
from backend.app.models.user import User
from backend.app.models.device import Device
from backend.app.models.routine import Routine, RoutineAction
from backend.app.models.activity_log import ActivityLog

__all__ = [
    "BaseModel",
    "DeviceType",
    "DeviceStatus",
    "DeviceIcon",
    "TriggerType",
    "WeekDay",
    "TriggerDeviceState",
    "ActivityType",
    "UserRole",
    "User",
    "Device",
    "Routine",
    "RoutineAction",
    "ActivityLog",
]