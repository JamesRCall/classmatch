"""
Groups Command API - Write operations for groups (CQRS Command Side)
Handles: Create, Update, Delete, Join, Leave, Transfer Ownership
"""
from flask import Blueprint, jsonify, request
from sqlalchemy import text

from db import engine
from domain.event_bus import event_bus
from domain.events import GroupCreated, GroupJoined

bp_groups_commands = Blueprint("groups_commands", __name__)


@bp_groups_commands.post("")
def create_group():
    """Create a new group and automatically add the owner as an admin member"""
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


@bp_groups_commands.put("/<int:group_id>")
def update_group(group_id: int):
    """Update group details"""
    data = request.get_json(force=True)
    
    # Build dynamic update query
    allowed_fields = ["name", "description", "meeting_time", "location", "max_members", "tags"]
    update_fields = []
    params = {"gid": group_id}
    
    for field in allowed_fields:
        if field in data:
            update_fields.append(f"{field} = :{field}")
            params[field] = data[field]
    
    if not update_fields:
        return jsonify({"error": "No valid fields to update"}), 400

    try:
        with engine.begin() as conn:
            # Check group exists
            exists = conn.execute(
                text("SELECT id FROM `groups` WHERE id = :gid"),
                {"gid": group_id}
            ).first()
            
            if not exists:
                return jsonify({"error": "Group not found"}), 404
            
            query = f"UPDATE `groups` SET {', '.join(update_fields)} WHERE id = :gid"
            conn.execute(text(query), params)

        return jsonify({"ok": True, "message": "Group updated"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@bp_groups_commands.delete("/<int:group_id>")
def delete_group(group_id: int):
    """Archive or delete a group"""
    hard_delete = request.args.get("hard_delete", "false").lower() == "true"
    
    try:
        with engine.begin() as conn:
            if hard_delete:
                result = conn.execute(
                    text("DELETE FROM `groups` WHERE id = :gid"),
                    {"gid": group_id}
                )
            else:
                # Soft delete (archive)
                result = conn.execute(
                    text("UPDATE `groups` SET is_archived = 1 WHERE id = :gid"),
                    {"gid": group_id}
                )
            
            if result.rowcount == 0:
                return jsonify({"error": "Group not found"}), 404

        return jsonify({"ok": True, "message": "Group deleted"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@bp_groups_commands.post("/<int:group_id>/join")
def join_group(group_id: int):
    """Add a user as an active member to the group if it's not full"""
    data = request.get_json(force=True)
    user_id = data.get("user_id")
    inviter_id = data.get("inviter_id")

    if not user_id:
        return jsonify({"error": "user_id is required"}), 400

    try:
        with engine.begin() as conn:
            g = conn.execute(
                text("SELECT owner_user_id, max_members, name, course_id FROM `groups` WHERE id = :gid"),
                {"gid": group_id},
            ).mappings().first()
            if not g:
                return jsonify({"error": "Group not found"}), 404

            c = conn.execute(
                text(
                    "SELECT COUNT(*) AS cnt FROM group_members "
                    "WHERE group_id = :gid AND status = 'active'"
                ),
                {"gid": group_id},
            ).mappings().first()

            if g["max_members"] is not None and c["cnt"] >= g["max_members"]:
                return jsonify({"error": "Group is full"}), 400

            # If inviter_id provided, create a pending invitation and notification
            if inviter_id:
                # Check existing membership/invitation
                existing = conn.execute(
                    text(
                        "SELECT status FROM group_members WHERE group_id = :gid AND user_id = :uid"
                    ),
                    {"gid": group_id, "uid": user_id}
                ).first()

                if existing:
                    if existing.status == 'active':
                        return jsonify({"error": "User already in group"}), 400
                    elif existing.status == 'pending':
                        return jsonify({"error": "Invitation already pending"}), 400

                conn.execute(
                    text(
                        """
                        INSERT INTO group_members (group_id, user_id, role, status)
                        VALUES (:gid, :uid, 'member', 'pending')
                        """
                    ),
                    {"gid": group_id, "uid": user_id},
                )

                notification_data = {
                    "group_id": group_id,
                    "group_name": g["name"],
                    "inviter_id": inviter_id if inviter_id else g["owner_user_id"],
                    "course_id": g["course_id"],
                }

                conn.execute(
                    text(
                        """
                        INSERT INTO notifications (user_id, type, data)
                        VALUES (:uid, 'group_invitation', :data)
                        """
                    ),
                    {"uid": user_id, "data": str(notification_data).replace("'", '"')}
                )

                return jsonify({"ok": True, "message": "Invitation sent", "status": "pending"}), 201

            # No inviter_id -> user is requesting to join directly (active)
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
                owner_user_id=g["owner_user_id"],
            )
        )
        return jsonify({"ok": True, "message": "Joined group"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@bp_groups_commands.post("/<int:group_id>/leave")
def leave_group(group_id: int):
    """Remove a user from a group"""
    data = request.get_json(force=True)
    user_id = data.get("user_id")

    if not user_id:
        return jsonify({"error": "user_id is required"}), 400

    try:
        with engine.begin() as conn:
            # Check if user is the owner
            group = conn.execute(
                text("SELECT owner_user_id FROM `groups` WHERE id = :gid"),
                {"gid": group_id}
            ).first()
            
            if not group:
                return jsonify({"error": "Group not found"}), 404
            
            if group.owner_user_id == user_id:
                return jsonify({"error": "Owner cannot leave group. Transfer ownership or delete group."}), 400

            result = conn.execute(
                text(
                    """
                    DELETE FROM group_members
                    WHERE group_id = :gid AND user_id = :uid
                    """
                ),
                {"gid": group_id, "uid": user_id}
            )
            
            if result.rowcount == 0:
                return jsonify({"error": "User is not a member of this group"}), 404

        return jsonify({"ok": True, "message": "Left group successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@bp_groups_commands.patch("/<int:group_id>/transfer-ownership")
def transfer_group_ownership(group_id: int):
    """Transfer group ownership to another member"""
    data = request.get_json(force=True)
    new_owner_id = data.get("new_owner_id")

    if not new_owner_id:
        return jsonify({"error": "new_owner_id is required"}), 400

    try:
        with engine.begin() as conn:
            # Check group exists
            group = conn.execute(
                text("SELECT owner_user_id FROM `groups` WHERE id = :gid"),
                {"gid": group_id}
            ).first()
            
            if not group:
                return jsonify({"error": "Group not found"}), 404

            # Check new owner is a member
            member = conn.execute(
                text(
                    """
                    SELECT user_id FROM group_members
                    WHERE group_id = :gid AND user_id = :uid AND status = 'active'
                    """
                ),
                {"gid": group_id, "uid": new_owner_id}
            ).first()
            
            if not member:
                return jsonify({"error": "New owner must be an active member"}), 400

            # Update group owner
            conn.execute(
                text("UPDATE `groups` SET owner_user_id = :new_owner WHERE id = :gid"),
                {"new_owner": new_owner_id, "gid": group_id}
            )

            # Update member roles
            conn.execute(
                text(
                    """
                    UPDATE group_members
                    SET role = 'admin'
                    WHERE group_id = :gid AND user_id = :uid
                    """
                ),
                {"gid": group_id, "uid": new_owner_id}
            )
            
            conn.execute(
                text(
                    """
                    UPDATE group_members
                    SET role = 'member'
                    WHERE group_id = :gid AND user_id = :old_owner
                    """
                ),
                {"gid": group_id, "old_owner": group.owner_user_id}
            )

        return jsonify({"ok": True, "message": "Ownership transferred"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@bp_groups_commands.post("/<int:group_id>/accept-invitation")
def accept_group_invitation(group_id: int):
    """Accept a pending group invitation"""
    data = request.get_json(force=True)
    user_id = data.get("user_id")

    if not user_id:
        return jsonify({"error": "user_id is required"}), 400

    try:
        with engine.begin() as conn:
            invitation = conn.execute(
                text(
                    """
                    SELECT status FROM group_members
                    WHERE group_id = :gid AND user_id = :uid
                    """
                ),
                {"gid": group_id, "uid": user_id}
            ).first()

            if not invitation:
                return jsonify({"error": "No invitation found"}), 404

            if invitation.status != 'pending':
                return jsonify({"error": "Invitation is not pending"}), 400

            conn.execute(
                text(
                    """
                    UPDATE group_members
                    SET status = 'active'
                    WHERE group_id = :gid AND user_id = :uid
                    """
                ),
                {"gid": group_id, "uid": user_id}
            )

            group = conn.execute(
                text("SELECT owner_user_id FROM `groups` WHERE id = :gid"),
                {"gid": group_id}
            ).first()

            conn.execute(
                text(
                    """
                    UPDATE notifications
                    SET is_read = 1
                    WHERE user_id = :uid
                    AND type = 'group_invitation'
                    AND JSON_EXTRACT(data, '$.group_id') = :gid
                    """
                ),
                {"uid": user_id, "gid": group_id}
            )

        event_bus.publish(
            GroupJoined(
                group_id=group_id,
                user_id=user_id,
                owner_user_id=group.owner_user_id,
            )
        )

        return jsonify({"ok": True, "message": "Invitation accepted"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@bp_groups_commands.post("/<int:group_id>/decline-invitation")
def decline_group_invitation(group_id: int):
    """Decline a pending group invitation"""
    data = request.get_json(force=True)
    user_id = data.get("user_id")

    if not user_id:
        return jsonify({"error": "user_id is required"}), 400

    try:
        with engine.begin() as conn:
            invitation = conn.execute(
                text(
                    """
                    SELECT status FROM group_members
                    WHERE group_id = :gid AND user_id = :uid
                    """
                ),
                {"gid": group_id, "uid": user_id}
            ).first()

            if not invitation:
                return jsonify({"error": "No invitation found"}), 404

            if invitation.status != 'pending':
                return jsonify({"error": "Invitation is not pending"}), 400

            conn.execute(
                text(
                    """
                    DELETE FROM group_members
                    WHERE group_id = :gid AND user_id = :uid
                    """
                ),
                {"gid": group_id, "uid": user_id}
            )

            conn.execute(
                text(
                    """
                    UPDATE notifications
                    SET is_read = 1
                    WHERE user_id = :uid
                    AND type = 'group_invitation'
                    AND JSON_EXTRACT(data, '$.group_id') = :gid
                    """
                ),
                {"uid": user_id, "gid": group_id}
            )

        return jsonify({"ok": True, "message": "Invitation declined"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
