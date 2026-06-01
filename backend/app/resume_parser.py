from __future__ import annotations

import logging
import re
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple

from .resume_skills_library import SKILLS_LIBRARY

logger = logging.getLogger(__name__)

# Match longest skill names first (e.g. "Machine Learning" before "Learning")
SKILLS_SORTED: List[str] = sorted(SKILLS_LIBRARY, key=len, reverse=True)

# Canonical section headers (line match after normalization; longest / most specific first)
SECTION_HEADER_PATTERNS: List[Tuple[str, re.Pattern[str]]] = [
    ("summary", re.compile(r"^(?:professional\s+)?summary$|^profile$|^about(?:\s+me)?$", re.IGNORECASE)),
    (
        "skills",
        re.compile(
            r"^(?:technical\s+)?skills$|^core\s+skills$|^key\s+skills$"
            r"|^technologies$|^technology\s+stack$|^tech\s+stack$|^tools(?:\s+&\s+technologies)?$",
            re.IGNORECASE,
        ),
    ),
    (
        "experience",
        re.compile(
            r"^(?:work\s+)?experience$|^professional\s+experience$|^work\s+experience$"
            r"|^employment\s+history$|^work\s+history$|^career\s+history$",
            re.IGNORECASE,
        ),
    ),
    (
        "projects",
        re.compile(
            r"^projects$|^personal\s+projects$|^project\s+experience$|^selected\s+projects$"
            r"|^academic\s+projects$|^key\s+projects$",
            re.IGNORECASE,
        ),
    ),
    (
        "certifications",
        re.compile(
            r"^awards\s*(?:&|and)\s*certifications?$|^certifications?(?:\s+&\s+licenses?)?$"
            r"|^licenses?(?:\s+&\s+certifications?)?$|^awards$",
            re.IGNORECASE,
        ),
    ),
    (
        "education",
        re.compile(
            r"^education$|^academic\s+background$|^academic\s+credentials$|^qualifications$",
            re.IGNORECASE,
        ),
    ),
]

SECTION_KEYS = [key for key, _ in SECTION_HEADER_PATTERNS]

ROLE_TITLE_PATTERN = re.compile(
    r"\b(?:"
    r"developer|engineer|intern|analyst|designer|architect|manager|consultant|"
    r"lead|specialist|programmer|administrator|coordinator|associate|director|"
    r"frontend|backend|full[\s-]?stack|software|web|mobile|devops|sre|qa|tester"
    r")\b",
    re.IGNORECASE,
)

COMPANY_SUFFIX_PATTERN = re.compile(
    r"\b(?:inc\.?|llc\.?|ltd\.?|corp\.?|corporation|company|co\.|group|studio|agency|labs)\b",
    re.IGNORECASE,
)

DEGREE_START_PATTERN = re.compile(
    r"^(?:"
    r"B\.?\s*Tech(?:nology)?(?:\s*[–\-]\s*.+)?|"
    r"B\.?\s*E\.?(?:\s*[–\-]\s*.+)?|"
    r"B\.?\s*Sc\.?|"
    r"Bachelor(?:'s)?(?:\s+of\s+Science)?(?:\s+in\s+.+)?|"
    r"B\.?\s*S\.?(?:\s+in\s+.+)?|"
    r"M\.?\s*Tech(?:nology)?|"
    r"M\.?\s*Sc\.?|"
    r"Master(?:'s)?|"
    r"MBA|"
    r"Ph\.?\s*D\.?|"
    r"Intermediate(?:\s*[–\-]\s*.+)?|"
    r"Diploma|"
    r"Associate|"
    r"High\s+School"
    r")",
    re.IGNORECASE,
)

