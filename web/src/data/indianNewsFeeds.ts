import type { IndianNewsItem, CompanyConcallPreset } from "../types/aiSimulation";

/**
 * Curated Indian equity financial news feeds.
 * High-context operational headlines from Moneycontrol, Economic Times, LiveMint,
 * and NSE Corporate Announcements across bluechips and high-beta momentum stocks.
 */
export const INDIAN_NEWS_FEEDS: IndianNewsItem[] = [
  // --- RELIANCE INDUSTRIES ---
  {
    id: "news-reliance-01",
    symbol: "RELIANCE",
    title: "Reliance Jio Posts 12% Net Profit Surge on Tariff Revisions; Jamnagar Solar Giga-Factory Commissioning on Track",
    source: "LiveMint",
    publishedAt: "2024-10-21T08:15:00.000Z",
    sentimentScore: 0.78,
    sentimentLabel: "BULLISH",
    category: "EARNINGS",
    summary: "Reliance Industries' telecom arm posted strong ARPU expansion to ₹195.1 following pan-India tariff hikes. Management confirmed phase-1 solar PV giga-factory at Jamnagar will commence commercial production by Q4 FY25.",
  },
  {
    id: "news-reliance-02",
    symbol: "RELIANCE",
    title: "Reliance Retail Expands 30-Minute Quick Commerce Pilot; CCI Scrutinizes Hyperlocal Logistics Discounting",
    source: "Economic Times",
    publishedAt: "2024-10-20T14:30:00.000Z",
    sentimentScore: 0.12,
    sentimentLabel: "NEUTRAL",
    category: "REGULATORY",
    summary: "Reliance Retail is expanding 30-minute hyperlocal delivery across 20 metro clusters using existing grocery store hubs. Watchdog reviews predatory pricing concerns raised by traditional FMCG distributors.",
  },

  // --- TCS ---
  {
    id: "news-tcs-01",
    symbol: "TCS",
    title: "TCS Secures $1.2B Mega-Deal Renewal with UK Insurance Giant Phoenix Group with GenAI Infusion",
    source: "Moneycontrol",
    publishedAt: "2024-10-21T07:45:00.000Z",
    sentimentScore: 0.82,
    sentimentLabel: "BULLISH",
    category: "DEAL_WIN",
    summary: "Tata Consultancy Services expanded its 15-year strategic partnership with Phoenix Group to transform insurance policy operations using TCS BaNCS and enterprise sovereign AI infrastructure.",
  },
  {
    id: "news-tcs-02",
    symbol: "TCS",
    title: "TCS Q2 Commentary Flags Discretionary Spending Inflection in North American BFSI Pipelines",
    source: "LiveMint",
    publishedAt: "2024-10-18T16:00:00.000Z",
    sentimentScore: 0.65,
    sentimentLabel: "BULLISH",
    category: "EARNINGS",
    summary: "Management highlighted sequential BFSI turnaround after four quarters of deceleration. Total Contract Value (TCV) held strong at $8.6B with book-to-bill ratio of 1.2x and operating margin at 24.1%.",
  },

  // --- HDFC BANK ---
  {
    id: "news-hdfcbank-01",
    symbol: "HDFCBANK",
    title: "RBI Draft Guidelines Propose Higher Runoff Factors on Digital Deposits; HDFC Bank Maintains LCR Above 128%",
    source: "Economic Times",
    publishedAt: "2024-10-19T11:20:00.000Z",
    sentimentScore: -0.28,
    sentimentLabel: "BEARISH",
    category: "REGULATORY",
    summary: "RBI draft liquidity framework mandating an extra 5% runoff factor on internet and mobile banking deposits threatens to weigh on commercial bank NIMs, though HDFC Bank holds ample liquidity buffer.",
  },
  {
    id: "news-hdfcbank-02",
    symbol: "HDFCBANK",
    title: "HDFC Bank Rebalances Balance Sheet with 15.4% Deposit Growth; LDR Nears Target Normalization Band",
    source: "NSE Corporate Announcements",
    publishedAt: "2024-10-21T09:00:00.000Z",
    sentimentScore: 0.52,
    sentimentLabel: "BULLISH",
    category: "EARNINGS",
    summary: "Credit-to-deposit ratio eased toward 99.8% in Q2 as retail deposit mobilization outpaced loan book growth, strengthening net interest margin outlook for H2 FY25.",
  },

  // --- INFOSYS ---
  {
    id: "news-infy-01",
    symbol: "INFY",
    title: "Infosys Lifts FY25 Revenue Guidance to 3.75-4.50% on Surging Topaz Generative AI Engagements",
    source: "Moneycontrol",
    publishedAt: "2024-10-20T17:15:00.000Z",
    sentimentScore: 0.74,
    sentimentLabel: "BULLISH",
    category: "EARNINGS",
    summary: "Infosys raised constant-currency annual guidance driven by $2.4B large deal wins. Project Maximus delivered 50 bps operating margin efficiency, lifting operating margins to 21.1%.",
  },
  {
    id: "news-infy-02",
    symbol: "INFY",
    title: "Infosys Signs €450 Million Cloud Modernization and AI-Ops Partnership with European Telecom Major",
    source: "Economic Times",
    publishedAt: "2024-10-17T10:10:00.000Z",
    sentimentScore: 0.68,
    sentimentLabel: "BULLISH",
    category: "DEAL_WIN",
    summary: "Infosys will re-architect core BSS/OSS telecom infrastructure for Nordic telecom carrier using cognitive orchestration agents and hybrid sovereign cloud environments.",
  },

  // --- ZOMATO ---
  {
    id: "news-zomato-01",
    symbol: "ZOMATO",
    title: "Zomato Blinkit Accelerates Dark Store Rollout to 791 Hubs; Core Metro Unit Economics Turn Cash Positive",
    source: "LiveMint",
    publishedAt: "2024-10-21T10:30:00.000Z",
    sentimentScore: 0.86,
    sentimentLabel: "BULLISH",
    category: "EARNINGS",
    summary: "Blinkit recorded 122% YoY Gross Order Value expansion with top-5 metro dark stores generating 4.3% contribution margin, validating quick commerce unit economics.",
  },
  {
    id: "news-zomato-02",
    symbol: "ZOMATO",
    title: "Zomato Approves ₹8,500 Crore QIP to Expand Micro-Warehouse Network and Going-Out Vertical",
    source: "NSE Corporate Announcements",
    publishedAt: "2024-10-20T13:45:00.000Z",
    sentimentScore: 0.40,
    sentimentLabel: "BULLISH",
    category: "CAPEX",
    summary: "Institutional placement provides a strong fortress balance sheet to scale dark store count to 2,000 locations by FY26 and integrate acquired Paytm Insider live entertainment business.",
  },

  // --- TATA STEEL ---
  {
    id: "news-tatasteel-01",
    symbol: "TATASTEEL",
    title: "Tata Steel Finalizes £500M UK Government Grant for Port Talbot Electric Arc Furnace Transformation",
    source: "LiveMint",
    publishedAt: "2024-10-19T08:00:00.000Z",
    sentimentScore: 0.58,
    sentimentLabel: "BULLISH",
    category: "CAPEX",
    summary: "Signing of binding grant agreement secures funding for 3 MTPA state-of-the-art EAF in Wales, mitigating UK blast furnace recurring cash burn from late FY25 onwards.",
  },
  {
    id: "news-tatasteel-02",
    symbol: "TATASTEEL",
    title: "Steel Association Urges Directorate General of Trade Remedies to Impose Anti-Dumping Duties on Asian Imports",
    source: "Moneycontrol",
    publishedAt: "2024-10-18T12:00:00.000Z",
    sentimentScore: 0.35,
    sentimentLabel: "BULLISH",
    category: "SECTOR_MACRO",
    summary: "Surge in discount Chinese steel exports to 8-year highs prompted Indian primary producers to petition for 15-25% safeguard duties to protect domestic hot-rolled coil price spreads.",
  },

  // --- DIXON TECHNOLOGIES ---
  {
    id: "news-dixon-01",
    symbol: "DIXON",
    title: "Dixon Technologies Commissions 1-Million Sq Ft Smartphone Manufacturing Facility in Noida",
    source: "Economic Times",
    publishedAt: "2024-10-21T06:30:00.000Z",
    sentimentScore: 0.84,
    sentimentLabel: "BULLISH",
    category: "CAPEX",
    summary: "New Noida manufacturing complex raises annual smartphone production capacity to 45M units under Production-Linked Incentive (PLI) schemes for marquee global OEM clients.",
  },
  {
    id: "news-dixon-02",
    symbol: "DIXON",
    title: "Dixon Technologies Q2 Net Profit Soars 85% as Mobile & EMS Segment Volume Doubles",
    source: "LiveMint",
    publishedAt: "2024-10-19T15:20:00.000Z",
    sentimentScore: 0.76,
    sentimentLabel: "BULLISH",
    category: "EARNINGS",
    summary: "Dixon posted 133% YoY revenue surge driven by smartphone assembly scaling, display module joint ventures, and precision component localization lifting blended ROCE above 32%.",
  },

  // --- SUZLON ENERGY ---
  {
    id: "news-suzlon-01",
    symbol: "SUZLON",
    title: "Suzlon Bags Landmark 1,166 MW Wind Power Project from NTPC Green Energy — Largest Ever Indian WTG Order",
    source: "NSE Corporate Announcements",
    publishedAt: "2024-10-21T11:00:00.000Z",
    sentimentScore: 0.94,
    sentimentLabel: "BULLISH",
    category: "DEAL_WIN",
    summary: "Suzlon will deploy 370 units of 3.15 MW S144 hybrid wind turbines in Gujarat for NTPC Green Energy, elevating cumulative order book past an all-time record 5.4 GW.",
  },
  {
    id: "news-suzlon-02",
    symbol: "SUZLON",
    title: "Suzlon Turns Net Debt-Free with ₹1,200 Cr Cash Surplus; CRISIL Upgrades Rating to 'A+/Stable'",
    source: "Moneycontrol",
    publishedAt: "2024-10-18T09:15:00.000Z",
    sentimentScore: 0.75,
    sentimentLabel: "BULLISH",
    category: "EARNINGS",
    summary: "Complete debt turnaround combined with 14.5 GW O&M fleet cash flows enables Suzlon to capture major market share in India's 500 GW 2030 renewable capacity expansion.",
  },

  // --- CDSL ---
  {
    id: "news-cdsl-01",
    symbol: "CDSL",
    title: "SEBI Directs Uniform True-to-Label Charges for Depositories; CDSL Transitions to Flat Fee Matrix",
    source: "Economic Times",
    publishedAt: "2024-10-20T11:45:00.000Z",
    sentimentScore: -0.32,
    sentimentLabel: "BEARISH",
    category: "REGULATORY",
    summary: "SEBI circular mandating uniform fees without volume rebates forces CDSL to establish a flat transaction rate of ₹3.50 per debit, creating mild near-term fee compression before volume growth normalizes revenue.",
  },
  {
    id: "news-cdsl-02",
    symbol: "CDSL",
    title: "CDSL Crosses Milestone of 13 Crore Active Demat Accounts as Systematic Investment Participation Surges",
    source: "NSE Corporate Announcements",
    publishedAt: "2024-10-19T13:00:00.000Z",
    sentimentScore: 0.70,
    sentimentLabel: "BULLISH",
    category: "EARNINGS",
    summary: "CDSL commands over 77% market share in incremental retail demat accounts, driven by tier-2/3 retail investor participation and fintech broker API integrations.",
  },

  // --- STATE BANK OF INDIA ---
  {
    id: "news-sbin-01",
    symbol: "SBIN",
    title: "State Bank of India Q2 Net Profit Reaches Record ₹18,331 Cr; Gross NPA Drops to 2.13%",
    source: "LiveMint",
    publishedAt: "2024-10-21T12:00:00.000Z",
    sentimentScore: 0.83,
    sentimentLabel: "BULLISH",
    category: "EARNINGS",
    summary: "SBI reported stellar asset quality with slippage ratio dropping to 0.79% and ROA expanding to 1.17%. Corporate credit pipeline stands robust at ₹4.8 lakh crore across manufacturing and green infrastructure.",
  },
  {
    id: "news-sbin-02",
    symbol: "SBIN",
    title: "SBI Flags Stable NIMs at 3.25%; Sees Corporate Capex Credit Growth Driving H2 Loan Book",
    source: "Moneycontrol",
    publishedAt: "2024-10-20T10:30:00.000Z",
    sentimentScore: 0.55,
    sentimentLabel: "BULLISH",
    category: "SECTOR_MACRO",
    summary: "SBI Chairman expressed confidence in maintaining loan growth at 15-16% with comfortable Capital Adequacy Ratio (CRAR) of 13.8%, citing strong demand from private capex and infrastructure.",
  },

  // --- LARSEN & TOUBRO ---
  {
    id: "news-lt-01",
    symbol: "LT",
    title: "Larsen & Toubro Bags Ultra-Mega Offshore Hydrocarbon Contract Above ₹15,000 Cr from Aramco",
    source: "NSE Corporate Announcements",
    publishedAt: "2024-10-21T08:45:00.000Z",
    sentimentScore: 0.88,
    sentimentLabel: "BULLISH",
    category: "DEAL_WIN",
    summary: "L&T Energy Hydrocarbon division secured a mega EPCI contract in Saudi Arabia, taking consolidated order book past the historic milestone of ₹5.1 lakh crore.",
  },
  {
    id: "news-lt-02",
    symbol: "LT",
    title: "L&T Expands Green Hydrogen Electrolyser Manufacturing Hub at Hazira under Lakshya 2026 Plan",
    source: "Economic Times",
    publishedAt: "2024-10-19T14:10:00.000Z",
    sentimentScore: 0.62,
    sentimentLabel: "BULLISH",
    category: "CAPEX",
    summary: "Larsen & Toubro accelerates clean tech industrial manufacturing with indigenous alkaline electrolyzer fabrication in Gujarat, targeting decarbonization of heavy domestic industries.",
  },

  // --- TATA MOTORS ---
  {
    id: "news-tatamotors-01",
    symbol: "TATAMOTORS",
    title: "Tata Motors Demerger Approved: Pure-Play EV & Passenger Vehicle Entity Set for Strategic Agility",
    source: "NSE Corporate Announcements",
    publishedAt: "2024-10-20T08:30:00.000Z",
    sentimentScore: 0.62,
    sentimentLabel: "BULLISH",
    category: "REGULATORY",
    summary: "Shareholders approve demerger into two listed entities: commercial vehicles and passenger vehicles (including JLR and EV businesses), unlocking focused capital allocation.",
  },

  // --- BHARTI AIRTEL ---
  {
    id: "news-bhartiartl-01",
    symbol: "BHARTIARTL",
    title: "Bharti Airtel ARPU Hits Industry-Best ₹211; 5G FWA Expansion Accelerates in 500 Cities",
    source: "Moneycontrol",
    publishedAt: "2024-10-21T13:15:00.000Z",
    sentimentScore: 0.77,
    sentimentLabel: "BULLISH",
    category: "EARNINGS",
    summary: "Airtel posted premium subscriber additions and tariff hike flow-through. Fixed Wireless Access (FWA) Airtel AirFiber expands high-margin home broadband coverage.",
  },

  // --- ICICI BANK ---
  {
    id: "news-icicibank-01",
    symbol: "ICICIBANK",
    title: "ICICI Bank Posts 14.5% YoY Profit Growth; Core Net Interest Margin Outperforms Peers at 4.27%",
    source: "LiveMint",
    publishedAt: "2024-10-21T15:00:00.000Z",
    sentimentScore: 0.80,
    sentimentLabel: "BULLISH",
    category: "EARNINGS",
    summary: "ICICI Bank delivered consistent performance driven by retail loan expansion and granular low-cost current-and-savings-account (CASA) deposit resilience.",
  },
];

