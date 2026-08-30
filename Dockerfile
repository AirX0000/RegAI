# Multi-stage production build for Railway / Cloud PaaS
# ------------------------------------------------------------------------------
# Stage 1: Build React Frontend
# ------------------------------------------------------------------------------
FROM node:20-alpine AS frontend-builder
WORKDIR /frontend

COPY frontend/package*.json ./
RUN npm ci || npm install

COPY frontend/ ./
RUN npm run build

# ------------------------------------------------------------------------------
# Stage 2: Production Python Backend + Embedded Frontend
# ------------------------------------------------------------------------------
FROM python:3.12-slim
WORKDIR /app

# Install system dependencies (OCR, PDF rendering, curl)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    tesseract-ocr \
    tesseract-ocr-rus \
    tesseract-ocr-eng \
    poppler-utils \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application files, migrations, and seeds
COPY backend/app /app/app
COPY backend/alembic /app/alembic
COPY backend/alembic.ini /app/alembic.ini
COPY scripts /app/scripts

# Copy built frontend assets
COPY --from=frontend-builder /frontend/dist /app/frontend/dist

# Create non-root user & writable directories
RUN useradd -m -u 1000 appuser && \
    mkdir -p /app/chroma_db /app/data && \
    chown -R appuser:appuser /app

USER appuser

ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1
ENV PORT=8000
ENV CHROMA_DIR=/app/chroma_db

EXPOSE 8000

# Start command: executes migrations & demo seed, then launches uvicorn
CMD ["sh", "-c", "python /app/scripts/seed_demo_environment.py || true; uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