YEAR_PATTERN = re.compile(r"^\d{4}$")
YEAR_INLINE_PATTERN = re.compile(r"\b(19|20)\d{2}\b")
CGPA_PATTERN = re.compile(
    r"(?:CGPA|GPA|Grade|Percentage)\s*[:\-]?\s*([\d.]+)\s*(?:%|/\s*10)?",
    re.IGNORECASE,
)
DATE_LINE_PATTERN = re.compile(
    r"^(?:"
    r"(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}\s*"
    r"[-–—to]+\s*(?:Present|Current|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\.?\s+)?\d{4}"
    r"|\d{4}\s*[-–—]\s*(?:\d{4}|Present|Current)"
    r")$",
    re.IGNORECASE,
)
BULLET_PATTERN = re.compile(r"^[\s•\-\*\u2022\u25cf\u25cb\u25aa]\s*")
URL_PATTERN = re.compile(r"^https?://", re.IGNORECASE)
GITHUB_PATTERN = re.compile(r"^https?://(?:www\.)?github\.com/", re.IGNORECASE)

SKILL_LINE_LABELS_SKIP = frozenset(
    {"soft skills", "soft skill", "soft-skills", "interests", "hobbies"}
)

TOKEN_ALIASES: Dict[str, str] = {
    "react.js": "React",
    "reactjs": "React",
    "node.js": "Node.js",
    "nodejs": "Node.js",
    "vue.js": "Vue",
    "vuejs": "Vue",
    "next.js": "Next.js",
    "nextjs": "Next.js",
    "angular.js": "Angular",
    "angularjs": "Angular",
    "express.js": "Express",
    "expressjs": "Express",
    "css3": "CSS",
    "html5": "HTML",
    "gpt 4": "GPT-4",
    "gpt4": "GPT-4",
    "generative ai": "Generative AI",
    "prompt engineering": "Prompt Engineering",
    "langchain": "LangChain",
    "opencv": "OpenCV",
    "mongodb": "MongoDB",
    "postgresql": "PostgreSQL",
    "tailwind css": "Tailwind CSS",
    "tailwindcss": "Tailwind CSS",
    "api integration": "API Integration",
    "rest api": "REST",
    "rest apis": "REST",
    "restful api": "REST",
    "restful apis": "REST",
    "ci cd": "CI/CD",
    "cicd": "CI/CD",
    "operating systems": "Operating Systems",
    "data structures": "Data Structures",
    "oop": "OOP",
    "dbms": "DBMS",
    "amazon web services": "AWS",
    "js": "JavaScript",
    "ts": "TypeScript",
}


@dataclass
class ParserConfidence:
    skills_confidence: float = 0.0
    projects_confidence: float = 0.0
    experience_confidence: float = 0.0
    education_confidence: float = 0.0
    certifications_confidence: float = 0.0

    @property
    def overall(self) -> float:
        weights = [0.3, 0.2, 0.25, 0.15, 0.1]
        values = [
            self.skills_confidence,
            self.projects_confidence,
            self.experience_confidence,
            self.education_confidence,
            self.certifications_confidence,
        ]
        return round(sum(w * v for w, v in zip(weights, values)), 3)


@dataclass
class ParserDiagnostics:
    raw_text_length: int = 0
    detected_sections: List[str] = field(default_factory=list)
    extraction_counts: Dict[str, int] = field(default_factory=dict)
    parser_confidence: float = 0.0
    confidence_breakdown: Dict[str, float] = field(default_factory=dict)


@dataclass
class ParsedEducation:
    college: Optional[str] = None
    degree: Optional[str] = None
    graduation_year: Optional[str] = None
    cgpa: Optional[str] = None


@dataclass
class ParsedProject:
    project_name: str = ""
    description: Optional[str] = None
    technologies: Optional[str] = None


@dataclass
class ParsedExperience:
    company: Optional[str] = None
    role: Optional[str] = None
    duration: Optional[str] = None
    description: Optional[str] = None


@dataclass
class ParsedCertification:
    certification_name: str = ""


