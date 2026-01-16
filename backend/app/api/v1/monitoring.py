"""
Monitoring Endpoints - Controle de monitoramento e scheduler
"""
from fastapi import APIRouter, Depends
from typing import List

from app.api.deps import get_current_user
from app.models.user import User
from app.services.monitoring_service import monitoring_service
from app.services.scheduler_service import scheduler_service
from app.schemas.common import ApiResponse

router = APIRouter(prefix="/monitoring", tags=["Monitoring"])


@router.get("/status", response_model=ApiResponse[dict])
def get_monitoring_status(
        current_user: User = Depends(get_current_user)
):
    """
    Obter status do serviço de monitoramento

    **Returns:**
    - is_running: Se está ativo
    - uptime_seconds: Tempo rodando
    - check_count: Quantidade de verificações
    - last_check: Timestamp da última verificação
    - check_interval_seconds: Intervalo entre verificações
    """
    status = monitoring_service.get_status()

    return ApiResponse(
        success=True,
        data=status
    )


@router.post("/start", response_model=ApiResponse[dict])
async def start_monitoring(
        current_user: User = Depends(get_current_user)
):
    """
    Iniciar monitoramento de dispositivos

    **Note:** O monitoramento inicia automaticamente com o servidor,
    este endpoint é apenas para reiniciar se necessário.
    """
    await monitoring_service.start()

    return ApiResponse(
        success=True,
        data=monitoring_service.get_status(),
        message="Monitoramento iniciado"
    )


@router.post("/stop", response_model=ApiResponse[dict])
async def stop_monitoring(
        current_user: User = Depends(get_current_user)
):
    """
    Parar monitoramento de dispositivos

    **Warning:** Dispositivos não terão status atualizado automaticamente
    """
    await monitoring_service.stop()

    return ApiResponse(
        success=True,
        data=monitoring_service.get_status(),
        message="Monitoramento parado"
    )


@router.get("/scheduled-jobs", response_model=ApiResponse[List[dict]])
def get_scheduled_jobs(
        current_user: User = Depends(get_current_user)
):
    """
    Listar rotinas agendadas no scheduler

    **Returns:**
    - Lista de jobs ativos com próxima execução
    """
    jobs = scheduler_service.get_scheduled_jobs()

    return ApiResponse(
        success=True,
        data=jobs,
        message=f"{len(jobs)} rotina(s) agendada(s)"
    )