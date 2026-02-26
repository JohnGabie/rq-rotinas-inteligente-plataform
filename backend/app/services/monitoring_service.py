"""
Monitoring Service - Monitoramento de dispositivos em background
Verifica periodicamente o status dos dispositivos e sincroniza estado real do hardware
"""
import asyncio
from datetime import datetime
from zoneinfo import ZoneInfo
from typing import Optional, Dict

from app.core.database import SessionLocal

# Timezone de São Paulo
SAO_PAULO_TZ = ZoneInfo("America/Sao_Paulo")


def now_sao_paulo():
    """Retorna datetime atual no timezone de São Paulo"""
    return datetime.now(SAO_PAULO_TZ)


from app.crud.device import crud_device
from app.models.enums import DeviceStatus
from app.services.device_service import device_service
from app.websocket.manager import manager
from app.core.config import settings
from app.utils.logger import logger


class MonitoringService:
    """
    Serviço de monitoramento contínuo de dispositivos.
    A cada ciclo, lê o estado REAL do hardware e atualiza o banco.
    Hardware é a fonte da verdade — DB é apenas cache.
    """

    def __init__(self):
        self._running = False
        self._task: Optional[asyncio.Task] = None
        self._start_time: Optional[datetime] = None
        self._check_count = 0
        self._previous_statuses: Dict[str, str] = {}
        self._previous_is_on: Dict[str, Optional[bool]] = {}

    @property
    def is_running(self) -> bool:
        """Verifica se o monitoramento está ativo"""
        return self._running

    @property
    def uptime_seconds(self) -> int:
        """Retorna tempo de execução em segundos"""
        if not self._start_time:
            return 0
        return int((now_sao_paulo() - self._start_time).total_seconds())

    async def start(self):
        """Inicia monitoramento em background"""
        if self._running:
            logger.warning("Monitoramento já está rodando")
            return

        self._running = True
        self._start_time = now_sao_paulo()
        self._task = asyncio.create_task(self._monitoring_loop())
        logger.info("🔍 Monitoramento de dispositivos iniciado")

    async def stop(self):
        """Para o monitoramento"""
        if not self._running:
            return

        self._running = False

        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass

        logger.info("⏹️  Monitoramento de dispositivos parado")

    async def _monitoring_loop(self):
        """Loop principal de monitoramento"""
        interval = settings.DEVICE_CHECK_INTERVAL

        while self._running:
            try:
                await self._check_all_devices()
                self._check_count += 1

                # Aguardar próximo ciclo
                await asyncio.sleep(interval)

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Erro no loop de monitoramento: {e}")
                await asyncio.sleep(interval)

    async def _check_all_devices(self):
        """
        Sincroniza estado de todos os dispositivos com o hardware real.
        Hardware é a fonte da verdade — DB segue o hardware, nunca o contrário.
        Broadcasts WebSocket quando is_on muda (detecção de mudança externa).
        """
        # Buscar IDs numa session rápida e fechá-la antes de paralelizar
        db = SessionLocal()
        try:
            devices = crud_device.get_multi(db, skip=0, limit=1000)
            if not devices:
                return
            device_infos = [(str(d.id), d.id, d.name) for d in devices]
        except Exception as e:
            logger.error(f"Erro ao buscar dispositivos: {e}")
            return
        finally:
            db.close()

        logger.debug(f"🔍 Sincronizando {len(device_infos)} dispositivos com hardware...")

        # Cada sync roda em thread separada com sua própria session DB
        # (SQLAlchemy session não é thread-safe — nunca compartilhar entre threads)
        def sync_one(dev_id):
            """Lê estado real do hardware e atualiza DB. Retorna (status, is_on)."""
            db = SessionLocal()
            try:
                real_state = device_service.sync_device_state(db, device_id=dev_id)
                # None = offline, True/False = online com estado real lido do hardware
                if real_state is None:
                    return DeviceStatus.OFFLINE, None
                return DeviceStatus.ONLINE, real_state
            finally:
                db.close()

        try:
            results = await asyncio.gather(*[
                asyncio.to_thread(sync_one, dev_id)
                for _, dev_id, _ in device_infos
            ])
        except Exception as e:
            logger.error(f"Erro ao sincronizar dispositivos: {e}")
            return

        online_count = 0
        offline_count = 0

        for (device_key, device_id, device_name), (new_status, real_is_on) in zip(device_infos, results):
            previous_status = self._previous_statuses.get(device_key)
            previous_is_on = self._previous_is_on.get(device_key)  # None = nunca visto

            if new_status == DeviceStatus.ONLINE:
                online_count += 1

                # Log de transição de conectividade
                if previous_status is None or previous_status == DeviceStatus.OFFLINE.value:
                    logger.info(
                        f"Dispositivo '{device_name}' ficou ONLINE "
                        f"(anterior: {'nunca visto' if previous_status is None else 'OFFLINE'})"
                    )

                # Broadcast quando is_on mudou (inclui startup: None → estado real)
                # Isso garante que a UI sempre reflete o hardware, mesmo sem interação do usuário
                if real_is_on != previous_is_on:
                    logger.info(
                        f"'{device_name}': is_on {previous_is_on} → {real_is_on} "
                        f"(detectado pelo monitoramento)"
                    )
                    await manager.broadcast_event("device_toggled", {
                        "device_id": str(device_id),
                        "is_on": real_is_on
                    })

                self._previous_is_on[device_key] = real_is_on

            else:
                offline_count += 1

                # Log de transição para offline
                if previous_status == DeviceStatus.ONLINE.value:
                    logger.warning(f"Dispositivo '{device_name}' ficou OFFLINE")

                # Limpar cache de is_on para forçar re-sync na reconexão
                self._previous_is_on.pop(device_key, None)

            self._previous_statuses[device_key] = new_status.value

        logger.debug(
            f"✅ Sync completo: {online_count} online, "
            f"{offline_count} offline (check #{self._check_count})"
        )

    def get_status(self) -> dict:
        """Retorna status atual do monitoramento"""
        return {
            "is_running": self._running,
            "uptime_seconds": self.uptime_seconds,
            "check_count": self._check_count,
            "last_check": now_sao_paulo().isoformat() if self._running else None,
            "check_interval_seconds": settings.DEVICE_CHECK_INTERVAL
        }


# Instância global
monitoring_service = MonitoringService()
