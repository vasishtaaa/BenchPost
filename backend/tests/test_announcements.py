import uuid
from datetime import datetime, timezone, timedelta
import pytest
from fastapi.testclient import TestClient

def get_auth_token(client: TestClient, email="student@campusloop.edu", password="Student@123456"):
    resp = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    return resp.json()["access_token"]

def get_faculty_token(client: TestClient):
    resp = client.post("/api/v1/auth/login", json={"email": "faculty@campusloop.edu", "password": "Faculty@123456"})
    return resp.json()["access_token"]

def test_list_and_filter_announcements(client: TestClient):
    token = get_auth_token(client)
    resp = client.get("/api/v1/announcements", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    data = resp.json()
    assert "total" in data
    assert "items" in data
    assert data["total"] >= 1
    # Check that urgent midterm announcement is present
    titles = [a["title"] for a in data["items"]]
    assert any("Spring Midterm" in t for t in titles)

def test_create_announcement_role_guard(client: TestClient):
    student_token = get_auth_token(client)
    faculty_token = get_faculty_token(client)

    payload = {
        "title": f"Department Meeting {uuid.uuid4().hex[:6]}",
        "content": "All CSE students must assemble in the seminar hall at 3 PM.",
        "priority": "HIGH",
        "scope": "DEPARTMENT",
        "target_department": "Computer Science & Engineering"
    }

    # Student cannot publish announcements
    fail_resp = client.post(
        "/api/v1/announcements",
        json=payload,
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert fail_resp.status_code == 403

    # Faculty can publish announcements
    success_resp = client.post(
        "/api/v1/announcements",
        json=payload,
        headers={"Authorization": f"Bearer {faculty_token}"}
    )
    assert success_resp.status_code == 201
    assert success_resp.json()["title"] == payload["title"]
    assert success_resp.json()["priority"] == "HIGH"

def test_mark_announcement_as_read(client: TestClient):
    student_token = get_auth_token(client)
    list_resp = client.get("/api/v1/announcements", headers={"Authorization": f"Bearer {student_token}"})
    assert list_resp.status_code == 200
    ann_id = list_resp.json()["items"][0]["id"]

    # Mark as read
    read_resp = client.post(
        f"/api/v1/announcements/{ann_id}/read",
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert read_resp.status_code == 200
    assert read_resp.json()["is_read"] is True
