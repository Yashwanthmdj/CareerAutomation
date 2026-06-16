from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import List

from ...opportunity_models import OpportunityType, SourceType
from ...opportunity_schemas import OpportunityCreate
from ..base_connector import BaseConnector


class WellfoundConnector(BaseConnector):
    source_name = "Wellfound"

    async def collect(self) -> List[OpportunityCreate]:
        deadline = datetime.now(timezone.utc) + timedelta(days=45)
        return [
            OpportunityCreate(
                title="Junior Software Engineer",
                company="CloudNova",
                source_type=SourceType.WELLFOUND,
                source_name=self.source_name,
                description="Mock Wellfound connector listing (Phase 4.0 safe mode).",
                apply_link="https://wellfound.com/jobs/scout-v40-wellfound-junior-swe",
                location="Remote",
                required_skills=["TypeScript", "React", "Docker"],
                opportunity_type=OpportunityType.JOB,
                deadline=deadline,
            ),
            OpportunityCreate(
                title="ML Engineer Intern",
                company="Visionary AI",
                source_type=SourceType.WELLFOUND,
                source_name=self.source_name,
                description="Mock Wellfound ML internship from connector pipeline.",
                apply_link="https://wellfound.com/jobs/scout-v40-wellfound-ml-intern",
                location="San Francisco / Remote",
                required_skills=["Python", "TensorFlow", "Deep Learning"],
                opportunity_type=OpportunityType.INTERNSHIP,
                deadline=deadline,
            ),
        ]