@dataclass
class ParsedResume:
    raw_text: str = ""
    skills: List[str] = field(default_factory=list)
    education: List[ParsedEducation] = field(default_factory=list)
    projects: List[ParsedProject] = field(default_factory=list)
    experience: List[ParsedExperience] = field(default_factory=list)
    certifications: List[ParsedCertification] = field(default_factory=list)
    confidence: ParserConfidence = field(default_factory=ParserConfidence)
    sections_found: Dict[str, bool] = field(default_factory=dict)
    diagnostics: ParserDiagnostics = field(default_factory=ParserDiagnostics)


def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    text = _extract_with_pymupdf(pdf_bytes)
    if len(text.strip()) < 80:
        fallback = _extract_with_pdfplumber(pdf_bytes)
        if len(fallback.strip()) > len(text.strip()):
            text = fallback
    return _normalize_text(text)


def _extract_with_pymupdf(pdf_bytes: bytes) -> str:
    try:
        import fitz  # PyMuPDF
    except ImportError as exc:
        raise RuntimeError("PyMuPDF is not installed") from exc

    parts: List[str] = []
    with fitz.open(stream=pdf_bytes, filetype="pdf") as doc:
        for page in doc:
            parts.append(page.get_text("text"))
    return "\n".join(parts)


def _extract_with_pdfplumber(pdf_bytes: bytes) -> str:
    try:
        import pdfplumber
        from io import BytesIO
    except ImportError as exc:
        raise RuntimeError("pdfplumber is not installed") from exc

    parts: List[str] = []
    with pdfplumber.open(BytesIO(pdf_bytes)) as pdf:
        for page in pdf.pages:
            parts.append(page.extract_text() or "")
    return "\n".join(parts)


def _normalize_text(text: str) -> str:
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    text = text.replace("\u2013", "-").replace("\u2014", "-").replace("–", "-").replace("—", "-")
    text = re.sub(r"\n{3,}", "\n\n", text)
    text = re.sub(r"[ \t]+", " ", text)
    return text.strip()


def _normalize_dashes(line: str) -> str:
    return line.replace("\u2013", "-").replace("\u2014", "-").replace("–", "-").replace("—", "-")


def _normalize_header_line(line: str) -> str:
    clean = re.sub(r"[^a-zA-Z0-9\s&]", " ", line).strip()
    return re.sub(r"\s+", " ", clean)


def _match_section_header(line: str) -> Optional[str]:
    stripped = line.strip().rstrip(":").strip()
    if not stripped or len(stripped) > 90:
        return None
    normalized = _normalize_header_line(stripped)
    if not normalized:
        return None
    for key, pattern in SECTION_HEADER_PATTERNS:
        if pattern.match(normalized):
            return key
    return None


def split_sections(text: str) -> Dict[str, str]:
    """Split resume into sections; content never bleeds across recognized headers."""
    lines = text.split("\n")
    sections: Dict[str, str] = {}
    current: Optional[str] = None
    buffer: List[str] = []

    def flush() -> None:
        nonlocal buffer
        if current and buffer:
            existing = sections.get(current, "")
            chunk = "\n".join(buffer).strip()
            sections[current] = f"{existing}\n{chunk}".strip() if existing else chunk
        buffer = []

    for line in lines:
        header = _match_section_header(line)
        if header:
            flush()
            current = header
            continue
        if current:
            buffer.append(line)
    flush()

    if not sections:
        sections = _fallback_split_sections(text)
    return sections


def _fallback_split_sections(text: str) -> Dict[str, str]:
    """Second pass: locate section headers anywhere in the document (PDF layout quirks)."""
    sections: Dict[str, str] = {}
    lines = text.split("\n")
    indices: List[Tuple[int, str]] = []
    for idx, line in enumerate(lines):
        header = _match_section_header(line)
        if header:
            indices.append((idx, header))

    if not indices:
        return sections

    for i, (start_idx, key) in enumerate(indices):
        end_idx = indices[i + 1][0] if i + 1 < len(indices) else len(lines)
        body = "\n".join(lines[start_idx + 1 : end_idx]).strip()
        if body:
            existing = sections.get(key, "")
            sections[key] = f"{existing}\n{body}".strip() if existing else body
    return sections


def _is_bullet(line: str) -> bool:
    return bool(BULLET_PATTERN.match(line))


def _strip_bullet(line: str) -> str:
    return BULLET_PATTERN.sub("", line).strip()


def _is_url(line: str) -> bool:
    return bool(URL_PATTERN.match(line.strip()))


def _is_date_line(line: str) -> bool:
    return _date_in_line(line) and len(line.strip()) < 80


def _date_in_line(line: str) -> bool:
    normalized = _normalize_dashes(line.strip())
    if DATE_LINE_PATTERN.match(normalized):
        return True
    return bool(
        re.search(
            r"(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}\s*"
            r"[-–—to]+\s*(?:Present|Current|\d{4})",
            normalized,
            re.IGNORECASE,
        )
        or re.search(r"\b(19|20)\d{2}\s*[-–—]\s*(?:\d{4}|Present|Current)\b", normalized, re.IGNORECASE)
    )


def _skill_pattern(skill: str) -> re.Pattern[str]:
    escaped = re.escape(skill)
    if skill == "C++":
        return re.compile(r"(?<![A-Za-z0-9])C\+\+(?![A-Za-z0-9])")
    if skill == "C#":
        return re.compile(r"(?<![A-Za-z0-9])C#(?![A-Za-z0-9])")
    if skill == "R":
        return re.compile(r"(?<![A-Za-z])R(?![A-Za-z0-9+])")
    if skill == "Go":
        return re.compile(r"(?<![A-Za-z0-9])Go(?![A-Za-z0-9])")
    return re.compile(rf"(?<![A-Za-z0-9]){escaped}(?![A-Za-z0-9])", re.IGNORECASE)


def _canonicalize_token(token: str) -> Optional[str]:
    token = token.strip()
    if not token or len(token) < 2:
        return None
    lower = token.lower()
    if lower in SKILL_LINE_LABELS_SKIP:
        return None
    if lower in TOKEN_ALIASES:
        return TOKEN_ALIASES[lower]
    for skill in SKILLS_SORTED:
        if skill.lower() == lower:
            return skill
    for skill in SKILLS_SORTED:
        if skill.lower() == lower.replace(".js", "").replace(".jsx", ""):
            return skill
    return None


def _tokenize_skill_line(line: str) -> List[str]:
    """Split a line into skill tokens (commas, pipes, bullets, semicolons, middots)."""
    cleaned = _strip_bullet(line.strip())
    if not cleaned:
        return []
    if cleaned.lower() in SKILL_LINE_LABELS_SKIP:
        return []
    if ":" in cleaned:
        label, rest = cleaned.split(":", 1)
        if label.strip().lower() in SKILL_LINE_LABELS_SKIP:
            return []
        cleaned = rest
    return [t.strip() for t in re.split(r"[,|;•·/]|\s+and\s+", cleaned) if t.strip()]


def extract_skills_from_text(text: str) -> List[str]:
    """Extract skills from any text block using dictionary + token parsing."""
    if not text.strip():
        return []

    found: Dict[str, str] = {}

    for line in text.split("\n"):
        for token in _tokenize_skill_line(line):
            canonical = _canonicalize_token(token)
            if canonical:
                found[canonical.lower()] = canonical

    for skill in SKILLS_SORTED:
        if _skill_pattern(skill).search(text):
            found[skill.lower()] = skill

    return _dedupe_skills(sorted(found.values(), key=str.lower))


def extract_skills(skills_section: str) -> List[str]:
    """Extract skills from the dedicated skills section."""
    return extract_skills_from_text(skills_section)


def merge_skill_lists(*lists: List[str]) -> List[str]:
    merged: Dict[str, str] = {}
    for skills in lists:
        for skill in skills:
            merged[skill.lower()] = skill
    return _dedupe_skills(sorted(merged.values(), key=str.lower))


