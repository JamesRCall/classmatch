import json


def test_register_and_login(client):
    # register a new user
    resp = client.post(
        "/api/commands/users/register",
        data=json.dumps({"email": "test@example.com", "password": "secret", "name": "Tester"}),
        content_type="application/json",
    )
    assert resp.status_code == 201
    body = resp.get_json()
    assert body.get("ok") is True
    user_id = body.get("user_id")
    assert isinstance(user_id, int)

    # duplicate registration should fail (409)
    resp = client.post(
        "/api/commands/users/register",
        data=json.dumps({"email": "test@example.com", "password": "secret", "name": "Tester"}),
        content_type="application/json",
    )
    assert resp.status_code == 409

    # login success
    resp = client.post(
        "/api/commands/users/login",
        data=json.dumps({"email": "test@example.com", "password": "secret"}),
        content_type="application/json",
    )
    assert resp.status_code == 200
    body = resp.get_json()
    assert body.get("ok") is True
    assert body["user"]["email"] == "test@example.com"

    # wrong password
    resp = client.post(
        "/api/commands/users/login",
        data=json.dumps({"email": "test@example.com", "password": "wrong"}),
        content_type="application/json",
    )
    assert resp.status_code == 401


def test_update_and_delete_user(client):
    # register another user
    resp = client.post(
        "/api/commands/users/register",
        data=json.dumps({"email": "upd@example.com", "password": "pw", "name": "Upd"}),
        content_type="application/json",
    )
    assert resp.status_code == 201
    user_id = resp.get_json()["user_id"]

    # update user
    resp = client.put(
        f"/api/commands/users/{user_id}",
        data=json.dumps({"major": "Physics", "year": "Senior"}),
        content_type="application/json",
    )
    assert resp.status_code == 200

    # verify updated via login payload
    resp = client.post(
        "/api/commands/users/login",
        data=json.dumps({"email": "upd@example.com", "password": "pw"}),
        content_type="application/json",
    )
    assert resp.status_code == 200
    body = resp.get_json()
    assert body["user"]["major"] == "Physics"

    # delete user
    resp = client.delete(f"/api/commands/users/{user_id}")
    assert resp.status_code == 200

    # verify cannot login afterwards
    resp = client.post(
        "/api/commands/users/login",
        data=json.dumps({"email": "upd@example.com", "password": "pw"}),
        content_type="application/json",
    )
    assert resp.status_code == 401
