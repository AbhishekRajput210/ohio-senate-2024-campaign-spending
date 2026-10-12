# Ohio 2024 Senate Race: Campaign Spending Analysis

An analysis of FEC campaign-finance data (2023–24 cycle) for the 2024 Ohio U.S. Senate race between Sherrod Brown (D) and Bernie Moreno (R). The project asks how the two campaigns spent their money and whether outside groups offset Brown's campaign spending advantage. It has two parts: a Python analysis (data preparation, validation and three notebooks) and an interactive dashboard.

## Key findings

- **Most money arrives late.** About 39% of each campaign's money is spent in the last 66 days before Election Day, and 87% of outside-group money is paid in September and October.
- **Brown's campaign advantage is advertising.** Brown's campaign spent $97.46M and Moreno's $25.82M (3.8 times). Media buying and digital advertising explain 76% of the $71.64M gap.
- **Most of the money comes from outside groups.** Outside groups spent $286.67M, about 70% of all money in the race. The net $68.37M for Moreno cancels about 95% of Brown's campaign lead.
- **The two sides ended level.** Campaign plus outside money was $206.61M for Brown's side and $203.34M for Moreno's. Moreno's side was ahead for 36 days (24 Sep to 30 Oct 2024).
- **A few payees and groups hold most of the money.** One media firm receives 48% of Brown's and 62% of Moreno's campaign money.

## Folder structure

```
.
├── Analysis/                 Python analysis
│   ├── data/
│   │   ├── raw/              original FEC files
│   │   └── processed/        clean files created by src/
│   ├── src/                  data preparation and validation scripts
│   ├── notebooks/            one notebook per question
│   ├── outputs/              tables (CSV) and charts (HTML) for each question
│   ├── docs/                 short notes on the data and each question
│   ├── README.md
│   └── requirements.txt
├── Dashboard/                interactive dashboard (Next.js)
│   ├── app/                  page and layout
│   ├── components/           filters, cards, charts and one file per tab
│   ├── lib/                  data loading, calculations and formatting
│   ├── public/data/          CSV files the dashboard reads
│   ├── README.md
│   └── package.json
└── README.md                 this file
```

## How to run the analysis

You need Python 3.

```bash
cd Analysis

# 1. Create and activate a virtual environment (recommended)
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # macOS / Linux

# 2. Install the packages
pip install -r requirements.txt

# 3. Prepare and check the data
python src/run_all.py
```

Then open the notebooks in `Analysis/notebooks/` (in VS Code or Jupyter) and run each one from top to bottom. Each notebook saves its tables and charts in `Analysis/outputs/`.

| Notebook | Question |
|---|---|
| `question_1_spending_trends.ipynb` | How does campaign spending change over the 2023–24 cycle? |
| `question_2_campaign_comparison.ipynb` | How do the two campaigns compare? |
| `question_3_outside_groups.ipynb` | Did outside groups offset Brown's campaign spending advantage? |

## How to run the dashboard

You need Node.js (version 20 or newer).

```bash
cd Dashboard
npm install
npm run dev
```

Open http://localhost:3000 in your browser. To make a production build, run `npm run build`.

The dashboard has four pages: **Summary**, **Spending Trends**, **Campaign Comparison** and **Outside Spending**. All numbers are calculated in the browser from the CSV files in `Dashboard/public/data/`, and they match the analysis.

## Data source

U.S. Federal Election Commission (FEC) filings for the 2023–24 election cycle. Campaign spending is Schedule B operating expenditures; outside spending is Schedule E independent expenditures. The data shows how spending lined up, not what it did to votes.