def _dedupe_skills(skills: List[str]) -> List[str]:
    """Collapse React vs React.js, CSS vs CSS3, etc."""
    best: Dict[str, str] = {}
    for skill in skills:
        key = re.sub(r"\.(js|jsx|ts|tsx)$", "", skill.lower())
        key = key.replace("css3", "css").replace("html5", "html")
        existing = best.get(key)
        if not existing or len(skill) > len(existing):
            best[key] = skill
    return sorted(best.values(), key=str.lower)


def extract_education(education_section: str) -> List[ParsedEducation]:
    """Extract education entries only from the Education section."""
    if not education_section.strip():
        return []

    entries: List[ParsedEducation] = []
    lines = [ln.strip() for ln in education_section.split("\n") if ln.strip()]
    if not lines:
        return entries

    # Group lines into blocks starting at degree headers
    blocks: List[List[str]] = []
    current_block: List[str] = []

    for line in lines:
        if DEGREE_START_PATTERN.match(line) and current_block:
            blocks.append(current_block)
            current_block = [line]
        else:
            if DEGREE_START_PATTERN.match(line) and not current_block:
                current_block = [line]
            elif current_block:
                current_block.append(line)
            elif DEGREE_START_PATTERN.match(line):
                current_block = [line]

    if current_block:
        blocks.append(current_block)

    if not blocks:
        blocks = [lines]

    for block in blocks:
        edu = _parse_education_block(block)
        if edu and (edu.degree or edu.college):
            entries.append(edu)

    return entries


def _parse_education_block(lines: List[str]) -> ParsedEducation:
    edu = ParsedEducation()
    edu.degree = lines[0][:255]

    for line in lines[1:]:
        if DATE_LINE_PATTERN.match(line) or re.search(
            r"\d{4}\s*[–—-]\s*(?:\d{4}|Present|Current)", line, re.IGNORECASE
        ):
            years = YEAR_INLINE_PATTERN.findall(line)
            if years:
                edu.graduation_year = years[-1] if len(years) == 1 else f"{years[0]}-{years[1]}"
            else:
                edu.graduation_year = line[:32]
        elif CGPA_PATTERN.search(line):
            match = CGPA_PATTERN.search(line)
            if match and match.group(1):
                edu.cgpa = match.group(1)
        elif not edu.college and not _is_bullet(line) and not _is_url(line):
            if len(line) > 3 and not DEGREE_START_PATTERN.match(line):
                edu.college = line[:255]

    return edu


def extract_projects(projects_section: str) -> List[ParsedProject]:
    """
    Parse projects only inside Projects section.
    Pattern: title line(s) → year → github URL → bullet points.
    """
    if not projects_section.strip():
        return []

    lines = [ln.rstrip() for ln in projects_section.split("\n")]
    projects: List[ParsedProject] = []
    title_parts: List[str] = []
    bullets: List[str] = []
    github: Optional[str] = None
    year: Optional[str] = None

    def flush() -> None:
        nonlocal title_parts, bullets, github, year
        name = " ".join(title_parts).strip()
        if not name and not github:
            title_parts = []
            bullets = []
            github = None
            year = None
            return
        desc = " ".join(bullets).strip() if bullets else None
        if year and desc:
            desc = f"({year}) {desc}"
        elif year:
            desc = f"Year: {year}"
        techs = extract_skills_from_text(" ".join(bullets)) if bullets else []
        projects.append(
            ParsedProject(
                project_name=(name or "Project")[:255],
                description=desc[:2000] if desc else None,
                technologies=", ".join(techs[:15]) if techs else None,
            )
        )
        title_parts = []
        bullets = []
        github = None
        year = None

    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue
        if _is_bullet(stripped):
            bullets.append(_strip_bullet(stripped))
            continue
        if GITHUB_PATTERN.match(stripped):
            github = stripped
            continue
        if YEAR_PATTERN.match(stripped):
            year = stripped
            continue
        if _is_url(stripped):
            continue
        # New title line — flush only if previous project has started (year/github/bullets)
        if year or github or bullets:
            flush()
        title_parts.append(stripped)

    flush()
    return projects


