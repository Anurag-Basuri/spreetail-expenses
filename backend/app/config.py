from decimal import Decimal
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    USD_TO_INR_RATE: Decimal = Decimal('84.0')
    PERCENTAGE_TOLERANCE: Decimal = Decimal('0.01')

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

settings = Settings()
