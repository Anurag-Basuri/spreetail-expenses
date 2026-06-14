IMPORT REPORT — expenses_export.csv
Run ID: [uuid]
Timestamp: 2026-XX-XX

SUMMARY
  Total rows parsed:         43
  Successfully imported:     26
  Flagged for review:         9
  Auto-converted:             4
  Skipped:                    4

ANOMALIES DETECTED

ROW 5-6  | TYPE: DUPLICATE
  Raw:    date=2026-02-08, desc="dinner - marina bites", amount=3200, paid_by=Dev
  Issue:  Exact duplicate of row 5 (case-insensitive description match, same date/amount/payer)
  Action: SKIPPED row 6. Row 5 imported.

ROW 7   | TYPE: MALFORMED_AMOUNT
  Raw:    amount="1,200"
  Issue:  Comma-formatted number
  Action: AUTO-FIXED → parsed as 1200.00 INR

ROW 9   | TYPE: NAME_INCONSISTENCY
  Raw:    paid_by="priya"
  Issue:  Lowercase, matched to existing member "Priya" (fuzzy match)
  Action: AUTO-FIXED → normalized to "Priya"

ROW 10  | TYPE: EXCESSIVE_DECIMALS
  Raw:    amount=899.995
  Issue:  3 decimal places
  Action: AUTO-FIXED → rounded to 899.99 (bank rounding / round-half-even)

ROW 11  | TYPE: NAME_INCONSISTENCY
  Raw:    paid_by="Priya S"
  Issue:  Does not exactly match any member. Best match: "Priya" (confidence 80%)
  Action: FLAGGED — awaiting human confirmation before importing

ROW 13  | TYPE: MISSING_PAYER
  Raw:    paid_by="", description="House cleaning supplies"
  Issue:  No payer recorded
  Action: SKIPPED — cannot calculate balances without a payer

ROW 14  | TYPE: SETTLEMENT_AS_EXPENSE
  Raw:    description="Rohan paid Aisha back", amount=5000, no split_type
  Issue:  No split_type; note indicates settlement
  Action: CONVERTED to settlement record (Rohan paid Aisha ₹5000 on 2026-02-25)

ROW 15  | TYPE: INVALID_PERCENTAGES
  Raw:    "Aisha 30%; Rohan 30%; Priya 30%; Meera 20%" → sum = 110%
  Issue:  Percentages do not sum to 100%
  Action: FLAGGED — row not imported. User must correct and re-import this expense manually.

ROW 19-21 | TYPE: CURRENCY_CONVERSION
  Raw:    amounts in USD (540, 84, 150, -30)
  Issue:  Original sheet treats $1=₹1
  Action: AUTO-CONVERTED at ₹84.00/$ (rate as of March 2026, source: RBI reference)
          Please verify rate is acceptable before finalizing.

ROW 23  | TYPE: UNKNOWN_PARTICIPANT
  Raw:    split_with includes "Dev's friend Kabir"
  Issue:  Kabir is not a registered member of the group
  Action: FLAGGED — provisional entry created. Admin must assign to existing user or add new member.

ROW 24-25 | TYPE: NEAR_DUPLICATE_CONFLICT
  Raw:    Row 24: Aisha paid ₹2400 for Thalassa dinner
          Row 25: Rohan paid ₹2450 for Thalassa dinner (note: "Aisha also logged this I think hers is wrong")
  Issue:  Same event, two entries, different amounts, different payers — cannot auto-resolve
  Action: FLAGGED — BOTH rows held pending. User must approve one and reject the other.

ROW 26  | TYPE: NEGATIVE_AMOUNT
  Raw:    amount=-30 USD
  Issue:  Negative amount
  Action: AUTO-CONVERTED → treated as refund. ₹2520 refunded equally to Aisha, Rohan, Priya, Dev.

ROW 27  | TYPE: AMBIGUOUS_DATE + NAME_WHITESPACE
  Raw:    date="Mar 14", paid_by="rohan "
  Issue:  (a) Date has no year — assumed 2026 based on surrounding context
          (b) Trailing space in paid_by — normalized to "Rohan"
  Action: AUTO-FIXED with WARNING. Assumed date = 2026-03-14.

ROW 28  | TYPE: MISSING_CURRENCY
  Raw:    currency=""
  Issue:  No currency specified
  Action: AUTO-FIXED → assumed INR (domestic expense, all nearby rows INR)

ROW 31  | TYPE: ZERO_AMOUNT
  Raw:    amount=0, description="Dinner order Swiggy"
  Issue:  Amount is zero; note says "counted twice earlier - fixing later"
  Action: SKIPPED. Zero-amount expense has no effect on balances.

ROW 34  | TYPE: AMBIGUOUS_DATE_FORMAT
  Raw:    date="04/05/2026"
  Issue:  Could be April 5 (DD/MM) or May 4 (MM/DD)
  Action: FLAGGED — assumed DD/MM/YYYY (Indian convention) → 2026-04-05
          Note: Also confirms split_type=equal. Sam joined ~April 10, so this expense
          predates Sam; correct that Sam is not in the split.

ROW 36  | TYPE: INACTIVE_MEMBER_IN_SPLIT
  Raw:    date=2026-04-02, split_with includes "Meera"
  Issue:  Meera left end of March (left_at=2026-03-31). This expense is April 2.
  Action: FLAGGED — imported without Meera. Split recalculated among Aisha, Rohan, Priya only.

ROW 38  | TYPE: SETTLEMENT_AS_EXPENSE
  Raw:    description="Sam deposit share", amount=15000, split_with=Aisha only
  Issue:  This is a deposit payment, not a shared expense
  Action: FLAGGED — held pending. Options: (a) convert to settlement (Sam paid Aisha ₹15000),
          (b) treat as one-to-one expense. Awaiting admin decision.

ROW 42  | TYPE: SPLIT_TYPE_CONFLICT
  Raw:    split_type="equal", split_details="Aisha 1; Rohan 1; Priya 1; Sam 1"
  Issue:  Split type says equal, but explicit shares are provided
  Action: AUTO-FIXED → share values are all equal (1:1:1:1), result is same as equal split.
          Logged as "share" type to preserve the explicit data.
