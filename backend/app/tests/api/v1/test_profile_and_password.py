import pytest
import uuid
from app.core import security
from app.core.deps import get_current_active_user
from app.db.models.user import User
from app.main import app

def test_user_self_service_profile_and_password(db, client):
    # 1. Create a persistent user in db
    raw_pwd = "InitialPassword123!"
    user = User(
        id=uuid.uuid4(),
        email=f"profile_tester_{uuid.uuid4().hex[:6]}@regai.ai",
        hashed_password=security.get_password_hash(raw_pwd),
        full_name="Profile Tester",
        role="cfo",
        hierarchy_level=3,
        tenant_id=uuid.uuid4(),
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Set dependency override so requests resolve to this user
    app.dependency_overrides[get_current_active_user] = lambda: user

    try:
        # 2. Test update profile
        profile_resp = client.put(
            "/api/v1/users/me/profile",
            json={"full_name": "Updated CFO Name"}
        )
        assert profile_resp.status_code == 200
        assert profile_resp.json()["full_name"] == "Updated CFO Name"
        db.refresh(user)
        assert user.full_name == "Updated CFO Name"

        # 3. Test change password - wrong current password
        wrong_resp = client.put(
            "/api/v1/users/me/password",
            json={"current_password": "WrongPassword!", "new_password": "NewValidPassword123!"}
        )
        assert wrong_resp.status_code == 400
        assert "Incorrect current password" in wrong_resp.json()["detail"]

        # 4. Test change password - too short password
        short_resp = client.put(
            "/api/v1/users/me/password",
            json={"current_password": raw_pwd, "new_password": "short"}
        )
        assert short_resp.status_code == 400
        assert "at least 8 characters" in short_resp.json()["detail"]

        # 5. Test change password - success
        new_pwd = "BrandNewSecurePassword2026!"
        success_resp = client.put(
            "/api/v1/users/me/password",
            json={"current_password": raw_pwd, "new_password": new_pwd}
        )
        assert success_resp.status_code == 200
        data = success_resp.json()
        assert "access_token" in data
        assert data["message"] == "Password changed successfully"

        # Verify hashed_password was updated
        db.refresh(user)
        assert security.verify_password(new_pwd, user.hashed_password) is True
        assert security.verify_password(raw_pwd, user.hashed_password) is False

    finally:
        # Clean up dependency override
        app.dependency_overrides.pop(get_current_active_user, None)
