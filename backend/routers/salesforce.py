from fastapi import APIRouter

from models.schemas import VolumeTrend
from mock.mock_salesforce import get_invoicing_volumes, get_load_volumes

router = APIRouter(prefix="/api/customers", tags=["salesforce"])


@router.get("/{customer_id}/load-volumes", response_model=VolumeTrend)
async def read_load_volumes(customer_id: str):
    return get_load_volumes(customer_id)


@router.get("/{customer_id}/invoicing-volumes", response_model=VolumeTrend)
async def read_invoicing_volumes(customer_id: str):
    return get_invoicing_volumes(customer_id)
