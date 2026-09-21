"""Pickup photo upload endpoint - mirrors the electricity-bill upload pipeline."""

from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, File, HTTPException, UploadFile, status

from app.core.config import get_settings
from app.schemas.upload import UploadResponse

settings = get_settings()
router = APIRouter(prefix="/uploads", tags=["uploads"])

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}
BYTES_PER_MB = 1024 * 1024


@router.post("/pickup-photos", response_model=UploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_pickup_photo(file: UploadFile = File(...)) -> UploadResponse:
    """Upload a pickup proof-of-collection photo.

    Accepted formats: JPEG, PNG, WebP.  Max size governed by
    ``settings.max_upload_size_mb`` (same limit as electricity bills).
    Returns the relative path for storage in ``pickup_requests.photo_url``.
    """
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type '{file.content_type}'. Accepted: JPEG, PNG, WebP",
        )

    extension = Path(file.filename or "photo").suffix or ".jpg"
    destination_dir = Path(settings.upload_dir) / "pickup-photos"
    destination_dir.mkdir(parents=True, exist_ok=True)
    stored_name = f"{uuid4().hex}{extension.lower()}"
    destination = destination_dir / stored_name

    content = await file.read()
    if len(content) > settings.max_upload_size_mb * BYTES_PER_MB:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File exceeds the {settings.max_upload_size_mb} MB limit",
        )
    destination.write_bytes(content)

    relative_path = f"pickup-photos/{stored_name}"
    return UploadResponse(
        file_name=file.filename or stored_name,
        stored_path=relative_path,
        public_url=f"/uploads/{relative_path}",
    )
