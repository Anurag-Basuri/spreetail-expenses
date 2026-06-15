import csv
import uuid
from io import StringIO
from datetime import datetime, date
from decimal import Decimal

from sqlalchemy.orm import Session
from app.models.import_anomaly import ImportAnomaly, ImportRun
from app.models.group import GroupMembership
from app.models.user import User
from app.models.settlement import Settlement
from app.services.anomaly_detector import detect_anomalies, AnomalyType
from app.services.expense_service import create_expense
from app.utils.date_parser import parse_date
from app.utils.name_normalizer import match_to_member
from app.config import settings

class MockExpenseData:
    pass

def import_single_row(db: Session, group_id: int, cleaned_row: dict, current_user_id: int, is_settlement_auto: bool, known_members: list[str], memberships_qs) -> bool:
    final_amount_str = cleaned_row.get('amount', '0').replace(',', '')
    try:
        amt = Decimal(final_amount_str)
    except Exception:
        amt = Decimal("0")
        
    final_curr = cleaned_row.get('currency', 'INR') or 'INR'
    ex_rate = settings.USD_TO_INR_RATE if final_curr.upper() == 'USD' else Decimal("1.0")
    amt_inr = amt * ex_rate
    
    payer_name = cleaned_row.get('paid_by', '')
    matched_payer, _ = match_to_member(payer_name, known_members)
    payer_id = next((u.id for m, u in memberships_qs if u.name == matched_payer), current_user_id)
    
    d, _ = parse_date(cleaned_row.get('date', ''))
    if not d:
        d = date.today()
        
    desc = cleaned_row.get('description', 'Imported expense')
    stype = cleaned_row.get('split_type', 'equal')
    if not stype: stype = 'equal'
    
    if is_settlement_auto:
        paid_to_name = cleaned_row.get('split_with', '').split(';')[0]
        matched_to, _ = match_to_member(paid_to_name, known_members)
        to_id = next((u.id for m, u in memberships_qs if u.name == matched_to), current_user_id)
        
        db_settle = Settlement(
            group_id=group_id,
            paid_by=payer_id,
            paid_to=to_id,
            amount=amt,
            currency=final_curr,
            settled_at=d,
            note=desc
        )
        db.add(db_settle)
        return True
    else:
        split_with = [n.strip() for n in cleaned_row.get('split_with', '').split(';') if n.strip()]
        participants = []
        for sp in split_with:
            m_name, _ = match_to_member(sp, known_members)
            pid = next((u.id for m, u in memberships_qs if u.name == m_name), None)
            if pid:
                participants.append(pid)
                
        if not participants:
            participants = [u.id for m, u in memberships_qs]
            
        sd_str = cleaned_row.get('split_details', '')
        split_details = {}
        if sd_str:
            for part in sd_str.split(','):
                if ':' in part:
                    k, v = part.split(':')
                    k_name, _ = match_to_member(k.strip(), known_members)
                    k_id = next((u.id for m, u in memberships_qs if u.name == k_name), None)
                    if k_id:
                        split_details[k_id] = Decimal(v.strip())
                        
        ed = MockExpenseData()
        ed.description = desc
        ed.amount = amt
        ed.currency = final_curr
        ed.amount_inr = amt_inr
        ed.exchange_rate = ex_rate
        ed.paid_by = payer_id
        ed.split_type = stype
        ed.expense_date = d
        ed.is_settlement = False
        ed.import_row = 0
        ed.import_note = "Imported"
        ed.participants = participants
        ed.split_details = split_details
        
        try:
            db.begin_nested()
            create_expense(db, group_id, ed, current_user_id)
            db.commit()
            return True
        except Exception:
            db.rollback()
            return False


