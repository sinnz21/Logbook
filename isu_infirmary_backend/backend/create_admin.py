"""Create the first admin account.

    python create_admin.py

Passwords are hashed here, in Python. Never insert one through SQL — the
schema has no column that could hold a plaintext password.
"""
import getpass
import sys

from sqlalchemy import select

from app.core.security import hash_password
from app.db.session import SessionLocal
from app.models.user import User


def main() -> int:
    db = SessionLocal()
    try:
        username = input("Username: ").strip()
        if db.execute(select(User).where(User.username == username)).scalar_one_or_none():
            print(f"User '{username}' already exists.")
            return 1

        first = input("First name: ").strip()
        last = input("Last name: ").strip()
        email = input("Email (optional): ").strip() or None

        pw = getpass.getpass("Password: ")
        if len(pw) < 8:
            print("Password must be at least 8 characters.")
            return 1
        if pw != getpass.getpass("Confirm password: "):
            print("Passwords do not match.")
            return 1

        db.add(User(
            first_name=first, last_name=last, username=username, email=email,
            password_hash=hash_password(pw), role="admin", status="active",
        ))
        db.commit()
        print(f"Admin '{username}' created.")
        return 0
    finally:
        db.close()


if __name__ == "__main__":
    sys.exit(main())
