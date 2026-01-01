# RegAI: Smart Compliance Assistant

# 🦅 RegAI: The System of Intelligence for Compliance & Audit

**RegAI** is an enterprise-grade platform that bridges the gap between legacy ERPs (like 1C:Enterprise) and modern, AI-driven financial operations. It acts as an **Intelligence Layer**, automating the transformation of local accounting standards (MCFO) to International Standards (IFRS) and providing real-time compliance monitoring.

![Dashboard Preview](https://via.placeholder.com/800x450?text=Modern+Personalized+Dashboard+Preview)

## 🚀 Key Features

### 🧠 Smart Intelligence Layer
*   **MCFO ↔ IFRS Transformation**: Automated conversion of balance sheets with adjustable AI logic.
*   **Compliance Health**: Real-time scoring based on thousands of active regulations (Tax, GAAP, IFRS).
*   **1C Sync Status**: Live integration monitoring with legacy systems.

### 🎨 Personalized Experience
*   **Smart Dashboard**: Users can customize their workspace, hiding/reordering widgets based on their role (Auditor vs. Accountant).
*   **Audit Trail**: Every action is logged and searchable for complete transparency.

## 0) Quick Start (MANDATORY)

Follow these steps to go from a brand-new machine to a running product.

### 1) Prereqs install

**macOS**
```bash
# Install Homebrew if not present
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install dependencies
brew install git python@3.12 node@20 pnpm docker mkcert libpq

# Start Docker Desktop manually from Applications

# Verify versions
python3.12 --version  # Python 3.12.x
node --version        # v20.x.x
docker --version      # Docker version ...
mkcert -install
```

**Ubuntu**
```bash
sudo apt-get update
sudo apt-get install -y git python3.12 python3.12-venv nodejs npm docker.io docker-compose-plugin libpq-dev

# Verify versions
python3.12 --version
node --version
docker --version
```

### 2) Clone & bootstrap

```bash
git clone https://github.com/yourorg/regai.git
cd regai

# Backend Setup
cd backend
python3.12 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Create .env
cp .env.example .env
# Edit .env if needed, the defaults work for local dev with SQLite
# For Postgres dev:
# DATABASE_URL="postgresql://postgres:postgres@localhost:5432/regai"
```

### 3) Database & migrations

**Local Dev (SQLite)**
```bash
# In backend/ directory with venv active
alembic upgrade head
# Output should show: Running upgrade ... -> ...
```

**Docker Compose (Postgres)**
```bash
# From root
docker compose -f ops/compose/docker-compose.dev.yml up -d postgres
# Wait for DB to be ready
cd backend
alembic upgrade head
```

**Troubleshooting**:
- If `alembic` fails with `ModuleNotFoundError`, ensure `venv` is active.
- If `bcrypt` error regarding 72 bytes, ensure you are not using an extremely long password in `.env`.

### 4) Admin bootstrap

```bash
# From root
export PYTHONPATH=$PYTHONPATH:$(pwd)/backend
python backend/scripts/gen_admin.py --email admin@example.com --password 'ChangeMe123!' --tenant 'Acme Inc'

# Expected Output:
# Tenant 'Acme Inc' created (or found).
# Superuser 'admin@example.com' created successfully.
```

### 5) Run dev

**Backend**
```bash
# In backend/
uvicorn app.main:app --reload
# Logs should show: Uvicorn running on http://127.0.0.1:8000
```

**Frontend**
```bash
cd frontend
npm install
npm run dev
# Vite should show: Local: http://localhost:5173/
```

**Smoke Tests**
```bash
curl http://localhost:8000/healthz
# {"status":"ok"}
```

### 6) Docker Compose dev

```bash
# From root
docker compose -f ops/compose/docker-compose.dev.yml up --build
```
Services:
- Backend: http://localhost:8000
- Frontend: http://localhost:5173
- Chroma: http://localhost:8001
- Postgres: localhost:5432

### 7) Run tests & coverage

```bash
cd backend
make test
# Should show passing tests and coverage report > 80%
```

### 8) Production quickstart (kind/minikube)

```bash
# Build images
docker build -t regai-backend:latest -f ops/docker/backend.Dockerfile .
docker build -t regai-frontend:latest -f ops/docker/frontend.Dockerfile .

# Load into kind (if using kind)
kind load docker-image regai-backend:latest
kind load docker-image regai-frontend:latest

# Deploy with Helm
helm upgrade --install regai ops/helm/regai --namespace regai --create-namespace
```

### 9) SSO toggle

Set `OIDC_ENABLED=true` in `backend/.env` and `VITE_SSO_ENABLED=true` in `frontend/.env`. Restart services. Login page will show "Login with SSO".

### 10) Backups (local demo)

See `scripts/backup_restore_examples.md`.

### 11) Troubleshooting index

- **CORS Errors**: Check `CORS_ORIGINS` in `.env`. It must be a valid JSON array string like `["http://localhost:5173"]`.
- **Alembic Env**: If `alembic` can't find `app`, set `PYTHONPATH`.
- **Node Lock**: If `npm install` fails, delete `node_modules` and `package-lock.json` and retry.

## Documentation

See `docs/` for detailed documentation:
- [Operations](docs/OPERATIONS.md)
- [Security](docs/SECURITY.md)
- [Architecture](docs/ARCHITECTURE.md)
- [API](docs/API.md)