def run_import(db: Session, file_bytes: bytes, group_id: int, run_id: str, current_user_id: int) -> dict:
    content = file_bytes.decode('utf-8-sig')
    reader = csv.DictReader(StringIO(content))
    raw_rows = list(reader)
    
    memberships_qs = db.query(GroupMembership, User).join(User).filter(GroupMembership.group_id == group_id).all()
    known_members = [u.name for m, u in memberships_qs]
    memberships_dict = {u.name: (m.joined_at, m.left_at) for m, u in memberships_qs}
    
    import_run = ImportRun(
        id=uuid.UUID(run_id),
        group_id=group_id,
        total_rows=len(raw_rows),
        exchange_rate_used=settings.USD_TO_INR_RATE
    )
    db.add(import_run)
    db.flush()
    
    imported_count = 0
    flagged_count = 0
    auto_fixed_count = 0
    skipped_count = 0
    all_anomalies_out = []
    
    for row_idx, row in enumerate(raw_rows):
        cleaned_row = {k.strip(): str(v).strip() if v else '' for k, v in row.items() if k}
        
        anomalies = detect_anomalies(cleaned_row, row_idx + 1, raw_rows, known_members, memberships_dict)
        
        status = "CLEAN"
        is_skipped = False
        
        for a in anomalies:
            db_anomaly = ImportAnomaly(
                import_run_id=import_run.id,
                csv_row=a.row_number,
                anomaly_type=a.anomaly_type.value,
                description=a.description,
                raw_data=cleaned_row,
                action_taken=a.suggested_action,
                resolved=a.auto_resolved
            )
            db.add(db_anomaly)
            db.flush()
            
            all_anomalies_out.append({
                "id": db_anomaly.id, 
                "row_number": a.row_number,
                "anomaly_type": a.anomaly_type.value,
                "severity": a.severity,
                "description": a.description,
                "suggested_action": a.suggested_action,
                "auto_resolved": a.auto_resolved
            })
            
            if a.severity == "ERROR":
                status = "FLAGGED"
            elif a.severity == "WARNING" and status == "CLEAN":
                status = "AUTO_FIXED"
                
            if a.anomaly_type == AnomalyType.DUPLICATE:
                is_skipped = True
                status = "SKIPPED"
        
        if is_skipped:
            skipped_count += 1
            continue
            
        if status == "FLAGGED":
            flagged_count += 1
            continue
            
        is_settlement_auto = any(a.anomaly_type == AnomalyType.SETTLEMENT_AS_EXPENSE for a in anomalies)
        success = import_single_row(db, group_id, cleaned_row, current_user_id, is_settlement_auto, known_members, memberships_qs)
        
        if success:
            if status == "AUTO_FIXED":
                auto_fixed_count += 1
                imported_count += 1
            else:
                imported_count += 1
        else:
            flagged_count += 1

    import_run.imported = imported_count
    import_run.flagged = flagged_count
    import_run.auto_fixed = auto_fixed_count
    import_run.skipped = skipped_count
    
    db.commit()
    
    return {
        "run_id": run_id,
        "total_rows": len(raw_rows),
        "imported": imported_count,
        "flagged": flagged_count,
        "skipped": skipped_count,
        "auto_fixed": auto_fixed_count,
        "anomalies": all_anomalies_out,
        "exchange_rate_used": settings.USD_TO_INR_RATE,
        "timestamp": import_run.timestamp
    }


