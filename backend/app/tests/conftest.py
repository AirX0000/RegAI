import pytest
from typing import Generator
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.db.session import Base
from app.core.deps import get_db, get_current_active_user, get_current_active_superuser
from app.db.models import User, TaxRate
from unittest.mock import patch

# Mock scheduler before importing app or running tests
patch('app.rag.scheduler.start_scheduler').start()

from app.main import app
from contextlib import asynccontextmanager

@asynccontextmanager
async def mock_lifespan(app):
    yield

app.router.lifespan_context = mock_lifespan

SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="session")
def db_engine():
    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def db(db_engine):
    connection = db_engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    yield session
    session.close()
    transaction.rollback()
    connection.close()

@pytest.fixture(scope="function")
def client(db) -> Generator:
    def override_get_db():
        try:
            yield db
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()

@pytest.fixture(scope="function")
def normal_user_token_headers(client):
    # Mock user authentication
    def override_get_current_active_user():
        return User(id="test_user_id", email="test@example.com", is_active=True)
    
    app.dependency_overrides[get_current_active_user] = override_get_current_active_user
    return {"Authorization": "Bearer test_token"}

@pytest.fixture(scope="function")
def superuser_token_headers(client):
    # Mock superuser authentication
    def override_get_current_active_superuser():
        import uuid
        return User(id=uuid.uuid4(), email="admin@example.com", is_active=True, is_superuser=True, role="superadmin")
    
    app.dependency_overrides[get_current_active_superuser] = override_get_current_active_superuser
    app.dependency_overrides[get_current_active_user] = override_get_current_active_superuser
    return {"Authorization": "Bearer admin_token"}
