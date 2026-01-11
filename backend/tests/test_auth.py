"""
Testes de Autenticação
"""
import pytest


def test_login_success(client, test_user):
    """Teste de login bem-sucedido"""
    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "test@test.com",
            "password": "testpassword123"
        }
    )

    assert response.status_code == 200
    data = response.json()

    assert data["success"] is True
    assert "access_token" in data["data"]
    assert data["data"]["token_type"] == "Bearer"
    assert data["data"]["user"]["email"] == "test@test.com"
    assert data["data"]["user"]["name"] == "Test User"


def test_login_wrong_password(client, test_user):
    """Teste de login com senha errada"""
    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "test@test.com",
            "password": "wrongpassword"
        }
    )

    assert response.status_code == 401
    data = response.json()
    assert "Email ou senha incorretos" in data["detail"]


def test_login_nonexistent_user(client):
    """Teste de login com usuário inexistente"""
    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "nonexistent@test.com",
            "password": "password123"
        }
    )

    assert response.status_code == 401


def test_get_current_user(client, auth_headers):
    """Teste de obter usuário atual"""
    response = client.get(
        "/api/v1/auth/me",
        headers=auth_headers
    )

    assert response.status_code == 200
    data = response.json()

    assert data["success"] is True
    assert data["data"]["email"] == "test@test.com"


def test_get_current_user_without_token(client):
    """Teste de acessar /me sem token"""
    response = client.get("/api/v1/auth/me")

    assert response.status_code == 401


def test_get_current_user_invalid_token(client):
    """Teste de acessar /me com token inválido"""
    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": "Bearer invalid_token"}
    )

    assert response.status_code == 401


def test_logout(client, auth_headers):
    """Teste de logout"""
    response = client.post(
        "/api/v1/auth/logout",
        headers=auth_headers
    )

    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True