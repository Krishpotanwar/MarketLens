/**
 * Unified AI Gateway & Streaming Reasoning Service
 *
 * Connects Indian equity quant analysis to high-performance LLM engines:
 * - Groq Cloud (Llama-3.3-70B-Versatile / DeepSeek-R1)
 * - Google Gemini (gemini-1.5-flash)
 * - xAI Grok (grok-2)
 * - Offline Heuristic Engine (Mathematical synthesis via timelineEngine)
 *
 * Features Indian market prompt engineering (NSE/BSE, capex cycles, EBITDA margins,
 * FII/DII flows, SEBI statutory fees), streaming progress callbacks, and graceful
 * offline fallback.
 */

import type {
  AIGatewayRequest,
  AIGatewayResponse,
  TimelineScenario,
  TimelineScenarioId,
  CorporateStrategyDeconstruction,
} from "../types/aiSimulation";
import {
  generateTimelineScenarios,
  calculateStatutoryFrictionPercent,
} from "../utils/timelineEngine";

export interface StockTechnicalData {
  ltp: number;
  sma20: number;
  sma50: number;
  rsi: number;
  vwap: number;
}

/**
 * Builds structured prompts specialized for Indian equity institutional analysis.
 */
export function buildIndianMarketPrompt(
  req: AIGatewayRequest,
  stockData: StockTechnicalData
): { systemPrompt: string; userPrompt: string } {
  const frictionPercent = calculateStatutoryFrictionPercent(stockData.ltp * 50);

  const systemPrompt = `You are MarketLens Grok-Quant, an expert AI quantitative analyst for the Indian Stock Market (NSE/BSE).
You evaluate corporate strategy, quarterly earnings concalls, capex expenditure cycles, operating/EBITDA margins, domestic FII/DII institutional liquidity dynamics, and SEBI statutory regulations to produce multi-timeline equity probability projections.

You must respond ONLY with a strict, valid JSON object matching the following TypeScript schema:
{
  "reasoningSteps": [
    "Step 1: Quantitative technical setup analysis on NSE/BSE relative to VWAP and SMAs",
    "Step 2: Operating margin and pricing power trajectory under raw material inflation",
    "Step 3: Capex commitment and capital allocation framework",
    "Step 4: Institutional FII/DII liquidity positioning and order book depth",
    "Step 5: Calibration of 4 timeline probability scenarios incorporating SEBI statutory friction"
  ],
  "timelines": [
    {
      "id": "BULL",
      "name": "Scenario Title",
      "probabilityPercent": 35,
      "expectedReturnRange": "+6.0% to +12.0%",
      "targetPrice": 3200,
      "stopLossPrice": 2880,
      "catalystTriggers": ["Key catalyst 1", "Key catalyst 2"],
      "invalidationCondition": "Precise price or structural trigger invalidating this thesis",
      "estimatedFrictionPercent": ${frictionPercent.toFixed(3)}
    },
    {
      "id": "BASE",
      "name": "Consolidation / Base Drift",
      "probabilityPercent": 35,
      "expectedReturnRange": "+1.0% to +4.0%",
      "targetPrice": 3020,
      "stopLossPrice": 2850,
      "catalystTriggers": ["Catalyst trigger"],
      "invalidationCondition": "Structural level trigger",
      "estimatedFrictionPercent": ${frictionPercent.toFixed(3)}
    },
    {
      "id": "BEAR",
      "name": "Corrective Retest",
      "probabilityPercent": 20,
      "expectedReturnRange": "-5.0% to -10.0%",
      "targetPrice": 2750,
      "stopLossPrice": 3020,
      "catalystTriggers": ["Headwind trigger"],
      "invalidationCondition": "Decisive reclaim level",
      "estimatedFrictionPercent": ${frictionPercent.toFixed(3)}
    },
    {
      "id": "BLACK_SWAN",
      "name": "Tail Risk / Regulatory Shock",
      "probabilityPercent": 10,
      "expectedReturnRange": "-15.0% to -25.0%",
      "targetPrice": 2400,
      "stopLossPrice": 2850,
      "catalystTriggers": ["Unforeseen regulatory shock or SEBI inquiry"],
      "invalidationCondition": "Exoneration or clarification",
      "estimatedFrictionPercent": ${frictionPercent.toFixed(3)}
    }
  ],
  "strategyDeconstruction": {
    "managementGuidance": ["Management forward commitment 1", "Commitment 2"],
    "marginOutlook": "Detailed EBITDA/operating margin outlook",
    "competitiveMoat": "Economic moat, market share, and competitive advantage",
    "tailRisks": ["Regulatory risk", "Raw material / macro risk"],
    "keyCatalysts": ["Upcoming catalyst 1", "Upcoming catalyst 2"]
  }
}

CRITICAL RULES:
1. Probability percentages across all 4 timelines (BULL, BASE, BEAR, BLACK_SWAN) MUST strictly sum to 100%.
2. All targetPrice and stopLossPrice numbers must be denominated in INR (₹) and quantitatively realistic relative to LTP.
3. For BULL and BASE: targetPrice > LTP and stopLossPrice < LTP.
4. For BEAR and BLACK_SWAN: targetPrice < LTP and stopLossPrice > LTP.
5. Invalidation conditions must reference structural price levels or regulatory developments.
6. Return pure, valid JSON with NO commentary, NO markdown fences, and NO trailing commas.`;

  const userPrompt = `Institutional Analysis Request for Indian Equity:
Symbol: ${req.symbol} (NSE / BSE)
Current Market Price (LTP): ₹${stockData.ltp.toFixed(2)}
20-day SMA: ₹${stockData.sma20.toFixed(2)}
50-day SMA: ₹${stockData.sma50.toFixed(2)}
14-day RSI: ${stockData.rsi.toFixed(1)}
Anchored / Intraday VWAP: ₹${stockData.vwap.toFixed(2)}
Estimated SEBI Statutory Delivery Levies: ~${frictionPercent.toFixed(3)}% (STT, GST, Exchange charges, Stamp duty)
${req.newsHeadline ? `Latest Corporate Headline: "${req.newsHeadline}"` : ""}
${req.strategyPreset ? `Strategy Preset: ${req.strategyPreset}` : ""}
${req.customNewsText ? `Concall Transcript / Corporate Filing Sandbox:\n${req.customNewsText}` : ""}

Analyze the corporate strategy, guidance inflection, EBITDA margin trajectory, capex cycle, and domestic FII/DII liquidity profile for ${req.symbol}. Output the full institutional JSON analysis.`;

  return { systemPrompt, userPrompt };
}

