FROM python:3.12-slim

WORKDIR /app

# Install system dependencies
# libpq-dev is needed for psycopg if we weren't using binary, but we are using [binary].
# However, curl is good for healthchecks.
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY backend/app /app/app
COPY backend/alembic /app/alembic
COPY backend/alembic.ini /app/alembic.ini

# Create non-root user
RUN useradd -m -u 1000 appuser
USER appuser

# Environment variables
ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1

# Expose port
EXPOSE 8000

# Command
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
