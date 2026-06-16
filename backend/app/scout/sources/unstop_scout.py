from __future__ import annotations

from typing import List

from ...opportunity_models import OpportunityType, SourceType
from ...opportunity_schemas import OpportunityCreate
from ..base_scout import BaseScout


class UnstopScout(BaseScout):
    source_name = "Unstop"

    async def discover(self) -> List[OpportunityCreate]:
        return [
            OpportunityCreate(
                title="Full Stack Developer Intern",
                company="Startup Forge",
                source_type=SourceType.UNSTOP,
                source_name=self.source_name,
                description="Mock Unstop listing for scout foundation testing.",
                apply_link="https://unstop.com/internships/scout-mock-fullstack",
                location="Bangalore",
                required_skills=["React", "Node.js", "JavaScript"],
                opportunity_type=OpportunityType.INTERNSHIP,
            ),
            OpportunityCreate(
                title="Data Science Hackathon",
                company="Analytics Guild",
                source_type=SourceType.UNSTOP,
                source_name=self.source_name,
                description="Mock Unstop hackathon listing.",
                apply_link="https://unstop.com/competitions/scout-mock-hackathon",
                location="Online",
                required_skills=["Python", "Pandas", "Machine Learning"],
                opportunity_type=OpportunityType.HACKATHON,
            ),
        ]
