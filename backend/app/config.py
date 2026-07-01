from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    app_name: str = "Songlist API"
    database_url: str = "sqlite:///./data/songlist.db"
    netease_api_url: str = "http://netease-api:3000"
    starlwr_api_url: str = "https://api.starlwr.com"
    cors_origins: str = "*"

    class Config:
        env_file = ".env"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
