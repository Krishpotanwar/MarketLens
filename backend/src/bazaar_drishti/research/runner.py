"""Run the real research pipeline on the shipped synthetic fixture and bundle the result.

The public demo must show what the engine computes, never typed-in numbers.
"""

from __future__ import annotations

import csv
import hashlib
import io
import os
import subprocess
from dataclasses import asdict
from datetime import datetime, timezone
from decimal import Decimal
from pathlib import Path

from bazaar_drishti.bundle.builder import RunBundle, build_run_bundle
from bazaar_drishti.data.normalizer import normalize_and_validate_bars
from bazaar_drishti.research.backtest import SimulationConfig, simulate_sma_strategy
from bazaar_drishti.research.baselines import (
    simulate_buy_and_hold_baseline,
    simulate_cash_baseline,
)
from bazaar_drishti.research.costs import FeeSchedule
from bazaar_drishti.research.forecast import (
    FeatureConfig,
    evaluate_chronological_forecast,
    fingerprint,
)
from bazaar_drishti.schemas import IST, RunManifest, RunMetrics

# backend/src/bazaar_drishti/research/runner.py -> repository root is parents[4]
FIXTURE_DIR = Path(__file__).resolve().parents[4] / "data" / "fixtures" / "synthetic"


def _code_revision() -> str:
    """Deployed commit (Render/CI env) or local git HEAD; "unknown" beats an invented value."""
    env = os.getenv("RENDER_GIT_COMMIT") or os.getenv("GIT_SHA")
    if env:
        return env[:12]
    try:
        out = subprocess.run(
            ["git", "rev-parse", "--short=12", "HEAD"],
            cwd=Path(__file__).parent,
            capture_output=True,
            text=True,
            timeout=3,
        )
    except (OSError, subprocess.SubprocessError):
        return "unknown"
    return out.stdout.strip() or "unknown" if out.returncode == 0 else "unknown"


def run_synthetic_study(run_id: str = "run-synthetic-001") -> RunBundle:
    """Normalize the fixture, simulate, forecast, and assemble a fingerprinted bundle."""
    bars_bytes = (FIXTURE_DIR / "bars.csv").read_bytes()
    raw = [
        {
            "symbol": "SYNTH",
            "timestamp_utc": row["bar_start_utc"],
            "open": row["open"],
            "high": row["high"],
            "low": row["low"],
            "close": row["close"],
            "volume": int(row["volume"]),
        }
        for row in csv.DictReader(io.StringIO(bars_bytes.decode()))
    ]
    bars = normalize_and_validate_bars(raw)
    sim, fees, features = SimulationConfig(), FeeSchedule(), FeatureConfig()
    bars_sha = hashlib.sha256(bars_bytes).hexdigest()
    config_sha = fingerprint(
        {"simulation": asdict(sim), "fees": asdict(fees), "features": asdict(features)}
    )

    result = simulate_sma_strategy(bars, sim, fees, run_id=run_id)
    buy_hold = simulate_buy_and_hold_baseline(bars, sim, fees)
    cash = simulate_cash_baseline(bars, sim.starting_capital_inr)
    forecast = evaluate_chronological_forecast(
        bars, features, run_id=run_id, bars_sha256=bars_sha, config_sha256=config_sha
    )

    def total(field: str) -> Decimal:
        return sum((getattr(t, field) for t in result.trades), Decimal("0.00"))

    metrics = RunMetrics(
        run_id=run_id,
        gross_pnl_inr=result.gross_pnl_inr,
        brokerage_inr=total("brokerage_inr"),
        exchange_charges_inr=total("exchange_charges_inr"),
        sebi_charges_inr=total("sebi_charges_inr"),
        stt_inr=total("stt_inr"),
        stamp_duty_inr=total("stamp_duty_inr"),
        gst_inr=total("gst_inr"),
        slippage_inr=result.slippage_inr,
        net_pnl_inr=result.net_pnl_inr,
        return_percent=result.return_percent,
        cash_baseline_net_pnl_inr=cash.net_pnl_inr,
        buy_hold_baseline_net_pnl_inr=buy_hold.net_pnl_inr,
        max_drawdown_percent=result.max_drawdown_percent,
        trade_count=len(result.trades),
        session_count=len({b.session_date_ist for b in bars}),
        brier_score=forecast.brier_score,
        log_loss=forecast.log_loss,
        balanced_accuracy=forecast.balanced_accuracy,
        forecast_count=len(forecast.forecast_rows),
    )
    now = datetime.now(timezone.utc)
    manifest = RunManifest(
        run_id=run_id,
        synthetic=True,
        data_label="synthetic",
        source_label="deterministic local fixture",
        bars_sha256=bars_sha,
        config_sha256=config_sha,
        code_revision=_code_revision(),
        created_at_utc=now,
        created_at_ist=now.astimezone(IST),
        data_start_utc=bars[0].bar_start_utc,
        data_start_ist=bars[0].bar_start_ist,
        data_end_utc=bars[-1].bar_end_utc,
        data_end_ist=bars[-1].bar_end_ist,
    )
    return build_run_bundle(
        manifest=manifest,
        metrics=metrics,
        trades=result.trades,
        forecasts=forecast.forecast_rows,
        equity_curve=result.equity_curve,
        contributions=forecast.contributions,
    )
