from datetime import datetime, timedelta, timezone
from typing import Any

import bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt
from jose.exceptions import JWTError
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db import get_db
from app.models.user import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


def hash_password(password: str) -> str:
    """Hash a plaintext password for safe persistence using bcrypt."""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain_password: str, password_hash: str | None) -> bool:
    """Verify a plaintext password against a stored password hash."""
    if not password_hash or not plain_password:
        return False
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), password_hash.encode("utf-8"))
    except Exception:
        return False


def create_access_token(subject: str, claims: dict[str, Any] | None = None, expires_delta: timedelta | None = None) -> str:
    """Create a signed JWT access token (15-minute lifespan)."""
    settings = get_settings()
    # Default 15 minutes
    ttl = expires_delta or timedelta(minutes=15)
    expires_at = datetime.now(timezone.utc) + ttl
    payload: dict[str, Any] = {"sub": subject, "exp": expires_at, "type": "access"}
    if claims:
        payload.update(claims)
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def create_refresh_token(subject: str, claims: dict[str, Any] | None = None) -> str:
    """Create a signed JWT refresh token (30-day lifespan)."""
    settings = get_settings()
    expires_at = datetime.now(timezone.utc) + timedelta(days=30)
    payload: dict[str, Any] = {"sub": subject, "exp": expires_at, "type": "refresh"}
    if claims:
        payload.update(claims)
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def verify_refresh_token(token: str) -> int:
    """Verify refresh token and return the user ID subject."""
    settings = get_settings()
    invalid_token_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired refresh token",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
        if payload.get("type") != "refresh":
            raise invalid_token_error
        subject = payload.get("sub")
        return int(subject)
    except (JWTError, TypeError, ValueError):
        raise invalid_token_error


def get_current_user(token: str = Depends(oauth2_scheme), session: Session = Depends(get_db)) -> User:
    """Resolve the authenticated user from the signed access token."""
    settings = get_settings()
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate authentication credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
        # Allow legacy tokens without type or verify type is access
        token_type = payload.get("type")
        if token_type and token_type != "access":
            raise credentials_error
        subject = payload.get("sub")
        user_id = int(subject)
    except (JWTError, TypeError, ValueError):
        raise credentials_error

    user = session.scalar(select(User).where(User.id == user_id))
    if user is None:
        raise credentials_error
    return user
