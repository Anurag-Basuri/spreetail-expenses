from decimal import Decimal, ROUND_HALF_UP
from typing import List, Dict, Any
from collections import defaultdict
from sqlalchemy.orm import Session

from app.models.expense import Expense, ExpenseSplit
from app.models.settlement import Settlement
from app.models.user import User

def get_raw_balances(db: Session, group_id: int) -> Dict[int, Dict[int, Decimal]]:
    """
    Returns a nested dict: balances[creditor_id][debtor_id] = Decimal amount
    Meaning: debtor_id owes creditor_id this amount
    """
    balances = defaultdict(lambda: defaultdict(lambda: Decimal("0.00")))
    
    # 1. Parse active non-settlement expenses
    expenses = db.query(Expense).filter(
        Expense.group_id == group_id,
        Expense.is_deleted == False,
        Expense.is_settlement == False
    ).all()
    
    for expense in expenses:
        creditor_id = expense.paid_by
        for split in expense.splits:
            debtor_id = split.user_id
            if debtor_id != creditor_id:
                balances[creditor_id][debtor_id] += split.amount_owed
                
    # 2. Parse settlements to reduce debt
    settlements = db.query(Settlement).filter(
        Settlement.group_id == group_id
    ).all()
    
    for settlement in settlements:
        paid_to = settlement.paid_to     # Creditor
        paid_by = settlement.paid_by     # Debtor paying back
        amount = settlement.amount
        
        balances[paid_to][paid_by] -= amount
        
    return balances

def simplify_debts(balances: Dict[int, Dict[int, Decimal]]) -> List[Dict[str, Any]]:
    """
    Simplifies raw balances using a greedy algorithm to find the minimum number of transactions.
    Returns: [{"from": user_id, "to": user_id, "amount": Decimal}]
    """
    # 1. Compute net balance for each person
    net = defaultdict(lambda: Decimal("0.00"))
    for creditor, debtors in balances.items():
        for debtor, amount in debtors.items():
            net[creditor] += amount
            net[debtor] -= amount
            
    # 2. Separate into creditors and debtors
    creditors = []
    debtors = []
    
    for user_id, amount in net.items():
        amount = amount.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        if amount > Decimal("0.00"):
            creditors.append([user_id, amount])
        elif amount < Decimal("0.00"):
            debtors.append([user_id, -amount])
            
    # Sort by amounts descending (Greedy approach)
    creditors.sort(key=lambda x: x[1], reverse=True)
    debtors.sort(key=lambda x: x[1], reverse=True)
    
    transactions = []
    
    # 3. Resolve debts iteratively
    while creditors and debtors:
        creditor = creditors[0]
        debtor = debtors[0]
        
        payment = min(creditor[1], debtor[1])
        
        transactions.append({
            "from": debtor[0],
            "to": creditor[0],
            "amount": payment.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        })
        
        creditor[1] -= payment
        debtor[1] -= payment
        
        if creditor[1] < Decimal("0.01"):
            creditors.pop(0)
        if debtor[1] < Decimal("0.01"):
            debtors.pop(0)
            
    return transactions

def get_member_balance_detail(db: Session, group_id: int, user_id: int) -> dict:
    """
    Returns a detailed drill-down of a member's financial state in the group.
    """
    raw_balances = get_raw_balances(db, group_id)
    
    total_owed_to_me = Decimal("0.00")
    total_i_owe = Decimal("0.00")
    
    for creditor, debtors in raw_balances.items():
        if creditor == user_id:
            total_owed_to_me += sum(debtors.values())
        else:
            if user_id in debtors:
                total_i_owe += debtors[user_id]
                
    net_balance = total_owed_to_me - total_i_owe
    
    # Generate the minimum transaction pathway for settlement
    simplified = simplify_debts(raw_balances)
    
    # Cache user names to avoid N+1 queries
    users = db.query(User).all()
    user_names = {u.id: u.name for u in users}
    
    owes = []
    owed_by = []
    
    for txn in simplified:
        if txn["from"] == user_id:
            owes.append({
                "to": txn["to"],
                "name": user_names.get(txn["to"], "Unknown"),
                "amount": txn["amount"]
            })
        elif txn["to"] == user_id:
            owed_by.append({
                "from": txn["from"],
                "name": user_names.get(txn["from"], "Unknown"),
                "amount": txn["amount"]
            })
            
    # Breakdown of all expenses involving this user
    expenses = db.query(Expense).filter(
        Expense.group_id == group_id,
        Expense.is_deleted == False
    ).order_by(Expense.expense_date.desc()).all()
    
    breakdown = []
    for expense in expenses:
        is_payer = (expense.paid_by == user_id)
        my_split = next((s for s in expense.splits if s.user_id == user_id), None)
        
        if is_payer or my_split:
            breakdown.append({
                "expense_id": expense.id,
                "description": expense.description,
                "date": expense.expense_date,
                "paid_by_me": is_payer,
                "my_share": my_split.amount_owed if my_split else Decimal("0.00"),
                "total": expense.amount_inr
            })
            
    return {
        "net_balance": net_balance.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP),
        "owes": owes,
        "owed_by": owed_by,
        "expenses_breakdown": breakdown
    }

def get_group_summary(db: Session, group_id: int) -> dict:
    """
    Returns Aisha's high-level summary: 
    - Net balance for all members
    - The simplified transactions to settle all group debt
    """
    raw_balances = get_raw_balances(db, group_id)
    
    net_balances = defaultdict(lambda: Decimal("0.00"))
    for creditor, debtors in raw_balances.items():
        for debtor, amount in debtors.items():
            net_balances[creditor] += amount
            net_balances[debtor] -= amount
            
    users = db.query(User).all()
    user_names = {u.id: u.name for u in users}
            
    formatted_net_balances = []
    for uid, amt in net_balances.items():
        # Only include active/historical participants
        formatted_net_balances.append({
            "user_id": uid,
            "name": user_names.get(uid, "Unknown"),
            "net_balance": amt.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        })
        
    transactions = simplify_debts(raw_balances)
    
    # Tag names onto the simplified transactions
    for txn in transactions:
        txn["from_name"] = user_names.get(txn["from"], "Unknown")
        txn["to_name"] = user_names.get(txn["to"], "Unknown")
    
    return {
        "net_balances": formatted_net_balances,
        "simplified_transactions": transactions
    }
