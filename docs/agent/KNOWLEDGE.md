# AI agent knowledge — Bazaar Drishti

Read this file, [PRD](../product/PRD.md), [TRD](../architecture/TRD.md), and [current research brief](../research/2026-10-21-research-brief.md) before making project changes. The project is also called PulseQuant in historical notes; the current product name is Bazaar Drishti.

## Product truth

- This is a personal learning and DAV coursework project for the owner and professor, not a startup or trading product.
- Approved target is a public hosted dashboard without logins, accounts, personal state, or visitor writes.
- Core demonstration: after-cost paper P&L, a separate simple baseline-compared historical forecast, and a polished research visualization/receipt.
- Results may be positive, flat, or negative. Never fabricate, tune toward, or promise profit.
- No live trading, broker orders, live stream, personal advice, recommendations, financial product, account creation, portfolio tracking, news sentiment, or L2 feed in MVP.

## Data and research rules

- Public default is a fixed-seed synthetic fixture with `synthetic=true` visible on all pages and exports.
- No real five-minute data source/license has been approved. Before API access, verify API terms and data rights for acquisition, research computation, retention, derived outputs, public display, downloads, and attribution.
- Do not scrape undocumented endpoints. Keep provider credentials/raw data out of Git and browser bundles.
- Strategy is one long-only 20/50 SMA rule, one symbol, five-minute bars, signal at completed close, next eligible bar open fill, flat before end of day.
- The model is a separate six-bar logistic-regression replay; preprocessing is training-only; use chronological full-session splits and purge overlapping labels. A training-only prevalence baseline is mandatory.
- Every result is tied to data/config/code/fee fingerprints and an immutable run ID. Every currency total reconciles from a trade ledger; store money as fixed precision or integer paise.
- Brier/log loss/accuracy are not profitability. Brier score is not calibration alone. Reliability charts need counts. No causal claim from Granger tests or order-book heatmaps in the MVP.
- OHLCV cannot establish queue position, market impact, or limit-order fills. Slippage constants are scenario assumptions unless calibrated with licensed quote/trade data.

## Wall Street terminal research

The historical notes mention a “Wall Street Terminal Replica Plan.” Borrow workflow ideas: a clear monitor, chart, risk context, ledger, and reproducible receipt. Do not copy vendor branding/data. Bookmap liquidity heatmaps require resting order-book depth over time; candles are not a substitute. Defer the heatmap, news tape, options wall, FII/DII signals, and order entry.

## Source-of-truth order

1. Current official agreements/regulations and current provider docs, checked for the exact release.
2. PRD and TRD in this repository.
3. This implementation plan and checkpoints.
4. Dated research brief and source links.
5. `nemo.md`, `Upgrading-GitHub-DAV-Projects.md`, and `knowledge-graph/raw/` are historical inputs. They contain proposals and may contain stale or unsupported numbers. Never treat them as current without re-verification.

## Change rules for agents

- Before code work, inspect the standalone Git root and its GitNexus graph; keep analysis scoped to Bazaar Drishti. Do not analyze the former parent project.
- Run GitNexus impact before changing existing code symbols; `UNKNOWN` is unresolved. Run `detect_changes --scope all` before a commit and resolve partial/truncated output.
- Do not publish real data or security-specific outputs without the rights and qualified-review gates.
- Keep changes small and update relevant docs/logbook when methodology, API contract, rights status, or versions change.
- Never call a historical replay a live prediction. Never show a fake positive placeholder.

## VM tooling

- In this Linux VM, `uv` and GitNexus 1.6.12 are installed under `$HOME/.local/bin`; the Codex MCP entry and hooks are configured in the VM user config.
- The shared checkout contains a host-generated `.gitnexus/` index. Leave it untouched; the VM index is stored at `$HOME/.local/share/gitnexus/bazaar-drishti`.
- Refresh the VM index with `GITNEXUS_STORAGE_PATH="$HOME/.local/share/gitnexus/bazaar-drishti" gitnexus analyze --index-only` from this repository root.
- Use `UV_PROJECT_ENVIRONMENT=.venv-vm` for backend `uv` commands in this shared checkout because the ignored `.venv/` points to the host Python path. Fresh clones can use uv's default `.venv/`.

## Handoff — 2026-10-21

- This checkout is branch `codex/bazaar-drishti-synthetic-slice` at baseline commit `ce5574f`; it has no configured Git remote. Changes in the current pass are uncommitted.
- Implemented: deterministic synthetic fixture and hash manifest; versioned schemas with JSON serialization; rights-gate and bar-normalization prototypes; offline cost, strategy, baseline, forecast, and metric modules; SQLite bundle publisher; SQLite-backed GET API prototype; static React pages.
- The fixture uses invented 2030 weekday session templates and includes one intentionally missing five-minute interval. These are not exchange-calendar sessions or historical security data.
- Its deterministic price path is a zero-drift random walk reset to 1000 synthetic units per session; the manifest limits it to schema/pipeline validation, not strategy or forecast evidence.
- Current GitNexus repository is this standalone folder (`bazaar-drishti`); re-index only this root after code changes. The VM index is external to the shared checkout.
- C0 is open; C1 blocks real data/publication; C2 local checks pass (74 backend tests and a clean frozen web install with test/typecheck/build) but await an observed CI run. C3–C6 remain in progress; C7 is not started. No research result is approved or published. There is no provider, PostgreSQL publisher/integration result, API database role, or API-connected dashboard. A PostgreSQL migration exists but is unverified in this VM.
- The Codex GitNexus hooks and MCP configuration are installed for this VM. The user still needs to approve the hooks in Codex's `/hooks` UI and restart the session before hook/MCP activation can be confirmed.
- Read `docs/project/LOGBOOK.md` before continuing. Review the research and bundle prototypes, close correctness gaps, and keep the professor method and rights gates visible.

## Known open decisions

Professor rubric; real-vs-historical forecast requirement; instrument and dates; virtual capital/sizing; provider and exact output rights; broker fee convention; host/region/cost; qualified publication review. Use synthetic-only mode while they remain open.
