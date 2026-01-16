"""
Device Endpoints - CRUD + Toggle + Sync
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from datetime import datetime

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.crud.device import crud_device
from app.services.device_service import device_service
from app.schemas.device import (
    DeviceCreate,
    DeviceUpdate,
    DeviceResponse,
    DeviceToggle,
    DeviceToggleResponse,
    DeviceToggleAllResponse
)
from app.schemas.common import ApiResponse

router = APIRouter(prefix="/devices", tags=["Devices"])


@router.get("", response_model=ApiResponse[List[DeviceResponse]])
def list_devices(
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user),
        skip: int = 0,
        limit: int = 100
):
    """
    Listar todos os dispositivos do usuário autenticado

    **Query Parameters:**
    - skip: Offset para paginação (default: 0)
    - limit: Quantidade máxima (default: 100)

    **Returns:**
    - Lista de dispositivos
    """
    devices = crud_device.get_by_user(
        db,
        user_id=current_user.id,
        skip=skip,
        limit=limit
    )

    return ApiResponse(
        success=True,
        data=[DeviceResponse.model_validate(d) for d in devices]
    )


@router.post("", response_model=ApiResponse[DeviceResponse], status_code=status.HTTP_201_CREATED)
def create_device(
        device_in: DeviceCreate,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """
    Criar novo dispositivo

    **Request Body:**
    - Dispositivo Tuya: requer `device_id` e `local_key`
    - Dispositivo SNMP: requer `ip`, `community_string`, `snmp_base_oid`, `snmp_outlet_number`

    **Returns:**
    - Dispositivo criado (status inicial: OFFLINE)
    """
    device = crud_device.create_with_user(
        db,
        obj_in=device_in,
        user_id=current_user.id
    )

    # Verificar health inicial em background (não bloqueia response)
    # TODO: Implementar com background task

    return ApiResponse(
        success=True,
        data=DeviceResponse.model_validate(device),
        message="Dispositivo criado com sucesso"
    )


@router.get("/{device_id}", response_model=ApiResponse[DeviceResponse])
def get_device(
        device_id: UUID,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """
    Obter detalhes de um dispositivo específico

    **Path Parameters:**
    - device_id: UUID do dispositivo

    **Returns:**
    - Dados do dispositivo

    **Errors:**
    - 404: Dispositivo não encontrado
    """
    device = crud_device.get_user_device(
        db,
        device_id=device_id,
        user_id=current_user.id
    )

    if not device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dispositivo não encontrado"
        )

    return ApiResponse(
        success=True,
        data=DeviceResponse.model_validate(device)
    )


@router.put("/{device_id}", response_model=ApiResponse[DeviceResponse])
def update_device(
        device_id: UUID,
        device_in: DeviceUpdate,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """
    Atualizar dispositivo

    **Path Parameters:**
    - device_id: UUID do dispositivo

    **Request Body:**
    - Campos a atualizar (apenas os fornecidos serão atualizados)

    **Returns:**
    - Dispositivo atualizado

    **Errors:**
    - 404: Dispositivo não encontrado
    """
    device = crud_device.get_user_device(
        db,
        device_id=device_id,
        user_id=current_user.id
    )

    if not device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dispositivo não encontrado"
        )

    device = crud_device.update(db, db_obj=device, obj_in=device_in)

    return ApiResponse(
        success=True,
        data=DeviceResponse.model_validate(device),
        message="Dispositivo atualizado com sucesso"
    )


@router.delete("/{device_id}", response_model=ApiResponse[None])
def delete_device(
        device_id: UUID,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """
    Deletar dispositivo

    **Path Parameters:**
    - device_id: UUID do dispositivo

    **Returns:**
    - Mensagem de sucesso

    **Errors:**
    - 404: Dispositivo não encontrado
    """
    device = crud_device.get_user_device(
        db,
        device_id=device_id,
        user_id=current_user.id
    )

    if not device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dispositivo não encontrado"
        )

    crud_device.delete(db, id=device_id)

    return ApiResponse(
        success=True,
        message="Dispositivo removido com sucesso"
    )


@router.post("/{device_id}/toggle", response_model=ApiResponse[DeviceToggleResponse])
def toggle_device(
        device_id: UUID,
        toggle_data: DeviceToggle,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """
    Ligar/desligar dispositivo

    **Path Parameters:**
    - device_id: UUID do dispositivo

    **Request Body:**
    - state: true = ligar, false = desligar

    **Returns:**
    - Estado novo do dispositivo

    **Errors:**
    - 404: Dispositivo não encontrado
    - 503: Dispositivo offline ou erro ao executar
    """
    success, error_msg = device_service.toggle_device(
        db,
        device_id=device_id,
        user_id=current_user.id,
        state=toggle_data.state
    )

    if not success:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=error_msg or "Erro ao alternar dispositivo"
        )

    return ApiResponse(
        success=True,
        data=DeviceToggleResponse(
            device_id=device_id,
            new_state=toggle_data.state,
            executed_at=datetime.utcnow()
        )
    )


@router.post("/toggle-all", response_model=ApiResponse[DeviceToggleAllResponse])
def toggle_all_devices(
        toggle_data: DeviceToggle,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """
    Ligar/desligar todos os dispositivos online (Master Switch)

    **Request Body:**
    - state: true = ligar todos, false = desligar todos

    **Returns:**
    - Quantidade de dispositivos alternados e falhas
    """
    toggled, failed, failed_ids = device_service.toggle_all_devices(
        db,
        user_id=current_user.id,
        state=toggle_data.state
    )

    return ApiResponse(
        success=True,
        data=DeviceToggleAllResponse(
            toggled_count=toggled,
            failed_count=failed,
            new_state=toggle_data.state,
            failed_devices=failed_ids
        ),
        message=f"{toggled} dispositivo(s) alternado(s)"
    )


@router.post("/{device_id}/sync", response_model=ApiResponse[DeviceResponse])
def sync_device_state(
        device_id: UUID,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """
    Sincronizar estado do banco com hardware real

    **Path Parameters:**
    - device_id: UUID do dispositivo

    **Returns:**
    - Dispositivo com estado atualizado

    **Errors:**
    - 404: Dispositivo não encontrado
    - 503: Não foi possível sincronizar
    """
    device = crud_device.get_user_device(
        db,
        device_id=device_id,
        user_id=current_user.id
    )

    if not device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dispositivo não encontrado"
        )

    real_state = device_service.sync_device_state(db, device_id=device_id)

    if real_state is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Não foi possível sincronizar com o dispositivo"
        )

    # Buscar device atualizado
    device = crud_device.get(db, id=device_id)

    return ApiResponse(
        success=True,
        data=DeviceResponse.model_validate(device),
        message="Estado sincronizado com sucesso"
    )