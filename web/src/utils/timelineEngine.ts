/**
 * Multi-Timeline Scenario Branching Engine
 *
 * Implements quantitative branching scenario modeling for Indian equities,
 * calibrating probabilities dynamically across Bull, Base, Bear, and Black-Swan
 * regimes based on technical indicators (LTP, SMA20, SMA50, RSI, VWAP),
 * corporate event sentiment, and SEBI statutory levies.
 */

import type {
  TimelineScenario,
  TimelineScenarioId,
  MultiTimelineResult,
  CorporateStrategyDeconstruction,
} from "../types/aiSimulation";
import { getConcallPreset } from "../data/indianNewsFeeds";

export interface GenerateTimelineScenariosParams {
  symbol: string;
  ltp: number;
  sma20: number;
  sma50: number;
  rsi: number;
  vwap: number;
  sentimentScore?: number; // -1.0 (strongly bearish) to +1.0 (strongly bullish)
  newsHeadline?: string;
  newsCategory?: string;
  atr?: number; // Optional Average True Range for dynamic volatility scaling
}

export interface StatutoryFrictionEstimate {
  brokerage: number;
  stt: number;
  stampDuty: number;
  exchangeAndSebi: number;
  gst: number;
  totalCharges: number;
  frictionPercent: number;
}

/**
 * Calculates Indian equity statutory levies per SEBI & NSE schedules.
 * - Brokerage: Flat ₹20 per executed order
 * - STT: 0.1% on delivery turnover
 * - Stamp Duty: 0.015% on buy turnover
 * - Exchange Turnover Fee: 0.00345%
 * - SEBI Turnover Charge: 0.0001% (₹10 / crore)
 * - GST: 18% on (Brokerage + Exchange & SEBI charges)
 */
export function calculateStatutoryFriction(
  turnoverINR: number = 50000
): StatutoryFrictionEstimate {
  const turnover = Math.max(1, turnoverINR);
  const brokerage = 20;
  const stt = turnover * 0.001;
  const stampDuty = turnover * 0.00015;
  const exchangeAndSebi = turnover * (0.0000345 + 0.000001);
  const gst = (brokerage + exchangeAndSebi) * 0.18;
  const totalCharges = brokerage + stt + stampDuty + exchangeAndSebi + gst;
  const frictionPercent = (totalCharges / turnover) * 100;

  return {
    brokerage,
    stt: Math.round(stt * 100) / 100,
    stampDuty: Math.round(stampDuty * 100) / 100,
    exchangeAndSebi: Math.round(exchangeAndSebi * 100) / 100,
    gst: Math.round(gst * 100) / 100,
    totalCharges: Math.round(totalCharges * 100) / 100,
    frictionPercent: Math.round(frictionPercent * 1000) / 1000,
  };
}

/**
 * Returns the estimated percentage friction of statutory levies for a given turnover.
 */
export function calculateStatutoryFrictionPercent(
  turnoverINR: number = 50000
): number {
  return calculateStatutoryFriction(turnoverINR).frictionPercent;
}

/**
 * Synthesizes or retrieves corporate strategy deconstruction.
 */
