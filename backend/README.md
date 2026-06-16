# Backend — Nexus API

FastAPI + PostgreSQL service for authentication and career identity (Phase 2.1).

## Setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Edit DATABASE_URL and JWT_SECRET_KEY
uvicorn app.main:app --reload --port 8000
#or
cd backend && source .venv/bin/activate && python -m pytest tests/test_opportunity_matching_service.py -v
```

Tables are created on startup via SQLAlchemy `create_all`.

## Auth endpoints

| Method | Path | Description |
| --- | --- | --- |
| POST | `/auth/signup` | Create account |
| POST | `/auth/login` | Login, returns JWT |
| GET | `/auth/me` | Current user (Bearer token) |
| GET | `/health` | Health check |

## Career identity endpoints (authenticated)

| Method | Path | Description |
| --- | --- | --- |
| GET | `/career/onboarding/status` | Onboarding completion + step + profile % |
| GET | `/career/profile` | Full career profile bundle |
| PATCH | `/career/profile` | Partial update (save onboarding progress) |
| POST | `/career/onboarding/complete` | Validate and mark onboarding complete |

## Database tables

- `users` — auth account
- `user_profiles` — personal + career + automation preference fields
- `career_preferences` — roles, locations, employment/work prefs
- `user_skills` — normalized skills list
- `onboarding_status` — completion flag and current wizard step

All career routes require `Authorization: Bearer <token>` and only return the authenticated user's data.
