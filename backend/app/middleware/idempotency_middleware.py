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
_IDEMPOTENT_TARGET_PATTERNS = [
    re.compile(r"^/api/v1/pickups/\d+/log$"),
    re.compile(r"^/api/v1/routes/\d+/stops/\d+/status$"),
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

            with _get_db_session(request) as session:
                try:
                    record = IdempotencyKey(
                        key=key,
                        user_id=None,
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
