import json
from sqlalchemy import text

from db import engine
from .events import GroupCreated, GroupJoined, GroupMessagePosted
from .event_bus import EventBus


def handle_group_created(evt: GroupCreated):
    with engine.begin() as conn:
        data = {
            "group_id": evt.group_id,
            "message": "Your group was created.",
        }
        conn.execute(
            text(
                "INSERT INTO notifications (user_id, type, data) "
                "VALUES (:uid, :type, :data)"
            ),
            {
                "uid": evt.owner_user_id,
                "type": "group_created",
                "data": json.dumps(data),
            },
        )


def handle_group_joined(evt: GroupJoined):
    with engine.begin() as conn:
        data = {
            "group_id": evt.group_id,
            "user_id": evt.user_id,
            "message": "A new member joined your group.",
        }
        conn.execute(
            text(
                "INSERT INTO notifications (user_id, type, data) "
                "VALUES (:uid, :type, :data)"
            ),
            {
                "uid": evt.owner_user_id,
                "type": "group_joined",
                "data": json.dumps(data),
            },
        )


def handle_group_message_posted(evt: GroupMessagePosted):
    with engine.begin() as conn:
        members_q = text(
            "SELECT user_id FROM group_members "
            "WHERE group_id = :gid AND status = 'active' AND user_id <> :uid"
        )
        rows = conn.execute(
            members_q, {"gid": evt.group_id, "uid": evt.user_id}
        ).fetchall()

        for row in rows:
            data = {
                "group_id": evt.group_id,
                "message_id": evt.message_id,
                "message": "New message in your study group.",
            }
            conn.execute(
                text(
                    "INSERT INTO notifications (user_id, type, data) "
                    "VALUES (:uid, :type, :data)"
                ),
                {
                    "uid": row.user_id,
                    "type": "group_message_posted",
                    "data": json.dumps(data),
                },
            )


def register_handlers(bus: EventBus):
    bus.subscribe(GroupCreated, handle_group_created)
    bus.subscribe(GroupJoined, handle_group_joined)
    bus.subscribe(GroupMessagePosted, handle_group_message_posted)
