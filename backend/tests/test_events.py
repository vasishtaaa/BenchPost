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

def test_list_events(client: TestClient):
    token = get_auth_token(client)
    resp = client.get("/api/v1/events", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    data = resp.json()
    assert "total" in data
    assert "items" in data
    assert data["total"] >= 1
    titles = [e["title"] for e in data["items"]]
    assert any("HackCampus 2026" in t for t in titles)

def test_create_event_faculty_only(client: TestClient):
    student_token = get_auth_token(client)
    faculty_token = get_faculty_token(client)

    now = datetime.now(timezone.utc)
    payload = {
        "title": f"Robotics Workshop {uuid.uuid4().hex[:6]}",
        "description": "Autonomous line follower and obstacle avoidance robots.",
        "category": "WORKSHOP",
        "venue": "Mechanical Block Lab 2",
        "start_time": (now + timedelta(days=5)).isoformat(),
        "end_time": (now + timedelta(days=5, hours=3)).isoformat(),
        "max_capacity": 30
    }

    # Student cannot create event
    fail_resp = client.post(
        "/api/v1/events",
        json=payload,
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert fail_resp.status_code == 403

    # Faculty can create event
    success_resp = client.post(
        "/api/v1/events",
        json=payload,
        headers={"Authorization": f"Bearer {faculty_token}"}
    )
    assert success_resp.status_code == 201
    assert success_resp.json()["title"] == payload["title"]
    assert success_resp.json()["max_capacity"] == 30

def test_event_rsvp_atomic_capacity_and_duplicate_prevention(client: TestClient):
    faculty_token = get_faculty_token(client)
    now = datetime.now(timezone.utc)

    # Create event with capacity = 1
    create_resp = client.post(
        "/api/v1/events",
        json={
            "title": f"Micro-Seminar {uuid.uuid4().hex[:6]}",
            "description": "Exclusive seminar limited to 1 student seat.",
            "category": "SEMINAR",
            "venue": "Conference Room A",
            "start_time": (now + timedelta(days=6)).isoformat(),
            "end_time": (now + timedelta(days=6, hours=2)).isoformat(),
            "max_capacity": 1
        },
        headers={"Authorization": f"Bearer {faculty_token}"}
    )
    event_id = create_resp.json()["id"]

    # Student 1 registers
    student_token = get_auth_token(client)
    reg_resp = client.post(
        f"/api/v1/events/{event_id}/register",
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert reg_resp.status_code == 200
    data = reg_resp.json()
    assert data["current_registrations"] == 1
    assert data["is_registered"] is True
    assert data["is_full"] is True

    # Duplicate registration attempt
    dup_resp = client.post(
        f"/api/v1/events/{event_id}/register",
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert dup_resp.status_code == 400
    assert "already registered" in dup_resp.json()["detail"].lower()

    # Cancel registration
    cancel_resp = client.delete(
        f"/api/v1/events/{event_id}/register",
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert cancel_resp.status_code == 200
    assert cancel_resp.json()["current_registrations"] == 0
    assert cancel_resp.json()["is_registered"] is False
