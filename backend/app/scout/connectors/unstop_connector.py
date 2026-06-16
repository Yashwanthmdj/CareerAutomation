from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import List

from ...opportunity_models import OpportunityType, SourceType
from ...opportunity_schemas import OpportunityCreate
from ..base_connector import BaseConnector


class UnstopConnector(BaseConnector):
    source_name = "Unstop"

    async def collect(self) -> List[OpportunityCreate]:
        deadline = datetime.now(timezone.utc) + timedelta(days=21)
        return [
            OpportunityCreate(
                title="Full Stack Developer Intern",
                company="Startup Forge",
                source_type=SourceType.UNSTOP,
                source_name=self.source_name,
                description="Mock Unstop connector listing (Phase 4.0 safe mode).",
                apply_link="https://unstop.com/internships/scout-v40-unstop-fullstack",
                location="Bangalore",
                required_skills=["React", "Node.js", "JavaScript"],
                opportunity_type=OpportunityType.INTERNSHIP,
                deadline=deadline,
            ),
            OpportunityCreate(
                title="Data Science Hackathon",
                company="Analytics Guild",
                source_type=SourceType.UNSTOP,
                source_name=self.source_name,
                description="Mock Unstop hackathon listing from connector pipeline.",
                apply_link="https://unstop.com/competitions/scout-v40-unstop-hackathon",
                location="Online",
                required_skills=["Python", "Pandas", "Machine Learning"],
                opportunity_type=OpportunityType.HACKATHON,
                deadline=deadline,
            ),
        ]
