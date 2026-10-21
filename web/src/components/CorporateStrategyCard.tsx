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
          background: "#000000",
          border: "1px solid #1c2638",
          borderRadius: "8px",
          padding: "24px",
          color: "#94a3b8",
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
        background: "#000000",
        border: "1px solid #1c2638",
        borderRadius: "8px",
        padding: "16px 20px",
        color: "#f8fafc",
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
          borderBottom: "1px solid #1c2638",
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
                background: "#38bdf8",
                boxShadow: "0 0 8px #38bdf8",
              }}
              aria-hidden="true"
            />
            <h3
              style={{
                fontSize: "15px",
                fontWeight: 600,
                letterSpacing: "0.02em",
                margin: 0,
                color: "#f8fafc",
              }}
            >
              Corporate Strategy Deconstruction
            </h3>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 700,
                padding: "2px 6px",
                borderRadius: "4px",
                background: "rgba(56, 189, 248, 0.15)",
                color: "#38bdf8",
                border: "1px solid rgba(56, 189, 248, 0.3)",
              }}
            >
              {symbol}
            </span>
          </div>
          <p
            style={{
              fontSize: "12px",
              color: "#94a3b8",
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
            background: "#090d16",
            border: "1px solid #1c2638",
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
              color: "#38bdf8",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <span>⚡</span>
            <span>Key Catalysts:</span>
          </span>
          {keyCatalysts.map((cat, i) => (
            <span
              key={i}
              style={{
                fontSize: "11px",
                background: "rgba(56, 189, 248, 0.08)",
                border: "1px solid rgba(56, 189, 248, 0.25)",
                color: "#e2e8f0",
                padding: "2px 8px",
                borderRadius: "4px",
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
            background: "#090d16",
            border: "1px solid #1c2638",
            borderRadius: "8px",
            padding: "14px 16px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 700,
                padding: "2px 6px",
                borderRadius: "4px",
                background: "rgba(56, 189, 248, 0.12)",
                color: "#38bdf8",
                border: "1px solid rgba(56, 189, 248, 0.3)",
              }}
            >
              CAPEX & TARGETS
            </span>
          </div>
          <div>
            <h4 style={{ fontSize: "13px", fontWeight: 600, margin: 0, color: "#f8fafc" }}>
              Management Guidance & Capex
            </h4>
            <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
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
              color: "#cbd5e1",
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
                  <span style={{ color: "#38bdf8", flexShrink: 0, marginTop: "1px" }}>▸</span>
                  <span>{item}</span>
                </li>
              ))
            ) : (
              <li style={{ color: "#64748b" }}>No specific guidance revisions noted in latest concall.</li>
            )}
          </ul>
        </div>

        {/* Card 2: Margin Outlook */}
        <div
          style={{
            background: "#090d16",
            border: "1px solid #1c2638",
            borderRadius: "8px",
            padding: "14px 16px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 700,
                padding: "2px 6px",
                borderRadius: "4px",
                background: "rgba(16, 185, 129, 0.12)",
                color: "#10b981",
                border: "1px solid rgba(16, 185, 129, 0.3)",
              }}
            >
              MARGIN SENSITIVITY
            </span>
          </div>
          <div>
            <h4 style={{ fontSize: "13px", fontWeight: 600, margin: 0, color: "#f8fafc" }}>
              Margin Outlook & Pricing Power
            </h4>
            <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
              Raw material inflation pass-through & operating leverage
            </div>
          </div>

          <p
            style={{
              fontSize: "12px",
              color: "#cbd5e1",
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
            background: "#090d16",
            border: "1px solid #1c2638",
            borderRadius: "8px",
            padding: "14px 16px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 700,
                padding: "2px 6px",
                borderRadius: "4px",
                background: "rgba(96, 165, 250, 0.12)",
                color: "#60a5fa",
                border: "1px solid rgba(96, 165, 250, 0.3)",
              }}
            >
              STRATEGIC MOAT
            </span>
          </div>
          <div>
            <h4 style={{ fontSize: "13px", fontWeight: 600, margin: 0, color: "#f8fafc" }}>
              Competitive Moat & Barriers
            </h4>
            <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
              Market share, distribution network & switching barriers
            </div>
          </div>

          <p
            style={{
              fontSize: "12px",
              color: "#cbd5e1",
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
            background: "#090d16",
            border: "1px solid #1c2638",
            borderRadius: "8px",
            padding: "14px 16px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 700,
                padding: "2px 6px",
                borderRadius: "4px",
                background: "rgba(244, 63, 94, 0.12)",
                color: "#f43f5e",
                border: "1px solid rgba(244, 63, 94, 0.3)",
              }}
            >
              TAIL RISKS & GOVERNANCE
            </span>
          </div>
          <div>
            <h4 style={{ fontSize: "13px", fontWeight: 600, margin: 0, color: "#f8fafc" }}>
              Tail Risks & Red Flags
            </h4>
            <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
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
              color: "#cbd5e1",
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
                  <span style={{ color: "#f43f5e", flexShrink: 0, marginTop: "1px" }}>⚠</span>
                  <span>{risk}</span>
                </li>
              ))
            ) : (
              <li style={{ color: "#64748b" }}>No material governance or systemic red flags identified.</li>
            )}
          </ul>
        </div>
      </div>
    </section>
  );
}

export default CorporateStrategyCard;
