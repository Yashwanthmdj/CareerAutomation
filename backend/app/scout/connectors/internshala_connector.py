from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import List

from ...opportunity_models import OpportunityType, SourceType
from ...opportunity_schemas import OpportunityCreate
from ..base_connector import BaseConnector


class InternshalaConnector(BaseConnector):
    source_name = "Internshala"

    async def collect(self) -> List[OpportunityCreate]:
        deadline = datetime.now(timezone.utc) + timedelta(days=30)
        return [
            OpportunityCreate(
                title="AI Engineer Intern",
                company="Sample Company",
                source_type=SourceType.INTERNSHALA,
                source_name=self.source_name,
                description="Mock Internshala connector listing (Phase 4.0 safe mode).",
                apply_link="https://internshala.com/internship/detail/scout-v40-internshala-ai",
                location="Remote",
                required_skills=["Python", "Machine Learning"],
                opportunity_type=OpportunityType.INTERNSHIP,
                deadline=deadline,
            ),
            OpportunityCreate(
                title="Backend Developer Intern",
                company="Nexus Labs",
                source_type=SourceType.INTERNSHALA,
                source_name=self.source_name,
                description="Mock Internshala backend internship from connector pipeline.",
                apply_link="https://internshala.com/internship/detail/scout-v40-internshala-backend",
                location="Hyderabad",
                required_skills=["Python", "FastAPI", "PostgreSQL"],
                opportunity_type=OpportunityType.INTERNSHIP,
                deadline=deadline,
            ),
        ]
