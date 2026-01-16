"""
Configurações da aplicação usando Pydantic Settings
Carrega variáveis do arquivo .env automaticamente via caminho absoluto
"""
import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    """Settings da aplicação"""

    # Application
    APP_NAME: str = "Rotina Inteligente API"
    DEBUG: bool = False
    ENVIRONMENT: str = "production"
    API_V1_PREFIX: str = "/api/v1"

    # Database
    DATABASE_URL: str

    # Security
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours

    # CORS
    ALLOWED_ORIGINS: str = "http://localhost:5173"

    @property
    def allowed_origins_list(self) -> List[str]:
        """Converte string de origins em lista"""
        if not self.ALLOWED_ORIGINS:
            return []
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",")]

    # Tuya
    TUYA_REGION: str = "us"
    TUYA_API_KEY: str = ""
    TUYA_API_SECRET: str = ""

    # SNMP
    SNMP_TIMEOUT: int = 5
    SNMP_RETRIES: int = 3

    # Monitoring
    DEVICE_CHECK_INTERVAL: int = 30
    MAX_ROUTINE_RETRIES: int = 3

    # Logging
    LOG_LEVEL: str = "INFO"

    # --- CONFIGURAÇÃO DE CARREGAMENTO DO .ENV ---
    # Isso garante que ele ache o .env na pasta 'backend/',
    # não importa de onde você rode o comando (terminal raiz ou PyCharm)
    model_config = SettingsConfigDict(
        env_file="../.env",  # <-- Coloque o caminho correto aqui. Ex: "../.env" ou "app/.env"
        env_file_encoding="utf-8",
        extra="ignore"
    )


# Instância global de settings
settings = Settings()