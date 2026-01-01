# Operations Runbook

## On-Call Procedures

### Severity Levels
- **SEV-1 (Critical)**: System down, data loss, security breach. SLA: 15m response.
- **SEV-2 (High)**: Major feature broken, performance degradation. SLA: 1h response.
- **SEV-3 (Medium)**: Minor bug, cosmetic issue. SLA: 24h response.

### Incident Response
1. Acknowledge alert in PagerDuty.
2. Check Grafana dashboards for anomalies.
3. Check logs in Kibana/Loki.
4. If DB issue, check RDS metrics.
5. If App issue, check pod status `kubectl get pods`.

## Backups & Restore

### Database (Postgres)
- Automated daily snapshots via RDS/AWS Backup.
- WAL-G for continuous archiving to S3.
- **Restore**: Point-in-time recovery (PITR) via AWS Console or Terraform.

### Vector Store (Chroma)
- Persistent volume snapshots.
- Nightly job to export collection data to S3.

## Key Rotation

Run the rotation script:
```bash
python scripts/rotate_jwt_keys.py
```
This generates a new secret key. Update `SECRET_KEY` in Vault/Secrets Manager and restart pods. Existing tokens will be invalid immediately (unless dual-key support is implemented).

## Scaling

### Horizontal Pod Autoscaler (HPA)
- Backend scales on CPU > 70% or Request Count.
- Configure in `ops/helm/regai/values.yaml`.

```yaml
resources:
  limits:
    cpu: 500m
    memory: 512Mi
  requests:
    cpu: 100m
    memory: 128Mi
```
