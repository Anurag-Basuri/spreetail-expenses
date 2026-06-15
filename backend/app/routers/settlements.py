from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.routers.auth import get_current_user
from app.models.user import User
from app.schemas.settlement import SettlementCreate, SettlementOut
from app.services import settlement_service, balance_service

router = APIRouter()

@router.post("", response_model=SettlementOut, status_code=status.HTTP_201_CREATED)
def create_settlement(
    settlement_in: SettlementCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Record a settlement (debt repayment) between two users."""
    return settlement_service.create_settlement(db, settlement_in.group_id, current_user.id, settlement_in)

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
