#!/bin/bash

# Define o diretório onde o script está localizado
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Define a raiz do backend (um nível acima da pasta tests)
BACKEND_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$BACKEND_ROOT"

echo "🧪 Rotina Inteligente - Test Suite"
echo "=================================="
echo "📍 Root: $BACKEND_ROOT"

# 1. Tenta ativar o venv usando caminho relativo
if [ -f ".venv/bin/activate" ]; then
    source .venv/bin/activate
elif [ -f "venv/bin/activate" ]; then
    source venv/bin/activate
else
    echo "❌ Erro: Ambiente virtual (.venv ou venv) não encontrado na raiz: $BACKEND_ROOT"
    exit 1
fi

# 2. Garante que o Python encontre o pacote 'backend' ou 'app'
# Adiciona a pasta atual ao PYTHONPATH
export PYTHONPATH=$PYTHONPATH:$(pwd)

# 3. Opções de teste
case "$1" in
  "auth")
    echo "🔐 Testando Autenticação..."
    pytest tests/test_auth.py -v
    ;;
  "devices")
    echo "🔌 Testando Dispositivos..."
    pytest tests/test_devices.py -v
    ;;
  "routines")
    echo "🔄 Testando Rotinas..."
    pytest tests/test_routines.py -v
    ;;
  "coverage")
    echo "📊 Rodando testes com cobertura..."
    pytest --cov=app --cov-report=html --cov-report=term
    echo ""
    echo "📈 Relatório HTML gerado em: htmlcov/index.html"
    ;;
  "fast")
    echo "⚡ Rodando testes rápidos..."
    pytest -q
    ;;
  "")
    echo "🚀 Rodando todos os testes..."
    pytest tests/ -v --tb=short
    ;;
  *)
    echo "❌ Opção inválida: $1"
    echo ""
    echo "Uso: ./run_tests.sh [auth|devices|routines|coverage|fast]"
    exit 1
    ;;
esac

EXIT_CODE=$?

echo ""
if [ $EXIT_CODE -eq 0 ]; then
  echo "✅ Todos os testes passaram!"
else
  echo "❌ Alguns testes falharam (código: $EXIT_CODE)"
fi

exit $EXIT_CODE