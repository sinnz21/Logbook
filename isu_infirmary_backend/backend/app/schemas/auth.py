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
