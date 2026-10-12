"""Shared settings: folder paths and the candidates / committees we analyse."""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "data" / "raw"
PROCESSED = ROOT / "data" / "processed"

# The two candidates in the story: Ohio 2024 U.S. Senate race
CANDIDATES = {
    "S6OH00163": "Sherrod Brown",
    "S4OH00192": "Bernie Moreno",
}

# committee_id: (candidate_id, group, name)
# "campaign"   = candidate's own authorized committees (what the candidate's official totals cover)
# "affiliated" = joint fundraising / victory committees (kept separate so transfers are not double counted)
COMMITTEES = {
    "C00264697": ("S6OH00163", "campaign", "Friends of Sherrod Brown"),
    "C00578609": ("S6OH00163", "affiliated", "Ohio Grassroots Victory Fund"),
    "C00555342": ("S6OH00163", "affiliated", "Canary Fund"),
    "C00883108": ("S6OH00163", "affiliated", "Senate Victory for Sherrod Brown 2024"),
    "C00846196": ("S6OH00163", "affiliated", "Victory Now for Sherrod Brown"),
    "C00837484": ("S4OH00192", "campaign", "Bernie Moreno for Senate"),
    "C00829499": ("S4OH00192", "campaign", "Moreno for OH Senate Republican Nominee Fund 2024"),
    "C00775585": ("S4OH00192", "campaign", "Bernie Moreno for Ohio"),
    "C00867010": ("S4OH00192", "affiliated", "Team Moreno"),
}
