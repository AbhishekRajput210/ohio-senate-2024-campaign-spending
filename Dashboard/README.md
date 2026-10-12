# Ohio 2024 Senate Race: Campaign Spending Analysis (Dashboard)

Interactive dashboard built from FEC filings (2023–24 cycle) for Sherrod Brown (D) and Bernie Moreno (R).

Live version: https://ohio-senate-2024-spending.vercel.app/

## Pages
- **Summary:** key finding and headline numbers
- **Spending Trends:** how campaign spending changes over the cycle
- **Campaign Comparison:** how the two campaigns compare
- **Outside Spending:** how outside groups changed the picture

Filters at the top, a *Download CSV* button on each chart, and a layout that works on phones and laptops.

## Run it
You need Node.js 20 or newer.
```bash
npm install
npm run dev      # open http://localhost:3000
```

## Data
The dashboard reads the CSV files in `public/data` (`campaign_spending.csv`, `outside_spending.csv`, `key_dates.csv`). All numbers are calculated in the browser and match the report.

## Code
`lib/` holds data loading, calculations and formatting. `components/` holds the shared pieces and one file per page. Built with Next.js, React, Recharts and TypeScript.
