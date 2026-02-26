"""
Routine Endpoints - CRUD + Execute
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.enums import ActivityType
from app.crud.routine import crud_routine
from app.services.routine_service import routine_service
from app.services.scheduler_service import scheduler_service
from app.models.enums import TriggerType
from app.schemas.routine import (
    RoutineCreate,
    RoutineUpdate,
    RoutineResponse,
    RoutineToggle,
    RoutineExecuteResponse
)
from app.schemas.common import ApiResponse
from app.websocket.manager import manager, broadcast_event_sync

router = APIRouter(prefix="/routines", tags=["Routines"])


@router.get("", response_model=ApiResponse[List[RoutineResponse]])
def list_routines(
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user),
        skip: int = 0,
        limit: int = 100
):
    """
    Listar todas as rotinas do usuário autenticado

    **Query Parameters:**
    - skip: Offset para paginação
    - limit: Quantidade máxima
    """
    routines = crud_routine.get_multi(
        db,
        skip=skip,
        limit=limit
    )

    return ApiResponse(
        success=True,
        data=[RoutineResponse.model_validate(r) for r in routines]
    )


@router.post("", response_model=ApiResponse[RoutineResponse], status_code=status.HTTP_201_CREATED)
def create_routine(
        routine_in: RoutineCreate,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """
    Criar nova rotina

    **Tipos de Gatilho:**
    - `time`: Horário agendado (requer trigger_time e week_days)
    - `manual`: Execução manual (sem campos extras)
    - `routine_complete`: Após outra rotina (requer trigger_routine_id)
    - `device_state`: Mudança de estado (requer trigger_device_id e trigger_device_state)

    **Ações:**
    - Cada ação tem: device_id, turn_on, order, delay
    - Se todos delays = 0: execução simultânea
    - Se algum delay > 0: execução sequencial
    """
    routine = crud_routine.create_with_user(
        db,
        obj_in=routine_in,
        user_id=current_user.id
    )

    # Criar log
    routine_service.create_routine_log(
        db,
        user_id=current_user.id,
        routine_id=routine.id,
        routine_name=routine.name,
        activity_type=ActivityType.ROUTINE_CREATED,
        title="Nova rotina criada",
        description=f'"{routine.name}" foi criada com {len(routine.actions)} ação(ões)'
    )

    # Se for rotina de horário, agendar no scheduler
    if routine.trigger_type == TriggerType.TIME and routine.is_active:
        scheduler_service.schedule_routine(
            str(routine.id),
            routine.trigger_time,
            routine.week_days
        )

    # Broadcast evento WebSocket
    broadcast_event_sync("routine_created", {
        "routine_id": str(routine.id),
        "name": routine.name
    })

    return ApiResponse(
        success=True,
        data=RoutineResponse.model_validate(routine),
        message="Rotina criada com sucesso"
    )


@router.get("/{routine_id}", response_model=ApiResponse[RoutineResponse])
def get_routine(
        routine_id: UUID,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Obter detalhes de uma rotina específica"""
    routine = crud_routine.get(db, id=routine_id)

    if not routine:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rotina não encontrada"
        )

    return ApiResponse(
        success=True,
        data=RoutineResponse.model_validate(routine)
    )


@router.put("/{routine_id}", response_model=ApiResponse[RoutineResponse])
def update_routine(
        routine_id: UUID,
        routine_in: RoutineUpdate,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Atualizar rotina"""
    routine = crud_routine.get(db, id=routine_id)

    if not routine:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rotina não encontrada"
        )

    # Guardar trigger_type antigo para comparação
    old_trigger_type = routine.trigger_type

    routine = crud_routine.update_routine(db, routine=routine, obj_in=routine_in)

    # Criar log
    routine_service.create_routine_log(
        db,
        user_id=current_user.id,
        routine_id=routine.id,
        routine_name=routine.name,
        activity_type=ActivityType.ROUTINE_UPDATED,
        title="Rotina atualizada",
        description=f'"{routine.name}" foi atualizada'
    )

    # Sincronizar scheduler após update
    if routine.is_active:
        if routine.trigger_type == TriggerType.TIME:
            # Agendar/re-agendar rotina
            scheduler_service.schedule_routine(
                str(routine.id),
                routine.trigger_time,
                routine.week_days
            )
        elif old_trigger_type == TriggerType.TIME:
            # Mudou de TIME para outro tipo, remover do scheduler
            scheduler_service.unschedule_routine(str(routine.id))
    else:
        # Rotina inativa, garantir que não está no scheduler
        scheduler_service.unschedule_routine(str(routine.id))

    # Broadcast evento WebSocket
    broadcast_event_sync("routine_updated", {
        "routine_id": str(routine.id),
        "name": routine.name
    })

    return ApiResponse(
        success=True,
        data=RoutineResponse.model_validate(routine),
        message="Rotina atualizada com sucesso"
    )


@router.delete("/{routine_id}", response_model=ApiResponse[None])
def delete_routine(
        routine_id: UUID,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Deletar rotina"""
    routine = crud_routine.get(db, id=routine_id)

    if not routine:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rotina não encontrada"
        )

    routine_name = routine.name

    # Remover do scheduler se for rotina de horário
    if routine.trigger_type == TriggerType.TIME:
        scheduler_service.unschedule_routine(str(routine.id))

    crud_routine.delete(db, id=routine_id)

    # Criar log (routine_id=None pois rotina já foi deletada)
    routine_service.create_routine_log(
        db,
        user_id=current_user.id,
        routine_id=None,
        routine_name=routine_name,
        activity_type=ActivityType.ROUTINE_DELETED,
        title="Rotina removida",
        description=f'"{routine_name}" foi removida'
    )

    # Broadcast evento WebSocket
    broadcast_event_sync("routine_deleted", {
        "routine_id": str(routine_id),
        "name": routine_name
    })

    return ApiResponse(
        success=True,
        message="Rotina removida com sucesso"
    )


