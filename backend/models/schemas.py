from __future__ import annotations

from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel


class Customer(BaseModel):
    id: str
    name: str
    industry: str
    health_score: int
    account_manager: str


class VolumeDataPoint(BaseModel):
    date: str  # YYYY-MM
    value: float


class VolumeTrend(BaseModel):
    data: list[VolumeDataPoint]
    trend: Literal["up", "down", "flat"]
    change_pct: float


class GainsightMetrics(BaseModel):
    health_score: int
    mobile_app_usage_pct: float
    tariffs_automation_pct: float


class BadCall(BaseModel):
    call_id: str
    date: str
    summary: str
    participants: list[str]
    sentiment_score: float
    url: str = ""


class GongData(BaseModel):
    overall_sentiment: Literal["positive", "neutral", "negative"]
    sentiment_score: float
    recent_calls: int
    bad_calls: list[BadCall]


class OnboardingProject(BaseModel):
    project_name: str
    status: str
    phase: str
    percent_complete: int
    due_date: str


class Ticket(BaseModel):
    id: str
    subject: str
    status: str
    priority: str
    created_at: str
    updated_at: str


class TicketSummary(BaseModel):
    total_open: int
    by_priority: dict[str, int]
    tickets: list[Ticket]
