"""
Activity Log Endpoints - Histórico de atividades
"""
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.crud.activity_log import crud_activity_log
from app.schemas.activity_log import ActivityLogResponse
from app.schemas.common import ApiResponse, PaginatedResponse

router = APIRouter(prefix="/activities", tags=["Activity Logs"])


@router.get("", response_model=ApiResponse[PaginatedResponse[ActivityLogResponse]])
def list_activities(
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user),
        skip: int = 0,
        limit: int = 50
):
    """
    Listar logs de atividade do usuário

    **Query Parameters:**
    - skip: Offset para paginação (default: 0)
    - limit: Quantidade máxima (default: 50, max: 100)

    **Returns:**
    - Lista de logs ordenados por mais recente primeiro
    - Total de logs do usuário
    """
    # Limitar máximo de 100
    limit = min(limit, 100)

    # Buscar logs
    logs = crud_activity_log.get_by_user(
        db,
        user_id=current_user.id,
        skip=skip,
        limit=limit
    )

    # Contar total
    total = crud_activity_log.get_count_by_user(
        db,
        user_id=current_user.id
    )

    # Converter para response com timestamp
    log_responses = [
        ActivityLogResponse.from_orm_with_timestamp(log)
        for log in logs
    ]

    paginated = PaginatedResponse(
        items=log_responses,
        total=total,
        limit=limit,
        offset=skip
    )

    return ApiResponse(
        success=True,
        data=paginated
    )


@router.delete("", response_model=ApiResponse[None])
def clear_activities(
        keep_last: int = 0,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """
    Limpar logs de atividade do usuário.

    - keep_last=0 (padrão): remove TODOS os logs — é o que o botão "Limpar" faz.
    - keep_last=N: poda os antigos, preservando os N mais recentes.

    Antes o endpoint forçava keep_last=100, então "Limpar" nunca limpava de fato.
    """
    deleted = crud_activity_log.delete_old_logs(
        db,
        user_id=current_user.id,
        keep_last=keep_last
    )

    return ApiResponse(
        success=True,
        message=f"{deleted} log(s) removido(s)"
    )