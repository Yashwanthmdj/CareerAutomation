from __future__ import annotations

import logging
import re
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple

from .resume_skills_library import SKILLS_LIBRARY

logger = logging.getLogger(__name__)

# Match longest skill names first (e.g. "Machine Learning" before "Learning")
SKILLS_SORTED: List[str] = sorted(SKILLS_LIBRARY, key=len, reverse=True)

# Canonical section headers (strict line match after normalization)
SECTION_HEADER_PATTERNS: List[Tuple[str, re.Pattern[str]]] = [
    ("summary", re.compile(r"^summary$", re.IGNORECASE)),
    ("skills", re.compile(r"^technical\s+skills$", re.IGNORECASE)),
    ("experience", re.compile(r"^experience$", re.IGNORECASE)),
    ("projects", re.compile(r"^projects$", re.IGNORECASE)),
    (
        "certifications",
        re.compile(r"^awards\s*(?:&|and)\s*certifications?$", re.IGNORECASE),
    ),
    ("education", re.compile(r"^education$", re.IGNORECASE)),
]

DEGREE_START_PATTERN = re.compile(
    r"^(?:"
    r"B\.?\s*Tech(?:nology)?(?:\s*[–\-]\s*.+)?|"
    r"B\.?\s*E\.?(?:\s*[–\-]\s*.+)?|"
    r"B\.?\s*Sc\.?|"
    r"Bachelor(?:'s)?|"
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
    "next.js": "Next.js",
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
    "api integration": "API Integration",
    "operating systems": "Operating Systems",
    "data structures": "Data Structures",
    "oop": "OOP",
    "dbms": "DBMS",
}


@dataclass
class ParserConfidence:
    skills_confidence: float = 0.0
    projects_confidence: float = 0.0
    experience_confidence: float = 0.0
    education_confidence: float = 0.0
    certifications_confidence: float = 0.0


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
    stripped = line.strip()
    if not stripped or len(stripped) > 80:
        return None
    normalized = _normalize_header_line(stripped)
    if not normalized:
        return None
    for key, pattern in SECTION_HEADER_PATTERNS:
        if pattern.match(normalized):
            return key
    return None


def split_sections(text: str) -> Dict[str, str]:
    """Split resume into strict sections; content never bleeds across headers."""
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
    return sections


def _is_bullet(line: str) -> bool:
    return bool(BULLET_PATTERN.match(line))


def _strip_bullet(line: str) -> str:
    return BULLET_PATTERN.sub("", line).strip()


def _is_url(line: str) -> bool:
    return bool(URL_PATTERN.match(line.strip()))


def _is_date_line(line: str) -> bool:
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


def extract_skills(skills_section: str) -> List[str]:
    """Extract skills only from the Technical Skills section."""
    if not skills_section.strip():
        return []

    found: Dict[str, str] = {}

    for line in skills_section.split("\n"):
        line = line.strip()
        if not line or ":" not in line:
            continue
        label, rest = line.split(":", 1)
        if label.strip().lower() in SKILL_LINE_LABELS_SKIP:
            continue
        for token in re.split(r"[,|/•]", rest):
            canonical = _canonicalize_token(token)
            if canonical:
                found[canonical.lower()] = canonical

    for skill in SKILLS_SORTED:
        if _skill_pattern(skill).search(skills_section):
            found[skill.lower()] = skill

    return _dedupe_skills(sorted(found.values(), key=str.lower))


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
        techs = extract_skills(" ".join(bullets)) if bullets else []
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


def extract_experience(experience_section: str) -> List[ParsedExperience]:
    """
    Parse experience only inside Experience section.
    One job = role header + optional date line + bullet descriptions.
    """
    if not experience_section.strip():
        return []

    lines = [ln.strip() for ln in experience_section.split("\n") if ln.strip()]
    if not lines:
        return []

    jobs: List[ParsedExperience] = []
    i = 0
    while i < len(lines):
        line = lines[i]
        if _is_bullet(line) or _is_url(line):
            i += 1
            continue

        if _is_date_line(line):
            i += 1
            continue

        # Role / company header
        role = _strip_bullet(line)
        i += 1
        duration: Optional[str] = None
        if i < len(lines) and _is_date_line(lines[i]):
            duration = lines[i]
            i += 1

        bullets: List[str] = []
        while i < len(lines):
            if _is_bullet(lines[i]):
                bullets.append(_strip_bullet(lines[i]))
                i += 1
            elif _is_job_start(lines, i):
                break
            else:
                break

        description = "\n".join(bullets) if bullets else None
        if role or duration or description:
            jobs.append(
                ParsedExperience(
                    role=role[:255] if role else None,
                    duration=duration[:120] if duration else None,
                    description=description[:3000] if description else None,
                    company=None,
                )
            )

    return jobs


def _is_job_start(lines: List[str], index: int) -> bool:
    """Detect start of a new job (header line followed by a date line)."""
    if index >= len(lines):
        return False
    line = lines[index]
    if _is_bullet(line) or _is_url(line) or _is_date_line(line):
        return False
    if index + 1 < len(lines) and _is_date_line(lines[index + 1]):
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


def parse_resume(pdf_bytes: bytes) -> ParsedResume:
    raw_text = extract_text_from_pdf(pdf_bytes)
    if not raw_text.strip():
        raise ValueError("No text could be extracted from the PDF")

    sections = split_sections(raw_text)
    sections_found = {key: bool(sections.get(key)) for key, _ in SECTION_HEADER_PATTERNS}

    skills = extract_skills(sections.get("skills", ""))
    education = extract_education(sections.get("education", ""))
    projects = extract_projects(sections.get("projects", ""))
    experience = extract_experience(sections.get("experience", ""))
    certifications = extract_certifications(sections.get("certifications", ""))

    confidence = ParserConfidence(
        skills_confidence=_compute_confidence(sections_found.get("skills", False), len(skills), 20),
        projects_confidence=_compute_confidence(
            sections_found.get("projects", False), len(projects), 3, exact_expected=3
        ),
        experience_confidence=_compute_confidence(
            sections_found.get("experience", False), len(experience), 1, exact_expected=1
        ),
        education_confidence=_compute_confidence(
            sections_found.get("education", False), len(education), 2, exact_expected=2
        ),
        certifications_confidence=_compute_confidence(
            sections_found.get("certifications", False), len(certifications), 5
        ),
    )

    logger.info("[Parser] Skills detected: %d", len(skills))
    logger.info("[Parser] Projects detected: %d", len(projects))
    logger.info("[Parser] Experience detected: %d", len(experience))
    logger.info("[Parser] Education detected: %d", len(education))
    logger.info("[Parser] Certifications detected: %d", len(certifications))
    logger.info(
        "[Parser] Confidence — skills: %.2f, projects: %.2f, experience: %.2f, "
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
    )
