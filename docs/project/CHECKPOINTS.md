# Project checkpoints

Checkpoints are evidence gates, not calendar promises. Update status and evidence in the logbook after each review. A blocked real-data gate does not block synthetic-only development.

| Gate | Exit criteria | Review/sign-off | Stop condition |
|---|---|---|---|
| **C0 — Product/method freeze** | PRD/TRD accepted; course rubric recorded; instrument, date window, starting capital, sizing, bar semantics, target definition and evaluation split resolved or explicitly marked assumption. | Owner + professor | Do not score a real strategy while methodology or capital/sizing is unspecified. |
| **C1 — Data rights and publication** | Provider/API and agreements recorded; rights for API acquisition, research computation, storage, derived outputs, public display/export and attribution checked separately; qualified review of proposed real security-specific output recorded. | Owner + data provider/institution + qualified reviewer | If any right/review is missing, stay synthetic-only. Never scrape undocumented sources. |
| **C2 — Reproducible scaffold** | Lockfiles install from clean state; synthetic fixture has fixed seed/hash; run schemas and synthetic label validated; CI baseline green. | Engineering review | No real source data or provider credential enters the repo/browser. |
| **C3 — Research core** | Data validation, dated fee schedule, strategy ledger, same-period baselines, forecast split/purge, metrics, and bundle pass deterministic tests on fixture. | Research-method review | Any unexplained ledger mismatch, leakage, session boundary issue, or unsupported positive claim blocks scoring. |
| **C4 — Publication boundary** | Bundle validator rejects bad/unlicensed runs; transactional publisher and rollback work; API DB role is SELECT-only; only public-safe fields can be queried. | Security/database review | Any public write path, exposed secret, raw-bar leak, or mutable historical run blocks release. |
| **C5 — Professor-ready UI** | Overview, Forecast Lab, Receipt/Method pages use same run ID and totals; synthetic labels persist across pages/exports; empty/error/insufficient states tested. | Owner + professor preview | Any placeholder result, ambiguous synthetic/real status, or mismatch with ledger blocks demo. |
| **C6 — Quality/accessibility** | Unit/integration/E2E, accessibility, keyboard, reduced motion, security/dependency review, performance targets, logs and restore checks recorded. | Engineering review | Unbounded endpoint, missing text alternative, failing financial invariant, unresolved critical security issue blocks release. |
| **C7 — Public release** | Hosting/cost/region approved; TLS/secrets checked; data rights/review complete for selected run; exact active run/version recorded; rollback rehearsed. | Owner + qualified reviewer for real output | If real-output gate fails, publish synthetic only. |
| **C8 — Course/demo closeout** | Final logbook, screenshots/URL, methodology, limitations, reproducibility bundle and professor feedback saved; follow-up issues prioritized. | Owner + professor | Do not interpret a short paper result as evidence of live profitability. |

## Suggested stage sizing

These are rough solo-project estimates, excluding provider/legal waiting time: C0–C1 1–3 working days; C2 1–2 days; C3 4–7 days; C4 2–4 days; C5 3–5 days; C6–C7 2–4 days. Adjust after one scaffold spike; do not trade test coverage or rights review for a date.

## Checkpoint record

### Current status — 2026-10-21

- **C0 — IN PROGRESS:** professor rubric and course-method inputs are not formally recorded. No research result is approved for interpretation.
- **C1 — BLOCKED for real data:** provider terms and qualified publication review are unavailable. `RightsGate` now checks separate acquisition/publication approvals; the bundle validator blocks every non-synthetic run until evidence is represented and reviewed.
- **C2 — IN PROGRESS:** fixture, schemas, locked toolchains, web shell, and CI workflow exist. Local checks pass (72 backend tests, mypy, Ruff lint/format, pnpm frozen install, and web test/typecheck/build). A GitHub Actions run is unconfirmed; this checkout has no Git remote.
- **C3 — IN PROGRESS:** normalizer, backtest, baselines, forecast, and bundle prototypes have corrective tests. Fee rates are fixed illustrative assumptions with no effective dates/source, provider timeout is unavailable, and C0 bars scoring.
- **C4 — IN PROGRESS:** SQLite-only publisher now verifies row aggregates, failure rollback, and immutable artifact rows. PostgreSQL tools/service, API database role, and release integration are unavailable; no PostgreSQL integration result is claimed.
- **C5 — IN PROGRESS:** Overview, Forecast Lab, and Receipt pages exist, but the app has no API connection or active run. The default UI now shows no run and no result; detailed chart/data states remain open.
- **C6 — IN PROGRESS:** 72 backend tests, mypy, Ruff, Vitest, typecheck, and Vite build pass locally. Accessibility, dependency/security review, browser journey, performance, and restore checks are not complete.
- **C7 — NOT STARTED:** no staging host, deployment, active run, or release rehearsal exists.
- **C8 — IN PROGRESS:** logbook entries 001–009 are preserved; this checkpoint update and reviewer correction will be recorded in the next entry. Professor/demo review is pending.

```text
Gate:
Status: NOT STARTED | IN PROGRESS | BLOCKED | PASSED
Date / reviewer:
Evidence links or run IDs:
Risks discovered:
Decision:
Next gate and owner:
```
