"""
Monitoring Service - Monitoramento de dispositivos em background
Verifica periodicamente o status dos dispositivos
"""
import asyncio
from datetime import datetime
from typing import Optional

from app.core.database import SessionLocal
from app.crud.device import crud_device
from app.services.device_service import device_service
from app.core.config import settings
from app.utils.logger import logger


class MonitoringService:
    """
    Serviço de monitoramento contínuo de dispositivos
    Verifica health dos devices periodicamente
    """

    def __init__(self):
        self._running = False
        self._task: Optional[asyncio.Task] = None
        self._start_time: Optional[datetime] = None
        self._check_count = 0

    @property
    def is_running(self) -> bool:
        """Verifica se o monitoramento está ativo"""
        return self._running

    @property
    def uptime_seconds(self) -> int:
        """Retorna tempo de execução em segundos"""
        if not self._start_time:
            return 0
        return int((datetime.utcnow() - self._start_time).total_seconds())

    async def start(self):
        """Inicia monitoramento em background"""
        if self._running:
            logger.warning("Monitoramento já está rodando")
            return

        self._running = True
        self._start_time = datetime.utcnow()
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
        """Verifica status de todos os dispositivos"""
        db = SessionLocal()
        try:
            # Buscar todos dispositivos
            devices = crud_device.get_multi(db, skip=0, limit=1000)

            if not devices:
                return

            logger.debug(f"🔍 Verificando {len(devices)} dispositivos...")

            online_count = 0
            offline_count = 0

            # Verificar cada dispositivo
            for device in devices:
                status = device_service.check_device_health(
                    db,
                    device_id=device.id
                )

                if status.value == "online":
                    online_count += 1
                else:
                    offline_count += 1

            logger.debug(
                f"✅ Check completo: {online_count} online, "
                f"{offline_count} offline (check #{self._check_count})"
            )

        except Exception as e:
            logger.error(f"Erro ao verificar dispositivos: {e}")
        finally:
            db.close()

    def get_status(self) -> dict:
        """Retorna status atual do monitoramento"""
        return {
            "is_running": self._running,
            "uptime_seconds": self.uptime_seconds,
            "check_count": self._check_count,
            "last_check": datetime.utcnow().isoformat() if self._running else None,
            "check_interval_seconds": settings.DEVICE_CHECK_INTERVAL
        }


# Instância global
monitoring_service = MonitoringService()