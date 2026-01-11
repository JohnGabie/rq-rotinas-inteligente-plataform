"""
Testes de Dispositivos
"""
import pytest


@pytest.fixture
def sample_tuya_device():
    """Device Tuya de exemplo"""
    return {
        "name": "Tomada Teste",
        "type": "tuya",
        "icon": "plug",
        "device_id": "test_device_id_123",
        "local_key": "test_local_key_456"
    }


@pytest.fixture
def sample_snmp_device():
    """Device SNMP de exemplo"""
    return {
        "name": "Régua Teste",
        "type": "snmp",
        "icon": "server",
        "ip": "192.168.1.100",
        "community_string": "public",
        "port": 161,
        "snmp_base_oid": "1.3.6.1.4.1.17095.1.3.",
        "snmp_outlet_number": 1
    }


def test_create_tuya_device(client, auth_headers, sample_tuya_device):
    """Teste de criar dispositivo Tuya"""
    response = client.post(
        "/api/v1/devices",
        headers=auth_headers,
        json=sample_tuya_device
    )

    assert response.status_code == 201
    data = response.json()

    assert data["success"] is True
    assert data["data"]["name"] == sample_tuya_device["name"]
    assert data["data"]["type"] == "tuya"
    assert data["data"]["status"] == "offline"
    assert "id" in data["data"]


def test_create_snmp_device(client, auth_headers, sample_snmp_device):
    """Teste de criar dispositivo SNMP"""
    response = client.post(
        "/api/v1/devices",
        headers=auth_headers,
        json=sample_snmp_device
    )

    assert response.status_code == 201
    data = response.json()

    assert data["success"] is True
    assert data["data"]["name"] == sample_snmp_device["name"]
    assert data["data"]["type"] == "snmp"
    assert data["data"]["ip"] == sample_snmp_device["ip"]


def test_create_device_without_auth(client, sample_tuya_device):
    """Teste de criar dispositivo sem autenticação"""
    response = client.post(
        "/api/v1/devices",
        json=sample_tuya_device
    )

    assert response.status_code == 401


def test_create_invalid_tuya_device(client, auth_headers):
    """Teste de criar dispositivo Tuya sem campos obrigatórios"""
    response = client.post(
        "/api/v1/devices",
        headers=auth_headers,
        json={
            "name": "Device Inválido",
            "type": "tuya",
            "icon": "plug"
            # Faltando device_id e local_key
        }
    )

    assert response.status_code == 422  # Validation error


def test_list_devices(client, auth_headers, sample_tuya_device):
    """Teste de listar dispositivos"""
    # Criar alguns devices
    client.post("/api/v1/devices", headers=auth_headers, json=sample_tuya_device)

    response = client.get(
        "/api/v1/devices",
        headers=auth_headers
    )

    assert response.status_code == 200
    data = response.json()

    assert data["success"] is True
    assert isinstance(data["data"], list)
    assert len(data["data"]) >= 1


def test_get_device(client, auth_headers, sample_tuya_device):
    """Teste de obter dispositivo específico"""
    # Criar device
    create_response = client.post(
        "/api/v1/devices",
        headers=auth_headers,
        json=sample_tuya_device
    )
    device_id = create_response.json()["data"]["id"]

    # Buscar device
    response = client.get(
        f"/api/v1/devices/{device_id}",
        headers=auth_headers
    )

    assert response.status_code == 200
    data = response.json()

    assert data["success"] is True
    assert data["data"]["id"] == device_id
    assert data["data"]["name"] == sample_tuya_device["name"]


def test_get_nonexistent_device(client, auth_headers):
    """Teste de buscar dispositivo inexistente"""
    fake_uuid = "00000000-0000-0000-0000-000000000000"
    response = client.get(
        f"/api/v1/devices/{fake_uuid}",
        headers=auth_headers
    )

    assert response.status_code == 404


def test_update_device(client, auth_headers, sample_tuya_device):
    """Teste de atualizar dispositivo"""
    # Criar device
    create_response = client.post(
        "/api/v1/devices",
        headers=auth_headers,
        json=sample_tuya_device
    )
    device_id = create_response.json()["data"]["id"]

    # Atualizar device
    response = client.put(
        f"/api/v1/devices/{device_id}",
        headers=auth_headers,
        json={
            "name": "Tomada Atualizada",
            "icon": "monitor"
        }
    )

    assert response.status_code == 200
    data = response.json()

    assert data["success"] is True
    assert data["data"]["name"] == "Tomada Atualizada"
    assert data["data"]["icon"] == "monitor"


def test_delete_device(client, auth_headers, sample_tuya_device):
    """Teste de deletar dispositivo"""
    # Criar device
    create_response = client.post(
        "/api/v1/devices",
        headers=auth_headers,
        json=sample_tuya_device
    )
    device_id = create_response.json()["data"]["id"]

    # Deletar device
    response = client.delete(
        f"/api/v1/devices/{device_id}",
        headers=auth_headers
    )

    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True

    # Verificar se foi deletado
    get_response = client.get(
        f"/api/v1/devices/{device_id}",
        headers=auth_headers
    )
    assert get_response.status_code == 404


def test_user_cannot_access_other_user_device(client, db, test_user, test_admin, sample_tuya_device):
    """Teste de isolamento de dados entre usuários"""
    # Login como usuário normal
    login_response = client.post(
        "/api/v1/auth/login",
        json={"email": "test@test.com", "password": "testpassword123"}
    )
    user_token = login_response.json()["data"]["access_token"]
    user_headers = {"Authorization": f"Bearer {user_token}"}

    # Criar device como usuário normal
    create_response = client.post(
        "/api/v1/devices",
        headers=user_headers,
        json=sample_tuya_device
    )
    device_id = create_response.json()["data"]["id"]

    # Login como admin
    admin_login = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@test.com", "password": "adminpassword123"}
    )
    admin_token = admin_login.json()["data"]["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # Admin não pode ver device do usuário normal
    response = client.get(
        f"/api/v1/devices/{device_id}",
        headers=admin_headers
    )

    assert response.status_code == 404