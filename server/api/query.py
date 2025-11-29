from flask import Blueprint, jsonify
from sqlalchemy import text

from db import engine

bp_query = Blueprint("query", __name__)


@bp_query.get("/health")
def health():
    return jsonify({"ok": True, "message": "query layer active"}), 200


@bp_query.get("/users/<int:user_id>/overview")
def get_user_overview(user_id: int):
    try:
        with engine.connect() as conn:
            user = conn.execute(
                text(
                    "SELECT id, email, name, major, year "
                    "FROM users WHERE id = :uid"
                ),
                {"uid": user_id},
            ).mappings().first()

            if not user:
                return jsonify({"error": "User not found"}), 404

            avail = conn.execute(
                text(
                    "SELECT slot FROM availability_text "
                    "WHERE user_id = :uid ORDER BY created_at"
                ),
                {"uid": user_id},
            ).fetchall()

            courses = conn.execute(
                text(
                    "SELECT c.id, c.code, c.name "
                    "FROM enrollments e "
                    "JOIN courses c ON e.course_id = c.id "
                    "WHERE e.user_id = :uid"
                ),
                {"uid": user_id},
            ).fetchall()

        return jsonify(
            {
                "user": dict(user),
                "availability": [r.slot for r in avail],
                "courses": [dict(c) for c in courses],
            }
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@bp_query.get("/users/<int:user_id>/matches")
def get_user_matches(user_id: int):
    try:
        with engine.connect() as conn:
            user_exists = conn.execute(
                text("SELECT id FROM users WHERE id = :uid"),
                {"uid": user_id},
            ).first()
            if not user_exists:
                return jsonify({"error": "User not found"}), 404

            q = text(
                """
                WITH user_courses AS (
                    SELECT course_id
                    FROM enrollments
                    WHERE user_id = :uid
                )
                SELECT u.id, u.name, u.email,
                       COUNT(*) AS shared_courses
                FROM enrollments e
                JOIN user_courses uc ON e.course_id = uc.course_id
                JOIN users u ON e.user_id = u.id
                WHERE e.user_id <> :uid
                GROUP BY u.id, u.name, u.email
                ORDER BY shared_courses DESC, u.name
                """
            )
            rows = conn.execute(q, {"uid": user_id}).fetchall()

        matches = [dict(r) for r in rows]
        return jsonify({"matches": matches})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@bp_query.get("/groups")
def query_groups():
    try:
        q = text(
            """
            SELECT g.id, g.name, g.description,
                   g.meeting_time, g.location, g.max_members,
                   c.code AS course_code,
                   u.name AS owner_name
            FROM `groups` g
            JOIN courses c ON g.course_id = c.id
            JOIN users u ON g.owner_user_id = u.id
            """
        )
        with engine.connect() as conn:
            rows = conn.execute(q).mappings().all()
        return jsonify([dict(r) for r in rows])
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@bp_query.get("/groups/<int:group_id>")
def query_group_detail(group_id: int):
    try:
        with engine.connect() as conn:
            g = conn.execute(
                text(
                    """
                    SELECT g.id, g.name, g.description,
                           g.meeting_time, g.location, g.max_members,
                           c.name AS course_name,
                           u.name AS owner_name
                    FROM `groups` g
                    JOIN courses c ON g.course_id = c.id
                    JOIN users u ON g.owner_user_id = u.id
                    WHERE g.id = :gid
                    """
                ),
                {"gid": group_id},
            ).mappings().first()

            if not g:
                return jsonify({"error": "Group not found"}), 404

            members = conn.execute(
                text(
                    """
                    SELECT u.id, u.name, u.email, gm.role, gm.status
                    FROM group_members gm
                    JOIN users u ON gm.user_id = u.id
                    WHERE gm.group_id = :gid
                    """
                ),
                {"gid": group_id},
            ).mappings().all()

            msgs = conn.execute(
                text(
                    """
                    SELECT m.id, m.content, m.created_at, u.name AS author_name
                    FROM messages m
                    JOIN users u ON m.user_id = u.id
                    WHERE m.group_id = :gid
                    ORDER BY m.created_at DESC
                    """
                ),
                {"gid": group_id},
            ).mappings().all()

        data = dict(g)
        data["members"] = [dict(m) for m in members]
        data["messages"] = [dict(m) for m in msgs]
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