/**
 * Builds an offline heuristic response using mathematical timeline synthesis.
 */
export function buildOfflineHeuristicResponse(
  req: AIGatewayRequest,
  stockData: StockTechnicalData,
  onProgress?: (step: string) => void
): AIGatewayResponse {
  const timelineResult = generateTimelineScenarios({
    symbol: req.symbol,
    ltp: stockData.ltp,
    sma20: stockData.sma20,
    sma50: stockData.sma50,
    rsi: stockData.rsi,
    vwap: stockData.vwap,
    newsHeadline: req.newsHeadline,
  });

  const friction = calculateStatutoryFrictionPercent(stockData.ltp * 50);

  const reasoningSteps: string[] = [
    `Step 1: Analyzed ${req.symbol} on NSE/BSE with LTP ₹${stockData.ltp.toFixed(
      2
    )} relative to VWAP (₹${stockData.vwap.toFixed(2)}), 20-DMA (₹${stockData.sma20.toFixed(
      2
    )}), and 50-DMA (₹${stockData.sma50.toFixed(2)}).`,
    `Step 2: Evaluated technical momentum with RSI (${stockData.rsi.toFixed(
      1
    )}) and quantified statutory delivery friction (~${friction.toFixed(
      3
    )}% SEBI STT/GST/Stamp Duty).`,
    `Step 3: Synthesized corporate guidance, capex commitments, and operating margin profile for Indian institutional positioning.`,
    `Step 4: Calibrated 4 timeline scenarios (Bull, Base, Bear, Black-Swan) ensuring probability weights sum to exactly 100%.`,
    `Step 5: Generated invalidation thresholds and catalyst triggers mapped to key macro and domestic FII/DII liquidity levels.`,
  ];

  if (onProgress) {
    for (const step of reasoningSteps) {
      onProgress(step);
    }
  }

  return {
    reasoningSteps,
    timelines: timelineResult.timelines,
    strategyDeconstruction: timelineResult.strategyDeconstruction,
  };
}

/**
 * Sanitizes and validates remote LLM JSON response against institutional data models.
 */
