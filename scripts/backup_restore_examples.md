# Backup and Restore Examples

## Postgres Backup (Local)

```bash
# Dump the database
docker compose -f ops/compose/docker-compose.dev.yml exec -T postgres pg_dump -U postgres regai > backup_$(date +%Y%m%d).sql
```

## Postgres Restore (Local)

```bash
# Restore the database (WARNING: destructive)
cat backup_20240101.sql | docker compose -f ops/compose/docker-compose.dev.yml exec -T postgres psql -U postgres regai
```

## Chroma Snapshot

For Chroma, since we are using a persistent volume, you can back up the volume directory.

```bash
# Identify volume path
docker volume inspect regai_chroma_data
# Copy data
cp -r /var/lib/docker/volumes/regai_chroma_data/_data ./chroma_backup
```
