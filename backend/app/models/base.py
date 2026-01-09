"""
Base Model com campos comuns (id, timestamps)
Todos os models herdam desta classe
"""
from sqlalchemy import Column, String, DateTime
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid
from backend.app.core.database import Base


class BaseModel(Base):
    """
    Classe base abstrata para todos os models
    Fornece: id UUID, created_at, updated_at
    """
    __abstract__ = True

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        unique=True,
        nullable=False,
        index=True
    )

    created_at = Column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        nullable=False
    )

    updated_at = Column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )

    def __repr__(self):
        """Representação string do objeto"""
        return f"<{self.__class__.__name__}(id={self.id})>"