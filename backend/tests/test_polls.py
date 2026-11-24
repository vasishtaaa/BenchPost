import uuid
from datetime import datetime, timezone, timedelta
import pytest
from fastapi.testclient import TestClient

def get_auth_token(client: TestClient, email="student@campusloop.edu", password="Student@123456"):
    resp = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    return resp.json()["access_token"]

def test_create_and_get_poll(client: TestClient):
    token = get_auth_token(client)
    uid = str(uuid.uuid4())[:8]
    payload = {
        "question": f"Which frontend state manager do you prefer? {uid}",
        "options": ["Zustand", "Redux Toolkit", "TanStack Query + Context"],
        "is_multiple_choice": False
    }
    resp = client.post(
        "/api/v1/polls",
        json=payload,
        headers={"Authorization": f"Bearer {token}"}
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["question"] == payload["question"]
    assert len(data["options"]) == 3
    assert data["total_votes"] == 0
    poll_id = data["id"]

    # Fetch poll
    get_resp = client.get(f"/api/v1/polls/{poll_id}", headers={"Authorization": f"Bearer {token}"})
    assert get_resp.status_code == 200
    assert get_resp.json()["id"] == poll_id

def test_single_choice_voting_and_duplicate_prevention(client: TestClient):
    token = get_auth_token(client)
    uid = str(uuid.uuid4())[:8]
    create_resp = client.post(
        "/api/v1/polls",
        json={
            "question": f"Preferred Backend Framework {uid}",
            "options": ["FastAPI", "Express.js", "Django"],
            "is_multiple_choice": False
        },
        headers={"Authorization": f"Bearer {token}"}
    )
    poll_data = create_resp.json()
    poll_id = poll_data["id"]
    opt1_id = poll_data["options"][0]["id"]
    opt2_id = poll_data["options"][1]["id"]

    # Vote for Option 1
    vote_resp = client.post(
        f"/api/v1/polls/{poll_id}/vote",
        json={"option_ids": [opt1_id]},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert vote_resp.status_code == 200
    data = vote_resp.json()
    assert data["total_votes"] == 1
    assert opt1_id in data["user_voted_option_ids"]
    assert data["options"][0]["vote_count"] == 1
    assert data["options"][0]["percentage"] == 100.0

    # User changes vote to Option 2 (idempotent duplicate prevention / vote update)
    vote_resp2 = client.post(
        f"/api/v1/polls/{poll_id}/vote",
        json={"option_ids": [opt2_id]},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert vote_resp2.status_code == 200
    data2 = vote_resp2.json()
    assert data2["total_votes"] == 1  # Still 1 vote, not 2!
    assert opt2_id in data2["user_voted_option_ids"]
    assert opt1_id not in data2["user_voted_option_ids"]
    assert data2["options"][1]["vote_count"] == 1
    assert data2["options"][0]["vote_count"] == 0

def test_reject_multiple_choices_on_single_choice_poll(client: TestClient):
    token = get_auth_token(client)
    create_resp = client.post(
        "/api/v1/polls",
        json={
            "question": "Single Choice Strict Test",
            "options": ["Option A", "Option B"],
            "is_multiple_choice": False
        },
        headers={"Authorization": f"Bearer {token}"}
    )
    poll_data = create_resp.json()
    poll_id = poll_data["id"]
    opts = [o["id"] for o in poll_data["options"]]

    # Try submitting two options
    vote_resp = client.post(
        f"/api/v1/polls/{poll_id}/vote",
        json={"option_ids": opts},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert vote_resp.status_code == 400
    assert "single-choice" in vote_resp.json()["detail"].lower()
