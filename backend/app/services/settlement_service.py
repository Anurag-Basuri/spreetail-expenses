from typing import List
from sqlalchemy.orm import Session
from app.models.settlement import Settlement
from app.models.user import User
from app.schemas.settlement import SettlementCreate, SettlementOut

def create_settlement(db: Session, group_id: int, paid_by_id: int, settlement_data: SettlementCreate) -> SettlementOut:
    db_settlement = Settlement(
        group_id=group_id,
        paid_by=paid_by_id,
        paid_to=settlement_data.paid_to,
        amount=settlement_data.amount,
        currency=settlement_data.currency,
        settled_at=settlement_data.settled_at,
        note=settlement_data.note
    )
    db.add(db_settlement)
    db.commit()
    db.refresh(db_settlement)

    payer = db.query(User).filter(User.id == paid_by_id).first()
    payee = db.query(User).filter(User.id == settlement_data.paid_to).first()

    return SettlementOut(
        id=db_settlement.id,
        group_id=db_settlement.group_id,
        paid_to=db_settlement.paid_to,
        amount=db_settlement.amount,
        currency=db_settlement.currency,
        settled_at=db_settlement.settled_at,
        note=db_settlement.note,
        paid_by_name=payer.name if payer else "Unknown",
        paid_to_name=payee.name if payee else "Unknown"
    )

def list_settlements(db: Session, group_id: int) -> List[SettlementOut]:
    settlements = db.query(Settlement).filter(Settlement.group_id == group_id).all()

    result = []
    for s in settlements:
        s_out = SettlementOut(
            id=s.id,
            group_id=s.group_id,
            paid_to=s.paid_to,
            amount=s.amount,
            currency=s.currency,
            settled_at=s.settled_at,
            note=s.note,
            paid_by_name=s.payer.name if s.payer else "Unknown",
            paid_to_name=s.payee.name if s.payee else "Unknown"
        )
        result.append(s_out)
    return result
