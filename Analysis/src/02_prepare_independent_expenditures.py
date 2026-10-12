"""Step 2: clean outside-group independent expenditures -> data/processed/independent_expenditures.csv"""
import pandas as pd
from config import RAW, PROCESSED, CANDIDATES
from classify import classify
from clean_names import clean_payee

files = {"independent_expenditures_bernie_moreno.csv": "Moreno file",
         "independent_expenditures_brown_sherrod.csv": "Brown file"}
df = pd.concat([pd.read_csv(RAW / f, dtype=str, keep_default_na=False).assign(source=s) for f, s in files.items()], ignore_index=True)

df["amount"] = pd.to_numeric(df["expenditure_amount"])
# Timing date: dissemination date (when the ad ran); falls back to expenditure date
df["date"] = pd.to_datetime(df["dissemination_date"].replace("", pd.NA)).fillna(pd.to_datetime(df["expenditure_date"]))
df["month"] = df["date"].dt.to_period("M").astype(str)
df["quarter"] = df["date"].dt.to_period("Q").astype(str)
df["candidate"] = df["candidate_id"].map(CANDIDATES)

# Who does the spending help? Supporting Moreno or opposing Brown helps Moreno (and the other way round)
helps_moreno = ((df["candidate_id"] == "S4OH00192") & (df["support_oppose_indicator"] == "S")) | \
               ((df["candidate_id"] == "S6OH00163") & (df["support_oppose_indicator"] == "O"))
df["helps"] = helps_moreno.map({True: "Moreno", False: "Brown"})
df["tone"] = df["support_oppose_indicator"].map({"S": "support", "O": "oppose"})

# Rule 1: memo rows are not separate spending
df["exclude_reason"] = ""
df.loc[df["memo_code"] == "X", "exclude_reason"] = "memo entry"

# Rule 1b: some rows carry an Ohio candidate ID but are about other candidates (e.g. Sam Brown of Nevada) -> exclude.
# (The typo "BROAN, SHERROD" is still Sherrod Brown, so we check the first name / Moreno.)
name = df["candidate_name"].str.upper()
right_person = ((df["candidate_id"] == "S6OH00163") & name.str.contains("SHERROD")) | \
               ((df["candidate_id"] == "S4OH00192") & name.str.contains("MORENO"))
df.loc[~right_person & (df["exclude_reason"] == ""), "exclude_reason"] = "wrong candidate (mis-tagged row)"

# Rule 2: one payment can be reported under both candidates (support Moreno + oppose Brown).
# Keep it once per side it helps.
key = ["committee_id", "file_number", "amount", "payee_name", "expenditure_date"]   # identifies "the same payment"
kept = df[df["exclude_reason"] == ""]
under_both = kept.groupby(key)["candidate_id"].transform("nunique") > 1
repeat = kept[under_both].duplicated(key + ["helps"])
df.loc[repeat[repeat].index, "exclude_reason"] = "same payment reported under both candidates"
df["include"] = df["exclude_reason"] == ""

# Flag (do not delete) look-alike payments: same filer, payee, amount and date on the same side, still in the data
kept = df[df["include"]]
df["possible_repeat"] = False
df.loc[kept.index, "possible_repeat"] = kept.duplicated(["committee_id", "payee_name", "amount", "expenditure_date", "helps"], keep=False)

df["category"] = df["expenditure_description"].map(classify)
df["purpose"] = df["expenditure_description"].str.strip()

cols = ["committee_id", "committee_name", "candidate_id", "candidate", "support_oppose_indicator", "tone",
        "helps", "date", "month", "quarter", "amount", "payee_name", "payee_raw", "purpose", "category", "filing_form",
        "report_type", "file_number", "sub_id", "transaction_id", "source", "include", "exclude_reason", "possible_repeat"]
df["payee_raw"] = df["payee_name"]           # keep the original spelling
df["payee_name"] = df["payee_name"].map(clean_payee)
names = {"committee_name": "committee", "support_oppose_indicator": "support_oppose", "payee_name": "payee", "filing_form": "form",
         "report_type": "report_type", "file_number": "file_num", "transaction_id": "tran_id"}
df[cols].rename(columns=names).to_csv(PROCESSED / "independent_expenditures.csv", index=False)

print("rows:", len(df), "| included:", df["include"].sum(), "| $ included:", round(df[df["include"]]["amount"].sum(), 2))
print(df[df["include"]].groupby("helps")["amount"].agg(["count", "sum"]).round(2))
print(df["exclude_reason"].value_counts())
