import csv
import uuid
from io import StringIO
from datetime import datetime, date
from decimal import Decimal

from sqlalchemy.orm import Session
from app.models.import_anomaly import ImportAnomaly
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

def run_import(db: Session, file_bytes: bytes, group_id: int, run_id: str, current_user_id: int) -> dict:
    content = file_bytes.decode('utf-8-sig')
    reader = csv.DictReader(StringIO(content))
    raw_rows = list(reader)
    
    # Pre-fetch group memberships and users
    memberships_qs = db.query(GroupMembership, User).join(User).filter(GroupMembership.group_id == group_id).all()
    known_members = [u.name for m, u in memberships_qs]
    memberships_dict = {u.name: (m.joined_at, m.left_at) for m, u in memberships_qs}
    
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
                import_run_id=uuid.UUID(run_id),
                csv_row=a.row_number,
                anomaly_type=a.anomaly_type.value,
                description=a.description,
                raw_data=cleaned_row,
                action_taken=a.suggested_action,
                resolved=a.auto_resolved
            )
            db.add(db_anomaly)
            
            all_anomalies_out.append({
                "id": 0, 
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
                
        db.flush() 
        
        if is_skipped:
            skipped_count += 1
            continue
            
        if status == "FLAGGED":
            flagged_count += 1
            continue
            
        # Execute ingestion for CLEAN and AUTO_FIXED rows
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
        
        is_settlement_auto = any(a.anomaly_type == AnomalyType.SETTLEMENT_AS_EXPENSE for a in anomalies)
        
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
            ed.import_row = row_idx + 1
            ed.import_note = "Imported"
            ed.participants = participants
            ed.split_details = split_details
            
            try:
                # We use a savepoint to rollback just this creation if unequal splits don't match, etc.
                db.begin_nested()
                create_expense(db, group_id, ed, current_user_id)
                db.commit() # commit savepoint
            except Exception:
                db.rollback() # rollback savepoint
                flagged_count += 1
                continue
                
        if status == "AUTO_FIXED":
            auto_fixed_count += 1
            imported_count += 1
        else:
            imported_count += 1
            
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
        "timestamp": datetime.now()
    }
