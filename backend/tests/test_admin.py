import pytest
from fastapi.testclient import TestClient

def get_student_token(client: TestClient):
    resp = client.post("/api/v1/auth/login", json={"email": "student@campusloop.edu", "password": "Student@123456"})
    return resp.json()["access_token"]

def get_admin_token(client: TestClient):
    resp = client.post("/api/v1/auth/login", json={"email": "admin@campusloop.edu", "password": "Admin@123456"})
    return resp.json()["access_token"]

def test_admin_analytics_metrics(client: TestClient):
    admin_token = get_admin_token(client)
    resp = client.get("/api/v1/admin/analytics", headers={"Authorization": f"Bearer {admin_token}"})
    assert resp.status_code == 200
    data = resp.json()

    assert "total_users" in data
    assert data["total_users"] >= 3
    assert data["role_distribution"]["students"] >= 1
    assert data["role_distribution"]["faculty"] >= 1
    assert data["role_distribution"]["admins"] >= 1
    assert data["total_communities"] >= 1
    assert data["total_posts"] >= 1
    assert data["total_events"] >= 1
    assert data["total_announcements"] >= 1

def test_student_forbidden_from_admin_analytics(client: TestClient):
    student_token = get_student_token(client)
    resp = client.get("/api/v1/admin/analytics", headers={"Authorization": f"Bearer {student_token}"})
    assert resp.status_code == 403

def test_admin_users_list_and_audit_trail(client: TestClient):
    admin_token = get_admin_token(client)

    # List users
    users_resp = client.get("/api/v1/admin/users", headers={"Authorization": f"Bearer {admin_token}"})
    assert users_resp.status_code == 200
    assert users_resp.json()["total"] >= 3

    # Audit logs
    audit_resp = client.get("/api/v1/admin/audit-logs", headers={"Authorization": f"Bearer {admin_token}"})
    assert audit_resp.status_code == 200
    assert "items" in audit_resp.json()
