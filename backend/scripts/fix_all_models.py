#!/usr/bin/env python3
"""
Script para corrigir todos os models para compatibilidade SQLite
Execute: python backend/scripts/fix_all_models.py
"""

import os
import re

def fix_file(filepath, replacements):
    """Aplica substituições em um arquivo"""
    if not os.path.exists(filepath):
        print(f"❌ Arquivo não encontrado: {filepath}")
        return False

    with open(filepath, 'r') as f:
        content = f.read()

    original = content

    for pattern, replacement in replacements:
        content = re.sub(pattern, replacement, content)

    if content != original:
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"✅ {filepath} corrigido")
        return True
    else:
        print(f"ℹ️  {filepath} já está correto")
        return False

def main():
    print("🔧 Corrigindo Models para SQLite")
    print("=" * 50)
    print()

    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    models_dir = os.path.join(base_dir, 'app', 'models')

    # 1. Corrigir imports em todos os models
    print("1️⃣ Corrigindo imports...")

    models_to_fix = [
        'activity_log.py',
        'routine.py',
        'device.py',
        'user.py'
    ]

    for model_file in models_to_fix:
        filepath = os.path.join(models_dir, model_file)

        replacements = [
            # Remover import de UUID do postgresql
            (r'from sqlalchemy\.dialects\.postgresql import UUID\n', ''),
            (r'from sqlalchemy\.dialects\.postgresql import UUID,', 'from sqlalchemy.dialects.postgresql import'),

            # Adicionar import de GUID se não existir
            (r'(from backend\.app\.models\.base import BaseModel)$',
             r'\1, GUID'),

            # Substituir UUID(as_uuid=True) por GUID()
            (r'UUID\(as_uuid=True\)', 'GUID()'),

            # Limpar imports vazios
            (r'from sqlalchemy\.dialects\.postgresql import\s*\n', ''),
        ]

        fix_file(filepath, replacements)

    print()
    print("2️⃣ Verificando base.py...")

    # Verificar se base.py tem GUID
    base_file = os.path.join(models_dir, 'base.py')

    with open(base_file, 'r') as f:
        base_content = f.read()

    if 'class GUID' not in base_content:
        print("❌ base.py não tem classe GUID!")
        print("   Adicione manualmente a classe GUID")
    else:
        print("✅ base.py tem classe GUID")

    print()
    print("3️⃣ Corrigindo routine.py (ARRAY)...")

    routine_file = os.path.join(models_dir, 'routine.py')

    # Manter import de ARRAY do PostgreSQL
    with open(routine_file, 'r') as f:
        routine_content = f.read()

    if 'from sqlalchemy.dialects.postgresql import ARRAY' not in routine_content:
        # Adicionar import de ARRAY
        routine_content = re.sub(
            r'(from sqlalchemy import.*)',
            r'\1\nfrom sqlalchemy.dialects.postgresql import ARRAY',
            routine_content,
            count=1
        )

        with open(routine_file, 'w') as f:
            f.write(routine_content)

        print("✅ Adicionado import de ARRAY")
    else:
        print("✅ Import de ARRAY já existe")

    print()
    print("✅ TODAS AS CORREÇÕES APLICADAS!")
    print()
    print("📋 Próximos passos:")
    print("   1. cd backend")
    print("   2. pytest -v")
    print()

if __name__ == '__main__':
    main()