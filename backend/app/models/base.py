import uuid
from sqlalchemy import Column, DateTime, func, String, TypeDecorator
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, INET as PG_INET
from backend.app.core.database import Base

# Tipo GUID: Usa UUID nativo no Postgres e String(36) no SQLite
class GUID(TypeDecorator):
    impl = String
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == 'postgresql':
            return dialect.type_descriptor(PG_UUID())
        else:
            return dialect.type_descriptor(String(36))

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        return str(value)

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        if not isinstance(value, uuid.UUID):
            return uuid.UUID(value)
        return value

# Tipo IPAddress: Usa INET no Postgres e String(45) no SQLite
class IPAddress(TypeDecorator):
    impl = String
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == 'postgresql':
            return dialect.type_descriptor(PG_INET())
        else:
            return dialect.type_descriptor(String(45))

class BaseModel(Base):
    """
    Base para todos os models do sistema
    Inclui ID (UUID) e timestamps automáticos
    """
    __abstract__ = True

    id = Column(
        GUID(),
        primary_key=True,
        default=uuid.uuid4,
        unique=True,
        nullable=False,
        index=True
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )