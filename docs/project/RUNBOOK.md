# Bazaar Drishti prototype runbook

This covers local scaffold checks only. No real-data research run is approved. The web app (Vercel) and API (Render) are deployed publicly and serve a synthetic fixture run, labelled as such.

## Local checks

Backend commands from `backend/`:

```sh
export UV_PROJECT_ENVIRONMENT=.venv-vm
export PYTHONPATH=src
uv sync --locked --group dev
uv run --locked --group dev python -m unittest discover tests -v
uv run --locked --group dev mypy src tests
uv run --locked --group dev ruff check .
uv run --locked --group dev ruff format --check .
```

The VM environment is separate from the ignored host `.venv`. The synthetic fixture command is:

```sh
uv run --locked --group dev python src/bazaar_drishti/synthetic.py
```

Web commands from `web/`:

```sh
corepack pnpm@10 install --frozen-lockfile
corepack pnpm@10 test
corepack pnpm@10 run typecheck
corepack pnpm@10 run build
```

## Current implementation limits

- The fixture is deterministic and synthetic. No market-data provider or real-data build is connected.
- `FeeSchedule` contains illustrative, undated, unverified rates. Do not interpret prototype simulation output as a research result.
- `RightsGate` checks separate acquisition and publication approvals. The bundle validator still rejects every non-synthetic run until evidence is represented in the manifest and reviewed.
- `Publisher` and `create_app()` use SQLite. The PostgreSQL migration is not applied or integration-tested, and the visitor API has no SELECT-only database identity.
- The React app shows no active run by default. It has no API connection and publishes no result.
- No staging host, secret store, active run, or rollback rehearsal exists.

## Local SQLite publisher prototype

Tests create the schema and publish only validated synthetic bundles in one SQLite transaction. A failed insert rolls back the new run and leaves the prior active pointer unchanged. Artifact tables reject update/delete; the active pointer may switch only to an existing run.

This is not a deployment procedure. Do not publish real data or promote a public run until C0/C1 method and rights approvals, PostgreSQL integration, API role restrictions, and C7 release checks are complete.
