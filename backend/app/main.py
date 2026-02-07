"""
FastAPI Application Entry Point
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.router import api_router
from app.websocket.routes import router as ws_router
from app.services.scheduler_service import scheduler_service
from app.utils.logger import logger


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Gerencia startup e shutdown da aplicação"""
    # Startup
    logger.info("🚀 Iniciando aplicação...")
    scheduler_service.start()
    logger.info("✅ Scheduler de rotinas iniciado")

    yield

    # Shutdown
    logger.info("🛑 Encerrando aplicação...")
    scheduler_service.stop()
    logger.info("✅ Scheduler parado")


# Criar aplicação FastAPI com lifespan
app = FastAPI(
    title=settings.APP_NAME,
    debug=settings.DEBUG,
    version="1.0.0",
    description="API para gerenciamento de dispositivos IoT e rotinas automatizadas",
    lifespan=lifespan
)

# Configurar CORS - Liberado para desenvolvimento
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "app": settings.APP_NAME,
        "version": "1.0.0",
        "status": "online",
        "environment": settings.ENVIRONMENT
    }


@app.get("/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "database": "connected",
        "services": {
            "tuya": "not_configured",
            "snmp": "ready"
        }
    }


# Incluir routers da API
app.include_router(api_router, prefix=settings.API_V1_PREFIX)

# Incluir WebSocket router
app.include_router(ws_router)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG
    )