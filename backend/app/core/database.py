"""
Configuração do SQLAlchemy
Engine, SessionLocal e Base para todos os models
"""
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

# Engine do SQLAlchemy
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,  # Verifica conexão antes de usar
    pool_size=10,        # Pool de conexões
    max_overflow=20,     # Conexões extras se pool cheio
    echo=settings.DEBUG  # Log de SQL queries em modo debug
)

# Session factory
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# Base class para todos os models
Base = declarative_base()


# Dependency para usar em endpoints FastAPI
def get_db():
    """
    Dependency que fornece sessão do banco
    Fecha automaticamente após o request

    Usage:
        @app.get("/items")
        def get_items(db: Session = Depends(get_db)):
            return db.query(Item).all()
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()