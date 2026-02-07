"""
WebSocket Routes - Endpoint para conexões em tempo real
"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from app.websocket.manager import manager
from app.core.security import decode_access_token
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    token: str = Query(default=None)
):
    """
    Endpoint WebSocket para sincronização em tempo real.

    Query Parameters:
        token: JWT token para autenticação (opcional)

    Events emitidos pelo servidor:
        - device_toggled: Dispositivo ligado/desligado
        - device_created: Novo dispositivo criado
        - device_updated: Dispositivo atualizado
        - device_deleted: Dispositivo removido
        - routine_toggled: Rotina ativada/desativada
        - routine_created: Nova rotina criada
        - routine_updated: Rotina atualizada
        - routine_deleted: Rotina removida
        - routine_executed: Rotina executada

    Exemplo de conexão JavaScript:
        const ws = new WebSocket('ws://localhost:8000/ws?token=JWT_TOKEN');
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log(data.event, data.data);
        };
    """
    # Validar token JWT e extrair user_id
    user_id = "anonymous"
    if token:
        try:
            payload = decode_access_token(token)
            if payload and payload.get("sub"):
                user_id = payload.get("sub")
        except Exception as e:
            logger.warning(f"Invalid WebSocket token: {e}")

    await manager.connect(websocket, user_id)

    try:
        while True:
            # Manter conexão ativa e receber mensagens do cliente
            # (ping/pong e possíveis comandos futuros)
            data = await websocket.receive_text()

            # Processar mensagens do cliente se necessário
            # Por agora, apenas mantemos a conexão ativa
            if data == "ping":
                await websocket.send_text("pong")

    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket, user_id)
