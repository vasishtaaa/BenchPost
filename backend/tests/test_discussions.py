import uuid
import pytest
from fastapi.testclient import TestClient

def test_list_discussions(client: TestClient):
    response = client.get("/api/v1/posts")
    assert response.status_code == 200
    data = response.json()
    assert "total" in data
    assert "items" in data
    assert data["total"] >= 1
    # Check that seeded posts exist
    titles = [p["title"] for p in data["items"]]
    assert any("Spring 2025 Midterm Review" in t for t in titles)

def test_create_discussion_post(client: TestClient):
    # Student logs in
    login_resp = client.post("/api/v1/auth/login", json={
        "email": "student@campusloop.edu",
        "password": "Student@123456"
    })
    token = login_resp.json()["access_token"]

    uid = str(uuid.uuid4())[:8]
    payload = {
        "community_id": "cse-developers",
        "title": f"Distributed Caching Strategies in Python {uid}",
        "content": "Comparing Redis vs Memcached for session token revocation in microservices.",
        "category": "Questions"
    }
    response = client.post(
        "/api/v1/posts",
        json=payload,
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == payload["title"]
    assert data["category"] == "Questions"
    assert data["author"]["email"] == "student@campusloop.edu"

def test_prevent_post_creation_if_not_member(client: TestClient):
    # Register fresh student who hasn't joined Placement Prep (Private)
    uid = str(uuid.uuid4())[:8]
    reg_resp = client.post("/api/v1/auth/register", json={
        "email": f"outsider_{uid}@campusloop.edu",
        "password": "Password123!",
        "full_name": f"Outsider {uid}",
        "role": "STUDENT"
    })
    token = reg_resp.json()["access_token"]

    payload = {
        "community_id": "placement-preparation-2026",
        "title": "Unauthorized Question",
        "content": "Trying to post without joining private community",
        "category": "Career"
    }
    response = client.post(
        "/api/v1/posts",
        json=payload,
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 403
    assert "must be an active member" in response.json()["detail"]

def test_get_post_and_view_count(client: TestClient):
    posts_resp = client.get("/api/v1/posts")
    first_post_id = posts_resp.json()["items"][0]["id"]
    initial_views = posts_resp.json()["items"][0]["views_count"]

    get_resp = client.get(f"/api/v1/posts/{first_post_id}")
    assert get_resp.status_code == 200
    assert get_resp.json()["views_count"] == initial_views + 1

def test_add_comments_and_threaded_replies(client: TestClient):
    login_resp = client.post("/api/v1/auth/login", json={
        "email": "student@campusloop.edu",
        "password": "Student@123456"
    })
    token = login_resp.json()["access_token"]

    posts_resp = client.get("/api/v1/posts")
    post_id = posts_resp.json()["items"][0]["id"]

    # Add top-level comment
    comment_resp = client.post(
        f"/api/v1/posts/{post_id}/comments",
        json={"content": "Top-level inquiry on test post."},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert comment_resp.status_code == 201
    parent_comment_id = comment_resp.json()["id"]

    # Add nested reply
    reply_resp = client.post(
        f"/api/v1/posts/{post_id}/comments",
        json={
            "content": "Nested reply to the top-level inquiry.",
            "parent_id": parent_comment_id
        },
        headers={"Authorization": f"Bearer {token}"}
    )
    assert reply_resp.status_code == 201
    assert reply_resp.json()["parent_id"] == parent_comment_id

    # Fetch comment tree
    tree_resp = client.get(f"/api/v1/posts/{post_id}/comments")
    assert tree_resp.status_code == 200
    top_comment = next(c for c in tree_resp.json() if c["id"] == parent_comment_id)
    assert len(top_comment["replies"]) >= 1
    assert top_comment["replies"][0]["id"] == reply_resp.json()["id"]

def test_reactions_and_duplicate_prevention(client: TestClient):
    uid = str(uuid.uuid4())[:8]
    reg_resp = client.post("/api/v1/auth/register", json={
        "email": f"reactor_{uid}@campusloop.edu",
        "password": "Password123!",
        "full_name": f"Reactor {uid}",
        "role": "STUDENT"
    })
    token = reg_resp.json()["access_token"]

    posts_resp = client.get("/api/v1/posts")
    post_id = posts_resp.json()["items"][0]["id"]

    # 1. Add reaction (HELPFUL)
    r1 = client.post(
        f"/api/v1/posts/{post_id}/reactions",
        json={"reaction_type": "HELPFUL"},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert r1.status_code == 200
    assert r1.json()["current_reaction"] == "HELPFUL"

    # 2. Change reaction to CELEBRATE (should update, not duplicate)
    r2 = client.post(
        f"/api/v1/posts/{post_id}/reactions",
        json={"reaction_type": "CELEBRATE"},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert r2.status_code == 200
    assert r2.json()["current_reaction"] == "CELEBRATE"

    # 3. Toggle off (sending CELEBRATE again removes it)
    r3 = client.post(
        f"/api/v1/posts/{post_id}/reactions",
        json={"reaction_type": "CELEBRATE"},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert r3.status_code == 200
    assert r3.json()["current_reaction"] is None

def test_bookmark_post(client: TestClient):
    login_resp = client.post("/api/v1/auth/login", json={
        "email": "student@campusloop.edu",
        "password": "Student@123456"
    })
    token = login_resp.json()["access_token"]

    posts_resp = client.get("/api/v1/posts")
    post_id = posts_resp.json()["items"][0]["id"]

    # Toggle bookmark on
    bm1 = client.post(
        f"/api/v1/posts/{post_id}/bookmark",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert bm1.status_code == 200
    assert bm1.json()["is_bookmarked"] is True

    # Retrieve bookmarks
    saved_resp = client.get(
        "/api/v1/posts/bookmarks/saved",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert saved_resp.status_code == 200
    saved_ids = [p["id"] for p in saved_resp.json()["items"]]
    assert post_id in saved_ids

    # Toggle bookmark off
    bm2 = client.post(
        f"/api/v1/posts/{post_id}/bookmark",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert bm2.status_code == 200
    assert bm2.json()["is_bookmarked"] is False
