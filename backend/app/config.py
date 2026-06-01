from __future__ import annotations

from typing import List

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", case_sensitive=False)

    app_name: str = "Nexus Auth API"
    app_env: str = "development"
    database_url: str = "postgresql+psycopg2://postgres:postgres@localhost:5432/nexus"
    jwt_secret_key: str = "change-me"
    jwt_algorithm: str = "HS256"
    jwt_access_token_expires_minutes: int = 60
    frontend_origins: str = "http://localhost:3000,http://localhost:5173"

    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_service_role_key: str = ""
    supabase_bucket_name: str = "resumes"

    @field_validator("supabase_url", "supabase_anon_key", "supabase_service_role_key", mode="before")
    @classmethod
    def strip_env_strings(cls, value: object) -> object:
        if isinstance(value, str):
            return value.strip()
        return value


settings = Settings()


def get_frontend_origins() -> List[str]:
    return [origin.strip() for origin in settings.frontend_origins.split(",") if origin.strip()]

