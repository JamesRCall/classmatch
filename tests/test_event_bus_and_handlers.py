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
        # ensure users exist
        conn.execute(text("INSERT INTO users (id, email, password_hash, name) VALUES (1, 'u1@example.com', 'x', 'U1')"))
        conn.execute(text("INSERT INTO users (id, email, password_hash, name) VALUES (2, 'u2@example.com', 'x', 'U2')"))
        # group 20 has members 1 (poster), 2 (active), 3 (pending)
        conn.execute(text("INSERT INTO group_members (group_id, user_id, role, status) VALUES (20, 1, 'member', 'active')"))
        conn.execute(text("INSERT INTO group_members (group_id, user_id, role, status) VALUES (20, 2, 'member', 'active')"))
        conn.execute(text("INSERT INTO group_members (group_id, user_id, role, status) VALUES (20, 3, 'member', 'pending')"))

    # ensure handler uses test engine rather than production engine
    handlers.engine = test_engine

    handlers.handle_group_message_posted(GroupMessagePosted(group_id=20, user_id=1, message_id=100))

    with test_engine.begin() as conn:
        notifs = conn.execute(text("SELECT user_id, type FROM notifications ORDER BY user_id")).fetchall()
        # only user 2 should be notified
        assert len(notifs) == 1
        assert notifs[0].user_id == 2
        assert notifs[0].type == "group_message_posted"
