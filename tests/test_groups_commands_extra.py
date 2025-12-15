import json


def _register(client, email="u2@example.com", password="pw", name="U"):
    resp = client.post(
        "/api/commands/users/register",
        data=json.dumps({"email": email, "password": password, "name": name}),
        content_type="application/json",
    )
    assert resp.status_code == 201
    return resp.get_json()["user_id"]


def _create_course(client, cid="C200"):
    resp = client.post(
        "/api/commands/courses",
        data=json.dumps({"id": cid, "code": "C 200", "name": "Course 200", "section": "001", "instructor": "Prof", "schedule": "MWF", "students": 1}),
        content_type="application/json",
    )
    assert resp.status_code == 201


def test_update_and_delete_group(client, test_engine):
    owner = _register(client, "upowner@example.com")
    _create_course(client, "CU1")

    resp = client.post(
        "/api/commands/groups",
        data=json.dumps({"owner_user_id": owner, "course_id": "CU1", "name": "ToUpdate"}),
        content_type="application/json",
    )
    gid = resp.get_json()["group_id"]

    # update name
    resp = client.put(f"/api/commands/groups/{gid}", data=json.dumps({"name": "Updated"}), content_type="application/json")
    assert resp.status_code == 200

    # update invalid fields
    resp = client.put(f"/api/commands/groups/{gid}", data=json.dumps({}), content_type="application/json")
    assert resp.status_code == 400

    # delete (soft)
    resp = client.delete(f"/api/commands/groups/{gid}")
    assert resp.status_code == 200

    # hard delete non-existing should be 404
    resp = client.delete(f"/api/commands/groups/9999?hard_delete=true")
    assert resp.status_code == 404


def test_leave_non_member_and_transfer_owner(client):
    owner = _register(client, "towner@example.com")
    member = _register(client, "tmember@example.com")
    _create_course(client, "CU2")

    resp = client.post(
        "/api/commands/groups",
        data=json.dumps({"owner_user_id": owner, "course_id": "CU2", "name": "TGroup"}),
        content_type="application/json",
    )
    gid = resp.get_json()["group_id"]

    # outsider leaves -> 404
    outsider = _register(client, "outs@example.com")
    resp = client.post(f"/api/commands/groups/{gid}/leave", data=json.dumps({"user_id": outsider}), content_type="application/json")
    assert resp.status_code == 404

    # add member and transfer ownership
    resp = client.post(f"/api/commands/groups/{gid}/join", data=json.dumps({"user_id": member}), content_type="application/json")
    assert resp.status_code == 201

    resp = client.patch(f"/api/commands/groups/{gid}/transfer-ownership", data=json.dumps({"new_owner_id": member}), content_type="application/json")
    assert resp.status_code == 200


def test_post_and_delete_message(client):
    owner = _register(client, "mowner@example.com")
    poster = _register(client, "mposter@example.com")
    _create_course(client, "CM1")

    resp = client.post(
        "/api/commands/groups",
        data=json.dumps({"owner_user_id": owner, "course_id": "CM1", "name": "MsgGroup"}),
        content_type="application/json",
    )
    gid = resp.get_json()["group_id"]

    # poster (non-member) can post (current behavior)
    resp = client.post(
        "/api/commands/messages",
        data=json.dumps({"group_id": gid, "user_id": poster, "content": "Hi"}),
        content_type="application/json",
    )
    assert resp.status_code == 201
    mid = resp.get_json()["message_id"]

    # messages query returns it
    msgs = client.get(f"/api/queries/messages/group/{gid}")
    assert msgs.status_code == 200
    assert any(m["id"] == mid for m in msgs.get_json())

    # delete message
    resp = client.delete(f"/api/commands/messages/{mid}")
    assert resp.status_code == 200

    resp = client.delete(f"/api/commands/messages/{mid}")
    assert resp.status_code == 404
