"""Configuration module for environment variable loading."""

import os
from functools import lru_cache

from dotenv import load_dotenv

load_dotenv()


class Settings:
    """Application settings loaded from environment variables."""

    # Database
    database_url: str = os.getenv("DATABASE_URL", "")

    # Authentication
    better_auth_secret: str = os.getenv("BETTER_AUTH_SECRET", "")

    # CORS
    allowed_origins: list[str] = [
        origin.strip()
        for origin in os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
        if origin.strip()
    ]

    # Server
    host: str = os.getenv("HOST", "0.0.0.0")
    port: int = int(os.getenv("PORT", "8000"))

    def validate(self) -> None:
        """Validate required settings are present."""
        if not self.database_url:
            raise ValueError("DATABASE_URL environment variable is required")
        if not self.better_auth_secret:
            raise ValueError("BETTER_AUTH_SECRET environment variable is required")
        if len(self.better_auth_secret) < 32:
            raise ValueError("BETTER_AUTH_SECRET must be at least 32 characters")


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    settings = Settings()
    return settings
