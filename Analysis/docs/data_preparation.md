# Data Preparation

## Sources (FEC, 2023-24 cycle)
| File in `data/raw` | Used for |
|---|---|
| `operating_expenditures.csv` | What committees spent (Schedule B) |
| `independent_expenditures_*.csv` | What outside groups spent for or against each candidate (Schedule E) |
| `committee_summary.csv`, `all_candidate_summary.csv` | FEC published totals, used to check our totals |
| `candidate_master`, `committee_master`, `candidate_committee_linkage` (+ header files) | Identify the candidates and their committees |

## Committees
- **Campaign (4):** Friends of Sherrod Brown, Bernie Moreno for Senate, Bernie Moreno for Ohio, Moreno for OH Senate Republican Nominee Fund 2024.
- **Affiliated (5):** joint fundraising and victory committees, kept separate so transfers are not counted twice.

## Cleaning rules
**Campaign spending (`01_prepare_campaign_spending.py`)**
- Memo rows are excluded because they only break down a payment already counted.
- If a report was amended, only the newest filing is kept.
- Vendor names are standardised, for example "The Morning Group, LLC" and "THE MORNING GROUP" become one vendor.
- Each payment gets a purpose category from keyword rules (`src/classify.py`). The FEC category field is blank in the source.
- Negative amounts and 45 look-alike payments are kept and flagged, not deleted.

**Outside spending (`02_prepare_independent_expenditures.py`)**
- Memo rows and 8 rows about other candidates are excluded.
- A payment reported under both candidates is counted once, for the side it helps.
- The date used is the date the ad ran, or the payment date when that is missing.
- Result: 1,422 rows and $286.67M.

## Validation (`04_validate_data.py`)
Quality checks and a comparison with FEC published totals. Moreno's main committee matches exactly. Brown's main committee is $6,699 (0.01%) below the FEC total, probably small items below the reporting threshold.

## Limits
- Dates are payment dates, not the dates ads aired.
- Party-coordinated spending (Schedule F) was not downloaded.
- Categories come from keywords in free text, so "Reimbursements & card payments" hides what was bought.
- Figures are a snapshot of FEC data at download time. Download date: ____.
