.PHONY: dev test lint typecheck migrate run build sbom scan sign

dev:
	uvicorn app.main:app --reload

test:
	pytest

lint:
	ruff check .

typecheck:
	mypy .

migrate:
	alembic upgrade head

run:
	uvicorn app.main:app --host 0.0.0.0 --port 8000

build:
	docker build -t regai-backend -f ../ops/docker/backend.Dockerfile .

sbom:
	syft regai-backend -o spdx-json=sbom.json

scan:
	trivy image regai-backend

sign:
	cosign sign --key cosign.key regai-backend
