"""Transactional publisher for immutable run bundles."""

from __future__ import annotations

from datetime import datetime, timezone
import json
import sqlite3
from zoneinfo import ZoneInfo

from bazaar_drishti.bundle.builder import RunBundle
from bazaar_drishti.bundle.validator import validate_run_bundle
from bazaar_drishti.schemas import RunManifest

IST = ZoneInfo("Asia/Kolkata")


class Publisher:
    """Transactional publisher storing immutable run data and active pointer."""

    def __init__(self, conn: sqlite3.Connection) -> None:
        self.conn = conn

    def initialize_schema(self) -> None:
        """Create tables for active pointer, runs, metrics, and trades."""
        with self.conn:
            self.conn.execute(
                """
                CREATE TABLE IF NOT EXISTS active_run_pointer (
                    singleton_id INTEGER PRIMARY KEY CHECK (singleton_id = 1),
                    active_run_id TEXT NOT NULL,
                    updated_at_utc TEXT NOT NULL
                )
                """
            )
            self.conn.execute(
                """
                CREATE TABLE IF NOT EXISTS published_runs (
                    run_id TEXT PRIMARY KEY,
                    synthetic INTEGER NOT NULL,
                    data_label TEXT NOT NULL,
                    source_label TEXT NOT NULL,
                    bars_sha256 TEXT NOT NULL,
                    config_sha256 TEXT NOT NULL,
                    code_revision TEXT NOT NULL,
                    created_at_utc TEXT NOT NULL,
                    created_at_ist TEXT NOT NULL,
                    data_start_utc TEXT NOT NULL,
                    data_start_ist TEXT NOT NULL,
                    data_end_utc TEXT NOT NULL,
                    data_end_ist TEXT NOT NULL,
                    manifest_json TEXT NOT NULL
                )
                """
            )
            self.conn.execute(
                """
                CREATE TABLE IF NOT EXISTS run_metrics (
                    run_id TEXT PRIMARY KEY,
                    gross_pnl_inr TEXT NOT NULL,
                    brokerage_inr TEXT NOT NULL,
                    exchange_charges_inr TEXT NOT NULL,
                    sebi_charges_inr TEXT NOT NULL,
                    stt_inr TEXT NOT NULL,
                    stamp_duty_inr TEXT NOT NULL,
                    gst_inr TEXT NOT NULL,
                    slippage_inr TEXT NOT NULL,
                    net_pnl_inr TEXT NOT NULL,
                    return_percent TEXT,
                    cash_baseline_net_pnl_inr TEXT NOT NULL,
                    buy_hold_baseline_net_pnl_inr TEXT NOT NULL,
                    max_drawdown_percent TEXT NOT NULL,
                    trade_count INTEGER NOT NULL,
                    session_count INTEGER NOT NULL,
                    brier_score TEXT,
                    log_loss TEXT,
                    balanced_accuracy TEXT,
                    forecast_count INTEGER NOT NULL DEFAULT 0
                )
                """
            )
            self.conn.execute(
                """
                CREATE TABLE IF NOT EXISTS trade_ledger (
                    run_id TEXT NOT NULL,
                    trade_id TEXT NOT NULL,
                    session_date_ist TEXT NOT NULL,
                    entry_time_utc TEXT NOT NULL,
                    entry_time_ist TEXT NOT NULL,
                    exit_time_utc TEXT NOT NULL,
                    exit_time_ist TEXT NOT NULL,
                    entry_price_inr TEXT NOT NULL,
                    exit_price_inr TEXT NOT NULL,
                    quantity INTEGER NOT NULL,
                    gross_pnl_inr TEXT NOT NULL,
                    brokerage_inr TEXT NOT NULL,
                    exchange_charges_inr TEXT NOT NULL,
                    sebi_charges_inr TEXT NOT NULL,
                    stt_inr TEXT NOT NULL,
                    stamp_duty_inr TEXT NOT NULL,
                    gst_inr TEXT NOT NULL,
                    slippage_inr TEXT NOT NULL,
                    net_pnl_inr TEXT NOT NULL,
                    PRIMARY KEY (run_id, trade_id)
                )
                """
            )
            self.conn.execute(
                """
                CREATE TABLE IF NOT EXISTS equity_points (
                    run_id TEXT NOT NULL,
                    timestamp_utc TEXT NOT NULL,
                    timestamp_ist TEXT NOT NULL,
                    equity_inr TEXT NOT NULL,
                    drawdown_percent TEXT NOT NULL,
                    PRIMARY KEY (run_id, timestamp_utc)
                )
                """
            )
            self.conn.execute(
                """
                CREATE TABLE IF NOT EXISTS forecast_records (
                    run_id TEXT NOT NULL,
                    forecast_id TEXT NOT NULL,
                    session_date_ist TEXT NOT NULL,
                    origin_time_utc TEXT NOT NULL,
                    origin_time_ist TEXT NOT NULL,
                    input_cutoff_utc TEXT NOT NULL,
                    input_cutoff_ist TEXT NOT NULL,
                    target_time_utc TEXT NOT NULL,
                    target_time_ist TEXT NOT NULL,
                    probability_up TEXT NOT NULL,
                    baseline_probability_up TEXT NOT NULL,
                    actual_up INTEGER,
                    evaluation_split TEXT NOT NULL,
                    PRIMARY KEY (run_id, forecast_id)
                )
                """
            )
            for table in (
                "published_runs",
                "run_metrics",
                "trade_ledger",
                "equity_points",
                "forecast_records",
            ):
                self.conn.execute(
                    f"""
                    CREATE TRIGGER IF NOT EXISTS immutable_{table}_no_update
                    BEFORE UPDATE ON {table}
                    BEGIN SELECT RAISE(ABORT, 'published run artifacts are immutable'); END
                    """
                )
                self.conn.execute(
                    f"""
                    CREATE TRIGGER IF NOT EXISTS immutable_{table}_no_delete
                    BEFORE DELETE ON {table}
                    BEGIN SELECT RAISE(ABORT, 'published run artifacts are immutable'); END
                    """
                )

    def publish_run(self, bundle: RunBundle) -> None:
        """Validate and insert bundle within a single atomic transaction."""
        validate_run_bundle(bundle)
        m = bundle.manifest
        met = bundle.metrics

        with self.conn:
            # 1. Insert run manifest
            manifest_dict = {
                "run_id": m.run_id,
                "synthetic": m.synthetic,
                "data_label": m.data_label,
                "source_label": m.source_label,
                "bars_sha256": m.bars_sha256,
                "config_sha256": m.config_sha256,
                "code_revision": m.code_revision,
            }
            self.conn.execute(
                """
                INSERT INTO published_runs (
                    run_id, synthetic, data_label, source_label, bars_sha256,
                    config_sha256, code_revision, created_at_utc, created_at_ist,
                    data_start_utc, data_start_ist, data_end_utc, data_end_ist,
                    manifest_json
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    m.run_id,
                    1 if m.synthetic else 0,
                    m.data_label,
                    m.source_label,
                    m.bars_sha256,
                    m.config_sha256,
                    m.code_revision,
                    m.created_at_utc.isoformat(),
                    m.created_at_ist.isoformat(),
                    m.data_start_utc.isoformat(),
                    m.data_start_ist.isoformat(),
                    m.data_end_utc.isoformat(),
                    m.data_end_ist.isoformat(),
                    json.dumps(manifest_dict),
                ),
            )

            # 2. Insert metrics
            self.conn.execute(
                """
                INSERT INTO run_metrics (
                    run_id, gross_pnl_inr, brokerage_inr, exchange_charges_inr,
                    sebi_charges_inr, stt_inr, stamp_duty_inr, gst_inr,
                    slippage_inr, net_pnl_inr, return_percent, cash_baseline_net_pnl_inr,
                    buy_hold_baseline_net_pnl_inr, max_drawdown_percent, trade_count,
                    session_count, brier_score, log_loss, balanced_accuracy, forecast_count
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    met.run_id,
                    str(met.gross_pnl_inr),
                    str(met.brokerage_inr),
                    str(met.exchange_charges_inr),
                    str(met.sebi_charges_inr),
                    str(met.stt_inr),
                    str(met.stamp_duty_inr),
                    str(met.gst_inr),
                    str(met.slippage_inr),
                    str(met.net_pnl_inr),
                    str(met.return_percent) if met.return_percent is not None else None,
                    str(met.cash_baseline_net_pnl_inr),
                    str(met.buy_hold_baseline_net_pnl_inr),
                    str(met.max_drawdown_percent),
                    met.trade_count,
                    met.session_count,
                    str(met.brier_score) if met.brier_score is not None else None,
                    str(met.log_loss) if met.log_loss is not None else None,
                    str(met.balanced_accuracy)
                    if met.balanced_accuracy is not None
                    else None,
                    met.forecast_count,
                ),
            )

            # 3. Insert trades
            for t in bundle.trades:
                self.conn.execute(
                    """
                    INSERT INTO trade_ledger (
                        run_id, trade_id, session_date_ist, entry_time_utc,
                        entry_time_ist, exit_time_utc, exit_time_ist,
                        entry_price_inr, exit_price_inr, quantity, gross_pnl_inr,
                        brokerage_inr, exchange_charges_inr, sebi_charges_inr,
                        stt_inr, stamp_duty_inr, gst_inr, slippage_inr, net_pnl_inr
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        t.run_id,
                        t.trade_id,
                        t.session_date_ist.isoformat(),
                        t.entry_time_utc.isoformat(),
                        t.entry_time_ist.isoformat(),
                        t.exit_time_utc.isoformat(),
                        t.exit_time_ist.isoformat(),
                        str(t.entry_price_inr),
                        str(t.exit_price_inr),
                        t.quantity,
                        str(t.gross_pnl_inr),
                        str(t.brokerage_inr),
                        str(t.exchange_charges_inr),
                        str(t.sebi_charges_inr),
                        str(t.stt_inr),
                        str(t.stamp_duty_inr),
                        str(t.gst_inr),
                        str(t.slippage_inr),
                        str(t.net_pnl_inr),
                    ),
                )

            # 4. Insert equity curve
            for eq in bundle.equity_curve:
                self.conn.execute(
                    """
                    INSERT INTO equity_points (
                        run_id, timestamp_utc, timestamp_ist, equity_inr, drawdown_percent
                    ) VALUES (?, ?, ?, ?, ?)
                    """,
                    (
                        m.run_id,
                        eq.timestamp_utc.isoformat(),
                        eq.timestamp_ist.isoformat(),
                        str(eq.equity_inr),
                        str(eq.drawdown_percent),
                    ),
                )

            # 5. Insert forecast records
            for f in bundle.forecasts:
                self.conn.execute(
                    """
                    INSERT INTO forecast_records (
                        run_id, forecast_id, session_date_ist, origin_time_utc,
                        origin_time_ist, input_cutoff_utc, input_cutoff_ist,
                        target_time_utc, target_time_ist, probability_up,
                        baseline_probability_up, actual_up, evaluation_split
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        f.run_id,
                        f.forecast_id,
                        f.session_date_ist.isoformat(),
                        f.origin_time_utc.isoformat(),
                        f.origin_time_ist.isoformat(),
                        f.input_cutoff_utc.isoformat(),
                        f.input_cutoff_ist.isoformat(),
                        f.target_time_utc.isoformat(),
                        f.target_time_ist.isoformat(),
                        str(f.probability_up),
                        str(f.baseline_probability_up),
                        1 if f.actual_up else (0 if f.actual_up is False else None),
                        f.evaluation_split,
                    ),
                )

            # 6. Update active run pointer
            now_iso = datetime.now(timezone.utc).isoformat()
            self.conn.execute(
                """
                INSERT INTO active_run_pointer (singleton_id, active_run_id, updated_at_utc)
                VALUES (1, ?, ?)
                ON CONFLICT(singleton_id) DO UPDATE SET
                    active_run_id = excluded.active_run_id,
                    updated_at_utc = excluded.updated_at_utc
                """,
                (m.run_id, now_iso),
            )

    def set_active_run(self, run_id: str) -> None:
        """Atomic rollback/switch of active run pointer."""
        exists = self.conn.execute(
            "SELECT 1 FROM published_runs WHERE run_id = ?", (run_id,)
        ).fetchone()
        if exists is None:
            raise KeyError(f"Run {run_id} not found")
        with self.conn:
            now_iso = datetime.now(timezone.utc).isoformat()
            self.conn.execute(
                """
                INSERT INTO active_run_pointer (singleton_id, active_run_id, updated_at_utc)
                VALUES (1, ?, ?)
                ON CONFLICT(singleton_id) DO UPDATE SET
                    active_run_id = excluded.active_run_id,
                    updated_at_utc = excluded.updated_at_utc
                """,
                (run_id, now_iso),
            )

    def get_active_run_id(self) -> str | None:
        """Query currently active run ID."""
        cursor = self.conn.execute(
            "SELECT active_run_id FROM active_run_pointer WHERE singleton_id = 1"
        )
        row = cursor.fetchone()
        return row[0] if row else None

    def get_manifest(self, run_id: str) -> RunManifest:
        """Retrieve manifest for a given run ID."""
        cursor = self.conn.execute(
            """
            SELECT run_id, synthetic, data_label, source_label, bars_sha256,
                   config_sha256, code_revision, created_at_utc, created_at_ist,
                   data_start_utc, data_start_ist, data_end_utc, data_end_ist
            FROM published_runs WHERE run_id = ?
            """,
            (run_id,),
        )
        row = cursor.fetchone()
        if not row:
            raise KeyError(f"Run {run_id} not found")

        return RunManifest(
            run_id=row[0],
            synthetic=bool(row[1]),
            data_label=row[2],
            source_label=row[3],
            bars_sha256=row[4],
            config_sha256=row[5],
            code_revision=row[6],
            created_at_utc=datetime.fromisoformat(row[7]),
            created_at_ist=datetime.fromisoformat(row[8]),
            data_start_utc=datetime.fromisoformat(row[9]),
            data_start_ist=datetime.fromisoformat(row[10]),
            data_end_utc=datetime.fromisoformat(row[11]),
            data_end_ist=datetime.fromisoformat(row[12]),
        )
