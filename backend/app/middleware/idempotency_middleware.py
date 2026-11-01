import hashlib
import json
import re
from datetime import datetime, timedelta, timezone
from typing import Callable

from contextlib import contextmanager
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from app.db import SessionLocal
from app.models.idempotency_key import IdempotencyKey

# Regex matching targets:
# - POST /api/v1/pickups/{id}/log
# - PATCH /api/v1/routes/{id}/stops/{stop_id}/status
# - POST /api/v1/pickups (and /api/v1/operations/pickups)
# - POST /api/v1/redemptions/claim
# - PATCH /api/v1/operations/rewards/{id}/redeem
# - POST /api/v1/recycling/transactions/{id}/confirm
_IDEMPOTENT_TARGET_PATTERNS = [
    re.compile(r"^/api/v1/pickups/\d+/log$"),
    re.compile(r"^/api/v1/routes/\d+/stops/\d+/status$"),
    re.compile(r"^/api/v1/pickups$"),
    re.compile(r"^/api/v1/operations/pickups$"),
    re.compile(r"^/api/v1/redemptions/claim$"),
    re.compile(r"^/api/v1/operations/rewards/\d+/redeem$"),
    re.compile(r"^/api/v1/recycling/transactions/\d+/confirm$"),
]


@contextmanager
def _get_db_session(request: Request):
    from app.db import get_db

    override = (
        request.app.dependency_overrides.get(get_db)
        if hasattr(request, "app") and hasattr(request.app, "dependency_overrides")
        else None
    )
    if override:
        gen = override()
        db = next(gen)
        try:
            yield db
        finally:
            try:
                next(gen)
            except StopIteration:
                pass
    else:
        with SessionLocal() as session:
            yield session



class IdempotencyMiddleware(BaseHTTPMiddleware):
    """Guarantees single execution of mutating operations when an Idempotency-Key header is supplied.

    - If the key exists with identical request hash: returns the cached response without re-executing.
    - If the key exists with mismatched request hash: returns HTTP 409 Conflict.
    - If new key: executes the request, caches the successful 2xx response, and returns it.
    """

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Exempt SQLAdmin dashboard and admin endpoints from idempotency processing
        if request.url.path.startswith("/admin"):
            return await call_next(request)

        idempotency_key = request.headers.get("Idempotency-Key") or request.headers.get("X-Idempotency-Key")

        # Only apply to mutating methods and matching endpoints if key is present
        if not idempotency_key or request.method not in ("POST", "PATCH", "PUT"):
            return await call_next(request)

        path = request.url.path
        is_target = any(pattern.match(path) for pattern in _IDEMPOTENT_TARGET_PATTERNS)
        if not is_target:
            return await call_next(request)

        key = idempotency_key.strip()
        body_bytes = await request.body()
        request_hash = hashlib.sha256(body_bytes).hexdigest()

        # Check existing key in DB
        with _get_db_session(request) as session:
            existing = session.get(IdempotencyKey, key)
            now = datetime.now(timezone.utc)
            if existing:
                # Check expiration
                expires_at = existing.expires_at
                if expires_at.tzinfo is None:
                    expires_at = expires_at.replace(tzinfo=timezone.utc)

                if expires_at > now:
                    if existing.request_hash == request_hash:
                        # Return cached response
                        return Response(
                            content=existing.response_body,
                            status_code=existing.response_status,
                            media_type="application/json",
                            headers={
                                "X-Cache-Lookup": "HIT",
                                "Idempotency-Key": key,
                            },
                        )
                    else:
                        # Conflict: same key, different payload
                        return Response(
                            content=json.dumps(
                                {
                                    "detail": "Idempotency key was previously used with a different request payload."
                                }
                            ),
                            status_code=409,
                            media_type="application/json",
                            headers={"Idempotency-Key": key},
                        )

        # Rewind request body so downstream handler can consume it
        async def receive():
            return {"type": "http.request", "body": body_bytes}

        request._receive = receive

        # Execute endpoint
        response = await call_next(request)

        # Only cache successful 2xx responses
        if 200 <= response.status_code < 300:
            res_body_chunks = [chunk async for chunk in response.body_iterator]
            full_res_body = b"".join(res_body_chunks)
            res_text = full_res_body.decode("utf-8", errors="replace")

            # Extract calling user_id if Bearer token present
            caller_user_id = None
            auth_header = request.headers.get("Authorization")
            if auth_header and auth_header.startswith("Bearer "):
                try:
                    from jose import jwt
                    from app.core.config import get_settings
                    jwt_st = get_settings()
                    claims = jwt.decode(auth_header[7:], jwt_st.jwt_secret_key, algorithms=[jwt_st.jwt_algorithm])
                    caller_user_id = int(claims.get("sub", 0)) or None
                except Exception:
                    pass

            with _get_db_session(request) as session:
                try:
                    record = IdempotencyKey(
                        key=key,
                        user_id=caller_user_id,
                        endpoint=path,
                        request_hash=request_hash,
                        response_status=response.status_code,
                        response_body=res_text,
                        created_at=now,
                        expires_at=now + timedelta(hours=24),
                    )
                    session.add(record)
                    session.commit()
                except Exception:
                    session.rollback()

            # Reconstruct response with headers
            resp_headers = dict(response.headers)
            resp_headers["Idempotency-Key"] = key
            return Response(
                content=full_res_body,
                status_code=response.status_code,
                headers=resp_headers,
                media_type=response.media_type or "application/json",
            )

        return response
