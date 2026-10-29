import { useId, useMemo, useState } from "react";
import type { MonteCarloSimulationResult } from "../types/aiSimulation";

export interface MonteCarloFanChartProps {
  result: MonteCarloSimulationResult;
  selectedTarget?: number;
  selectedStopLoss?: number;
  /** What the drift and volatility are, in words (the page knows whether they were measured). */
  assumptions?: string;
}

export function MonteCarloFanChart({
  result,
  selectedTarget,
  selectedStopLoss,
  assumptions,
}: MonteCarloFanChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const gradientId = useId();

  // Guard against missing or empty ribbons
  const ribbons = result?.ribbons ?? [];
  const hasRibbons = ribbons.length > 0;

  const {
    minPrice,
    priceSpan,
    maxDay,
    yTicks,
    xTicks,
  } = useMemo(() => {
    if (!hasRibbons) {
      return {
        minPrice: 0,
        priceSpan: 100,
        maxDay: 30,
        yTicks: [],
        xTicks: [],
      };
    }

    const prices: number[] = [result.currentPrice];
    ribbons.forEach((r) => {
      prices.push(r.p5, r.p10, r.p50, r.p90, r.p95);
    });
    if (typeof selectedTarget === "number" && Number.isFinite(selectedTarget)) {
      prices.push(selectedTarget);
    }
    if (typeof selectedStopLoss === "number" && Number.isFinite(selectedStopLoss)) {
      prices.push(selectedStopLoss);
    }

    const rawMin = Math.min(...prices);
    const rawMax = Math.max(...prices);
    const span = rawMax - rawMin || 1;
    // 5% headroom top and bottom
    const pad = span * 0.05;
    const computedMin = Math.max(0.1, rawMin - pad);
    const computedMax = rawMax + pad;
    const computedSpan = computedMax - computedMin;

    const lastDay = ribbons[ribbons.length - 1]?.day || 30;

    // 5 horizontal y-ticks
    const ticks: number[] = [];
    for (let i = 0; i <= 4; i++) {
      ticks.push(computedMin + (computedSpan * i) / 4);
    }

    // X-axis ticks (intervals of 5 or 10 days)
    const step = lastDay <= 15 ? 3 : lastDay <= 35 ? 5 : 10;
    const xStepTicks: number[] = [];
    for (let d = 0; d <= lastDay; d += step) {
      xStepTicks.push(d);
    }
    if (xStepTicks[xStepTicks.length - 1] !== lastDay) {
      xStepTicks.push(lastDay);
    }

    return {
      minPrice: computedMin,
      maxPrice: computedMax,
      priceSpan: computedSpan,
      maxDay: lastDay,
      yTicks: ticks,
      xTicks: xStepTicks,
    };
  }, [hasRibbons, ribbons, result?.currentPrice, selectedTarget, selectedStopLoss]);

  // Coordinate scales for SVG (viewBox 0 0 800 360)
  const svgWidth = 800;
  const svgHeight = 360;
  const marginLeft = 65;
  const marginRight = 95;
  const marginTop = 24;
  const marginBottom = 34;
  const chartW = svgWidth - marginLeft - marginRight;
  const chartH = svgHeight - marginTop - marginBottom;

  const getX = (day: number) => marginLeft + (day / (maxDay || 1)) * chartW;
  const getY = (price: number) =>
    marginTop + (1 - (price - minPrice) / (priceSpan || 1)) * chartH;

  // Paths
  const paths = useMemo(() => {
    if (!hasRibbons) return { ribbon90: "", ribbon80: "", median: "", var95: "", p95: "" };

    // 90% Confidence Interval (p5 to p95)
    const p5Forward = ribbons.map((r) => `${getX(r.day).toFixed(1)},${getY(r.p5).toFixed(1)}`);
    const p95Reverse = ribbons
      .slice()
      .reverse()
      .map((r) => `${getX(r.day).toFixed(1)},${getY(r.p95).toFixed(1)}`);
    const ribbon90 = `M ${p5Forward.join(" L ")} L ${p95Reverse.join(" L ")} Z`;

    // 80% Confidence Interval (p10 to p90)
    const p10Forward = ribbons.map((r) => `${getX(r.day).toFixed(1)},${getY(r.p10).toFixed(1)}`);
    const p90Reverse = ribbons
      .slice()
      .reverse()
      .map((r) => `${getX(r.day).toFixed(1)},${getY(r.p90).toFixed(1)}`);
    const ribbon80 = `M ${p10Forward.join(" L ")} L ${p90Reverse.join(" L ")} Z`;

    // Median path (p50)
    const median = `M ${ribbons
      .map((r) => `${getX(r.day).toFixed(1)},${getY(r.p50).toFixed(1)}`)
      .join(" L ")}`;

    // 95% VaR downside boundary (p5)
    const var95 = `M ${ribbons
      .map((r) => `${getX(r.day).toFixed(1)},${getY(r.p5).toFixed(1)}`)
      .join(" L ")}`;

    // 95% upper trajectory boundary (p95)
    const p95 = `M ${ribbons
      .map((r) => `${getX(r.day).toFixed(1)},${getY(r.p95).toFixed(1)}`)
      .join(" L ")}`;

    return { ribbon90, ribbon80, median, var95, p95 };
  }, [hasRibbons, ribbons, minPrice, priceSpan, maxDay]);

  // Pointer move handler to inspect trajectory at any day
  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!hasRibbons) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const normalizedSvgX = (clientX / rect.width) * svgWidth;
    const dayRatio = (normalizedSvgX - marginLeft) / chartW;
    const clampedDay = Math.min(
      maxDay,
      Math.max(0, Math.round(dayRatio * maxDay))
    );
    const closestIdx = ribbons.findIndex((r) => r.day === clampedDay);
    if (closestIdx !== -1) {
      setHoverIndex(closestIdx);
    }
  };

  const handlePointerLeave = () => {
    setHoverIndex(null);
  };

  // Metrics calculations
  const terminalDiff = result.medianTerminalPrice - result.currentPrice;
  const terminalDiffPercent = (terminalDiff / (result.currentPrice || 1)) * 100;
  // valueAtRisk*Percent are percentage losses (10 means -10%), not prices: show the price floor beside them.
  const var95Floor = result.currentPrice * (1 - result.valueAtRisk95Percent / 100);
  const var99Floor = result.currentPrice * (1 - result.valueAtRisk99Percent / 100);
  const profitPct = (result.probabilityProfit * 100);

  const activeHoverRibbon = hoverIndex !== null ? ribbons[hoverIndex] : null;

  if (!hasRibbons) {
    return (
      <div
        className="monte-carlo-fan-container"
        style={{
          background: "var(--bg-surface, #161b22)",
          border: "1px solid var(--border-default, #30363d)",
          borderRadius: "6px",
          padding: "24px",
          color: "var(--text-secondary, #8b949e)",
          textAlign: "center",
        }}
      >
        <p>No Monte Carlo simulation data available for {result?.symbol || "symbol"}.</p>
      </div>
    );
  }

  return (
    <section
      className="monte-carlo-fan-container"
      aria-label={`Monte Carlo Jump-Diffusion Fan Chart for ${result.symbol}`}
      style={{
        background: "var(--bg-surface, #161b22)",
        border: "1px solid var(--border-default, #30363d)",
        borderRadius: "6px",
        padding: "16px 20px",
        color: "var(--text-primary, #e6edf3)",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
      }}
    >
      {/* Header and Title */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          borderBottom: "1px solid var(--border-default, #30363d)",
          paddingBottom: "12px",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span
              style={{
                display: "inline-block",
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: "#388bfd",
              }}
              aria-hidden="true"
            />
            <h3
              style={{
                fontSize: "14px",
                fontWeight: 600,
                letterSpacing: "0.02em",
                margin: 0,
                color: "var(--text-primary, #e6edf3)",
              }}
            >
              Monte Carlo Jump-Diffusion Fan Chart
            </h3>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 600,
                padding: "2px 6px",
                borderRadius: "4px",
                background: "rgba(56, 139, 253, 0.12)",
                color: "var(--accent-blue, #388bfd)",
                border: "1px solid rgba(56, 139, 253, 0.25)",
                fontFamily: "var(--font-figures)",
              }}
            >
              {result.symbol}
            </span>
          </div>
          <p
            style={{
              fontSize: "12px",
              color: "var(--text-secondary, #8b949e)",
              margin: "4px 0 0 0",
            }}
          >
            {result.totalPaths.toLocaleString()} Merton jump-diffusion paths · {result.simulatedDays}-day horizon · {assumptions ?? "drift and volatility are assumptions"}
          </p>
        </div>

        {/* Legend */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "14px",
            fontSize: "11px",
            color: "var(--text-secondary, #8b949e)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span
              style={{
                width: "14px",
                height: "8px",
                borderRadius: "2px",
                background: "rgba(56, 139, 253, 0.2)",
                border: "1px solid rgba(56, 139, 253, 0.4)",
              }}
              aria-hidden="true"
            />
            <span>80% CI (p10–p90)</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span
              style={{
                width: "14px",
                height: "2px",
                background: "#388bfd",
              }}
              aria-hidden="true"
            />
            <span>Median (p50)</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span
              style={{
                width: "14px",
                height: "2px",
                borderTop: "2px dashed #d29922",
              }}
              aria-hidden="true"
            />
            <span>95% VaR (p5)</span>
          </div>
          {typeof selectedTarget === "number" && (
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span
                style={{
                  width: "14px",
                  height: "2px",
                  borderTop: "2px dashed #3fb950",
                }}
                aria-hidden="true"
              />
              <span style={{ color: "#3fb950" }}>Target</span>
            </div>
          )}
          {typeof selectedStopLoss === "number" && (
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span
                style={{
                  width: "14px",
                  height: "2px",
                  borderTop: "2px dashed #f85149",
                }}
                aria-hidden="true"
              />
              <span style={{ color: "#f85149" }}>Stop Loss</span>
            </div>
          )}
        </div>
      </div>

      {/* Summary Metrics Badge Bar (4 Cards) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
          gap: "10px",
        }}
      >
        {/* Median Terminal */}
        <div
          style={{
            background: "var(--bg-ground, #0d1117)",
            border: "1px solid var(--border-default, #30363d)",
            borderRadius: "6px",
            padding: "10px 12px",
          }}
        >
          <div style={{ fontSize: "11px", color: "var(--text-tertiary, #6e7681)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            Median Terminal Price
          </div>
          <div
            style={{
              fontSize: "16px",
              fontWeight: 700,
              color: "var(--accent-blue, #388bfd)",
              fontFamily: "var(--font-figures)",
              fontVariantNumeric: "tabular-nums",
              marginTop: "3px",
            }}
          >
            ₹{result.medianTerminalPrice.toFixed(2)}
          </div>
          <div
            style={{
              fontSize: "11px",
              color: terminalDiff >= 0 ? "var(--trade-gain, #3fb950)" : "var(--trade-loss, #f85149)",
              fontWeight: 600,
              fontFamily: "var(--font-figures)",
              fontVariantNumeric: "tabular-nums",
              marginTop: "2px",
            }}
          >
            {terminalDiff >= 0 ? "+" : ""}
            {terminalDiffPercent.toFixed(2)}% expected
          </div>
        </div>

        {/* Probability of Profit */}
        <div
          style={{
            background: "var(--bg-ground, #0d1117)",
            border: "1px solid var(--border-default, #30363d)",
            borderRadius: "6px",
            padding: "10px 12px",
          }}
        >
          <div style={{ fontSize: "11px", color: "var(--text-tertiary, #6e7681)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            Probability of Profit
          </div>
          <div
            style={{
              fontSize: "16px",
              fontWeight: 700,
              color: profitPct >= 50 ? "var(--trade-gain, #3fb950)" : "#d29922",
              fontFamily: "var(--font-figures)",
              fontVariantNumeric: "tabular-nums",
              marginTop: "3px",
            }}
          >
            {profitPct.toFixed(1)}%
          </div>
          <div style={{ fontSize: "11px", color: "var(--text-secondary, #8b949e)", marginTop: "2px" }}>
            {profitPct >= 50 ? "Favorable Odds (Bull Edge)" : "Defensive Odds (Base/Bear)"}
          </div>
        </div>

        {/* 95% VaR Loss Limit */}
        <div
          style={{
            background: "var(--bg-ground, #0d1117)",
            border: "1px solid var(--border-default, #30363d)",
            borderRadius: "6px",
            padding: "10px 12px",
          }}
        >
          <div style={{ fontSize: "11px", color: "var(--text-tertiary, #6e7681)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            95% Value-at-Risk (p5)
          </div>
          <div
            style={{
              fontSize: "16px",
              fontWeight: 700,
              color: "#d29922",
              fontFamily: "var(--font-figures)",
              fontVariantNumeric: "tabular-nums",
              marginTop: "3px",
            }}
          >
            ₹{var95Floor.toFixed(2)}
          </div>
          <div style={{ fontSize: "11px", color: "#d29922", fontWeight: 600, fontFamily: "var(--font-figures)", fontVariantNumeric: "tabular-nums", marginTop: "2px" }}>
            -{result.valueAtRisk95Percent.toFixed(2)}% tail loss floor
          </div>
        </div>

        {/* 99% VaR Tail Risk */}
        <div
          style={{
            background: "var(--bg-ground, #0d1117)",
            border: "1px solid var(--border-default, #30363d)",
            borderRadius: "6px",
            padding: "10px 12px",
          }}
        >
          <div style={{ fontSize: "11px", color: "var(--text-tertiary, #6e7681)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            99% VaR Tail Risk (p1)
          </div>
          <div
            style={{
              fontSize: "16px",
              fontWeight: 700,
              color: "var(--trade-loss, #f85149)",
              fontFamily: "var(--font-figures)",
              fontVariantNumeric: "tabular-nums",
              marginTop: "3px",
            }}
          >
            ₹{var99Floor.toFixed(2)}
          </div>
          <div style={{ fontSize: "11px", color: "var(--trade-loss, #f85149)", fontWeight: 600, fontFamily: "var(--font-figures)", fontVariantNumeric: "tabular-nums", marginTop: "2px" }}>
            -{result.valueAtRisk99Percent.toFixed(2)}% extreme shock
          </div>
        </div>
      </div>

      {/* Dynamic Hover Inspector Banner (if hovering) */}
      <div
        style={{
          minHeight: "24px",
          fontSize: "12px",
          color: activeHoverRibbon ? "var(--text-primary, #e6edf3)" : "var(--text-tertiary, #6e7681)",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "4px 8px",
          background: activeHoverRibbon ? "var(--bg-ground, #0d1117)" : "transparent",
          border: activeHoverRibbon ? "1px solid var(--border-default, #30363d)" : "1px solid transparent",
          borderRadius: "4px",
          fontFamily: "var(--font-figures)",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {activeHoverRibbon ? (
          <>
            <span style={{ color: "var(--accent-blue, #388bfd)", fontWeight: 700 }}>
              Day {activeHoverRibbon.day}:
            </span>
            <span>
              Median: <strong style={{ color: "var(--accent-blue, #388bfd)" }}>₹{activeHoverRibbon.p50.toFixed(2)}</strong>
            </span>
            <span>
              80% CI: <strong style={{ color: "var(--text-secondary, #8b949e)" }}>₹{activeHoverRibbon.p10.toFixed(2)} – ₹{activeHoverRibbon.p90.toFixed(2)}</strong>
            </span>
            <span>
              95% VaR: <strong style={{ color: "#d29922" }}>₹{activeHoverRibbon.p5.toFixed(2)}</strong>
            </span>
            <span>
              p95 High: <strong style={{ color: "var(--trade-gain, #3fb950)" }}>₹{activeHoverRibbon.p95.toFixed(2)}</strong>
            </span>
          </>
        ) : (
          <span>Hover or drag along chart to inspect day-by-day confidence intervals</span>
        )}
      </div>

      {/* SVG Fan Chart Visualization */}
      <div style={{ position: "relative", width: "100%", overflow: "hidden" }}>
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label={`Monte Carlo trajectory chart for ${result.symbol}`}
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
          style={{
            width: "100%",
            height: "auto",
            display: "block",
            cursor: "crosshair",
            userSelect: "none",
          }}
        >
          <defs>
            {/* Linear gradient for 80% CI ribbon */}
            <linearGradient id={`fanGrad80-${gradientId}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#388bfd" stopOpacity="0.20" />
              <stop offset="100%" stopColor="#388bfd" stopOpacity="0.10" />
            </linearGradient>
            {/* Linear gradient for 90% CI ribbon */}
            <linearGradient id={`fanGrad90-${gradientId}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#388bfd" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#388bfd" stopOpacity="0.03" />
            </linearGradient>
          </defs>

          {/* Background Grid Lines (Horizontal Y-Ticks) */}
          {yTicks.map((price, idx) => {
            const y = getY(price);
            return (
              <g key={`y-grid-${idx}`}>
                <line
                  x1={marginLeft}
                  y1={y}
                  x2={marginLeft + chartW}
                  y2={y}
                  stroke="#21262d"
                  strokeWidth="1"
                />
                <text
                  x={marginLeft - 8}
                  y={y + 3.5}
                  textAnchor="end"
                  fill="#8b949e"
                  fontSize="10"
                  fontFamily="var(--font-figures)"
                >
                  ₹{price.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                </text>
              </g>
            );
          })}

          {/* Vertical X-Ticks (Days) */}
          {xTicks.map((day) => {
            const x = getX(day);
            return (
              <g key={`x-grid-${day}`}>
                <line
                  x1={x}
                  y1={marginTop}
                  x2={x}
                  y2={marginTop + chartH}
                  stroke="rgba(48, 54, 61, 0.45)"
                  strokeWidth="1"
                  strokeDasharray="2 3"
                />
                <text
                  x={x}
                  y={marginTop + chartH + 18}
                  textAnchor="middle"
                  fill="#8b949e"
                  fontSize="10"
                  fontFamily="var(--font-figures)"
                >
                  D{day}
                </text>
              </g>
            );
          })}

          {/* Outer 90% Confidence Interval Ribbon (p5 to p95) */}
          <path
            d={paths.ribbon90}
            fill={`url(#fanGrad90-${gradientId})`}
            stroke="none"
          />

          {/* Inner 80% Confidence Interval Ribbon (p10 to p90) */}
          <path
            d={paths.ribbon80}
            fill={`url(#fanGrad80-${gradientId})`}
            stroke="none"
          />

          {/* p95 Upper Trajectory Boundary */}
          <path
            d={paths.p95}
            fill="none"
            stroke="rgba(56, 139, 253, 0.4)"
            strokeWidth="1"
            strokeDasharray="3 3"
          />

          {/* 95% VaR (p5) Downside Boundary */}
          <path
            d={paths.var95}
            fill="none"
            stroke="#d29922"
            strokeWidth="1.5"
            strokeDasharray="4 3"
          />

          {/* Median Trajectory (p50) */}
          <path
            d={paths.median}
            fill="none"
            stroke="#388bfd"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Current LTP Baseline */}
          <line
            x1={marginLeft}
            y1={getY(result.currentPrice)}
            x2={marginLeft + chartW}
            y2={getY(result.currentPrice)}
            stroke="rgba(110, 118, 129, 0.4)"
            strokeWidth="1"
            strokeDasharray="2 2"
          />
          <text
            x={marginLeft + chartW + 6}
            y={getY(result.currentPrice) + 3.5}
            fill="#8b949e"
            fontSize="10"
            fontFamily="var(--font-figures)"
          >
            LTP ₹{result.currentPrice.toFixed(0)}
          </text>

          {/* Selected Target Horizontal Line (if provided) */}
          {typeof selectedTarget === "number" && (
            <g>
              <line
                x1={marginLeft}
                y1={getY(selectedTarget)}
                x2={marginLeft + chartW}
                y2={getY(selectedTarget)}
                stroke="#3fb950"
                strokeWidth="1.5"
                strokeDasharray="4 3"
              />
              <text
                x={marginLeft + chartW + 6}
                y={getY(selectedTarget) + 3.5}
                fill="#3fb950"
                fontSize="10"
                fontWeight="600"
                fontFamily="var(--font-figures)"
              >
                TGT ₹{selectedTarget.toFixed(0)}
              </text>
            </g>
          )}

          {/* Selected Stop Loss Horizontal Line (if provided) */}
          {typeof selectedStopLoss === "number" && (
            <g>
              <line
                x1={marginLeft}
                y1={getY(selectedStopLoss)}
                x2={marginLeft + chartW}
                y2={getY(selectedStopLoss)}
                stroke="#f85149"
                strokeWidth="1.5"
                strokeDasharray="4 3"
              />
              <text
                x={marginLeft + chartW + 6}
                y={getY(selectedStopLoss) + 3.5}
                fill="#f85149"
                fontSize="10"
                fontWeight="600"
                fontFamily="var(--font-figures)"
              >
                SL ₹{selectedStopLoss.toFixed(0)}
              </text>
            </g>
          )}

          {/* Day 0 Anchor Node */}
          <circle
            cx={getX(0)}
            cy={getY(result.currentPrice)}
            r="4"
            fill="#388bfd"
            stroke="#0d1117"
            strokeWidth="1.5"
          />

          {/* Interactive Crosshair & Cursor Dots (on hover) */}
          {activeHoverRibbon && (
            <g>
              <line
                x1={getX(activeHoverRibbon.day)}
                y1={marginTop}
                x2={getX(activeHoverRibbon.day)}
                y2={marginTop + chartH}
                stroke="rgba(230, 237, 243, 0.3)"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
              {/* Dots at p90, p50, p10, p5 */}
              <circle
                cx={getX(activeHoverRibbon.day)}
                cy={getY(activeHoverRibbon.p90)}
                r="3"
                fill="#388bfd"
              />
              <circle
                cx={getX(activeHoverRibbon.day)}
                cy={getY(activeHoverRibbon.p50)}
                r="4"
                fill="#388bfd"
                stroke="#0d1117"
                strokeWidth="1.5"
              />
              <circle
                cx={getX(activeHoverRibbon.day)}
                cy={getY(activeHoverRibbon.p10)}
                r="3"
                fill="#388bfd"
              />
              <circle
                cx={getX(activeHoverRibbon.day)}
                cy={getY(activeHoverRibbon.p5)}
                r="3.5"
                fill="#d29922"
              />
            </g>
          )}
        </svg>
      </div>

      {/* Screen-reader accessible summary */}
      <div style={{ position: "absolute", width: "1px", height: "1px", overflow: "hidden", clip: "rect(0 0 0 0)" }}>
        Monte Carlo simulation results for {result.symbol}: {result.totalPaths} paths over {result.simulatedDays} days.
        Current price ₹{result.currentPrice.toFixed(2)}, Median terminal ₹{result.medianTerminalPrice.toFixed(2)},
        Probability of profit {(result.probabilityProfit * 100).toFixed(1)}%,
        95% VaR loss limit {result.valueAtRisk95Percent.toFixed(2)}% (price floor ₹{var95Floor.toFixed(2)}),
        99% VaR tail limit {result.valueAtRisk99Percent.toFixed(2)}% (price floor ₹{var99Floor.toFixed(2)}).
      </div>
    </section>
  );
}

export default MonteCarloFanChart;