function buildCorporateStrategy(
  symbol: string,
  headline?: string
): CorporateStrategyDeconstruction {
  const preset = getConcallPreset(symbol);
  const upperSymbol = symbol.trim().toUpperCase();

  if (preset && preset.guidanceKeypoints.length > 0) {
    // Curated strategy deconstruction for preset stocks
    const marginOutlooks: Record<string, string> = {
      RELIANCE:
        "Operating EBITDA margins projected to expand 40-70 bps supported by Jio ARPU inflection and petchem downstream recovery.",
      TCS: "Targeting EBIT margin band of 26-28% driven by delivery optimization and Project Maximus productivity.",
      HDFCBANK:
        "NIM stabilization guided within 3.45-3.55% corridor as deposit re-pricing lags loan growth normalization.",
      INFY: "Operating margin corridor maintained at 20-22% aided by Topaz AI automation and pyramid rationalization.",
      ZOMATO:
        "Blinkit quick-commerce adjusted EBITDA break-even trajectory on track with take-rates improving 30 bps.",
      TATASTEEL:
        "Domestic EBITDA per tonne guided between ₹14,000-15,500 backed by Kalinganagar blast furnace ramp-up.",
      DIXON:
        "Operating margins resilient at 3.8-4.2% with rapid backward integration in display and camera modules.",
      SUZLON:
        "Gross margins expanding toward 34-36% backed by high-margin S144 3.x MW wind turbine deliveries.",
      CDSL: "Operating margins resilient in the 58-62% range due to fixed operating leverage on demat account scale.",
      SBIN: "Net interest margins expected to sustain at 3.25-3.30% with credit costs benign below 50 bps.",
      LT: "Core EPC operating margins expected to improve to 8.25-8.50% by Q4 as legacy fixed-price contracts roll off.",
      TATAMOTORS:
        "JLR EBIT margin guided to sustain above 8.5% with commercial vehicle margins supported by price hikes.",
      BHARTIARTL:
        "Consolidated EBITDA margin targeted above 52% with capex intensity moderating post-5G pan-India rollout.",
      ICICIBANK:
        "NIMs expected to stabilize within 4.15-4.30% corridor with provision coverage ratio sustaining above 80%.",
    };

    const moats: Record<string, string> = {
      RELIANCE:
        "Dominant pan-India digital telecommunications infrastructure (Jio) paired with unmatched integrated refining and retail supply chain footprint.",
      TCS: "Unrivaled global tier-1 enterprise delivery ecosystem, high multi-year client stickiness, and proprietary BaNCS fintech IP.",
      HDFCBANK:
        "Low-cost CASA deposit franchise, unmatched retail branch reach, and pristine multi-decade risk underwriting culture.",
      INFY: "Enterprise AI adoption leadership (Topaz), robust Fortune 500 enterprise relationships, and disciplined global delivery network.",
      ZOMATO:
        "Deep consumer hyper-local mindshare, dense micro-warehouse dark-store network, and powerful dual-flywheel synergy.",
      TATASTEEL:
        "Captive iron ore mines providing significant raw material cost insulation and high-value automotive steel relationships.",
      DIXON:
        "Largest scale electronic manufacturing services (EMS) ecosystem in India with PLI scheme incentives and OEM stickiness.",
      SUZLON:
        "Dominant 32% cumulative wind installation market share in India with vertically integrated blade and nacelle manufacturing.",
      CDSL: "Duopoly depository market structure with ~77% retail demat account share and high secular switching friction.",
      SBIN: "Sovereign-backed banking franchise with unmatched 22,000+ branch footprint and ₹50+ lakh crore deposit base.",
      LT: "Monolithic domestic infrastructure execution capability, ₹5+ lakh crore order backlog, and unmatched technical scale.",
      TATAMOTORS:
        "Global luxury automotive brand cachet (JLR) and dominant 65%+ domestic passenger electric vehicle market share.",
      BHARTIARTL:
        "Industry-leading ARPU, high-value premium subscriber base, and expansive enterprise B2B cloud communications network.",
      ICICIBANK:
        "Agile digital banking architecture (iMobile Pay), diverse retail liability franchise, and high-quality corporate loan book.",
    };

    const tailRisksMap: Record<string, string[]> = {
      RELIANCE: [
        "Global refining margin volatility and petrochemical product spread compression.",
        "Delays in commercial off-take from Jamnagar New Energy giga-complexes.",
        "Regulatory interventions regarding telecom spectrum charges or retail discounting.",
      ],
      TCS: [
        "Prolonged slowdown in North American BFSI discretionary technology budgets.",
        "Foreign currency fluctuations (USD/INR and GBP/INR) impacting realization.",
        "Accelerating wage inflation in specialized GenAI engineering roles.",
      ],
      HDFCBANK: [
        "Regulatory tightening by RBI regarding digital deposit runoff factors and LCR.",
        "Prolonged compression in credit-to-deposit ratio slowing balance sheet expansion.",
        "Elevated cost of retail deposit mobilization under tight systemic liquidity.",
      ],
      INFY: [
        "Client decision delays on large digital transformation transformation programs.",
        "Sub-contractor expense spikes during rapid AI project deployments.",
        "Visa regulatory restrictions in key overseas delivery jurisdictions.",
      ],
    };

    const keyCatalystsMap: Record<string, string[]> = {
      RELIANCE: [
        "Value-unlocking listing roadmap for Jio and Reliance Retail subsidiaries.",
        "Phase-1 commercial production start at Jamnagar solar PV giga-factory.",
        "Sustained quarterly tariff hikes expanding telecom ARPU toward ₹220+.",
      ],
      TCS: [
        "Mega-deal ramp-ups converting into accelerated double-digit revenue run rates.",
        "Recovery in discretionary banking enterprise spending across US and UK.",
        "Expanded operating margins via automated delivery productivity.",
      ],
      HDFCBANK: [
        "Normalization of credit-deposit ratio below 90% improving net interest margins.",
        "Acceleration in branch-level retail CASA mobilization.",
        "Resolution of liquidity friction unlocking robust corporate credit disbursements.",
      ],
      INFY: [
        "Topaz Generative AI engagements scaling into recurring multi-million-dollar retainers.",
        "Further upward revisions to annual constant-currency revenue guidance.",
        "Project Maximus delivering additional 50-75 bps operating margin expansion.",
      ],
    };

    return {
      managementGuidance: preset.guidanceKeypoints,
      marginOutlook:
        marginOutlooks[upperSymbol] ||
        `Operating margins projected to sustain within resilient band, backed by operating leverage and disciplined pricing power.`,
      competitiveMoat:
        moats[upperSymbol] ||
        `Robust competitive positioning supported by established market share, distribution advantages, and customer retention.`,
      tailRisks: tailRisksMap[upperSymbol] || [
        "Macroeconomic interest rate fluctuations dampening sector capex cycle.",
        "Raw material input cost spikes or adverse foreign exchange volatility.",
        "Evolving regulatory guidelines and heightened domestic competitive intensity.",
      ],
      keyCatalysts: keyCatalystsMap[upperSymbol] || [
        "Quarterly earnings beat driven by operational productivity and market share gains.",
        "Strategic client contract renewals and expanding order backlog pipeline.",
        "Sustained institutional FII and DII mutual fund accumulation.",
      ],
    };
  }

  // Fallback for custom or non-preset stocks
  return {
    managementGuidance: [
      `${symbol} management projects double-digit revenue expansion over FY25-26 cycle.`,
      `Capex allocation targeted toward capacity expansion and digital automation infrastructure.`,
      `Operating cash flow prioritized for disciplined working capital and debt reduction.`,
    ],
    marginOutlook:
      "Operating EBITDA margins projected to hold steady within historical benchmark corridor, aided by procurement discipline and scale efficiency.",
    competitiveMoat:
      `High barrier to entry anchored in established market relationships, operational know-how, and domestic distribution channels.`,
    tailRisks: [
      "Input cost inflation and supply-chain logistics volatility.",
      "Unexpected regulatory tightening or policy shifts by domestic statutory authorities.",
      "Macroeconomic slowdown dampening end-market demand and pricing power.",
    ],
    keyCatalysts: [
      headline
        ? `Operational execution following announcement: "${headline.slice(0, 70)}..."`
        : `Acceleration in quarterly order bookings and capacity utilization.`,
      `Sustained institutional accumulation as financial results confirm margin resilience.`,
      `Positive sector tailwinds and supportive government capital expenditure policies.`,
    ],
  };
}

