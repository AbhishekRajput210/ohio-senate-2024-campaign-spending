"""Makes vendor (payee) names consistent so one vendor is not split into several spellings."""
import re

# Spelling variants that the general rules cannot catch
FIXES = {"PRECISION88": "PRECISION 88"}


def clean_payee(name):
    name = str(name).upper().replace("&", " AND ")
    name = re.sub(r"[^A-Z0-9/ ]", " ", name)                       # drop commas, dots, quotes
    name = re.sub(r"\s+", " ", name).strip()
    name = re.sub(r"^THE ", "", name)                              # leading "THE"
    name = re.sub(r"( (INC|LLC|LLP|LTD|CORP|CORPORATION|CO|COMPANY|PAC))+$", "", name)   # company ending
    return FIXES.get(name, name)
