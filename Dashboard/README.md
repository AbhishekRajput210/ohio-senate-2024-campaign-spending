# Ohio 2024 Senate Race: Campaign Spending Analysis (Dashboard)

Interactive dashboard for the Ohio 2024 U.S. Senate race, Sherrod Brown (D) vs Bernie Moreno (R), built from FEC filings for the 2023-24 cycle. It follows the analysis report: two core questions and one extension.

| Page | Question |
|---|---|
| Summary | Did outside groups offset Brown's campaign spending advantage? (key finding and headline numbers) |
| Spending Trends | How does campaign spending change over the 2023-24 cycle? |
| Campaign Comparison | How do the two campaigns compare in level, categories, communication, timing and vendors? |
| Outside Spending | Extension: how much did outside groups add for each side? |

Filters at the top: highlight candidate, spending category, campaign committee (outside group on Q3), include affiliated committees. Each chart has a *Download CSV* button for its table.

## Run it

```bash
npm install
npm run dev      # open http://localhost:3000
npm run build    # production build
```

## Data (`public/data`)

| File | Content |
|---|---|
| `campaign_spending.csv` | Campaign and affiliated committee payments (Schedule B operating expenditures) |
| `outside_spending.csv` | 1,422 outside-group payments (Schedule E independent expenditures) |
| `key_dates.csv` | Ohio primary, party conventions, Labor Day, Election Day |

All numbers are calculated in the browser from these files. They match the report: Brown $97.46M, Moreno $25.82M, outside spending $286.67M, net outside help for Moreno $68.37M (95.4% of Brown's campaign lead).

## Code

- `lib/data.ts` loads the CSV files; holds colours and period definitions (colours match the analysis notebooks)
- `lib/metrics.ts` all calculations
- `lib/format.ts` number, date and label formatting
- `components/` filter bar, shared card and chart helpers; `components/tabs/` one file per page

## Definitions

- **Campaign spending**: payments by a candidate's own committees. Affiliated committees are off by default.
- **Side**: campaign spending plus outside spending that helped that candidate.
- **Campaign lead**: Brown's campaign spending minus Moreno's.
- **Net outside help**: outside spending helping Moreno minus outside spending helping Brown.
- **Offset**: net outside help divided by the campaign lead.
- **Periods**: 2023; Jan 1 to Mar 19, 2024; Mar 20 to Aug 31; Sep 1 to Nov 5 (66 days); after Election Day.
