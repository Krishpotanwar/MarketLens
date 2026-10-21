# Bazaar Drishti experiment logbook

Create one entry per checkpoint and one per scored research run. Never overwrite an earlier result; append a correction with a reason and link to the replaced entry.

## Entry template

```markdown
## Entry [number] — [YYYY-MM-DD HH:MM IST]

- Checkpoint / run ID:
- Author / reviewer:
- Objective or pre-registered hypothesis:
- Decision made before results:
- Data source / provider / rights label:
- Instrument, interval, date range, session calendar:
- Raw and normalized data fingerprints:
- Code revision and lockfile hash:
- Study config hash / strategy and model version:
- Fee schedule source, effective date, brokerage, rounding:
- Fill and slippage assumptions:
- Train / validation / final-test dates:
- Exclusions, missing bars, corporate actions, sample counts:
- Commands run and pass/fail evidence:
- Gross P&L / itemized fees / slippage / net P&L:
- Cash and intraday buy-and-hold baselines:
- Forecast metrics / base rate / class counts / uncertainty:
- Screenshots, public URL or artifact references:
- Interpretation (include negative/null results):
- Deviations from protocol and why:
- Risks / unresolved items:
- Reviewer or professor sign-off:
- Next action:
```

## Run discipline

- Register each tested parameter/model/data variant before examining the final test result.
- Keep the final test untouched until the protocol and model family are locked.
- If a bug changes a past run, emit a new run ID and preserve the old receipt as superseded.
- Record missing evidence as “not checked”; never replace it with an estimate.
- Store provider contracts, raw licensed data, and credentials outside the public repository.
