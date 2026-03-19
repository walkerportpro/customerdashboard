from fastapi import APIRouter

from models.schemas import OnboardingProject
from mock.mock_rocketlane import get_onboarding

router = APIRouter(prefix="/api/customers", tags=["rocketlane"])


@router.get("/{customer_id}/onboarding", response_model=list[OnboardingProject])
async def read_onboarding(customer_id: str):
    return get_onboarding(customer_id)
