import logging
from contextlib import asynccontextmanager
from pathlib import Path
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from starlette.requests import Request
from starlette.responses import JSONResponse

from app.api.v1.router import router as api_v1_router
from app.core.config import get_settings
from app.db import engine
from app.db_base import Base

# Import all models so SQLAlchemy registers them before create_all
import app.models  # noqa: F401

logger = logging.getLogger("ecosync")
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)

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

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Sanitize unhandled exceptions to prevent stack trace leaks in production."""
    logger.error("Unhandled exception processing %s %s: %s", request.method, request.url.path, str(exc), exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal municipal server error occurred. Please try again later."},
    )

from app.middleware.idempotency_middleware import IdempotencyMiddleware

app.add_middleware(IdempotencyMiddleware)

# Robust, compliant CORS configuration: Never pair allow_origins=['*'] with allow_credentials=True
configured_origin = str(settings.frontend_origin).rstrip("/")
allowed_origins = [
    configured_origin,
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"^https:\/\/(cleaning-by-govt-f3na|[a-zA-Z0-9_-]+)\.vercel\.app$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory=settings.upload_dir), name="uploads")


@app.get("/", tags=["system"])
def root() -> dict[str, str]:
    """Root endpoint providing links to documentation and health status."""
    return {
        "message": f"Welcome to {settings.app_name}",
        "docs": "/docs",
        "health": "/health",
    }


@app.get("/health", tags=["system"])
def health_check() -> dict[str, str]:
    """Basic health check used by deployment platforms."""
    return {"status": "ok", "service": "ecosync-api"}


app.include_router(api_v1_router, prefix=settings.api_v1_prefix)

from app.admin import init_admin

# Initialize SQLAdmin Django-style admin dashboard at /admin
admin = init_admin(app)
