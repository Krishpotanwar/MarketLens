"""Rights-gated acquisition protocol and retry policy."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date
import hashlib
import time
from typing import Any, Callable, Protocol


class RightsGateBlockedError(PermissionError):
    """Raised when real-market data is requested without required rights approvals."""


@dataclass(frozen=True, slots=True)
class RightsGate:
    """Enforces market data and publication rights gates."""

    api_access_approved: bool = False
    academic_research_approved: bool = False
    storage_approved: bool = False
    derived_output_approved: bool = False
    public_display_approved: bool = False
    export_approved: bool = False
    license_reference: str | None = None
    attribution: str | None = None
    qualified_review_reference: str | None = None

    def __post_init__(self) -> None:
        for field in (
            "api_access_approved",
            "academic_research_approved",
            "storage_approved",
            "derived_output_approved",
            "public_display_approved",
            "export_approved",
        ):
            if type(getattr(self, field)) is not bool:
                raise ValueError(f"{field} must be a boolean")
        for field in (
            "license_reference",
            "attribution",
            "qualified_review_reference",
        ):
            value = getattr(self, field)
            if value is not None and not isinstance(value, str):
                raise ValueError(f"{field} must be a string or None")

    def enforce(self, *, synthetic: bool) -> bool:
        """Validate API, research, storage, and license rights before real acquisition."""
        if synthetic:
            return True
        missing = [
            name
            for name, approved in (
                ("api_access_approved", self.api_access_approved),
                ("academic_research_approved", self.academic_research_approved),
                ("storage_approved", self.storage_approved),
            )
            if not approved
        ]
        if not self.license_reference or not self.license_reference.strip():
            missing.append("license_reference")
        if missing:
            raise RightsGateBlockedError(
                "Real market data acquisition blocked; missing approvals/evidence: "
                + ", ".join(missing)
            )
        return True

    def enforce_publication(self, *, synthetic: bool) -> bool:
        """Validate derived-output, display, export, attribution, and review rights."""
        self.enforce(synthetic=synthetic)
        if synthetic:
            return True
        missing = [
            name
            for name, approved in (
                ("derived_output_approved", self.derived_output_approved),
                ("public_display_approved", self.public_display_approved),
                ("export_approved", self.export_approved),
            )
            if not approved
        ]
        for name, reference in (
            ("attribution", self.attribution),
            ("qualified_review_reference", self.qualified_review_reference),
        ):
            if not reference or not reference.strip():
                missing.append(name)
        if missing:
            raise RightsGateBlockedError(
                "Real market data publication blocked; missing approvals/evidence: "
                + ", ".join(missing)
            )
        return True


@dataclass(frozen=True, slots=True)
class FetchResult:
    """Immutable result of a provider fetch."""

    raw_bytes: bytes
    raw_sha256: str


@dataclass(frozen=True, slots=True)
class RetryPolicy:
    """Bounded exponential backoff retry policy for provider adapters."""

    max_retries: int = 3
    backoff_base_seconds: float = 0.5
    backoff_factor: float = 2.0

    def execute(self, func: Callable[[], bytes]) -> FetchResult:
        """Execute callable with bounded retries and compute SHA-256."""
        last_error: Exception | None = None
        for attempt in range(self.max_retries):
            try:
                raw_bytes = func()
                sha = hashlib.sha256(raw_bytes).hexdigest()
                return FetchResult(raw_bytes=raw_bytes, raw_sha256=sha)
            except (TimeoutError, ConnectionError) as exc:
                last_error = exc
                if attempt < self.max_retries - 1:
                    sleep_time = self.backoff_base_seconds * (
                        self.backoff_factor**attempt
                    )
                    time.sleep(sleep_time)

        if last_error is not None:
            raise last_error
        raise RuntimeError("Retry policy reached unexpected empty state")


class ProviderAdapter(Protocol):
    """Interface for documented market data providers."""

    def fetch_bars(
        self, symbol: str, start_date: date, end_date: date
    ) -> tuple[FetchResult, list[dict[str, Any]]]:
        """Fetch raw response and parsed bar dicts for symbol and date range."""
        ...
