# MarketLens (मार्केट लेंस)

<div align="center">

![MarketLens Banner](https://img.shields.io/badge/MarketLens-Institutional%20Quantitative%20Terminal-0ea5e9?style=for-the-badge&logo=apple&logoColor=white)

**An auditable, after-cost quantitative research workstation and institutional paper trading platform for Indian cash equities (NSE/BSE).**

[![Vercel Deployment](https://img.shields.io/badge/Vercel-Live%20Production-10b981?style=flat-square&logo=vercel&logoColor=white)](https://market-lens-kappa.vercel.app)
[![Vitest](https://img.shields.io/badge/Tests-Vitest%20%7C%20unittest%20%7C%20Playwright-38bdf8?style=flat-square&logo=vitest&logoColor=white)](web)
[![TypeScript](https://img.shields.io/badge/TypeScript-7.0.2-3178c6?style=flat-square&logo=typescript&logoColor=white)](web/tsconfig.json)
[![React](https://img.shields.io/badge/React-19.3.0-61dafb?style=flat-square&logo=react&logoColor=black)](web/package.json)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.156-009688?style=flat-square&logo=fastapi&logoColor=white)](backend/pyproject.toml)
[![Python](https://img.shields.io/badge/Python-3.12%2B-3776ab?style=flat-square&logo=python&logoColor=white)](backend/pyproject.toml)
[![Liquid Glass UI](https://img.shields.io/badge/Design-Apple%20Liquid%20Glass-f59e0b?style=flat-square&logo=apple&logoColor=white)](web/src/styles.css)
[![Zero Real Risk](https://img.shields.io/badge/SEBI-Zero%20Live%20Execution%20Risk-purple?style=flat-square)](docs/compliance/MARKET-DATA-AND-PUBLICATION.md)

[Live Demo](https://market-lens-kappa.vercel.app) • [Architecture](#system-architecture) • [Key Features](#key-features) • [Quickstart](#local-setup--quickstart) • [API Keys Guide](#environment--api-keys) • [Documentation](docs/README.md)

</div>

---

## Executive Summary

**MarketLens** bridges the gap between academic quantitative finance and real-world Indian capital market operations. Traditional paper trading simulators suffer from idealized assumptions: zero transaction costs, 24/7 unconstrained execution, and absence of regulatory friction. 

MarketLens solves this by delivering an **auditable, after-cost research platform** featuring:
1. **Strict Indian Market Hours (09:15–15:15 IST)** with mandatory **3:15 PM MIS Intraday Auto Square-Off** and forced-liquidation audit trails.
2. **Itemized Statutory Tax Slip Reconciliation** calculating brokerage caps, STT, exchange turnover fees, SEBI charges, stamp duty, and 18% GST down to the paise.
3. **Hybrid AI Strategy Lab & Grok Reasoning Sandbox** combining technical indicators, earnings conference call transcripts, and live Indian news sentiment into multi-timeline probabilistic simulations (Bull, Base, Bear, Black Swan).
4. **Apple Liquid Frosted Glass Interface** engineered to Apple Human Interface Guidelines with tactile feedback, zero horizontal overflow, and responsive fidelity across all viewports.
5. **Zero Mandatory API Keys**: Runs out of the box: prices come from the unofficial Yahoo Finance feed (delayed, and the app says so when the feed is down), and the AI lab has a built-in rule-based reasoning engine, with optional support for Groq (Llama 3.3 70B), Google Gemini (1.5 Flash) and xAI Grok when you paste your own key.

---

## System Architecture

MarketLens employs a modern decoupled architecture consisting of an ultra-responsive client workstation built with **React 19**, an asynchronous high-throughput backend powered by **FastAPI**, and multi-provider failover telemetry pipelines.

### 1. End-to-End System Architecture

```mermaid
flowchart TD
    subgraph ClientLayer["Frontend Client (React 19 + TypeScript + Apple Liquid Glass)"]
        Workstation["Bloomberg Command Shell\n(Top Tape, Blotter, Cmd+K Search)"]
        Explorer["Stocks Explorer &\nDiscovery Shelves"]
        Charts["Interactive Multi-Timeframe\nCandlestick & Line Charts"]
        PaperTerm["Paper Trading Terminal\n(09:15-15:15 IST & Auto Square-off)"]
        AILab["Hybrid AI Strategy Lab\n(Grok Reasoning & Multi-Timeline Engine)"]
        SIPStudio["Mutual Funds &\nSIP Return Studio"]
        IPODiscovery["IPO Discovery &\nGMP Tracker"]
    end

    subgraph EdgeLayer["Edge / Routing Layer (Vercel Production)"]
        CDN["Vercel Edge Network\n(Static Cache & HTTPS)"]
        ViteProxy["Vite Dev / API Reverse Proxy"]
    end

    subgraph BackendLayer["Backend Services (FastAPI + Asynchronous Python 3.12+)"]
        API["FastAPI REST & Telemetry Endpoints\n(/api/v1/market/...)"]
        LiveFeed["Live Market Feed Manager\n(10-Second In-Memory Cache)"]
        CostEngine["Statutory Cost Accounting Engine\n(Brokerage, STT, GST, Stamp Duty)"]
        HoursEngine["Market Hours State Machine\n(IST Clock, Square-Off Trigger)"]
        SyntheticEngine["Synthetic Fixture Generator\n(Academic Fallback)"]
    end

    subgraph ExternalServices["External Telemetry & AI Providers"]
        YahooFeed["Yahoo Finance (unofficial)\n(Delayed Quotes, Charts, Symbol Search)"]
        OtherFeeds["NSE website (IPOs) · mfapi.in (NAVs)\nGoogle News RSS"]
        GroqCloud["Groq Cloud API\n(Llama 3.3 70B Versatile, ~800 t/s)"]
        GoogleGemini["Google AI Studio\n(Gemini 1.5 Flash)"]
        xAI["xAI Grok API\n(Grok-2)"]
    end

    ClientLayer --> EdgeLayer
    EdgeLayer --> BackendLayer
    BackendLayer --> LiveFeed
    LiveFeed --> YahooFeed
    LiveFeed --> OtherFeeds
    AILab -.->|Client-Side HTTPS| GroqCloud
    AILab -.->|Client-Side HTTPS| GoogleGemini
    AILab -.->|Client-Side HTTPS| xAI
    AILab -->|Zero-Key Fallback| ClientLayer
```

---

### 2. Real-Time Telemetry & Data Flow

```mermaid
flowchart LR
    Yahoo["Yahoo Finance (unofficial)"] -->|HTTPS JSON| Ingest["Feed Normalizer\n(Symbol Aliasing & Validation)"]
    Other["NSE website · mfapi.in · Google News RSS"] -->|HTTPS| Ingest
    
    Ingest --> MemCache["10-Second In-Memory Quote Cache\n(LTP, Change %, OHLC)"]
    
    MemCache --> REST["FastAPI Telemetry Endpoints\n(/api/v1/market/quotes, /search)"]
    
    REST --> ClientCache["Client Memory & State Store\n(Auto-refresh every 3s-15s)"]
    
    ClientCache --> UI_Tape["Indices Tape Ribbon\n(NIFTY 50, SENSEX, BANKNIFTY)"]
    ClientCache --> UI_Shelves["Discovery Shelves\n(Gainers, Losers, Active Volume)"]
    ClientCache --> UI_Charts["Technical Chart Canvas\n(SMA20, SMA50, VWAP, RSI)"]
```

---

### 3. Indian Market Session & Auto Square-Off State Machine

```mermaid
stateDiagram-v2
    [*] --> OvernightClosed: 15:30 to 09:00 IST
    
    OvernightClosed --> PreOpen: 09:00 to 09:15 IST
    PreOpen --> RegularTradingOpen: 09:15 IST (Bell Rings)
    
    state RegularTradingOpen {
        [*] --> ActiveTrading
        ActiveTrading --> PlaceOrder: User Buys/Sells
        PlaceOrder --> PositionLedger: Validate Margin & Record
        PositionLedger --> ActiveTrading
    }
    
    RegularTradingOpen --> SquareOffWindow: 15:15 IST (MIS Cutoff)
    
    state SquareOffWindow {
        [*] --> AutoLiquidation
        AutoLiquidation --> ForceClosePositions: Close all open intraday positions at current LTP
        ForceClosePositions --> ReconcileCharges: Itemize Brokerage, STT, SEBI, GST
        ReconcileCharges --> AuditLog: Append to Execution Audit Trail
    }
    
    SquareOffWindow --> PostClosing: 15:30 IST
    PostClosing --> OvernightClosed: 16:00 IST
    
    note right of SquareOffWindow
        In 24/7 Simulator Bypass Mode,
        users can toggle off-hours trading
        for weekend testing.
    end note
```

---

### 4. Hybrid AI Strategy Lab Simulation Pipeline

```mermaid
sequenceDiagram
    autonumber
    actor User as Quantitative Researcher
    participant UI as AI Strategy Lab UI
    participant Gateway as AI Gateway (aiGateway.ts)
    participant LLM as Groq / Gemini / Heuristic Engine
    participant Engine as Timeline Engine (timelineEngine.ts)
    participant Paper as Paper Trading Ledger

    User->>UI: Select Stock (e.g. RELIANCE), Strategy Preset & Concall Sandbox
    User->>UI: Click "Run Strategy Simulation"
    UI->>Gateway: Dispatch AIGatewayRequest (technicals, news, concall, prompt)
    
    alt External Provider Configured (Groq/Gemini/Grok)
        Gateway->>LLM: POST Prompt with Indian Market Grounding (NSE/BSE, FII/DII, statutory costs)
        LLM-->>Gateway: Structured JSON Response (Scenarios, Rationale, Guidance)
    else Zero-Key Offline Heuristic
        Gateway->>Gateway: Execute Deterministic Causal Rules (RSI, VWAP, SMA crossovers)
    end
    
    Gateway->>Engine: Synthesize Multi-Timeline Scenarios (Bull, Base, Bear, Tail Risk)
    Engine-->>UI: Return 4 Scenarios, Target/Stop Prices, Confidence & Reasoning Stream
    UI->>User: Render Interactive Timeline Branching Tree & Reasoning Log
    User->>UI: Click "Execute Setup in Paper Terminal"
    UI->>Paper: Place Bracket Order (LTP, Target, Stop Loss)
    Paper-->>User: Order Executed with Itemized Statutory Tax Slip
```

---

## Key Features

### 1. Bloomberg Launchpad Workstation Shell
- **Command Bar & Tape**: 44px sticky Launchpad header featuring live indices tape ribbon (NIFTY 50, SENSEX, BANKNIFTY, NIFTY IT, MIDCAP 100).
- **Cash Blotter & P&L**: Immediate readout of available margin, deployed equity capital, and intraday realized/unrealized profit & loss.
- **Global Command Palette**: Accessible via `Cmd + K` (Mac) or `Ctrl + K` (Windows/Linux) with instant fuzzy search across all equities and direct page routing.
- **Theme Toggle**: One-click switching between Dark Terminal mode and High-Contrast Light mode.

### 2. Apple Liquid Frosted Glass Interface
- Built to strict **Apple Human Interface Guidelines (HIG)** and modern liquid glass physics:
  - **Surface Tint & Dispersion**: `linear-gradient(135deg, rgba(255, 255, 255, 0.10) 0%, rgba(255, 255, 255, 0.02) 100%), rgba(12, 18, 32, 0.52)`
  - **Diffusion Blur**: High-diffusion `backdrop-filter: blur(28px) saturate(210%)`
  - **Specular Edge Lighting**: `inset 0 1px 1px 0 rgba(255, 255, 255, 0.30)` top rim highlight
  - **Hairline Specular Borders**: Delicate 1px translucent borders (`rgba(255, 255, 255, 0.16)`)
  - **Atmospheric Glow Refraction**: Radial background ambient gradients (warm amber at 92%, cool cyan at 6%) softly refracting through translucent cards.
- Mobile-first responsive layouts, 44×44px minimum touch targets, fluid typography, zero horizontal scroll leak.

### 3. Stocks Explorer & Discovery Shelves
- **Real-Time Market Breadth**: Live gainers vs losers ratio and total volume turnover.
- **Institutional Shelves**: Curated sections for Top Gainers, Top Losers, and High Relative Volume.
- **Market-Cap Segmentation**: Quick tabs for Large Cap (Nifty 50), Mid Cap (Nifty Midcap 100), and Small Cap equities.
- **52-Week Range Bar**: Visual representation of current LTP position relative to high/low extremes.

### 4. Technical Analysis & Interactive Charting
- **Multi-Timeframe Charts**: Switch between 1-Day, 5-Day, 1-Month, 6-Month, 1-Year, and 5-Year historical spans.
- **Technical Overlays**:
  - 20-period and 50-period Simple Moving Averages (SMA-20, SMA-50).
  - Volume Weighted Average Price (VWAP) dynamic intraday bands.
  - Relative Strength Index (RSI-14) with overbought (>70) and oversold (<30) thresholds.
- **Precision Hover Tooltip**: Instant price, change, timestamp, and indicator readout on cursor movement.

### 5. Strict Indian Market Hours Paper Trading Terminal
- **NSE Trading Schedule**:
  - Pre-Open: 09:00 – 09:15 IST
  - Normal Market: 09:15 – 15:30 IST
  - MIS Auto Square-off Cutoff: **15:15 IST**
- **3:15 PM Square-off Engine**: Automatically flags and force-liquidates all open intraday (MIS) paper positions at 3:15 PM to enforce zero overnight carry risk.
- **24/7 Simulator Mode**: Toggle switch allows testing strategies and order placement during off-market hours and weekends.
- **Statutory Tax Slip Reconciliation**: Every order generates an itemized SEBI tax breakdown:
  - Brokerage (flat ₹20 or 0.03% cap)
  - Securities Transaction Tax (STT - 0.025% on intraday sell / 0.1% on delivery)
  - Exchange Transaction Charges (NSE 0.00297%)
  - SEBI Regulatory Turnover Fee (₹10 per crore)
  - Stamp Duty (0.003% intraday, 0.015% delivery; buy side only)
  - Goods and Services Tax (GST - 18% applied on brokerage and transaction fees)
  - All rates live in one file, `backend/data/fee_schedule.json` (mirrored for the web app, and a test fails if the two drift). Its `status` field says they mirror published broker schedules and are **unverified** against current NSE/SEBI circulars.

### 6. Hybrid AI Strategy Lab & Grok Reasoning Sandbox
- **Multi-Timeline Probabilistic Forecasting**: Generates four distinct forward-looking market paths:
  1. *Bullish Growth Scenario* (Upward breakout with positive catalysts)
  2. *Base Case / Mean Reversion* (Rangebound oscillation near VWAP)
  3. *Bearish Headwinds Scenario* (Correction towards major SMA supports)
  4. *Black Swan / Tail Risk Scenario* (Severe macro shocks or regulatory clampdown)
- **Corporate Strategy Deconstruction**: Analyzes management guidance, EBITDA margin outlook, competitive moats, and key operational tail-risks.
- **Live News Feed & Sentiment Ticker**: Real-time Indian financial news stream integrated directly into prompts.
- **Earnings Concall Sandbox**: Editable corporate disclosure testbed for stress-testing narrative sentiment impact on stock prices.
- **Multi-Model Provider Support**:
  - **Groq Cloud**: Llama-3.3-70B-Versatile (~800 tokens/sec ultra-fast execution)
  - **Google Gemini**: Gemini 1.5 Flash
  - **xAI Grok**: Grok-2
  - **Offline Heuristic Engine**: Zero-key deterministic quantitative model

### 7. IPO Discovery & GMP Tracker
- Comprehensive tracker for Indian initial public offerings across **Open**, **Upcoming**, and **Recently Listed** tranches.
- Detailed metrics including Price Band (₹), Lot Size, Total Issue Size (₹ Cr), Grey Market Premium (GMP) estimates, and live subscription multiples across QIB, NII, and Retail quotas.

### 8. Mutual Funds & SIP Return Studio
- Interactive compound interest simulator calculating expected wealth maturity based on monthly SIP contribution, expected return rate, and investment horizon.
- Visual asset distribution breakdown between Invested Capital and Wealth Gain.
- Filterable showcase of top 5-star direct Indian mutual funds across Index Funds, Flexi Cap, Large Cap, and ELSS Tax Savers.

---

## Technology Stack

| Layer | Technologies | Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | React 19.3.0, TypeScript 7.0.2 | Component architecture, strict type safety |
| **Build & Bundler** | Vite 8.3.4 | Ultra-fast HMR and optimized production bundles |
| **Styling & Design** | Pure CSS3 (Apple HIG Tokens) | Liquid glassmorphism, responsive clamp typography |
| **Unit & E2E Testing** | Vitest 5.0.5, Playwright | High-speed test runner & browser automation audit |
| **Backend Framework** | FastAPI 0.156, Python 3.12+ | Asynchronous REST endpoints, high concurrency |
| **ASGI Server** | Uvicorn 0.54 | Asynchronous production server |
| **HTTP & Market Feeds** | HTTPX 0.28, AsyncIO | Non-blocking quote fetching with a 10-second cache |
| **AI Inference** | Groq API, Gemini API, xAI API | LLM quantitative reasoning and scenario synthesis |
| **Edge Hosting** | Vercel Serverless Edge | Global CDN distribution, automated CI/CD |

---

## Directory Structure

```text
MarketLens/
├── .agents/
│   └── rules/
│       └── frontend-design.md     # Apple HIG and responsive design invariants
├── backend/                       # Python FastAPI Backend Service
│   ├── pyproject.toml             # uv / PEP 621 dependency specifications
│   ├── src/
│   │   └── bazaar_drishti/
│   │       ├── api/
│   │       │   └── app.py         # FastAPI application factory & endpoints
│   │       ├── market/
│   │       │   └── live_feed.py   # Yahoo Finance, NSE IPO, mfapi.in & news feeds
│   │       ├── research/          # SMA backtest & statutory fee calculations
│   │       ├── bundle/            # Immutable run bundle validation & publisher
│   │       └── synthetic.py       # Deterministic academic fixture generator
│   └── tests/                     # Unit and integration test suite
├── docs/                          # Comprehensive Technical Specifications
│   ├── architecture/TRD.md        # Technical Requirements Document
│   ├── product/PRD.md             # Product Requirements Document
│   └── compliance/                # Market data licensing & publication rules
├── skills/                        # Autonomous AI Agent Capabilities
│   ├── apple-ui-design/           # Apple HIG design system guidelines
│   ├── liquid-glass-design/       # Authentic liquid frosted glass tokens & rules
│   ├── react-performance/         # Vercel React best practices
│   └── responsive-design/         # Breakpoint & container query standards
├── web/                           # React 19 Frontend Web Application
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── real_user_audit.mjs        # Cross-viewport automated visual audit
│   └── src/
│       ├── App.tsx                # Master workstation layout & tab router
│       ├── styles.css             # Apple Liquid Glass CSS design tokens
│       ├── components/            # Header, SearchBar, StrategyCard, Charts
│       ├── pages/                 # Explorer, Trends, Paper, AI Lab, IPO, Funds
│       ├── services/              # Multi-model AI gateway (aiGateway.ts)
│       ├── utils/                 # Market hours, Monte Carlo, statutory friction
│       └── types/                 # TypeScript interfaces for market & AI schemas
├── .env.example                   # Full environment variables documentation
└── README.md                      # Primary project reference
```

---

## Local Setup & Quickstart

### Prerequisites
- **Node.js**: `v22.12.0` or higher (Node 24 recommended)
- **Package Manager**: `pnpm` (`npm install -g pnpm`)
- **Python**: `3.12` or newer (CI tests 3.12, the Render runtime, and 3.14), managed via `uv` or a standard virtualenv

---

### Step 1: Clone the Repository
```bash
git clone https://github.com/Krishpotanwar/MarketLens.git
cd MarketLens
```

---

### Step 2: Frontend Setup & Launch
```bash
cd web
pnpm install
pnpm dev
```
Open **`http://localhost:5173`** in your browser. Prices need the backend (Step 3): without it every price shows "—" and the page says the market feed is unavailable. It never shows a made-up price.

---

### Step 3: Backend Setup (needed for prices)
In a separate terminal:
```bash
cd backend
# Using uv (recommended)
uv sync
uv run python src/bazaar_drishti/synthetic.py
uv run python -m uvicorn bazaar_drishti.api.app:create_default_app --factory --port 8000 --host 127.0.0.1
```
Health check endpoint: `curl http://127.0.0.1:8000/healthz`

---

## Environment & API Keys

MarketLens needs **no API keys**. The only frontend variable is the backend URL. AI provider keys are typed into the app, and are deliberately never read from build-time variables.

### Environment Variable Matrix

| Variable | Scope | Description |
| :--- | :--- | :--- |
| `VITE_API_URL` | Frontend | Backend base URL. Leave empty for the local dev proxy. |
| `GIT_SHA` / `RENDER_GIT_COMMIT` | Backend | Optional. Stamped on run receipts as the code revision. |

### Using an AI provider key

Open the **AI Strategy Lab**, pick **Groq**, **Gemini** or **Grok**, and paste your key into the API Key box. It is kept in that browser's `localStorage` **as plain text** (do not use a shared computer) and is sent only to the provider you chose. With no key, the built-in rule-based engine runs.

> [!WARNING]
> Never put an AI key in a `VITE_*` variable or a Vercel environment variable. Vite compiles every `VITE_*` value into the public JavaScript bundle, so every visitor could read it. A test (`web/src/noBuildTimeSecrets.test.ts`) fails if any source reads one.

---

## Verification & Testing Suites

MarketLens enforces rigorous quality gates before any code is merged or deployed.

### 1. Frontend Unit & Integration Tests
```bash
cd web
pnpm test
```
Runs the full Vitest suite covering:
- Strict Indian Market Hours & 3:15 PM Auto Square-Off (`marketHours.test.ts`)
- Statutory Cost Accounting & Monte Carlo Simulation (`monteCarlo.test.ts`)
- Global Command Palette Keyboard Interactions (`GlobalSearchBar.test.tsx`)
- AI Gateway & Fallback Execution (`aiGateway.test.ts`)
- Apple Glassmorphism CSS Token Compliance (`glassmorphism.test.ts`)
- Full Application Viewport Rendering (`App.test.tsx`)

### 2. Cross-Viewport Real User Audit
```bash
node web/real_user_audit.mjs
```
Automated Playwright simulation testing real user journeys (order execution, searches, timeline generation, tab switches) across 4 screen sizes:
- **Desktop**: 1440 × 900
- **Laptop**: 1280 × 800
- **Tablet**: 768 × 1024
- **Mobile**: 375 × 812

### 3. Backend Tests (hermetic: no test touches the real internet)
```bash
cd backend
PYTHONPATH=src uv run --group dev python -m unittest discover tests
PYTHONPATH=src uv run --group dev mypy src tests && uv run --group dev ruff check . && uv run --group dev ruff format --check .
```

### 4. End-to-End Browser Tests
```bash
npx playwright test   # starts the API against e2e/fake_upstream.py and the Vite dev server
```
The API runs against a deterministic fake of every upstream (Yahoo, NSE, mfapi, news) and the browser clock is pinned where market hours matter, so the suite needs no network and passes at any time of day.

### 5. Production Build Validation
```bash
cd web
pnpm build
```
Ensures complete TypeScript compilation (`tsc --noEmit`) and Vite bundle tree-shaking with zero warnings.

---

## Academic & Regulatory Notice

> [!IMPORTANT]
> **MarketLens is strictly an educational research workstation and paper trading simulator.**
> - It does not provide financial advice, broker recommendations, or return guarantees.
> - No live real-money order execution is routed to exchanges.
> - All cash balances, portfolio holdings, and execution logs are virtual.
> - Statutory charges and taxes are calculated based on published SEBI/NSE schedules for realistic academic cost attribution.

---

## Author & Maintainers

- **Lead Developer**: Krish Potanwar ([@Krishpotanwar](https://github.com/Krishpotanwar))
- **Email**: `kpotanwar@gmail.com`
- **Repository**: [https://github.com/Krishpotanwar/MarketLens](https://github.com/Krishpotanwar/MarketLens)
- **Live Deployment**: [https://market-lens-kappa.vercel.app](https://market-lens-kappa.vercel.app)

---

## License

This project is licensed under the [MIT License](LICENSE).
