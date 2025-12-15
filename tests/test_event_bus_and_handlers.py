import json
import sys
import os
import importlib
# ensure server package dir is importable for direct domain imports
server_dir = os.path.join(os.getcwd(), "server")
if server_dir not in sys.path:
    sys.path.insert(0, server_dir)

from domain.event_bus import EventBus
from domain.events import GroupCreated, GroupJoined, GroupMessagePosted
from domain import handlers


def test_event_bus_subscribe_and_publish_calls_handler():
    bus = EventBus()
    calls = []

    def handler(evt):
        calls.append(evt)

    bus.subscribe(GroupCreated, handler)
    evt = GroupCreated(group_id=1, owner_user_id=2)
    bus.publish(evt)

    assert len(calls) == 1
    assert calls[0].group_id == 1


def test_register_handlers_sets_up_subscriptions():
    bus = EventBus()
    handlers.register_handlers(bus)
    # ensure handlers have been subscribed for these event types
    assert GroupCreated in bus._handlers
    assert GroupJoined in bus._handlers
    assert GroupMessagePosted in bus._handlers


from sqlalchemy import text


def test_handle_group_created_inserts_notification(test_engine):
    # ensure no notifications initially
    with test_engine.begin() as conn:
        conn.execute(text("DELETE FROM notifications"))
        # ensure owner exists (foreign key constraint)
        conn.execute(text("INSERT INTO users (id, email, password_hash, name) VALUES (:id, :email, :pw, :name)"), {"id": 42, "email": "u42@example.com", "pw": "x", "name": "U42"})

    # ensure handler uses test engine rather than production engine
    handlers.engine = test_engine

    handlers.handle_group_created(GroupCreated(group_id=10, owner_user_id=42))

    with test_engine.begin() as conn:
        rows = conn.execute(text("SELECT user_id, type, data FROM notifications WHERE user_id = :uid"), {"uid": 42}).fetchall()
        assert len(rows) == 1
        user_id, typ, data = rows[0]
        assert typ == "group_created"
        assert 'Your group was created.' in data


def test_handle_group_joined_inserts_notification(test_engine):
    with test_engine.begin() as conn:
        conn.execute(text("DELETE FROM notifications"))
        conn.execute(text("INSERT INTO users (id, email, password_hash, name) VALUES (:id, :email, :pw, :name)"), {"id": 99, "email": "u99@example.com", "pw": "x", "name": "U99"})

    # ensure handler uses test engine rather than production engine
    handlers.engine = test_engine

    handlers.handle_group_joined(GroupJoined(group_id=11, user_id=5, owner_user_id=99))

    with test_engine.begin() as conn:
        rows = conn.execute(text("SELECT user_id, type FROM notifications WHERE user_id = :uid"), {"uid": 99}).fetchall()
        assert len(rows) == 1
        assert rows[0].type == "group_joined"


def test_handle_group_message_posted_notifies_active_members(test_engine):
    with test_engine.begin() as conn:
        conn.execute(text("DELETE FROM notifications"))
        conn.execute(text("DELETE FROM group_members"))
        # ensure users exist (insert without fixed ids to avoid conflicts)
        conn.execute(text("INSERT OR IGNORE INTO users (email, password_hash, name) VALUES ('u1@example.com', 'x', 'U1')"))
        conn.execute(text("INSERT OR IGNORE INTO users (email, password_hash, name) VALUES ('u2@example.com', 'x', 'U2')"))
        conn.execute(text("INSERT OR IGNORE INTO users (email, password_hash, name) VALUES ('u3@example.com', 'x', 'U3')"))
        u1 = conn.execute(text("SELECT id FROM users WHERE email = :e"), {"e": 'u1@example.com'}).first().id
        u2 = conn.execute(text("SELECT id FROM users WHERE email = :e"), {"e": 'u2@example.com'}).first().id
        u3 = conn.execute(text("SELECT id FROM users WHERE email = :e"), {"e": 'u3@example.com'}).first().id
        # create a dedicated group for this test
        conn.execute(text("INSERT INTO `groups` (owner_user_id, course_id, name) VALUES (:oid, :cid, :name)"), {"oid": u1, "cid": 'TSTG', "name": 'evtbus-20'})
        gid = conn.execute(text("SELECT id FROM `groups` WHERE name = :n ORDER BY id DESC LIMIT 1"), {"n": 'evtbus-20'}).first().id
        # group has members u1 (poster), u2 (active), u3 (pending)
        conn.execute(text("INSERT INTO group_members (group_id, user_id, role, status) VALUES (:gid, :uid, 'member', 'active')"), {"gid": gid, "uid": u1})
        conn.execute(text("INSERT INTO group_members (group_id, user_id, role, status) VALUES (:gid, :uid, 'member', 'active')"), {"gid": gid, "uid": u2})
        conn.execute(text("INSERT INTO group_members (group_id, user_id, role, status) VALUES (:gid, :uid, 'member', 'pending')"), {"gid": gid, "uid": u3})

    # retrieve ids to call handler
    with test_engine.begin() as conn:
        u1 = conn.execute(text("SELECT id FROM users WHERE email = :e"), {"e": 'u1@example.com'}).first().id
        gid = conn.execute(text("SELECT id FROM `groups` WHERE name = :n ORDER BY id DESC LIMIT 1"), {"n": 'evtbus-20'}).first().id

    # ensure handler uses test engine rather than production engine
    handlers.engine = test_engine

    handlers.handle_group_message_posted(GroupMessagePosted(group_id=gid, user_id=u1, message_id=100))

    with test_engine.begin() as conn:
        notifs = conn.execute(text("SELECT user_id, type FROM notifications ORDER BY user_id")).fetchall()
        # only one user should be notified
        assert len(notifs) == 1
        notified_user = notifs[0].user_id
        notif_type = notifs[0].type
        # lookup expected active member id (u2)
        u2 = conn.execute(text("SELECT id FROM users WHERE email = :e"), {"e": 'u2@example.com'}).first().id

    assert notified_user == u2
    assert notif_type == "group_message_posted"
