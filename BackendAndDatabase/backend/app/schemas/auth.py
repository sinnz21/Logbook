from pydantic import Field

from app.schemas.common import APIModel


class LoginRequest(APIModel):
    username: str
    password: str


class TokenResponse(APIModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    username: str
    full_name: str
    role: str


EMAIL = r"^[^@\s]+@[^@\s]+\.[^@\s]+$"


class ForgotRequest(APIModel):
    email: str = Field(min_length=3, max_length=150, pattern=EMAIL)


class VerifyCodeRequest(APIModel):
    email: str = Field(min_length=3, max_length=150, pattern=EMAIL)
    code: str = Field(min_length=6, max_length=6, pattern=r"^\d{6}$")


class ResetRequest(APIModel):
    reset_token: str = Field(min_length=10, max_length=100)
    new_password: str = Field(min_length=8, max_length=72)
