from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import analysis_models, application_models, automation_models, career_models, opportunity_models, resume_models  # noqa: F401 — register ORM tables
from . import sources  # noqa: F401 — register opportunity_sources table
from .applications import router as applications_router
from .automations import router as automations_router
from .auth import router as auth_router
from .career import router as career_router
from .opportunities import router as opportunities_router
from .parser_benchmark import router as parser_benchmark_router
from .resumes import router as resumes_router
from .automation_service import seed_automation_agents
from .scout.scout_scheduler import scout_scheduler
from .scout_routes import router as scout_router
from .source_routes import router as sources_router
from .sources.source_service import seed_opportunity_sources
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
app.include_router(opportunities_router)
app.include_router(applications_router)
app.include_router(resumes_router)
app.include_router(parser_benchmark_router)
app.include_router(scout_router)
app.include_router(sources_router)
app.include_router(automations_router)


@app.on_event("startup")
def on_startup():
    run_schema_migrations(engine)
    seed_automation_agents(engine)
    seed_opportunity_sources(engine)
    scout_scheduler.start(engine)


@app.on_event("shutdown")
async def on_shutdown():
    await scout_scheduler.stop()


@app.get("/health")
def health():
    return {"status": "ok"}

