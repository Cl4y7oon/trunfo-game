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

**Local apenas:**
```bash
npm run dev
```

**Para multiplayer na mesma rede (outros jogadores acessam pelo seu IP):**
```bash
npm run dev -- --host
```

O frontend estará disponível em `http://localhost:5173`.

---

## Ordem de inicialização

1. **Inicie o backend primeiro** (porta 8000)
2. **Depois inicie o frontend** (porta 5173)

O frontend faz chamadas à API em `/api/*` que são redirecionadas via proxy para o backend.

---

## Multiplayer na mesma rede

Para que outros jogadores na mesma rede Wi-Fi acessem o jogo:

1. **Inicie o frontend com `--host`:**
   ```bash
   cd frontend
   npm run dev -- --host
   ```

2. **Descubra seu IP local** (Windows PowerShell):
   ```powershell
   ipconfig |findstr IPv4
   ```
   Pegue o IP da sua rede (ex: `10.20.1.213`).

3. **Libere o firewall** (PowerShell como administrador, se necessário):
   ```powershell
   New-NetFirewallRule -DisplayName "Trunfo Game" -Direction Inbound -Protocol TCP -LocalPort 5173,8000 -Action Allow
   ```

4. **Passe o endereço para os outros jogadores:**
   ```
   http://SEU_IP_LOCAL:5173
   ```
   Exemplo: `http://10.20.1.213:5173`

Cada jogador digita seu nome na tela de login e entra no mesmo jogo pela lista do menu.

---

## Fluxo do jogo

1. **Cadastro de personagens** — Na tela de Personagens, cadastre nome e foto dos participantes
2. **Login** — Cada jogador digita seu nome
3. **Votação** — Antes de jogar, cada jogador vota nos atributos dos personagens (0 a 21)
4. **Menu** — Criar ou entrar em um jogo
5. **Jogo** — Cartas são distribuídas, cada round compara o atributo escolhido

---

## Scripts úteis

| Comando | Descrição |
|---|---|
| `uvicorn app.main:app --reload` | Inicia o backend com hot-reload |
| `cd frontend && npm run dev` | Inicia o frontend com hot-reload |
| `cd frontend && npm run dev -- --host` | Inicia o frontend acessível na rede |
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