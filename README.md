# बाज़ार-दृष्टि (Bazaar Drishti)

**अर्थ:** बाज़ार को समझने की स्पष्ट दृष्टि — *Market Insight*.

Bazaar Drishti is a quantitative research and visualization project for Indian cash-equity paper trading. It is designed to make strategy results reproducible and auditable, with transaction costs, assumptions, uncertainty, gains, and losses shown transparently.

The earlier working name was **PulseQuant**. This is a research and paper-trading project; it does not place live trades or promise returns.

## Current implementation

The project has a deterministic synthetic fixture, versioned schemas, input validation, offline strategy and forecast prototypes, and a local bundle/publisher prototype. It has no real exchange data or concrete provider implementation, and no approved scored run is published. The web app remains a status shell that says no run has passed validation. Real data and public results stay disabled until the course method and data/publication rights are reviewed.

## Backend setup and checks

```sh
cd backend
export UV_PROJECT_ENVIRONMENT=.venv-vm
export PYTHONPATH=src
uv sync --locked --group dev
uv run --locked --group dev python src/bazaar_drishti/synthetic.py
uv run --locked --group dev python -m unittest discover tests -v
uv run --locked --group dev mypy src tests
uv run --locked --group dev ruff check .
uv run --locked --group dev ruff format --check .
```

`UV_PROJECT_ENVIRONMENT=.venv-vm` keeps this VM's environment separate from the ignored host `.venv` in the shared folder. The fixture command writes `data/fixtures/synthetic/bars.csv` and `manifest.json`.

To run the web shell:

```sh
cd web
corepack pnpm@10 install --frozen-lockfile
corepack pnpm@10 dev
```

The web check commands are `corepack pnpm@10 test`, `corepack pnpm@10 run typecheck`, and `corepack pnpm@10 run build`. See the [implementation plan](docs/plans/2026-10-21-bazaar-drishti-implementation-plan.md), [checkpoint status](docs/project/CHECKPOINTS.md), and [work log](docs/project/LOGBOOK.md) for handoff context.

## Project documents

Start with the [project docs index](docs/README.md) for the current PRD, TRD, research brief, implementation plan, checkpoints, data-rights gates, AI-agent knowledge, and logbook template.
