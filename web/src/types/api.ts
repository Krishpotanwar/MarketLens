/**
 * Generated TypeScript interfaces matching FastAPI OpenAPI endpoints.
 */

export interface ActiveRunSummary {
  run_id: string;
  synthetic: boolean;
  data_label: string;
  source_label: string;
  created_at_utc: string;
  data_start_utc: string;
  data_end_utc: string;
}

export interface RunMetricsData {
  gross_pnl_inr: string;
  brokerage_inr: string;
  exchange_charges_inr: string;
  sebi_charges_inr: string;
  stt_inr: string;
  stamp_duty_inr: string;
  gst_inr: string;
  slippage_inr: string;
  net_pnl_inr: string;
  return_percent: string | null;
  cash_baseline_net_pnl_inr: string;
  buy_hold_baseline_net_pnl_inr: string;
  max_drawdown_percent: string;
  trade_count: number;
  session_count: number;
  brier_score: string | null;
  log_loss: string | null;
  balanced_accuracy: string | null;
  forecast_count: number;
}

export interface RunMetadataResponse {
  run_id: string;
  synthetic: boolean;
  data_label: string;
  source_label: string;
  bars_sha256: string;
  config_sha256: string;
  code_revision: string;
  created_at_utc: string;
  data_start_utc: string;
  data_end_utc: string;
  metrics: RunMetricsData;
}

export interface EquityPointData {
  timestamp_utc: string;
  timestamp_ist: string;
  equity_inr: string;
  drawdown_percent: string;
}

export interface EquityResponse {
  run_id: string;
  points: EquityPointData[];
}

export interface TradeItem {
  trade_id: string;
  session_date_ist: string;
  entry_time_utc: string;
  entry_time_ist: string;
  exit_time_utc: string;
  exit_time_ist: string;
  entry_price_inr: string;
  exit_price_inr: string;
  quantity: number;
  gross_pnl_inr: string;
  brokerage_inr: string;
  exchange_charges_inr: string;
  sebi_charges_inr: string;
  stt_inr: string;
  stamp_duty_inr: string;
  gst_inr: string;
  slippage_inr: string;
  net_pnl_inr: string;
}

export interface TradesResponse {
  run_id: string;
  trades: TradeItem[];
  next_cursor: string | null;
}

export interface ForecastItem {
  forecast_id: string;
  session_date_ist: string;
  origin_time_utc: string;
  origin_time_ist: string;
  input_cutoff_utc: string;
  input_cutoff_ist: string;
  target_time_utc: string;
  target_time_ist: string;
  probability_up: string;
  baseline_probability_up: string;
  actual_up: boolean | null;
  evaluation_split: "validation" | "test";
}

export interface ForecastsResponse {
  run_id: string;
  forecasts: ForecastItem[];
  next_cursor: string | null;
}

export interface RunReceiptResponse {
  run_id: string;
  synthetic: boolean;
  data_label: string;
  source_label: string;
  bars_sha256: string;
  config_sha256: string;
  code_revision: string;
  created_at_utc: string;
  data_start_utc: string;
  data_end_utc: string;
  manifest: Record<string, unknown>;
  methodology: string;
  limitations: string[];
}
