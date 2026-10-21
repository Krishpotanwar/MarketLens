-- Migration: 001_published_runs.sql
-- Description: Immutable versioned research runs and query-optimized tables

CREATE TABLE IF NOT EXISTS active_run_pointer (
    singleton_id INT PRIMARY KEY DEFAULT 1 CHECK (singleton_id = 1),
    active_run_id TEXT NOT NULL,
    updated_at_utc TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS published_runs (
    run_id TEXT PRIMARY KEY,
    synthetic BOOLEAN NOT NULL,
    data_label TEXT NOT NULL,
    source_label TEXT NOT NULL,
    bars_sha256 CHAR(64) NOT NULL,
    config_sha256 CHAR(64) NOT NULL,
    code_revision TEXT NOT NULL,
    created_at_utc TIMESTAMPTZ NOT NULL,
    data_start_utc TIMESTAMPTZ NOT NULL,
    data_end_utc TIMESTAMPTZ NOT NULL,
    manifest_json JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS run_metrics (
    run_id TEXT PRIMARY KEY REFERENCES published_runs(run_id) ON DELETE RESTRICT,
    gross_pnl_inr NUMERIC(14, 2) NOT NULL,
    brokerage_inr NUMERIC(14, 2) NOT NULL,
    exchange_charges_inr NUMERIC(14, 2) NOT NULL,
    sebi_charges_inr NUMERIC(14, 2) NOT NULL,
    stt_inr NUMERIC(14, 2) NOT NULL,
    stamp_duty_inr NUMERIC(14, 2) NOT NULL,
    gst_inr NUMERIC(14, 2) NOT NULL,
    slippage_inr NUMERIC(14, 2) NOT NULL,
    net_pnl_inr NUMERIC(14, 2) NOT NULL,
    return_percent NUMERIC(8, 4),
    cash_baseline_net_pnl_inr NUMERIC(14, 2) NOT NULL,
    buy_hold_baseline_net_pnl_inr NUMERIC(14, 2) NOT NULL,
    max_drawdown_percent NUMERIC(8, 4) NOT NULL,
    trade_count INT NOT NULL CHECK (trade_count >= 0),
    session_count INT NOT NULL CHECK (session_count >= 0),
    brier_score NUMERIC(6, 4),
    log_loss NUMERIC(6, 4),
    balanced_accuracy NUMERIC(6, 4),
    forecast_count INT NOT NULL DEFAULT 0 CHECK (forecast_count >= 0)
);

CREATE TABLE IF NOT EXISTS trade_ledger (
    run_id TEXT NOT NULL REFERENCES published_runs(run_id) ON DELETE RESTRICT,
    trade_id TEXT NOT NULL,
    session_date_ist DATE NOT NULL,
    entry_time_utc TIMESTAMPTZ NOT NULL,
    exit_time_utc TIMESTAMPTZ NOT NULL,
    entry_price_inr NUMERIC(12, 2) NOT NULL,
    exit_price_inr NUMERIC(12, 2) NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    gross_pnl_inr NUMERIC(14, 2) NOT NULL,
    brokerage_inr NUMERIC(14, 2) NOT NULL,
    exchange_charges_inr NUMERIC(14, 2) NOT NULL,
    sebi_charges_inr NUMERIC(14, 2) NOT NULL,
    stt_inr NUMERIC(14, 2) NOT NULL,
    stamp_duty_inr NUMERIC(14, 2) NOT NULL,
    gst_inr NUMERIC(14, 2) NOT NULL,
    slippage_inr NUMERIC(14, 2) NOT NULL,
    net_pnl_inr NUMERIC(14, 2) NOT NULL,
    PRIMARY KEY (run_id, trade_id)
);

CREATE INDEX IF NOT EXISTS idx_trade_ledger_keyset
    ON trade_ledger (run_id, entry_time_utc, trade_id);

CREATE TABLE IF NOT EXISTS equity_points (
    run_id TEXT NOT NULL REFERENCES published_runs(run_id) ON DELETE RESTRICT,
    timestamp_utc TIMESTAMPTZ NOT NULL,
    equity_inr NUMERIC(14, 2) NOT NULL,
    drawdown_percent NUMERIC(8, 4) NOT NULL,
    PRIMARY KEY (run_id, timestamp_utc)
);

CREATE TABLE IF NOT EXISTS forecast_records (
    run_id TEXT NOT NULL REFERENCES published_runs(run_id) ON DELETE RESTRICT,
    forecast_id TEXT NOT NULL,
    session_date_ist DATE NOT NULL,
    origin_time_utc TIMESTAMPTZ NOT NULL,
    input_cutoff_utc TIMESTAMPTZ NOT NULL,
    target_time_utc TIMESTAMPTZ NOT NULL,
    probability_up NUMERIC(6, 4) NOT NULL,
    baseline_probability_up NUMERIC(6, 4) NOT NULL,
    actual_up BOOLEAN,
    evaluation_split TEXT NOT NULL CHECK (evaluation_split IN ('validation', 'test')),
    PRIMARY KEY (run_id, forecast_id)
);

CREATE INDEX IF NOT EXISTS idx_forecast_records_keyset
    ON forecast_records (run_id, origin_time_utc, forecast_id);

CREATE OR REPLACE FUNCTION reject_published_artifact_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    RAISE EXCEPTION 'published run artifacts are immutable';
END;
$$;

DO $$
DECLARE
    table_name TEXT;
    trigger_name TEXT;
BEGIN
    FOREACH table_name IN ARRAY ARRAY[
        'published_runs', 'run_metrics', 'trade_ledger', 'equity_points', 'forecast_records'
    ] LOOP
        trigger_name := 'immutable_' || table_name;
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I', trigger_name, table_name);
        EXECUTE format(
            'CREATE TRIGGER %I BEFORE UPDATE OR DELETE ON %I FOR EACH ROW EXECUTE FUNCTION reject_published_artifact_mutation()',
            trigger_name,
            table_name
        );
    END LOOP;
END;
$$;
