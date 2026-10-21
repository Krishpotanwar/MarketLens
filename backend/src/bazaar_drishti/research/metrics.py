"""Probabilistic forecast evaluation metrics."""

from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal, ROUND_HALF_UP
import math
from typing import Any

PAISE_4 = Decimal("0.0001")


def _round_4(val: Decimal) -> Decimal:
    return val.quantize(PAISE_4, rounding=ROUND_HALF_UP)


def _validate_forecasts(probabilities: list[Decimal], actuals: list[bool]) -> None:
    if not probabilities:
        raise ValueError("At least one forecast is required")
    if len(probabilities) != len(actuals):
        raise ValueError("Forecast probabilities and outcomes must have equal lengths")
    if any(not p.is_finite() or p < 0 or p > 1 for p in probabilities):
        raise ValueError("Forecast probabilities must be finite values from 0 to 1")


@dataclass(frozen=True, slots=True)
class ReliabilityBin:
    """Binned forecast calibration count and observed positive frequency."""

    bin_index: int
    bin_start: Decimal
    bin_end: Decimal
    count: int
    mean_probability: Decimal
    observed_fraction_positive: Decimal


def calculate_brier_score(probabilities: list[Decimal], actuals: list[bool]) -> Decimal:
    """Compute mean squared error of probabilistic predictions: (1/N) * sum((p - y)^2)."""
    _validate_forecasts(probabilities, actuals)

    total_sq_err = sum(
        (p - (Decimal("1.0") if y else Decimal("0.0"))) ** 2
        for p, y in zip(probabilities, actuals)
    )
    return _round_4(total_sq_err / Decimal(len(probabilities)))


def calculate_log_loss(
    probabilities: list[Decimal], actuals: list[bool], *, eps: float = 1e-15
) -> Decimal:
    """Compute cross-entropy log loss with clipping for numerical stability."""
    _validate_forecasts(probabilities, actuals)

    total_loss = 0.0
    for p_dec, y in zip(probabilities, actuals):
        p = float(p_dec)
        p = max(eps, min(1.0 - eps, p))
        target = 1.0 if y else 0.0
        total_loss += -(target * math.log(p) + (1.0 - target) * math.log(1.0 - p))

    mean_loss = Decimal(str(round(total_loss / len(probabilities), 4)))
    return _round_4(mean_loss)


def calculate_balanced_accuracy(
    probabilities: list[Decimal],
    actuals: list[bool],
    threshold: Decimal = Decimal("0.5"),
) -> Decimal | None:
    """Compute balanced classification accuracy (unweighted average of recall per class)."""
    _validate_forecasts(probabilities, actuals)
    if len(set(actuals)) < 2:
        return None

    tp = tn = fp = fn = 0
    for p, y in zip(probabilities, actuals):
        pred_pos = p >= threshold
        if y:
            if pred_pos:
                tp += 1
            else:
                fn += 1
        else:
            if pred_pos:
                fp += 1
            else:
                tn += 1

    tpr = tp / (tp + fn)
    tnr = tn / (tn + fp)
    balanced = Decimal(str(round((tpr + tnr) / 2.0, 4)))
    return _round_4(balanced)


def calculate_reliability_bins(
    probabilities: list[Decimal],
    actuals: list[bool],
    num_bins: int = 10,
    min_bin_count: int = 1,
) -> list[ReliabilityBin]:
    """Group probabilities into calibration bins."""
    if len(probabilities) != len(actuals):
        raise ValueError("Forecast probabilities and outcomes must have equal lengths")
    if not probabilities:
        return []
    _validate_forecasts(probabilities, actuals)

    bin_width = Decimal("1.0") / Decimal(num_bins)
    bins_data: list[dict[str, Any]] = [
        {"count": 0, "sum_prob": Decimal("0.0"), "positive_count": 0}
        for _ in range(num_bins)
    ]

    for p, y in zip(probabilities, actuals):
        idx = int(p / bin_width)
        if idx >= num_bins:
            idx = num_bins - 1
        bins_data[idx]["count"] += 1
        bins_data[idx]["sum_prob"] += p
        if y:
            bins_data[idx]["positive_count"] += 1

    results: list[ReliabilityBin] = []
    for i in range(num_bins):
        data = bins_data[i]
        c = data["count"]
        if c < min_bin_count:
            continue
        start = _round_4(Decimal(i) * bin_width)
        end = _round_4(Decimal(i + 1) * bin_width)
        mean_p = _round_4(data["sum_prob"] / Decimal(c))
        obs_pos = _round_4(Decimal(data["positive_count"]) / Decimal(c))
        results.append(
            ReliabilityBin(
                bin_index=i,
                bin_start=start,
                bin_end=end,
                count=c,
                mean_probability=mean_p,
                observed_fraction_positive=obs_pos,
            )
        )
    return results
