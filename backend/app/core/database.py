"""
Configuração do SQLAlchemy
Engine, SessionLocal e Base para todos os models
"""
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from backend.app.core.config import settings

# 1. Preparamos os argumentos base que funcionam em qualquer banco
connect_args = {}
engine_kwargs = {
    "echo": settings.DEBUG
}

# 2. Lógica condicional baseada no driver
if settings.DATABASE_URL.startswith("sqlite"):
    # SQLite: Necessário para FastAPI/Pytest não travarem as threads
    connect_args["check_same_thread"] = False
else:
    # PostgreSQL: Aplica configurações de pool e performance
    engine_kwargs.update({
        "pool_pre_ping": True,
        "pool_size": 10,
        "max_overflow": 20,
    })

# 3. Criação do Engine com os argumentos processados
engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    **engine_kwargs
)

# --- O restante do código permanece igual ---

# Session factory
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# Base class para todos os models
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()