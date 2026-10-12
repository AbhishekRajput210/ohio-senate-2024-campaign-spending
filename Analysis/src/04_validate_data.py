"""Step 4: check the prepared data and compare it with the FEC's published totals.
Writes data/processed/validation_checks.csv and data/processed/reconciliation.csv"""
import pandas as pd
from config import PROCESSED, CANDIDATES, COMMITTEES

spend = pd.read_csv(PROCESSED / "campaign_spending.csv")
ie = pd.read_csv(PROCESSED / "independent_expenditures.csv")
official_c = pd.read_csv(PROCESSED / "official_committee_summary.csv")
official_a = pd.read_csv(PROCESSED / "official_candidate_summary.csv")
used = spend[spend["include"]]

# ---- Part 1: data quality checks (each row: check name, result, PASS/FAIL)
checks = []
def check(name, ok, detail):
    checks.append({"check": name, "result": "PASS" if ok else "FAIL", "detail": detail})

check("Every committee has spending rows", spend["committee_id"].nunique() == len(COMMITTEES), f"{spend['committee_id'].nunique()} of {len(COMMITTEES)}")
check("No missing dates (spending)", spend["date"].isna().sum() == 0, f"{spend['date'].isna().sum()} missing")
check("No missing dates (outside spending)", ie["date"].isna().sum() == 0, f"{ie['date'].isna().sum()} missing")
check("Spending dates inside 2023-2024", used["date"].between("2023-01-01", "2024-12-31").all(), f"{used['date'].min()} to {used['date'].max()}")
check("Outside spending dates inside 2023-2024", ie[ie["include"]]["date"].between("2023-01-01", "2024-12-31").all(), "")
check("No duplicate sub_id in included spending", not used["sub_id"].duplicated().any(), f"{used['sub_id'].duplicated().sum()} duplicates")
check("No duplicate sub_id in included outside spending", not ie[ie["include"]]["sub_id"].duplicated().any(), "")
other = used[used["category"] == "Other / unclear"]["amount"].sum() / used["amount"].sum() * 100
check("Unclassified purposes under 2% of dollars", other < 2, f"{other:.2f}% of dollars")
dollars_in = spend["amount"].sum()
dollars_out = used["amount"].sum() + spend[~spend["include"]]["amount"].sum()
check("Dollars conserved (included + excluded = all)", abs(dollars_in - dollars_out) < 0.01, f"{dollars_in:,.2f}")
check("Outside spending: only S / O indicators", ie["support_oppose"].isin(["S", "O"]).all(), "")
checks = pd.DataFrame(checks)
checks.to_csv(PROCESSED / "validation_checks.csv", index=False)
print(checks.to_string(index=False))

# ---- Part 2: reconciliation with FEC published totals
by_cmte = used.groupby("committee_id")["amount"].sum()
rows = []
for _, r in official_c.iterrows():
    mine = by_cmte.get(r["committee_id"], 0)
    rows.append({"level": "committee", "id": r["committee_id"], "name": r["committee"], "my_total": mine,
                 "fec_total": r["official_operating_expenditure"]})
mine_by_cand = used[used["group"] == "campaign"].groupby("candidate_id")["amount"].sum()
for _, r in official_a.iterrows():
    rows.append({"level": "candidate (authorized committees)", "id": r["candidate_id"], "name": r["candidate"],
                 "my_total": mine_by_cand[r["candidate_id"]], "fec_total": r["operating_expenditure"]})
rec = pd.DataFrame(rows)
rec["gap"] = (rec["my_total"] - rec["fec_total"]).round(2)
rec["gap_pct"] = (rec["gap"] / rec["fec_total"] * 100).round(3)
rec.to_csv(PROCESSED / "reconciliation.csv", index=False)
print(rec.round(2).to_string(index=False))

# ---- Part 3: data-quality log (every exclusion rule, rows and dollars) and a committee list
log = pd.concat([
    spend[~spend["include"]].assign(dataset="campaign spending"),
    ie[~ie["include"]].assign(dataset="outside spending"),
]).groupby(["dataset", "exclude_reason"])["amount"].agg(rows="count", dollars="sum").reset_index()
flags = pd.DataFrame([
    {"dataset": "campaign spending", "exclude_reason": "FLAG ONLY: negative amount (kept)", "rows": used["negative"].sum(), "dollars": used[used["negative"]]["amount"].sum()},
    {"dataset": "campaign spending", "exclude_reason": "FLAG ONLY: possible repeat (kept)", "rows": used["possible_repeat"].sum(), "dollars": used[used["possible_repeat"]]["amount"].sum()},
    {"dataset": "outside spending", "exclude_reason": "FLAG ONLY: possible repeat (kept)", "rows": ie["possible_repeat"].sum(), "dollars": ie[ie["possible_repeat"]]["amount"].sum()},
])
log = pd.concat([log, flags])
log.to_csv(PROCESSED / "data_quality_log.csv", index=False)
print(log.round(2).to_string(index=False))

dim = pd.DataFrame([{"committee_id": c, "candidate_id": v[0], "candidate": CANDIDATES[v[0]], "group": v[1], "committee": v[2]}
                    for c, v in COMMITTEES.items()])
dim.to_csv(PROCESSED / "dim_committees.csv", index=False)
