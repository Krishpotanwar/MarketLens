import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PaperTradingPage } from "./PaperTradingPage";

describe("PaperTradingPage - Market Hours & Auto Square-off", () => {
  it("renders market session bar with session indicator, clock, and mode controls", () => {
    const markup = renderToStaticMarkup(<PaperTradingPage initialSymbol="RELIANCE" />);

    expect(markup).toContain("market-session-bar");
    expect(markup).toContain("session-indicator-pill");
    expect(markup).toContain("session-clock");
    expect(markup).toContain("Strict Market Hours");
    expect(markup).toContain("Simulator (24/7)");
    expect(markup).toContain("Indian Statutory Charges Breakdown");
    expect(markup).toContain("STT / CTT");
  });

  it("renders order button with proper accessibility attributes", () => {
    const markup = renderToStaticMarkup(<PaperTradingPage initialSymbol="TCS" />);
    expect(markup).toContain("btn-submit-order");
    expect(markup).toContain("btn-submit-buy");
  });

  it("renders active open positions table and closed trade history audit table", () => {
    const markup = renderToStaticMarkup(<PaperTradingPage initialSymbol="INFY" />);
    expect(markup).toContain("Active Open Positions");
    expect(markup).toContain("Trade History &amp; Statutory Audit");
    expect(markup).toContain("Available Cash");
    expect(markup).toContain("Total Portfolio Value");
  });
});