def _split_header_company_role(header_lines: List[str]) -> Tuple[Optional[str], Optional[str]]:
    """Infer company and role from 1–3 header lines."""
    if not header_lines:
        return None, None

    combined = " ".join(header_lines)
    for sep in (" | ", " – ", " - ", " @ ", " at "):
        if sep.strip() in combined.lower() or sep in combined:
            parts = re.split(re.escape(sep.strip()) if sep.strip() != "at" else r"\s+at\s+", combined, maxsplit=1, flags=re.I)
            if len(parts) == 2:
                left, right = parts[0].strip(), parts[1].strip()
                if ROLE_TITLE_PATTERN.search(left) and not ROLE_TITLE_PATTERN.search(right):
                    return right[:255], left[:255]
                if ROLE_TITLE_PATTERN.search(right):
                    return left[:255], right[:255]
                return left[:255], right[:255]

    if len(header_lines) == 1:
        line = header_lines[0]
        if ROLE_TITLE_PATTERN.search(line):
            return None, line[:255]
        if COMPANY_SUFFIX_PATTERN.search(line):
            return line[:255], None
        return None, line[:255]

    first, second = header_lines[0], header_lines[1]
    if ROLE_TITLE_PATTERN.search(first):
        return second[:255], first[:255]
    if ROLE_TITLE_PATTERN.search(second):
        return first[:255], second[:255]
    return first[:255], second[:255]


def _parse_experience_block(block: List[str]) -> Optional[ParsedExperience]:
    if not block:
        return None

    duration: Optional[str] = None
    header_lines: List[str] = []
    bullets: List[str] = []

    for line in block:
        if _is_bullet(line):
            bullets.append(_strip_bullet(line))
        elif _is_url(line):
            continue
        elif _is_date_line(line) or (_date_in_line(line) and len(line) < 120):
            if not duration:
                duration = line[:120]
            elif not header_lines:
                header_lines.append(line)
        else:
            header_lines.append(line)

    company, role = _split_header_company_role(header_lines)
    description = "\n".join(bullets) if bullets else None

    if not (role or company or duration or description):
        return None

    return ParsedExperience(
        company=company,
        role=role,
        duration=duration,
        description=description[:3000] if description else None,
    )


def _split_experience_into_blocks(lines: List[str]) -> List[List[str]]:
    """Split experience section into job blocks."""
    blocks: List[List[str]] = []
    current: List[str] = []
    seen_bullets = False

    def flush() -> None:
        nonlocal current, seen_bullets
        if current:
            blocks.append(current)
        current = []
        seen_bullets = False

    i = 0
    while i < len(lines):
        line = lines[i]
        if _is_bullet(line):
            current.append(line)
            seen_bullets = True
            i += 1
            continue

        if _is_url(line):
            i += 1
            continue

        if _is_job_start(lines, i):
            if current:
                flush()
            current.append(line)
            i += 1
            continue

        if seen_bullets and not _is_date_line(line) and len(line) < 100 and ROLE_TITLE_PATTERN.search(line):
            flush()
            current.append(line)
            i += 1
            continue

        current.append(line)
        i += 1

    flush()
    return blocks


def extract_experience(experience_section: str) -> List[ParsedExperience]:
    """
    Parse experience section into jobs with role, company, dates, and bullets.
    Supports WORK EXPERIENCE / PROFESSIONAL EXPERIENCE style layouts.
    """
    if not experience_section.strip():
        return []

    lines = [ln.strip() for ln in experience_section.split("\n") if ln.strip()]
    if not lines:
        return []

    jobs: List[ParsedExperience] = []
    for block in _split_experience_into_blocks(lines):
        job = _parse_experience_block(block)
        if job:
            jobs.append(job)

    if not jobs:
        jobs = _extract_experience_sequential(lines)

    return jobs


