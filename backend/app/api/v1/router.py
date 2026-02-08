"""
API v1 Router - Agrega todos os routers
"""
from fastapi import APIRouter
from app.api.v1 import auth, devices, activities, monitoring, routines, analytics, users

api_router = APIRouter()

# Incluir routers
api_router.include_router(auth.router)

# Vamos adicionar mais routers aqui depois:
api_router.include_router(devices.router)
api_router.include_router(activities.router)
api_router.include_router(monitoring.router)
api_router.include_router(routines.router)
api_router.include_router(analytics.router)
api_router.include_router(users.router)