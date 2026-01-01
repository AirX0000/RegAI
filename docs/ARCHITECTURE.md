# Architecture

## Overview

RegAI follows a clean architecture monorepo structure.

```mermaid
graph TD
    Client[Web Client (React)] --> LB[Load Balancer / Ingress]
    LB --> API[Backend API (FastAPI)]
    API --> DB[(Postgres DB)]
    API --> RAG[Chroma Vector Store]
    API --> LLM[OpenAI / LLM Provider]
    
    subgraph "Data Layer"
        DB
        RAG
    end
    
    subgraph "Service Layer"
        API
    end
```

## Components

- **Frontend**: React 18, Vite, Tailwind.
- **Backend**: FastAPI, Python 3.12.
- **Database**: Postgres 15 with RLS.
- **Vector Store**: ChromaDB.
- **Orchestration**: Kubernetes / Helm.

## Decision Records (ADR)

See `docs/ADR/` for architectural decisions.
