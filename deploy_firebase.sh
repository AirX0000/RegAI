#!/usr/bin/env bash
# ==============================================================================
# RegAI Firebase Deployment Script
# Supports:
# 1) Firebase Hosting for Vite/React Frontend SPA
# 2) Full-Stack Deployment: Frontend on Firebase Hosting + Backend on Google Cloud Run
# ==============================================================================
set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo -e "${BLUE}======================================================================${NC}"
echo -e "${BLUE}🔥 RegAI Platform: Firebase Deployment Assistant${NC}"
echo -e "${BLUE}======================================================================${NC}"

# 1. Check Node.js and npm
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js (v18+) to continue.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js detected: $(node -v)${NC}"

# 2. Check Firebase CLI
FIREBASE_CMD="firebase"
if ! command -v firebase &> /dev/null; then
    echo -e "${YELLOW}⚠️  Firebase CLI not found globally. Using 'npx -y firebase-tools@latest'...${NC}"
    FIREBASE_CMD="npx -y firebase-tools@latest"
else
    echo -e "${GREEN}✓ Firebase CLI detected: $(firebase --version)${NC}"
fi

# 3. Check / Prompt Firebase Project ID
PROJECT_ID=""
if [ -n "$1" ]; then
    PROJECT_ID="$1"
fi

if [ -z "$PROJECT_ID" ]; then
    # Check if configured in .firebaserc
    if [ -f ".firebaserc" ]; then
        EXISTING_DEFAULT=$(grep '"default"' .firebaserc | head -n1 | cut -d '"' -f 4)
        if [ -n "$EXISTING_DEFAULT" ] && [ "$EXISTING_DEFAULT" != "regai-platform" ]; then
            PROJECT_ID="$EXISTING_DEFAULT"
        fi
    fi
fi

if [ -z "$PROJECT_ID" ]; then
    echo ""
    echo -e "${YELLOW}Please enter your Firebase Project ID (from Firebase Console):${NC}"
    read -r -p "Project ID: " PROJECT_ID
fi

if [ -z "$PROJECT_ID" ]; then
    echo -e "${RED}❌ Project ID cannot be empty. Aborting.${NC}"
    exit 1
fi

echo -e "${BLUE}🎯 Target Firebase Project:${NC} ${GREEN}${PROJECT_ID}${NC}"

# Update .firebaserc with user's project ID
cat > .firebaserc <<EOL
{
  "projects": {
    "default": "${PROJECT_ID}"
  }
}
EOL

if [ -f "frontend/.firebaserc" ]; then
    cp .firebaserc frontend/.firebaserc
fi

# 4. Optional: Backend API URL configuration
echo ""
echo -e "${BLUE}Do you want to specify a custom Backend API URL, or use Firebase Hosting rewrites (/api/v1)?${NC}"
echo "1) Use relative URL '/api/v1' (Recommended for Cloud Run / Firebase rewrites or same-domain proxy)"
echo "2) Enter custom backend URL (e.g. https://your-backend.railway.app/api/v1 or https://regai-api.run.app/api/v1)"
read -r -p "Choice [1/2] (default 1): " API_CHOICE

if [ "$API_CHOICE" == "2" ]; then
    read -r -p "Enter full Backend API URL (ending in /api/v1): " CUSTOM_API_URL
    if [ -n "$CUSTOM_API_URL" ]; then
        echo "VITE_API_URL=${CUSTOM_API_URL}" > frontend/.env.production
        echo "VITE_SSO_ENABLED=false" >> frontend/.env.production
        echo -e "${GREEN}✓ Configured frontend/.env.production with: ${CUSTOM_API_URL}${NC}"
    fi
else
    echo "VITE_API_URL=/api/v1" > frontend/.env.production
    echo "VITE_SSO_ENABLED=false" >> frontend/.env.production
    echo -e "${GREEN}✓ Configured frontend/.env.production with relative path: /api/v1${NC}"
fi

# 5. Build React Frontend
echo ""
echo -e "${BLUE}📦 Building React Frontend (Vite + TypeScript)...${NC}"
cd frontend
npm ci || npm install
npm run build
cd ..
echo -e "${GREEN}✓ Frontend build complete: frontend/dist/${NC}"

# 6. Deploy to Firebase
echo ""
echo -e "${BLUE}🚀 Deploying to Firebase Hosting...${NC}"
$FIREBASE_CMD deploy --only hosting --project "${PROJECT_ID}"

echo ""
echo -e "${GREEN}======================================================================${NC}"
echo -e "${GREEN}🎉 DEPLOYMENT TO FIREBASE HOSTING COMPLETE!${NC}"
echo -e "${GREEN}======================================================================${NC}"
echo -e "🌐 Your application is live at:"
echo -e "   ${BLUE}https://${PROJECT_ID}.web.app${NC}"
echo -e "   ${BLUE}https://${PROJECT_ID}.firebaseapp.com${NC}"
echo ""
echo -e "${YELLOW}ℹ️  Backend Deployment Note:${NC}"
echo "If your backend runs on Google Cloud Run, ensure the service name is 'regai-backend'"
echo "in region 'us-central1' (configured in firebase.json), or update firebase.json rewrites."
echo "To deploy the backend to Cloud Run, run:"
echo "   gcloud run deploy regai-backend --source . --region us-central1 --allow-unauthenticated"
echo "======================================================================"
