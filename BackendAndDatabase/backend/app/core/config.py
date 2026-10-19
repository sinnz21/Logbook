from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    DB_USER: str = "root"
    DB_PASSWORD: str = ""
    DB_HOST: str = "localhost"
    DB_PORT: int = 3306
    DB_NAME: str = "isu_infirmary"

    SECRET_KEY: str = "change-me"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480

    CLINIC_TIMEZONE: str = "Asia/Manila"
    CORS_ORIGINS: str = "http://localhost:5173"

    # Backups. Leave the tool paths empty to auto-detect (PATH, then C:\xampp\mysql\bin).
    MYSQLDUMP_PATH: str = ""
    MYSQL_PATH: str = ""
    BACKUP_DIR: str = "backups"

    # Gmail for forgot-password codes. SMTP_PASSWORD is a Gmail App Password.
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_NAME: str = "ISU Infirmary"
    RESET_CODE_MINUTES: int = 5

    @property
    def database_url(self) -> str:
        pw = f":{self.DB_PASSWORD}" if self.DB_PASSWORD else ""
        return (
            f"mysql+pymysql://{self.DB_USER}{pw}@{self.DB_HOST}:{self.DB_PORT}/"
            f"{self.DB_NAME}?charset=utf8mb4"
        )

    @property
    def cors_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
