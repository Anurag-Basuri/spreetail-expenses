from datetime import date
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, status, Form
from sqlalchemy.orm import Session

from app.database import get_db
from app.routers.auth import get_current_user
from app.models.user import User
from app.models.settlement import Settlement
from app.services import balance_service

router = APIRouter()

@router.post("", status_code=status.HTTP_201_CREATED)
def create_settlement(
    group_id: int = Form(...),
    paid_to_id: int = Form(...),
    amount: Decimal = Form(...),
    settled_at: date = Form(...),
    note: str = Form(""),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Record a settlement (debt repayment) between two users."""
    db_settlement = Settlement(
        group_id=group_id,
        paid_by=current_user.id,
        paid_to=paid_to_id,
        amount=amount,
        currency="INR",
        settled_at=settled_at,
        note=note
    )
    db.add(db_settlement)
    db.commit()
    db.refresh(db_settlement)
    return db_settlement

@router.get("/{group_id}/summary")
def get_group_summary(
    group_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get Aisha's one-number-per-person group summary with simplified transactions."""
    return balance_service.get_group_summary(db, group_id)

@router.get("/{group_id}/member/{user_id}")
def get_member_detail(
    group_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get Rohan's drill-down: detailed balance breakdown for a single member."""
    return balance_service.get_member_balance_detail(db, group_id, user_id)
