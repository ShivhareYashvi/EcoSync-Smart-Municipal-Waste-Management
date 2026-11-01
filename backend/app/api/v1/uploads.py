from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, File, HTTPException, UploadFile, status

from app.core.config import get_settings
from app.schemas.upload import UploadResponse

settings = get_settings()
router = APIRouter(prefix="/uploads", tags=["uploads"])
ALLOWED_CONTENT_TYPES = {"application/pdf", "image/jpeg", "image/png", "image/webp"}
BYTES_PER_MB = 1024 * 1024
CHUNK_SIZE = 64 * 1024  # 64 KB streaming chunks to prevent RAM exhaustion


def _validate_magic_bytes(header: bytes, content_type: str) -> bool:
    """Validate initial file signature against advertised MIME type."""
    if content_type == "application/pdf":
        return header.startswith(b"%PDF")
    if content_type == "image/jpeg":
        return header.startswith(b"\xff\xd8\xff")
    if content_type == "image/png":
        return header.startswith(b"\x89PNG\r\n\x1a\n")
    if content_type == "image/webp":
        return header.startswith(b"RIFF") and b"WEBP" in header[:16]
    return False


async def _save_streamed_file(file: UploadFile, subfolder: str) -> tuple[str, str]:
    """Stream an uploaded file to disk in chunks, enforcing max size and signature validation."""
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file type. Only PDF, JPEG, PNG, and WebP are accepted.",
        )

    extension = Path(file.filename or "doc").suffix or ".bin"
    destination_dir = Path(settings.upload_dir) / subfolder
    destination_dir.mkdir(parents=True, exist_ok=True)
    stored_name = f"{uuid4().hex}{extension.lower()}"
    destination = destination_dir / stored_name

    max_bytes = settings.max_upload_size_mb * BYTES_PER_MB
    total_bytes = 0
    first_chunk = True

    with open(destination, "wb") as out_file:
        while True:
            chunk = await file.read(CHUNK_SIZE)
            if not chunk:
                break
            if first_chunk:
                first_chunk = False
                if not _validate_magic_bytes(chunk[:32], file.content_type):
                    destination.unlink(missing_ok=True)
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="File content does not match the specified format.",
                    )
            total_bytes += len(chunk)
            if total_bytes > max_bytes:
                destination.unlink(missing_ok=True)
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Uploaded file exceeds the maximum allowed size of {settings.max_upload_size_mb} MB.",
                )
            out_file.write(chunk)

    relative_path = f"{subfolder}/{stored_name}"
    return stored_name, relative_path


@router.post("/electricity-bills", response_model=UploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_electricity_bill(file: UploadFile = File(...)) -> UploadResponse:
    stored_name, relative_path = await _save_streamed_file(file, "electricity-bills")
    return UploadResponse(
        file_name=file.filename or stored_name,
        stored_path=relative_path,
        public_url=f"/uploads/{relative_path}",
    )


@router.post("/verification-docs", response_model=UploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_verification_doc(file: UploadFile = File(...)) -> UploadResponse:
    """Upload a recycler trade license or municipal verification document."""
    stored_name, relative_path = await _save_streamed_file(file, "verification-docs")
    return UploadResponse(
        file_name=file.filename or stored_name,
        stored_path=relative_path,
        public_url=f"/uploads/{relative_path}",
    )
