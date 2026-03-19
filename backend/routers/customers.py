from fastapi import APIRouter, HTTPException, Query

from models.schemas import Customer
from mock.mock_customers import get_customer, get_customers

router = APIRouter(prefix="/api/customers", tags=["customers"])


@router.get("", response_model=list[Customer])
async def list_customers(search: str | None = Query(None)):
    return get_customers(search)


@router.get("/{customer_id}", response_model=Customer)
async def read_customer(customer_id: str):
    customer = get_customer(customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer
