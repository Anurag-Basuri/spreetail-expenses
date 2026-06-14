from datetime import date
from typing import List
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.group import Group, GroupMembership
from app.models.user import User

def create_group(db: Session, name: str, created_by_id: int) -> Group:
    db_group = Group(name=name, created_by=created_by_id)
    db.add(db_group)
    db.commit()
    db.refresh(db_group)
    return db_group

def add_member(db: Session, group_id: int, user_id: int, joined_at: date) -> GroupMembership:
    # Verify group exists
    if not db.query(Group).filter(Group.id == group_id).first():
        raise HTTPException(status_code=404, detail="Group not found")
        
    # Verify user exists
    if not db.query(User).filter(User.id == user_id).first():
        raise HTTPException(status_code=404, detail="User not found")
        
    # Check if membership already exists (active)
    existing = db.query(GroupMembership).filter(
        GroupMembership.group_id == group_id,
        GroupMembership.user_id == user_id,
        GroupMembership.left_at.is_(None)
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="User is already an active member of this group")

    db_membership = GroupMembership(
        group_id=group_id,
        user_id=user_id,
        joined_at=joined_at
    )
    db.add(db_membership)
    db.commit()
    db.refresh(db_membership)
    return db_membership

def remove_member(db: Session, group_id: int, user_id: int, left_at: date) -> GroupMembership:
    membership = db.query(GroupMembership).filter(
        GroupMembership.group_id == group_id,
        GroupMembership.user_id == user_id,
        GroupMembership.left_at.is_(None)
    ).first()
    if not membership:
        raise HTTPException(status_code=404, detail="Active membership not found")
        
    if left_at < membership.joined_at:
        raise HTTPException(status_code=400, detail="Leave date cannot be strictly before joined date")

    membership.left_at = left_at
    db.commit()
    db.refresh(membership)
    return membership

def get_active_members(db: Session, group_id: int, on_date: date) -> List[User]:
    """Returns users where joined_at <= on_date AND (left_at IS NULL OR left_at >= on_date)"""
    memberships = db.query(GroupMembership).filter(
        GroupMembership.group_id == group_id,
        GroupMembership.joined_at <= on_date,
        (GroupMembership.left_at.is_(None) | (GroupMembership.left_at >= on_date))
    ).all()
    
    user_ids = [m.user_id for m in memberships]
    if not user_ids:
        return []
    return db.query(User).filter(User.id.in_(user_ids)).all()

def get_group_detail(db: Session, group_id: int) -> dict:
    group = db.query(Group).filter(Group.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
        
    # Join to get user names for the MembershipOut schema
    results = db.query(GroupMembership, User).join(
        User, GroupMembership.user_id == User.id
    ).filter(
        GroupMembership.group_id == group_id
    ).all()
    
    member_details = []
    for membership, user in results:
        member_details.append({
            "user_id": user.id,
            "user_name": user.name,
            "joined_at": membership.joined_at,
            "left_at": membership.left_at
        })
        
    return {
        "id": group.id,
        "name": group.name,
        "created_by": group.created_by,
        "created_at": group.created_at,
        "members": member_details
    }

def get_user_groups(db: Session, user_id: int) -> List[Group]:
    # Distinct groups where user is a member or creator
    group_ids_query = db.query(GroupMembership.group_id).filter(GroupMembership.user_id == user_id).distinct()
    return db.query(Group).filter(
        (Group.id.in_(group_ids_query)) | (Group.created_by == user_id)
    ).all()
