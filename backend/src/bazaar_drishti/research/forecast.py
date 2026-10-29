"""Separate chronological forecast evaluation and logit contributions."""

from __future__ import annotations

from dataclasses import asdict, dataclass
from datetime import date
from decimal import Decimal, ROUND_HALF_UP
import hashlib
import json
import math
from zoneinfo import ZoneInfo

from bazaar_drishti.data.normalizer import INTERVAL, NormalizedBar
from bazaar_drishti.research.metrics import (
    ReliabilityBin,
    calculate_balanced_accuracy,
    calculate_brier_score,
    calculate_log_loss,
    calculate_reliability_bins,
)
from bazaar_drishti.schemas import ForecastRow

IST = ZoneInfo("Asia/Kolkata")
PAISE_4 = Decimal("0.0001")


def _round_4(val: Decimal) -> Decimal:
    return val.quantize(PAISE_4, rounding=ROUND_HALF_UP)


def fingerprint(obj: object) -> str:
    """SHA-256 of canonical JSON: the one way bars, configs and fitted models are fingerprinted."""
    blob = json.dumps(obj, sort_keys=True, separators=(",", ":"), default=str)
    return hashlib.sha256(blob.encode()).hexdigest()


@dataclass(frozen=True, slots=True)
class FeatureConfig:
    """Parameters for causal feature computation and forecast horizon."""

    horizon_bars: int = 6  # 30 minutes forward
    sma_fast: int = 20
    sma_slow: int = 50
    volatility_window: int = 20


@dataclass(frozen=True, slots=True)
class LogitContribution:
    """Additive feature contribution decomposition for a single forecast logit."""

    forecast_id: str
    intercept: float
    feature_contributions: dict[str, float]
    total_logit: float


@dataclass(frozen=True, slots=True)
class _Sample:
    bar: NormalizedBar
    target_bar: NormalizedBar
    features: list[float]
    target: int


@dataclass(frozen=True, slots=True)
class ForecastEvaluation:
    """Full chronological forecast evaluation results and calibration."""

    run_id: str
    forecast_rows: list[ForecastRow]
    contributions: list[LogitContribution]
    brier_score: Decimal | None
    log_loss: Decimal | None
    balanced_accuracy: Decimal | None
    base_rate_probability: Decimal | None
    reliability_bins: list[ReliabilityBin]
    test_positive_count: int
    test_negative_count: int


def compute_causal_features(
    bars: list[NormalizedBar], config: FeatureConfig = FeatureConfig()
) -> list[dict[str, float]]:
    """Compute strictly causal features for each bar without lookahead bias."""
    features: list[dict[str, float]] = []
    closes = [float(b.close) for b in bars]

    for i in range(len(bars)):
        c = closes[i]

        # Trailing returns
        ret_1 = (c - closes[i - 1]) / closes[i - 1] if i >= 1 else 0.0
        ret_3 = (c - closes[i - 3]) / closes[i - 3] if i >= 3 else 0.0
        ret_6 = (c - closes[i - 6]) / closes[i - 6] if i >= 6 else 0.0

        # SMAs
        sma20 = (
            sum(closes[i + 1 - config.sma_fast : i + 1]) / config.sma_fast
            if i + 1 >= config.sma_fast
            else c
        )
        sma50 = (
            sum(closes[i + 1 - config.sma_slow : i + 1]) / config.sma_slow
            if i + 1 >= config.sma_slow
            else c
        )

        dist_sma20 = (c - sma20) / sma20 if sma20 > 0 else 0.0
        dist_sma50 = (c - sma50) / sma50 if sma50 > 0 else 0.0

        # Realized volatility over trailing 20 bars
        if i >= 2:
            window_ret = [
                (closes[j] - closes[j - 1]) / closes[j - 1]
                for j in range(max(1, i + 1 - config.volatility_window), i + 1)
            ]
            mean_ret = sum(window_ret) / len(window_ret)
            variance = sum((r - mean_ret) ** 2 for r in window_ret) / len(window_ret)
            vol_20 = math.sqrt(variance)
        else:
            vol_20 = 0.0

        features.append(
            {
                "ret_1": ret_1,
                "ret_3": ret_3,
                "ret_6": ret_6,
                "dist_sma20": dist_sma20,
                "dist_sma50": dist_sma50,
                "vol_20": vol_20,
            }
        )
    return features


