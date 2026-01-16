"""
Auth Endpoints - Login, Logout, Me
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.crud.user import crud_user
from app.schemas.user import UserLogin, LoginResponse, UserResponse
from app.schemas.common import ApiResponse
from app.core.security import create_access_token
from app.core.config import settings
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=ApiResponse[LoginResponse])
def login(
        credentials: UserLogin,
        db: Session = Depends(get_db)
):
    """
    Login do usuário

    **Request Body:**
    - email: Email do usuário
    - password: Senha

    **Returns:**
    - access_token: JWT token
    - user: Dados do usuário

    **Errors:**
    - 401: Credenciais inválidas
    """
    # Autenticar usuário
    user = crud_user.authenticate(
        db,
        email=credentials.email,
        password=credentials.password
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou senha incorretos"
        )

    if not crud_user.is_active(user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuário inativo"
        )

    # Criar JWT token
    access_token = create_access_token(data={"sub": str(user.id)})

    # Construir response
    login_response = LoginResponse(
        access_token=access_token,
        token_type="Bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,  # Em segundos
        user=UserResponse.model_validate(user)
    )

    return ApiResponse(
        success=True,
        data=login_response,
        message="Login realizado com sucesso"
    )


@router.post("/logout", response_model=ApiResponse[None])
def logout(current_user: User = Depends(get_current_user)):
    """
    Logout do usuário

    **Note:** Como JWT é stateless, o logout é apenas uma convenção.
    O token continua válido até expirar. Para invalidação real,
    seria necessário um blacklist de tokens.

    **Returns:**
    - Mensagem de sucesso
    """
    return ApiResponse(
        success=True,
        message="Logout realizado com sucesso"
    )


@router.get("/me", response_model=ApiResponse[UserResponse])
def get_current_user_info(current_user: User = Depends(get_current_user)):
    """
    Obter informações do usuário autenticado

    **Returns:**
    - Dados do usuário atual
    """
    return ApiResponse(
        success=True,
        data=UserResponse.model_validate(current_user)
    )