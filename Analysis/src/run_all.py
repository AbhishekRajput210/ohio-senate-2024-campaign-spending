"""Runs the whole data preparation in order:  python src/run_all.py"""
import subprocess
import sys
from pathlib import Path

folder = Path(__file__).parent
for script in ["01_prepare_campaign_spending.py", "02_prepare_independent_expenditures.py",
               "03_prepare_official_summaries.py", "04_validate_data.py"]:
    print(f"\n===== {script} =====")
    subprocess.run([sys.executable, str(folder / script)], check=True)
