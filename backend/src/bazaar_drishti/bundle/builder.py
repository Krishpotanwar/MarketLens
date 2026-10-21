"""Construct immutable run bundles from experiment outputs."""

from __future__ import annotations

from dataclasses import dataclass

from bazaar_drishti.research.backtest import EquityPoint
from bazaar_drishti.research.forecast import LogitContribution
from bazaar_drishti.schemas import ForecastRow, RunManifest, RunMetrics, TradeRow


@dataclass(frozen=True, slots=True)
class RunBundle:
    """Immutable bundle containing all validated artifacts for a research run."""

    manifest: RunManifest
    metrics: RunMetrics
    trades: tuple[TradeRow, ...]
    forecasts: tuple[ForecastRow, ...]
    equity_curve: tuple[EquityPoint, ...]
    contributions: tuple[LogitContribution, ...]


def build_run_bundle(
    *,
    manifest: RunManifest,
    metrics: RunMetrics,
    trades: list[TradeRow],
    forecasts: list[ForecastRow],
    equity_curve: list[EquityPoint],
    contributions: list[LogitContribution],
) -> RunBundle:
    """Assemble verified artifacts into a RunBundle."""
    return RunBundle(
        manifest=manifest,
        metrics=metrics,
        trades=tuple(trades),
        forecasts=tuple(forecasts),
        equity_curve=tuple(equity_curve),
        contributions=tuple(contributions),
    )
