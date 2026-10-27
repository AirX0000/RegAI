import os
from typing import List, Union, Optional
from pydantic import AnyHttpUrl, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from dotenv import load_dotenv

# Preload .env before Settings init
env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), ".env")
load_dotenv(env_path)

class Settings(BaseSettings):
    PROJECT_NAME: str = "RegAI"
    API_V1_STR: str = "/api/v1"
    DATABASE_URL: str = "sqlite:///./regai.db"
    SECRET_KEY: str = "dev_secret_key_change_in_prod"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 30  # 30 days (43,200 minutes) for persistent session
    JWT_ALGORITHM: str = "HS256"
    FIRST_SUPERUSER_EMAIL: str = "admin@example.com"
    FIRST_SUPERUSER_PASSWORD: str = "ChangeMe123!"
    
    EMBEDDINGS_PROVIDER: str = "openai"
    OPENAI_API_KEY: str = ""
    GEMINI_API_KEY: str = ""
    ANTIGRAVITY_LOCAL_MODEL_PATH: str = ""
    ANTIGRAVITY_VERTEX_ENABLED: bool = False
    ANTIGRAVITY_GCP_PROJECT: str = ""
    ANTIGRAVITY_GCP_LOCATION: str = "us-central1"
    CHROMA_DIR: str = "./chroma_db"
    CHROMA_SERVER_HOST: Optional[str] = None
    CHROMA_SERVER_PORT: int = 8000
    CHROMA_SERVER_SSL: bool = False
    
    # Store as string in env, parse to list
    CORS_ORIGINS: Union[str, List[str]] = ["http://localhost:5173", "http://localhost:3000"]

    OIDC_ENABLED: bool = False
    OIDC_ISSUER_URL: str = ""
    OIDC_CLIENT_ID: str = ""
    OIDC_CLIENT_SECRET: str = ""
    
    RATE_LIMIT_PER_MINUTE: int = 600
    TENANT_DEFAULT_PLAN: str = "free"
    LOG_JSON: bool = False
    ENVIRONMENT: str = "production"
    ALLOW_DEMO_LOGIN: bool = False
    DEMO_MODE: bool = False

    model_config = SettingsConfigDict(case_sensitive=True, env_file=env_path, extra="ignore")

    @model_validator(mode="before")
    @classmethod
    def parse_cors_origins(cls, data: dict):
        if isinstance(data.get("CORS_ORIGINS"), str):
            import json
            try:
                data["CORS_ORIGINS"] = json.loads(data["CORS_ORIGINS"])
            except json.JSONDecodeError:
                # Fallback for CSV
                data["CORS_ORIGINS"] = [x.strip() for x in data["CORS_ORIGINS"].split(",")]
        return data

    @model_validator(mode="after")
    def validate_production_security(self) -> "Settings":
        env = (self.ENVIRONMENT or "").lower()
        if env == "production":
            insecure_keys = {
                "dev_secret_key_change_in_prod",
                "change_this_to_a_secure_random_hex_key_32_bytes",
                "secret",
                "changeme",
            }
            if not self.SECRET_KEY or self.SECRET_KEY in insecure_keys or len(self.SECRET_KEY) < 32:
                raise ValueError(
                    "CRITICAL SECURITY CONFIGURATION ERROR: SECRET_KEY is missing, using an insecure default, or shorter than 32 characters in production. "
                    "Set a strong SECRET_KEY in your environment or .env file."
                )
        return self

settings = Settings()
