import { useEffect, useMemo, useState } from "react";
import { INITIAL_INDIAN_STOCKS } from "../data/indianMarketData";
import {
  INDIAN_NEWS_FEEDS,
  COMPANY_CONCALL_PRESETS,
  getNewsForStock,
  getConcallPreset,
} from "../data/indianNewsFeeds";
import { runMonteCarloSimulation } from "../utils/monteCarlo";
import {
  generateTimelineScenarios,
  calculateStatutoryFriction,
} from "../utils/timelineEngine";
import {
  generateAIStrategyAnalysis,
  type StockTechnicalData,
} from "../services/aiGateway";
import { annualVolatility, rsi14, sma, vwap } from "../utils/indicators";
import { MonteCarloFanChart } from "../components/MonteCarloFanChart";
import { TimelineBranchingTree } from "../components/TimelineBranchingTree";
import { CorporateStrategyCard } from "../components/CorporateStrategyCard";
import { API_BASE } from "../utils/apiBase";
import type {
  AIEngineProvider,
  AIGatewayRequest,
  AIGatewayResponse,
  IndianNewsItem,
  MonteCarloSimulationResult,
  TimelineScenario,
  TimelineScenarioId,
} from "../types/aiSimulation";
import type { StockTrendInfo } from "../types/paper";

interface AIStrategyLabPageProps {
  onExecuteAITrade: (symbol: string, side: "BUY" | "SELL", price: number) => void;
  initialSymbol?: string;
}

export type StrategyPresetId =
  | "TREND_CROSSOVER"
  | "MEAN_REVERSION"
  | "BREAKOUT_MOMENTUM"
  | "CUSTOM";

const AI_PROVIDERS: { id: AIEngineProvider; label: string; desc: string }[] = [
  {
    id: "GROQ",
    label: "Groq (Llama-3.3-70B / DeepSeek-R1)",
    desc: "Ultra low-latency LPU inference for high-frequency quant analysis",
  },
  {
    id: "GEMINI",
    label: "Google Gemini Flash",
    desc: "Large token context for complete quarterly earnings transcripts",
  },
  {
    id: "GROK",
    label: "xAI Grok",
    desc: "Frontier mathematical and directional reasoning stream",
  },
  {
    id: "OFFLINE_HEURISTIC",
    label: "Offline Heuristic Engine",
    desc: "Rule-based heuristic, not statistically calibrated (no API key needed)",
  },
];

function getInitialConcallText(symbol: string): string {
  const normalized = symbol.trim().toUpperCase();
  const preset = COMPANY_CONCALL_PRESETS[normalized] ?? getConcallPreset(symbol);
  if (preset) {
    const keypoints = preset.guidanceKeypoints.map((k) => `• ${k}`).join("\n");
    return `${preset.concallTranscriptSnippet}\n\nKey Management Guidance:\n${keypoints}`;
  }
  return `Management concall notes and regulatory filings for ${symbol}.`;
}

interface BarTech {
  sma20: number | null;
  sma50: number | null;
  rsi14: number | null;
  vwap: number | null;
  volatility: number | null;
}

