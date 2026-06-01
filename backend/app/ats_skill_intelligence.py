"""
Rule-based skill normalization, aliases, and matching for ATS (Phase 3.3.1).
No AI / embeddings — exact, alias, and normalized key matching only.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Set, Tuple

# Canonical display name → list of normalized alias keys (lowercase, no punctuation)
SKILL_EQUIVALENCE_GROUPS: List[Tuple[str, List[str]]] = [
    ("JavaScript", ["javascript", "js", "ecmascript", "java script"]),
    ("TypeScript", ["typescript", "ts"]),
    ("React", ["react", "reactjs", "react.js", "react js"]),
    ("Next.js", ["next.js", "nextjs", "next js"]),
    ("Vue", ["vue", "vuejs", "vue.js"]),
    ("Angular", ["angular", "angularjs", "angular.js"]),
    ("Node.js", ["node.js", "nodejs", "node js", "node"]),
    ("Express", ["express", "expressjs", "express.js"]),
    ("HTML", ["html", "html5"]),
    ("CSS", ["css", "css3"]),
    ("Tailwind CSS", ["tailwind css", "tailwind", "tailwindcss"]),
    ("Bootstrap", ["bootstrap"]),
    ("PostgreSQL", ["postgresql", "postgres", "psql"]),
    ("MySQL", ["mysql"]),
    ("MongoDB", ["mongodb", "mongo"]),
    ("AWS", ["aws", "amazon web services"]),
    ("Docker", ["docker"]),
    ("Kubernetes", ["kubernetes", "k8s"]),
    ("Git", ["git", "github", "gitlab"]),
    ("CI/CD", ["ci/cd", "cicd", "ci cd", "continuous integration"]),
    ("REST", ["rest", "rest api", "rest apis", "restful api", "restful apis"]),
    ("Machine Learning", ["machine learning", "ml"]),
    ("Deep Learning", ["deep learning", "dl"]),
    ("Artificial Intelligence", ["artificial intelligence", "ai"]),
    ("LLMs", ["llms", "llm", "large language models"]),
    (
        "GPT-4",
        [
            "gpt-4",
            "gpt4",
            "gpt 4",
            "gpt",
            "openai gpt-4",
            "openai gpt 4",
            "openai gpt4",
            "open ai gpt 4",
        ],
    ),
    ("LangChain", ["langchain", "lang chain"]),
    ("Python", ["python", "py"]),
    ("FastAPI", ["fastapi", "fast api"]),
    ("Django", ["django"]),
    ("Claude", ["claude", "anthropic claude"]),
    ("Gemini", ["gemini", "google gemini"]),
    ("XGBoost", ["xgboost", "xgb"]),
    ("TensorFlow", ["tensorflow", "tensor flow"]),
    ("PyTorch", ["pytorch", "py torch"]),
    ("SQL", ["sql", "structured query language"]),
    ("Prompt Engineering", ["prompt engineering", "prompting"]),
    ("Generative AI", ["generative ai", "genai", "gen ai"]),
    ("OpenCV", ["opencv", "open cv"]),
    ("Pandas", ["pandas"]),
    ("NumPy", ["numpy", "num py"]),
    ("Scikit-learn", ["scikit-learn", "scikit learn", "sklearn"]),
    ("Agile", ["agile"]),
    ("Scrum", ["scrum"]),
    ("Linux", ["linux"]),
    ("Terraform", ["terraform"]),
    ("Redis", ["redis"]),
    ("GraphQL", ["graphql", "graph ql"]),
    ("Jest", ["jest"]),
    ("Webpack", ["webpack"]),
    ("Sass", ["sass", "scss"]),
    ("Material UI", ["material ui", "mui", "material-ui"]),
    ("Responsive Design", ["responsive design", "responsive web design", "mobile first"]),
    ("Web Performance", ["web performance", "performance optimization", "core web vitals"]),
]

# Role-specific ATS target libraries (compare resume ONLY against this set)
ROLE_TARGET_LIBRARIES: Dict[str, List[str]] = {
    "frontend": [
        "HTML",
        "CSS",
        "JavaScript",
        "TypeScript",
        "React",
        "Angular",
        "Next.js",
        "Responsive Design",
        "Git",
    ],
    "backend": [
        "Node.js",
        "Express",
        "PostgreSQL",
        "REST",
        "Docker",
        "AWS",
        "Git",
    ],
    "ai": [
        "Python",
        "Machine Learning",
        "Deep Learning",
        "TensorFlow",
        "PyTorch",
        "LLMs",
        "LangChain",
    ],
    "fullstack": [
        "JavaScript",
        "TypeScript",
        "React",
        "Node.js",
        "PostgreSQL",
        "REST",
        "Docker",
        "Git",
    ],
    "devops": [
        "Docker",
        "Kubernetes",
        "AWS",
        "CI/CD",
        "Linux",
        "Terraform",
        "Git",
    ],
    "data": [
        "Python",
        "SQL",
        "PostgreSQL",
        "Machine Learning",
        "Pandas",
        "Git",
    ],
    "general": [
        "Git",
        "SQL",
        "JavaScript",
        "Python",
        "Communication",
    ],
}

# Signals used to score dominant-skill role detection (canonical keys)
TRACK_SKILL_SIGNALS: Dict[str, List[str]] = {
    "frontend": [
        "html",
        "css",
        "javascript",
        "typescript",
        "react",
        "angular",
        "vue",
        "nextjs",
        "responsive design",
        "web performance",
        "bootstrap",
        "tailwind css",
    ],
    "backend": [
        "nodejs",
        "express",
        "postgresql",
        "mysql",
        "mongodb",
        "rest",
        "docker",
        "aws",
        "fastapi",
        "python",
    ],
    "ai": [
        "python",
        "machine learning",
        "deep learning",
        "tensorflow",
        "pytorch",
        "llms",
        "langchain",
        "artificial intelligence",
        "gpt4",
    ],
    "fullstack": ["javascript", "typescript", "react", "nodejs", "postgresql", "mongodb"],
    "devops": ["docker", "kubernetes", "aws", "cicd", "linux", "terraform"],
    "data": ["python", "sql", "postgresql", "machine learning", "pandas"],
}

# Semantic skill families for partial (rule-based) alignment
SKILL_FAMILIES: Dict[str, List[str]] = {
    "LLMs": [
        "GPT-4",
        "GPT-3",
        "Claude",
        "Gemini",
        "LangChain",
        "Prompt Engineering",
        "LLMs",
        "Large Language Models",
        "Generative AI",
        "OpenAI",
        "Anthropic",
        "RAG",
    ],
    "Machine Learning": [
        "Machine Learning",
        "Deep Learning",
        "Scikit-learn",
        "TensorFlow",
        "PyTorch",
        "XGBoost",
        "Keras",
        "MLflow",
        "Pandas",
        "NumPy",
    ],
    "Frontend Development": [
        "HTML",
        "CSS",
        "JavaScript",
        "TypeScript",
        "React",
        "Next.js",
        "Angular",
        "Vue",
        "Tailwind CSS",
        "Bootstrap",
        "Responsive Design",
        "Webpack",
        "Sass",
    ],
    "Backend Development": [
        "Node.js",
        "Express",
        "FastAPI",
        "Django",
        "Flask",
        "PostgreSQL",
        "MongoDB",
        "REST",
        "GraphQL",
        "Spring Boot",
        "Redis",
    ],
    "Cloud & DevOps": [
        "AWS",
        "Docker",
        "Kubernetes",
        "CI/CD",
        "Linux",
        "Terraform",
        "Git",
    ],
}

DIRECT_MATCH_WEIGHT = 1.0
FAMILY_MATCH_WEIGHT = 0.55

GENERIC_PREFERRED_ROLE_PATTERN = re.compile(
    r"^(?:software engineer|developer|engineer|programmer|technology professional|"
    r"it professional|tech professional|student|fresher|graduate)\s*$",
    re.IGNORECASE,
)

# Abbreviation / synonym expansions applied before lookup (token → phrase key)
TOKEN_EXPANSIONS: Dict[str, str] = {
    "ai": "artificial intelligence",
    "ml": "machine learning",
    "dl": "deep learning",
    "llm": "llms",
    "nlp": "natural language processing",
    "db": "database",
    "k8s": "kubernetes",
    "aws": "amazon web services",
    "gcp": "google cloud",
    "js": "javascript",
    "ts": "typescript",
    "py": "python",
}

ROLE_TRACK_KEYWORDS: Dict[str, List[str]] = {
    "frontend": ["frontend", "front-end", "front end", "ui developer", "react developer"],
    "backend": ["backend", "back-end", "back end", "api developer", "server"],
    "ai": ["ai engineer", "ml engineer", "machine learning", "artificial intelligence", "llm", "data scientist"],
    "fullstack": ["full stack", "fullstack", "full-stack"],
    "devops": ["devops", "sre", "platform engineer", "cloud engineer"],
    "data": ["data engineer", "data analyst", "analytics"],
}

# Build lookup tables at import
_ALIAS_TO_CANONICAL_KEY: Dict[str, str] = {}
_KEY_TO_DISPLAY: Dict[str, str] = {}


def _slug(key: str) -> str:
    return re.sub(r"[^a-z0-9+# ]", "", key.lower()).strip()


def _register_group(display: str, aliases: List[str]) -> None:
    canonical_key = _slug(display)
    _KEY_TO_DISPLAY[canonical_key] = display
    for alias in aliases:
        _ALIAS_TO_CANONICAL_KEY[_slug(alias)] = canonical_key
    _ALIAS_TO_CANONICAL_KEY[canonical_key] = canonical_key


for _display, _aliases in SKILL_EQUIVALENCE_GROUPS:
    _register_group(_display, _aliases)


@dataclass
class RoleDetectionResult:
    track: str
    display_role: str
    source: str  # preferred_role | resume_header | dominant_skills


@dataclass
class SkillNormalizationEntry:
    raw: str
    normalized: str


@dataclass
class FamilyMatchEntry:
    target_skill: str
    resume_skill: str
    family: str


@dataclass
class SkillMatchResult:
    matched_targets: Set[str] = field(default_factory=set)
    missing_targets: List[str] = field(default_factory=list)
    direct_matches: List[str] = field(default_factory=list)
    family_matches: List[FamilyMatchEntry] = field(default_factory=list)
    resume_keys: Set[str] = field(default_factory=set)
    target_keys: Set[str] = field(default_factory=set)
    match_count: int = 0
    direct_match_count: int = 0
    family_match_count: int = 0
    target_count: int = 0
    resume_normalizations: List[SkillNormalizationEntry] = field(default_factory=list)
    target_normalizations: List[SkillNormalizationEntry] = field(default_factory=list)


def _preprocess_skill(skill: str) -> str:
    """Lowercase, trim, remove punctuation (keep + and # for C++/C#)."""
    text = str(skill).strip().lower()
    text = re.sub(r"[^a-z0-9+# ]", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def _lookup_canonical_display(preprocessed: str) -> Optional[str]:
    """Map preprocessed text to canonical display via alias tables."""
    if not preprocessed:
        return None

    compact = preprocessed.replace(" ", "")

    expanded = preprocessed
    if preprocessed in TOKEN_EXPANSIONS:
        expanded = TOKEN_EXPANSIONS[preprocessed]
    elif compact in TOKEN_EXPANSIONS:
        expanded = TOKEN_EXPANSIONS[compact]

    expanded_compact = expanded.replace(" ", "")

    for candidate in (preprocessed, compact, expanded, expanded_compact, _slug(preprocessed), _slug(expanded)):
        if candidate in _ALIAS_TO_CANONICAL_KEY:
            key = _ALIAS_TO_CANONICAL_KEY[candidate]
            return _KEY_TO_DISPLAY[key]

    for alias, key in _ALIAS_TO_CANONICAL_KEY.items():
        if len(alias) < 4:
            continue
        if alias in (preprocessed, compact, expanded, expanded_compact):
            return _KEY_TO_DISPLAY[key]
        if alias in preprocessed or preprocessed in alias:
            return _KEY_TO_DISPLAY[key]

    return None


def normalize_skill(skill: str) -> str:
    """
    Normalize a skill for ATS matching: lowercase, trim, strip punctuation, apply aliases.
    Returns canonical display name when recognized (e.g. JavaScript, GPT-4, REST).
    """
    preprocessed = _preprocess_skill(skill)
    if not preprocessed:
        return ""

    canonical = _lookup_canonical_display(preprocessed)
    if canonical:
        return canonical

    return preprocessed


def normalize_skill_text(skill: str) -> str:
    """Backward-compatible alias of preprocess step."""
    return _preprocess_skill(skill)


def skill_to_canonical_key(skill: str) -> str:
    """Comparison key derived from normalized skill (alias-aware)."""
    normalized = normalize_skill(skill)
    if not normalized:
        return ""

    for key, display in _KEY_TO_DISPLAY.items():
        if display.lower() == normalized.lower():
            return key

    return _slug(normalized)


def canonical_display_name(skill_or_key: str) -> str:
    key = skill_to_canonical_key(skill_or_key)
    if key in _KEY_TO_DISPLAY:
        return _KEY_TO_DISPLAY[key]
    return skill_or_key.strip()


def skills_are_equivalent(skill_a: str, skill_b: str) -> bool:
    """True if normalized labels or canonical keys match."""
    if not skill_a.strip() or not skill_b.strip():
        return False
    norm_a = normalize_skill(skill_a)
    norm_b = normalize_skill(skill_b)
    if norm_a and norm_b and norm_a.lower() == norm_b.lower():
        return True
    return skill_to_canonical_key(skill_a) == skill_to_canonical_key(skill_b)


def build_skill_normalizations(skills: List[str]) -> List[SkillNormalizationEntry]:
    """Pair each raw extracted/target skill with its normalized form."""
    entries: List[SkillNormalizationEntry] = []
    seen_raw: Set[str] = set()
    for skill in skills:
        raw = skill.strip()
        if not raw:
            continue
        key = raw.lower()
        if key in seen_raw:
            continue
        seen_raw.add(key)
        entries.append(SkillNormalizationEntry(raw=raw, normalized=normalize_skill(raw)))
    return entries


def dedupe_skills_by_canonical(skills: List[str]) -> List[str]:
    """Return unique skills using canonical display names."""
    seen: Dict[str, str] = {}
    for skill in skills:
        key = skill_to_canonical_key(skill)
        if not key:
            continue
        display = _KEY_TO_DISPLAY.get(key, skill.strip())
        if key not in seen:
            seen[key] = display
    return sorted(seen.values(), key=str.lower)


def build_target_skill_set(raw_skills: List[str]) -> Set[str]:
    """Canonicalize and dedupe a list of target skills (display names)."""
    return set(dedupe_skills_by_canonical(raw_skills))


def families_for_skill(skill: str) -> Set[str]:
    """Return semantic family names this skill belongs to."""
    if not skill.strip():
        return set()
    skill_key = skill_to_canonical_key(skill)
    found: Set[str] = set()
    for family_name, members in SKILL_FAMILIES.items():
        for member in members:
            if skill_to_canonical_key(member) == skill_key or skills_are_equivalent(skill, member):
                found.add(family_name)
                break
    return found


def compute_skills_alignment_score(result: SkillMatchResult) -> int:
    """Weighted score: direct matches full credit, family matches partial credit."""
    if result.target_count == 0:
        return 70 if result.resume_keys else 30
    points = (
        result.direct_match_count * DIRECT_MATCH_WEIGHT
        + result.family_match_count * FAMILY_MATCH_WEIGHT
    )
    return int(min(100, max(0, round((points / result.target_count) * 100 * 1.08))))


def match_resume_to_targets(
    resume_skills: List[str],
    target_skills: Set[str],
) -> SkillMatchResult:
    """
    Match resume skills to targets after normalize_skill() on both sides.
    Missing list only contains targets with no equivalent on the resume.
    """
    resume_norms = build_skill_normalizations(resume_skills)
    target_list = sorted(target_skills, key=str.lower)
    target_norms = build_skill_normalizations(target_list)

    resume_keys: Set[str] = set()
    for entry in resume_norms:
        key = skill_to_canonical_key(entry.raw)
        if key:
            resume_keys.add(key)

    target_by_key: Dict[str, str] = {}
    for entry in target_norms:
        key = skill_to_canonical_key(entry.raw)
        if key:
            target_by_key[key] = normalize_skill(entry.raw)

    matched_keys: Set[str] = set()
    direct_matches: List[str] = []
    family_matches: List[FamilyMatchEntry] = []

    for t_key, t_display in target_by_key.items():
        direct_hit = False
        if t_key in resume_keys:
            direct_hit = True
        else:
            for r_entry in resume_norms:
                if skills_are_equivalent(r_entry.raw, t_display):
                    direct_hit = True
                    break

        if direct_hit:
            matched_keys.add(t_key)
            direct_matches.append(t_display)
            continue

        t_families = families_for_skill(t_display)
        family_hit: Optional[FamilyMatchEntry] = None
        for r_entry in resume_norms:
            r_families = families_for_skill(r_entry.raw)
            shared = t_families & r_families
            if not shared:
                continue
            if skills_are_equivalent(r_entry.raw, t_display):
                continue
            family_name = sorted(shared, key=len)[0]
            family_hit = FamilyMatchEntry(
                target_skill=t_display,
                resume_skill=normalize_skill(r_entry.raw),
                family=family_name,
            )
            break

        if family_hit:
            matched_keys.add(t_key)
            family_matches.append(family_hit)

    missing = sorted(
        (target_by_key[k] for k in target_by_key if k not in matched_keys),
        key=str.lower,
    )
    matched_display = sorted((target_by_key[k] for k in matched_keys), key=str.lower)
    direct_sorted = sorted(direct_matches, key=str.lower)

    return SkillMatchResult(
        matched_targets=set(matched_display),
        missing_targets=missing,
        direct_matches=direct_sorted,
        family_matches=family_matches,
        resume_keys=resume_keys,
        target_keys=set(target_by_key.keys()),
        match_count=len(matched_keys),
        direct_match_count=len(direct_matches),
        family_match_count=len(family_matches),
        target_count=len(target_by_key),
        resume_normalizations=resume_norms,
        target_normalizations=target_norms,
    )


def _track_from_text_blob(blob: str) -> Optional[str]:
    text = blob.lower()
    if not text.strip():
        return None
    scores: Dict[str, int] = {track: 0 for track in ROLE_TARGET_LIBRARIES}
    for track, keywords in ROLE_TRACK_KEYWORDS.items():
        for kw in keywords:
            if kw in text:
                scores[track] += 3 if len(kw) > 8 else 2
    best = max(scores, key=scores.get)
    if scores[best] > 0:
        return best
    return None


def _track_from_preferred_roles(preferred_roles: List[str]) -> Optional[str]:
    """Priority A: specific preferred role from career profile (skip generic titles)."""
    for role in preferred_roles:
        cleaned = role.strip()
        if not cleaned or GENERIC_PREFERRED_ROLE_PATTERN.match(cleaned):
            continue
        track = _track_from_text_blob(cleaned)
        if track:
            return track
    return None


def _track_from_dominant_skills(resume_skills: List[str]) -> str:
    """Priority C: count alignment with each track's skill signals."""
    resume_keys = {skill_to_canonical_key(s) for s in resume_skills if s.strip()}
    scores: Dict[str, int] = {track: 0 for track in ROLE_TARGET_LIBRARIES}

    for track, signals in TRACK_SKILL_SIGNALS.items():
        for signal in signals:
            sig_key = skill_to_canonical_key(signal)
            if sig_key in resume_keys:
                scores[track] += 2
            else:
                for rs in resume_skills:
                    if skills_are_equivalent(rs, signal):
                        scores[track] += 2
                        break

    for track, library in ROLE_TARGET_LIBRARIES.items():
        for skill in library:
            key = skill_to_canonical_key(skill)
            if key in resume_keys:
                scores[track] += 1

    best = max(scores, key=scores.get)
    if scores[best] == 0:
        return "general"
    return best


def resolve_ats_role(
    preferred_roles: List[str],
    resume_skills: List[str],
    resume_title: str = "",
    resume_header: str = "",
    experience_roles: Optional[List[str]] = None,
) -> RoleDetectionResult:
    """
    Determine ATS target role (priority):
    A. Career profile preferred role (if specific)
    B. Resume title / header / experience titles
    C. Dominant extracted skills
    """
    track = _track_from_preferred_roles(preferred_roles)
    if track:
        return RoleDetectionResult(track, role_track_label(track), "preferred_role")

    header_parts = [resume_title, resume_header]
    if experience_roles:
        header_parts.extend(experience_roles)
    header_blob = " ".join(p for p in header_parts if p)
    track = _track_from_text_blob(header_blob)
    if track:
        return RoleDetectionResult(track, role_track_label(track), "resume_header")

    track = _track_from_dominant_skills(resume_skills)
    return RoleDetectionResult(track, role_track_label(track), "dominant_skills")


def detect_role_track(
    preferred_roles: List[str],
    resume_skills: List[str],
    experience_roles: Optional[List[str]] = None,
    resume_title: str = "",
    resume_header: str = "",
) -> str:
    """Backward-compatible track id."""
    return resolve_ats_role(
        preferred_roles,
        resume_skills,
        resume_title=resume_title,
        resume_header=resume_header,
        experience_roles=experience_roles,
    ).track


def role_track_label(track: str) -> str:
    labels = {
        "frontend": "Frontend Developer",
        "backend": "Backend Developer",
        "ai": "AI / ML Engineer",
        "fullstack": "Full Stack Developer",
        "devops": "DevOps Engineer",
        "data": "Data Engineer",
        "general": "Technology Professional",
    }
    return labels.get(track, "Technology Professional")


def skills_for_role_track(track: str) -> List[str]:
    return list(ROLE_TARGET_LIBRARIES.get(track, ROLE_TARGET_LIBRARIES["general"]))


def target_skills_for_role(track: str) -> Set[str]:
    """ATS compares resume only against this role's skill library."""
    return build_target_skill_set(skills_for_role_track(track))


def role_detection_source_label(source: str) -> str:
    labels = {
        "preferred_role": "Career profile preferred role",
        "resume_header": "Resume title / header",
        "dominant_skills": "Dominant skills on resume",
    }
    return labels.get(source, source)
