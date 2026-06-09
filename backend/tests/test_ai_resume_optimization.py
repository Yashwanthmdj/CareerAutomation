from __future__ import annotations

import pytest
from fastapi import HTTPException

from app.ai.providers.mock import MockAIProvider
from app.ai.schemas import OptimizationRequest
from app.services.resume_optimization_service import optimize_resume_with_ai


def _resume(**kwargs):
    defaults = {"id": "r1", "title": "Frontend Developer", "user_id": "u1"}
    defaults.update(kwargs)
    return type("Resume", (), defaults)()


def _analysis(**kwargs):
    defaults = {
        "resume_id": "r1",
        "raw_text": (
            "Frontend Developer\n"
            "SKILLS\nJavaScript, React, HTML, CSS\n"
            "EXPERIENCE\nBuilt UI improving load time by 30% for 5k users."
        ),
        "status": "completed",
    }
    defaults.update(kwargs)
    return type("Analysis", (), defaults)()


def test_mock_provider_returns_required_fields():
    provider = MockAIProvider()
    result = provider.optimize_resume(
        resume_text="Frontend Developer\nJavaScript, React",
        target_role="Frontend Developer",
    )
    assert result.summary
    assert isinstance(result.missing_skills, list)
    assert isinstance(result.improvements, list)
    assert result.ats_gain >= 0
    assert result.provider == "mock"


def test_optimize_resume_with_ai_success(monkeypatch):
    resume = _resume()
    analysis = _analysis()

    class FakeQuery:
        def filter(self, *args, **kwargs):
            return self

        def first(self):
            return analysis

    class FakeDB:
        def query(self, model):
            return FakeQuery()

    monkeypatch.setattr(
        "app.services.resume_optimization_service.get_user_resume",
        lambda db, user_id, resume_id: resume,
    )

    out = optimize_resume_with_ai(
        db=FakeDB(),
        user=type("User", (), {"id": "u1"})(),
        resume_id="r1",
        request=OptimizationRequest(),
        provider=MockAIProvider(),
    )
    assert out.provider == "mock"
    assert out.target_role == "Frontend Developer"
    assert out.summary
    assert out.ats_gain >= 0


def test_optimize_resume_with_ai_missing_text(monkeypatch):
    resume = _resume()
    analysis = _analysis(raw_text="", status="completed")

    class FakeQuery:
        def filter(self, *args, **kwargs):
            return self

        def first(self):
            return analysis

    class FakeDB:
        def query(self, model):
            return FakeQuery()

    monkeypatch.setattr(
        "app.services.resume_optimization_service.get_user_resume",
        lambda db, user_id, resume_id: resume,
    )

    with pytest.raises(HTTPException) as exc:
        optimize_resume_with_ai(
            db=FakeDB(),
            user=type("User", (), {"id": "u1"})(),
            resume_id="r1",
            request=OptimizationRequest(),
            provider=MockAIProvider(),
        )
    assert exc.value.status_code == 400
