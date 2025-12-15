import json


def _register(client, email="q@example.com", password="pw", name="Q"):
    resp = client.post(
        "/api/commands/users/register",
        data=json.dumps({"email": email, "password": password, "name": name}),
        content_type="application/json",
    )
    assert resp.status_code == 201
    return resp.get_json()["user_id"]


def _create_course(client, cid="CQ1"):
    resp = client.post(
        "/api/commands/courses",
        data=json.dumps({"id": cid, "code": "CQ 1", "name": "Course Q", "section": "001", "instructor": "Prof", "schedule": "MWF", "students": 1}),
        content_type="application/json",
    )
    assert resp.status_code == 201


def test_group_detail_and_messages_and_members(client):
    owner = _register(client, "gowner@example.com")
    member = _register(client, "gmember@example.com")
    _create_course(client, "CG1")

    resp = client.post(
        "/api/commands/groups",
        data=json.dumps({"owner_user_id": owner, "course_id": "CG1", "name": "QueryGroup"}),
        content_type="application/json",
    )
    gid = resp.get_json()["group_id"]

    # add member
    resp = client.post(f"/api/commands/groups/{gid}/join", data=json.dumps({"user_id": member}), content_type="application/json")
    assert resp.status_code == 201

    # post message
    resp = client.post(
        "/api/commands/messages",
        data=json.dumps({"group_id": gid, "user_id": member, "content": "Hi members"}),
        content_type="application/json",
    )
    assert resp.status_code == 201

    # group detail
    gd = client.get(f"/api/queries/groups/{gid}")
    assert gd.status_code == 200
    data = gd.get_json()
    assert "members" in data and any(m["id"] == member for m in data["members"])
    assert "messages" in data and len(data["messages"]) >= 1

    # group messages endpoint with limit/offset
    resp = client.get(f"/api/queries/groups/{gid}/messages?limit=1&offset=0")
    assert resp.status_code == 200
    assert len(resp.get_json()) == 1


def test_list_groups_filter_by_course(client):
    owner = _register(client, "lgowner@example.com")
    _create_course(client, "LC1")
    _create_course(client, "LC2")

    # create two groups with different courses
    resp = client.post(
        "/api/commands/groups",
        data=json.dumps({"owner_user_id": owner, "course_id": "LC1", "name": "LG1"}),
        content_type="application/json",
    )
    assert resp.status_code == 201

    resp = client.post(
        "/api/commands/groups",
        data=json.dumps({"owner_user_id": owner, "course_id": "LC2", "name": "LG2"}),
        content_type="application/json",
    )
    assert resp.status_code == 201

    resp = client.get("/api/queries/groups?course_id=LC1")
    assert resp.status_code == 200
    groups = resp.get_json()
    assert all(g["course_name"] for g in groups)


def test_notifications_queries(client, test_engine):
    uid = _register(client, "nuser@example.com")

    # insert some notifications directly
    from sqlalchemy import text
    with test_engine.begin() as conn:
        conn.execute(
            text("INSERT INTO notifications (user_id, type, data, is_read) VALUES (:uid, 'x', '{}', 0)"),
            {"uid": uid},
        )

    resp = client.get(f"/api/queries/notifications/{uid}")
    assert resp.status_code == 200
    assert len(resp.get_json()) >= 1

    resp = client.get(f"/api/queries/notifications/{uid}/count")
    assert resp.status_code == 200
    assert "unread_count" in resp.get_json()
