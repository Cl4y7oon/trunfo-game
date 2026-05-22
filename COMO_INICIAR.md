# Trunfo Game - Como Iniciar o Projeto

## Pré-requisitos

- **Python 3.11+**
- **Node.js 20+**
- **npm** (vem com o Node.js)

---

## Backend (FastAPI)

O backend roda na porta `8000` e usa SQLite como banco de dados (arquivo `trunfo.db` criado automaticamente).

### 1. Criar ambiente virtual

```bash
python -m venv venv
```

**Ativar no Windows (PowerShell):**
```powershell
.\venv\Scripts\Activate.ps1
```

> Se ocorrer erro de executor, rode primeiro:
> ```powershell
> Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
> ```

**Ativar no Windows (CMD):**
```cmd
venv\Scripts\activate.bat
```

**Ativar no Git Bash / Linux / Mac:**
```bash
source venv/bin/activate
```

**Ativar no Linux/Mac:**
```bash
source venv/bin/activate
```

### 2. Instalar dependências

```bash
pip install -r requirements.txt
```

### 3. Iniciar o servidor

```bash
uvicorn app.main:app --reload --port 8000
```

O backend estará disponível em `http://localhost:8000`.

A documentação interativa da API fica em `http://localhost:8000/docs`.

---

## Frontend (React + Vite)

O frontend roda na porta `5173` e já está configurado com proxy para `/api` apontando para o backend.

### 1. Entrar na pasta do frontend

```bash
cd frontend
```

### 2. Instalar dependências

```bash
npm install
```

### 3. Iniciar o servidor de desenvolvimento

```bash
npm run dev
```

O frontend estará disponível em `http://localhost:5173`.

---

## Ordem de inicialização

1. **Inicie o backend primeiro** (porta 8000)
2. **Depois inicie o frontend** (porta 5173)

O frontend faz chamadas à API em `/api/*` que são redirecionadas via proxy para o backend.

---

## Scripts úteis

| Comando | Descrição |
|---|---|
| `uvicorn app.main:app --reload` | Inicia o backend com hot-reload |
| `cd frontend && npm run dev` | Inicia o frontend com hot-reload |
| `cd frontend && npm run build` | Gera build de produção do frontend |
| `cd frontend && npm run lint` | Executa o linter no frontend |

---

## Estrutura do projeto

```
trunfo-game/
├── app/                    # Backend (FastAPI)
│   ├── main.py             # Entry point da API
│   ├── database.py         # Configuração SQLite
│   ├── models.py           # Modelos SQLAlchemy
│   ├── schemas.py          # Schemas Pydantic
│   ├── auth.py             # Autenticação JWT
│   ├── routers/            # Rotas da API
│   │   ├── users.py
│   │   ├── characters.py
│   │   ├── votes.py
│   │   └── game.py
│   └── services/
│       └── game_engine.py  # Lógica do jogo
├── frontend/               # Frontend (React + Vite + TypeScript)
│   ├── src/
│   ├── package.json
│   └── vite.config.ts      # Proxy /api → localhost:8000
├── requirements.txt        # Dependências Python
└── trunfo.db               # Banco SQLite (criado automaticamente)
```