@router.patch("/{routine_id}/toggle", response_model=ApiResponse[RoutineResponse])
def toggle_routine(
        routine_id: UUID,
        toggle_data: RoutineToggle,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """
    Ativar/desativar rotina (transacional)

    **Request Body:**
    - is_active: true = ativar, false = desativar

    **Comportamento:**
    1. Valida rotina existe
    2. Atualiza no banco (commit)
    3. Verifica estado persistido
    4. Sincroniza scheduler baseado no estado do banco
    """
    # 1. Buscar rotina
    routine = crud_routine.get(db, id=routine_id)

    if not routine:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rotina não encontrada"
        )

    # Guardar dados para scheduler
    routine_trigger_type = routine.trigger_type
    routine_trigger_time = routine.trigger_time
    routine_week_days = routine.week_days
    routine_name = routine.name

    # 2. Persistir no banco com transação explícita
    try:
        routine.is_active = toggle_data.is_active
        db.add(routine)
        db.commit()
        db.refresh(routine)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao salvar no banco de dados: {str(e)}"
        )

    # 3. Verificar estado REAL persistido no banco
    db.refresh(routine)  # Garantir dados frescos
    persisted_state = routine.is_active

    # Validar que o estado foi salvo corretamente
    if persisted_state != toggle_data.is_active:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Estado não foi persistido corretamente no banco"
        )

    # 4. Criar log (após confirmação do banco)
    try:
        activity_type = ActivityType.ROUTINE_ACTIVATED if persisted_state else ActivityType.ROUTINE_DEACTIVATED
        routine_service.create_routine_log(
            db,
            user_id=current_user.id,
            routine_id=routine.id,
            routine_name=routine_name,
            activity_type=activity_type,
            title="Rotina ativada" if persisted_state else "Rotina desativada",
            description=f'"{routine_name}" foi {"ativada" if persisted_state else "desativada"}'
        )
    except Exception as e:
        # Log falhou mas estado foi salvo - não reverter, apenas logar erro
        import logging
        logging.getLogger(__name__).error(f"Erro ao criar log de atividade: {e}")

    # 5. Sincronizar scheduler APENAS após banco confirmar
    # Usa o estado PERSISTIDO, não o do request
    if routine_trigger_type == TriggerType.TIME:
        if persisted_state:
            scheduler_service.schedule_routine(
                str(routine.id),
                routine_trigger_time,
                routine_week_days
            )
        else:
            scheduler_service.unschedule_routine(str(routine.id))

    # 6. Broadcast evento WebSocket
    broadcast_event_sync("routine_toggled", {
        "routine_id": str(routine.id),
        "is_active": persisted_state,
        "name": routine_name
    })

    return ApiResponse(
        success=True,
        data=RoutineResponse.model_validate(routine),
        message=f"Rotina {'ativada' if persisted_state else 'desativada'} com sucesso"
    )


@router.post("/{routine_id}/execute", response_model=ApiResponse[RoutineExecuteResponse])
async def execute_routine(
        routine_id: UUID,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """
    Executar rotina manualmente

    **Comportamento:**
    - Se todas ações tem delay = 0: execução simultânea
    - Se alguma ação tem delay > 0: execução sequencial com delays

    **Returns:**
    - Detalhes da execução (ações executadas, tempo, resultados)
    """
    success, result_data = await routine_service.execute_routine(
        db,
        routine_id=routine_id,
        user_id=current_user.id
    )

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=result_data.get("error", "Erro ao executar rotina")
        )

    # Broadcast evento WebSocket
    await manager.broadcast_event("routine_executed", {
        "routine_id": str(routine_id),
        "executed_actions": result_data.get("executed_actions", 0),
        "execution_time_ms": result_data.get("execution_time_ms", 0)
    })

    return ApiResponse(
        success=True,
        data=RoutineExecuteResponse(**result_data),
        message="Rotina executada com sucesso"
    )