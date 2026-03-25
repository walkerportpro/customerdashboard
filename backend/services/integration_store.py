"""In-memory credential store for integration API keys.

Credentials are kept in server memory so they never leak to the frontend
after being submitted.  In production this would be backed by an encrypted
vault or database – for now memory is fine.
"""

from __future__ import annotations

from typing import Any

_credentials: dict[str, dict[str, str]] = {}


def save_credentials(integration_id: str, creds: dict[str, str]) -> None:
    _credentials[integration_id] = creds


def get_credentials(integration_id: str) -> dict[str, str] | None:
    return _credentials.get(integration_id)


def delete_credentials(integration_id: str) -> bool:
    return _credentials.pop(integration_id, None) is not None


def list_connected() -> list[str]:
    return list(_credentials.keys())


def is_connected(integration_id: str) -> bool:
    return integration_id in _credentials
