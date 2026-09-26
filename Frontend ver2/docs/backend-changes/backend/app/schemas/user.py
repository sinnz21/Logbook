from datetime import datetime
from typing import Literal

from pydantic import EmailStr, Field

from app.schemas.common import APIModel

Role = Literal["admin", "nurse"]
Status = Literal["active", "inactive"]


class UserOut(APIModel):
    user_id: int
    first_name: str
    middle_name: str | None = None
    last_name: str
    full_name: str
    username: str
    email: str | None = None
    role: Role
    status: Status
    last_login_at: datetime | None = None
    created_at: datetime | None = None


class UserCreate(APIModel):
    first_name: str = Field(min_length=1, max_length=100)
    middle_name: str | None = Field(default=None, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    username: str = Field(min_length=3, max_length=50, pattern=r"^[A-Za-z0-9._-]+$")
    email: EmailStr | None = None
    role: Role
    status: Status = "active"
    password: str = Field(min_length=8, max_length=72)    # bcrypt reads at most 72 bytes


class UserUpdate(APIModel):
    first_name: str | None = Field(default=None, min_length=1, max_length=100)
    middle_name: str | None = Field(default=None, max_length=100)
    last_name: str | None = Field(default=None, min_length=1, max_length=100)
    email: EmailStr | None = None
    role: Role | None = None
    status: Status | None = None
    password: str | None = Field(default=None, min_length=8, max_length=72)   # set = reset it
