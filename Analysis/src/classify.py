"""Puts a free-text spending purpose into one of a few simple categories.
Rules are checked from top to bottom; the first match wins, so order matters."""
import re

RULES = [
    ("Reimbursements & card payments", r"REIMBUR|CREDIT CARD PAYMENT|SEE MEMO|SEE BELOW|IN-KIND CONTRIBUTION|REISSUED"),
    ("Canvassing & field", r"CANVAS|GOTV|\bFIELD"),
    ("Payroll & benefits", r"PAYROLL|SALAR|WAGE|HEALTH INSURANCE|STIPEND|WORKERS"),
    ("Processing & bank fees", r"MERCHANT|TRANSACTION FEE|TRANSCATION FEE|PROCESSING FEE|CARD FEE|BANK FEE"),
    ("Texting & phone", r"TEXT|SMS|MESSAGING|PHONE|CALLS"),
    ("Fundraising costs", r"FUNDRAIS|ACQUISITION|AQUISITION|LIST RENTAL|CAGING"),
    ("Legal & compliance", r"LEGAL|COMPLIANCE|ACCOUNTING"),
    ("Direct mail & printing", r"\bMAIL|POSTAGE|PRINT|POSTCARD|DOOR HANGER"),
    ("Digital advertising", r"DIGITAL|ONLINE|\bWEB\b|INTERNET|FACEBOOK"),
    ("TV, radio & other media", r"\bTV\b|MEDIA|RADIO|CABLE|BILLBOARD|OUTDOOR|PLACEMENT|ADVERTIS|\bADS?\b|AD BUY|VIDEO|GRAPHIC|SATELLITE"),
    ("Consulting & strategy", r"CONSULT|STRATEG|POLLING|RESEARCH|DATA MODEL|CAMPAIGN MANAGEMENT|COMMUNICATIONS"),
    ("Travel, events & meals", r"TRAVEL|MILEAGE|AIRFARE|\bBUS\b|EVENT|VENUE|FACILITY|CATERING|MEALS|VALET|TICKETS|PHOTOGRAPH"),
    ("Merchandise & signs", r"MERCHANDISE|GEAR|SIGNS|SHIRTS"),
    ("Taxes", r"\bTAX"),
    ("Operations & overhead", r"\bRENT|SOFTWARE|DATABASE|\bIT SUPPORT|TELECOM|OFFICE|SECURITY|INSURANCE|UTILIT|SUBSCRIPTION|SHIPPING|STORAGE|PO BOX|BRM|TRANSLATION|INTERPRET|PARKING|DUES|STATE REGISTRATION|TRANSPORTATION|SPONSORSHIP|DATA"),
]


def classify(text):
    text = str(text).upper()
    for category, pattern in RULES:
        if re.search(pattern, text):
            return category
    return "Other / unclear"
