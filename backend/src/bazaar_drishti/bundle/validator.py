"""Validate integrity, arithmetic reconciliation, and rights of a RunBundle."""

from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal

from bazaar_drishti.bundle.builder import RunBundle


class BundleValidationError(ValueError):
    """Raised when bundle fails validation checks."""


@dataclass(frozen=True, slots=True)
class ValidationReport:
    """Validation outcome report."""

    is_valid: bool
    errors: list[str]


def validate_run_bundle(bundle: RunBundle) -> ValidationReport:
    """Run all invariant, reconciliation, and provenance checks on the bundle."""
    errors: list[str] = []
    run_id = bundle.manifest.run_id

    # Check ID matching
    if bundle.metrics.run_id != run_id:
        errors.append(
            f"Metrics run_id ({bundle.metrics.run_id}) != manifest run_id ({run_id})"
        )

    for t in bundle.trades:
        if t.run_id != run_id:
            errors.append(
                f"Trade {t.trade_id} run_id ({t.run_id}) != manifest run_id ({run_id})"
            )

    for f in bundle.forecasts:
        if f.run_id != run_id:
            errors.append(
                f"Forecast {f.forecast_id} run_id ({f.run_id}) != manifest run_id ({run_id})"
            )

    # Metrics arithmetic reconciliation
    m = bundle.metrics
    itemized = (
        m.brokerage_inr
        + m.exchange_charges_inr
        + m.sebi_charges_inr
        + m.stt_inr
        + m.stamp_duty_inr
        + m.gst_inr
    )
    expected_net = m.gross_pnl_inr - itemized - m.slippage_inr
    if m.net_pnl_inr != expected_net:
        errors.append(
            f"Metrics Net PnL mismatch: stated={m.net_pnl_inr}, computed={expected_net}"
        )

    # Reconcile every trade aggregate and count against the published ledger.
    trade_totals = {
        field: Decimal("0.00")
        for field in (
            "gross_pnl_inr",
            "brokerage_inr",
            "exchange_charges_inr",
            "sebi_charges_inr",
            "stt_inr",
            "stamp_duty_inr",
            "gst_inr",
            "slippage_inr",
            "net_pnl_inr",
        )
    }
    for t in bundle.trades:
        t_itemized = (
            t.brokerage_inr
            + t.exchange_charges_inr
            + t.sebi_charges_inr
            + t.stt_inr
            + t.stamp_duty_inr
            + t.gst_inr
        )
        t_net = t.gross_pnl_inr - t_itemized - t.slippage_inr
        if t.net_pnl_inr != t_net:
            errors.append(
                f"Trade {t.trade_id} Net PnL mismatch: {t.net_pnl_inr} != {t_net}"
            )
        for field in trade_totals:
            trade_totals[field] += getattr(t, field)

    for field, ledger_total in trade_totals.items():
        if getattr(m, field) != ledger_total:
            errors.append(
                f"Metrics {field} ({getattr(m, field)}) does not equal trade ledger total ({ledger_total})"
            )
    if m.trade_count != len(bundle.trades):
        errors.append(
            f"Metrics trade_count ({m.trade_count}) != trade row count ({len(bundle.trades)})"
        )
    if m.forecast_count != len(bundle.forecasts):
        errors.append(
            f"Metrics forecast_count ({m.forecast_count}) != forecast row count ({len(bundle.forecasts)})"
        )
    if any(f.evaluation_split != "test" for f in bundle.forecasts):
        errors.append("Only final test-split forecasts may be included in a run bundle")

    # Synthetic label consistency
    if not bundle.manifest.synthetic:
        errors.append(
            "Real-data publication is disabled until the manifest carries verifiable C1 rights and review evidence"
        )

    if errors:
        raise BundleValidationError(f"Bundle validation failed: {'; '.join(errors)}")

    return ValidationReport(is_valid=True, errors=[])
