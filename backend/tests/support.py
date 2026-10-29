"""Shared test doubles. No test may touch the real internet."""

from unittest.mock import patch

import httpx

from bazaar_drishti.market import live_feed


class Reply:
    status_code = 200

    def __init__(self, payload: dict) -> None:
        self._payload = payload

    def json(self) -> dict:
        return self._payload


def upstream(payload: dict | None):
    """A stand-in for httpx.AsyncClient: serves `payload`, or is down when payload is None."""

    class _Client:
        def __init__(self, *args, **kwargs) -> None:
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, *exc) -> bool:
            return False

        async def get(self, *args, **kwargs):
            if payload is None:
                raise httpx.ConnectError("upstream down")
            return Reply(payload)

    return patch.object(live_feed.httpx, "AsyncClient", _Client)
