import pytest
from fastapi.testclient import TestClient

def get_student_token(client: TestClient):
    resp = client.post("/api/v1/auth/login", json={"email": "student@campusloop.edu", "password": "Student@123456"})
    return resp.json()["access_token"]

def test_list_notifications(client: TestClient):
    token = get_student_token(client)
    resp = client.get("/api/v1/notifications", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    data = resp.json()
    assert "total" in data
    assert "unread_count" in data
    assert "items" in data
    assert data["total"] >= 1

def test_mark_notification_as_read(client: TestClient):
    token = get_student_token(client)
    list_resp = client.get("/api/v1/notifications?unread_only=true", headers={"Authorization": f"Bearer {token}"})
    assert list_resp.status_code == 200
    items = list_resp.json()["items"]
    if items:
        notif_id = items[0]["id"]
        read_resp = client.post(
            f"/api/v1/notifications/{notif_id}/read",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert read_resp.status_code == 200
        assert read_resp.json()["is_read"] is True

def test_mark_all_notifications_as_read(client: TestClient):
    token = get_student_token(client)
    resp = client.post("/api/v1/notifications/read-all", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200

    # Verify unread count is now 0
    list_resp = client.get("/api/v1/notifications", headers={"Authorization": f"Bearer {token}"})
    assert list_resp.json()["unread_count"] == 0
