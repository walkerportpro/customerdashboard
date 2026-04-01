import hashlib

from models.schemas import BadCall, GongData


def _seed(customer_id: str) -> int:
    return int(hashlib.md5(customer_id.encode()).hexdigest()[:8], 16)


_BAD_CALL_SUMMARIES = [
    "Customer expressed frustration about delayed shipment tracking updates",
    "Escalation about invoice discrepancies - customer threatened to cancel",
    "Complaint about mobile app crashes during peak usage hours",
    "Negative feedback on recent tariff changes and lack of communication",
    "Customer upset about slow support response times for P1 issue",
    "Dissatisfaction with onboarding timeline and missing features",
    "Billing error discussion - customer discovered duplicate charges",
    "Customer unhappy with API reliability and downtime frequency",
]


def get_gong_data(customer_id: str) -> GongData:
    s = _seed(customer_id)
    score = round(0.2 + (s % 70) / 100, 2)

    if score >= 0.6:
        sentiment = "positive"
    elif score >= 0.4:
        sentiment = "neutral"
    else:
        sentiment = "negative"

    num_bad_calls = s % 5
    bad_calls = []
    for i in range(num_bad_calls):
        idx = (s + i * 17) % len(_BAD_CALL_SUMMARIES)
        day = 1 + ((s + i * 3) % 28)
        month = 1 + ((s + i) % 3)
        # Generate a realistic-looking (but non-functional) Gong call ID.
        # Real Gong IDs are large numeric strings. We use a deterministic
        # hash so the same customer always gets the same IDs.
        fake_numeric_id = str(abs(hash(f"{customer_id}-{i}")) % 10**16).ljust(16, "0")
        bad_calls.append(
            BadCall(
                call_id=fake_numeric_id,
                date=f"2026-{month:02d}-{day:02d}",
                summary=_BAD_CALL_SUMMARIES[idx],
                participants=["Account Manager", "Customer Success Lead", "Client VP Operations"],
                sentiment_score=round(0.1 + (s % 25) / 100, 2),
                # Mock data: leave url empty so the frontend shows the
                # "unavailable" state rather than linking to a 404.
                url="",
            )
        )

    return GongData(
        overall_sentiment=sentiment,
        sentiment_score=score,
        recent_calls=5 + (s % 20),
        bad_calls=bad_calls,
    )
