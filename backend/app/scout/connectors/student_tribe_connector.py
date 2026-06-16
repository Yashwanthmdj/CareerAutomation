from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import List

from ...opportunity_models import OpportunityType, SourceType
from ...opportunity_schemas import OpportunityCreate
from ..base_connector import BaseConnector


class StudentTribeConnector(BaseConnector):
    source_name = "Student Tribe"

    async def collect(self) -> List[OpportunityCreate]:
        deadline = datetime.now(timezone.utc) + timedelta(days=28)
        return [
            OpportunityCreate(
                title="Campus Ambassador Program",
                company="EduSpark",
                source_type=SourceType.STUDENT_TRIBE,
                source_name=self.source_name,
                description="Mock Student Tribe connector listing (Phase 4.0 safe mode).",
                apply_link="https://studenttribe.com/opportunities/scout-v40-ambassador",
                location="Pan India",
                required_skills=["Communication", "Leadership", "Marketing"],
                opportunity_type=OpportunityType.INTERNSHIP,
                deadline=deadline,
            ),
            OpportunityCreate(
                title="Product Design Fellowship",
                company="Design Collective",
                source_type=SourceType.STUDENT_TRIBE,
                source_name=self.source_name,
                description="Mock Student Tribe design fellowship from connector pipeline.",
                apply_link="https://studenttribe.com/opportunities/scout-v40-design-fellow",
                location="Hybrid",
                required_skills=["Figma", "UI Design", "Prototyping"],
                opportunity_type=OpportunityType.COMPETITION,
                deadline=deadline,
            ),
        ]
