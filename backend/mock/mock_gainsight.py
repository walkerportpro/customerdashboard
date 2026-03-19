import hashlib

from models.schemas import GainsightMetrics


_MOCK_DATA: dict[str, GainsightMetrics] = {}


def _seed(customer_id: str) -> int:
    return int(hashlib.md5(customer_id.encode()).hexdigest()[:8], 16)


def get_gainsight_metrics(customer_id: str) -> GainsightMetrics:
    if customer_id not in _MOCK_DATA:
        s = _seed(customer_id)
        _MOCK_DATA[customer_id] = GainsightMetrics(
            health_score=40 + (s % 55),
            mobile_app_usage_pct=round(10 + (s % 80) + (s % 7) * 0.5, 1),
            tariffs_automation_pct=round(5 + (s % 85) + (s % 11) * 0.3, 1),
        )
    return _MOCK_DATA[customer_id]
