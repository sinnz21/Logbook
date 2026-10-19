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


class ForgotRequest(APIModel):
    username: str = Field(min_length=1, max_length=50)


class VerifyCodeRequest(APIModel):
    username: str = Field(min_length=1, max_length=50)
    code: str = Field(min_length=6, max_length=6, pattern=r"^\d{6}$")


class ResetRequest(APIModel):
    username: str = Field(min_length=1, max_length=50)
    reset_token: str = Field(min_length=10, max_length=100)
    new_password: str = Field(min_length=8, max_length=72)

