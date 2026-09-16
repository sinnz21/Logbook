"""Base schema config.

The database is snake_case, React wants camelCase. The conversion happens
here, in Pydantic — not in the frontend and not in the SQL.
"""
from typing import Generic, TypeVar

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel

T = TypeVar("T")


class APIModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,     # accept snake_case in, emit camelCase out
        from_attributes=True,      # build straight from SQLAlchemy objects
    )


class Page(APIModel, Generic[T]):
    """Every list screen in the Figma has pagination, so every list endpoint
    returns this shape."""
    items: list[T]
    total: int
    page: int
    per_page: int

    @property
    def pages(self) -> int:
        return max(1, -(-self.total // self.per_page))
