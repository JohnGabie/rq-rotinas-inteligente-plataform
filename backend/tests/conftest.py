"""
Configuração de Testes para Rotina Inteligente
==============================================

LIÇÃO IMPORTANTE: Isolamento de Banco de Dados em Testes
--------------------------------------------------------

O problema anterior era que a fixture criava o usuário em uma sessão,
mas a API usava outra sessão internamente. Mesmo com commit(), 
em alguns casos o PostgreSQL não garante visibilidade imediata 
entre conexões diferentes.

SOLUÇÃO: Usar a MESMA sessão para tudo, através do dependency override
do FastAPI. Assim garantimos que fixture e API enxergam os mesmos dados.
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool

# ====================================================================
# IMPORTANTE: Ajuste estes imports para sua estrutura de projeto
# ====================================================================
# Se você está rodando os testes de dentro da pasta backend/, use:
from backend.app.main import app
from backend.app.core.database import Base, get_db
from backend.app.core.security import create_access_token, hash_password
from backend.app.models.user import User
from backend.app.models.device import Device
from backend.app.models.routine import Routine

# Se estiver rodando de fora da pasta backend/, use:
# from backend.app.main import app
# from backend.app.core.database import Base, get_db
# ... etc

# ====================================================================
# CONFIGURAÇÃO DO BANCO DE TESTES
# ====================================================================

# URL do banco de testes PostgreSQL
SQLALCHEMY_DATABASE_URL = "postgresql://rotina_user:rotina_password@localhost:5432/rotina_inteligente_test"

# Criamos o engine com configurações específicas para testes
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    # NullPool: Cada conexão é fechada imediatamente após uso
    # Bom para testes pois evita conexões "penduradas"
    pool_pre_ping=True,  # Verifica se conexão está viva antes de usar
)

# SessionLocal para testes - configuração padrão
TestingSessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)


# ====================================================================
# FIXTURES DE SETUP DO BANCO
# ====================================================================

@pytest.fixture(scope="session", autouse=True)
def setup_test_database():
    """
    Executa UMA VEZ antes de todos os testes.
    
    Recria todas as tabelas para garantir schema atualizado.
    """
    print("\n🔧 Configurando banco de testes...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    print("✅ Tabelas criadas com sucesso!")
    yield
    # Opcional: limpar banco após todos os testes
    # Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def db():
    """
    Fornece uma sessão de banco para cada teste.
    
    IMPORTANTE: Usa transação com SAVEPOINT para isolamento.
    Após cada teste, faz rollback para limpar os dados.
    """
    connection = engine.connect()

    # Inicia uma transação externa (será revertida no final)
    transaction = connection.begin()

    # Cria sessão vinculada a esta conexão
    session = TestingSessionLocal(bind=connection)

    # ================================================================
    # TÉCNICA: Nested Transactions (Savepoints)
    # ================================================================
    # Quando o código da API faz commit(), na verdade estamos
    # fazendo commit de um SAVEPOINT, não da transação principal.
    # Isso permite reverter tudo no final do teste.
    # ================================================================

    # Configura para usar savepoints em commits internos
    nested = connection.begin_nested()

    @event.listens_for(session, "after_transaction_end")
    def restart_savepoint(session, transaction):
        """Recria savepoint após cada commit interno"""
        nonlocal nested
        if transaction.nested and not transaction._parent.nested:
            nested = connection.begin_nested()

    yield session

    # Cleanup: fecha tudo e reverte a transação principal
    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture(scope="function")
def client(db: Session):
    """
    Cliente HTTP para testes com injeção de dependência.
    
    O segredo está no dependency_overrides: substituímos get_db()
    para retornar nossa sessão de teste, garantindo que API e
    fixtures usem a MESMA sessão de banco.
    """
    def override_get_db():
        try:
            yield db
        finally:
            pass  # Não fechamos a sessão aqui - a fixture db faz isso

    # Substitui a função get_db da API pela nossa
    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as test_client:
        yield test_client

    # Limpa os overrides após o teste
    app.dependency_overrides.clear()


# ====================================================================
# FIXTURES DE USUÁRIOS
# ====================================================================

@pytest.fixture(scope="function")
def test_user(db: Session) -> User:
    """
    Cria um usuário comum para testes.
    
    Retorna o objeto User completo (com id, etc).
    """
    user_email = "test@test.com"

    # Remove usuário existente (se houver de teste anterior)
    existing = db.query(User).filter(User.email == user_email).first()
    if existing:
        db.delete(existing)
        db.flush()  # Flush, não commit - mantém na mesma transação

    user = User(
        email=user_email,
        name="Test User",
        password_hash=hash_password("testpassword123"),
        is_active=True,
        role="user"
    )
    db.add(user)
    db.flush()  # Flush para gerar o ID
    db.refresh(user)  # Refresh para carregar todos os campos

    return user


@pytest.fixture(scope="function")
def test_admin(db: Session) -> User:
    """
    Cria um usuário administrador para testes.
    """
    admin_email = "admin@test.com"

    existing = db.query(User).filter(User.email == admin_email).first()
    if existing:
        db.delete(existing)
        db.flush()

    admin = User(
        email=admin_email,
        name="Admin User",
        password_hash=hash_password("adminpassword123"),
        is_active=True,
        role="admin"
    )
    db.add(admin)
    db.flush()
    db.refresh(admin)

    return admin


@pytest.fixture(scope="function")
def second_user(db: Session) -> User:
    """
    Cria um segundo usuário para testes de isolamento.
    (ex: testar que user A não acessa dados do user B)
    """
    user_email = "second@test.com"

    existing = db.query(User).filter(User.email == user_email).first()
    if existing:
        db.delete(existing)
        db.flush()

    user = User(
        email=user_email,
        name="Second User",
        password_hash=hash_password("secondpassword123"),
        is_active=True,
        role="user"
    )
    db.add(user)
    db.flush()
    db.refresh(user)

    return user


# ====================================================================
# FIXTURES DE AUTENTICAÇÃO
# ====================================================================

@pytest.fixture(scope="function")
def auth_headers(test_user: User) -> dict:
    """
    Gera headers de autenticação para o test_user.
    
    Uso:
        def test_example(client, auth_headers):
            response = client.get("/api/devices", headers=auth_headers)
    """
    token = create_access_token(data={"sub": test_user.email})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(scope="function")
def admin_auth_headers(test_admin: User) -> dict:
    """
    Gera headers de autenticação para o test_admin.
    """
    token = create_access_token(data={"sub": test_admin.email})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(scope="function")
def second_user_auth_headers(second_user: User) -> dict:
    """
    Gera headers de autenticação para o second_user.
    """
    token = create_access_token(data={"sub": second_user.email})
    return {"Authorization": f"Bearer {token}"}


# ====================================================================
# FIXTURES AUXILIARES (para testes de rotinas)
# ====================================================================

@pytest.fixture(scope="function")
def sample_device(db: Session, test_user: User, client, auth_headers) -> dict:
    """
    Cria um dispositivo de exemplo via API.
    
    Útil para testes de rotinas que precisam de um device_id válido.
    """
    device_data = {
        "name": "Dispositivo Teste",
        "type": "tuya",
        "icon": "plug",
        "device_id": "test_device_123",
        "local_key": "test_key_456"
    }

    response = client.post(
        "/api/devices",
        json=device_data,
        headers=auth_headers
    )

    # Verifica se criou com sucesso
    assert response.status_code == 201, f"Falha ao criar device: {response.json()}"

    return response.json()["data"]


# ====================================================================
# DICAS DE USO
# ====================================================================
"""
COMO USAR NOS TESTES:

1. Teste simples sem autenticação:
   
   def test_health_check(client):
       response = client.get("/health")
       assert response.status_code == 200


2. Teste com autenticação:
   
   def test_list_devices(client, auth_headers):
       response = client.get("/api/devices", headers=auth_headers)
       assert response.status_code == 200


3. Teste que precisa do usuário diretamente:
   
   def test_user_email(test_user):
       assert test_user.email == "test@test.com"


4. Teste de isolamento entre usuários:
   
   def test_user_isolation(client, auth_headers, second_user_auth_headers):
       # User 1 cria um device
       response = client.post("/api/devices", json={...}, headers=auth_headers)
       device_id = response.json()["data"]["id"]
       
       # User 2 não deve conseguir acessar
       response = client.get(f"/api/devices/{device_id}", headers=second_user_auth_headers)
       assert response.status_code == 404


5. Teste que precisa de admin:
   
   def test_admin_only_action(client, admin_auth_headers):
       response = client.delete("/api/admin/clear-all", headers=admin_auth_headers)
       assert response.status_code == 200
"""