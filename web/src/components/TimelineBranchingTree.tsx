import { useMemo } from "react";
import type { TimelineScenario, TimelineScenarioId } from "../types/aiSimulation";

export interface TimelineBranchingTreeProps {
  timelines: TimelineScenario[];
  activeTimelineId: TimelineScenarioId;
  onSelectTimeline: (id: TimelineScenarioId) => void;
}

interface ScenarioTheme {
  label: string;
  badgeLabel: string;
  icon: string;
  accent: string;
  accentBg: string;
  borderHover: string;
  glow: string;
  description: string;
}

const SCENARIO_THEMES: Record<TimelineScenarioId, ScenarioTheme> = {
  BULL: {
    label: "Bullish Expansion",
    badgeLabel: "BULL",
    icon: "▲",
    accent: "#3fb950",
    accentBg: "rgba(63, 185, 80, 0.12)",
    borderHover: "#3fb950",
    glow: "none",
    description: "Upside breakout, margin expansion & institutional accumulation",
  },
  BASE: {
    label: "Base Consolidation",
    badgeLabel: "BASE",
    icon: "◆",
    accent: "#388bfd",
    accentBg: "rgba(56, 139, 253, 0.12)",
    borderHover: "#388bfd",
    glow: "none",
    description: "VWAP mean-reversion, rangebound accumulation & steady earnings",
  },
  BEAR: {
    label: "Bearish Breakdown",
    badgeLabel: "BEAR",
    icon: "▼",
    accent: "#d29922",
    accentBg: "rgba(210, 153, 34, 0.12)",
    borderHover: "#d29922",
    glow: "none",
    description: "Support violation, multiple contraction & margin compression",
  },
  BLACK_SWAN: {
    label: "Black Swan Shock",
    badgeLabel: "BLACK SWAN",
    icon: "⚡",
    accent: "#f85149",
    accentBg: "rgba(248, 81, 73, 0.12)",
    borderHover: "#f85149",
    glow: "none",
    description: "Exogenous tail-risk event, regulatory action or systemic liquidation",
  },
};

const CANONICAL_ORDER: TimelineScenarioId[] = ["BULL", "BASE", "BEAR", "BLACK_SWAN"];

