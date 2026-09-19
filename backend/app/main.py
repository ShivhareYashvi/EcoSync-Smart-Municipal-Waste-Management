from contextlib import asynccontextmanager
from pathlib import Path
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.v1.router import router as api_v1_router
from app.core.config import get_settings
from app.db import engine
from app.db_base import Base

# Import all models so SQLAlchemy registers them before create_all
import app.models  # noqa: F401

settings = get_settings()
Path(settings.upload_dir).mkdir(parents=True, exist_ok=True)


@asynccontextmanager
async def lifespan(application: FastAPI) -> AsyncGenerator[None, None]:
    """Start the background scheduler on startup; stop it on shutdown."""
    from app.scheduler import scheduler
    scheduler.start()
    try:
        yield
    finally:
        scheduler.shutdown(wait=False)


# Auto-create tables (works for SQLite dev; use Alembic for production)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.app_name,
    description="Smart municipal waste management platform API for EcoSync.",
    version="0.1.0",
    lifespan=lifespan,
)

from app.middleware.idempotency_middleware import IdempotencyMiddleware

app.add_middleware(IdempotencyMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[str(settings.frontend_origin).rstrip("/")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory=settings.upload_dir), name="uploads")


@app.get("/health", tags=["system"])
def health_check() -> dict[str, str]:
    """Basic health check used by deployment platforms."""

    return {"status": "ok", "service": "ecosync-api"}


app.include_router(api_v1_router, prefix=settings.api_v1_prefix)
