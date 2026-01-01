# 1. Multi-Tenancy via RLS

Date: 2024-01-01

## Status
Accepted

## Context
We need to serve multiple B2B tenants securely.

## Decision
We will use Postgres Row Level Security (RLS) to enforce tenant isolation at the database layer.

## Consequences
- **Positive**: Strong guarantee of isolation; difficult for app bugs to leak data.
- **Negative**: Requires Postgres specific features; slightly more complex migration testing.
