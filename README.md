<div align="center">

# ⚡ RQ Rotinas Inteligente

### Plataforma de Automação e Gerenciamento de Dispositivos IoT

[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.128-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)

> Automatize, monitore e controle seus dispositivos inteligentes em um único lugar — em tempo real.

</div>

---

## 📖 Sobre o Projeto

Ambientes com múltiplos dispositivos inteligentes — seja em uma empresa, home office ou laboratório — rapidamente se tornam difíceis de gerenciar. Ligar e desligar equipamentos manualmente, criar sequências de ações repetitivas e monitorar o status de cada dispositivo individualmente é um processo cansativo e propenso a erros.

**RQ Rotinas Inteligente** nasceu para resolver exatamente esse problema. A plataforma centraliza o controle de dispositivos IoT (compatíveis com **Tuya** e **SNMP**) e permite criar **rotinas automatizadas** com lógica de gatilhos avançada — tudo através de uma interface moderna, intuitiva e responsiva.

Com ela, você define uma vez e o sistema executa sempre: no horário certo, quando um dispositivo muda de estado, quando outra rotina termina, ou sob demanda com um clique.

---

## ✨ Funcionalidades

### 🔌 Gerenciamento de Dispositivos
- Suporte a dispositivos **Tuya** (tomadas, lâmpadas, ventiladores, monitores, TVs e muito mais)
- Suporte a dispositivos **SNMP** (unidades de gerenciamento de energia em rede)
- Monitoramento de status em **tempo real** (online/offline)
- Controle individual de energia (ligar/desligar)
- **Master Switch** para controlar todos os dispositivos simultaneamente
- Categorização com mais de 13 tipos de ícones

### 🤖 Motor de Rotinas Automatizadas
- **4 tipos de gatilho:**
  - 🕐 **Agendamento** — execução em horário e dias específicos da semana
  - 👆 **Manual** — acionamento sob demanda com um clique
  - 🔗 **Encadeamento** — executa quando outra rotina é concluída
  - 📡 **Estado do dispositivo** — dispara quando um device liga ou desliga
- Ações sequenciais com **delays configuráveis** entre cada etapa
- **Cooldown** entre execuções para evitar disparos repetidos
- Histórico completo de execuções por rotina

### 📊 Analytics e Monitoramento
- Dashboard com **gráficos de uso** por dispositivo
- Linha do tempo de eventos e histórico de atividades
- **65+ tipos de eventos** rastreados nos logs de auditoria
- Indicador de status da conexão WebSocket em tempo real

### 🔐 Autenticação e Controle de Acesso
- Autenticação via **JWT** (JSON Web Tokens)
- Controle de acesso por papel: **Administrador** e **Usuário**
- Isolamento de dados por usuário (cada usuário vê apenas seus próprios dispositivos e rotinas)
- Interface de gerenciamento de usuários para administradores

### ⚡ Tempo Real
- Sincronização instantânea via **WebSocket**
- Atualização automática do estado dos dispositivos sem recarregar a página
- Recuperação automática de estado após reinicialização do sistema

---

## 🛠️ Tecnologias

### Frontend
| Tecnologia | Versão | Finalidade |
|---|---|---|
| **React** | 18.3 | Framework de interface |
| **TypeScript** | 5.8 | Tipagem estática |
| **Vite** | 5.4 | Build tool e dev server |
| **Tailwind CSS** | 3.4 | Estilização utilitária |
| **shadcn/ui** | — | Componentes de UI (Radix UI) |
| **Framer Motion** | 12.23 | Animações fluidas |
| **TanStack Query** | 5.83 | Gerenciamento de estado assíncrono |
| **React Router** | 6.30 | Roteamento SPA |
| **Recharts** | 2.15 | Gráficos e visualizações |
| **React Hook Form + Zod** | — | Formulários com validação |
| **dnd-kit** | 6.3 | Drag-and-drop para reordenar ações |

### Backend
| Tecnologia | Versão | Finalidade |
|---|---|---|
| **FastAPI** | 0.128 | Framework de API REST |
| **Python** | 3.11+ | Linguagem do servidor |
| **PostgreSQL** | 15 | Banco de dados relacional |
| **SQLAlchemy** | 1.4 | ORM e mapeamento de dados |
| **Alembic** | 1.17 | Migrações de banco de dados |
| **APScheduler** | 3.11 | Agendamento de rotinas por horário |
| **WebSockets** | 12.0 | Comunicação em tempo real |
| **JWT (Python-Jose)** | 3.5 | Autenticação segura |
| **tinytuya** | 1.13 | Integração com dispositivos Tuya |
| **pyasn1** | 0.6 | Protocolo SNMP |
| **slowapi** | 0.1.9 | Rate limiting da API |

### Infraestrutura
| Tecnologia | Finalidade |
|---|---|
| **Docker + Docker Compose** | Containerização e orquestração |
| **Nginx** | Servidor web e proxy reverso para o frontend |
| **Uvicorn + uvloop** | Servidor ASGI de alta performance |

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────┐
│                  Usuário / Navegador                │
└───────────────────────┬─────────────────────────────┘
                        │ HTTP / WebSocket
