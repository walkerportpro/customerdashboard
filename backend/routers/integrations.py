"""API for managing integration credentials."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from services import integration_store

router = APIRouter(prefix="/api/integrations", tags=["integrations"])


class ConnectRequest(BaseModel):
    credentials: dict[str, str]


class IntegrationStatus(BaseModel):
    id: str
    connected: bool


@router.post("/{integration_id}/connect")
async def connect_integration(integration_id: str, body: ConnectRequest):
    if not body.credentials:
        raise HTTPException(400, "No credentials provided")
    integration_store.save_credentials(integration_id, body.credentials)
    return {"status": "connected", "integration": integration_id}


@router.delete("/{integration_id}/disconnect")
async def disconnect_integration(integration_id: str):
    if not integration_store.delete_credentials(integration_id):
        raise HTTPException(404, "Integration not connected")
    return {"status": "disconnected", "integration": integration_id}


@router.get("/status", response_model=list[IntegrationStatus])
async def integration_status():
    all_ids = ["stripe", "slack", "gmail", "salesforce", "gainsight", "gong", "rocketlane", "freshdesk"]
    return [
        IntegrationStatus(id=iid, connected=integration_store.is_connected(iid))
        for iid in all_ids
    ]
