import uuid
import pytest
from fastapi.testclient import TestClient

def test_list_communities(client: TestClient):
    response = client.get("/api/v1/communities")
    assert response.status_code == 200
    data = response.json()
    assert "total" in data
    assert "items" in data
    assert data["total"] >= 1
    # Check that CSE Developers exists
    slugs = [item["slug"] for item in data["items"]]
    assert "cse-developers" in slugs

def test_filter_communities_by_category(client: TestClient):
    response = client.get("/api/v1/communities?category=Engineering")
    assert response.status_code == 200
    data = response.json()
    for item in data["items"]:
        assert item["category"] == "Engineering"

def test_search_communities(client: TestClient):
    response = client.get("/api/v1/communities?search=Cybersecurity")
    assert response.status_code == 200
    data = response.json()
    assert any("Cybersecurity" in item["name"] for item in data["items"])

def test_create_community(client: TestClient):
    # Login as student
    login_resp = client.post("/api/v1/auth/login", json={
        "email": "student@campusloop.edu",
        "password": "Student@123456"
    })
    token = login_resp.json()["access_token"]

    uid = str(uuid.uuid4())[:8]
    payload = {
        "name": f"Robotics Club {uid}",
        "description": "Hardware programming, ROS, and autonomous robotics projects.",
        "category": "Engineering",
        "rules": "Bring your safety goggles. Clean up workshop benches.",
        "is_private": False
    }
    response = client.post(
        "/api/v1/communities",
        json=payload,
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == payload["name"]
    assert data["is_member"] is True
    assert data["user_role"] == "ADMIN"
    assert data["member_count"] == 1

def test_join_and_leave_public_community(client: TestClient):
    # Register a new user
    uid = str(uuid.uuid4())[:8]
    user_email = f"joiner_{uid}@campusloop.edu"
    reg_resp = client.post("/api/v1/auth/register", json={
        "email": user_email,
        "password": "Password123!",
        "full_name": f"Joiner {uid}",
        "role": "STUDENT"
    })
    token = reg_resp.json()["access_token"]

    # Join CSE Developers (Public)
    join_resp = client.post(
        "/api/v1/communities/cse-developers/join",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert join_resp.status_code == 200
    assert join_resp.json()["status"] == "ACTIVE"

    # Attempt to join again (duplicate test)
    dup_resp = client.post(
        "/api/v1/communities/cse-developers/join",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert dup_resp.status_code == 400
    assert "already a member" in dup_resp.json()["detail"]

    # Leave community
    leave_resp = client.post(
        "/api/v1/communities/cse-developers/leave",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert leave_resp.status_code == 200
    assert "left the community" in leave_resp.json()["message"]

def test_join_private_community_and_moderator_approval(client: TestClient):
    # Register applicant student
    uid = str(uuid.uuid4())[:8]
    applicant_email = f"applicant_{uid}@campusloop.edu"
    reg_resp = client.post("/api/v1/auth/register", json={
        "email": applicant_email,
        "password": "Password123!",
        "full_name": f"Applicant {uid}",
        "role": "STUDENT"
    })
    applicant_id = reg_resp.json()["user"]["id"]
    applicant_token = reg_resp.json()["access_token"]

    # Request to join Placement Preparation 2026 (Private community)
    join_resp = client.post(
        "/api/v1/communities/placement-preparation-2026/join",
        headers={"Authorization": f"Bearer {applicant_token}"}
    )
    assert join_resp.status_code == 200
    assert join_resp.json()["status"] == "PENDING"

    # Faculty logs in to review & approve
    fac_login = client.post("/api/v1/auth/login", json={
        "email": "faculty@campusloop.edu",
        "password": "Faculty@123456"
    })
    faculty_token = fac_login.json()["access_token"]

    # Faculty views pending members
    members_resp = client.get(
        "/api/v1/communities/placement-preparation-2026/members?status_filter=PENDING",
        headers={"Authorization": f"Bearer {faculty_token}"}
    )
    assert members_resp.status_code == 200
    pending_users = [m["user_id"] for m in members_resp.json()]
    assert applicant_id in pending_users

    # Faculty approves the applicant
    approve_resp = client.post(
        f"/api/v1/communities/placement-preparation-2026/members/{applicant_id}/approve",
        headers={"Authorization": f"Bearer {faculty_token}"}
    )
    assert approve_resp.status_code == 200

    # Verify applicant is now an ACTIVE member
    detail_resp = client.get(
        "/api/v1/communities/placement-preparation-2026",
        headers={"Authorization": f"Bearer {applicant_token}"}
    )
    assert detail_resp.status_code == 200
    assert detail_resp.json()["is_member"] is True
    assert detail_resp.json()["membership_status"] == "ACTIVE"
