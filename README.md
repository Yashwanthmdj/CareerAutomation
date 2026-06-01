# Nexus — Autonomous Career OS

Production-grade AI Career Operating System with JWT authentication, multi-step onboarding, and PostgreSQL-backed career identity. Nexus provides a premium mission-control dashboard and stores real user career data for future AI automation phases.

This README is updated as features ship. It walks through **every step** to clone, configure, run, test, build, and deploy the project locally.

---

## Table of Contents

1. [What You Get](#what-you-get)
2. [Project Phases (Changelog)](#project-phases-changelog)
3. [Start / Restart the Backend](#start--restart-the-backend)
4. [Tech Stack](#tech-stack)
5. [Prerequisites](#prerequisites)
6. [Project Structure](#project-structure)
7. [Quick Start (5 Minutes)](#quick-start-5-minutes)
8. [Full Setup — Step by Step](#full-setup--step-by-step)
9. [Environment Variables](#environment-variables)
10. [Running the Application](#running-the-application)
11. [Authentication & Onboarding Flow](#authentication--onboarding-flow)
12. [Routes & Pages](#routes--pages)
13. [API Reference](#api-reference)
14. [Development Workflow](#development-workflow)
15. [Available Scripts](#available-scripts)
16. [Architecture Overview](#architecture-overview)
17. [Manual Testing Checklist](#manual-testing-checklist)
18. [Production Build](#production-build)
19. [Deployment Notes](#deployment-notes)
20. [Troubleshooting](#troubleshooting)
21. [Roadmap / Next Steps](#roadmap--next-steps)

---

## What You Get

- **Marketing site** — Landing, features, pricing, integrations, help, waitlist
- **Auth system** — Sign up, login, JWT sessions, protected routes, logout
- **Career identity (Phase 2.1)** — 4-step onboarding wizard, profile stored in PostgreSQL, editable profile page
- **Dashboard** — Mission control with real profile completion, career status, roles/locations (no fake metrics)
- **App sections** — Opportunities, applications, automation, resume, analytics, notifications, integrations, settings, profile
- **Premium UI** — Dark glassmorphism theme, Framer Motion animations, responsive layout
- **Resume management (Phase 3.1)** — PDF upload to Supabase Storage, metadata in PostgreSQL, multiple versions, active resume switching
- **Backend API** — FastAPI + PostgreSQL + JWT auth + career identity + resume endpoints

---

## Project Phases (Changelog)

| Phase | Status | What shipped |
| --- | --- | --- |
| **Phase 1** | Done | Premium dashboard UI, JWT auth, route guards, API client, honest empty states (no demo data) |
| **Phase 2.1** | Done | Career Identity System — onboarding wizard, PostgreSQL tables (`user_profiles`, `career_preferences`, `user_skills`, `onboarding_status`), career API |
| **Phase 3.1** | Done | Resume Infrastructure — `resumes` table, Supabase Storage bucket `resumes`, upload/list/activate/delete APIs, Resume Manager UI |
| **Phase 3.2** | Done | Resume Intelligence Foundation — PDF text extraction (PyMuPDF/pdfplumber), rule-based parsing, structured PostgreSQL storage, analysis API + UI |
| **Phase 3.3** | Done | ATS Intelligence Engine — rule-based ATS score, breakdown, missing skills, strengths/weaknesses, recommendations (no AI APIs) |
| **Phase 3.3.1** | Done | ATS skill intelligence — normalization, aliases, role-track recommendations |
| **Phase 3.3.2** | Done | `POST /resumes/{id}/analyze` — re-parse stored PDFs (backfill); Re-analyze button in Resume Manager |
| **Phase 3.4+** | Planned | AI resume optimization (not started) |
| **Phase 2.2+** | Planned | Platform integrations (WhatsApp, LinkedIn, Gmail), AI agents, opportunity discovery |

> **Data rule:** Career identity and resume metadata live in **PostgreSQL**. Resume files live in **Supabase Storage** (private bucket). `localStorage` is only used for UI state (e.g. integration toggles, activity feed) — not as the source of truth for profile or resumes.

---

## Start / Restart the Backend

Use this whenever you open the project again or stopped the API with `Ctrl+C`.

### Prerequisites check

```bash
# PostgreSQL must be running
pg_isready

# Database must exist (create once if missing)
createdb nexus
```

### Activate and run (macOS / Linux)

```bash
# 1. Go to backend folder
cd /Users/maddojuyashwanth/Desktop/carrerforyou-main/backend

# 2. Activate the Python virtual environment
source .venv/bin/activate

# You should see (.venv) in your terminal prompt

# 3. Start the API (auto-reload on file changes)
uvicorn app.main:app --reload --port 8000
```

### Activate and run (Windows PowerShell)

```powershell
cd backend
.venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --port 8000
```

### First time only (no `.venv` yet)

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\Activate.ps1
pip install -r requirements.txt
cp .env.example .env               # Edit DATABASE_URL and JWT_SECRET_KEY
uvicorn app.main:app --reload --port 8000
```

### Verify the backend is running

```bash
curl http://localhost:8000/health
# Expected: {"status":"ok"}
```

- **API docs:** [http://localhost:8000/docs](http://localhost:8000/docs)
- **Stop the server:** `Ctrl+C` in the terminal where uvicorn is running

### After pulling code updates

1. `cd backend && source .venv/bin/activate`
2. `pip install -r requirements.txt` (if dependencies changed)
3. Restart uvicorn — new tables are created automatically on startup via SQLAlchemy `create_all`

---

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend framework | React 19 |
| Routing / SSR | TanStack Router + TanStack Start |
| Data fetching | TanStack React Query |
| Styling | Tailwind CSS v4, shadcn/ui (Radix) |
| Animations | Motion (`motion/react`) |
| Build tool | Vite 7 |
| Backend | FastAPI |
| Database | PostgreSQL |
| ORM | SQLAlchemy 2 |
| Auth | JWT (python-jose) + bcrypt (passlib) |

---

## Prerequisites

Install these before starting:

| Tool | Minimum version | Purpose |
| --- | --- | --- |
| **Node.js** | 20+ | Frontend dev server & build |
| **npm** or **Bun** | Latest | Package manager |
| **Python** | 3.9+ (3.10+ recommended) | Backend API |
| **PostgreSQL** | 14+ | User database |
| **Git** | Any recent | Clone the repo |

Optional but recommended:

- **psql** CLI — create/manage the database
- **curl** or **Postman** — test API endpoints
- **VS Code / Cursor** — development

Verify installations:

```bash
node -v
npm -v
python3 --version
psql --version
```

---

## Project Structure

```
carrerforyou-main/
├── README.md                 # This file
├── .env.example              # Frontend env template
├── package.json              # Frontend dependencies & scripts
├── vite.config.ts            # Vite + TanStack Start config
├── tsconfig.json             # TypeScript config (@/* path alias)
│
├── src/                      # Frontend source
│   ├── routes/               # File-based routes (TanStack Router)
│   │   ├── __root.tsx        # Global layout, providers, 404/error
│   │   ├── index.tsx         # Landing page (/)
│   │   ├── login.tsx         # /login
│   │   ├── signup.tsx        # /signup
│   │   ├── _site.tsx         # Marketing layout wrapper
│   │   ├── _site.*.tsx       # /features, /pricing, etc.
│   │   ├── app.tsx           # Dashboard layout + auth guard
│   │   └── app.*.tsx         # /app/* dashboard pages
│   ├── components/           # UI components
│   │   ├── landing/          # Landing page sections
│   │   ├── dashboard/        # AppShell, StatCard
│   │   ├── auth/             # RequireAuth, RequireGuest
│   │   ├── shared/           # Navbar, Footer, BackgroundFX
│   │   └── ui/               # shadcn/ui primitives
│   ├── routes/onboarding.tsx # 4-step career onboarding wizard
│   ├── components/onboarding/# OnboardingWizard UI
│   ├── services/             # API layer
│   │   ├── api/              # HTTP client, token storage
│   │   ├── auth/             # authService (login/signup/me)
│   │   └── career/           # careerService (profile + onboarding)
│   ├── store/                # session.tsx, career.tsx, workspace.tsx
│   ├── hooks/                # useAuth, useCareer, useWorkspace
│   ├── config/               # brand.ts, env.ts
│   ├── types/                # user, auth, career, workspace types
│   ├── app/providers/        # AppProviders (Query + Session + Career)
│   ├── router.tsx            # Router factory
│   ├── start.ts              # TanStack Start config
│   └── server.ts             # SSR server entry
│
└── backend/                  # FastAPI API service
    ├── .env.example          # Backend env template
    ├── requirements.txt      # Python dependencies
    ├── README.md             # Backend-only quick reference
    └── app/
        ├── main.py           # FastAPI app, CORS, routers
        ├── auth.py           # Signup / login / me
        ├── career.py         # Profile + onboarding routes
        ├── career_models.py  # user_profiles, career_preferences, etc.
        ├── career_schemas.py # Pydantic career schemas
        ├── career_service.py # Business logic + validation
        ├── models.py         # User model + relationships
        ├── schemas.py        # Auth Pydantic schemas
        ├── security.py       # Password hashing + JWT
        ├── middleware.py     # JWT middleware
        ├── deps.py           # get_current_user
        ├── database.py       # SQLAlchemy engine
        └── config.py         # Settings from .env
```

---

## Quick Start (5 Minutes)

If you already have Node, Python, and PostgreSQL installed:

```bash
# 1. Clone and enter project
git clone <your-repo-url>
cd carrerforyou-main

# 2. Frontend
cp .env.example .env
npm install
npm run dev

# 3. Backend (new terminal)
cd backend
python3 -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env               # Edit DATABASE_URL + JWT_SECRET_KEY
createdb nexus                     # Or create DB via psql (see below)
uvicorn app.main:app --reload --port 8000

# 4. Open app
# Frontend: http://localhost:3000 or http://localhost:5173
# Backend docs: http://localhost:8000/docs
```

---

## Full Setup — Step by Step

### Step 1 — Clone the repository

```bash
git clone <your-repo-url>
cd carrerforyou-main
```

### Step 2 — Install frontend dependencies

Using **npm** (recommended if `package-lock.json` exists):

```bash
npm install
```

Or using **Bun**:

```bash
bun install
```

### Step 3 — Configure frontend environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_APP_ENV=development
```

> **Important:** Only variables prefixed with `VITE_` are exposed to the browser. Never put secrets in frontend env files.

### Step 4 — Install and start PostgreSQL

**macOS (Homebrew):**

```bash
brew install postgresql@16
brew services start postgresql@16
```

**Ubuntu/Debian:**

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**Windows:** Install from [postgresql.org/download](https://www.postgresql.org/download/windows/) and start the service.

### Step 5 — Create the database

```bash
# Option A: createdb
createdb nexus

# Option B: psql
psql postgres
CREATE DATABASE nexus;
\q
```

If your PostgreSQL user requires a password, note the credentials — you will need them in the backend `.env`.

### Step 6 — Set up the Python backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
```

On Windows PowerShell:

```powershell
.venv\Scripts\Activate.ps1
```

Install dependencies:

```bash
pip install -r requirements.txt
```

### Step 7 — Configure backend environment

```bash
cp .env.example .env
```

Edit `backend/.env`:

```env
APP_NAME=Nexus Auth API
APP_ENV=development

# Use psycopg2 driver format (required by SQLAlchemy in this project)
DATABASE_URL=postgresql+psycopg2://postgres:postgres@localhost:5432/nexus

# Generate a strong secret (example below — do NOT use in production)
JWT_SECRET_KEY=your-long-random-secret-at-least-32-characters
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRES_MINUTES=60

# Must include your frontend dev server origin(s)
FRONTEND_ORIGINS=http://localhost:3000,http://localhost:5173
```

Generate a secure JWT secret:

```bash
python3 -c "import secrets; print(secrets.token_urlsafe(48))"
```

Replace `postgres:postgres` with your actual PostgreSQL username and password if different.

### Step 8 — Start the backend API

From `backend/` with the virtual environment activated:

```bash
uvicorn app.main:app --reload --port 8000
```

On first startup, SQLAlchemy automatically creates all tables (`users`, `user_profiles`, `career_preferences`, `user_skills`, `onboarding_status`).

Verify the API is running:

```bash
curl http://localhost:8000/health
# Expected: {"status":"ok"}
```

Interactive API docs: [http://localhost:8000/docs](http://localhost:8000/docs)

### Step 9 — Start the frontend

From the project root (new terminal):

```bash
npm run dev
```

Open the URL printed in the terminal (typically `http://localhost:3000` or `http://localhost:5173`).

### Step 10 — Create your first account and complete onboarding

1. Go to **http://localhost:3000/signup** (or whatever port Vite prints)
2. Enter name, email, and password (minimum 8 characters)
3. Submit — you are redirected toward the app; if onboarding is incomplete, you land on **`/onboarding`**
4. Complete all **4 onboarding steps** (personal → career → targets → automation prefs)
5. Click **Complete onboarding** — you are redirected to **`/app`**
6. Refresh the page — session and career profile persist (JWT + PostgreSQL)
7. Edit your profile anytime at **`/app/profile`**

---


## Environment Variables

### Frontend (`.env` in project root)

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `VITE_API_BASE_URL` | No | `http://localhost:8000` | FastAPI backend base URL |
| `VITE_APP_ENV` | No | `development` | App environment label |

### Backend (`backend/.env`)

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `APP_NAME` | No | `Nexus Auth API` | API title in OpenAPI docs |
| `APP_ENV` | No | `development` | Environment label |
| `DATABASE_URL` | Yes | — | PostgreSQL connection string |
| `JWT_SECRET_KEY` | Yes | — | Secret for signing JWT tokens |
| `JWT_ALGORITHM` | No | `HS256` | JWT signing algorithm |
| `JWT_ACCESS_TOKEN_EXPIRES_MINUTES` | No | `60` | Token expiry in minutes |
| `FRONTEND_ORIGINS` | Yes | — | Comma-separated CORS allowed origins |
| `SUPABASE_URL` | Yes (resumes) | — | Supabase project URL |
| `SUPABASE_ANON_KEY` | No | — | Public anon key (reserved for future client use) |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes (resumes) | — | Service role key for server-side storage |
| `SUPABASE_BUCKET_NAME` | No | `resumes` | Storage bucket name |

---

## Supabase setup (Phase 3.1)

1. Create a Supabase project at [https://supabase.com](https://supabase.com).
2. In **Storage**, create a **private** bucket named `resumes`.
3. Copy **Project URL**, **anon key**, and **service_role key** into `backend/.env` (see `backend/.env.example`).
4. Do **not** expose the service role key in the frontend. All uploads/downloads go through the FastAPI backend.
5. Object path format: `{user_id}/{resume_id}.pdf` inside the `resumes` bucket.
6. Use either the **Secret key** (`sb_secret_...`) from **Project Settings → API Keys**, or the legacy **service_role** JWT (`eyJ...`). Paste the full key with no quotes. Restart uvicorn after editing `.env`.

> If upload fails with **Invalid Compact JWS**, the backend was missing the `apikey` header for new `sb_secret_*` keys (fixed in Phase 3.1) or the key in `.env` is truncated/wrong.

---

## Running the Application

You need **two terminals** running simultaneously:

| Terminal | Directory | Command | URL |
| --- | --- | --- | --- |
| 1 | `backend/` | `source .venv/bin/activate` then `uvicorn app.main:app --reload --port 8000` | http://localhost:8000 |
| 2 | project root | `npm run dev` | http://localhost:3000 or :5173 |

**Stop servers:** Press `Ctrl+C` in each terminal.

See [Start / Restart the Backend](#start--restart-the-backend) for copy-paste commands.

---

## Authentication & Onboarding Flow

```
┌─────────────┐     POST /auth/signup or /auth/login     ┌─────────────┐
│   Browser   │ ───────────────────────────────────────► │   FastAPI   │
│  (React UI) │ ◄─────────────────────────────────────── │  PostgreSQL │
└─────────────┘     { access_token, user }               └─────────────┘
       │
       │ 1. Token saved to localStorage (key: nexus_access_token)
       │ 2. Session stored in React context (SessionProvider)
       │
       ▼
┌─────────────┐     GET /auth/me (Bearer token)          ┌─────────────┐
│  App reload │ ───────────────────────────────────────► │   FastAPI   │
└─────────────┘     Restores user session                └─────────────┘
```

### Onboarding flow (Phase 2.1)

```
Signup/Login → /app → (if onboarding incomplete) → /onboarding
                ↓
         4-step wizard (saves to PostgreSQL on each step)
                ↓
         POST /career/onboarding/complete → /app dashboard
```

### Frontend auth & career components

| File | Role |
| --- | --- |
| `src/store/session.tsx` | JWT session, token restore |
| `src/store/career.tsx` | Career profile + onboarding status from API |
| `src/hooks/useAuth.ts` | Auth hook |
| `src/hooks/useCareer.ts` | Career identity hook |
| `src/services/auth/authService.ts` | Login / signup / me |
| `src/services/career/careerService.ts` | Profile + onboarding API |
| `src/services/api/client.ts` | JWT on all requests |
| `src/components/auth/AuthGuards.tsx` | `RequireAuth`, `RequireOnboarded`, `RequireIncompleteOnboarding` |
| `src/components/onboarding/OnboardingWizard.tsx` | Multi-step onboarding UI |

### Route access rules

| Route | Who can access |
| --- | --- |
| `/`, `/features`, `/pricing`, … | Everyone (public) |
| `/login`, `/signup` | Guests only (logged-in users → `/app`) |
| `/onboarding` | Logged-in users who have **not** completed onboarding |
| `/app/*` | Logged-in users who **have** completed onboarding |

---

## Routes & Pages

### Marketing & auth

| URL | File | Description |
| --- | --- | --- |
| `/` | `src/routes/index.tsx` | Landing page |
| `/login` | `src/routes/login.tsx` | Sign in |
| `/signup` | `src/routes/signup.tsx` | Create account |
| `/onboarding` | `src/routes/onboarding.tsx` | 4-step career onboarding (auth required) |
| `/features` | `src/routes/_site.features.tsx` | Product features |
| `/pricing` | `src/routes/_site.pricing.tsx` | Pricing plans |
| `/integrations` | `src/routes/_site.integrations.tsx` | Integrations |
| `/help` | `src/routes/_site.help.tsx` | Help & FAQ |
| `/waitlist` | `src/routes/_site.waitlist.tsx` | Waitlist signup |

### Dashboard (requires login)

| URL | File | Description |
| --- | --- | --- |
| `/app` | `src/routes/app.index.tsx` | Mission control dashboard |
| `/app/opportunities` | `src/routes/app.opportunities.tsx` | Opportunity pipeline |
| `/app/applications` | `src/routes/app.applications.tsx` | Application tracker |
| `/app/automation` | `src/routes/app.automation.tsx` | AI automation |
| `/app/resume` | `src/routes/app.resume.tsx` | Resume manager |
| `/app/analytics` | `src/routes/app.analytics.tsx` | Analytics |
| `/app/notifications` | `src/routes/app.notifications.tsx` | Notifications |
| `/app/settings` | `src/routes/app.settings.tsx` | Settings |
| `/app/integrations` | `src/routes/app.integrations.tsx` | Platform connection toggles (UI state) |
| `/app/profile` | `src/routes/app.profile.tsx` | Career profile editor (PostgreSQL) |

### Layout routes

- `src/routes/_site.tsx` — wraps marketing pages with shared Navbar + Footer
- `src/routes/app.tsx` — wraps dashboard with `RequireAuth` + `RequireOnboarded` + AppShell
- `src/routes/__root.tsx` — global shell, meta tags, providers, 404 page

> `src/routeTree.gen.ts` is auto-generated by TanStack Router. Do not edit manually.

---

## API Reference

Base URL: `http://localhost:8000`

### Health check

```bash
GET /health
```

Response:

```json
{ "status": "ok" }
```

### Sign up

```bash
POST /auth/signup
Content-Type: application/json

{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "password123"
}
```

Response (`201 Created`):

```json
{
  "access_token": "<jwt>",
  "token_type": "bearer",
  "user": {
    "id": "uuid",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "plan": "free"
  }
}
```

Errors:

- `409` — Email already in use
- `422` — Validation error (password too short, invalid email, etc.)

### Log in

```bash
POST /auth/login
Content-Type: application/json

{
  "email": "jane@example.com",
  "password": "password123"
}
```

Response (`200 OK`): Same shape as signup.

Errors:

- `401` — Invalid email or password

### Current user

```bash
GET /auth/me
Authorization: Bearer <access_token>
```

Response (`200 OK`):

```json
{
  "id": "uuid",
  "name": "Jane Doe",
  "email": "jane@example.com",
  "plan": "free"
}
```

Errors:

- `401` — Missing or invalid token

### Career profile (authenticated)

All endpoints require `Authorization: Bearer <access_token>`.

#### Onboarding status

```bash
GET /career/onboarding/status
```

Response:

```json
{
  "is_completed": false,
  "current_step": 1,
  "profile_completion": 25
}
```

#### Get full career profile

```bash
GET /career/profile
```

Returns personal info, skills, preferences, automation prefs, and `profile_completion` percentage.

#### Update profile (partial save / resume onboarding)

```bash
PATCH /career/profile
Content-Type: application/json

{
  "current_step": 2,
  "phone": "+1 555 0100",
  "location": "San Francisco, CA",
  "skills": ["Python", "React"]
}
```

Use this during onboarding to save progress step-by-step.

#### Complete onboarding

```bash
POST /career/onboarding/complete
```

Validates required fields, sets `is_completed: true`, returns full profile + status.

Errors:

- `422` — Missing required fields (`detail.errors` array)

### Resume API (Phase 3.1)

All endpoints require `Authorization: Bearer <access_token>`. Users can only access their own resumes.

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/resumes/upload` | Upload PDF (multipart: `file`, optional `title`) |
| `GET` | `/resumes` | List all resumes for the user |
| `GET` | `/resumes/active` | Get the active resume (or `null`) |
| `GET` | `/resumes/{id}` | Get resume metadata |
| `GET` | `/resumes/{id}/download` | Download PDF (proxied through API; bucket stays private) |
| `POST` | `/resumes/{id}/activate` | Set active resume (deactivates all others) |
| `DELETE` | `/resumes/{id}` | Delete file from Supabase + database row |

**Validation:** PDF only, max 10 MB, magic-byte check (`%PDF`).

**`resumes` table columns:** `id`, `user_id`, `title`, `file_name`, `file_size`, `mime_type`, `storage_path`, `supabase_object_key`, `is_active`, `uploaded_at`, `updated_at`.

First uploaded resume is automatically set **active**. Only one active resume per user.

### Resume analysis API (Phase 3.2)

```bash
GET /resumes/{id}/analysis
```

Returns extracted skills, education, projects, experience, certifications, raw text, counts summary, and `status` (`completed` | `failed` | `pending`).

Parsing runs automatically after upload (in-process). **Upload never fails** if parsing fails — the resume is stored and analysis is marked `failed` or `pending`.

**Tables:** `resume_analysis`, `extracted_skills`, `extracted_projects`, `extracted_education`, `extracted_experience`, `extracted_certifications`.

**Parser:** `backend/app/resume_parser.py` — PyMuPDF primary, pdfplumber fallback, regex + section headers (no OpenAI/Gemini/Claude).

---

## Development Workflow

### Adding a new page

1. Create a file in `src/routes/`
2. Export a route with `createFileRoute`:

```tsx
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/my-page")({
  component: MyPage,
});

function MyPage() {
  return <div>My page</div>;
}
```

3. TanStack Router regenerates `routeTree.gen.ts` automatically during dev/build
4. Link to it with `<Link to="/my-page">`

See `src/routes/README.md` for file-based routing conventions.

### Adding a new API service

1. Define types in `src/types/`
2. Add methods in `src/services/<domain>/`
3. Use `apiClient` from `src/services/api/client.ts` (JWT attached automatically)
4. Consume via React Query hooks or direct calls in components

### Updating branding

Edit `src/config/brand.ts`:

```ts
export const BRAND = {
  productName: "Nexus",
  defaultTitle: "Nexus — Autonomous Career OS",
  // ...
};
```

---

## Available Scripts

Run from project root:

| Command | Description |
| --- | --- |
| `npm run dev` | Start frontend dev server with HMR |
| `npm run build` | Production build (client + server) |
| `npm run build:dev` | Development-mode build |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |
| `npm run format` | Format code with Prettier |

Backend (from `backend/` with venv active):

| Command | Description |
| --- | --- |
| `uvicorn app.main:app --reload --port 8000` | Dev server with auto-reload |
| `uvicorn app.main:app --host 0.0.0.0 --port 8000` | Bind all interfaces |

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│                        Browser                               │
│  React UI ──► TanStack Router ──► Route Guards               │
│       │              │                                       │
│       ▼              ▼                                       │
│  SessionProvider + CareerProvider + WorkspaceProvider        │
│       │                                                      │
│       ▼                                                      │
│  authService / careerService ──► apiClient + JWT             │
└──────────────────────────┬───────────────────────────────────┘
                           │ HTTP
                           ▼
┌──────────────────────────────────────────────────────────────┐
│                     FastAPI (backend/)                       │
│  CORS ──► AuthMiddleware ──► /auth + /career ──► SQLAlchemy│
└──────────────────────────┬───────────────────────────────────┘
                           │
                           ▼
              PostgreSQL (users, user_profiles,
              career_preferences, user_skills, onboarding_status)
```

### Key design decisions

- **JWT in localStorage** — Simple SPA session persistence; upgrade to httpOnly cookies for production hardening
- **Service layer** — All API calls go through `src/services/`; no raw fetch in components
- **Layout routes** — Single AppShell for all dashboard pages; single marketing layout for public pages
- **Auto table creation** — `Base.metadata.create_all()` on startup; replace with Alembic migrations for production

---

## Manual Testing Checklist

Use this to verify everything works end-to-end:

- [ ] Backend health: `curl http://localhost:8000/health` returns `ok`
- [ ] Frontend loads at dev server URL
- [ ] Navigate to `/features`, `/pricing`, `/integrations`, `/help`, `/waitlist`
- [ ] Sign up with a new email → onboarding wizard at `/onboarding`
- [ ] Complete all 4 onboarding steps → lands on `/app`
- [ ] Dashboard shows your name, career status, and profile completion %
- [ ] Profile page saves edits → refresh persists from API
- [ ] Log out and log back in → skips onboarding, goes to `/app`
- [ ] Refresh page → still logged in
- [ ] Visit `/login` while logged in → redirects to `/app`
- [ ] Logout from navbar or sidebar → redirects to `/`
- [ ] Visit `/app` while logged out → redirects to `/login`
- [ ] Login with wrong password → error message shown
- [ ] Sign up with existing email → error message shown
- [ ] All sidebar links work: opportunities, applications, automation, etc.

---

## Production Build

### Frontend

```bash
# From project root
cp .env.example .env
# Set VITE_API_BASE_URL to your production API URL

npm run build
npm run preview   # Optional: test build locally
```

Output is written to `dist/`.

### Backend

```bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

For production, use a process manager (systemd, Docker, Railway, Render, etc.) and set:

- Strong `JWT_SECRET_KEY`
- Production `DATABASE_URL`
- Correct `FRONTEND_ORIGINS` (your deployed frontend URL)

---

## Deployment Notes

### Frontend

Deploy `dist/` to any static/SSR host that supports TanStack Start / Nitro:

- Vercel
- Cloudflare Workers
- Netlify
- Railway

Set environment variables on the hosting platform:

```
VITE_API_BASE_URL=https://api.yourdomain.com
VITE_APP_ENV=production
```

### Backend

Deploy FastAPI separately:

- Set `DATABASE_URL` to a managed PostgreSQL instance
- Set `FRONTEND_ORIGINS=https://yourdomain.com`
- Use HTTPS everywhere
- Consider Alembic for database migrations instead of `create_all`

### CORS

If the frontend shows CORS errors, ensure your frontend URL is listed in `FRONTEND_ORIGINS` in `backend/.env`.

---

## Troubleshooting

### Frontend won't start

```bash
rm -rf node_modules
npm install
npm run dev
```

### `ECONNREFUSED` or API errors on login

1. Confirm backend is running on port 8000
2. Check `VITE_API_BASE_URL` in `.env`
3. Restart frontend after changing `.env`

### CORS error in browser console

Add your frontend URL to `FRONTEND_ORIGINS` in `backend/.env`:

```env
FRONTEND_ORIGINS=http://localhost:3000,http://localhost:5173
```

Restart the backend after editing.

### Database connection failed

1. Confirm PostgreSQL is running: `pg_isready`
2. Verify database exists: `psql -l | grep nexus`
3. Check `DATABASE_URL` format:

```
postgresql+psycopg2://USER:PASSWORD@HOST:PORT/DATABASE
```

### `Email already in use`

The email is already registered. Use `/login` or choose a different email.

### Session not persisting after refresh

1. Check browser localStorage for key `nexus_access_token`
2. Confirm `/auth/me` returns 200 in Network tab
3. Ensure token has not expired (`JWT_ACCESS_TOKEN_EXPIRES_MINUTES`)

### Build fails

```bash
npm run lint
npm run build
```

Fix TypeScript/ESLint errors reported in the output.

### Password validation errors

Backend requires passwords with **minimum 8 characters**. Signup form also validates password confirmation match.

### `column user_profiles.current_status does not exist` (or similar)

Your database was created **before** Phase 2 career tables/columns were added. `create_all` does not alter existing tables.

**Fix (automatic):** Restart the backend — startup now runs lightweight migrations that add missing columns.

```bash
# Stop uvicorn (Ctrl+C), then:
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

**Fix (manual reset — deletes career data only):**

```bash
psql nexus -c "DROP TABLE IF EXISTS user_skills, career_preferences, user_profiles, onboarding_status CASCADE;"
```

Then restart uvicorn.

### `TypeError: unsupported operand type(s) for |: 'type' and 'NoneType'`

You are on **Python 3.9**. The backend uses `Optional[...]` for SQLAlchemy/Pydantic compatibility. If you still see this after pulling latest code:

1. Stop uvicorn (`Ctrl+C`)
2. Pull/save the latest `backend/app/` files
3. Restart: `uvicorn app.main:app --reload --port 8000`

Alternatively, upgrade to **Python 3.10+** for the venv:

```bash
cd backend
rm -rf .venv
python3.11 -m venv .venv   # or python3.10
source .venv/bin/activate
pip install -r requirements.txt
```

---

## Roadmap / Next Steps

**Phase 3.3 (done):** Rule-based ATS scoring via `GET /resumes/{id}/ats` and `GET /resumes/active/ats`.

**Phase 3.3.2 (done):** Re-analyze via `POST /resumes/{id}/analyze` — downloads PDF from Supabase and re-runs the parser.

**Phase 3.4+ (not built yet):**

1. AI rewrite / recommendations (OpenAI, Gemini, Claude — not wired)

**Phase 2.2+ (not built yet):**

1. WhatsApp / LinkedIn / Gmail OAuth integrations
2. AI agents and automation execution
3. Opportunity discovery engine

**Infrastructure:**

1. **Alembic migrations** — Replace auto `create_all` with versioned schema migrations
2. **Refresh tokens** — Long-lived sessions with secure token rotation
3. **Password reset** — Email flow for forgot password
4. **Redis** — Job queues, rate limiting
5. **httpOnly cookies** — More secure token storage than localStorage
6. **E2E tests** — Playwright for auth, onboarding, and routing
7. **CI/CD** — GitHub Actions for lint, build, and deploy

---

## License

Private project. All rights reserved.

---

## Support

- Backend-specific docs: [`backend/README.md`](backend/README.md)
- Routing conventions: [`src/routes/README.md`](src/routes/README.md)
- API interactive docs: [http://localhost:8000/docs](http://localhost:8000/docs) (when backend is running)
- **Restart backend:** [Start / Restart the Backend](#start--restart-the-backend)
