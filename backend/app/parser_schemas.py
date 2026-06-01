from __future__ import annotations

from typing import Dict, List, Optional

from pydantic import BaseModel, Field


class ParserDiagnosticsOut(BaseModel):
    raw_text_length: int = 0
    detected_sections: List[str] = []
    extraction_counts: Dict[str, int] = {}
    parser_confidence: float = Field(ge=0.0, le=1.0)
    confidence_breakdown: Dict[str, float] = {}


class ParserBenchmarkOut(BaseModel):
    diagnostics: ParserDiagnosticsOut
    skills: List[str] = []
    experience: List[dict] = []
    education: List[dict] = []
    projects: List[dict] = []
    certifications: List[str] = []