export function AIStrategyLabPage({ onExecuteAITrade, initialSymbol }: AIStrategyLabPageProps) {
  const [stocks, setStocks] = useState<StockTrendInfo[]>(INITIAL_INDIAN_STOCKS);
  const [selectedSymbol, setSelectedSymbol] = useState<string>(initialSymbol || "RELIANCE");
  const [selectedProvider, setSelectedProvider] = useState<AIEngineProvider>(() => {
    if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
      const stored = localStorage.getItem("marketlens_ai_provider") as AIEngineProvider | null;
      if (stored) return stored;
    }
    return "OFFLINE_HEURISTIC";
  });
  const [selectedStrategy, setSelectedStrategy] = useState<StrategyPresetId>("TREND_CROSSOVER");
  const [customPrompt, setCustomPrompt] = useState<string>(
    "Look for stocks with high relative volume (>1.5x) consolidating near VWAP, buy on 5-minute bar breakout with 1:2 risk-reward."
  );
  const [apiKey, setApiKey] = useState<string>(() => {
    if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
      const stored = localStorage.getItem("marketlens_ai_api_key");
      if (stored) return stored;
    }
    return ""; // never from a VITE_* variable: Vite would compile it into the public bundle
  });

  const [selectedNewsId, setSelectedNewsId] = useState<string>(() => {
    const news = getNewsForStock(initialSymbol || "RELIANCE");
    return news.length > 0 ? news[0].id : "";
  });

  const [sandboxText, setSandboxText] = useState<string>(() =>
    getInitialConcallText(initialSymbol || "RELIANCE")
  );

  useEffect(() => {
    if (initialSymbol) {
      setSelectedSymbol(initialSymbol);
      setSandboxText(getInitialConcallText(initialSymbol));
      const news = getNewsForStock(initialSymbol);
      setSelectedNewsId(news.length > 0 ? news[0].id : "");

      setStocks((prev) => {
        if (!prev.some((s) => s.symbol === initialSymbol)) {
          return [
            {
              symbol: initialSymbol,
              name: `${initialSymbol} Listed Equity`,
              sector: "Indian Equities",
              marketCapCategory: "Mid Cap",
              week52High: 1000,
              week52Low: 500,
              ltp: 500,
              change: 0,
              changePercent: 0,
              open: 500,
              high: 510,
              low: 490,
              vwap: 500,
              volume: 1000000,
              volumeRatio: 1.0,
              rsi14: 50,
              sma20: 500,
              sma50: 500,
              trend5m: "NEUTRAL",
              trend15m: "NEUTRAL",
              trend1h: "NEUTRAL",
              trend1d: "NEUTRAL",
              priceHistory: [500],
            },
            ...prev,
          ];
        }
        return prev;
      });
    }
  }, [initialSymbol]);

  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [progressStep, setProgressStep] = useState<string>("");
  const [analysisResult, setAnalysisResult] = useState<AIGatewayResponse | null>(null);
  const [mcResult, setMcResult] = useState<MonteCarloSimulationResult | null>(null);
  const [activeTimelineId, setActiveTimelineId] = useState<TimelineScenarioId>("BULL");
  const [tradeExecuted, setTradeExecuted] = useState<boolean>(false);
  const [analysisTimestamp, setAnalysisTimestamp] = useState<string>("");
  const [liveStockQuotes, setLiveStockQuotes] = useState<Record<string, number>>({});
  // Indicators computed from the symbol's real daily bars (null: none arrived). Bundled ones are samples.
  const [barTech, setBarTech] = useState<Record<string, BarTech | null>>({});
  const [mcNote, setMcNote] = useState<string>("");
  const [liveNewsMap, setLiveNewsMap] = useState<Record<string, IndianNewsItem[]>>({});
  const [isFetchingLiveNews, setIsFetchingLiveNews] = useState<boolean>(false);

  // Fetch real-time live news and live quote from the web whenever active symbol changes
  useEffect(() => {
    let isMounted = true;
    setIsFetchingLiveNews(true);

    fetch(`${API_BASE}/api/v1/market/news?symbol=${encodeURIComponent(selectedSymbol)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.news && data.news.length > 0 && isMounted) {
          setLiveNewsMap((prev) => ({ ...prev, [selectedSymbol]: data.news }));
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setIsFetchingLiveNews(false);
      });

    fetch(`${API_BASE}/api/v1/market/quote/${encodeURIComponent(selectedSymbol)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.ltp > 0 && isMounted) {
          setLiveStockQuotes((prev) => ({ ...prev, [selectedSymbol]: data.ltp }));
          setStocks((prev) =>
            prev.map((s) =>
              s.symbol === selectedSymbol
                ? {
                    ...s,
                    ltp: data.ltp,
                    name: data.name || s.name,
                  }
                : s
            )
          );
        }
      })
      .catch(() => {});

    fetch(`${API_BASE}/api/v1/market/chart/${encodeURIComponent(selectedSymbol)}?interval=1d&range=1y`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!isMounted) return;
        const bars: Array<{ high: number; low: number; close: number; volume: number }> = Array.isArray(data?.bars) ? data.bars : [];
        const closes = bars.map((b) => b.close);
        setBarTech((prev) => ({
          ...prev,
          [selectedSymbol]:
            bars.length >= 50
              ? { sma20: sma(closes, 20), sma50: sma(closes, 50), rsi14: rsi14(closes), vwap: vwap(bars, 20), volatility: annualVolatility(closes) }
              : null,
        }));
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [selectedSymbol]);

  const activeStock = useMemo(() => {
    const base = stocks.find((s) => s.symbol === selectedSymbol) ?? stocks[0];
    const livePrice = liveStockQuotes[selectedSymbol];
    if (livePrice && livePrice > 0) {
      // A live price beside bundled sample indicators contradicts itself (RELIANCE at 1,158 with a VWAP of 2,938),
      // so the indicators come from the real daily bars, or sit neutral at the live price until they arrive.
      const tech = barTech[selectedSymbol];
      return {
        ...base,
        ltp: livePrice,
        sma20: tech?.sma20 ?? livePrice,
        sma50: tech?.sma50 ?? livePrice,
        vwap: tech?.vwap ?? livePrice,
        rsi14: tech?.rsi14 ?? 50,
      };
    }
    return base;
  }, [stocks, selectedSymbol, liveStockQuotes, barTech]);

  const stockNewsList = useMemo(() => {
    const live = liveNewsMap[selectedSymbol];
    if (live && live.length > 0) return live;
    const matched = getNewsForStock(selectedSymbol);
    return matched.length > 0 ? matched : INDIAN_NEWS_FEEDS.slice(0, 5);
  }, [selectedSymbol, liveNewsMap]);

  const activeNewsItem = useMemo(() => {
    return (
      stockNewsList.find((n) => n.id === selectedNewsId) ??
      stockNewsList[0] ??
      null
    );
  }, [stockNewsList, selectedNewsId]);

  const activeTimeline: TimelineScenario | null = useMemo(() => {
    if (!analysisResult || !analysisResult.timelines) return null;
    return (
      analysisResult.timelines.find((t) => t.id === activeTimelineId) ??
      analysisResult.timelines[0] ??
      null
    );
  }, [analysisResult, activeTimelineId]);

  const tradeSide: "BUY" | "SELL" = useMemo(() => {
    if (activeTimelineId === "BEAR" || activeTimelineId === "BLACK_SWAN") {
      return "SELL";
    }
    return "BUY";
  }, [activeTimelineId]);

  // Nominal standard order turnover: approx ₹50,000 position
  const tradeTurnover = useMemo(() => {
    const qty = Math.max(1, Math.round(50000 / activeStock.ltp));
    return qty * activeStock.ltp;
  }, [activeStock.ltp]);

  const statutoryFriction = useMemo(() => {
    return calculateStatutoryFriction(tradeTurnover);
  }, [tradeTurnover]);

  const riskRewardRatio = useMemo(() => {
    if (!activeTimeline) return "1:2.0";
    const price = activeStock.ltp;
    const targetDiff = Math.abs(activeTimeline.targetPrice - price);
    const stopDiff = Math.max(0.1, Math.abs(price - activeTimeline.stopLossPrice));
    return `1:${(targetDiff / stopDiff).toFixed(2)}`;
  }, [activeStock.ltp, activeTimeline]);

  function handleSaveApiKey(key: string) {
    setApiKey(key);
    if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
      if (key.trim()) {
        localStorage.setItem("marketlens_ai_api_key", key);
      } else {
        localStorage.removeItem("marketlens_ai_api_key");
      }
    }
  }

  function handleProviderChange(provider: AIEngineProvider) {
    setSelectedProvider(provider);
    if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
      localStorage.setItem("marketlens_ai_provider", provider);
    }
  }

  function handleStockChange(newSymbol: string) {
    setSelectedSymbol(newSymbol);
    setSandboxText(getInitialConcallText(newSymbol));
    const news = getNewsForStock(newSymbol);
    setSelectedNewsId(news.length > 0 ? news[0].id : "");
    setTradeExecuted(false);
  }

  function handleResetSandbox() {
    setSandboxText(getInitialConcallText(selectedSymbol));
  }

  function handleSelectNews(item: IndianNewsItem) {
    setSelectedNewsId(item.id);
  }

  async function runStrategyAnalysis() {
    setIsAnalyzing(true);
    setProgressStep("Initializing institutional AI quantitative engine...");
    setTradeExecuted(false);

    try {
      const gatewayReq: AIGatewayRequest = {
        symbol: activeStock.symbol,
        provider: selectedProvider,
        apiKey: apiKey.trim(),
        newsHeadline: activeNewsItem?.title,
        customNewsText: sandboxText,
        strategyPreset: selectedStrategy === "CUSTOM" ? customPrompt : selectedStrategy,
        currentPrice: activeStock.ltp,
      };

      const stockTechData: StockTechnicalData = {
        ltp: activeStock.ltp,
        sma20: activeStock.sma20,
        sma50: activeStock.sma50,
        rsi: activeStock.rsi14,
        vwap: activeStock.vwap,
      };

      const response = await generateAIStrategyAnalysis(
        gatewayReq,
        stockTechData,
        (step) => setProgressStep(step)
      );

      // Calibrate timeline scenarios via quantitative scenario engine fallback
      if (!response.timelines || response.timelines.length === 0) {
        const fallbackEngine = generateTimelineScenarios({
          symbol: activeStock.symbol,
          ltp: activeStock.ltp,
          sma20: activeStock.sma20,
          sma50: activeStock.sma50,
          rsi: activeStock.rsi14,
          vwap: activeStock.vwap,
          sentimentScore: activeNewsItem?.sentimentScore ?? 0.0,
          newsHeadline: activeNewsItem?.title,
        });
        response.timelines = fallbackEngine.timelines;
      }

      setAnalysisResult(response);
      setAnalysisTimestamp(
        new Date().toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );

      // Select highest probability timeline by default
      let highestScenario = response.timelines[0];
      for (const t of response.timelines) {
        if (t.probabilityPercent > (highestScenario?.probabilityPercent ?? 0)) {
          highestScenario = t;
        }
      }
      const initialTimeline = highestScenario?.id ?? "BULL";
      setActiveTimelineId(initialTimeline);

      // Drift is an assumption set by the winning scenario. Volatility is measured from 1Y daily closes when we have them.
      const isBull = initialTimeline === "BULL" || initialTimeline === "BASE";
      const drift = isBull ? 0.14 : -0.09;
      const measuredVolatility = barTech[activeStock.symbol]?.volatility ?? null;
      const volatility = measuredVolatility ?? 0.22;
      setMcNote(
        `drift ${drift > 0 ? "+" : ""}${Math.round(drift * 100)}%/yr assumed · volatility ${Math.round(volatility * 100)}% ${
          measuredVolatility === null ? "assumed" : "measured from 1Y daily closes"
        }`
      );

      const simulation = runMonteCarloSimulation({
        symbol: activeStock.symbol,
        currentPrice: activeStock.ltp,
        simulatedDays: 30,
        totalPaths: 500,
        annualDrift: drift,
        annualVolatility: volatility,
        jumpIntensity: 0.04,
      });

      setMcResult(simulation);
    } catch (err) {
      console.error("[AIStrategyLab] Analysis failed:", err);
    } finally {
      setIsAnalyzing(false);
      setProgressStep("");
    }
  }

  function handleExecutePaperTrade() {
    if (!activeTimeline) return;
    onExecuteAITrade(activeStock.symbol, tradeSide, activeStock.ltp);
    setTradeExecuted(true);
  }

  const apiKeyHint = useMemo(() => {
    if (selectedProvider === "OFFLINE_HEURISTIC") {
      return "Using MarketLens built-in deterministic reasoning engine (no API key required).";
    }
    if (apiKey) {
      return `Using your ${selectedProvider} key. It is kept in this browser's localStorage as plain text, so do not use a shared computer.`;
    }
    return `Enter your ${selectedProvider} API key (kept in this browser's localStorage as plain text). Falls back to the offline engine if omitted.`;
  }, [selectedProvider, apiKey]);

  return (
    <div className="page-content" tabIndex={-1}>
      <header className="page-header">
        <h1>Hybrid AI Strategy Lab & Grok Reasoning Sandbox</h1>
        <p className="status-copy">
          Fine-tune and back-evaluate custom Indian stock strategies using our hybrid quantitative causal model and Grok-style reasoning stream. Test trade setups directly in the paper terminal.
        </p>
      </header>

      <div className="ai-lab-grid">
        {/* Left Column: Strategy Configurator, News Feeds & Concall Sandbox */}
        <section className="strategy-config-panel" aria-label="Strategy Configuration">
          <h2 className="panel-title">Strategy Rules & Prompt Sandbox</h2>

          {/* Symbol Select */}
          <div className="form-group">
            <label htmlFor="ai-stock-select">Target Indian Equity (NSE)</label>
            <select
              id="ai-stock-select"
              value={selectedSymbol}
              onChange={(e) => handleStockChange(e.target.value)}
            >
              {stocks.map((s) => (
                <option key={s.symbol} value={s.symbol}>
                  {s.symbol} — {s.name} (₹{s.ltp.toFixed(2)})
                </option>
              ))}
            </select>
          </div>

          {/* AI Engine Provider Selector */}
          <div className="form-group">
            <label htmlFor="ai-provider-select">AI Reasoning Engine Provider</label>
            <select
              id="ai-provider-select"
              value={selectedProvider}
              onChange={(e) => handleProviderChange(e.target.value as AIEngineProvider)}
            >
              {AI_PROVIDERS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
            <span className="input-hint">
              {AI_PROVIDERS.find((p) => p.id === selectedProvider)?.desc}
            </span>
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

          {/* API Key Input */}
          <div className="form-group">
            <label htmlFor="ai-api-key">
              {selectedProvider === "GROQ"
                ? "Groq Cloud API Key"
                : selectedProvider === "GEMINI"
                ? "Google Gemini API Key"
                : selectedProvider === "GROK"
                ? "xAI Grok API Key"
                : "External AI API Key (Optional)"}
            </label>
            <input
              id="ai-api-key"
              type="password"
              placeholder={
                selectedProvider === "OFFLINE_HEURISTIC"
                  ? "Not required for Offline Heuristic Engine"
                  : "Paste API key (gsk_..., AIza..., xai-...)"
              }
              value={apiKey}
              disabled={selectedProvider === "OFFLINE_HEURISTIC"}
              onChange={(e) => handleSaveApiKey(e.target.value)}
            />
            <span className="input-hint">{apiKeyHint}</span>
          </div>

          {/* Indian News Headlines Ticker */}
          <div className="form-group">
            <div className="ticker-label-row">
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <label>Indian News Feed & Sentiment Ticker</label>
                {liveNewsMap[selectedSymbol]?.length ? (
                  <span className="live-telemetry-badge">
                    ● Live Web Feed
                  </span>
                ) : isFetchingLiveNews ? (
                  <span className="live-telemetry-badge" style={{ opacity: 0.7 }}>
                    Fetching Live...
                  </span>
                ) : (
                  <span className="live-telemetry-badge" style={{ color: "var(--accent-amber, #f59e0b)" }}>
                    Sample headlines · live news unavailable
                  </span>
                )}
              </div>
              <span className="ticker-count-tag">{stockNewsList.length} Headlines</span>
            </div>
            <div className="news-feed-ticker" role="listbox" aria-label="Indian News Headlines">
              {stockNewsList.map((item) => {
                const isSelected = item.id === selectedNewsId;
                const sentimentClass =
                  item.sentimentLabel === "BULLISH"
                    ? "sentiment-bullish"
                    : item.sentimentLabel === "BEARISH"
                    ? "sentiment-bearish"
                    : "sentiment-neutral";

                return (
                  <div
                    key={item.id}
                    className={`news-ticker-item ${isSelected ? "active" : ""}`}
                    onClick={() => handleSelectNews(item)}
                    role="option"
                    aria-selected={isSelected}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        handleSelectNews(item);
                      }
                    }}
                  >
                    <div className="news-item-top">
                      <span className="news-source-tag">{item.source} • {item.category}</span>
                      <span className={`news-sentiment-badge ${sentimentClass}`}>
                        {item.sentimentLabel}
                      </span>
                    </div>
                    <p className="news-title">{item.title}</p>
                    <div className="news-meta">
                      <span>{new Date(item.publishedAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Interactive Concall & Regulatory Sandbox */}
          <div className="form-group">
            <div className="sandbox-header">
              <label htmlFor="concall-sandbox-input">Earnings Concall & Filings Sandbox</label>
              <button
                type="button"
                className="btn-reset-concall"
                onClick={handleResetSandbox}
                title="Restore default corporate concall preset for this stock"
              >
                Reset to Preset
              </button>
            </div>
            <textarea
              id="concall-sandbox-input"
              rows={5}
              value={sandboxText}
              onChange={(e) => setSandboxText(e.target.value)}
              placeholder="Paste or edit management earnings call quotes, forward guidance, or corporate filings..."
              className="sandbox-textarea"
            />
            <span className="input-hint">
              User edits are synthesized directly into corporate strategy deconstruction and scenario probability shifts.
            </span>
          </div>

          {/* Run Analysis Button & Progress */}
          <button
            type="button"
            className="btn-run-analysis"
            onClick={runStrategyAnalysis}
            disabled={isAnalyzing}
          >
            {isAnalyzing
              ? "Running Multi-Timeline AI Simulation..."
              : `Run AI Analysis on ${activeStock.symbol}`}
          </button>
          {liveStockQuotes[selectedSymbol] && !barTech[selectedSymbol] && (
            <p className="input-hint" role="status">
              Indicators unavailable: the feed returned no price history for {activeStock.symbol}, so scenarios use the price only.
            </p>
          )}
          {!liveStockQuotes[selectedSymbol] && (
            <p className="input-hint" role="status">
              Sample price: no live quote for {activeStock.symbol}, so targets and stops use bundled data.
            </p>
          )}

          {isAnalyzing && (
            <div className="ai-progress-status" role="status" aria-live="polite">
              <div className="ai-progress-spinner" />
              <span>{progressStep || "Evaluating technicals & corporate guidance..."}</span>
            </div>
          )}
        </section>

        {/* Right Column: AI Output, Multi-Timeline Tree, Monte Carlo Fan & Paper Trade */}
        <section className="ai-output-panel" aria-label="AI Reasoning and Output">
          <h2 className="panel-title">AI Strategy Reasoning Stream</h2>

          {!analysisResult ? (
            <div className="empty-ai-state">
              <div className="ai-orb-pulse" />
              <h3>Ready to Evaluate Strategy</h3>
              <p>
                Select an Indian stock, AI provider, and preset on the left, then click{" "}
                <strong>Run AI Analysis on {activeStock.symbol}</strong> to generate multi-timeline scenarios,
                Monte Carlo jump-diffusion paths, and paper trade setups with itemised statutory costs.
              </p>
            </div>
          ) : (
            <div className="ai-results-wrapper">
              {/* Top Banner: Signal & Active Timeline Probability */}
              <div className="ai-signal-banner">
                <div className="signal-left">
                  <span className="symbol-tag">{activeStock.symbol}</span>
                  <span
                    className={`bias-pill ${
                      tradeSide === "SELL" ? "bias-bearish" : "bias-bullish"
                    }`}
                  >
                    {activeTimeline?.id} TIMELINE ACTIVE
                  </span>
                  <span className="timeline-name-tag">{activeTimeline?.name}</span>
                </div>
                <div className="signal-right">
                  <span className="prob-label">Timeline Probability</span>
                  <span className="prob-val text-accent">
                    {activeTimeline?.probabilityPercent.toFixed(0)}%
                  </span>
                </div>
              </div>

              {/* 1. Multi-Timeline Branching Tree */}
              <div className="lab-section">
                <div className="section-header-row">
                  <h3 className="section-title">Multi-Timeline Scenario Branching (rule-based, not calibrated)</h3>
                  <span className="section-subtitle">
                    Select a scenario below to dynamically update quantitative targets, stop loss, and simulation fan
                  </span>
                </div>
                <TimelineBranchingTree
                  timelines={analysisResult.timelines}
                  activeTimelineId={activeTimelineId}
                  onSelectTimeline={(id) => {
                    setActiveTimelineId(id);
                    setTradeExecuted(false);
                  }}
                />
              </div>

              {/* 2. Monte Carlo Jump-Diffusion Fan Chart */}
              {mcResult && (
                <div className="lab-section">
                  <div className="section-header-row">
                    <h3 className="section-title">Monte Carlo Jump-Diffusion Simulation (30-Day Fan)</h3>
                    <span className="section-subtitle">
                      500 stochastic paths with Merton jump intensity, P5-P95 confidence ribbons, and target levels
                    </span>
                  </div>
                  <MonteCarloFanChart
                    result={mcResult}
                    selectedTarget={activeTimeline?.targetPrice}
                    selectedStopLoss={activeTimeline?.stopLossPrice}
                    assumptions={mcNote || undefined}
                  />
                </div>
              )}

              {/* 3. Corporate Strategy Deconstruction Card */}
              <div className="lab-section">
                <div className="section-header-row">
                  <h3 className="section-title">Corporate Strategy & Earnings Deconstruction</h3>
                  <span className="section-subtitle">
                    Management guidance, margin outlook, competitive moat, and identified tail risks
                  </span>
                </div>
                <CorporateStrategyCard
                  strategy={analysisResult.strategyDeconstruction}
                  symbol={activeStock.symbol}
                />
              </div>

              {/* 4. Chain of Thought Reasoning */}
              <div className="reasoning-card">
                <div className="reasoning-header">
                  <span className="reasoning-title">
                    Institutional AI Quantitative Rationale Stream ({selectedProvider})
                  </span>
                  <span className="timestamp-tag">{analysisTimestamp}</span>
                </div>
                <ul className="reasoning-list">
                  {analysisResult.reasoningSteps.map((step, idx) => (
                    <li key={idx} className="reasoning-step">
                      <span className="step-num">{idx + 1}</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>

                {activeTimeline && (
                  <div className="key-risk-block">
                    <span className="risk-title">Active Scenario Invalidation Condition:</span>
                    <p className="risk-desc">{activeTimeline.invalidationCondition}</p>
                  </div>
                )}
              </div>

              {/* 5. One-Click Paper Trade Bridge with SEBI Statutory Costs */}
              {activeTimeline && (
                <div className="paper-execution-bridge-card" aria-label="Paper Trade Bridge">
                  <div className="bridge-header">
                    <div>
                      <h3 className="bridge-title">1-Click Paper Trade Bridge</h3>
                      <p className="bridge-subtitle">
                        Direct execution bridge to Indian Paper Trading terminal with SEBI statutory schedule
                      </p>
                    </div>
                    <span className={`bridge-badge side-${tradeSide.toLowerCase()}`}>
                      {tradeSide} SIGNAL
                    </span>
                  </div>

                  {/* Trade Setup Matrix */}
                  <div className="setup-matrix-grid">
                    <div className="setup-cell">
                      <span className="cell-label">Entry Level (LTP)</span>
                      <span className="cell-val font-mono">₹{activeStock.ltp.toFixed(2)}</span>
                    </div>
                    <div className="setup-cell">
                      <span className="cell-label">Target Price</span>
                      <span className="cell-val text-gain font-mono">₹{activeTimeline.targetPrice.toFixed(2)}</span>
                    </div>
                    <div className="setup-cell">
                      <span className="cell-label">Stop-Loss</span>
                      <span className="cell-val text-loss font-mono">₹{activeTimeline.stopLossPrice.toFixed(2)}</span>
                    </div>
                    <div className="setup-cell">
                      <span className="cell-label">Risk : Reward</span>
                      <span className="cell-val text-accent font-mono">{riskRewardRatio}</span>
                    </div>
                  </div>

                  {/* Itemized Statutory Friction Breakdown */}
                  <div className="friction-card">
                    <div className="friction-title">
                      Estimated Indian Statutory Levies (Turnover: ₹{tradeTurnover.toLocaleString("en-IN", { maximumFractionDigits: 0 })})
                    </div>
                    <div className="friction-grid">
                      <div className="friction-cell">
                        <span className="f-label">Brokerage</span>
                        <span className="f-val font-mono">₹{statutoryFriction.brokerage.toFixed(2)}</span>
                      </div>
                      <div className="friction-cell">
                        <span className="f-label">STT (0.1%)</span>
                        <span className="f-val font-mono">₹{statutoryFriction.stt.toFixed(2)}</span>
                      </div>
                      <div className="friction-cell">
                        <span className="f-label">Stamp Duty</span>
                        <span className="f-val font-mono">₹{statutoryFriction.stampDuty.toFixed(2)}</span>
                      </div>
                      <div className="friction-cell">
                        <span className="f-label">Exchange & SEBI Fee</span>
                        <span className="f-val font-mono">₹{statutoryFriction.exchangeAndSebi.toFixed(2)}</span>
                      </div>
                      <div className="friction-cell">
                        <span className="f-label">GST (18%)</span>
                        <span className="f-val font-mono">₹{statutoryFriction.gst.toFixed(2)}</span>
                      </div>
                      <div className="friction-cell">
                        <span className="f-label">Total Levies</span>
                        <span className="f-val text-loss font-mono">
                          ₹{statutoryFriction.totalCharges.toFixed(2)} ({statutoryFriction.frictionPercent.toFixed(3)}%)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Execute Button */}
                  <button
                    type="button"
                    className={`btn-execute-ai-trade side-${tradeSide.toLowerCase()}`}
                    onClick={handleExecutePaperTrade}
                  >
                    Execute {tradeSide} Paper Trade on {activeStock.symbol} ({activeTimeline.name}) &rarr;
                  </button>

                  {tradeExecuted && (
                    <div className="trade-executed-pill" role="status">
                      ✓ Paper trade order dispatched to Paper Trading terminal: {tradeSide} {activeStock.symbol} @ ₹{activeStock.ltp.toFixed(2)}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
