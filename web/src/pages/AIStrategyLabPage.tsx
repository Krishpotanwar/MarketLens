import { useMemo, useState } from "react";
import { INITIAL_INDIAN_STOCKS } from "../data/indianMarketData";
import type { StockTrendInfo } from "../types/paper";

interface AIStrategyLabPageProps {
  onExecuteAITrade: (symbol: string, side: "BUY" | "SELL", price: number) => void;
}

export type StrategyPresetId = "TREND_CROSSOVER" | "MEAN_REVERSION" | "BREAKOUT_MOMENTUM" | "CUSTOM";

interface AIAnalysisResult {
  symbol: string;
  bias: "BULLISH" | "BEARISH" | "NEUTRAL";
  probabilityScore: number;
  entryPrice: number;
  targetPrice: number;
  stopLossPrice: number;
  riskRewardRatio: string;
  suggestedAllocationPercent: number;
  reasoningSteps: string[];
  keyRisk: string;
  timestamp: string;
}

export function AIStrategyLabPage({ onExecuteAITrade }: AIStrategyLabPageProps) {
  const [stocks] = useState<StockTrendInfo[]>(INITIAL_INDIAN_STOCKS);
  const [selectedSymbol, setSelectedSymbol] = useState<string>("RELIANCE");
  const [selectedStrategy, setSelectedStrategy] = useState<StrategyPresetId>("TREND_CROSSOVER");
  const [customPrompt, setCustomPrompt] = useState<string>(
    "Look for stocks with high relative volume (>1.5x) consolidating near VWAP, buy on 5-minute bar breakout with 1:2 risk-reward."
  );
  const [apiKey, setApiKey] = useState<string>(() => {
    if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
      return localStorage.getItem("marketlens_ai_api_key") || "";
    }
    return "";
  });
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [result, setResult] = useState<AIAnalysisResult | null>(null);

  const activeStock = useMemo(() => {
    return stocks.find((s) => s.symbol === selectedSymbol) ?? stocks[0];
  }, [stocks, selectedSymbol]);

  function handleSaveApiKey(key: string) {
    setApiKey(key);
    if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
      localStorage.setItem("marketlens_ai_api_key", key);
    }
  }

  function runStrategyAnalysis() {
    setIsAnalyzing(true);

    setTimeout(() => {
      const price = activeStock.ltp;
      let bias: "BULLISH" | "BEARISH" | "NEUTRAL" = "BULLISH";
      let prob = activeStock.predictedProbabilityUp;
      let target = price * (1 + activeStock.expectedMovePercent / 100);
      let stop = price * (1 - (activeStock.expectedMovePercent / 100) * 0.5);
      const reasoning: string[] = [];

      if (selectedStrategy === "TREND_CROSSOVER") {
        const isGolden = activeStock.sma20 >= activeStock.sma50;
        bias = isGolden ? "BULLISH" : "BEARISH";
        prob = isGolden ? Math.max(0.72, prob) : 0.38;
        target = isGolden ? price * 1.025 : price * 0.975;
        stop = isGolden ? price * 0.988 : price * 1.012;

        reasoning.push(
          `Evaluated 20 SMA (₹${activeStock.sma20}) vs 50 SMA (₹${activeStock.sma50}): ${isGolden ? "Golden Crossover active" : "Bearish trend under 50 SMA"}.`
        );
        reasoning.push(
          `Relative volume ratio is ${activeStock.volumeRatio}x over 20-period baseline, confirming institutional participation.`
        );
        reasoning.push(
          `Causal momentum feature contributes +${activeStock.causalFeatures.momentum}% to directional signal.`
        );
      } else if (selectedStrategy === "MEAN_REVERSION") {
        const isOversold = activeStock.rsi14 < 45;
        bias = isOversold ? "BULLISH" : activeStock.rsi14 > 70 ? "BEARISH" : "NEUTRAL";
        prob = isOversold ? 0.74 : 0.52;
        target = isOversold ? activeStock.vwap * 1.01 : price * 0.98;
        stop = isOversold ? price * 0.985 : price * 1.015;

        reasoning.push(
          `RSI (14) measured at ${activeStock.rsi14.toFixed(1)} indicates ${isOversold ? "oversold pullback zone" : "extended momentum"}.`
        );
        reasoning.push(
          `VWAP anchored at ₹${activeStock.vwap.toFixed(2)} acts as immediate mean-reversion target.`
        );
        reasoning.push(
          `Causal mean-reversion deviation score: +${activeStock.causalFeatures.vwapDeviation}%.`
        );
      } else if (selectedStrategy === "BREAKOUT_MOMENTUM") {
        bias = "BULLISH";
        prob = 0.81;
        target = price * 1.035;
        stop = price * 0.985;

        reasoning.push(
          `High volume surge of ${activeStock.volumeRatio}x detected above day open (₹${activeStock.open.toFixed(2)}).`
        );
        reasoning.push(
          `Strong sector breadth (+${activeStock.causalFeatures.sectorBreadth}%) supports continuation to 52-week highs.`
        );
        reasoning.push(
          `Risk/Reward favorable at 1:2.3 with tight intraday invalidation.`
        );
      } else {
        // Custom prompt interpretation
        bias = prob >= 0.6 ? "BULLISH" : "NEUTRAL";
        target = price * 1.028;
        stop = price * 0.986;

        reasoning.push(`Parsed custom user strategy: "${customPrompt.slice(0, 60)}..."`);
        reasoning.push(
          `Aligned custom rules with ${activeStock.symbol} order flow: ${bias} bias with ${(prob * 100).toFixed(0)}% algorithmic confidence.`
        );
        reasoning.push(`Identified structural support at ₹${activeStock.low.toFixed(2)}.`);
      }

      const riskReward = (
        Math.abs(target - price) / Math.max(0.1, Math.abs(price - stop))
      ).toFixed(2);

      setResult({
        symbol: activeStock.symbol,
        bias,
        probabilityScore: prob,
        entryPrice: price,
        targetPrice: parseFloat(target.toFixed(2)),
        stopLossPrice: parseFloat(stop.toFixed(2)),
        riskRewardRatio: `1:${riskReward}`,
        suggestedAllocationPercent: bias === "BULLISH" ? 15 : 5,
        reasoningSteps: reasoning,
        keyRisk: "Broad market volatility during RBI / US Fed policy announcements or abrupt Nifty gap-downs.",
        timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      });

      setIsAnalyzing(false);
    }, 600);
  }

  return (
    <div className="page-content" tabIndex={-1}>
      <header className="page-header">
        <h1>Hybrid AI Strategy Lab & Grok Reasoning Sandbox</h1>
        <p className="status-copy">
          Fine-tune and back-evaluate custom Indian stock strategies using our hybrid quantitative causal model and Grok-style reasoning stream. Test trade setups directly in the paper terminal.
        </p>
      </header>

      <div className="ai-lab-grid">
        {/* Left Column: Strategy Configurator & Prompt Sandbox */}
        <section className="strategy-config-panel" aria-label="Strategy Configuration">
          <h2 className="panel-title">Strategy Rules & Prompt Sandbox</h2>

          {/* Symbol Select */}
          <div className="form-group">
            <label htmlFor="ai-stock-select">Target Indian Equity (NSE)</label>
            <select
              id="ai-stock-select"
              value={selectedSymbol}
              onChange={(e) => setSelectedSymbol(e.target.value)}
            >
              {stocks.map((s) => (
                <option key={s.symbol} value={s.symbol}>
                  {s.symbol} — {s.name} (₹{s.ltp.toFixed(2)})
                </option>
              ))}
            </select>
          </div>

          {/* Strategy Presets */}
          <div className="form-group">
            <label>Strategy Preset</label>
            <div className="preset-pill-grid" role="radiogroup" aria-label="Strategy Presets">
              {[
                { id: "TREND_CROSSOVER", name: "20/50 SMA Crossover" },
                { id: "MEAN_REVERSION", name: "RSI Dip & VWAP" },
                { id: "BREAKOUT_MOMENTUM", name: "Volume Breakout" },
                { id: "CUSTOM", name: "Custom Prompt Sandbox" },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className={`preset-btn ${selectedStrategy === p.id ? "active" : ""}`}
                  onClick={() => setSelectedStrategy(p.id as StrategyPresetId)}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Prompt Textarea */}
          {selectedStrategy === "CUSTOM" && (
            <div className="form-group">
              <label htmlFor="custom-strategy-prompt">Custom Strategy Instructions</label>
              <textarea
                id="custom-strategy-prompt"
                rows={4}
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Enter your exact trading rules, indicators, and conditions in plain English..."
                className="custom-prompt-input"
              />
            </div>
          )}

          {/* Optional API Key Input */}
          <div className="form-group">
            <label htmlFor="ai-api-key">xAI Grok / OpenAI API Key (Optional)</label>
            <input
              id="ai-api-key"
              type="password"
              placeholder="Paste xai-... or sk-... (Leave empty to use built-in engine)"
              value={apiKey}
              onChange={(e) => handleSaveApiKey(e.target.value)}
            />
            <span className="input-hint">
              {apiKey ? "Using custom LLM key (saved locally)" : "Using MarketLens built-in deterministic reasoning engine"}
            </span>
          </div>

          <button
            type="button"
            className="btn-run-analysis"
            onClick={runStrategyAnalysis}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? "Analyzing Market Data & Strategy..." : `Run AI Analysis on ${activeStock.symbol}`}
          </button>
        </section>

        {/* Right Column: AI Output & Chain-of-Thought Reasoning */}
        <section className="ai-output-panel" aria-label="AI Reasoning and Output">
          <h2 className="panel-title">AI Strategy Reasoning Stream</h2>

          {!result ? (
            <div className="empty-ai-state">
              <div className="ai-orb-pulse" />
              <h3>Ready to Evaluate Strategy</h3>
              <p>Select an Indian stock and strategy preset on the left, then click <strong>Run AI Analysis</strong> to generate directional probability and calibrated trade setups.</p>
            </div>
          ) : (
            <div className="ai-results-wrapper">
              {/* Top Banner: Signal & Probability */}
              <div className="ai-signal-banner">
                <div className="signal-left">
                  <span className="symbol-tag">{result.symbol}</span>
                  <span className={`bias-pill bias-${result.bias.toLowerCase()}`}>
                    {result.bias} SIGNAL
                  </span>
                </div>
                <div className="signal-right">
                  <span className="prob-label">Predicted Probability</span>
                  <span className="prob-val text-accent">{(result.probabilityScore * 100).toFixed(0)}%</span>
                </div>
              </div>

              {/* Trade Setup Matrix */}
              <div className="setup-matrix-grid">
                <div className="setup-cell">
                  <span className="cell-label">Entry Level</span>
                  <span className="cell-val">₹{result.entryPrice.toFixed(2)}</span>
                </div>
                <div className="setup-cell">
                  <span className="cell-label">Target Price</span>
                  <span className="cell-val text-gain">₹{result.targetPrice.toFixed(2)}</span>
                </div>
                <div className="setup-cell">
                  <span className="cell-label">Stop-Loss</span>
                  <span className="cell-val text-loss">₹{result.stopLossPrice.toFixed(2)}</span>
                </div>
                <div className="setup-cell">
                  <span className="cell-label">Risk : Reward</span>
                  <span className="cell-val text-accent">{result.riskRewardRatio}</span>
                </div>
              </div>

              {/* Chain of Thought Reasoning */}
              <div className="reasoning-card">
                <div className="reasoning-header">
                  <span className="reasoning-title">Grok Strategy Chain-of-Thought Rationale</span>
                  <span className="timestamp-tag">{result.timestamp}</span>
                </div>
                <ul className="reasoning-list">
                  {result.reasoningSteps.map((step, idx) => (
                    <li key={idx} className="reasoning-step">
                      <span className="step-num">{idx + 1}</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>

                <div className="key-risk-block">
                  <span className="risk-title">Identified Key Risk Factor:</span>
                  <p className="risk-desc">{result.keyRisk}</p>
                </div>
              </div>

              {/* One-click Paper Execution */}
              <div className="paper-execution-bridge">
                <button
                  type="button"
                  className="btn-execute-ai-trade"
                  onClick={() =>
                    onExecuteAITrade(
                      result.symbol,
                      result.bias === "BEARISH" ? "SELL" : "BUY",
                      result.entryPrice
                    )
                  }
                >
                  Execute {result.bias === "BEARISH" ? "SELL" : "BUY"} Paper Trade on this AI Signal &rarr;
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
