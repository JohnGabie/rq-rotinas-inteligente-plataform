"""
Script para criar usuário administrador
Execute: python scripts/create_admin.py
"""
import sys
import os

from app.core.database import SessionLocal
from app.crud.user import crud_user
from app.schemas.user import UserCreate
from app.models.enums import UserRole
from dotenv import load_dotenv

load_dotenv()

def create_admin():
    """Cria usuário admin padrão"""
    db = SessionLocal()

    try:
        # Verificar se já existe admin
        existing_admin = crud_user.get_by_email(db, email="admin@admin.com")

        if existing_admin:
            print("❌ Usuário admin já existe!")
            print(f"   Email: {existing_admin.email}")
            print(f"   Nome: {existing_admin.name}")
            return

        # Criar admin
        admin_data = UserCreate(
            email="joao.g.almeida1@gmail.com",
            name="Joao Gabriel(ADM)",
            password="joaog123",  # Senha padrão
            role=UserRole.ADMIN
        )

        admin = crud_user.create(db, obj_in=admin_data)

        print("✅ Usuário admin criado com sucesso!")
        print(f"   Email: {admin.email}")
        print(f"   Senha: admin")
        print(f"   Role: {admin.role}")
        print(f"   ID: {admin.id}")
        print("\n⚠️  ATENÇÃO: Troque a senha após o primeiro login!")

    except Exception as e:
        print(f"❌ Erro ao criar admin: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    print("\n" + "="*50)
    print("CRIAR USUÁRIO ADMINISTRADOR")
    print("="*50 + "\n")

    create_admin()