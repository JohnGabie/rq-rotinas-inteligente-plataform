"""
API Dependencies - Injeção de dependências para endpoints
"""
from typing import Generator
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from uuid import UUID

from backend.app.core.database import SessionLocal
from backend.app.core.security import decode_access_token
from backend.app.crud.user import crud_user
from backend.app.models.user import User

# Security scheme para Swagger UI
security = HTTPBearer()


def get_db() -> Generator:
    """
    Dependency que fornece sessão do banco
    Fecha automaticamente após o request

    Usage:
        @app.get("/items")
        def get_items(db: Session = Depends(get_db)):
            return db.query(Item).all()
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


async def get_current_user(
        db: Session = Depends(get_db),
        credentials: HTTPAuthorizationCredentials = Depends(security)
) -> User:
    """
    Dependency que retorna o usuário autenticado
    Valida JWT token do header Authorization

    Usage:
        @app.get("/me")
        def get_me(current_user: User = Depends(get_current_user)):
            return current_user

    Raises:
        HTTPException 401: Token inválido ou expirado
        HTTPException 404: Usuário não encontrado
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token inválido ou expirado",
        headers={"WWW-Authenticate": "Bearer"},
    )

    # Extrair token do header
    token = credentials.credentials

    # Decodificar token
    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception

    # Extrair user_id do payload
    user_id_str: str = payload.get("sub")
    if user_id_str is None:
        raise credentials_exception

    try:
        user_id = UUID(user_id_str)
    except ValueError:
        raise credentials_exception

    # Buscar usuário no banco
    user = crud_user.get(db, id=user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado"
        )

    # Verificar se está ativo
    if not crud_user.is_active(user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuário inativo"
        )

    return user


async def get_current_active_admin(
        current_user: User = Depends(get_current_user)
) -> User:
    """
    Dependency que garante que o usuário é admin

    Usage:
        @app.delete("/users/{id}")
        def delete_user(
            id: UUID,
            admin: User = Depends(get_current_active_admin)
        ):
            # Apenas admins podem acessar

    Raises:
        HTTPException 403: Usuário não é admin
    """
    from backend.app.models.enums import UserRole

    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Privilégios de administrador necessários"
        )

    return current_user