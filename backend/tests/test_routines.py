"""
Testes de Rotinas
"""
import pytest


@pytest.fixture
def sample_device(client, auth_headers):
    """Cria um device para usar nas rotinas"""
    response = client.post(
        "/api/v1/devices",
        headers=auth_headers,
        json={
            "name": "Device Teste",
            "type": "tuya",
            "icon": "plug",
            "device_id": "test_device_123",
            "local_key": "test_key_456"
        }
    )
    return response.json()["data"]


@pytest.fixture
def sample_manual_routine(sample_device):
    """Rotina manual de exemplo"""
    return {
        "name": "Rotina Manual Teste",
        "trigger_type": "manual",
        "actions": [
            {
                "device_id": sample_device["id"],
                "turn_on": True,
                "order": 1,
                "delay": 0
            }
        ]
    }


@pytest.fixture
def sample_time_routine(sample_device):
    """Rotina de horário de exemplo"""
    return {
        "name": "Rotina Matinal",
        "trigger_type": "time",
        "trigger_time": "08:00:00",
        "week_days": ["seg", "ter", "qua"],
        "actions": [
            {
                "device_id": sample_device["id"],
                "turn_on": True,
                "order": 1,
                "delay": 0
            },
            {
                "device_id": sample_device["id"],
                "turn_on": False,
                "order": 2,
                "delay": 5
            }
        ]
    }


def test_create_manual_routine(client, auth_headers, sample_manual_routine):
    """Teste de criar rotina manual"""
    response = client.post(
        "/api/v1/routines",
        headers=auth_headers,
        json=sample_manual_routine
    )

    assert response.status_code == 201
    data = response.json()

    assert data["success"] is True
    assert data["data"]["name"] == sample_manual_routine["name"]
    assert data["data"]["trigger_type"] == "manual"
    assert data["data"]["is_active"] is False
    assert len(data["data"]["actions"]) == 1


def test_create_time_routine(client, auth_headers, sample_time_routine):
    """Teste de criar rotina de horário"""
    response = client.post(
        "/api/v1/routines",
        headers=auth_headers,
        json=sample_time_routine
    )

    assert response.status_code == 201
    data = response.json()

    assert data["success"] is True
    assert data["data"]["trigger_type"] == "time"
    assert data["data"]["trigger_time"] == "08:00:00"
    assert data["data"]["week_days"] == ["seg", "ter", "qua"]
    assert len(data["data"]["actions"]) == 2


def test_create_routine_without_actions(client, auth_headers):
    """Teste de criar rotina sem ações"""
    response = client.post(
        "/api/v1/routines",
        headers=auth_headers,
        json={
            "name": "Rotina Inválida",
            "trigger_type": "manual",
            "actions": []  # Vazio
        }
    )

    assert response.status_code == 422  # Validation error


def test_create_time_routine_without_required_fields(client, auth_headers, sample_device):
    """Teste de criar rotina de horário sem campos obrigatórios"""
    response = client.post(
        "/api/v1/routines",
        headers=auth_headers,
        json={
            "name": "Rotina Incompleta",
            "trigger_type": "time",
            # Faltando trigger_time e week_days
            "actions": [
                {
                    "device_id": sample_device["id"],
                    "turn_on": True,
                    "order": 1,
                    "delay": 0
                }
            ]
        }
    )

    assert response.status_code == 422


def test_list_routines(client, auth_headers, sample_manual_routine):
    """Teste de listar rotinas"""
    # Criar rotina
    client.post("/api/v1/routines", headers=auth_headers, json=sample_manual_routine)

    # Listar
    response = client.get(
        "/api/v1/routines",
        headers=auth_headers
    )

    assert response.status_code == 200
    data = response.json()

    assert data["success"] is True
    assert isinstance(data["data"], list)
    assert len(data["data"]) >= 1


def test_get_routine(client, auth_headers, sample_manual_routine):
    """Teste de obter rotina específica"""
    # Criar rotina
    create_response = client.post(
        "/api/v1/routines",
        headers=auth_headers,
        json=sample_manual_routine
    )
    routine_id = create_response.json()["data"]["id"]

    # Buscar rotina
    response = client.get(
        f"/api/v1/routines/{routine_id}",
        headers=auth_headers
    )

    assert response.status_code == 200
    data = response.json()

    assert data["success"] is True
    assert data["data"]["id"] == routine_id


def test_update_routine(client, auth_headers, sample_manual_routine):
    """Teste de atualizar rotina"""
    # Criar rotina
    create_response = client.post(
        "/api/v1/routines",
        headers=auth_headers,
        json=sample_manual_routine
    )
    routine_id = create_response.json()["data"]["id"]

    # Atualizar
    response = client.put(
        f"/api/v1/routines/{routine_id}",
        headers=auth_headers,
        json={
            "name": "Rotina Atualizada"
        }
    )

    assert response.status_code == 200
    data = response.json()

    assert data["success"] is True
    assert data["data"]["name"] == "Rotina Atualizada"


def test_delete_routine(client, auth_headers, sample_manual_routine):
    """Teste de deletar rotina"""
    # Criar rotina
    create_response = client.post(
        "/api/v1/routines",
        headers=auth_headers,
        json=sample_manual_routine
    )
    routine_id = create_response.json()["data"]["id"]

    # Deletar
    response = client.delete(
        f"/api/v1/routines/{routine_id}",
        headers=auth_headers
    )

    assert response.status_code == 200
    assert response.json()["success"] is True

    # Verificar que foi deletada
    get_response = client.get(
        f"/api/v1/routines/{routine_id}",
        headers=auth_headers
    )
    assert get_response.status_code == 404


def test_toggle_routine(client, auth_headers, sample_manual_routine):
    """Teste de ativar/desativar rotina"""
    # Criar rotina
    create_response = client.post(
        "/api/v1/routines",
        headers=auth_headers,
        json=sample_manual_routine
    )
    routine_id = create_response.json()["data"]["id"]

    # Ativar
    response = client.patch(
        f"/api/v1/routines/{routine_id}/toggle",
        headers=auth_headers,
        json={"is_active": True}
    )

    assert response.status_code == 200
    data = response.json()

    assert data["success"] is True
    assert data["data"]["is_active"] is True

    # Desativar
    response = client.patch(
        f"/api/v1/routines/{routine_id}/toggle",
        headers=auth_headers,
        json={"is_active": False}
    )

    assert response.status_code == 200
    assert response.json()["data"]["is_active"] is False


def test_execute_routine_mock(client, auth_headers, sample_manual_routine):
    """Teste de executar rotina (modo mock)"""
    # Criar rotina
    create_response = client.post(
        "/api/v1/routines",
        headers=auth_headers,
        json=sample_manual_routine
    )
    routine_id = create_response.json()["data"]["id"]

    # Executar
    response = client.post(
        f"/api/v1/routines/{routine_id}/execute",
        headers=auth_headers
    )

    assert response.status_code == 200
    data = response.json()

    assert data["success"] is True
    assert "executed_actions" in data["data"]
    assert "execution_time_ms" in data["data"]
    assert "results" in data["data"]