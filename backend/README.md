# Backend Auth Service

FastAPI + PostgreSQL JWT authentication service for Nexus.

## Setup

1. Create a virtual environment and install dependencies:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

2. Create `.env` from `.env.example` and update secrets/DB URL.
3. Ensure PostgreSQL database exists.
4. Run API:

```bash
uvicorn app.main:app --reload --port 8000
```

## Endpoints

- `POST /auth/signup`
- `POST /auth/login`
- `GET /auth/me` (requires `Authorization: Bearer <token>`)
- `GET /health`

