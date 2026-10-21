import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AIStrategyLabPage } from "./AIStrategyLabPage";

describe("AIStrategyLabPage Integration", () => {
  it("renders page title and subtitle description", () => {
    const markup = renderToStaticMarkup(<AIStrategyLabPage onExecuteAITrade={() => {}} />);
    expect(markup).toContain("Hybrid AI Strategy Lab &amp; Grok Reasoning Sandbox");
    expect(markup).toContain("Fine-tune and back-evaluate custom Indian stock strategies");
  });

  it("renders AI provider selector with all 4 supported providers", () => {
    const markup = renderToStaticMarkup(<AIStrategyLabPage onExecuteAITrade={() => {}} />);
    expect(markup).toContain("AI Reasoning Engine Provider");
    expect(markup).toContain("Groq (Llama-3.3-70B / DeepSeek-R1)");
    expect(markup).toContain("Google Gemini Flash");
    expect(markup).toContain("xAI Grok");
    expect(markup).toContain("Offline Heuristic Engine");
  });

  it("renders Indian stock equity selector and presets", () => {
    const markup = renderToStaticMarkup(<AIStrategyLabPage onExecuteAITrade={() => {}} />);
    expect(markup).toContain("Target Indian Equity (NSE)");
    expect(markup).toContain("RELIANCE");
    expect(markup).toContain("TCS");
    expect(markup).toContain("HDFCBANK");
    expect(markup).toContain("Strategy Preset");
    expect(markup).toContain("20/50 SMA Crossover");
    expect(markup).toContain("RSI Dip &amp; VWAP");
    expect(markup).toContain("Volume Breakout");
    expect(markup).toContain("Custom Prompt Sandbox");
  });

  it("renders Indian news feed ticker for the initial stock (RELIANCE)", () => {
    const markup = renderToStaticMarkup(<AIStrategyLabPage onExecuteAITrade={() => {}} />);
    expect(markup).toContain("Indian News Feed &amp; Sentiment Ticker");
    expect(markup).toContain("LiveMint");
    expect(markup).toContain("BULLISH");
    expect(markup).toContain("Reliance Jio Posts 12% Net Profit Surge");
  });

  it("renders earnings concall and filings sandbox with preset", () => {
    const markup = renderToStaticMarkup(<AIStrategyLabPage onExecuteAITrade={() => {}} />);
    expect(markup).toContain("Earnings Concall &amp; Filings Sandbox");
    expect(markup).toContain("Reset to Preset");
    expect(markup).toContain("concall-sandbox-input");
    expect(markup).toContain("User edits are synthesized directly into corporate strategy deconstruction");
  });

  it("renders run button with active stock symbol", () => {
    const markup = renderToStaticMarkup(<AIStrategyLabPage onExecuteAITrade={() => {}} />);
    expect(markup).toContain("Run AI Analysis on RELIANCE");
  });

  it("renders empty AI state prompting user to run analysis initially", () => {
    const markup = renderToStaticMarkup(<AIStrategyLabPage onExecuteAITrade={() => {}} />);
    expect(markup).toContain("Ready to Evaluate Strategy");
    expect(markup).toContain("Select an Indian stock, AI provider, and preset on the left");
  });
});
