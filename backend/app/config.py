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


settings = Settings()


def get_frontend_origins() -> list[str]:
    return [origin.strip() for origin in settings.frontend_origins.split(",") if origin.strip()]

