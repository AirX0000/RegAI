# 2. OIDC SSO

Date: 2024-01-01

## Status
Accepted

## Context
Enterprise customers require Single Sign-On (SSO) integration.

## Decision
We will support OIDC (OpenID Connect) for SSO. We will not implement SAML directly but recommend an OIDC bridge (like Dex or Keycloak) if SAML is strictly required.

## Consequences
- **Positive**: Standard, modern protocol; easier to implement than SAML.
- **Negative**: Some legacy enterprises might demand native SAML.
