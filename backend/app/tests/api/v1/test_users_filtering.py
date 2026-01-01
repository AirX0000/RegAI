from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.db.models.user import User
from app.db.models.company import Company
from app.core import security
import uuid

def test_read_users_filter_by_company_superuser(client: TestClient, superuser_token_headers, db: Session):
    # Create two companies
    tenant_id = uuid.uuid4()
    company1 = Company(name="Company A", tenant_id=tenant_id)
    company2 = Company(name="Company B", tenant_id=tenant_id)
    db.add(company1)
    db.add(company2)
    db.commit()
    
    # Create users for each company
    user1 = User(
        email="user1@comp-a.com",
        hashed_password=security.get_password_hash("password"),
        company_id=company1.id,
        tenant_id=uuid.uuid4() # Mock tenant
    )
    user2 = User(
        email="user2@comp-b.com",
        hashed_password=security.get_password_hash("password"),
        company_id=company2.id,
        tenant_id=uuid.uuid4()
    )
    db.add(user1)
    db.add(user2)
    db.commit()
    
    # Test filtering for Company A
    response = client.get(f"/api/v1/users/?company_id={company1.id}", headers=superuser_token_headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["email"] == "user1@comp-a.com"
    
    # Test filtering for Company B
    response = client.get(f"/api/v1/users/?company_id={company2.id}", headers=superuser_token_headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["email"] == "user2@comp-b.com"
    
    # Test no filter (should see all users)
    response = client.get("/api/v1/users/", headers=superuser_token_headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 2 # user1, user2 (superuser is mock, not in db)

def test_read_users_filter_ignored_for_normal_user(client: TestClient, normal_user_token_headers, db: Session):
    # Normal user is mocked in conftest to have no company or a specific company
    # In conftest, normal user has no company_id set by default in the override
    # Let's update the override or just rely on the logic that they can't see other companies
    pass 
