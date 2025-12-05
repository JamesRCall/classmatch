from flask import Blueprint, jsonify, request
from sqlalchemy import text

from db import engine
from domain.event_bus import event_bus
from domain.events import GroupCreated, GroupJoined, GroupMessagePosted

bp_command = Blueprint("command", __name__)


@bp_command.post("/groups")
def command_create_group():
    data = request.get_json(force=True)
    owner_user_id = data.get("owner_user_id")
    course_id = data.get("course_id")
    name = data.get("name")
    description = data.get("description") or ""
    meeting_time = data.get("meeting_time") or ""
    location = data.get("location") or ""
    max_members = data.get("max_members") or 5

    if not (owner_user_id and course_id and name):
        return jsonify({"error": "owner_user_id, course_id, and name are required"}), 400

    try:
        with engine.begin() as conn:
            res = conn.execute(
                text(
                    """
                    INSERT INTO `groups`
                    (owner_user_id, course_id, name, description, meeting_time, location, max_members)
                    VALUES (:oid, :cid, :name, :desc, :mt, :loc, :maxm)
                    """
                ),
                {
                    "oid": owner_user_id,
                    "cid": course_id,
                    "name": name,
                    "desc": description,
                    "mt": meeting_time,
                    "loc": location,
                    "maxm": max_members,
                },
            )
            group_id = res.lastrowid

            conn.execute(
                text(
                    """
                    INSERT INTO group_members (group_id, user_id, role, status)
                    VALUES (:gid, :uid, 'admin', 'active')
                    """
                ),
                {"gid": group_id, "uid": owner_user_id},
            )

        event_bus.publish(GroupCreated(group_id=group_id, owner_user_id=owner_user_id))
        return jsonify({"ok": True, "group_id": group_id}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@bp_command.post("/groups/<int:group_id>/join")
def command_join_group(group_id: int):
    data = request.get_json(force=True)
    user_id = data.get("user_id")

    if not user_id:
        return jsonify({"error": "user_id is required"}), 400

    try:
        with engine.begin() as conn:
            g = conn.execute(
                text("SELECT owner_user_id, max_members FROM `groups` WHERE id = :gid"),
                {"gid": group_id},
            ).first()
            if not g:
                return jsonify({"error": "Group not found"}), 404

            c = conn.execute(
                text(
                    "SELECT COUNT(*) AS cnt FROM group_members "
                    "WHERE group_id = :gid AND status = 'active'"
                ),
                {"gid": group_id},
            ).mappings().first()

            if g.max_members is not None and c["cnt"] >= g.max_members:
                return jsonify({"error": "Group is full"}), 400

            conn.execute(
                text(
                    """
                    INSERT INTO group_members (group_id, user_id, role, status)
                    VALUES (:gid, :uid, 'member', 'active')
                    """
                ),
                {"gid": group_id, "uid": user_id},
            )

        event_bus.publish(
            GroupJoined(
                group_id=group_id,
                user_id=user_id,
                owner_user_id=g.owner_user_id,
            )
        )
        return jsonify({"ok": True, "message": "Joined group"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@bp_command.post("/groups/<int:group_id>/messages")
def command_post_message(group_id: int):
    data = request.get_json(force=True)
    user_id = data.get("user_id")
    content = data.get("content")

    if not (user_id and content):
        return jsonify({"error": "user_id and content are required"}), 400

    try:
        with engine.begin() as conn:
            mres = conn.execute(
                text(
                    """
                    INSERT INTO messages (group_id, user_id, content)
                    VALUES (:gid, :uid, :content)
                    """
                ),
                {"gid": group_id, "uid": user_id, "content": content},
            )
            message_id = mres.lastrowid

        event_bus.publish(
            GroupMessagePosted(
                group_id=group_id,
                user_id=user_id,
                message_id=message_id,
            )
        )
        return jsonify({"ok": True, "message_id": message_id}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500
