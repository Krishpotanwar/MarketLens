import { describe, expect, it } from "vitest";
import { CONNECTING_LABEL, feedLabel, indexText, isOffline, isUsableQuote, OFFLINE_LABEL, priceText } from "./dataStatus";

describe("dataStatus", () => {
  it("treats missing, zero and unavailable quotes as unusable", () => {
    expect(isUsableQuote({ ltp: 123.4, status: "live" })).toBe(true);
    expect(isUsableQuote({ ltp: 123.4, status: "stale" })).toBe(true);
    expect(isUsableQuote({ ltp: null, status: "unavailable" })).toBe(false);
    expect(isUsableQuote({ ltp: 0, status: "live" })).toBe(false);
    expect(isUsableQuote({ ltp: 50, status: "unavailable" })).toBe(false);
    expect(isUsableQuote(undefined)).toBe(false);
  });

  it("shows an em dash instead of inventing a price", () => {
    expect(priceText(null)).toBe("—");
    expect(priceText(undefined)).toBe("—");
    expect(priceText(1234.5)).toBe("₹1,234.50");
  });

  it("never shows a bundled sample index level as if it were live", () => {
    const stocks = [{ symbol: "NIFTY 50", ltp: 24854.2, changePercent: 0.58 }];
    expect(indexText(stocks, "NIFTY 50", true)).toBe("—"); // offline: the 24,854.20 is only sample data
    expect(indexText(stocks, "SENSEX", false)).toBe("—"); // unknown index
    expect(indexText(stocks, "NIFTY 50", false)).toBe("24,854.20 (+0.58%)");
  });

  it("labels a feed live, stale or offline from the quotes the backend returned", () => {
    expect(feedLabel([])).toBe(OFFLINE_LABEL);
    expect(feedLabel([{ ltp: null, status: "unavailable" }])).toBe(OFFLINE_LABEL);
    expect(feedLabel([{ ltp: 10, status: "live", provider: "Yahoo Finance (unofficial)" }])).toBe(
      "Live · Yahoo Finance (unofficial)"
    );
    expect(feedLabel([{ ltp: 10, status: "stale", provider: "Yahoo Finance (unofficial)" }])).toContain("Stale");
  });

  it("says 'connecting', not 'offline', before the first answer, yet still withholds prices", () => {
    expect(CONNECTING_LABEL).not.toBe(OFFLINE_LABEL);
    expect(isOffline(CONNECTING_LABEL)).toBe(true); // no live price yet: amber dot, no index levels
    expect(isOffline("Live · Yahoo Finance (unofficial)")).toBe(false);
  });
});
