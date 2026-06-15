from datetime import date
from typing import List
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.routers.auth import get_current_user
from app.models.user import User
from app.schemas.group import GroupCreate, GroupOut, GroupDetail, MembershipCreate, MembershipLeave
from app.schemas.user import UserOut
from app.schemas.settlement import SettlementOut
from app.services import group_service, settlement_service

router = APIRouter()

@router.post("", response_model=GroupOut, status_code=status.HTTP_201_CREATED)
def create_group(group_in: GroupCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return group_service.create_group(db, group_in.name, current_user.id)

@router.get("", response_model=List[GroupOut])
def get_my_groups(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return group_service.get_user_groups(db, current_user.id)

@router.get("/{group_id}", response_model=GroupDetail)
def get_group(group_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return group_service.get_group_detail(db, group_id)

@router.post("/{group_id}/members", status_code=status.HTTP_201_CREATED)
def add_member(
    group_id: int, 
    member_in: MembershipCreate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    return group_service.add_member(db, group_id, member_in.user_id, member_in.joined_at)

@router.patch("/{group_id}/members/{user_id}/leave")
def remove_member(
    group_id: int, 
    user_id: int, 
    leave_in: MembershipLeave, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    return group_service.remove_member(db, group_id, user_id, leave_in.left_at)

@router.get("/{group_id}/members", response_model=List[UserOut])
def get_active_members(
    group_id: int, 
    date: date = Query(...), 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """Returns active members on a specific date (used by balance calculator and importer)."""
    return group_service.get_active_members(db, group_id, date)

@router.get("/{group_id}/settlements", response_model=List[SettlementOut])
def list_group_settlements(
    group_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all settlements for a group."""
    return settlement_service.list_settlements(db, group_id)
