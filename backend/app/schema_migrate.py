"""Lightweight dev migrations — adds columns when models evolve before Alembic."""

from __future__ import annotations

from sqlalchemy import inspect, text
from sqlalchemy.engine import Engine

from .database import Base


def _column_names(engine: Engine, table: str) -> set[str]:
    inspector = inspect(engine)
    if table not in inspector.get_table_names():
        return set()
    return {col["name"] for col in inspector.get_columns(table)}


def _add_column(engine: Engine, table: str, column: str, ddl: str) -> None:
    if column in _column_names(engine, table):
        return
    with engine.begin() as conn:
        conn.execute(text(f"ALTER TABLE {table} ADD COLUMN IF NOT EXISTS {column} {ddl}"))


def run_schema_migrations(engine: Engine) -> None:
    Base.metadata.create_all(bind=engine)

    _add_column(engine, "user_profiles", "phone", "VARCHAR(32)")
    _add_column(engine, "user_profiles", "location", "VARCHAR(120)")
    _add_column(engine, "user_profiles", "college", "VARCHAR(160)")
    _add_column(engine, "user_profiles", "degree", "VARCHAR(120)")
    _add_column(engine, "user_profiles", "graduation_year", "VARCHAR(8)")
    _add_column(engine, "user_profiles", "current_status", "VARCHAR(40)")
    _add_column(engine, "user_profiles", "experience", "TEXT")
    _add_column(engine, "user_profiles", "auto_apply", "BOOLEAN NOT NULL DEFAULT FALSE")
    _add_column(engine, "user_profiles", "require_approval", "BOOLEAN NOT NULL DEFAULT TRUE")
    _add_column(engine, "user_profiles", "daily_opportunity_limit", "INTEGER NOT NULL DEFAULT 10")
    _add_column(
        engine,
        "user_profiles",
        "updated_at",
        "TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()",
    )

    _add_column(engine, "career_preferences", "preferred_roles", "JSONB NOT NULL DEFAULT '[]'::jsonb")
    _add_column(engine, "career_preferences", "preferred_locations", "JSONB NOT NULL DEFAULT '[]'::jsonb")
    _add_column(engine, "career_preferences", "employment_type", "VARCHAR(32)")
    _add_column(engine, "career_preferences", "work_preference", "VARCHAR(32)")
    _add_column(engine, "career_preferences", "expected_salary", "VARCHAR(64)")
    _add_column(
        engine,
        "career_preferences",
        "updated_at",
        "TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()",
    )

    _add_column(engine, "onboarding_status", "is_completed", "BOOLEAN NOT NULL DEFAULT FALSE")
    _add_column(engine, "onboarding_status", "current_step", "INTEGER NOT NULL DEFAULT 1")
    _add_column(engine, "onboarding_status", "completed_at", "TIMESTAMP WITH TIME ZONE")
    _add_column(
        engine,
        "onboarding_status",
        "updated_at",
        "TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()",
    )