/**
 * Generates four multi-timeline branching scenarios (Bull, Base, Bear, Black-Swan)
 * dynamically calibrated using technical levels, sentiment score, and Indian statutory friction.
 */
export function generateTimelineScenarios(
  params: GenerateTimelineScenariosParams
): MultiTimelineResult {
  const {
    symbol,
    ltp,
    sma20,
    sma50,
    rsi,
    vwap,
    sentimentScore = 0.0,
    newsHeadline,
    newsCategory,
    atr,
  } = params;

  // Volatility proxy: ATR or 1.8% of LTP
  const atrValue = atr && atr > 0 ? atr : Math.max(ltp * 0.018, 1.0);

  // 1. Dynamic Probability Calibration
  // Normalized sentiment score: clamped [-1.0, 1.0]
  const clampedSentiment = Math.max(-1.0, Math.min(1.0, sentimentScore));

  // Technical Factors
  const smaSpreadRatio = sma50 > 0 ? (sma20 - sma50) / sma50 : 0;
  const smaShift = Math.max(-10, Math.min(10, smaSpreadRatio * 150));

  const vwapDiffRatio = vwap > 0 ? (ltp - vwap) / vwap : 0;
  const vwapShift = Math.max(-8, Math.min(8, vwapDiffRatio * 150));

  // RSI deviation from neutral 50
  const rsiShift = ((rsi - 50) / 50) * 10; // -10 to +10

  // Sentiment factor
  const sentimentShift = clampedSentiment * 16; // -16 to +16

  // Composite directional bull bias (-40 to +40)
  const compositeBias =
    sentimentShift * 1.0 +
    smaShift * 1.0 +
    vwapShift * 0.8 +
    rsiShift * 0.7;

  // Raw probabilities
  let rawBull = Math.max(6, 25 + compositeBias);
  let rawBear = Math.max(6, 20 - compositeBias);

  // Black swan probability: base 4%, elevated during extreme negative sentiment or regulatory news
  let rawBlackSwan = 4.0;
  if (clampedSentiment < -0.4) {
    rawBlackSwan += Math.abs(clampedSentiment + 0.4) * 5;
  }
  if (newsCategory === "REGULATORY" && clampedSentiment < 0) {
    rawBlackSwan += 2.0;
  }
  rawBlackSwan = Math.max(2.0, Math.min(8.0, rawBlackSwan));

  // Base scenario absorbs center mass
  let rawBase = Math.max(15, 51 - Math.abs(compositeBias) * 0.4);

  // Strict normalization to 100.0%
  const totalRaw = rawBull + rawBase + rawBear + rawBlackSwan;
  let bullProb = Math.round((rawBull / totalRaw) * 1000) / 10;
  let bearProb = Math.round((rawBear / totalRaw) * 1000) / 10;
  let blackSwanProb = Math.round((rawBlackSwan / totalRaw) * 1000) / 10;
  let baseProb = Math.round((100.0 - (bullProb + bearProb + blackSwanProb)) * 10) / 10;

  // Ensure base probability stays non-negative and all sum to 100.0
  if (baseProb < 5) {
    baseProb = 5.0;
    const remaining = 95.0 - blackSwanProb;
    const subTotal = bullProb + bearProb;
    bullProb = Math.round((bullProb / subTotal) * remaining * 10) / 10;
    bearProb = Math.round((remaining - bullProb) * 10) / 10;
  }

  // Statutory friction for a standard ₹50,000 order lot
  const statutory = calculateStatutoryFriction(Math.max(50000, ltp * 25));

  // 2. Scenario Price Levels & Structural Barriers
  // BULL Scenario: Upward breakout
  const bullTarget = Math.round((ltp + atrValue * 2.8) * 100) / 100;
  // Stop loss below VWAP or 1.2 ATR below LTP, strictly below LTP
  const bullStop =
    Math.round(
      Math.max(
        ltp * 0.94,
        Math.min(ltp - atrValue * 1.1, vwap < ltp ? vwap * 0.994 : ltp - atrValue * 1.1)
      ) * 100
    ) / 100;

  // BASE Scenario: Consolidation / Range-bound
  const baseTarget = Math.round((ltp + atrValue * 0.9) * 100) / 100;
  const baseStop = Math.round((ltp - atrValue * 0.9) * 100) / 100;

  // BEAR Scenario: Downward corrective retest
  // Target < ltp, Stop Loss > ltp
  const bearTarget = Math.round((ltp - atrValue * 2.5) * 100) / 100;
  const bearStop =
    Math.round(
      Math.min(
        ltp * 1.06,
        Math.max(ltp + atrValue * 1.1, sma20 > ltp ? sma20 * 1.006 : ltp + atrValue * 1.1)
      ) * 100
    ) / 100;

  // BLACK_SWAN Scenario: Extreme tail risk crash
  const blackSwanTarget = Math.round((ltp * 0.83) * 100) / 100;
  const blackSwanStop = Math.round((ltp * 1.035) * 100) / 100;

  // 3. Assemble Scenarios
  const bullTimeline: TimelineScenario = {
    id: "BULL",
    name: "Aggressive Bull Breakout",
    probabilityPercent: bullProb,
    expectedReturnRange: `+${((bullTarget / ltp - 1) * 100).toFixed(1)}% to +${(
      (bullTarget / ltp - 1) * 100 +
      2.5
    ).toFixed(1)}%`,
    targetPrice: bullTarget,
    stopLossPrice: bullStop,
    catalystTriggers: [
      "Volume breakout > 1.8x average confirming institutional accumulation",
      `Sustained momentum above VWAP benchmark (₹${vwap.toFixed(2)})`,
      "Quarterly concall margin expansion and positive domestic institutional inflows",
    ],
    invalidationCondition: `Sustained breakdown below key VWAP support (₹${vwap.toFixed(
      2
    )}) or 20-day SMA (₹${sma20.toFixed(2)}) on heavy distribution volume.`,
    estimatedFrictionPercent: statutory.frictionPercent,
  };

  const baseTimeline: TimelineScenario = {
    id: "BASE",
    name: "Baseline Consolidation",
    probabilityPercent: baseProb,
    expectedReturnRange: `-1.5% to +2.5%`,
    targetPrice: baseTarget,
    stopLossPrice: baseStop,
    catalystTriggers: [
      "In-line quarterly financial metrics matching consensus estimates",
      `Mean-reversion oscillation around 20-day SMA (₹${sma20.toFixed(2)})`,
      "Balanced institutional DII/FII flows with range-bound derivative open interest",
    ],
    invalidationCondition: `Decisive breakout outside the consolidation corridor (₹${baseStop.toFixed(
      2
    )} - ₹${baseTarget.toFixed(2)}) with institutional volume confirmation.`,
    estimatedFrictionPercent: statutory.frictionPercent,
  };

  const bearTimeline: TimelineScenario = {
    id: "BEAR",
    name: "Corrective Retest",
    probabilityPercent: bearProb,
    expectedReturnRange: `${((bearTarget / ltp - 1) * 100).toFixed(1)}% to ${(
      (bearTarget / ltp - 1) * 100 +
      2.0
    ).toFixed(1)}%`,
    targetPrice: bearTarget,
    stopLossPrice: bearStop,
    catalystTriggers: [
      "Margin compression or guidance downgrade in quarterly concall",
      `Rejection at overhead resistance with RSI (${rsi.toFixed(1)}) divergence`,
      "Persistent FII net selling and sector-wide profit taking",
    ],
    invalidationCondition: `Decisive reclaim of 20-day SMA (₹${sma20.toFixed(
      2
    )}) and VWAP on expanding buy order flow.`,
    estimatedFrictionPercent: statutory.frictionPercent,
  };

  const blackSwanTimeline: TimelineScenario = {
    id: "BLACK_SWAN",
    name: "Tail Risk / Black Swan",
    probabilityPercent: blackSwanProb,
    expectedReturnRange: `-12.0% to -20.0%`,
    targetPrice: blackSwanTarget,
    stopLossPrice: blackSwanStop,
    catalystTriggers: [
      "Unforeseen regulatory sanction, forensic accounting probe, or SEBI inquiry",
      "Sudden macroeconomic shock, geopolitical contagion, or emergency rate spike",
      "Structural governance lapse or sharp loss of key strategic customer/concession",
    ],
    invalidationCondition:
      "Official exchange clarification or regulatory exoneration dismissing adverse allegations.",
    estimatedFrictionPercent: statutory.frictionPercent,
  };

  const timelines: TimelineScenario[] = [
    bullTimeline,
    baseTimeline,
    bearTimeline,
    blackSwanTimeline,
  ];

  // 4. Determine Active Timeline
  // Select timeline with highest probability or strong directional conviction
  let activeTimelineId: TimelineScenarioId = "BASE";
  if (bullProb > bearProb && bullProb >= 30 && clampedSentiment >= 0) {
    activeTimelineId = "BULL";
  } else if (bearProb > bullProb && bearProb >= 30 && clampedSentiment <= 0) {
    activeTimelineId = "BEAR";
  } else {
    // Argmax of probabilities
    activeTimelineId = timelines.reduce((prev, curr) =>
      curr.probabilityPercent > prev.probabilityPercent ? curr : prev
    ).id;
  }

  // 5. Strategy Deconstruction
  const strategyDeconstruction = buildCorporateStrategy(symbol, newsHeadline);

  return {
    symbol,
    currentPrice: ltp,
    timelines,
    activeTimelineId,
    strategyDeconstruction,
    timestamp: new Date().toISOString(),
  };
}
