def test_notifications_create_mark_read_and_delete_flow(client):
    # register user
    r = client.post("/api/commands/users/register", json={"email": "n1@example.com", "password": "pw", "name": "N1"})
    assert r.status_code == 201
    uid = r.get_json()["user_id"]

    # missing type
    resp = client.post(f"/api/commands/notifications/{uid}", json={})
    assert resp.status_code == 400

    # create notification
    resp = client.post(f"/api/commands/notifications/{uid}", json={"type": "info", "data": {"msg": "hi"}})
    if resp.status_code != 201:
        print(resp.get_json())
    assert resp.status_code == 201
    nid = resp.get_json()["notification_id"]

    # mark read
    resp = client.patch(f"/api/commands/notifications/{uid}/{nid}/read")
    assert resp.status_code == 200

    # mark read not found
    resp = client.patch(f"/api/commands/notifications/{uid}/99999/read")
    assert resp.status_code == 404

    # delete
    resp = client.delete(f"/api/commands/notifications/{uid}/{nid}")
    assert resp.status_code == 200

    # delete again -> 404
    resp = client.delete(f"/api/commands/notifications/{uid}/{nid}")
    assert resp.status_code == 404


def test_mark_all_notifications_and_user_not_found(client):
    r = client.post("/api/commands/users/register", json={"email": "n2@example.com", "password": "pw", "name": "N2"})
    assert r.status_code == 201
    uid = r.get_json()["user_id"]

    # create two notifications
    client.post(f"/api/commands/notifications/{uid}", json={"type": "info", "data": {"m": 1}})
    client.post(f"/api/commands/notifications/{uid}", json={"type": "warn", "data": {"m": 2}})

    resp = client.patch(f"/api/commands/notifications/{uid}/read-all")
    assert resp.status_code == 200
    assert resp.get_json().get("updated_count") >= 2

    # non-existent user
    resp = client.patch("/api/commands/notifications/99999/read-all")
    assert resp.status_code == 404
