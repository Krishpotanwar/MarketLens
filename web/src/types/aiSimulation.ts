/**
 * Indian Market AI Prediction & Multi-Timeline Simulation Data Models
 *
 * Institutional-grade types for Indian equity news ingestion, corporate strategy
 * deconstruction, multi-scenario timeline branching (Bull, Base, Bear, Black-Swan),
 * and Monte Carlo jump-diffusion simulation.
 */

export type NewsSentimentLabel = "BULLISH" | "BEARISH" | "NEUTRAL";

export type NewsCategory =
  | "EARNINGS"
  | "CAPEX"
  | "REGULATORY"
  | "SECTOR_MACRO"
  | "DEAL_WIN"
  | string;

export interface IndianNewsItem {
  id: string;
  title: string;
  source: string;
  publishedAt: string;
  symbol: string;
  sentimentScore: number; // -1.0 (strongly bearish) to +1.0 (strongly bullish)
  sentimentLabel: NewsSentimentLabel;
  summary: string;
  category: NewsCategory;
}

export interface CompanyConcallPreset {
  recentFilings: string[];
  concallTranscriptSnippet: string;
  guidanceKeypoints: string[];
}

export interface CorporateStrategyDeconstruction {
  managementGuidance: string[];
  marginOutlook: string;
  competitiveMoat: string;
  tailRisks: string[];
  keyCatalysts: string[];
}

export type TimelineScenarioId = "BULL" | "BASE" | "BEAR" | "BLACK_SWAN";

export interface TimelineScenario {
  id: TimelineScenarioId;
  name: string;
  probabilityPercent: number; // Probability weight (0 - 100), all timelines sum to 100%
  expectedReturnRange: string; // e.g. "+3.5% to +8.0%"
  targetPrice: number; // Quantitative target price in INR
  stopLossPrice: number; // Quantitative stop-loss price in INR
  catalystTriggers: string[];
  invalidationCondition: string; // Structural level or condition that negates this thesis
  estimatedFrictionPercent: number; // SEBI statutory levies (STT, GST, Exchange, Stamp duty)
}

export interface MultiTimelineResult {
  symbol: string;
  currentPrice: number;
  timelines: TimelineScenario[];
  activeTimelineId: TimelineScenarioId;
  strategyDeconstruction: CorporateStrategyDeconstruction;
  timestamp: string;
}

export interface MonteCarloPercentileRibbon {
  day: number;
  p5: number;
  p10: number;
  p50: number;
  p90: number;
  p95: number;
}

export interface MonteCarloPathSummary {
  medianReturnPercent: number;
  maxDrawdownPercent: number;
  profitProbability: number;
  var95: number;
  var99: number;
  expectedTerminalPrice: number;
}

export interface MonteCarloSimulationResult {
  symbol: string;
  currentPrice: number;
  simulatedDays: number;
  totalPaths: number;
  ribbons: MonteCarloPercentileRibbon[];
  valueAtRisk95Percent: number;
  valueAtRisk99Percent: number;
  medianTerminalPrice: number;
  probabilityProfit: number;
}

export type AIEngineProvider = "GROQ" | "GEMINI" | "GROK" | "OFFLINE_HEURISTIC";

export interface AIGatewayRequest {
  symbol: string;
  provider: AIEngineProvider;
  apiKey?: string;
  newsHeadline?: string;
  customNewsText?: string;
  strategyPreset?: string;
  currentPrice?: number;
}

export interface AIGatewayResponse {
  reasoningSteps: string[];
  timelines: TimelineScenario[];
  strategyDeconstruction: CorporateStrategyDeconstruction;
}