/**
 * Company corporate concall transcripts, filings, and guidance presets.
 * Supplies realistic institutional disclosures for multi-timeline AI scenario generation.
 */
export const COMPANY_CONCALL_PRESETS: Record<string, CompanyConcallPreset> = {
  RELIANCE: {
    recentFilings: [
      "NSE Intimation: Outcome of Board Meeting - Approval of 1:1 Bonus Issue of Equity Shares",
      "Q2 FY25 Consolidated Financial Results & Segment Revenue Breakup (Jio, Retail, O2C)",
      "Corporate Presentation: Progress Update on Dhirubhai Ambani Green Energy Giga Complex Jamnagar",
    ],
    concallTranscriptSnippet:
      "Management highlighted: 'Jio ARPU increased to ₹195.1 led by the recent tariff rationalization, with 5G data traffic now exceeding 34% of total network load. In Retail, square footage additions stood at 2.4 million sq ft with footfalls up 16%. In O2C, global downstream petrochemical margins faced near-term headwinds due to regional capacity additions, but fuel cracks stabilized. New Energy phase-1 solar manufacturing module line will reach full operational scale in early 2025.'",
    guidanceKeypoints: [
      "ARPU trajectory targeting ₹215-220 over the next 12-18 months driven by non-linear 5G monetization.",
      "Retail EBITDA margins expected to expand 60-80 bps via supply chain automation and private label scale.",
      "Capex moderation in telecom infrastructure as 5G rollouts near completion; capex pivot towards New Energy.",
      "Exploration of value unlocking via separate market listings for Jio Infocomm and Reliance Retail.",
    ],
  },

  TCS: {
    recentFilings: [
      "NSE Announcement: Press Release on Q2 Financial Results - Net Profit at ₹11,909 Cr",
      "SEBI Reg 30: Multi-Year Strategic Transformation Deal with JLR and Phoenix Group",
      "Outcome of Nomination & Remuneration Committee: Annual Performance Incentives and Attrition Trajectory",
    ],
    concallTranscriptSnippet:
      "CEO & MD noted: 'We are witnessing early signs of recovery in BFSI, particularly in capital markets and consumer banking transformation pipelines. GenAI engagement count crossed 600 projects, transitioning from proof-of-concept experimentation into enterprise-scale deployments. Operating margins expanded 10 bps to 24.1% despite annual salary increments, supported by superior utilization of 85.5%.'",
    guidanceKeypoints: [
      "Targeting steady-state operating margin band of 26-28% through structural pyramid optimization.",
      "BFSI discretionary spending inflecting positively as US interest rate easing cycle gains momentum.",
      "Strong order book book-to-bill sustained above 1.1x with average quarterly TCV run-rate of $8-$10 billion.",
      "Zero interest in dilutive M&A; capital allocation remains focused on returning >80% free cash flow to shareholders via dividends and buybacks.",
    ],
  },

  HDFCBANK: {
    recentFilings: [
      "Q2 FY25 Financial Results: Net Profit at ₹16,821 Cr, Net Interest Margin at 3.46%",
      "Basel III Pillar 3 Disclosures: Liquidity Coverage Ratio (LCR) at 128.4%",
      "Press Release: HDB Financial Services Initial Public Offering (IPO) Board Approval",
    ],
    concallTranscriptSnippet:
      "MD & CEO remarked: 'Our strategic priority remains credit-to-deposit ratio normalization without compromising on asset quality. During the quarter, deposit growth stood at 15.1% while advances grew at a calibrated 7.0%, successfully steering LDR down towards the pre-merger 90-95% equilibrium range. Asset quality remains best-in-class with GNPA at 1.36% and credit cost at 42 bps.'",
    guidanceKeypoints: [
      "Deposit accretion targeting 1.5x-2.0x system growth via 8,000+ branch footprint mobilization.",
      "Net Interest Margin expected to bottom out in H1 FY25 and gradually expand back towards 3.70%.",
      "HDB Financial Services stake sale / IPO to unlock shareholder value and bolster Tier-1 capital ratios by ~80-100 bps.",
      "Cost-to-income ratio projected to trend down toward 38% over the medium term as tech integration synergies materialize.",
    ],
  },

  INFY: {
    recentFilings: [
      "Press Release: Financial Results for Quarter Ended September 30, FY25 - Upgraded Guidance",
      "Investor Presentation: Generative AI Suite 'Topaz' Client Deployments and Cloud Cobalt Milestones",
      "Intimation of Interim Dividend Declaration: ₹21 per equity share",
    ],
    concallTranscriptSnippet:
      "CEO stated: 'Broad-based traction across financial services, retail, and manufacturing propelled our constant currency revenue growth to 3.1% QoQ. Project Maximus margin expansion framework generated 50 bps of operating tailwind, helping us absorb wage hikes. Large deal TCV came in at $2.4 billion, 52% of which was net new work.'",
    guidanceKeypoints: [
      "FY25 revenue growth guidance raised to 3.75-4.50% in constant currency terms.",
      "Operating margin guidance reaffirmed at 20.0-22.0% for the full fiscal year.",
      "GenAI Topaz framework embedded into 90% of active enterprise bids.",
      "Sub-contractor costs targeted to be compressed below 6.5% of revenue via offshore talent insourcing.",
    ],
  },

  ZOMATO: {
    recentFilings: [
      "NSE Announcement: Postal Ballot Notice for Raising Capital up to ₹8,500 Crore via QIP",
      "Q2 FY25 Shareholder Letter: Quick Commerce GOV Grows 122% YoY, Blinkit Store Count at 791",
      "SEBI Reg 30: Completion of Acquisition of Paytm Insider Ticketing and Events Business for ₹2,048 Cr",
    ],
    concallTranscriptSnippet:
      "CEO commented: 'Blinkit's economics are scaling ahead of our internal plans. Top 5 cities are already generating healthy positive contribution margins of 4.3% of GOV. We are confident in our path to expand dark store footprint to 2,000 stores by FY26 while keeping corporate cash burn negligible. The QIP capital buffer is purely defensive to deter aggressive venture-backed subsidized price competition.'",
    guidanceKeypoints: [
      "Blinkit GOV targeted to outgrow food delivery GOV within the next 4 quarters.",
      "Food delivery adjusted EBITDA margin expected to sustain at 3.5-4.0% of GOV.",
      "Going-out segment (Paytm Insider + Zomato Live) targeted to become the 3rd pillar of profitable growth.",
      "Consolidated adjusted EBITDA margin expected to double by FY27 on operating leverage.",
    ],
  },

  TATASTEEL: {
    recentFilings: [
      "Q2 FY25 Audited Consolidated Financial Results and Production Volumes",
      "NSE Intimation: Execution of UK Decarbonization Grant Funding Agreement of £500M",
      "Investor Presentation: Kalinganagar Phase 2 5-MTPA Blast Furnace Commissioning",
    ],
    concallTranscriptSnippet:
      "Executive Director noted: 'India operations delivered industry-leading EBITDA of ₹13,400 per tonne, driven by strong infrastructure consumption and automotive demand. The commissioning of the 5 MTPA blast furnace at Kalinganagar is a game changer, lowering our hot metal cash cost by $30/t. In the UK, closing the heavy blast furnaces and moving to EAF will stem ongoing operational cash drains starting late FY25.'",
    guidanceKeypoints: [
      "Indian domestic steel capacity expanding from 21 MTPA to 40 MTPA by 2030.",
      "European operations targeted to reach cash-neutral threshold post blast furnace shutdown in FY26.",
      "Net debt reduction target of $1.0 billion annually supported by India free cash generation.",
      "Kalinganagar cold rolling mill and pellet plant ramp-up to enhance value-added flat steel mix.",
    ],
  },

  DIXON: {
    recentFilings: [
      "Press Release: Financial Results for Quarter Ended September 30, FY25 - Revenue Up 133% YoY",
      "Intimation of JV / Technology Transfer Agreement with Longcheer for Mobile Phone ODM",
      "SEBI Reg 30: Expansion of Component Ecosystem via Display Module Assembly Plant",
    ],
    concallTranscriptSnippet:
      "Vice Chairman & MD stated: 'Our mobile and EMS volumes exploded this quarter, delivering 8.5 million smartphones. With the addition of Transsion and new export allocations from global tech leaders, our monthly capacity will cross 4.5 million units. Backward integration into precision plastic tooling, sheet metal, and camera modules is underway to lift blended margins by 60-80 bps.'",
    guidanceKeypoints: [
      "Mobile phone assembly volume guidance raised to 40-45 million units for FY25.",
      "Capex of ₹400-500 crore planned for FY25, funded entirely via internal cash flows.",
      "Entering IT hardware (laptops and servers) with global OEMs under IT Hardware PLI 2.0.",
      "Targeting return on capital employed (ROCE) exceeding 30% through asset-light ODM models.",
    ],
  },

  SUZLON: {
    recentFilings: [
      "NSE Announcement: All-Time High Order Book of 5.4 GW as of Q2 FY25",
      "Credit Rating Upgrade from CRISIL to 'A+/Stable' on Long-Term Bank Facilities",
      "Outcome of Board Meeting: Strategic Re-entry into Global Wind Turbines via Commercial Alliances",
    ],
    concallTranscriptSnippet:
      "Group CEO stated: 'Our turnaround is now complete. Suzlon operates on a net debt-free balance sheet with ₹1,200 crore cash surplus. Execution momentum is accelerating, with deliveries of our 3.x MW S144 series wind turbine generator meeting stellar customer reception. India's national mandate of 500 GW non-fossil capacity by 2030 provides an unmatched tailwind for wind-solar hybrid projects.'",
    guidanceKeypoints: [
      "Turbine supply volume guidance of 1.5 - 2.0 GW for FY25, doubling in FY26.",
      "EBITDA margin guidance maintained in the 15-16% range on stable raw material costs.",
      "Operations & Maintenance (O&M) services fleet exceeding 14.5 GW, generating annuity recurring cash flow.",
      "Bid pipeline exceeding 12 GW over next 18 months in C&I and CPSU competitive tenders.",
    ],
  },

  CDSL: {
    recentFilings: [
      "Financial Results for Q2 FY25: Operating Revenue Up 55% YoY, PAT Reaches ₹162 Cr",
      "NSE Disclosure: Total Demat Accounts Registered Surpasses 130 Million Mark",
      "SEBI Circular Compliance: Revised Uniform Tariff Structure w.e.f. October 1, 2024",
    ],
    concallTranscriptSnippet:
      "MD & CEO remarked: 'The Indian retail capital market democratization is secular. We opened over 1 crore new demat accounts this quarter alone. While SEBI's uniform tariff structure resets our per-transaction realization slightly, the relentless surge in daily cash market trades and mutual fund SIP volume provides a strong operating leverage cushion. Our software platforms are processing over 80 million API calls daily.'",
    guidanceKeypoints: [
      "Transaction revenue expected to normalize quickly as retail trading volumes hit record highs.",
      "Annual Issuer Charges (AIC) to grow 18-20% YoY backed by record unlisted and IPO company onboardings.",
      "Operating margins projected to remain resilient in the 58-62% range due to minimal variable costs.",
      "Ongoing investments in cybersecurity, dual-data center disaster recovery, and latency reduction.",
    ],
  },

  SBIN: {
    recentFilings: [
      "Q2 FY25 Financial Results: Standalone Net Profit at ₹18,331 Cr, ROA at 1.17%",
      "Basel III Disclosures: CET-1 Ratio at 10.38%, Capital Adequacy Ratio at 13.76%",
      "Press Release: YONO 2.0 Digital Platform Architecture and Agri-Stack Integration",
    ],
    concallTranscriptSnippet:
      "Chairman remarked: 'Credit growth has been broad-based at 15.1%, driven by retail loans growing 14.8% and corporate loans expanding 12.3%. Asset quality is at its cleanest in over 15 years with Gross NPA at 2.13% and Net NPA at 0.53%. Slippage ratio has compressed to 0.79%. Corporate capex sanctions pipeline is strong at ₹4.8 lakh crore across renewables, roads, metals, and semiconductors.'",
    guidanceKeypoints: [
      "Targeting loan book growth of 14-16% for FY25 with stable NIMs around 3.25% - 3.30%.",
      "Return on Assets (ROA) expected to sustain above 1.10% and ROE above 18%.",
      "Credit costs guided to remain benign below 50 bps.",
      "YONO digital platform driving over 65% of personal loan disbursements and 45% of digital deposit originations.",
    ],
  },

  LT: {
    recentFilings: [
      "NSE Intimation: Consolidated Order Book Reaches Record ₹5,10,402 Crore as of Q2 FY25",
      "Q2 FY25 Financial Results: Revenue from Operations Up 21% YoY to ₹61,555 Cr",
      "Corporate Announcement: Strategic Expansion of Hazira Green Hydrogen & Electrolyser Giga-Facility",
    ],
    concallTranscriptSnippet:
      "Whole-time Director & CFO stated: 'Consolidated order inflows grew 12% YoY, led by international energy hydrocarbons and domestic infrastructure orders. The international order book now comprises 38% of our backlog, offering healthy margin resilience. We are firmly on track to deliver our FY25 revenue growth guidance of 15% and order inflow growth of 10%.'",
    guidanceKeypoints: [
      "Consolidated revenue growth guided at 15% and order inflows at 10% for FY25.",
      "Core EPC operating margins expected to improve to 8.25-8.50% by Q4 as legacy fixed-price contracts roll off.",
      "Net working capital to revenue ratio targeted at 16.0%.",
      "Disciplined exit from non-core assets (Hyderabad Metro refinancing, Nabha Power divestment) to boost ROCE.",
    ],
  },

  TATAMOTORS: {
    recentFilings: [
      "NSE Intimation: Scheme of Arrangement for Demerger of Commercial and Passenger Vehicle Undertakings",
      "Q2 FY25 Results: JLR EBIT Margin Expands to 8.9%, Free Cash Flow at £751M",
      "Press Release: Launch of Curvv EV and Gen-3 Electric Architecture Roadmap",
    ],
    concallTranscriptSnippet:
      "Group CFO remarked: 'JLR order bank remains solid at over 150,000 units with Defender and Range Rover accounting for 68% of demand. In India, despite festive-season inventory normalization in Commercial Vehicles, our EV market share in Passenger Vehicles remains dominant at 65%+'",
    guidanceKeypoints: [
      "JLR net cash positive target on track by end of FY25.",
      "Commercial vehicles margin resilience via fleet management telemetry and LNG/Hydrogen trucks.",
      "Demerger scheduled for completion in H1 FY26 to provide clean pure-play equity vehicles.",
    ],
  },

  BHARTIARTL: {
    recentFilings: [
      "Q2 FY25 Financial Results: Consolidated Revenue Up 12.0% YoY, ARPU Touches ₹211",
      "Corporate Announcement: Africa Currency Devaluation Mitigations and Debt Refinancing",
      "SEBI Reg 30: Expansion of Airtel IQ and Cloud Communications B2B Stack",
    ],
    concallTranscriptSnippet:
      "MD & CEO highlighted: 'Our strategy of winning quality customers continues to yield industry-leading ARPU. We added 4.2 million 4G/5G data customers in India this quarter. Our Airtel AirFiber FWA service is live across all 22 circles, closing the last-mile broadband connectivity gap.'",
    guidanceKeypoints: [
      "Targeting ARPU of ₹250 over the medium term and ₹300 long term.",
      "Capex intensity moderating as 5G coverage rollouts achieve pan-India maturity.",
      "Enterprise Airtel Business growing double digits supported by data center scale and cyber security solutions.",
    ],
  },

  ICICIBANK: {
    recentFilings: [
      "Q2 FY25 Standalone Financial Results: Net Profit at ₹11,746 Cr, Up 14.5% YoY",
      "Basel III Disclosures: CET-1 Ratio at 15.96%, LCR at 122.6%",
      "Investor Presentation: Digital Footprint Scaling and iMobile Pay Transaction Milestones",
    ],
    concallTranscriptSnippet:
      "Executive Director stated: 'We sustained our focus on risk-calibrated operating profit growth. Domestic loan portfolio grew 15.7% YoY with business banking expanding 38%. Our Net Interest Margin of 4.27% reflects disciplined liability franchise pricing and steady CASA ratios.'",
    guidanceKeypoints: [
      "NIMs expected to stabilize within the 4.15-4.30% corridor.",
      "Continued investments in branch presence, tech modernization, and workforce additions.",
      "Credit quality across retail and corporate segments expected to remain benign with provision coverage ratio (PCR) > 80%.",
    ],
  },
};

/**
 * Filter curated news items by stock symbol.
 * If symbol is not directly matched, returns all general market feeds.
 */
export function getNewsForStock(symbol: string): IndianNewsItem[] {
  const normalized = symbol.trim().toUpperCase();
  const matched = INDIAN_NEWS_FEEDS.filter(
    (item) => item.symbol.toUpperCase() === normalized
  );
  if (matched.length > 0) {
    return matched;
  }
  // Return broader market news if stock-specific item is unavailable
  return INDIAN_NEWS_FEEDS.slice(0, 5);
}

/**
 * Get company concall and corporate filing preset for a given stock symbol.
 */
export function getConcallPreset(symbol: string): CompanyConcallPreset | undefined {
  const normalized = symbol.trim().toUpperCase();
  return COMPANY_CONCALL_PRESETS[normalized];
}
