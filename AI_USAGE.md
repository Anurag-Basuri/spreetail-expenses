# AI Usage Log (AI_USAGE.md)

This document tracks the usage of AI tools during the development of EquiSplit, highlighting key prompts and documenting instances where the AI generated flawed code that required human intervention.

## Key Prompts Used
- "Build the balance calculation algorithm (graph-based simplification) so it generates the minimum number of transactions."
- "Write the anomaly detection service based on the 22 expected issues described in the assignment."
- "Create an interactive CSV import pipeline that requires human approval for any deleted or modified rows."

## Flawed Output & Human Corrections

### 1. Hardcoded Split Parsing vs. CSV Format
**The Error:** The AI implemented `INVALID_PERCENTAGES` detection by splitting the `split_details` string using a colon and a comma (e.g., `Aisha: 30, Rohan: 30`). 
**How it was caught:** The human engineer read the actual `expenses_export.csv` file and noticed the format is `Aisha 30%; Rohan 30%; Priya 30%; Meera 20%`. 
**The Fix:** Instructed the AI to read the CSV file. The AI updated the logic to use the regex `re.findall(r'(\d+(?:\.\d+)?)%', split_details_str)` to reliably extract the percentages regardless of the delimiter.

### 2. Missing Foreign Currency Flag
**The Error:** The AI implemented a rule to default an empty currency field to `INR` and quietly convert `USD` behind the scenes using a `.env` setting without explicitly flagging the foreign currency to the user.
**How it was caught:** The human engineer pointed out that "The original sheet treats $1 = ₹1. That's wrong (Priya's complaint)." We must explicitly flag the foreign currency anomaly so the user is forced to approve or provide an exchange rate rather than trusting a silent conversion.
**The Fix:** The AI added a `FOREIGN_CURRENCY` enum to `AnomalyType` and modified `anomaly_detector.py` to throw an `ERROR` when `curr != "INR"`. The interactive resolution service was updated to correctly handle it.

### 3. Missing `base_currency` in SQLAlchemy Group Model vs. Pytest
**The Error:** The AI created a test suite (`test_import.py`) that attempted to construct a `Group` using `Group(name="Trip", base_currency="INR")`. However, the `base_currency` column had been previously removed from the final `Group` schema in favor of storing currency exclusively on the `Expense` and `Settlement` tables.
**How it was caught:** The human engineer told the AI to run the tests. Pytest failed with `TypeError: 'base_currency' is an invalid keyword argument for Group`.
**The Fix:** The AI reviewed `group.py` and modified the test to correctly instantiate the group using `created_by` instead of `base_currency`.
