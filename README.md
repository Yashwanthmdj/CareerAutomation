# Nexus — Autonomous Career OS

Production-grade AI SaaS frontend with JWT authentication, built as a modern full-stack starter. Nexus monitors opportunities, automates applications, and gives users a premium dashboard experience.

This README walks through **every step** to clone, configure, run, test, build, and deploy the project locally.

---

## Table of Contents

1. [What You Get](#what-you-get)
2. [Tech Stack](#tech-stack)
3. [Prerequisites](#prerequisites)
4. [Project Structure](#project-structure)
5. [Quick Start (5 Minutes)](#quick-start-5-minutes)
6. [Full Setup — Step by Step](#full-setup--step-by-step)
7. [Environment Variables](#environment-variables)
8. [Running the Application](#running-the-application)
9. [Authentication Flow](#authentication-flow)
10. [Routes & Pages](#routes--pages)
11. [API Reference](#api-reference)
12. [Development Workflow](#development-workflow)
13. [Available Scripts](#available-scripts)
14. [Architecture Overview](#architecture-overview)
15. [Manual Testing Checklist](#manual-testing-checklist)
16. [Production Build](#production-build)
17. [Deployment Notes](#deployment-notes)
18. [Troubleshooting](#troubleshooting)
19. [Roadmap / Next Steps](#roadmap--next-steps)

---

## What You Get

- **Marketing site** — Landing, features, pricing, integrations, help, waitlist
- **Auth system** — Sign up, login, JWT sessions, protected routes, logout
- **Dashboard** — Mission control, opportunities, applications, automation, resume, analytics, notifications, settings, profile
- **Premium UI** — Dark glassmorphism theme, Framer Motion animations, responsive layout
- **Backend API** — FastAPI + PostgreSQL + JWT auth (`/auth/signup`, `/auth/login`, `/auth/me`)

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
| **Python** | 3.9+ | Backend API |
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
│   ├── services/             # API layer
│   │   ├── api/              # HTTP client, token storage
│   │   └── auth/             # authService (login/signup/me)
│   ├── store/                # SessionProvider (global auth state)
│   ├── hooks/                # useAuth, use-mobile
│   ├── config/               # brand.ts, env.ts
│   ├── types/                # User, Session, auth types
│   ├── app/providers/        # AppProviders (Query + Session)
│   ├── router.tsx            # Router factory
│   ├── start.ts              # TanStack Start config
│   └── server.ts             # SSR server entry
│
└── backend/                  # FastAPI auth service
    ├── .env.example          # Backend env template
    ├── requirements.txt      # Python dependencies
    └── app/
        ├── main.py           # FastAPI app, CORS, middleware
        ├── auth.py           # Signup / login / me routes
        ├── models.py         # User SQLAlchemy model
        ├── schemas.py        # Pydantic request/response schemas
        ├── security.py       # Password hashing + JWT
        ├── middleware.py     # JWT extraction middleware
        ├── deps.py           # get_current_user dependency
        ├── database.py       # SQLAlchemy engine + session
        └── config.py           # Settings from .env
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

On first startup, SQLAlchemy automatically creates the `users` table.

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

### Step 10 — Create your first account

1. Go to **http://localhost:3000/signup** (or whatever port Vite prints)
2. Enter name, email, and password (minimum 8 characters)
3. Confirm password matches
4. Submit — you should be redirected to `/app`
5. Refresh the page — session should persist (JWT in localStorage)

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

---

## Running the Application

You need **two terminals** running simultaneously:

| Terminal | Directory | Command | URL |
| --- | --- | --- | --- |
| 1 | `backend/` | `uvicorn app.main:app --reload --port 8000` | http://localhost:8000 |
| 2 | project root | `npm run dev` | http://localhost:3000 or :5173 |

**Stop servers:** Press `Ctrl+C` in each terminal.

---

## Authentication Flow

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

### Frontend auth components

| File | Role |
| --- | --- |
| `src/store/session.tsx` | Global session state, token restore on load |
| `src/hooks/useAuth.ts` | Convenient hook for components |
| `src/services/auth/authService.ts` | API calls for sign in/up/out/me |
| `src/services/api/client.ts` | Attaches JWT to requests automatically |
| `src/components/auth/AuthGuards.tsx` | `RequireAuth` / `RequireGuest` route guards |

### Protected vs public routes

- **Protected:** All `/app/*` routes — redirects to `/login` if not authenticated
- **Guest-only:** `/login`, `/signup` — redirects to `/app` if already logged in
- **Public:** `/`, `/features`, `/pricing`, `/integrations`, `/help`, `/waitlist`

---

## Routes & Pages

### Marketing & auth

| URL | File | Description |
| --- | --- | --- |
| `/` | `src/routes/index.tsx` | Landing page |
| `/login` | `src/routes/login.tsx` | Sign in |
| `/signup` | `src/routes/signup.tsx` | Create account |
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
| `/app/profile` | `src/routes/app.profile.tsx` | User profile |

### Layout routes

- `src/routes/_site.tsx` — wraps marketing pages with shared Navbar + Footer
- `src/routes/app.tsx` — wraps dashboard pages with AppShell + `RequireAuth`
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
│  SessionProvider   React Query                               │
│       │                                                      │
│       ▼                                                      │
│  authService ──► apiClient ──► fetch + JWT header            │
└──────────────────────────┬───────────────────────────────────┘
                           │ HTTP
                           ▼
┌──────────────────────────────────────────────────────────────┐
│                     FastAPI (backend/)                       │
│  CORS ──► AuthMiddleware ──► /auth routes ──► SQLAlchemy     │
└──────────────────────────┬───────────────────────────────────┘
                           │
                           ▼
                    PostgreSQL (users table)
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
- [ ] Sign up with a new email → redirects to `/app`
- [ ] Dashboard shows your name in welcome message and sidebar
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

---

## Roadmap / Next Steps

Suggested next integrations (not yet implemented):

1. **Alembic migrations** — Replace auto `create_all` with versioned schema migrations
2. **Refresh tokens** — Long-lived sessions with secure token rotation
3. **Password reset** — Email flow for forgot password
4. **Real dashboard data** — Connect opportunities, applications, analytics to API endpoints
5. **OpenAI integration** — Resume optimization, application drafting
6. **Redis** — Session cache, rate limiting, job queues
7. **httpOnly cookies** — More secure token storage than localStorage
8. **E2E tests** — Playwright for auth and routing flows
9. **CI/CD** — GitHub Actions for lint, build, and deploy

---

## License

Private project. All rights reserved.

---

## Support

- Backend-specific docs: [`backend/README.md`](backend/README.md)
- Routing conventions: [`src/routes/README.md`](src/routes/README.md)
- API interactive docs: [http://localhost:8000/docs](http://localhost:8000/docs) (when backend is running)
# CareerAutomation
