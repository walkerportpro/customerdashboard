from fastapi import APIRouter

from models.schemas import GongData
from mock.mock_gong import get_gong_data

router = APIRouter(prefix="/api/customers", tags=["gong"])


@router.get("/{customer_id}/gong", response_model=GongData)
async def read_gong(customer_id: str):
    return get_gong_data(customer_id)