def _extract_experience_sequential(lines: List[str]) -> List[ParsedExperience]:
    """Fallback: original sequential scan for edge layouts."""
    jobs: List[ParsedExperience] = []
    i = 0
    while i < len(lines):
        line = lines[i]
        if _is_bullet(line) or _is_url(line):
            i += 1
            continue
        if _is_date_line(line) and (not jobs or jobs[-1].duration):
            i += 1
            continue

        header = [_strip_bullet(line)]
        i += 1
        while i < len(lines) and not _is_bullet(lines[i]) and not _is_job_start(lines, i):
            if _is_date_line(lines[i]):
                break
            if not _is_url(lines[i]):
                header.append(lines[i])
            i += 1

        duration: Optional[str] = None
        if i < len(lines) and (_is_date_line(lines[i]) or _date_in_line(lines[i])):
            duration = lines[i][:120]
            i += 1

        bullets: List[str] = []
        while i < len(lines) and _is_bullet(lines[i]):
            bullets.append(_strip_bullet(lines[i]))
            i += 1

        company, role = _split_header_company_role(header)
        description = "\n".join(bullets) if bullets else None
        if role or company or duration or description:
            jobs.append(
                ParsedExperience(
                    company=company,
                    role=role,
                    duration=duration,
                    description=description[:3000] if description else None,
                )
            )
    return jobs


def _is_job_start(lines: List[str], index: int) -> bool:
    """Detect start of a new job block."""
    if index >= len(lines):
        return False
    line = lines[index]
    if _is_bullet(line) or _is_url(line):
        return False

    if _date_in_line(line) and ROLE_TITLE_PATTERN.search(line):
        return True

    if _is_date_line(line):
        return index == 0 or _is_bullet(lines[index - 1])

    if index + 1 < len(lines) and _is_date_line(lines[index + 1]):
        return True

    if index + 2 < len(lines) and _is_date_line(lines[index + 2]) and ROLE_TITLE_PATTERN.search(line):
        return True

    if index > 0 and _is_bullet(lines[index - 1]) and ROLE_TITLE_PATTERN.search(line) and len(line) < 90:
        return True

    return False


def extract_certifications(certifications_section: str) -> List[ParsedCertification]:
    """Parse Awards & Certifications section only."""
    if not certifications_section.strip():
        return []

    certs: List[ParsedCertification] = []
    for line in certifications_section.split("\n"):
        stripped = _strip_bullet(line.strip())
        if not stripped or len(stripped) < 4:
            continue
        if _is_url(stripped):
            continue
        if _match_section_header(stripped):
            continue
        certs.append(ParsedCertification(certification_name=stripped[:255]))

    seen: set[str] = set()
    unique: List[ParsedCertification] = []
    for cert in certs:
        key = cert.certification_name.lower()
        if key not in seen:
            seen.add(key)
            unique.append(cert)
    return unique


def _compute_confidence(
    section_found: bool,
    count: int,
    min_expected: int,
    exact_expected: Optional[int] = None,
) -> float:
    if not section_found:
        return 0.2
    if exact_expected is not None and count == exact_expected:
        return 1.0
    if count >= min_expected:
        return min(1.0, 0.75 + 0.25 * min(count / max(min_expected, 1), 2.0))
    if count == 0:
        return 0.35
    return max(0.3, 0.5 * (count / max(min_expected, 1)))


