"""Pytest configuration - sets DATABASE_URL to SQLite before any app import."""

from __future__ import annotations

import os

# Must be set BEFORE any app module is imported; prevents the module-level
# Base.metadata.create_all(bind=engine) in main.py from hitting PostgreSQL.
os.environ.setdefault("DATABASE_URL", "sqlite://")

import pytest
from sqlalchemy.orm import sessionmaker

from app.db import engine as test_engine

TestingSessionLocal = sessionmaker(bind=test_engine, expire_on_commit=False)


@pytest.fixture(scope="function", autouse=True)
def setup_db():
    """Create all tables before each test and drop them after."""
    import app.models  # noqa: F401
    from app.db_base import Base

    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)
