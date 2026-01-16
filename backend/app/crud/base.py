"""
Base CRUD - Operações genéricas de banco de dados
Repository Pattern para reutilização
"""
from typing import Generic, TypeVar, Type, Optional, List
from pydantic import BaseModel
from sqlalchemy.orm import Session
from uuid import UUID

from app.models.base import BaseModel as DBBaseModel

ModelType = TypeVar("ModelType", bound=DBBaseModel)
CreateSchemaType = TypeVar("CreateSchemaType", bound=BaseModel)
UpdateSchemaType = TypeVar("UpdateSchemaType", bound=BaseModel)


class CRUDBase(Generic[ModelType, CreateSchemaType, UpdateSchemaType]):
    """
    CRUD genérico com operações básicas de banco

    Example:
        class CRUDUser(CRUDBase[User, UserCreate, UserUpdate]):
            pass
    """

    def __init__(self, model: Type[ModelType]):
        """
        Args:
            model: SQLAlchemy model class
        """
        self.model = model

    def get(self, db: Session, id: UUID) -> Optional[ModelType]:
        """
        Buscar por ID

        Args:
            db: Database session
            id: UUID do registro

        Returns:
            Model instance ou None
        """
        return db.query(self.model).filter(self.model.id == id).first()

    def get_multi(
            self,
            db: Session,
            *,
            skip: int = 0,
            limit: int = 100
    ) -> List[ModelType]:
        """
        Buscar múltiplos registros com paginação

        Args:
            db: Database session
            skip: Offset
            limit: Quantidade máxima

        Returns:
            Lista de model instances
        """
        return db.query(self.model).offset(skip).limit(limit).all()

    def create(self, db: Session, *, obj_in: CreateSchemaType) -> ModelType:
        """
        Criar novo registro

        Args:
            db: Database session
            obj_in: Pydantic schema com dados

        Returns:
            Model instance criado
        """
        obj_in_data = obj_in.model_dump()
        db_obj = self.model(**obj_in_data)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(
            self,
            db: Session,
            *,
            db_obj: ModelType,
            obj_in: UpdateSchemaType | dict
    ) -> ModelType:
        """
        Atualizar registro existente

        Args:
            db: Database session
            db_obj: Model instance do banco
            obj_in: Schema ou dict com campos a atualizar

        Returns:
            Model instance atualizado
        """
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.model_dump(exclude_unset=True)

        for field, value in update_data.items():
            if hasattr(db_obj, field):
                setattr(db_obj, field, value)

        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def delete(self, db: Session, *, id: UUID) -> Optional[ModelType]:
        """
        Deletar registro

        Args:
            db: Database session
            id: UUID do registro

        Returns:
            Model instance deletado ou None
        """
        obj = db.query(self.model).filter(self.model.id == id).first()
        if obj:
            db.delete(obj)
            db.commit()
        return obj