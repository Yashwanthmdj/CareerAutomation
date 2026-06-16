from __future__ import annotations

from typing import List

from ...opportunity_models import OpportunityType, SourceType
from ...opportunity_schemas import OpportunityCreate
from ..base_scout import BaseScout


class InternshalaScout(BaseScout):
    source_name = "Internshala"

    async def discover(self) -> List[OpportunityCreate]:
        return [
            OpportunityCreate(
                title="AI Engineer Intern",
                company="Sample Company",
                source_type=SourceType.INTERNSHALA,
                source_name=self.source_name,
                description="Mock Internshala listing for scout foundation testing.",
                apply_link="https://internshala.com/internship/detail/scout-mock-ai-engineer",
                location="Remote",
                required_skills=["Python", "Machine Learning"],
                opportunity_type=OpportunityType.INTERNSHIP,
            ),
            OpportunityCreate(
                title="Backend Developer Intern",
                company="Nexus Labs",
                source_type=SourceType.INTERNSHALA,
                source_name=self.source_name,
                description="Mock Internshala backend internship listing.",
                apply_link="https://internshala.com/internship/detail/scout-mock-backend",
                location="Hyderabad",
                required_skills=["Python", "FastAPI", "PostgreSQL"],
                opportunity_type=OpportunityType.INTERNSHIP,
            ),
        ]
