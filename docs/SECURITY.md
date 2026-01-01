# Security Architecture

## Threat Model (STRIDE)

| Threat | Mitigation |
|--------|------------|
| **Spoofing** | JWT Auth, OIDC, TLS everywhere. |
| **Tampering** | Signed commits, Immutable infrastructure, Audit logs. |
| **Repudiation** | Comprehensive Audit Logging (who, what, when). |
| **Information Disclosure** | RLS (Row Level Security), PII Redaction in RAG, Secrets management. |
| **Denial of Service** | Rate limiting (Token Bucket), WAF, Autoscaling. |
| **Elevation of Privilege** | RBAC, Least Privilege, Container non-root user. |

## Secrets Management
- **Dev**: `.env` files (gitignored).
- **Prod**: AWS Secrets Manager / HashiCorp Vault injected as env vars via K8s Secrets.

## Multi-Tenancy
- **Isolation**: Row Level Security (RLS) in Postgres.
- **Context**: `tenant_id` injected into every DB session.
- **RAG**: Separate Chroma collection per tenant `regai_<tenant_id>`.

## Compliance
- **GDPR**: Right to be forgotten implemented via user deletion + cascade.
- **Audit**: All write actions logged to `audit_logs` table.
