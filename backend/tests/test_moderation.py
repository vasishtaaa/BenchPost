import uuid
import pytest
from fastapi.testclient import TestClient

def get_student_token(client: TestClient):
    resp = client.post("/api/v1/auth/login", json={"email": "student@campusloop.edu", "password": "Student@123456"})
    return resp.json()["access_token"]

def get_admin_token(client: TestClient):
    resp = client.post("/api/v1/auth/login", json={"email": "admin@campusloop.edu", "password": "Admin@123456"})
    return resp.json()["access_token"]

def test_create_content_report(client: TestClient):
    student_token = get_student_token(client)

    # Get a post ID
    posts_resp = client.get("/api/v1/posts", headers={"Authorization": f"Bearer {student_token}"})
    post_id = posts_resp.json()["items"][0]["id"]

    # Student submits report
    report_resp = client.post(
        "/api/v1/moderation/reports",
        json={
            "target_type": "POST",
            "target_id": post_id,
            "reason": "SPAM",
            "details": "Automated spam promotion detected."
        },
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert report_resp.status_code == 201
    data = report_resp.json()
    assert data["target_type"] == "POST"
    assert data["target_id"] == post_id
    assert data["status"] == "PENDING"

def test_admin_list_and_resolve_report(client: TestClient):
    student_token = get_student_token(client)
    admin_token = get_admin_token(client)

    # Create a fresh post to report
    post_resp = client.post(
        "/api/v1/posts",
        json={
            "community_id": "cse-developers",
            "title": f"Violating Content {uuid.uuid4().hex[:6]}",
            "content": "This post contains prohibited promotional spam.",
            "category": "General"
        },
        headers={"Authorization": f"Bearer {student_token}"}
    )
    post_id = post_resp.json()["id"]

    # Student reports it
    rep_resp = client.post(
        "/api/v1/moderation/reports",
        json={
            "target_type": "POST",
            "target_id": post_id,
            "reason": "SPAM",
            "details": "Spam test"
        },
        headers={"Authorization": f"Bearer {student_token}"}
    )
    report_id = rep_resp.json()["id"]

    # Admin lists reports
    list_resp = client.get("/api/v1/moderation/reports", headers={"Authorization": f"Bearer {admin_token}"})
    assert list_resp.status_code == 200
    assert list_resp.json()["pending_count"] >= 1

    # Admin resolves report with REMOVE_CONTENT
    resolve_resp = client.post(
        f"/api/v1/moderation/reports/{report_id}/resolve",
        json={
            "action": "REMOVE_CONTENT",
            "review_notes": "Confirmed spam; removed title and body."
        },
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert resolve_resp.status_code == 200
    res_data = resolve_resp.json()
    assert res_data["status"] == "RESOLVED"
    assert res_data["action_taken"] == "REMOVE_CONTENT"

    # Verify post content was neutralized
    get_post_resp = client.get(f"/api/v1/posts/{post_id}", headers={"Authorization": f"Bearer {student_token}"})
    assert "[Removed by Moderation]" in get_post_resp.json()["title"]
