from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import analysis_models, career_models, resume_models  # noqa: F401 — register ORM tables
from .auth import router as auth_router
from .career import router as career_router
from .parser_benchmark import router as parser_benchmark_router
from .resumes import router as resumes_router
from .config import get_frontend_origins, settings
from .database import engine
from .middleware import AuthMiddleware
from .schema_migrate import run_schema_migrations

app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_frontend_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(AuthMiddleware)

app.include_router(auth_router)
app.include_router(career_router)
app.include_router(resumes_router)
app.include_router(parser_benchmark_router)


@app.on_event("startup")
def on_startup():
    run_schema_migrations(engine)


@app.get("/health")
def health():
    return {"status": "ok"}

