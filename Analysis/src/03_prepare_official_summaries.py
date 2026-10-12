"""Step 3: pull the FEC's own published totals for our committees / candidates (used for validation)."""
import pandas as pd
from config import RAW, PROCESSED, CANDIDATES, COMMITTEES

# Committee level: committee_summary.csv (duplicates differ only by CAND_ID, so drop repeats)
c = pd.read_csv(RAW / "committee_summary.csv")
c = c[c["CMTE_ID"].isin(COMMITTEES)].drop_duplicates("CMTE_ID")
# Form 3 filers report OP_EXP, Form 3X filers report TTL_OP_EXP; a committee that used both has both
c["official_operating_expenditure"] = c["OP_EXP"].fillna(0) + c["TTL_OP_EXP"].fillna(0)
c = c[["CMTE_ID", "CMTE_NM", "official_operating_expenditure", "TTL_DISB", "TTL_RECEIPTS", "CVG_END_DT"]]
c = c.rename(columns={"CMTE_ID": "committee_id", "CMTE_NM": "committee", "TTL_DISB": "total_disbursements", "TTL_RECEIPTS": "total_receipts", "CVG_END_DT": "coverage_end"})
c.to_csv(PROCESSED / "official_committee_summary.csv", index=False)

# Candidate level: all_candidate_summary.csv (covers the candidate's authorized committees)
a = pd.read_csv(RAW / "all_candidate_summary.csv")
a = a[a["Cand_Id"].isin(CANDIDATES)]
a = a[["Cand_Id", "Cand_Name", "Operating_Expenditure", "Total_Disbursement", "Total_Receipt", "Coverage_End_Date"]]
a = a.rename(columns={"Cand_Id": "candidate_id", "Cand_Name": "candidate", "Operating_Expenditure": "operating_expenditure", "Total_Disbursement": "total_disbursements", "Total_Receipt": "total_receipts", "Coverage_End_Date": "coverage_end"})
a.to_csv(PROCESSED / "official_candidate_summary.csv", index=False)

print(c.to_string(index=False))
print(a.to_string(index=False))
