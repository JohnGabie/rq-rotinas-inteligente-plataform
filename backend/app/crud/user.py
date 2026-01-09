"""
CRUD User - Operações específicas de usuário
"""
from typing import Optional
from sqlalchemy.orm import Session
from backend.app.crud.base import CRUDBase
from backend.app.models.user import User
from backend.app.schemas.user import UserCreate, UserUpdate
from backend.app.core.security import hash_password, verify_password


class CRUDUser(CRUDBase[User, UserCreate, UserUpdate]):
    """CRUD operations for User"""

    def get_by_email(self, db: Session, *, email: str) -> Optional[User]:
        """
        Buscar usuário por email

        Args:
            db: Database session
            email: Email do usuário

        Returns:
            User ou None
        """
        return db.query(User).filter(User.email == email).first()

    def create(self, db: Session, *, obj_in: UserCreate) -> User:
        """
        Criar usuário com senha hasheada

        Args:
            db: Database session
            obj_in: UserCreate schema

        Returns:
            User criado
        """
        db_obj = User(
            email=obj_in.email,
            name=obj_in.name,
            password_hash=hash_password(obj_in.password),
            role=obj_in.role
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def authenticate(
            self,
            db: Session,
            *,
            email: str,
            password: str
    ) -> Optional[User]:
        """
        Autenticar usuário (verifica email e senha)

        Args:
            db: Database session
            email: Email do usuário
            password: Senha em texto plano

        Returns:
            User se credenciais válidas, None caso contrário
        """
        user = self.get_by_email(db, email=email)

        if not user:
            return None

        if not verify_password(password, user.password_hash):
            return None

        return user

    def is_active(self, user: User) -> bool:
        """Verifica se usuário está ativo"""
        return user.is_active


# Instância global do CRUD
crud_user = CRUDUser(User)