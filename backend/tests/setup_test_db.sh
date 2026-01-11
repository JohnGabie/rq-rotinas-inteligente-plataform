#!/bin/bash

# Script para configurar banco de dados de teste
# Usage: ./scripts/setup_test_db.sh

echo "🗄️  Configurando banco de teste..."
echo ""

# Verificar se Docker está rodando
if ! docker ps | grep -q rotina_inteligente_db; then
    echo "❌ Container PostgreSQL não está rodando!"
    echo "   Execute: docker-compose up -d"
    exit 1
fi

# Dropar banco de teste se existir
echo "🗑️  Removendo banco de teste antigo (se existir)..."
docker exec -it rotina_inteligente_db psql -U rotina_user -d postgres -c "DROP DATABASE IF EXISTS rotina_inteligente_test;" 2>/dev/null

# Criar banco de teste
echo "📦 Criando banco de teste..."
docker exec -it rotina_inteligente_db psql -U rotina_user -d postgres -c "CREATE DATABASE rotina_inteligente_test;"

# Verificar se foi criado
if docker exec -it rotina_inteligente_db psql -U rotina_user -d postgres -c "\l" | grep -q rotina_inteligente_test; then
    echo ""
    echo "✅ Banco de teste criado com sucesso!"
    echo "   Database: rotina_inteligente_test"
    echo "   Host: localhost:5432"
    echo "   User: rotina_user"
    echo ""
    echo "🧪 Agora você pode rodar os testes:"
    echo "   ./run_tests.sh"
else
    echo ""
    echo "❌ Erro ao criar banco de teste"
    exit 1
fi