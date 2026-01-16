"""
Security utilities - JWT, password hashing, authentication
"""
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from app.core.config import settings

# Configurar bcrypt para hash de senhas
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """
    Faz hash de uma senha usando bcrypt

    Args:
        password: Senha em texto plano

    Returns:
        str: Hash da senha

    Example:
        >>> hash_password("admin123")
        '$2b$12$...'
    """
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifica se uma senha corresponde ao hash

    Args:
        plain_password: Senha em texto plano
        hashed_password: Hash armazenado no banco

    Returns:
        bool: True se senha correta

    Example:
        >>> verify_password("admin123", hash_from_db)
        True
    """
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Cria um JWT token

    Args:
        data: Payload do token (ex: {"sub": user_id})
        expires_delta: Tempo de expiração customizado

    Returns:
        str: JWT token encoded

    Example:
        >>> token = create_access_token({"sub": str(user.id)})
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
    """
    to_encode = data.copy()

    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({"exp": expire})

    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )

    return encoded_jwt


def decode_access_token(token: str) -> Optional[dict]:
    """
    Decodifica e valida um JWT token

    Args:
        token: JWT token

    Returns:
        dict: Payload do token se válido, None se inválido

    Example:
        >>> payload = decode_access_token(token)
        >>> user_id = payload.get("sub")
    """
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        return payload
    except JWTError:
        return None