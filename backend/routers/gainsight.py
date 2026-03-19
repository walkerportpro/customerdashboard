from fastapi import APIRouter

from models.schemas import GainsightMetrics
from mock.mock_gainsight import get_gainsight_metrics

router = APIRouter(prefix="/api/customers", tags=["gainsight"])


@router.get("/{customer_id}/gainsight", response_model=GainsightMetrics)
async def read_gainsight(customer_id: str):
    return get_gainsight_metrics(customer_id)