function parseAndValidateAIResponse(
  rawText: string,
  fallback: AIGatewayResponse
): AIGatewayResponse {
  try {
    let cleaned = rawText.trim();
    // Strip markdown code fences if present
    if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
    }

    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    }

    const parsed = JSON.parse(cleaned);

    // Validate timelines
    if (!Array.isArray(parsed.timelines) || parsed.timelines.length !== 4) {
      return fallback;
    }

    const requiredIds: TimelineScenarioId[] = ["BULL", "BASE", "BEAR", "BLACK_SWAN"];
    const hasAllIds = requiredIds.every((id) =>
      parsed.timelines.some((t: any) => t && t.id === id)
    );

    if (!hasAllIds) {
      return fallback;
    }

    const sanitizedTimelines: TimelineScenario[] = parsed.timelines.map(
      (t: any, index: number) => {
        const id: TimelineScenarioId = requiredIds.includes(t.id)
          ? t.id
          : fallback.timelines[index].id;
        const targetPrice =
          typeof t.targetPrice === "number" && !isNaN(t.targetPrice)
            ? t.targetPrice
            : fallback.timelines[index].targetPrice;
        const stopLossPrice =
          typeof t.stopLossPrice === "number" && !isNaN(t.stopLossPrice)
            ? t.stopLossPrice
            : fallback.timelines[index].stopLossPrice;
        const probabilityPercent =
          typeof t.probabilityPercent === "number" && !isNaN(t.probabilityPercent)
            ? t.probabilityPercent
            : fallback.timelines[index].probabilityPercent;
        const estimatedFrictionPercent =
          typeof t.estimatedFrictionPercent === "number" &&
          !isNaN(t.estimatedFrictionPercent)
            ? t.estimatedFrictionPercent
            : fallback.timelines[index].estimatedFrictionPercent;

        return {
          id,
          name: typeof t.name === "string" && t.name.trim() ? t.name : fallback.timelines[index].name,
          probabilityPercent,
          expectedReturnRange:
            typeof t.expectedReturnRange === "string" && t.expectedReturnRange.trim()
              ? t.expectedReturnRange
              : fallback.timelines[index].expectedReturnRange,
          targetPrice,
          stopLossPrice,
          catalystTriggers:
            Array.isArray(t.catalystTriggers) && t.catalystTriggers.length > 0
              ? t.catalystTriggers.map(String)
              : fallback.timelines[index].catalystTriggers,
          invalidationCondition:
            typeof t.invalidationCondition === "string" && t.invalidationCondition.trim()
              ? t.invalidationCondition
              : fallback.timelines[index].invalidationCondition,
          estimatedFrictionPercent,
        };
      }
    );

    // Validate strategy deconstruction
    const sd = parsed.strategyDeconstruction || {};
    const strategyDeconstruction: CorporateStrategyDeconstruction = {
      managementGuidance:
        Array.isArray(sd.managementGuidance) && sd.managementGuidance.length > 0
          ? sd.managementGuidance.map(String)
          : fallback.strategyDeconstruction.managementGuidance,
      marginOutlook:
        typeof sd.marginOutlook === "string" && sd.marginOutlook.trim()
          ? sd.marginOutlook
          : fallback.strategyDeconstruction.marginOutlook,
      competitiveMoat:
        typeof sd.competitiveMoat === "string" && sd.competitiveMoat.trim()
          ? sd.competitiveMoat
          : fallback.strategyDeconstruction.competitiveMoat,
      tailRisks:
        Array.isArray(sd.tailRisks) && sd.tailRisks.length > 0
          ? sd.tailRisks.map(String)
          : fallback.strategyDeconstruction.tailRisks,
      keyCatalysts:
        Array.isArray(sd.keyCatalysts) && sd.keyCatalysts.length > 0
          ? sd.keyCatalysts.map(String)
          : fallback.strategyDeconstruction.keyCatalysts,
    };

    // Validate reasoning steps
    const reasoningSteps: string[] =
      Array.isArray(parsed.reasoningSteps) && parsed.reasoningSteps.length > 0
        ? parsed.reasoningSteps.map(String)
        : fallback.reasoningSteps;

    return {
      reasoningSteps,
      timelines: sanitizedTimelines,
      strategyDeconstruction,
    };
  } catch (err) {
    console.warn("[AIGateway] Failed to parse JSON response, falling back:", err);
    return fallback;
  }
}

/**
 * Executes AI Strategy Analysis using Groq, Gemini, Grok, or Offline Heuristic.
 */
export async function generateAIStrategyAnalysis(
  req: AIGatewayRequest,
  stockData: StockTechnicalData,
  onProgress?: (step: string) => void
): Promise<AIGatewayResponse> {
  const fallback = buildOfflineHeuristicResponse(req, stockData, onProgress);

  // If offline engine or apiKey is empty/missing, return offline heuristic directly
  const apiKey = req.apiKey?.trim();
  if (req.provider === "OFFLINE_HEURISTIC" || !apiKey) {
    return fallback;
  }

  const { systemPrompt, userPrompt } = buildIndianMarketPrompt(req, stockData);

  try {
    let rawContent = "";

    if (req.provider === "GROQ") {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.2,
          response_format: { type: "json_object" },
        }),
      });

      if (!response.ok) {
        console.warn(`[AIGateway] Groq returned HTTP ${response.status}`);
        return fallback;
      }

      const data = await response.json();
      rawContent = data?.choices?.[0]?.message?.content || "";
    } else if (req.provider === "GEMINI") {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(
        apiKey
      )}`;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: systemPrompt }],
          },
          contents: [
            {
              parts: [{ text: userPrompt }],
            },
          ],
          generationConfig: {
            response_mime_type: "application/json",
            temperature: 0.2,
          },
        }),
      });

      if (!response.ok) {
        console.warn(`[AIGateway] Gemini returned HTTP ${response.status}`);
        return fallback;
      }

      const data = await response.json();
      rawContent = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    } else if (req.provider === "GROK") {
      const response = await fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "grok-2",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.2,
          response_format: { type: "json_object" },
        }),
      });

      if (!response.ok) {
        console.warn(`[AIGateway] Grok returned HTTP ${response.status}`);
        return fallback;
      }

      const data = await response.json();
      rawContent = data?.choices?.[0]?.message?.content || "";
    } else {
      return fallback;
    }

    if (!rawContent) {
      return fallback;
    }

    const validatedResponse = parseAndValidateAIResponse(rawContent, fallback);

    if (onProgress) {
      for (const step of validatedResponse.reasoningSteps) {
        onProgress(step);
      }
    }

    return validatedResponse;
  } catch (error) {
    console.warn("[AIGateway] Error during remote AI call, using fallback:", error);
    return fallback;
  }
}
