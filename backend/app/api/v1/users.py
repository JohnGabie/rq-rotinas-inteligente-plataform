"""
Users Endpoints - CRUD admin-only para gerenciamento de usuários
"""
from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_active_admin
from app.crud.user import crud_user
from app.schemas.user import UserCreate, UserUpdate, UserResponse, UserPasswordReset
from app.schemas.common import ApiResponse
from app.models.user import User

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("", response_model=ApiResponse[List[UserResponse]])
def list_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_active_admin),
):
    """Listar todos os usuários (admin-only)"""
    users = crud_user.get_multi(db, skip=skip, limit=limit)
    return ApiResponse(
        success=True,
        data=[UserResponse.model_validate(u) for u in users],
    )


@router.get("/{user_id}", response_model=ApiResponse[UserResponse])
def get_user(
    user_id: UUID,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_active_admin),
):
    """Detalhe de um usuário (admin-only)"""
    user = crud_user.get(db, id=user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado",
        )
    return ApiResponse(
        success=True,
        data=UserResponse.model_validate(user),
    )


@router.post("", response_model=ApiResponse[UserResponse], status_code=status.HTTP_201_CREATED)
def create_user(
    user_in: UserCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_active_admin),
):
    """Criar novo usuário (admin-only)"""
    existing = crud_user.get_by_email(db, email=user_in.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email já está em uso",
        )
    user = crud_user.create(db, obj_in=user_in)
    return ApiResponse(
        success=True,
        data=UserResponse.model_validate(user),
        message="Usuário criado com sucesso",
    )


@router.put("/{user_id}", response_model=ApiResponse[UserResponse])
def update_user(
    user_id: UUID,
    user_in: UserUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_active_admin),
):
    """Atualizar usuário (admin-only)"""
    user = crud_user.get(db, id=user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado",
        )
    if user_in.email:
        existing = crud_user.get_by_email(db, email=user_in.email)
        if existing and existing.id != user_id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email já está em uso",
            )
    updated = crud_user.update(db, db_obj=user, obj_in=user_in)
    return ApiResponse(
        success=True,
        data=UserResponse.model_validate(updated),
        message="Usuário atualizado com sucesso",
    )


@router.put("/{user_id}/password", response_model=ApiResponse[UserResponse])
def reset_user_password(
    user_id: UUID,
    body: UserPasswordReset,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_active_admin),
):
    """Forçar troca de senha de um usuário (admin-only)"""
    user = crud_user.get(db, id=user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado",
        )
    updated = crud_user.update_password(db, user=user, new_password=body.new_password)
    return ApiResponse(
        success=True,
        data=UserResponse.model_validate(updated),
        message="Senha alterada com sucesso",
    )


@router.delete("/{user_id}", response_model=ApiResponse[UserResponse])
def delete_user(
    user_id: UUID,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_active_admin),
):
    """Deletar usuário (admin-only)"""
    if user_id == admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Não é possível deletar a si mesmo",
        )
    user = crud_user.delete(db, id=user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado",
        )
    return ApiResponse(
        success=True,
        data=UserResponse.model_validate(user),
        message="Usuário deletado com sucesso",
    )
