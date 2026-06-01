from __future__ import annotations

import re
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy.orm import Session

from .models import User
from .resume_models import Resume
from .supabase_storage import SupabaseStorage, build_object_key, build_storage_path

MAX_RESUME_BYTES = 10 * 1024 * 1024
PDF_MAGIC = b"%PDF"
ALLOWED_MIME = "application/pdf"
BLOCKED_EXTENSIONS = {".doc", ".docx", ".txt", ".zip", ".rtf", ".odt"}


def validate_pdf_upload(file_name: str, mime_type: Optional[str], content: bytes) -> None:
    lower_name = file_name.lower().strip()
    for ext in BLOCKED_EXTENSIONS:
        if lower_name.endswith(ext):
            raise ValueError(f"Unsupported file type. Only PDF files are allowed (rejected {ext}).")

    if not lower_name.endswith(".pdf"):
        raise ValueError("Only PDF files are allowed. File must have a .pdf extension.")

    if mime_type and mime_type not in (ALLOWED_MIME, "application/x-pdf"):
        raise ValueError("Only PDF files are allowed.")

    if len(content) == 0:
        raise ValueError("File is empty.")

    if len(content) > MAX_RESUME_BYTES:
        raise ValueError("File exceeds the 10 MB maximum size.")

    if not content.startswith(PDF_MAGIC):
        raise ValueError("Invalid PDF file.")


def default_title(file_name: str) -> str:
    base = re.sub(r"\.pdf$", "", file_name, flags=re.IGNORECASE).strip()
    return base or "Resume"


def get_user_resume(db: Session, user_id: str, resume_id: str) -> Optional[Resume]:
    return (
        db.query(Resume)
        .filter(Resume.id == resume_id, Resume.user_id == user_id)
        .first()
    )


def get_active_resume(db: Session, user_id: str) -> Optional[Resume]:
    return (
        db.query(Resume)
        .filter(Resume.user_id == user_id, Resume.is_active.is_(True))
        .first()
    )


def deactivate_all_resumes(db: Session, user_id: str, except_id: Optional[str] = None) -> None:
    query = db.query(Resume).filter(Resume.user_id == user_id, Resume.is_active.is_(True))
    if except_id:
        query = query.filter(Resume.id != except_id)
    for row in query.all():
        row.is_active = False
        row.updated_at = datetime.now(timezone.utc)
        db.add(row)


def activate_resume(db: Session, resume: Resume) -> Resume:
    deactivate_all_resumes(db, resume.user_id, except_id=resume.id)
    resume.is_active = True
    resume.updated_at = datetime.now(timezone.utc)
    db.add(resume)
    return resume


def user_has_resumes(db: Session, user_id: str) -> bool:
    return db.query(Resume.id).filter(Resume.user_id == user_id).first() is not None
