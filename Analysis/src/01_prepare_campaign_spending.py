"""Step 1: clean the operating expenditures (what committees spent) -> data/processed/campaign_spending.csv"""
import pandas as pd
from config import RAW, PROCESSED, CANDIDATES, COMMITTEES
from classify import classify
from clean_names import clean_payee

df = pd.read_csv(RAW / "operating_expenditures.csv", dtype=str, keep_default_na=False)
df = df[df["CMTE_ID"].isin(COMMITTEES)].copy()          # only our 9 committees

# Clean types
df["amount"] = pd.to_numeric(df["TRANSACTION_AMT"])
df["date"] = pd.to_datetime(df["TRANSACTION_DT"], format="%m/%d/%Y", errors="coerce")
df["purpose"] = df["PURPOSE"].str.strip()

# Add candidate / committee info
df["candidate_id"] = df["CMTE_ID"].map(lambda c: COMMITTEES[c][0])
df["candidate"] = df["candidate_id"].map(CANDIDATES)
df["group"] = df["CMTE_ID"].map(lambda c: COMMITTEES[c][1])
df["committee"] = df["CMTE_ID"].map(lambda c: COMMITTEES[c][2])

# Rule 1: memo rows only break down a payment already counted -> exclude
# Rule 2: if a report was amended, only the newest filing (highest FILE_NUM) counts
df["file_num"] = pd.to_numeric(df["FILE_NUM"])
newest = df.groupby(["CMTE_ID", "RPT_YR", "RPT_TP"])["file_num"].transform("max")
df["exclude_reason"] = ""
df.loc[df["file_num"] < newest, "exclude_reason"] = "replaced by a newer amended filing"
df.loc[df["MEMO_CD"] == "X", "exclude_reason"] = "memo entry (already counted in parent payment)"
df["include"] = df["exclude_reason"] == ""

# Flags (rows are kept, only marked): negative amounts, and look-alike payments that we cannot prove are repeats
df["negative"] = df["amount"] < 0
kept = df[df["include"]]
df["possible_repeat"] = False
df.loc[kept.index, "possible_repeat"] = kept.duplicated(["CMTE_ID", "date", "amount", "NAME"], keep=False)

# Time columns and purpose category
df["month"] = df["date"].dt.to_period("M").astype(str)
df["quarter"] = df["date"].dt.to_period("Q").astype(str)
df["category"] = df["purpose"].map(classify)

cols = ["CMTE_ID", "committee", "group", "candidate_id", "candidate", "date", "month", "quarter",
        "amount", "NAME", "payee_raw", "purpose", "category", "RPT_YR", "RPT_TP", "FORM_TP_CD", "LINE_NUM",
        "file_num", "SUB_ID", "TRAN_ID", "BACK_REF_TRAN_ID", "MEMO_TEXT", "include", "exclude_reason", "negative", "possible_repeat"]
df["payee_raw"] = df["NAME"]                 # keep the original spelling
df["NAME"] = df["NAME"].map(clean_payee)
names = {"CMTE_ID": "committee_id", "NAME": "payee", "RPT_YR": "report_year", "RPT_TP": "report_type", "FORM_TP_CD": "form",
         "LINE_NUM": "line_number", "SUB_ID": "sub_id", "TRAN_ID": "tran_id", "BACK_REF_TRAN_ID": "back_ref_tran_id", "MEMO_TEXT": "memo_text"}
df[cols].rename(columns=names).to_csv(PROCESSED / "campaign_spending.csv", index=False)

print("rows:", len(df), "| included:", df["include"].sum())
print(df[df["include"]].groupby(["candidate", "committee"])["amount"].agg(["count", "sum"]).round(2))
print("missing dates:", df["date"].isna().sum())
print("Other / unclear share of $:", round(df[df["include"] & (df["category"] == "Other / unclear")]["amount"].sum() / df[df["include"]]["amount"].sum() * 100, 2), "%")
