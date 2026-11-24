import uuid
import pytest
from fastapi.testclient import TestClient

def test_register_student(client: TestClient):
    uid = str(uuid.uuid4())[:8]
    payload = {
        "email": f"student_{uid}@campusloop.edu",
        "password": "Password123!",
        "full_name": "New Student",
        "student_id": f"ID_{uid}",
        "department": "Computer Science & Engineering",
        "course": "B.Tech CSE",
        "academic_year": 3,
        "role": "STUDENT"
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == f"student_{uid}@campusloop.edu"
    assert data["user"]["role"] == "STUDENT"
    assert data["user"]["profile"]["full_name"] == "New Student"

def test_register_duplicate_email(client: TestClient):
    payload = {
        "email": "student@campusloop.edu",  # seeded email
        "password": "Password123!",
        "full_name": "Duplicate Student",
        "role": "STUDENT"
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 400
    assert "already exists" in response.json()["detail"]

def test_login_success(client: TestClient):
    payload = {
        "email": "student@campusloop.edu",
        "password": "Student@123456"
    }
    response = client.post("/api/v1/auth/login", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["role"] == "STUDENT"

def test_login_invalid_password(client: TestClient):
    payload = {
        "email": "student@campusloop.edu",
        "password": "WrongPassword999"
    }
    response = client.post("/api/v1/auth/login", json=payload)
    assert response.status_code == 401
    assert "Incorrect email or password" in response.json()["detail"]

def test_get_current_user_me(client: TestClient):
    login_resp = client.post("/api/v1/auth/login", json={
        "email": "student@campusloop.edu",
        "password": "Student@123456"
    })
    token = login_resp.json()["access_token"]

    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "student@campusloop.edu"
    assert data["profile"]["full_name"] == "Aarav Vasishta"

def test_update_profile(client: TestClient):
    login_resp = client.post("/api/v1/auth/login", json={
        "email": "student@campusloop.edu",
        "password": "Student@123456"
    })
    token = login_resp.json()["access_token"]

    update_payload = {
        "bio": "Updated bio for testing purposes.",
        "academic_year": 4
    }
    response = client.put(
        "/api/v1/users/profile",
        json=update_payload,
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["bio"] == "Updated bio for testing purposes."
    assert data["academic_year"] == 4

def test_change_password(client: TestClient):
    uid = str(uuid.uuid4())[:8]
    temp_email = f"temp_{uid}@campusloop.edu"
    reg_resp = client.post("/api/v1/auth/register", json={
        "email": temp_email,
        "password": "OriginalPassword1!",
        "full_name": "Temp User",
        "role": "STUDENT"
    })
    assert reg_resp.status_code == 201
    token = reg_resp.json()["access_token"]

    change_resp = client.post(
        "/api/v1/auth/change-password",
        json={
            "old_password": "OriginalPassword1!",
            "new_password": "BrandNewPassword2@"
        },
        headers={"Authorization": f"Bearer {token}"}
    )
    assert change_resp.status_code == 200

    fail_login = client.post("/api/v1/auth/login", json={
        "email": temp_email,
        "password": "OriginalPassword1!"
    })
    assert fail_login.status_code == 401

    succ_login = client.post("/api/v1/auth/login", json={
        "email": temp_email,
        "password": "BrandNewPassword2@"
    })
    assert succ_login.status_code == 200
