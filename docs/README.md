# Bazaar Drishti project docs

**बाज़ार-दृष्टि (Bazaar Drishti)** is a coursework research dashboard for auditable Indian cash-equity paper-trading analysis. These documents define a historical research product, not a trading service.

## Source of truth

1. [PRD](product/PRD.md) — audience, product scope, stories, and acceptance criteria.
2. [TRD](architecture/TRD.md) — architecture, API, storage, security, stack, and quality targets.
3. [Implementation plan](plans/2026-10-21-bazaar-drishti-implementation-plan.md) — sequenced work and future verification steps.
4. [Checkpoints](project/CHECKPOINTS.md) — review gates and stop conditions.
5. [Data-rights and publication checklist](compliance/MARKET-DATA-AND-PUBLICATION.md) — required evidence before real data or security-specific outputs go public.
6. [Research brief](research/2026-10-21-research-brief.md) — current source review, Wall Street terminal study, stack snapshot, and reading path.
7. [Agent knowledge](agent/KNOWLEDGE.md) — concise operating context for future AI work.
8. [Work log](project/LOGBOOK.md) — implementation status and agent handoff.
9. [Logbook template](project/LOGBOOK-TEMPLATE.md) — one reproducible record per experiment/checkpoint.

## Decisions already made

- Public hosted dashboard, no accounts or sign-ups, read-only for visitors.
- Main deliverable: reproducible after-cost paper P&L; companion: a simple, baseline-compared historical forecast and an institutional-style visualization.
- Synthetic data is the public default until the exact source and output rights are documented.
- No live feed, order entry, real-money trading, personalized advice, or promise of profit.
- Product name: **Bazaar Drishti**. Older source notes use the working name **PulseQuant**.

## Status

Implementation has started with a deterministic synthetic fixture generator. The dashboard, strategy results, forecast, and real-data acquisition are not implemented. Open decisions and checkpoint evidence are recorded in the PRD, TRD, checkpoints, and [work log](project/LOGBOOK.md). Version and market-rule snapshots were checked on 2026-10-21 and must be rechecked before adding dependencies, acquiring data, and public release.