export function TimelineBranchingTree({
  timelines,
  activeTimelineId,
  onSelectTimeline,
}: TimelineBranchingTreeProps) {
  // Order timelines canonically
  const orderedTimelines = useMemo(() => {
    const list = Array.isArray(timelines) ? [...timelines] : [];
    return list.sort((a, b) => {
      const idxA = CANONICAL_ORDER.indexOf(a.id);
      const idxB = CANONICAL_ORDER.indexOf(b.id);
      return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB);
    });
  }, [timelines]);

  if (!orderedTimelines.length) {
    return (
      <div
        className="timeline-branching-tree"
        style={{
          background: "var(--bg-surface, #161b22)",
          border: "1px solid var(--border-default, #30363d)",
          borderRadius: "6px",
          padding: "24px",
          color: "var(--text-secondary, #8b949e)",
          textAlign: "center",
        }}
      >
        <p>No multi-timeline scenarios available.</p>
      </div>
    );
  }

  return (
    <section
      className="timeline-branching-tree"
      aria-label="Multi-Timeline Scenario Branching Tree"
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
      {/* Header */}
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
              Multi-Timeline Branching Tree
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
              4 Branches · 100% Calibrated
            </span>
          </div>
          <p
            style={{
              fontSize: "12px",
              color: "var(--text-secondary, #8b949e)",
              margin: "4px 0 0 0",
            }}
          >
            Click a timeline branch to anchor target/stop orders and adjust Monte Carlo fan chart projection.
          </p>
        </div>

        <div style={{ fontSize: "11px", color: "var(--text-tertiary, #6e7681)" }}>
          Selected: <strong style={{ color: SCENARIO_THEMES[activeTimelineId]?.accent || "#388bfd" }}>
            {SCENARIO_THEMES[activeTimelineId]?.label || activeTimelineId}
          </strong>
        </div>
      </div>

      {/* Visual Branching Tree SVG Diagram */}
      <div
        style={{
          background: "var(--bg-ground, #0d1117)",
          border: "1px solid var(--border-default, #30363d)",
          borderRadius: "6px",
          padding: "10px 14px",
          overflow: "hidden",
        }}
      >
        <svg
          viewBox="0 0 760 110"
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label="Branching tree diagram connecting decision node to four scenarios"
          style={{ width: "100%", height: "auto", display: "block" }}
        >
          {/* Origin Node (Left) */}
          <g>
            <circle cx="50" cy="55" r="14" fill="#161b22" stroke="#388bfd" strokeWidth="1.5" />
            <circle cx="50" cy="55" r="4" fill="#388bfd" />
            <text x="50" y="85" textAnchor="middle" fill="#8b949e" fontSize="10" fontWeight="600" fontFamily="var(--font-interface)">
              LTP Origin
            </text>
          </g>

          {/* Branch Curves & Scenario Nodes */}
          {orderedTimelines.map((sc, index) => {
            const theme = SCENARIO_THEMES[sc.id] || SCENARIO_THEMES.BASE;
            const isActive = sc.id === activeTimelineId;

            // Compute Y target positions: index 0 (top) to index 3 (bottom)
            const targetY = 20 + index * 24; // 20, 44, 68, 92
            const targetX = 640;

            // Bézier curve from (64, 55) to (targetX - 70, targetY)
            const dCurve = `M 64 55 C 240 55, 340 ${targetY}, ${targetX - 70} ${targetY}`;

            return (
              <g
                key={`branch-${sc.id}`}
                onClick={() => onSelectTimeline(sc.id)}
                style={{ cursor: "pointer" }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelectTimeline(sc.id);
                  }
                }}
                aria-label={`Select branch ${sc.name}`}
              >
                {/* Branch line */}
                <path
                  d={dCurve}
                  fill="none"
                  stroke={theme.accent}
                  strokeWidth={isActive ? 2.5 : 1}
                  strokeOpacity={isActive ? 1 : 0.4}
                  strokeDasharray={isActive ? "none" : "3 2"}
                />

                {/* Node Box */}
                <rect
                  x={targetX - 60}
                  y={targetY - 10}
                  width="160"
                  height="20"
                  rx="3"
                  fill={isActive ? theme.accentBg : "#161b22"}
                  stroke={isActive ? theme.accent : "#30363d"}
                  strokeWidth={isActive ? 1.5 : 1}
                />

                {/* Text: ID & Probability */}
                <text
                  x={targetX - 50}
                  y={targetY + 4}
                  fill={theme.accent}
                  fontSize="11"
                  fontWeight="600"
                  fontFamily="var(--font-interface)"
                >
                  {theme.icon} {theme.badgeLabel}
                </text>
                <text
                  x={targetX + 85}
                  y={targetY + 4}
                  textAnchor="end"
                  fill={isActive ? "#e6edf3" : "#8b949e"}
                  fontSize="10"
                  fontWeight="600"
                  fontFamily="var(--font-figures)"
                >
                  {sc.probabilityPercent}% prob
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* 4-Card Responsive Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "14px",
        }}
      >
        {orderedTimelines.map((scenario) => {
          const theme = SCENARIO_THEMES[scenario.id] || SCENARIO_THEMES.BASE;
          const isActive = scenario.id === activeTimelineId;

          return (
            <div
              key={scenario.id}
              role="button"
              tabIndex={0}
              aria-pressed={isActive}
              onClick={() => onSelectTimeline(scenario.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelectTimeline(scenario.id);
                }
              }}
              style={{
                background: isActive ? "var(--bg-subtle, #21262d)" : "var(--bg-ground, #0d1117)",
                border: `1px solid ${isActive ? theme.accent : "var(--border-default, #30363d)"}`,
                borderRadius: "6px",
                padding: "14px 16px",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                cursor: "pointer",
                transition: "border-color 0.15s ease, background 0.15s ease",
                position: "relative",
              }}
            >
              {/* Card Top Row: Badge & Probability */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "8px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 600,
                      padding: "2px 8px",
                      borderRadius: "3px",
                      background: theme.accentBg,
                      color: theme.accent,
                      border: `1px solid ${theme.accent}`,
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <span>{theme.icon}</span>
                    <span>{theme.badgeLabel}</span>
                  </span>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 600,
                      color: "var(--text-secondary, #8b949e)",
                      fontFamily: "var(--font-figures)",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {scenario.probabilityPercent}%
                  </span>
                </div>

                {isActive ? (
                  <span
                    style={{
                      fontSize: "10px",
                      fontWeight: 700,
                      letterSpacing: "0.04em",
                      textTransform: "uppercase",
                      padding: "2px 6px",
                      borderRadius: "3px",
                      background: theme.accent,
                      color: "#0d1117",
                    }}
                  >
                    Active
                  </span>
                ) : (
                  <span
                    style={{
                      fontSize: "10px",
                      color: "var(--text-tertiary, #6e7681)",
                    }}
                  >
                    Click to select
                  </span>
                )}
              </div>

              {/* Scenario Name & Description */}
              <div>
                <h4
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    margin: 0,
                    color: "var(--text-primary, #e6edf3)",
                  }}
                >
                  {scenario.name}
                </h4>
                <div
                  style={{
                    fontSize: "16px",
                    fontWeight: 700,
                    color: theme.accent,
                    marginTop: "4px",
                    fontFamily: "var(--font-figures)",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {scenario.expectedReturnRange}
                </div>
              </div>

              {/* Key Price Levels */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "8px",
                  background: "var(--bg-surface, #161b22)",
                  border: "1px solid var(--border-default, #30363d)",
                  borderRadius: "4px",
                  padding: "8px 10px",
                  fontFamily: "var(--font-figures)",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                <div>
                  <div style={{ fontSize: "10px", color: "var(--text-tertiary, #6e7681)", textTransform: "uppercase" }}>
                    Target Price
                  </div>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--trade-gain, #3fb950)", marginTop: "2px" }}>
                    ₹{scenario.targetPrice.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "10px", color: "var(--text-tertiary, #6e7681)", textTransform: "uppercase" }}>
                    Stop Loss Price
                  </div>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--trade-loss, #f85149)", marginTop: "2px" }}>
                    ₹{scenario.stopLossPrice.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
              </div>

              {/* Catalyst Triggers */}
              {scenario.catalystTriggers && scenario.catalystTriggers.length > 0 && (
                <div>
                  <div
                    style={{
                      fontSize: "10px",
                      fontWeight: 600,
                      color: "var(--text-secondary, #8b949e)",
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                      marginBottom: "6px",
                    }}
                  >
                    Catalysts & Drivers
                  </div>
                  <ul
                    style={{
                      listStyle: "none",
                      padding: 0,
                      margin: 0,
                      display: "flex",
                      flexDirection: "column",
                      gap: "4px",
                      fontSize: "11px",
                      color: "var(--text-secondary, #8b949e)",
                    }}
                  >
                    {scenario.catalystTriggers.map((cat, i) => (
                      <li
                        key={i}
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: "6px",
                          lineHeight: "1.35",
                        }}
                      >
                        <span style={{ color: theme.accent, flexShrink: 0, marginTop: "1px" }}>•</span>
                        <span>{cat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Invalidation Condition Box */}
              {scenario.invalidationCondition && (
                <div
                  style={{
                    background: "rgba(210, 153, 34, 0.08)",
                    border: "1px solid rgba(210, 153, 34, 0.25)",
                    borderRadius: "4px",
                    padding: "6px 8px",
                    fontSize: "11px",
                    color: "#d29922",
                    lineHeight: "1.35",
                  }}
                >
                  <strong style={{ display: "block", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.03em", marginBottom: "2px" }}>
                    Thesis Invalidation Condition
                  </strong>
                  {scenario.invalidationCondition}
                </div>
              )}

              {/* Statutory Friction Estimate */}
              <div
                style={{
                  marginTop: "auto",
                  paddingTop: "6px",
                  borderTop: "1px solid var(--border-muted, #21262d)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  fontSize: "10px",
                  color: "var(--text-tertiary, #6e7681)",
                }}
              >
                <span>SEBI / Exchange Levies:</span>
                <span style={{ color: "var(--text-secondary, #8b949e)", fontWeight: 600, fontFamily: "var(--font-figures)", fontVariantNumeric: "tabular-nums" }}>
                  ~{scenario.estimatedFrictionPercent.toFixed(2)}% friction
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default TimelineBranchingTree;
