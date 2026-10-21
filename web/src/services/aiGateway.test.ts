import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  buildIndianMarketPrompt,
  generateAIStrategyAnalysis,
  type StockTechnicalData,
} from "./aiGateway";
import type { AIGatewayRequest } from "../types/aiSimulation";

describe("aiGateway", () => {
  const mockStockData: StockTechnicalData = {
    ltp: 2950.5,
    sma20: 2920.0,
    sma50: 2860.0,
    rsi: 62.4,
    vwap: 2935.0,
  };

  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe("buildIndianMarketPrompt", () => {
    it("embeds Indian market context (NSE/BSE, FII/DII, capex, margins, statutory fees)", () => {
      const req: AIGatewayRequest = {
        symbol: "RELIANCE",
        provider: "GROQ",
        apiKey: "gsk-mock-key",
        newsHeadline: "Jio Tariff Hike to Boost ARPU by 12%",
        customNewsText: "Management guided FY26 capex to taper down while retail EBITDA margins expand.",
      };

      const prompt = buildIndianMarketPrompt(req, mockStockData);

      expect(prompt.systemPrompt).toContain("MarketLens Grok-Quant");
      expect(prompt.systemPrompt).toMatch(/NSE\/BSE/i);
      expect(prompt.systemPrompt).toMatch(/FII\/DII/i);
      expect(prompt.systemPrompt).toMatch(/capex/i);
      expect(prompt.systemPrompt).toMatch(/margin/i);
      expect(prompt.systemPrompt).toMatch(/SEBI/i);

      expect(prompt.userPrompt).toContain("RELIANCE");
      expect(prompt.userPrompt).toContain("2950.5");
      expect(prompt.userPrompt).toContain("2920");
      expect(prompt.userPrompt).toContain("62.4");
      expect(prompt.userPrompt).toContain("Jio Tariff Hike");
      expect(prompt.userPrompt).toContain("Management guided FY26 capex");
    });
  });

  describe("generateAIStrategyAnalysis - OFFLINE_HEURISTIC", () => {
    it("returns valid AIGatewayResponse with 4 timelines and reasoning steps without calling fetch", async () => {
      const fetchSpy = vi.fn();
      globalThis.fetch = fetchSpy;

      const req: AIGatewayRequest = {
        symbol: "TCS",
        provider: "OFFLINE_HEURISTIC",
        newsHeadline: "TCS Signs Mega Deal with UK Insurer",
      };

      const progressSteps: string[] = [];
      const res = await generateAIStrategyAnalysis(req, mockStockData, (step) => {
        progressSteps.push(step);
      });

      expect(fetchSpy).not.toHaveBeenCalled();
      expect(res.timelines).toHaveLength(4);
      expect(res.timelines.map((t) => t.id)).toEqual([
        "BULL",
        "BASE",
        "BEAR",
        "BLACK_SWAN",
      ]);
      expect(res.reasoningSteps.length).toBeGreaterThanOrEqual(3);
      expect(progressSteps.length).toBe(res.reasoningSteps.length);
      expect(res.strategyDeconstruction.managementGuidance.length).toBeGreaterThan(0);
      expect(res.strategyDeconstruction.marginOutlook.length).toBeGreaterThan(0);
      expect(res.strategyDeconstruction.competitiveMoat.length).toBeGreaterThan(0);
    });
  });

  describe("generateAIStrategyAnalysis - Fallback Behavior", () => {
    it("falls back to OFFLINE_HEURISTIC when apiKey is missing or whitespace", async () => {
      const fetchSpy = vi.fn();
      globalThis.fetch = fetchSpy;

      const providers = ["GROQ", "GEMINI", "GROK"] as const;

      for (const provider of providers) {
        const req: AIGatewayRequest = {
          symbol: "INFY",
          provider,
          apiKey: "   ",
        };

        const res = await generateAIStrategyAnalysis(req, mockStockData);

        expect(fetchSpy).not.toHaveBeenCalled();
        expect(res.timelines).toHaveLength(4);
        expect(res.strategyDeconstruction).toBeDefined();
        expect(res.reasoningSteps.length).toBeGreaterThan(0);
      }
    });

    it("falls back to OFFLINE_HEURISTIC on HTTP 401 or network rejection", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
      });

      const req: AIGatewayRequest = {
        symbol: "HDFCBANK",
        provider: "GROQ",
        apiKey: "invalid-key",
      };

      const res = await generateAIStrategyAnalysis(req, mockStockData);

      expect(res.timelines).toHaveLength(4);
      expect(res.strategyDeconstruction.competitiveMoat.length).toBeGreaterThan(0);
      expect(res.reasoningSteps.length).toBeGreaterThan(0);
    });

    it("falls back to OFFLINE_HEURISTIC when API returns invalid non-JSON payload", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => {
          throw new Error("SyntaxError: Unexpected token < in JSON at position 0");
        },
        text: async () => "<html>502 Bad Gateway</html>",
      });

      const req: AIGatewayRequest = {
        symbol: "ICICIBANK",
        provider: "GROK",
        apiKey: "xai-valid-key",
      };

      const res = await generateAIStrategyAnalysis(req, mockStockData);

      expect(res.timelines).toHaveLength(4);
      expect(res.strategyDeconstruction).toBeDefined();
    });
  });

  describe("generateAIStrategyAnalysis - Successful Remote LLM Providers", () => {
    const mockApiResponsePayload = {
      reasoningSteps: [
        "Step 1: Institutional volume profile shows accumulation above VWAP.",
        "Step 2: Margin expansion confirmed via pricing power in domestic retail.",
        "Step 3: FII net inflow supports multi-scenario target recalibration.",
        "Step 4: Evaluated SEBI statutory friction at 0.15% on equity delivery.",
      ],
      timelines: [
        {
          id: "BULL",
          name: "High Growth Expansion",
          probabilityPercent: 40,
          expectedReturnRange: "+8.0% to +14.0%",
          targetPrice: 3200,
          stopLossPrice: 2880,
          catalystTriggers: ["Tariff hike execution", "Strong Q3 operating leverage"],
          invalidationCondition: "Daily close below ₹2880 support",
          estimatedFrictionPercent: 0.15,
        },
        {
          id: "BASE",
          name: "Rangebound Drift",
          probabilityPercent: 35,
          expectedReturnRange: "+1.0% to +4.0%",
          targetPrice: 3020,
          stopLossPrice: 2850,
          catalystTriggers: ["Consolidation around 50 DMA"],
          invalidationCondition: "Breakdown below ₹2850",
          estimatedFrictionPercent: 0.15,
        },
        {
          id: "BEAR",
          name: "Macro Headwinds",
          probabilityPercent: 20,
          expectedReturnRange: "-5.0% to -9.0%",
          targetPrice: 2750,
          stopLossPrice: 3000,
          catalystTriggers: ["Crude spike above $90/bbl"],
          invalidationCondition: "Reclaim of ₹3000 resistance",
          estimatedFrictionPercent: 0.15,
        },
        {
          id: "BLACK_SWAN",
          name: "Regulatory Intervention",
          probabilityPercent: 5,
          expectedReturnRange: "-15.0% to -25.0%",
          targetPrice: 2400,
          stopLossPrice: 2800,
          catalystTriggers: ["Sudden windfall tax revision"],
          invalidationCondition: "Official policy clarification",
          estimatedFrictionPercent: 0.15,
        },
      ],
      strategyDeconstruction: {
        managementGuidance: ["Maintain 15% revenue CAGR over FY25-27"],
        marginOutlook: "EBITDA margins steady at 18-20% despite raw material inflation",
        competitiveMoat: "Dominant retail distribution and unmatched logistics integration",
        tailRisks: ["Geopolitical supply chain disruptions", "Regulatory tariff caps"],
        keyCatalysts: ["Q3 concall announcement", "New energy commercialization"],
      },
    };

    it("parses GROQ OpenAI-compatible chat completion JSON response", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify(mockApiResponsePayload),
              },
            },
          ],
        }),
      });

      const req: AIGatewayRequest = {
        symbol: "RELIANCE",
        provider: "GROQ",
        apiKey: "gsk-valid-key",
      };

      const res = await generateAIStrategyAnalysis(req, mockStockData);

      expect(res.timelines).toHaveLength(4);
      expect(res.timelines[0].name).toBe("High Growth Expansion");
      expect(res.reasoningSteps).toEqual(mockApiResponsePayload.reasoningSteps);
      expect(res.strategyDeconstruction.marginOutlook).toBe(
        mockApiResponsePayload.strategyDeconstruction.marginOutlook
      );
    });

    it("parses GEMINI generateContent response with markdown code fences", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: `\`\`\`json\n${JSON.stringify(
                      mockApiResponsePayload
                    )}\n\`\`\``,
                  },
                ],
              },
            },
          ],
        }),
      });

      const req: AIGatewayRequest = {
        symbol: "RELIANCE",
        provider: "GEMINI",
        apiKey: "gemini-valid-key",
      };

      const res = await generateAIStrategyAnalysis(req, mockStockData);

      expect(res.timelines).toHaveLength(4);
      expect(res.timelines[0].targetPrice).toBe(3200);
      expect(res.strategyDeconstruction.managementGuidance[0]).toContain("CAGR");
    });

    it("parses xAI GROK response correctly", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify(mockApiResponsePayload),
              },
            },
          ],
        }),
      });

      const req: AIGatewayRequest = {
        symbol: "RELIANCE",
        provider: "GROK",
        apiKey: "xai-valid-key",
      };

      const res = await generateAIStrategyAnalysis(req, mockStockData);

      expect(res.timelines).toHaveLength(4);
      expect(res.timelines[3].id).toBe("BLACK_SWAN");
      expect(res.strategyDeconstruction.tailRisks).toHaveLength(2);
    });
  });
});

