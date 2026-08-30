#!/usr/bin/env bash
# ==============================================================================
# RegAI Production Deployment & Launch Script (VPS / Server)
# ==============================================================================
set -e

echo "======================================================================"
echo "🚀 Starting RegAI Enterprise Production Deployment..."
echo "======================================================================"

# 1. Check Docker & Docker Compose
if ! command -v docker &> /dev/null; then
    echo "📦 Docker not found. Installing Docker Engine..."
    curl -fsSL https://get.docker.com | sh
    sudo usermod -aG docker $USER || true
fi

# 2. Check if .env file exists; if not, generate cryptographically secure secrets
if [ ! -f .env ]; then
    echo "🔒 Generating secure production .env file with randomized secrets..."
    
    SECRET_KEY_GEN=$(openssl rand -hex 32 2>/dev/null || cat /proc/sys/kernel/random/uuid | tr -d '-')
    DB_PASS_GEN=$(openssl rand -hex 24 2>/dev/null || cat /proc/sys/kernel/random/uuid | tr -d '-')
    
    cat > .env <<EOL
PROJECT_NAME="RegAI Platform"
API_V1_STR="/api/v1"
SECRET_KEY="${SECRET_KEY_GEN}"
ACCESS_TOKEN_EXPIRE_MINUTES=60
JWT_ALGORITHM="HS256"

POSTGRES_USER=regai_admin
POSTGRES_PASSWORD=${DB_PASS_GEN}
POSTGRES_DB=regai_db
DATABASE_URL=postgresql://regai_admin:${DB_PASS_GEN}@postgres:5432/regai_db

FIRST_SUPERUSER_EMAIL=admin@techcorp.com
FIRST_SUPERUSER_PASSWORD=AdminSecurePassword2026!

EMBEDDINGS_PROVIDER=openai
OPENAI_API_KEY=
CHROMA_DIR=/app/chroma_db

RATE_LIMIT_PER_MINUTE=120
CORS_ORIGINS=["*"]
LOG_JSON=true
EOL
    echo "✅ .env generated successfully!"
fi

# 3. Pull and Build Containers
echo "🏗️  Building and launching Docker containers (Nginx, Backend, Postgres, ChromaDB)..."
docker compose down || true
docker compose up -d --build

# 4. Wait for PostgreSQL & Backend Health
echo "⏳ Waiting for database and backend services to initialize..."
sleep 10

# 5. Populate Demo Data & Companies if needed
echo "🌱 Initializing database schema and seeding demo companies/users..."
docker compose exec -T backend python /app/scripts/seed_demo_environment.py || true

# 6. Final Health Status
if docker compose ps | grep -q "Up"; then
    SERVER_IP=$(curl -s --max-time 3 ifconfig.me 2>/dev/null || echo "YOUR_SERVER_IP")
    echo "======================================================================"
    echo "🎉 RegAI IS UP AND RUNNING IN PRODUCTION MODE!"
    echo "======================================================================"
    echo "🌐 Web Access:       http://${SERVER_IP}"
    echo "📊 Healthcheck:      http://${SERVER_IP}/healthz"
    echo "📈 Metrics:          http://${SERVER_IP}/metrics"
    echo "----------------------------------------------------------------------"
    echo "🔑 READY-TO-USE TEST ACCOUNTS (Password: password123):"
    echo "  1. SuperAdmin:     admin@techcorp.com"
    echo "  2. Company Owner:  owner@techcorp.com"
    echo "  3. Accountant:     accountant@techcorp.com"
    echo "  4. Auditor:        auditor@techcorp.com"
    echo "======================================================================"
else
    echo "❌ Error starting containers. Please run 'docker compose logs' for diagnostics."
    exit 1
fi
