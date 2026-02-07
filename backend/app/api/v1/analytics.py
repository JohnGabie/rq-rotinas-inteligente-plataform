"""
Analytics Endpoints - Dashboard de histórico e estatísticas
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.activity_log import ActivityLog
from app.models.device_session import DeviceSession
from app.models.enums import ActivityType
from app.crud.device_session import crud_device_session
from app.crud.activity_log import crud_activity_log
from app.schemas.common import ApiResponse
from app.schemas.analytics import (
    PeriodType,
    DeviceUsageResponse,
    DeviceUsageItem,
    DailyUsage,
    RoutineExecutionsResponse,
    RoutineExecutionItem,
    RoutineExecutionStats,
    TimelineResponse,
    TimelineEvent,
    TimelineSession,
    AnalyticsSummary
)

# Timezone de São Paulo
SAO_PAULO_TZ = ZoneInfo("America/Sao_Paulo")


def now_sao_paulo():
    """Retorna datetime atual no timezone de São Paulo"""
    return datetime.now(SAO_PAULO_TZ)


def get_period_dates(period: str) -> tuple[datetime, datetime]:
    """
    Converte string de período para datas início/fim

    Args:
        period: "7d", "30d", "90d"

    Returns:
        tuple: (start_date, end_date)
    """
    end_date = now_sao_paulo()

    if period == "7d":
        start_date = end_date - timedelta(days=7)
    elif period == "30d":
        start_date = end_date - timedelta(days=30)
    elif period == "90d":
        start_date = end_date - timedelta(days=90)
    else:
        # Default: 7 dias
        start_date = end_date - timedelta(days=7)

    # Normalizar para início do dia
    start_date = start_date.replace(hour=0, minute=0, second=0, microsecond=0)

    return start_date, end_date


router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/device-usage", response_model=ApiResponse[DeviceUsageResponse])
def get_device_usage(
        period: str = Query(default="7d", regex="^(7d|30d|90d)$"),
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """
    Obter estatísticas de uso de dispositivos

    **Query Parameters:**
    - period: "7d" (7 dias), "30d" (30 dias), "90d" (90 dias)

    **Returns:**
    - by_device: Uso por dispositivo (ordenado por mais usado)
    - daily_usage: Uso diário agregado
    - total_hours: Total de horas no período
    """
    start_date, end_date = get_period_dates(period)

    # Uso por dispositivo
    device_usage = crud_device_session.get_total_time_by_device(
        db,
        user_id=current_user.id,
        start_date=start_date,
        end_date=end_date
    )

    # Contagem de sessões por dispositivo
    session_counts = (
        db.query(
            DeviceSession.device_id,
            func.count(DeviceSession.id).label('count')
        )
        .filter(
            DeviceSession.user_id == current_user.id,
            DeviceSession.started_at >= start_date,
            DeviceSession.started_at <= end_date
        )
        .group_by(DeviceSession.device_id)
        .all()
    )
    counts_map = {str(r.device_id): r.count for r in session_counts}

    # Converter para response
    by_device = [
        DeviceUsageItem.from_data(
            device_id=d["device_id"],
            device_name=d["device_name"],
            total_seconds=d["total_seconds"],
            session_count=counts_map.get(d["device_id"], 0)
        )
        for d in device_usage
    ]

    # Uso diário
    daily_data = crud_device_session.get_daily_usage(
        db,
        user_id=current_user.id,
        start_date=start_date,
        end_date=end_date
    )

    daily_usage = [
        DailyUsage.from_data(
            date_str=d["date"],
            total_seconds=d["total_seconds"]
        )
        for d in daily_data
    ]

    # Total de horas
    total_seconds = sum(d["total_seconds"] for d in device_usage)
    total_hours = round(total_seconds / 3600, 2)

    return ApiResponse(
        success=True,
        data=DeviceUsageResponse(
            period_start=start_date,
            period_end=end_date,
            by_device=by_device,
            daily_usage=daily_usage,
            total_hours=total_hours
        )
    )


@router.get("/routine-executions", response_model=ApiResponse[RoutineExecutionsResponse])
def get_routine_executions(
        period: str = Query(default="7d", regex="^(7d|30d|90d)$"),
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """
    Obter histórico de execuções de rotinas

    **Query Parameters:**
    - period: "7d" (7 dias), "30d" (30 dias), "90d" (90 dias)

    **Returns:**
    - executions: Lista de execuções ordenadas por mais recente
    - stats_by_routine: Estatísticas por rotina
    - total_executions: Total de execuções no período
    """
    start_date, end_date = get_period_dates(period)

    # Buscar logs de execução de rotinas
    executions_raw = (
        db.query(ActivityLog)
        .filter(
            ActivityLog.user_id == current_user.id,
            ActivityLog.type == ActivityType.ROUTINE_EXECUTED,
            ActivityLog.created_at >= start_date,
            ActivityLog.created_at <= end_date
        )
        .order_by(ActivityLog.created_at.desc())
        .all()
    )

    # Converter para response
    executions = [
        RoutineExecutionItem(
            id=str(log.id),
            routine_id=str(log.routine_id) if log.routine_id else None,
            routine_name=log.routine_name or "Rotina desconhecida",
            executed_at=log.created_at,
            timestamp=int(log.created_at.timestamp() * 1000),
            success=True,  # Por enquanto assumimos sucesso
            trigger_type=None
        )
        for log in executions_raw
    ]

    # Estatísticas por rotina
    stats_query = (
        db.query(
            ActivityLog.routine_id,
            ActivityLog.routine_name,
            func.count(ActivityLog.id).label('total')
        )
        .filter(
            ActivityLog.user_id == current_user.id,
            ActivityLog.type == ActivityType.ROUTINE_EXECUTED,
            ActivityLog.created_at >= start_date,
            ActivityLog.created_at <= end_date,
            ActivityLog.routine_id.isnot(None)
        )
        .group_by(ActivityLog.routine_id, ActivityLog.routine_name)
        .order_by(func.count(ActivityLog.id).desc())
        .all()
    )

    stats_by_routine = [
        RoutineExecutionStats(
            routine_id=str(s.routine_id),
            routine_name=s.routine_name or "Rotina desconhecida",
            total_executions=s.total,
            successful=s.total,  # Por enquanto assumimos sucesso
            failed=0,
            success_rate=100.0 if s.total > 0 else 0.0
        )
        for s in stats_query
    ]

    return ApiResponse(
        success=True,
        data=RoutineExecutionsResponse(
            period_start=start_date,
            period_end=end_date,
            executions=executions,
            stats_by_routine=stats_by_routine,
            total_executions=len(executions)
        )
    )


@router.get("/timeline", response_model=ApiResponse[TimelineResponse])
def get_timeline(
        date: Optional[str] = Query(default=None, regex="^\\d{4}-\\d{2}-\\d{2}$"),
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """
    Obter timeline de eventos de um dia específico

    **Query Parameters:**
    - date: Data no formato YYYY-MM-DD (default: hoje)

    **Returns:**
    - events: Lista de eventos do dia
    - sessions: Lista de sessões de dispositivos do dia
    """
    # Parsear data ou usar hoje
    if date:
        target_date = datetime.strptime(date, "%Y-%m-%d")
        target_date = target_date.replace(tzinfo=SAO_PAULO_TZ)
    else:
        target_date = now_sao_paulo().replace(hour=0, minute=0, second=0, microsecond=0)

    start_of_day = target_date.replace(hour=0, minute=0, second=0, microsecond=0)
    end_of_day = target_date.replace(hour=23, minute=59, second=59, microsecond=999999)

    # Buscar todos os logs do dia
    logs = (
        db.query(ActivityLog)
        .filter(
            ActivityLog.user_id == current_user.id,
            ActivityLog.created_at >= start_of_day,
            ActivityLog.created_at <= end_of_day
        )
        .order_by(ActivityLog.created_at.asc())
        .all()
    )

    events = [
        TimelineEvent(
            id=str(log.id),
            type=log.type.value,
            title=log.title,
            description=log.description,
            timestamp=int(log.created_at.timestamp() * 1000),
            datetime=log.created_at,
            device_id=str(log.device_id) if log.device_id else None,
            device_name=log.device_name,
            routine_id=str(log.routine_id) if log.routine_id else None,
            routine_name=log.routine_name
        )
        for log in logs
    ]

    # Buscar sessões do dia
    sessions_raw = crud_device_session.get_sessions_in_period(
        db,
        user_id=current_user.id,
        start_date=start_of_day,
        end_date=end_of_day
    )

    sessions = [
        TimelineSession(
            device_id=str(s.device_id),
            device_name=s.device_name,
            started_at=s.started_at,
            ended_at=s.ended_at,
            duration_seconds=s.duration_seconds,
            is_active=s.is_active,
            trigger_source=s.trigger_source.value
        )
        for s in sessions_raw
    ]

    return ApiResponse(
        success=True,
        data=TimelineResponse(
            date=target_date.strftime("%Y-%m-%d"),
            events=events,
            sessions=sessions
        )
    )


@router.get("/summary", response_model=ApiResponse[AnalyticsSummary])
def get_analytics_summary(
        period: str = Query(default="7d", regex="^(7d|30d|90d)$"),
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """
    Obter resumo geral de analytics

    **Query Parameters:**
    - period: "7d" (7 dias), "30d" (30 dias), "90d" (90 dias)

    **Returns:**
    - Estatísticas resumidas do período
    """
    start_date, end_date = get_period_dates(period)

    # Total de sessões
    total_sessions = (
        db.query(func.count(DeviceSession.id))
        .filter(
            DeviceSession.user_id == current_user.id,
            DeviceSession.started_at >= start_date,
            DeviceSession.started_at <= end_date
        )
        .scalar()
    )

    # Total de execuções de rotina
    total_routine_executions = (
        db.query(func.count(ActivityLog.id))
        .filter(
            ActivityLog.user_id == current_user.id,
            ActivityLog.type == ActivityType.ROUTINE_EXECUTED,
            ActivityLog.created_at >= start_date,
            ActivityLog.created_at <= end_date
        )
        .scalar()
    )

    # Tempo total ligado (em horas)
    total_seconds = (
        db.query(func.sum(DeviceSession.duration_seconds))
        .filter(
            DeviceSession.user_id == current_user.id,
            DeviceSession.started_at >= start_date,
            DeviceSession.started_at <= end_date,
            DeviceSession.ended_at.isnot(None)
        )
        .scalar()
    ) or 0

    # Dispositivos ativos (únicos)
    active_devices = (
        db.query(func.count(func.distinct(DeviceSession.device_id)))
        .filter(
            DeviceSession.user_id == current_user.id,
            DeviceSession.started_at >= start_date,
            DeviceSession.started_at <= end_date
        )
        .scalar()
    )

    return ApiResponse(
        success=True,
        data=AnalyticsSummary(
            period_start=start_date.isoformat(),
            period_end=end_date.isoformat(),
            total_sessions=total_sessions or 0,
            total_routine_executions=total_routine_executions or 0,
            total_hours_on=round(total_seconds / 3600, 2),
            active_devices=active_devices or 0
        )
    )
