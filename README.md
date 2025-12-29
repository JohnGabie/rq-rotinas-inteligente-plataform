# 🔌 Rotina Inteligente

> Sistema de gerenciamento e agendamento de dispositivos inteligentes (IoT) e equipamentos de infraestrutura via Docker.

## 📖 Sobre o Projeto

Este projeto tem como objetivo centralizar o controle de dispositivos elétricos do escritório (Réguas de energia, Tomadas inteligentes e Ar-condicionado). O sistema roda em um ambiente **Docker**, garantindo que as rotinas de automação sejam executadas automaticamente assim que o servidor/PC é ligado.

O foco principal é a **Experiência do Usuário (UX)**: a interface deve permitir que qualquer membro da equipe (mesmo não-técnicos) consiga criar agendamentos e ligar/desligar equipamentos sem lidar com linhas de comando ou configurações complexas de rede.

## 🛠 Tech Stack

### Backend (Python)
Rodará no servidor principal e é responsável pela comunicação direta com o hardware.
* **Linguagem:** Python 3.10+
* **Framework Sugerido:** FastAPI ou Flask.
* **Protocolos:** * **Tuya API:** Para tomadas inteligentes Wi-Fi.
    * **SNMP:** Para réguas de energia gerenciáveis (PDU) e equipamentos legados.
* **Banco de Dados:** SQLite (Armazenamento local de rotinas e devices).

### Frontend (Foco do Desenvolvimento Atual)
Interface visual para controle e configuração.
* **Framework:** React, Vue.js ou tecnologia similar.
* **Requisito:** Interface responsiva e amigável.

### Infraestrutura
* **Docker & Docker Compose:** Orquestração dos containers.

---

## 🚀 Funcionalidades (Escopo)

1.  **Dashboard de Controle:**
    * Visualização em *Cards* de todos os dispositivos.
    * Feedback visual imediato (Verde = Ligado, Cinza = Desligado).
    * Botão de ação rápida (Toggle On/Off).
2.  **Gerenciamento de Dispositivos:**
    * Cadastro de novos devices (IP, Protocolo, Keys).
    * Edição e Remoção.
3.  **Rotinas e Agendamento (Core):**
    * Criação de regras: *SE [Gatilho] ENTÃO [Ação]*.
    * Gatilhos: Horário (Cron) ou Inicialização do Sistema (Boot).
    * Interface visual para seleção de dias da semana.

---

## ⚙️ Instalação e Execução

Como o projeto é containerizado, a inicialização é padronizada.

### Pré-requisitos
* Docker e Docker Compose instalados.
* Acesso à rede onde os dispositivos Tuya/SNMP estão conectados.

### Rodando o projeto

1.  **Clone o repositório:**
    ```bash
    git clone [https://github.com/seu-usuario/smart-office-scheduler.git](https://github.com/seu-usuario/smart-office-scheduler.git)
    cd smart-office-scheduler
    ```

2.  **Configuração de Ambiente (.env):**
    Crie um arquivo `.env` na raiz baseado no `.env.example`:
    ```env
    # Exemplo
    TUYA_REGION=us
    SNMP_COMMUNITY=public
    BACKEND_PORT=8000
    FRONTEND_PORT=3000
    ```

3.  **Subir os containers:**
    ```bash
    docker-compose up -d --build
    ```

4.  **Acessar a aplicação:**
    * Frontend: `http://localhost:3000`
    * API Docs (Swagger): `http://localhost:8000/docs`

---

## 📡 Estrutura da API (Para o Frontend)

O Frontend deve consumir a API Python. Abaixo, um exemplo da estrutura esperada dos endpoints:

| Método | Endpoint | Descrição |
| :--- | :--- | :--- |
| `GET` | `/api/devices` | Lista todos os dispositivos e seus status atuais. |
| `POST` | `/api/devices` | Adiciona um novo dispositivo (Tuya ou SNMP). |
| `POST` | `/api/control/{id}` | Envia comando `{ "state": "ON" }` para o dispositivo. |
| `GET` | `/api/routines` | Lista as rotinas de agendamento ativas. |
| `POST` | `/api/routines` | Cria uma nova rotina (Ex: Ligar ID 5 às 08:00). |

> **Nota para o Frontend:** Em caso de erro de conexão com o dispositivo (timeout no SNMP ou Tuya offline), a UI deve exibir uma mensagem amigável ("Dispositivo não responde") e não o erro bruto do backend.

---

## 📂 Estrutura de Pastas

```text
/
├── backend/            # Código Python (API + Workers)
│   ├── app/
│   ├── protocols/      # Drivers Tuya e SNMP
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/           # Código da Interface
│   ├── public/
│   ├── src/
│   └── Dockerfile
├── docker-compose.yml  # Orquestração
└── README.md