def _build_diagnostics(
    raw_text: str,
    sections_found: Dict[str, bool],
    skills: List[str],
    projects: List[ParsedProject],
    experience: List[ParsedExperience],
    education: List[ParsedEducation],
    certifications: List[ParsedCertification],
    confidence: ParserConfidence,
) -> ParserDiagnostics:
    detected = [key for key in SECTION_KEYS if sections_found.get(key)]
    counts = {
        "skills": len(skills),
        "projects": len(projects),
        "experience": len(experience),
        "education": len(education),
        "certifications": len(certifications),
    }
    return ParserDiagnostics(
        raw_text_length=len(raw_text),
        detected_sections=detected,
        extraction_counts=counts,
        parser_confidence=confidence.overall,
        confidence_breakdown={
            "skills": confidence.skills_confidence,
            "projects": confidence.projects_confidence,
            "experience": confidence.experience_confidence,
            "education": confidence.education_confidence,
            "certifications": confidence.certifications_confidence,
        },
    )


def parse_resume_text(raw_text: str) -> ParsedResume:
    """Parse normalized resume text (used by PDF pipeline and tests)."""
    if not raw_text.strip():
        raise ValueError("Resume text is empty")

    sections = split_sections(raw_text)
    sections_found = {key: bool(sections.get(key)) for key in SECTION_KEYS}

    skills_section = sections.get("skills", "")
    experience_section = sections.get("experience", "")
    projects_section = sections.get("projects", "")

    skills_from_section = extract_skills(skills_section)
    skills_from_experience = extract_skills_from_text(experience_section)
    skills_from_projects = extract_skills_from_text(projects_section)
    skills = merge_skill_lists(skills_from_section, skills_from_experience, skills_from_projects)

    education = extract_education(sections.get("education", ""))
    projects = extract_projects(projects_section)
    experience = extract_experience(experience_section)
    certifications = extract_certifications(sections.get("certifications", ""))

    confidence = ParserConfidence(
        skills_confidence=_compute_confidence(
            sections_found.get("skills", False) or bool(skills_from_experience),
            len(skills),
            8,
        ),
        projects_confidence=_compute_confidence(
            sections_found.get("projects", False), len(projects), 2
        ),
        experience_confidence=_compute_confidence(
            sections_found.get("experience", False), len(experience), 1
        ),
        education_confidence=_compute_confidence(
            sections_found.get("education", False), len(education), 1
        ),
        certifications_confidence=_compute_confidence(
            sections_found.get("certifications", False), len(certifications), 2
        ),
    )

    diagnostics = _build_diagnostics(
        raw_text,
        sections_found,
        skills,
        projects,
        experience,
        education,
        certifications,
        confidence,
    )

    logger.info("[Parser] Raw text length: %d", diagnostics.raw_text_length)
    logger.info("[Parser] Sections detected: %s", ", ".join(diagnostics.detected_sections) or "(none)")
    logger.info("[Parser] Extraction counts: %s", diagnostics.extraction_counts)
    logger.info("[Parser] Skills detected: %d", len(skills))
    logger.info("[Parser] Projects detected: %d", len(projects))
    logger.info("[Parser] Experience detected: %d", len(experience))
    logger.info("[Parser] Education detected: %d", len(education))
    logger.info("[Parser] Certifications detected: %d", len(certifications))
    logger.info("[Parser] Parser confidence: %.2f", diagnostics.parser_confidence)
    logger.info(
        "[Parser] Confidence breakdown — skills: %.2f, projects: %.2f, experience: %.2f, "
        "education: %.2f, certifications: %.2f",
        confidence.skills_confidence,
        confidence.projects_confidence,
        confidence.experience_confidence,
        confidence.education_confidence,
        confidence.certifications_confidence,
    )

    return ParsedResume(
        raw_text=raw_text,
        skills=skills,
        education=education,
        projects=projects,
        experience=experience,
        certifications=certifications,
        confidence=confidence,
        sections_found=sections_found,
        diagnostics=diagnostics,
    )


def parse_resume(pdf_bytes: bytes) -> ParsedResume:
    raw_text = extract_text_from_pdf(pdf_bytes)
    if not raw_text.strip():
        raise ValueError("No text could be extracted from the PDF")
    return parse_resume_text(raw_text)
