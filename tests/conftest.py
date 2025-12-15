import os
import importlib
import pkgutil
import sqlalchemy
from sqlalchemy import text, create_engine
import pytest


def _create_sqlite_tables(engine):
    # create minimal schema compatible with SQLite for tests
    stmts = [
        """
        CREATE TABLE users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            name TEXT NOT NULL,
            major TEXT NULL,
            year TEXT NULL,
            avatar TEXT NULL,
            bio TEXT NULL,
            study_prefs TEXT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """,
        """
        CREATE TABLE courses (
            id TEXT PRIMARY KEY,
            code TEXT NOT NULL,
            name TEXT NOT NULL,
            section TEXT NOT NULL,
            instructor TEXT NOT NULL,
            schedule TEXT NOT NULL,
            students INTEGER NOT NULL,
            building TEXT NULL,
            room TEXT NULL
        );
        """,
        """
        CREATE TABLE enrollments (
            user_id INTEGER NOT NULL,
            course_id TEXT NOT NULL,
            enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """,
        """
        CREATE TABLE availability_text (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            slot TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """,
        """
        CREATE TABLE `groups` (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            owner_user_id INTEGER NOT NULL,
            course_id TEXT NOT NULL,
            name TEXT NOT NULL,
            description TEXT NULL,
            meeting_time TEXT NULL,
            location TEXT NULL,
            max_members INTEGER NULL,
            tags TEXT NULL,
            is_archived INTEGER NOT NULL DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """,
        """
        CREATE TABLE group_members (
            group_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            role TEXT NOT NULL DEFAULT 'member',
            status TEXT NOT NULL DEFAULT 'active',
            joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(group_id, user_id)
        );
        """,
        """
        CREATE TABLE messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            group_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            content TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            posted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """,
        """
        CREATE TABLE notifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            type TEXT NOT NULL,
            data TEXT NULL,
            is_read INTEGER NOT NULL DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """,
    ]

    with engine.begin() as conn:
        for stmt in stmts:
            conn.execute(text(stmt))


@pytest.fixture(scope="session")
def test_engine():
    engine = create_engine("sqlite:///:memory:", future=True)
    _create_sqlite_tables(engine)
    return engine


@pytest.fixture(scope="session")
def app(test_engine):
    # ensure server folder is on sys.path so the app can import `api` package
    import sys
    import types

    server_dir = os.path.join(os.getcwd(), "server")
    if server_dir not in sys.path:
        sys.path.insert(0, server_dir)

    # create a lightweight `db` module in sys.modules and set test engine so
    # `from db import engine` in api modules resolves to our test engine
    db_mod = types.ModuleType("db")
    db_mod.engine = test_engine
    sys.modules["db"] = db_mod

    # iterate server/api submodules and set engine attr when present
    api_pkg_path = os.path.join(server_dir, "api")
    if os.path.isdir(api_pkg_path):
        for finder, name, ispkg in pkgutil.walk_packages(path=[api_pkg_path], prefix="api."):
            mod = importlib.import_module(name)
            if hasattr(mod, "engine"):
                setattr(mod, "engine", test_engine)

    # import app factory and create testing app (imports will resolve now)
    from app import create_app

    app = create_app()
    app.config.update({"TESTING": True})

    yield app


@pytest.fixture
def client(app):
    return app.test_client()
