import hashlib

from models.schemas import Ticket, TicketSummary


def _seed(customer_id: str) -> int:
    return int(hashlib.md5(customer_id.encode()).hexdigest()[:8], 16)


_SUBJECTS = [
    "API gateway returning 502 errors intermittently",
    "Dashboard loading slowly for large datasets",
    "Mobile app push notifications not working",
    "Invoice PDF generation fails for multi-currency",
    "SSO login broken after latest update",
    "Tariff calculation incorrect for EU shipments",
    "Tracking page showing stale data",
    "Bulk import timing out for files over 10MB",
    "Report export missing columns",
    "Webhook delivery failures to customer endpoint",
    "Rate limiting too aggressive on search API",
    "Custom field mapping lost after sync",
    "Email notifications delayed by 2+ hours",
    "User permissions not inherited from parent org",
    "Data discrepancy between dashboard and API",
]

_STATUSES = ["Open", "In Progress", "Waiting on Customer", "Escalated"]
_PRIORITIES = ["P1", "P2", "P3", "P4", "P5"]


def get_tickets(customer_id: str) -> TicketSummary:
    s = _seed(customer_id)
    num_tickets = 3 + (s % 10)
    tickets = []

    for i in range(num_tickets):
        ts = (s + i * 23) % 1000
        pri_idx = min(ts % 5, 4)
        # Weight towards P2/P3
        if pri_idx == 0 and ts % 3 != 0:
            pri_idx = 1
        status_idx = (ts + i * 7) % len(_STATUSES)
        subject_idx = (ts + i * 11) % len(_SUBJECTS)
        day = 1 + (ts % 28)
        month = 1 + ((ts + i) % 3)

        tickets.append(
            Ticket(
                id=f"FD-{10000 + s % 90000 + i}",
                subject=_SUBJECTS[subject_idx],
                status=_STATUSES[status_idx],
                priority=_PRIORITIES[pri_idx],
                created_at=f"2026-{month:02d}-{day:02d}",
                updated_at=f"2026-03-{1 + (day % 19):02d}",
            )
        )

    by_priority: dict[str, int] = {}
    for t in tickets:
        by_priority[t.priority] = by_priority.get(t.priority, 0) + 1

    return TicketSummary(
        total_open=len(tickets),
        by_priority=by_priority,
        tickets=sorted(tickets, key=lambda t: t.priority),
    )