def _sigmoid(z: float) -> float:
    z_clipped = max(-35.0, min(35.0, z))
    return 1.0 / (1.0 + math.exp(-z_clipped))


def _fit_logistic_regression(
    x_train: list[list[float]], y_train: list[int], epochs: int = 150, lr: float = 0.1
) -> tuple[float, list[float]]:
    """Fit a deterministic binary logistic regression with gradient descent."""
    num_features = len(x_train[0]) if x_train else 0
    n = len(x_train)
    if n == 0 or num_features == 0:
        return 0.0, [0.0] * num_features

    weights = [0.0] * num_features
    bias = 0.0

    for _ in range(epochs):
        grad_w = [0.0] * num_features
        grad_b = 0.0
        for i in range(n):
            xi = x_train[i]
            yi = y_train[i]
            logit = bias + sum(w * x for w, x in zip(weights, xi))
            pred = _sigmoid(logit)
            err = pred - yi
            for j in range(num_features):
                grad_w[j] += err * xi[j]
            grad_b += err

        for j in range(num_features):
            weights[j] -= lr * (grad_w[j] / n)
        bias -= lr * (grad_b / n)

    return bias, weights


def evaluate_chronological_forecast(
    bars: list[NormalizedBar],
    config: FeatureConfig = FeatureConfig(),
    *,
    run_id: str = "run-001",
    bars_sha256: str | None = None,
    config_sha256: str | None = None,
    model_sha256: str | None = None,
) -> ForecastEvaluation:
    """Fit on training sessions and score the untouched chronological test sessions."""
    if config.horizon_bars <= 0:
        raise ValueError("horizon_bars must be positive")
    if not bars:
        return ForecastEvaluation(
            run_id=run_id,
            forecast_rows=[],
            contributions=[],
            brier_score=None,
            log_loss=None,
            balanced_accuracy=None,
            base_rate_probability=None,
            reliability_bins=[],
            test_positive_count=0,
            test_negative_count=0,
        )

    # Compute features for all bars
    all_features = compute_causal_features(bars, config)

    # Group by session
    sessions: dict[date, list[tuple[int, NormalizedBar]]] = {}
    for idx, bar in enumerate(bars):
        sessions.setdefault(bar.session_date_ist, []).append((idx, bar))

    sorted_dates = sorted(sessions.keys())
    num_sessions = len(sorted_dates)

    # Reserve whole chronological sessions for training, validation, and final test.
    train_count = max(1, int(num_sessions * 0.6))
    if num_sessions >= 3:
        train_count = min(train_count, num_sessions - 2)
        validation_count = max(1, int(num_sessions * 0.2))
        validation_count = min(validation_count, num_sessions - train_count - 1)
    else:
        validation_count = 0
    train_sessions = set(sorted_dates[:train_count])
    test_sessions = set(sorted_dates[train_count + validation_count :])

    feature_keys = ["ret_1", "ret_3", "ret_6", "dist_sma20", "dist_sma50", "vol_20"]

    # Build labeled samples only when the exact horizon bar exists in the same session.
    train_x: list[list[float]] = []
    train_y: list[int] = []
    test_samples: list[_Sample] = []

    for s_date, session_items in sessions.items():
        bars_by_start = {bar.bar_start_utc: (idx, bar) for idx, bar in session_items}
        for global_idx, bar in session_items:
            target_start = bar.bar_start_utc + INTERVAL * config.horizon_bars
            target_item = bars_by_start.get(target_start)
            if target_item is None:
                continue
            _, target_bar = target_item
            sample = _Sample(
                bar=bar,
                target_bar=target_bar,
                features=[all_features[global_idx][k] for k in feature_keys],
                target=int(target_bar.close > bar.close),
            )
            if s_date in train_sessions:
                train_x.append(sample.features)
                train_y.append(sample.target)
            elif s_date in test_sessions:
                test_samples.append(sample)

    if not train_x:
        return ForecastEvaluation(
            run_id=run_id,
            forecast_rows=[],
            contributions=[],
            brier_score=None,
            log_loss=None,
            balanced_accuracy=None,
            base_rate_probability=None,
            reliability_bins=[],
            test_positive_count=0,
            test_negative_count=0,
        )

    # Compute training base rate
    train_pos = sum(train_y)
    base_rate_flt = train_pos / len(train_y) if train_y else 0.5
    base_rate = _round_4(Decimal(str(round(base_rate_flt, 4))))

    # Standardize features using training mean and std only
    means: list[float] = []
    stds: list[float] = []
    for j in range(len(feature_keys)):
        vals = [row[j] for row in train_x]
        m = sum(vals) / len(vals)
        variance = sum((v - m) ** 2 for v in vals) / len(vals)
        s = math.sqrt(variance) if variance > 1e-12 else 1.0
        means.append(m)
        stds.append(s)

    std_train_x = [
        [(row[j] - means[j]) / stds[j] for j in range(len(feature_keys))]
        for row in train_x
    ]

    # Fit model on training fold only
    bias, weights = _fit_logistic_regression(std_train_x, train_y)

    # Fingerprints are derived from what was actually used unless the caller supplies them.
    bars_sha256 = bars_sha256 or fingerprint(
        [(b.bar_start_utc, b.open, b.high, b.low, b.close, b.volume) for b in bars]
    )
    config_sha256 = config_sha256 or fingerprint(asdict(config))
    model_sha256 = model_sha256 or fingerprint(
        {"bias": bias, "weights": weights, "means": means, "stds": stds}
    )

    forecast_rows: list[ForecastRow] = []
    contributions: list[LogitContribution] = []
    probabilities: list[Decimal] = []
    actuals: list[bool] = []

    f_counter = 1
    for sample in test_samples:
        bar = sample.bar
        target_bar = sample.target_bar
        raw_feat = sample.features
        std_feat = [
            (raw_feat[j] - means[j]) / stds[j] for j in range(len(feature_keys))
        ]

        feature_contrib: dict[str, float] = {}
        for j, k in enumerate(feature_keys):
            feature_contrib[k] = weights[j] * std_feat[j]

        total_logit = bias + sum(feature_contrib.values())
        prob_flt = _sigmoid(total_logit)
        prob_dec = _round_4(Decimal(str(round(prob_flt, 4))))

        f_id = f"forecast-{f_counter:04d}"
        f_counter += 1

        forecast_rows.append(
            ForecastRow(
                run_id=run_id,
                forecast_id=f_id,
                session_date_ist=bar.session_date_ist,
                origin_time_utc=bar.bar_end_utc,
                origin_time_ist=bar.bar_end_ist,
                input_cutoff_utc=bar.bar_end_utc,
                input_cutoff_ist=bar.bar_end_ist,
                target_time_utc=target_bar.bar_end_utc,
                target_time_ist=target_bar.bar_end_ist,
                probability_up=prob_dec,
                baseline_probability_up=base_rate,
                actual_up=(sample.target == 1),
                bars_sha256=bars_sha256,
                config_sha256=config_sha256,
                model_sha256=model_sha256,
                evaluation_split="test",
            )
        )
        contributions.append(
            LogitContribution(
                forecast_id=f_id,
                intercept=bias,
                feature_contributions=feature_contrib,
                total_logit=total_logit,
            )
        )
        probabilities.append(prob_dec)
        actuals.append(sample.target == 1)

    brier = calculate_brier_score(probabilities, actuals) if probabilities else None
    logloss = calculate_log_loss(probabilities, actuals) if probabilities else None
    balanced_acc = (
        calculate_balanced_accuracy(probabilities, actuals) if probabilities else None
    )
    bins = calculate_reliability_bins(probabilities, actuals)

    return ForecastEvaluation(
        run_id=run_id,
        forecast_rows=forecast_rows,
        contributions=contributions,
        brier_score=brier,
        log_loss=logloss,
        balanced_accuracy=balanced_acc,
        base_rate_probability=base_rate,
        reliability_bins=bins,
        test_positive_count=sum(actuals),
        test_negative_count=len(actuals) - sum(actuals),
    )
