from __future__ import annotations

from typing import List

from ...opportunity_models import OpportunityType, SourceType
from ...opportunity_schemas import OpportunityCreate
from ..base_scout import BaseScout


class WellfoundScout(BaseScout):
    source_name = "Wellfound"

    async def discover(self) -> List[OpportunityCreate]:
        return [
            OpportunityCreate(
                title="Junior Software Engineer",
                company="CloudNova",
                source_type=SourceType.WELLFOUND,
                source_name=self.source_name,
                description="Mock Wellfound job listing for scout foundation testing.",
                apply_link="https://wellfound.com/jobs/scout-mock-junior-swe",
                location="Remote",
                required_skills=["TypeScript", "React", "Docker"],
                opportunity_type=OpportunityType.JOB,
            ),
            OpportunityCreate(
                title="ML Engineer Intern",
                company="Visionary AI",
                source_type=SourceType.WELLFOUND,
                source_name=self.source_name,
                description="Mock Wellfound ML internship listing.",
                apply_link="https://wellfound.com/jobs/scout-mock-ml-intern",
                location="San Francisco / Remote",
                required_skills=["Python", "TensorFlow", "Deep Learning"],
                opportunity_type=OpportunityType.INTERNSHIP,
            ),
        ]
