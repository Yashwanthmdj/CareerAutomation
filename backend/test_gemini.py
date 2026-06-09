#!/usr/bin/env python3
"""Standalone Gemini API connectivity test.

Usage:
  export GEMINI_API_KEY='your-key'
  pip install google-genai
  python test_gemini.py
"""

from __future__ import annotations

import os
import sys
from pathlib import Path

PROMPT = "Reply with exactly: Gemini connection successful"
DEFAULT_MODEL = "gemini-2.0-flash"


def _load_dotenv_if_present() -> None:
    """Load backend/.env into os.environ when present (does not override existing vars)."""
    env_path = Path(__file__).resolve().parent / ".env"
    if not env_path.is_file():
        return
    for line in env_path.read_text(encoding="utf-8").splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("#") or "=" not in stripped:
            continue
        key, _, value = stripped.partition("=")
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        if key and key not in os.environ:
            os.environ[key] = value


def main() -> int:
    _load_dotenv_if_present()

    api_key = os.environ.get("GEMINI_API_KEY", "").strip()
    if not api_key:
        print("ERROR: GEMINI_API_KEY is not set.", file=sys.stderr)
        print("Set it in your environment or in backend/.env", file=sys.stderr)
        return 1

    try:
        from google import genai
    except ImportError:
        print("ERROR: google-genai package is not installed.", file=sys.stderr)
        print("Install with: pip install google-genai", file=sys.stderr)
        return 1

    model = os.environ.get("GEMINI_MODEL", DEFAULT_MODEL).strip() or DEFAULT_MODEL

    try:
        client = genai.Client(api_key=api_key)
        response = client.models.generate_content(model=model, contents=PROMPT)
        text = (getattr(response, "text", None) or "").strip()
        if not text:
            print("ERROR: Gemini returned an empty response.", file=sys.stderr)
            return 1
        print(text)
        return 0
    except Exception as exc:
        print(f"ERROR: Gemini connectivity test failed: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
