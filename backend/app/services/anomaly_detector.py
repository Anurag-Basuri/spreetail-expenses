import re
from datetime import date
from decimal import Decimal, InvalidOperation
from enum import Enum
from dataclass import dataclass
from typing import Literal, List, Dict, Tuple, Any, Optional

from app.utils.name_normalizer import match_to_member, normalize_name
from app.utils.date_parser import parse_date

class AnomalyType(str, Enum):
    DUPLICATE = "DUPLICATE"
    NEAR_DUPLICATE = "NEAR_DUPLICATE"
    MISSING_PAYER = "MISSING_PAYER"
    MISSING_CURRENCY = "MISSING_CURRENCY"
    MISSING_SPLIT_TYPE = "MISSING_SPLIT_TYPE"
    ZERO_AMOUNT = "ZERO_AMOUNT"
    NEGATIVE_AMOUNT = "NEGATIVE_AMOUNT"
    INVALID_PERCENTAGES = "INVALID_PERCENTAGES"
    SETTLEMENT_AS_EXPENSE = "SETTLEMENT_AS_EXPENSE"
    UNKNOWN_PARTICIPANT = "UNKNOWN_PARTICIPANT"
    INACTIVE_MEMBER = "INACTIVE_MEMBER"
    AMBIGUOUS_DATE = "AMBIGUOUS_DATE"
    UNPARSEABLE_DATE = "UNPARSEABLE_DATE"
    NAME_INCONSISTENCY = "NAME_INCONSISTENCY"
    MALFORMED_AMOUNT = "MALFORMED_AMOUNT"
    SPLIT_TYPE_CONFLICT = "SPLIT_TYPE_CONFLICT"
    WHITESPACE_IN_AMOUNT = "WHITESPACE_IN_AMOUNT"
    EXCESS_DECIMALS = "EXCESS_DECIMALS"

@dataclass
class Anomaly:
    row_number: int
    anomaly_type: AnomalyType
    severity: Literal["ERROR", "WARNING", "INFO"]
    description: str
    raw_value: str
    suggested_action: str
    auto_resolved: bool = False
    resolved_value: str | None = None