┌───────────────────────▼─────────────────────────────┐
│            Nginx (porta 8080)                       │
│         Arquivos estáticos + Proxy reverso          │
└───────────────────────┬─────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────┐
│           FastAPI Backend (porta 8000)              │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────┐ │
│  │  API REST    │  │  WebSocket   │  │ Scheduler │ │
│  │  /api/v1     │  │  /ws         │  │ APScheduler│ │
│  └──────────────┘  └──────────────┘  └───────────┘ │
│  ┌──────────────────────────────────────────────┐   │
│  │         Serviços de Integração               │   │
│  │   Tuya Service  │  SNMP Service              │   │
│  └──────────────────────────────────────────────┘   │
└───────────────────────┬─────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────┐
│           PostgreSQL (porta 5432)                   │
│         Persistência e histórico de dados           │
└─────────────────────────────────────────────────────┘
```

---

## 🚀 Como Instalar e Usar

### Pré-requisitos

Antes de começar, garanta que você tem instalado:

- [Docker](https://www.docker.com/get-started) e [Docker Compose](https://docs.docker.com/compose/install/) (v2+)
- Credenciais da **Tuya Open Platform** (se for usar dispositivos Tuya)
  - `TUYA_ACCESS_ID`
  - `TUYA_ACCESS_KEY`

### 1. Clone o repositório

```bash
git clone https://github.com/JohnGabie/rq-rotinas-inteligente-plataform.git
cd rq-rotinas-inteligente-plataform
```

### 2. Configure as variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto com base no exemplo abaixo:

```env
# Banco de dados
POSTGRES_USER=postgres
POSTGRES_PASSWORD=sua_senha_aqui
POSTGRES_DB=rq_rotinas

# Backend
SECRET_KEY=sua_chave_secreta_jwt_aqui
DATABASE_URL=postgresql://postgres:sua_senha_aqui@db:5432/rq_rotinas

# Tuya (opcional — necessário apenas para dispositivos Tuya)
TUYA_ACCESS_ID=seu_access_id
TUYA_ACCESS_KEY=seu_access_key
TUYA_API_ENDPOINT=https://openapi.tuyabr.com
```

### 3. Suba os containers com Docker Compose

```bash
docker compose up -d --build
```

Aguarde todos os serviços iniciarem. Você pode acompanhar os logs com:

```bash
docker compose logs -f
```

### 4. Execute as migrações do banco de dados

Na primeira execução, aplique as migrações para criar as tabelas:

```bash
docker compose exec backend alembic upgrade head
```

### 5. Acesse a plataforma

Abra o navegador e acesse:

```
http://localhost:8080
```

Na primeira vez, crie uma conta de administrador pela tela de login e comece a cadastrar seus dispositivos e rotinas.

---

## 📁 Estrutura do Projeto

```
rq-rotinas-inteligente-plataform/
│
├── src/                        # Frontend React + TypeScript
│   ├── components/             # Componentes de UI reutilizáveis
│   │   ├── DeviceCard.tsx      # Cartão de controle de dispositivo
│   │   ├── RoutineWizard.tsx   # Assistente de criação de rotinas
│   │   ├── ActivityLogPanel.tsx# Painel de log de atividades
│   │   ├── HistoryDashboard.tsx# Dashboard de analytics
│   │   └── ui/                 # Biblioteca de componentes base (shadcn)
│   ├── hooks/                  # Hooks customizados (devices, routines, auth)
│   ├── contexts/               # Contextos globais (Auth, Notificações)
│   ├── lib/api/                # Cliente HTTP e tipos da API
│   └── pages/                  # Páginas da aplicação
│
├── backend/                    # API FastAPI + Python
│   └── app/
│       ├── api/v1/             # Endpoints REST (auth, devices, routines...)
│       ├── models/             # Modelos SQLAlchemy (User, Device, Routine...)
│       ├── services/           # Lógica de negócio (Tuya, SNMP, Scheduler...)
│       ├── crud/               # Operações de banco de dados
│       ├── schemas/            # Schemas Pydantic (validação de dados)
│       └── websocket/          # Gerenciador de conexões WebSocket
│
├── docker-compose.yml          # Orquestração dos serviços
├── Dockerfile                  # Build do frontend
├── nginx.conf                  # Configuração do servidor web
└── backend/Dockerfile          # Build do backend
```

---

## 👨‍💻 Autor

<div align="center">

Feito com dedicação por **João Gabie**

[![GitHub](https://img.shields.io/badge/GitHub-JohnGabie-181717?style=for-the-badge&logo=github)](https://github.com/JohnGabie)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Conectar-0A66C2?style=for-the-badge&logo=linkedin)](https://linkedin.com/in/joaogabie)

</div>

---

<div align="center">

**Se este projeto foi útil, deixe uma ⭐ no repositório!**

</div>
