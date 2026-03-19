from fastapi import APIRouter

from models.schemas import TicketSummary
from mock.mock_freshdesk import get_tickets

router = APIRouter(prefix="/api/customers", tags=["freshdesk"])


@router.get("/{customer_id}/tickets", response_model=TicketSummary)
async def read_tickets(customer_id: str):
    return get_tickets(customer_id)
