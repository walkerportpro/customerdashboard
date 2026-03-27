"""Health Model configuration API."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException

from models.health_models import HealthModel, SimulationSummary
from services import health_model_store
from services.health_engine import simulate
from mock.mock_customers import get_customers
from mock.mock_gainsight import get_gainsight_metrics
from mock.mock_gong import get_gong_data
from mock.mock_salesforce import get_load_volumes
from mock.mock_freshdesk import get_tickets
from mock.mock_rocketlane import get_onboarding

router = APIRouter(prefix="/api/health-model", tags=["health-model"])


# ---------------------------------------------------------------------------
# Model CRUD
# ---------------------------------------------------------------------------

@router.get("", response_model=HealthModel)
async def get_published_model():
    """Return the currently published health model."""
    return health_model_store.get_published_model()


@router.get("/draft", response_model=HealthModel)
async def get_draft_model():
    """Return the current draft health model."""
    return health_model_store.get_draft_model()


@router.put("/draft", response_model=HealthModel)
async def save_draft(model: HealthModel):
    """Save changes to the draft health model."""
    return health_model_store.save_draft(model)


@router.post("/publish", response_model=HealthModel)
async def publish_draft(user: str = "admin", note: str = ""):
    """Publish the current draft as the new active model."""
    return health_model_store.publish_draft(user=user, note=note)


# ---------------------------------------------------------------------------
# Version history
# ---------------------------------------------------------------------------

@router.get("/versions")
async def get_versions():
    """Return all published versions of the health model."""
    history = health_model_store.get_version_history()
    return [
        {
            "version": m.version,
            "name": m.name,
            "published_at": m.published_at,
            "published_by": m.published_by,
            "component_count": len(m.components),
        }
        for m in history
    ]


@router.post("/rollback/{version}", response_model=HealthModel)
async def rollback(version: int):
    """Rollback the draft to a previous published version."""
    try:
        return health_model_store.rollback_to_version(version)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


# ---------------------------------------------------------------------------
# Presets
# ---------------------------------------------------------------------------

@router.get("/presets")
async def list_presets():
    """List all available preset templates."""
    presets = health_model_store.list_presets()
    return [
        {
            "id": p.id,
            "name": p.name,
            "description": p.description,
            "component_count": len(p.components),
            "weights": {c.id: c.sensitivity.weight for c in p.components},
        }
        for p in presets
    ]


@router.post("/presets/{preset_id}/apply", response_model=HealthModel)
async def apply_preset(preset_id: str):
    """Apply a preset template as the current draft."""
    try:
        return health_model_store.apply_preset(preset_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


# ---------------------------------------------------------------------------
# Simulation
# ---------------------------------------------------------------------------

def _data_fetcher(customer_id: str):
    """Fetch all integration data for a customer (mock)."""
    gs = get_gainsight_metrics(customer_id)
    gong_d = get_gong_data(customer_id)
    tix = get_tickets(customer_id)
    onb = get_onboarding(customer_id)
    vol = get_load_volumes(customer_id)
    return gs, gong_d, tix, onb, vol


@router.post("/simulate", response_model=SimulationSummary)
async def run_simulation():
    """Run the draft model against all customers and compare to published."""
    customers = get_customers()
    published = health_model_store.get_published_model()
    draft = health_model_store.get_draft_model()
    summary = simulate(draft, published, customers, _data_fetcher)
    return summary
