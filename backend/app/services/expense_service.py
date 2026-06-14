from decimal import Decimal, ROUND_HALF_UP
from typing import List, Dict, Optional, Any
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.expense import Expense, ExpenseSplit, SplitType

def calculate_splits(amount_inr: Decimal, split_type: str, participants: List[int], split_details: Optional[Dict[Any, Any]]) -> List[Dict[str, Any]]:
    """
    Calculates exact split amounts for participants.
    Returns: List[dict] where each dict is {user_id, amount_owed, share_value}
    """
    if not participants:
        raise ValueError("Cannot split expense with zero participants")
        
    result = []
    
    # Handle both string enum values and Enum objects
    split_type_val = split_type.value if isinstance(split_type, SplitType) else split_type
    
    # Helper to safely get value from dict whether key is int or str
    def get_val(uid):
        return split_details.get(uid, split_details.get(str(uid), 0)) if split_details else 0

    # 1. EQUAL SPLIT
    if split_type_val == SplitType.equal.value:
        per_person = (amount_inr / Decimal(len(participants))).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        total_calculated = Decimal("0.00")
        
        for i, user_id in enumerate(participants):
            if i == len(participants) - 1:
                # Last person gets the exact remainder to ensure sum matches amount_inr
                amount_owed = amount_inr - total_calculated
            else:
                amount_owed = per_person
                total_calculated += amount_owed
                
            result.append({
                "user_id": user_id,
                "amount_owed": amount_owed,
                "share_value": None
            })
            
    # 2. UNEQUAL SPLIT
    elif split_type_val == SplitType.unequal.value:
        if not split_details:
            raise ValueError("split_details required for unequal split")
            
        calculated_sum = sum((Decimal(str(val)) for val in split_details.values()), Decimal("0.00"))
        
        if abs(calculated_sum - amount_inr) > Decimal("0.01"):
            raise ValueError(f"Sum of unequal amounts ({calculated_sum}) does not equal total amount ({amount_inr})")
            
        for user_id in participants:
            amount_owed = Decimal(str(get_val(user_id))).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
            result.append({
                "user_id": user_id,
                "amount_owed": amount_owed,
                "share_value": None
            })
            
    # 3. PERCENTAGE SPLIT
    elif split_type_val == SplitType.percentage.value:
        if not split_details:
            raise ValueError("split_details required for percentage split")
            
        total_percentage = sum((Decimal(str(val)) for val in split_details.values()), Decimal("0.00"))
        if abs(total_percentage - Decimal("100.00")) > Decimal("0.01"):
            raise ValueError(f"Sum of percentages ({total_percentage}) does not equal 100")
            
        total_calculated = Decimal("0.00")
        for i, user_id in enumerate(participants):
            percentage = Decimal(str(get_val(user_id)))
            if i == len(participants) - 1:
                amount_owed = amount_inr - total_calculated
            else:
                amount_owed = (amount_inr * (percentage / Decimal("100"))).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
                total_calculated += amount_owed
                
            result.append({
                "user_id": user_id,
                "amount_owed": amount_owed,
                "share_value": percentage
            })
            
    # 4. SHARE SPLIT
    elif split_type_val == SplitType.share.value:
        if not split_details:
            raise ValueError("split_details required for share split")
            
        total_shares = sum((Decimal(str(val)) for val in split_details.values()), Decimal("0.00"))
        if total_shares == Decimal("0"):
            raise ValueError("Total shares cannot be zero")
            
        total_calculated = Decimal("0.00")
        for i, user_id in enumerate(participants):
            shares = Decimal(str(get_val(user_id)))
            if i == len(participants) - 1:
                amount_owed = amount_inr - total_calculated
            else:
                amount_owed = (amount_inr * (shares / total_shares)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
                total_calculated += amount_owed
                
            result.append({
                "user_id": user_id,
                "amount_owed": amount_owed,
                "share_value": shares
            })
            
    else:
        raise ValueError(f"Unknown split type: {split_type}")
        
    return result

def create_expense(db: Session, group_id: int, expense_data: Any, current_user_id: int) -> Expense:
    amount_inr = Decimal(str(expense_data.amount_inr)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    
    # Calculate exactly how much each person owes
    splits = calculate_splits(
        amount_inr=amount_inr,
        split_type=expense_data.split_type,
        participants=expense_data.participants,
        split_details=getattr(expense_data, 'split_details', None)
    )
    
    # 1. Create the root Expense
    db_expense = Expense(
        group_id=group_id,
        description=expense_data.description,
        amount=Decimal(str(expense_data.amount)),
        currency=expense_data.currency,
        amount_inr=amount_inr,
        exchange_rate=Decimal(str(getattr(expense_data, 'exchange_rate', '1.0'))),
        paid_by=expense_data.paid_by,
        split_type=expense_data.split_type,
        expense_date=expense_data.expense_date,
        is_settlement=getattr(expense_data, 'is_settlement', False),
        import_row=getattr(expense_data, 'import_row', None),
        import_note=getattr(expense_data, 'import_note', None),
        is_deleted=False
    )
    db.add(db_expense)
    db.flush() # Generate ID for db_expense
    
    # 2. Attach the generated splits
    for split in splits:
        db_split = ExpenseSplit(
            expense_id=db_expense.id,
            user_id=split["user_id"],
            amount_owed=split["amount_owed"],
            share_value=split["share_value"],
            settled=False
        )
        db.add(db_split)
        
    db.commit()
    db.refresh(db_expense)
    return db_expense

def get_expense(db: Session, expense_id: int) -> Expense:
    expense = db.query(Expense).filter(Expense.id == expense_id, Expense.is_deleted == False).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    return expense

def list_expenses(db: Session, group_id: int, skip: int = 0, limit: int = 50) -> List[Expense]:
    return db.query(Expense).filter(
        Expense.group_id == group_id, 
        Expense.is_deleted == False
    ).order_by(Expense.expense_date.desc(), Expense.created_at.desc()).offset(skip).limit(limit).all()

def delete_expense(db: Session, expense_id: int) -> None:
    expense = db.query(Expense).filter(Expense.id == expense_id, Expense.is_deleted == False).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
        
    expense.is_deleted = True
    db.commit()
