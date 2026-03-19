import hashlib
import math

from models.schemas import VolumeDataPoint, VolumeTrend


def _seed(customer_id: str, salt: str = "") -> int:
    return int(hashlib.md5((customer_id + salt).encode()).hexdigest()[:8], 16)


def _generate_trend(data: list[VolumeDataPoint]) -> VolumeTrend:
    values = [d.value for d in data]
    recent = sum(values[-3:]) / 3
    previous = sum(values[-6:-3]) / 3
    if previous == 0:
        change_pct = 0.0
        trend = "flat"
    else:
        change_pct = round(((recent - previous) / previous) * 100, 1)
        if change_pct > 2:
            trend = "up"
        elif change_pct < -2:
            trend = "down"
        else:
            trend = "flat"
    return VolumeTrend(data=data, trend=trend, change_pct=change_pct)


def _make_monthly_data(customer_id: str, salt: str, base: float) -> list[VolumeDataPoint]:
    s = _seed(customer_id, salt)
    points = []
    for month_offset in range(12):
        month_num = (3 + month_offset) % 12 + 1  # Start from Apr 2025
        year = 2025 if month_num >= 4 else 2026
        noise = ((s * (month_offset + 1) * 7) % 200 - 100) / 100.0
        seasonal = math.sin(month_offset / 12 * 2 * math.pi) * base * 0.1
        growth = month_offset * base * 0.015 * (1 if s % 2 == 0 else -0.5)
        value = max(0, round(base + seasonal + growth + noise * base * 0.05, 0))
        points.append(VolumeDataPoint(date=f"{year}-{month_num:02d}", value=value))
    return points


def get_load_volumes(customer_id: str) -> VolumeTrend:
    s = _seed(customer_id, "load")
    base = 500 + (s % 4500)
    data = _make_monthly_data(customer_id, "load", base)
    return _generate_trend(data)


def get_invoicing_volumes(customer_id: str) -> VolumeTrend:
    s = _seed(customer_id, "invoice")
    base = 200 + (s % 3000)
    data = _make_monthly_data(customer_id, "invoice", base)
    return _generate_trend(data)