def get_import_report(db: Session, run_id: str) -> dict | None:
    import_run = db.query(ImportRun).filter(ImportRun.id == uuid.UUID(run_id)).first()
    if not import_run:
        return None
        
    anomalies = db.query(ImportAnomaly).filter(ImportAnomaly.import_run_id == import_run.id).all()
    
    anomalies_out = []
    for a in anomalies:
        # Reconstruct severity based on anomaly type
        sev = "INFO"
        if a.anomaly_type in ["DUPLICATE", "MISSING_PAYER", "UNKNOWN_PARTICIPANT", "UNPARSEABLE_DATE", "ZERO_AMOUNT", "NEGATIVE_AMOUNT", "INVALID_PERCENTAGES", "INACTIVE_MEMBER"]:
            sev = "ERROR"
        elif a.anomaly_type in ["NEAR_DUPLICATE", "MISSING_CURRENCY", "MISSING_SPLIT_TYPE", "SETTLEMENT_AS_EXPENSE", "AMBIGUOUS_DATE", "NAME_INCONSISTENCY", "SPLIT_TYPE_CONFLICT", "EXCESS_DECIMALS"]:
            sev = "WARNING"
        elif a.anomaly_type == "MALFORMED_AMOUNT":
            sev = "WARNING" if "commas" in a.description.lower() else "ERROR"
            
        anomalies_out.append({
            "id": a.id,
            "row_number": a.csv_row,
            "anomaly_type": a.anomaly_type,
            "severity": sev,
            "description": a.description,
            "suggested_action": a.action_taken,
            "auto_resolved": a.resolved
        })
        
    return {
        "run_id": str(import_run.id),
        "total_rows": import_run.total_rows,
        "imported": import_run.imported,
        "flagged": import_run.flagged,
        "skipped": import_run.skipped,
        "auto_fixed": import_run.auto_fixed,
        "anomalies": anomalies_out,
        "exchange_rate_used": import_run.exchange_rate_used,
        "timestamp": import_run.timestamp
    }


def resolve_import_anomaly(db: Session, run_id: str, anomaly_id: int, action: str, corrected_value: str | None, current_user_id: int) -> bool:
    anomaly = db.query(ImportAnomaly).filter(ImportAnomaly.id == anomaly_id, ImportAnomaly.import_run_id == uuid.UUID(run_id)).first()
    if not anomaly:
        return False
        
    if anomaly.resolved:
        return True
        
    import_run = db.query(ImportRun).filter(ImportRun.id == uuid.UUID(run_id)).first()
    if not import_run:
        return False
        
    cleaned_row = anomaly.raw_data.copy()
    
    if action == "reject":
        anomaly.resolved = True
        anomaly.resolved_at = datetime.now()
        anomaly.resolved_by = current_user_id
        import_run.skipped += 1
        import_run.flagged -= 1
        db.commit()
        return True
        
    # Apply corrections based on anomaly type if corrected_value is provided
    if corrected_value:
        if anomaly.anomaly_type in ["MISSING_PAYER", "NAME_INCONSISTENCY"]:
            cleaned_row["paid_by"] = corrected_value
        elif anomaly.anomaly_type in ["ZERO_AMOUNT", "NEGATIVE_AMOUNT", "MALFORMED_AMOUNT"]:
            cleaned_row["amount"] = corrected_value
        elif anomaly.anomaly_type == "UNKNOWN_PARTICIPANT":
            cleaned_row["split_with"] = corrected_value
        elif anomaly.anomaly_type in ["UNPARSEABLE_DATE", "AMBIGUOUS_DATE"]:
            cleaned_row["date"] = corrected_value
        elif anomaly.anomaly_type == "MISSING_DESCRIPTION":
            cleaned_row["description"] = corrected_value
        elif anomaly.anomaly_type == "MISSING_CURRENCY":
            cleaned_row["currency"] = corrected_value
        elif anomaly.anomaly_type == "MISSING_SPLIT_TYPE":
            cleaned_row["split_type"] = corrected_value
            
    # Process import
    memberships_qs = db.query(GroupMembership, User).join(User).filter(GroupMembership.group_id == import_run.group_id).all()
    known_members = [u.name for m, u in memberships_qs]
    
    is_settlement_auto = anomaly.anomaly_type == "SETTLEMENT_AS_EXPENSE" or action == "convert_to_settlement"
    
    success = import_single_row(db, import_run.group_id, cleaned_row, current_user_id, is_settlement_auto, known_members, memberships_qs)
    
    if success:
        anomaly.resolved = True
        anomaly.resolved_at = datetime.now()
        anomaly.resolved_by = current_user_id
        anomaly.raw_data = cleaned_row
        import_run.imported += 1
        import_run.flagged -= 1
        db.commit()
        return True
    
    return False
