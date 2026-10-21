# Market-data and publication gates

This checklist is a product safety control, not legal advice. NSE states that the subscriber agreement defines permitted handling, dissemination, and redistribution. A public dashboard therefore requires evidence tied to the exact source and outputs.

## Data source approval — before the first real-data API call

- [ ] Record provider, API product, instrument/segment, interval, date range, and account owner.
- [ ] Save the applicable agreement, tariff, API terms, and contact confirmation in a private evidence location; never commit credentials or restricted raw data.
- [ ] Confirm the agreement permits this project’s academic research computation and derived calculations.
- [ ] Confirm storage, retention, caching, and raw-file sharing rules.
- [ ] Confirm whether students may use the data through the institution/professor and whether confidentiality terms apply.
- [ ] Confirm the vendor’s documented API endpoint, authentication, rate limits, pagination, and retention conditions. These technical limits do not replace license rights.
- [ ] Confirm corporate-action treatment, timezone, missing-bar policy, and revision/correction process.

If any answer is unknown, use the checked-in synthetic fixture only.

## Public result approval — before setting a real run as active

- [ ] Confirm the agreement explicitly allows public display of the exact derived metrics/plots/forecasts and redistribution to the intended audience.
- [ ] Confirm whether public outputs may name the security, show individual trade records, include performance percentages, show probabilities, or be downloaded as JSON/CSV.
- [ ] Verify that excluded raw bars, source keys, private URLs, and vendor-only identifiers do not appear in the API, browser bundle, source maps, logs, exports, or charts.
- [ ] Attach the source/license reference and permitted-output label to the immutable run manifest.
- [ ] Obtain qualified review of the exact public copy and security-specific forecast under current SEBI Research Analysts rules. Record the reviewer, date, version reviewed, and disposition; do not infer an exemption.
- [ ] Add any required attribution, risk disclosure, limitations, and methodology copy.
- [ ] Verify each page and export clearly distinguishes synthetic from licensed real data.
- [ ] Keep rollback to the previous immutable run available.

## Release gate

- [ ] `synthetic=true` runs may be published without real-market data rights; label the symbol as synthetic and never describe it as NSE history.
- [ ] `synthetic=false` cannot be promoted unless every applicable item above is checked and evidence is linked in the private release record.
- [ ] Public exposure remains GET-only. Publishing rights and API write credentials are kept separate from the visitor-facing service.
- [ ] Recheck the source agreement, exchange schedules, relevant SEBI circulars, and copy before every real-data release.

## Current-source references

- [NSE Data Sharing & Usage Policy](https://www.nseindia.com/static/market-data/nse-data-policy)
- [NSE Data List under the research/analysis sharing policy](https://nsearchives.nseindia.com/web/sites/default/files/inline-files/Data%20list%20under%20NSE%20Data%20Sharing%20Policy%20for%20Research%20and%20Analysis_20250728.pdf)
- [NSE non-display usage policy](https://nsearchives.nseindia.com/web/sites/default/files/inline-files/Non_Display_Policy.pdf)
- [SEBI Research Analysts Regulations, last amended Nov. 25, 2025](https://www.sebi.gov.in/legal/regulations/nov-2025/securities-and-exchange-board-of-india-research-analysts-regulations-2014-last-amended-on-november-25-2025-_98248.html)
- [SEBI Research Analysts FAQ, Feb. 2026](https://www.sebi.gov.in/sebi_data/attachdocs/feb-2026/1770375507051.pdf)
- [SEBI retail algo-trading circular](https://www.sebi.gov.in/legal/circulars/feb-2025/safer-participation-of-retail-investors-in-algorithmic-trading_91614.html)
