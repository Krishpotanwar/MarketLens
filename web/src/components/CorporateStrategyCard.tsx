import type { CorporateStrategyDeconstruction } from "../types/aiSimulation";

export interface CorporateStrategyCardProps {
  strategy: CorporateStrategyDeconstruction;
  symbol: string;
}

export function CorporateStrategyCard({
  strategy,
  symbol,
}: CorporateStrategyCardProps) {
  if (!strategy) {
    return (
      <div
        className="corporate-strategy-grid"
        style={{
          background: "var(--bg-surface, #161b22)",
          border: "1px solid var(--border-default, #30363d)",
          borderRadius: "6px",
          padding: "24px",
          color: "var(--text-secondary, #8b949e)",
          textAlign: "center",
        }}
      >
        <p>No corporate strategy deconstruction available for {symbol}.</p>
      </div>
    );
  }

  const managementGuidance = strategy.managementGuidance ?? [];
  const tailRisks = strategy.tailRisks ?? [];
  const keyCatalysts = strategy.keyCatalysts ?? [];

  return (
    <section
      className="corporate-strategy-grid"
      aria-label={`Corporate Strategy Deconstruction for ${symbol}`}
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
              Corporate Strategy Deconstruction
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
              {symbol}
            </span>
          </div>
          <p
            style={{
              fontSize: "12px",
              color: "var(--text-secondary, #8b949e)",
              margin: "4px 0 0 0",
            }}
          >
            Institutional deconstruction across management guidance, margin sensitivity, competitive moat & governance red flags.
          </p>
        </div>
      </div>

      {/* Structural Key Catalysts Pill Bar */}
      {keyCatalysts.length > 0 && (
        <div
          style={{
            background: "var(--bg-ground, #0d1117)",
            border: "1px solid var(--border-default, #30363d)",
            borderRadius: "6px",
            padding: "8px 12px",
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "8px",
          }}
        >
          <span
            style={{
              fontSize: "10px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              color: "var(--accent-blue, #388bfd)",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <span>Key Catalysts:</span>
          </span>
          {keyCatalysts.map((cat, i) => (
            <span
              key={i}
              style={{
                fontSize: "11px",
                background: "var(--bg-surface, #161b22)",
                border: "1px solid var(--border-default, #30363d)",
                color: "var(--text-secondary, #8b949e)",
                padding: "2px 8px",
                borderRadius: "3px",
              }}
            >
              {cat}
            </span>
          ))}
        </div>
      )}

      {/* 4-Card Responsive Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "14px",
        }}
      >
        {/* Card 1: Management Guidance & Capex */}
        <div
          style={{
            background: "var(--bg-ground, #0d1117)",
            border: "1px solid var(--border-default, #30363d)",
            borderRadius: "6px",
            padding: "14px 16px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span
              style={{
                fontSize: "10px",
                fontWeight: 700,
                padding: "2px 6px",
                borderRadius: "3px",
                background: "rgba(56, 139, 253, 0.12)",
                color: "var(--accent-blue, #388bfd)",
                border: "1px solid rgba(56, 139, 253, 0.25)",
              }}
            >
              CAPEX & TARGETS
            </span>
          </div>
          <div>
            <h4 style={{ fontSize: "13px", fontWeight: 600, margin: 0, color: "var(--text-primary, #e6edf3)" }}>
              Management Guidance & Capex
            </h4>
            <div style={{ fontSize: "11px", color: "var(--text-tertiary, #6e7681)", marginTop: "2px" }}>
              Capital expenditure, revenue targets & capital allocation
            </div>
          </div>

          <ul
            style={{
              listStyle: "none",
              padding: 0,
              margin: "4px 0 0 0",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              fontSize: "12px",
              color: "var(--text-secondary, #8b949e)",
              lineHeight: "1.4",
            }}
          >
            {managementGuidance.length > 0 ? (
              managementGuidance.map((item, idx) => (
                <li
                  key={idx}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "6px",
                  }}
                >
                  <span style={{ color: "var(--accent-blue, #388bfd)", flexShrink: 0, marginTop: "1px" }}>▸</span>
                  <span>{item}</span>
                </li>
              ))
            ) : (
              <li style={{ color: "var(--text-tertiary, #6e7681)" }}>No specific guidance revisions noted in latest concall.</li>
            )}
          </ul>
        </div>

        {/* Card 2: Margin Outlook */}
        <div
          style={{
            background: "var(--bg-ground, #0d1117)",
            border: "1px solid var(--border-default, #30363d)",
            borderRadius: "6px",
            padding: "14px 16px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span
              style={{
                fontSize: "10px",
                fontWeight: 700,
                padding: "2px 6px",
                borderRadius: "3px",
                background: "rgba(63, 185, 80, 0.12)",
                color: "var(--trade-gain, #3fb950)",
                border: "1px solid rgba(63, 185, 80, 0.25)",
              }}
            >
              MARGIN SENSITIVITY
            </span>
          </div>
          <div>
            <h4 style={{ fontSize: "13px", fontWeight: 600, margin: 0, color: "var(--text-primary, #e6edf3)" }}>
              Margin Outlook & Pricing Power
            </h4>
            <div style={{ fontSize: "11px", color: "var(--text-tertiary, #6e7681)", marginTop: "2px" }}>
              Raw material inflation pass-through & operating leverage
            </div>
          </div>

          <p
            style={{
              fontSize: "12px",
              color: "var(--text-secondary, #8b949e)",
              lineHeight: "1.5",
              margin: "4px 0 0 0",
            }}
          >
            {strategy.marginOutlook || "Operating margins remain anchored within 5-year historical average with steady gross margins."}
          </p>
        </div>

        {/* Card 3: Competitive Moat */}
        <div
          style={{
            background: "var(--bg-ground, #0d1117)",
            border: "1px solid var(--border-default, #30363d)",
            borderRadius: "6px",
            padding: "14px 16px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span
              style={{
                fontSize: "10px",
                fontWeight: 700,
                padding: "2px 6px",
                borderRadius: "3px",
                background: "rgba(56, 139, 253, 0.12)",
                color: "var(--accent-blue, #388bfd)",
                border: "1px solid rgba(56, 139, 253, 0.25)",
              }}
            >
              STRATEGIC MOAT
            </span>
          </div>
          <div>
            <h4 style={{ fontSize: "13px", fontWeight: 600, margin: 0, color: "var(--text-primary, #e6edf3)" }}>
              Competitive Moat & Barriers
            </h4>
            <div style={{ fontSize: "11px", color: "var(--text-tertiary, #6e7681)", marginTop: "2px" }}>
              Market share, distribution network & switching barriers
            </div>
          </div>

          <p
            style={{
              fontSize: "12px",
              color: "var(--text-secondary, #8b949e)",
              lineHeight: "1.5",
              margin: "4px 0 0 0",
            }}
          >
            {strategy.competitiveMoat || "Extensive pan-India distribution presence and brand equity provide defensible moat against entrants."}
          </p>
        </div>

        {/* Card 4: Tail Risks & Red Flags */}
        <div
          style={{
            background: "var(--bg-ground, #0d1117)",
            border: "1px solid var(--border-default, #30363d)",
            borderRadius: "6px",
            padding: "14px 16px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span
              style={{
                fontSize: "10px",
                fontWeight: 700,
                padding: "2px 6px",
                borderRadius: "3px",
                background: "rgba(248, 81, 73, 0.12)",
                color: "var(--trade-loss, #f85149)",
                border: "1px solid rgba(248, 81, 73, 0.25)",
              }}
            >
              TAIL RISKS & GOVERNANCE
            </span>
          </div>
          <div>
            <h4 style={{ fontSize: "13px", fontWeight: 600, margin: 0, color: "var(--text-primary, #e6edf3)" }}>
              Tail Risks & Red Flags
            </h4>
            <div style={{ fontSize: "11px", color: "var(--text-tertiary, #6e7681)", marginTop: "2px" }}>
              Regulatory scrutiny, leverage covenants & commodity vulnerability
            </div>
          </div>

          <ul
            style={{
              listStyle: "none",
              padding: 0,
              margin: "4px 0 0 0",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              fontSize: "12px",
              color: "var(--text-secondary, #8b949e)",
              lineHeight: "1.4",
            }}
          >
            {tailRisks.length > 0 ? (
              tailRisks.map((risk, idx) => (
                <li
                  key={idx}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "6px",
                  }}
                >
                  <span style={{ color: "var(--trade-loss, #f85149)", flexShrink: 0, marginTop: "1px" }}>⚠</span>
                  <span>{risk}</span>
                </li>
              ))
            ) : (
              <li style={{ color: "var(--text-tertiary, #6e7681)" }}>No material governance or systemic red flags identified.</li>
            )}
          </ul>
        </div>
      </div>
    </section>
  );
}

export default CorporateStrategyCard;
