# API Documentation

The API is documented using OpenAPI 3.0.

## Access
- **Dev**: `http://localhost:8000/docs` (Swagger UI)
- **Prod**: `https://api.regai.com/docs`

## Versioning
- API is versioned via URL path `/api/v1/...`.
- Breaking changes require a new version `/api/v2/...`.
- Deprecation policy: 6 months notice.

## Authentication
Bearer Token (JWT) required for all endpoints except `/auth/login` and `/healthz`.