def detect_anomalies(
    row: Dict[str, str], 
    row_number: int, 
    all_rows: List[Dict[str, str]], 
    known_members: List[str], 
    memberships: Dict[str, Tuple[date, Optional[date]]]
) -> List[Anomaly]:
    anomalies = []
    
    amount_str = row.get('amount', '')
    parsed_amount = None
    
    # 1. MALFORMED_AMOUNT
    if ',' in amount_str:
        anomalies.append(Anomaly(
            row_number, AnomalyType.MALFORMED_AMOUNT, "WARNING",
            "Amount contains commas.", amount_str, "AUTO_FIXED: Stripped commas", True, amount_str.replace(',', '')
        ))
        amount_str = amount_str.replace(',', '')
    
    try:
        if amount_str.strip():
            parsed_amount = Decimal(amount_str.strip())
    except InvalidOperation:
        anomalies.append(Anomaly(
            row_number, AnomalyType.MALFORMED_AMOUNT, "ERROR",
            "Amount cannot be parsed as a number.", amount_str, "FLAGGED: User must provide valid number"
        ))
        
    # 2. WHITESPACE_IN_AMOUNT
    if amount_str != amount_str.strip():
        anomalies.append(Anomaly(
            row_number, AnomalyType.WHITESPACE_IN_AMOUNT, "INFO",
            "Leading/trailing whitespace in amount.", amount_str, "AUTO_FIXED: Stripped whitespace", True, amount_str.strip()
        ))
        
    # 3. EXCESS_DECIMALS
    if parsed_amount is not None:
        dec_tuple = parsed_amount.as_tuple()
        if dec_tuple.exponent < -2:
            anomalies.append(Anomaly(
                row_number, AnomalyType.EXCESS_DECIMALS, "WARNING",
                "Amount has more than 2 decimal places.", amount_str, "AUTO_FIXED: Rounded to 2 decimal places", True, str(parsed_amount.quantize(Decimal("0.01")))
            ))
            parsed_amount = parsed_amount.quantize(Decimal("0.01"))
            
    # 4. MISSING_PAYER
    paid_by_str = row.get('paid_by', '')
    if not paid_by_str.strip():
        anomalies.append(Anomaly(
            row_number, AnomalyType.MISSING_PAYER, "ERROR",
            "Payer name is missing.", paid_by_str, "FLAGGED: User must select payer"
        ))
        
    # 5. NAME_INCONSISTENCY
    if paid_by_str.strip():
        matched, conf = match_to_member(paid_by_str, known_members)
        if conf == "fuzzy":
            anomalies.append(Anomaly(
                row_number, AnomalyType.NAME_INCONSISTENCY, "WARNING",
                f"Payer name '{paid_by_str}' is non-standard.", paid_by_str, f"AUTO_FIXED: Normalized to '{matched}'", True, matched
            ))
        elif conf == "none":
            anomalies.append(Anomaly(
                row_number, AnomalyType.UNKNOWN_PARTICIPANT, "ERROR",
                f"Payer '{paid_by_str}' is not a known member.", paid_by_str, "FLAGGED: Assign to known member or add member"
            ))

    # 6. MISSING_CURRENCY
    curr = row.get('currency', '').strip()
    if not curr:
        anomalies.append(Anomaly(
            row_number, AnomalyType.MISSING_CURRENCY, "WARNING",
            "Currency is missing.", "", "AUTO_FIXED: Defaulted to INR", True, "INR"
        ))
        
    # 7. UNPARSEABLE_DATE / AMBIGUOUS_DATE
    date_str = row.get('date', '')
    parsed_d, warnings = parse_date(date_str)
    if warnings:
        for w in warnings:
            if "AMBIGUOUS_DATE" in w:
                anomalies.append(Anomaly(
                    row_number, AnomalyType.AMBIGUOUS_DATE, "WARNING",
                    w, date_str, "AUTO_FIXED: Interpreted as DD/MM", True, str(parsed_d)
                ))
            elif "UNPARSEABLE_DATE" in w:
                anomalies.append(Anomaly(
                    row_number, AnomalyType.UNPARSEABLE_DATE, "ERROR",
                    w, date_str, "FLAGGED: User must provide valid date"
                ))
            elif "INCOMPLETE_DATE" in w:
                anomalies.append(Anomaly(
                    row_number, AnomalyType.AMBIGUOUS_DATE, "WARNING",
                    w, date_str, f"AUTO_FIXED: Assigned {parsed_d.year if parsed_d else 'year'}", True, str(parsed_d)
                ))

    # 8. MISSING_SPLIT_TYPE
    split_type = row.get('split_type', '').strip().lower()
    if not split_type:
        anomalies.append(Anomaly(
            row_number, AnomalyType.MISSING_SPLIT_TYPE, "WARNING",
            "Split type is missing.", "", "AUTO_FIXED: Defaulted to 'equal'", True, "equal"
        ))
        split_type = "equal"

    # 9. SETTLEMENT_AS_EXPENSE
    desc = row.get('description', '').lower()
    if not split_type or 'settlement' in desc or 'paid back' in desc or 'deposit' in desc:
        anomalies.append(Anomaly(
            row_number, AnomalyType.SETTLEMENT_AS_EXPENSE, "WARNING",
            "Row looks like a settlement but is logged as an expense.", desc, "AUTO_FIXED: Convert to Settlement record", True, "settlement"
        ))

    # 10. ZERO_AMOUNT
    if parsed_amount is not None and parsed_amount == Decimal("0"):
        anomalies.append(Anomaly(
            row_number, AnomalyType.ZERO_AMOUNT, "ERROR",
            "Amount is zero.", amount_str, "FLAGGED: Provide non-zero amount or skip"
        ))
        
    # 11. NEGATIVE_AMOUNT
    if parsed_amount is not None and parsed_amount < Decimal("0"):
        anomalies.append(Anomaly(
            row_number, AnomalyType.NEGATIVE_AMOUNT, "ERROR",
            "Amount is negative.", amount_str, "FLAGGED: Review if settlement or expense"
        ))
        
    # 12. DUPLICATE
    for i, prev in enumerate(all_rows):
        if i >= row_number - 1: # row_number is 1-indexed, loop is 0-indexed
            break
        
        prev_amt = None
        try:
            prev_amt = Decimal(prev.get('amount', '').replace(',','').strip())
        except:
            pass
            
        p_date, _ = parse_date(prev.get('date', ''))
        
        if (p_date == parsed_d and 
            prev.get('description', '').strip().lower() == row.get('description', '').strip().lower() and
            prev_amt == parsed_amount and
            normalize_name(prev.get('paid_by', '')) == normalize_name(paid_by_str)):
            
            anomalies.append(Anomaly(
                row_number, AnomalyType.DUPLICATE, "ERROR",
                f"Exact duplicate of row {i + 1}.", "", "FLAGGED: Skip this row"
            ))
            break # only flag once
            
    # 13. NEAR_DUPLICATE
    if parsed_d:
        for i, prev in enumerate(all_rows):
            if i >= row_number - 1:
                break
            p_date, _ = parse_date(prev.get('date', ''))
            if p_date == parsed_d:
                prev_desc = set(prev.get('description', '').lower().split())
                curr_desc = set(desc.split())
                intersection = prev_desc.intersection(curr_desc)
                if intersection and len(intersection) >= max(1, len(curr_desc) // 2):
                    prev_sw = set([normalize_name(n) for n in prev.get('split_with', '').split(';')])
                    curr_sw = set([normalize_name(n) for n in row.get('split_with', '').split(';')])
                    if prev_sw == curr_sw:
                        anomalies.append(Anomaly(
                            row_number, AnomalyType.NEAR_DUPLICATE, "WARNING",
                            f"Potential duplicate of row {i + 1} based on venue and participants.", desc, "FLAGGED: Human review required"
                        ))

    # 14. INVALID_PERCENTAGES
    split_details_str = row.get('split_details', '')
    if split_type == 'percentage' and split_details_str:
        try:
            total_pct = sum([Decimal(p.split(':')[1].strip()) for p in split_details_str.split(',') if ':' in p])
            if abs(total_pct - Decimal("100")) > Decimal("0.01"):
                anomalies.append(Anomaly(
                    row_number, AnomalyType.INVALID_PERCENTAGES, "ERROR",
                    f"Percentages sum to {total_pct}, not 100.", split_details_str, "FLAGGED: Adjust percentages"
                ))
        except Exception:
            pass

    # 15. SPLIT_TYPE_CONFLICT
    if split_type == 'equal' and split_details_str:
        anomalies.append(Anomaly(
            row_number, AnomalyType.SPLIT_TYPE_CONFLICT, "WARNING",
            "Split type is 'equal' but 'split_details' are provided.", split_details_str, "AUTO_FIXED: Changed split_type to 'unequal'", True, "unequal"
        ))
        
    # 16. UNKNOWN_PARTICIPANT and 17. INACTIVE_MEMBER
    split_with = [n.strip() for n in row.get('split_with', '').split(';') if n.strip()]
    for p in split_with:
        m_name, m_conf = match_to_member(p, known_members)
        if m_conf == "none":
            anomalies.append(Anomaly(
                row_number, AnomalyType.UNKNOWN_PARTICIPANT, "ERROR",
                f"Participant '{p}' is unknown.", p, "FLAGGED: Assign to known member"
            ))
        else:
            if m_conf == "fuzzy":
                anomalies.append(Anomaly(
                    row_number, AnomalyType.NAME_INCONSISTENCY, "WARNING",
                    f"Participant '{p}' is non-standard.", p, f"AUTO_FIXED: Normalized to '{m_name}'", True, m_name
                ))
            
            # temporal bounds
            if parsed_d and m_name in memberships:
                joined_at, left_at = memberships[m_name]
                if parsed_d < joined_at or (left_at and parsed_d > left_at):
                    anomalies.append(Anomaly(
                        row_number, AnomalyType.INACTIVE_MEMBER, "ERROR",
                        f"Participant '{m_name}' was not an active member on {parsed_d}.", p, "FLAGGED: Remove from split"
                    ))

    return anomalies
