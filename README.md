# MarketLens

**An auditable, after-cost quantitative research platform for Indian cash-equity paper trading.**

MarketLens is a reproducible academic research dashboard and evaluation pipeline. It provides a transparent, professor-ready audit of intraday strategy simulations and chronological directional forecasts on Indian equities with exact statutory fee reconciliation, baseline comparisons, and zero live execution risk.

---

## Key Features

- **20/50 SMA Intraday Engine:** Completed-bar signal generation, next-eligible-open execution, and mandatory end-of-session forced flatting (zero overnight carry).
- **Date-Effective Statutory Cost Accounting:** Reconciles every paise across brokerage caps, exchange turnover fees, SEBI charges, sell-side STT, buy-side stamp duty, and GST on statutory fees (`gross - itemized charges - slippage = net`).
- **Chronological Direction Forecast Lab:** Strictly causal features (trailing returns, SMA distance, realized volatility), session boundary purging, training-only standardization, calibrated Brier/log-loss/balanced-accuracy scoring, and exact additive logit contributions.
- **Fail-Closed Rights Gate:** Enforces market data licensing and academic publication approvals before any real market data is ingested or published (`synthetic=true` by default).
- **Immutable Provenance:** SHA-256 fixture checksums, immutable run bundle validation, transactional PostgreSQL publishing with active-pointer swapping and zero-downtime rollback.
- **Accessible Web Dashboard:** React 19, TypeScript, and Vite frontend with Overview, Forecast Lab, and cryptographic Run Receipt exports (WCAG 2.2 AA compliant).

---

## Architecture Overview

```text
[ Data / Fixture ] ---> [ Normalizer & Validator ] ---> [ RightsGate (C0/C1) ]
                                                                |
                                           +--------------------+--------------------+
                                           |                                         |
                            [ SMA Backtest Engine ]                    [ Chronological Forecast ]
                            (Next-bar fill, fees)                      (Purged splits, logit contribs)
                                           |                                         |
                                           +--------------------+--------------------+
                                                                |
                                                   [ Immutable RunBundle Builder ]
                                                                |
                                                   [ Bundle Invariant Validator ]
                                                                |
                                                [ Transactional DB Publisher ]
                                                 (Atomic pointer swap & rollback)
                                                                |
                                                  [ GET-Only FastAPI Service ]
                                                                |
                                                    [ React 19 Web Client ]
```

---

## Local Setup & Quickstart

### Prerequisites
- Python 3.14+ (managed with `uv`)
- Node.js 22.12+ / 24+ and `pnpm`

### 1. Backend Service
```sh
cd backend
uv sync
uv run python src/bazaar_drishti/synthetic.py
uv run python -m uvicorn bazaar_drishti.api.app:app --host 127.0.0.1 --port 8000
```
Health check: `curl http://127.0.0.1:8000/healthz`

### 2. Frontend Web Dashboard
```sh
cd web
pnpm install
pnpm dev
```
Open **`http://localhost:5173`** in your browser.

---

## Test & Verification Suites

### Backend Quality Suite (100% clean)
```sh
cd backend
uv run ruff check .
uv run ruff format --check .
uv run mypy src tests
uv run python -m unittest discover -s tests -v
```

### Frontend Quality Suite (100% clean)
```sh
cd web
pnpm test
pnpm run typecheck
pnpm run build
```

---

## Project Documentation

Detailed specifications and compliance records are located in `docs/`:
- [Product Requirements Document (PRD)](docs/product/PRD.md)
- [Technical Requirements Document (TRD)](docs/architecture/TRD.md)
- [Market Data & Publication Compliance](docs/compliance/MARKET-DATA-AND-PUBLICATION.md)
- [Operational Runbook](docs/project/RUNBOOK.md)
- [Checkpoints & Release Gates](docs/project/CHECKPOINTS.md)
- [Engineering Logbook](docs/project/LOGBOOK.md)

---

## Academic Notice & Limitations

MarketLens is strictly an educational research platform. It does not provide investment advice, live order routing, automated trade execution, or return guarantees. Real market data is blocked behind compliance checkpoints C0 and C1 pending qualified academic review.
