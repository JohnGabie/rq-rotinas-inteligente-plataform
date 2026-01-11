#!/bin/bash

# Script de diagnóstico para identificar problemas
# Execute: bash backend/scripts/diagnostic.sh

cd "$(dirname "$0")/.."

echo "🔍 DIAGNÓSTICO DO SISTEMA"
echo "========================="
echo ""

# 1. Verificar Python e Venv
echo "1️⃣ Python e Ambiente Virtual"
echo "----------------------------"
if [ -d ".venv" ]; then
    echo "✅ Venv existe"
    source .venv/bin/activate
    echo "   Python: $(python --version)"
    echo "   Pip: $(pip --version)"
else
    echo "❌ Venv não encontrado"
fi
echo ""

# 2. Verificar Models
echo "2️⃣ Verificando Models"
echo "----------------------------"
echo "Verificando imports de UUID nos models..."
grep -n "UUID(as_uuid=True)" app/models/*.py 2>/dev/null
if [ $? -eq 0 ]; then
    echo "❌ Encontrados usos de UUID(as_uuid=True) - precisa corrigir"
else
    echo "✅ Nenhum UUID(as_uuid=True) encontrado"
fi
echo ""

echo "Verificando se GUID está sendo importado..."
for file in app/models/activity_log.py app/models/routine.py app/models/device.py; do
    if [ -f "$file" ]; then
        if grep -q "from backend.app.models.base import.*GUID" "$file"; then
            echo "✅ $file importa GUID"
        else
            echo "❌ $file NÃO importa GUID"
        fi
    fi
done
echo ""

# 3. Verificar base.py
echo "3️⃣ Verificando base.py"
echo "----------------------------"
if [ -f "app/models/base.py" ]; then
    if grep -q "class GUID" app/models/base.py; then
        echo "✅ Classe GUID existe em base.py"
    else
        echo "❌ Classe GUID NÃO existe em base.py"
    fi
else
    echo "❌ base.py não encontrado"
fi
echo ""

# 4. Verificar conftest.py
echo "4️⃣ Verificando conftest.py"
echo "----------------------------"
if [ -f "tests/conftest.py" ]; then
    echo "✅ conftest.py existe"
    if grep -q "sqlite" tests/conftest.py; then
        echo "   Usando: SQLite"
    elif grep -q "postgresql" tests/conftest.py; then
        echo "   Usando: PostgreSQL"
    fi
else
    echo "❌ conftest.py não encontrado"
fi
echo ""

# 5. Testar imports
echo "5️⃣ Testando Imports"
echo "----------------------------"
python << 'PYEOF'
import sys
sys.path.insert(0, '.')

try:
    from backend.app.models.base import GUID
    print("✅ GUID importado com sucesso")
except ImportError as e:
    print(f"❌ Erro ao importar GUID: {e}")

try:
    from backend.app.models.device import Device
    print("✅ Device importado com sucesso")
except Exception as e:
    print(f"❌ Erro ao importar Device: {e}")

try:
    from backend.app.models.routine import Routine
    print("✅ Routine importado com sucesso")
except Exception as e:
    print(f"❌ Erro ao importar Routine: {e}")

try:
    from backend.app.models.activity_log import ActivityLog
    print("✅ ActivityLog importado com sucesso")
except Exception as e:
    print(f"❌ Erro ao importar ActivityLog: {e}")
PYEOF
echo ""

# 6. Verificar dependências
echo "6️⃣ Dependências de Teste"
echo "----------------------------"
pip list | grep -E "pytest|sqlalchemy|fastapi" || echo "❌ Dependências não instaladas"
echo ""

# 7. Resumo
echo "📊 RESUMO"
echo "========================="
echo "Execute: cat erro_pytest"
echo "E me envie o conteúdo completo do erro"
echo ""