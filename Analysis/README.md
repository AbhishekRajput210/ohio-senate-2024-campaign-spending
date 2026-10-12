# Ohio 2024 U.S. Senate Race: Campaign Spending Analysis

FEC campaign-finance data (2023-24 cycle) for Sherrod Brown (D, S6OH00163) and Bernie Moreno (R, S4OH00192).

## Main findings
- Brown's campaign spent $97.46M and Moreno's spent $25.82M (3.8 times as much).
- Brown's lead grew from $10.2M at the March primary to $70.3M on Election Day. Both campaigns spent about 39% of their money in the last 66 days.
- Both campaigns put about 80% of their money into voter communication. Media and digital ads explain 76% of the $71.64M gap.
- Outside groups spent $286.67M. Spending that helps Moreno was $177.52M and spending that helps Brown was $109.15M, a net $68.37M for Moreno, about 95% of Brown's campaign lead.
- Brown's side (campaign plus outside) ended $3.3M ahead. Moreno's side was ahead for 36 days (24 Sep to 30 Oct 2024).

## Folders
| Folder | Contents |
|---|---|
| `data/raw` | Original FEC files |
| `data/processed` | Clean files created by `src` |
| `src` | Python scripts for data preparation and validation |
| `notebooks` | One notebook per question |
| `outputs` | Tables (CSV) and interactive charts (HTML) for each question |
| `docs` | Short notes on the data preparation and each question |

## How to run
1. `pip install -r requirements.txt`
2. `python src/run_all.py` (prepares and checks the data)
3. Run the notebooks in `notebooks/` from top to bottom. Each one saves its tables and charts in `outputs/`.

| Notebook | Question |
|---|---|
| `question_1_spending_trends.ipynb` | How does campaign spending change over the cycle? |
| `question_2_campaign_comparison.ipynb` | How do the two campaigns compare? |
| `question_3_outside_groups.ipynb` | Did outside groups offset Brown's spending advantage? |
