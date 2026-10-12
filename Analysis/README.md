# Ohio 2024 Senate Race: Campaign Spending Analysis (Python)

FEC campaign-finance data (2023-24 cycle) for Sherrod Brown (D) and Bernie Moreno (R). This folder holds the data preparation, validation and the three analysis notebooks. The dashboard is in `../Dashboard`.

## Questions
1. How does campaign spending change over the 2023-24 cycle?
2. How do the two campaigns compare?
3. (Extension) Did outside groups offset Brown's campaign spending advantage?

## Folders
| Folder | Contents |
|---|---|
| `data/raw` | Original FEC files (download date: [DD Month 2026]) |
| `data/processed` | Clean files created by `src` |
| `src` | Data preparation and validation scripts |
| `notebooks` | One notebook per question |
| `outputs` | Tables (CSV) and charts (HTML) |
| `docs` | Short notes on the data and each question |

## How to run
```bash
python -m venv .venv
.venv\Scripts\activate          # macOS / Linux: source .venv/bin/activate
pip install -r requirements.txt
python src/run_all.py           # prepares and checks the data
```
Then run the notebooks in `notebooks/` from top to bottom.

## Method
- **Data:** FEC operating expenditures (campaign spending) and independent expenditures (outside spending), plus the FEC summary files used only to check totals.
- **Cleaning:** memo rows removed, amended filings replaced by the newest, vendor names standardised, spending categories built from keyword rules, duplicates and negative amounts flagged.
- **Validation:** ten data-quality checks plus recalculation checks in each notebook. Totals match the FEC's published totals within 0.03%.
- **Limits:** dates are payment dates, party-coordinated spending is not included, and the analysis shows spending.
