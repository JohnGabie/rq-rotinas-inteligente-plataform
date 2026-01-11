"""
Custom UUID Type for SQLAlchemy
Compatível com PostgreSQL (produção) e SQLite (testes)
"""
from sqlalchemy import TypeDecorator, String
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
import uuid


class GUID(TypeDecorator):
    """
    Platform-independent GUID type.

    Uses PostgreSQL's UUID type when available,
    otherwise uses String(36) for SQLite and other databases.
    """

    impl = String(36)
    cache_ok = True

    def load_dialect_impl(self, dialect):
        """Choose the appropriate type based on the database dialect"""
        if dialect.name == 'postgresql':
            return dialect.type_descriptor(PG_UUID(as_uuid=True))
        else:
            return dialect.type_descriptor(String(36))

    def process_bind_param(self, value, dialect):
        """Convert Python UUID to database format"""
        if value is None:
            return value
        elif dialect.name == 'postgresql':
            return value
        else:
            # For SQLite and others, store as string
            if isinstance(value, uuid.UUID):
                return str(value)
            else:
                try:
                    return str(uuid.UUID(value))
                except (ValueError, AttributeError):
                    return str(value)

    def process_result_value(self, value, dialect):
        """Convert database value back to Python UUID"""
        if value is None:
            return value
        if isinstance(value, uuid.UUID):
            return value
        else:
            try:
                return uuid.UUID(value)
            except (ValueError, AttributeError, TypeError):
                return value