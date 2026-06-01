from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import List, Optional

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


class Resume(Base):
    __tablename__ = "resumes"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    file_size: Mapped[int] = mapped_column(Integer, nullable=False)
    mime_type: Mapped[str] = mapped_column(String(64), nullable=False, default="application/pdf")
    storage_path: Mapped[str] = mapped_column(String(512), nullable=False)
    supabase_object_key: Mapped[str] = mapped_column(String(512), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    uploaded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    user: Mapped["User"] = relationship(back_populates="resumes")
    analysis: Mapped[Optional["ResumeAnalysis"]] = relationship(
        back_populates="resume",
        uselist=False,
        cascade="all, delete-orphan",
    )
    extracted_skills: Mapped[List["ExtractedSkill"]] = relationship(
        cascade="all, delete-orphan",
    )
    extracted_projects: Mapped[List["ExtractedProject"]] = relationship(
        cascade="all, delete-orphan",
    )
    extracted_education: Mapped[List["ExtractedEducation"]] = relationship(
        cascade="all, delete-orphan",
    )
    extracted_experience: Mapped[List["ExtractedExperience"]] = relationship(
        cascade="all, delete-orphan",
    )
    extracted_certifications: Mapped[List["ExtractedCertification"]] = relationship(
        cascade="all, delete-orphan",
    )


from .analysis_models import (  # noqa: E402, F401
    ExtractedCertification,
    ExtractedEducation,
    ExtractedExperience,
    ExtractedProject,
    ExtractedSkill,
    ResumeAnalysis,
)
