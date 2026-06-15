import pytest
from datetime import date
from decimal import Decimal
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.models import Base
from app.models.user import User
from app.models.group import Group, GroupMembership
from app.models.expense import Expense, ExpenseSplit
from app.models.settlement import Settlement
from app.services.balance_service import get_raw_balances, simplify_debts

SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture
def db_session():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)

def test_balance_calculation_and_simplification(db_session):
    # Setup test users
    aisha = User(id=1, name="Aisha", email="aisha@example.com", password_hash="hash")
    rohan = User(id=2, name="Rohan", email="rohan@example.com", password_hash="hash")
    meera = User(id=3, name="Meera", email="meera@example.com", password_hash="hash")
    priya = User(id=4, name="Priya", email="priya@example.com", password_hash="hash")
    db_session.add_all([aisha, rohan, meera, priya])
    db_session.commit()

    # Setup Group
    group = Group(id=1, name="Test Group", created_by=aisha.id)
    db_session.add(group)
    db_session.commit()

    # Create Expenses manually
    # 1. Aisha paid 4000, split 4 ways (1000 each)
    exp1 = Expense(group_id=group.id, description="Aisha paid", amount=Decimal("4000"), currency="INR", amount_inr=Decimal("4000"), paid_by=aisha.id, expense_date=date.today(), split_type="equal")
    db_session.add(exp1)
    db_session.commit()
    for uid in [1, 2, 3, 4]:
        db_session.add(ExpenseSplit(expense_id=exp1.id, user_id=uid, amount_owed=Decimal("1000")))

    # 2. Rohan paid 2000, split 4 ways (500 each)
    exp2 = Expense(group_id=group.id, description="Rohan paid", amount=Decimal("2000"), currency="INR", amount_inr=Decimal("2000"), paid_by=rohan.id, expense_date=date.today(), split_type="equal")
    db_session.add(exp2)
    db_session.commit()
    for uid in [1, 2, 3, 4]:
        db_session.add(ExpenseSplit(expense_id=exp2.id, user_id=uid, amount_owed=Decimal("500")))

    # 3. Meera paid 1000, split 4 ways (250 each)
    exp3 = Expense(group_id=group.id, description="Meera paid", amount=Decimal("1000"), currency="INR", amount_inr=Decimal("1000"), paid_by=meera.id, expense_date=date.today(), split_type="equal")
    db_session.add(exp3)
    db_session.commit()
    for uid in [1, 2, 3, 4]:
        db_session.add(ExpenseSplit(expense_id=exp3.id, user_id=uid, amount_owed=Decimal("250")))

    db_session.commit()

    # Calculate raw balances
    raw_balances = get_raw_balances(db_session, group.id)

    # Calculate net for each person based on raw balances
    net = {1: Decimal("0"), 2: Decimal("0"), 3: Decimal("0"), 4: Decimal("0")}
    for creditor, debtors in raw_balances.items():
        for debtor, amount in debtors.items():
            net[creditor] += amount
            net[debtor] -= amount

    assert net[aisha.id] == Decimal("2250.00")
    assert net[rohan.id] == Decimal("250.00")
    assert net[meera.id] == Decimal("-750.00")
    assert net[priya.id] == Decimal("-1750.00")

    # Test simplify_debts produces minimum transactions
    transactions = simplify_debts(raw_balances)
    
    # Check that simplified transactions correctly satisfy the net balances
    verify_net = {1: Decimal("0"), 2: Decimal("0"), 3: Decimal("0"), 4: Decimal("0")}
    for txn in transactions:
        verify_net[txn["to"]] += txn["amount"]
        verify_net[txn["from"]] -= txn["amount"]
        
    assert verify_net[aisha.id] == Decimal("2250.00")
    assert verify_net[rohan.id] == Decimal("250.00")
    assert verify_net[meera.id] == Decimal("-750.00")
    assert verify_net[priya.id] == Decimal("-1750.00")

    # The maximum number of transactions for N=4 is N-1 = 3
    assert len(transactions) <= 3

def test_settlement_reduces_outstanding_balance(db_session):
    # Setup test users
    aisha = User(id=1, name="Aisha", email="aisha@example.com", password_hash="hash")
    priya = User(id=4, name="Priya", email="priya@example.com", password_hash="hash")
    db_session.add_all([aisha, priya])
    db_session.commit()

    group = Group(id=1, name="Test Group", created_by=aisha.id)
    db_session.add(group)
    db_session.commit()

    # Aisha paid 4000, Priya owes 2000
    exp = Expense(group_id=group.id, description="Aisha paid", amount=Decimal("4000"), currency="INR", amount_inr=Decimal("4000"), paid_by=aisha.id, expense_date=date.today(), split_type="equal")
    db_session.add(exp)
    db_session.commit()
    db_session.add(ExpenseSplit(expense_id=exp.id, user_id=aisha.id, amount_owed=Decimal("2000")))
    db_session.add(ExpenseSplit(expense_id=exp.id, user_id=priya.id, amount_owed=Decimal("2000")))
    db_session.commit()

    # Priya owes Aisha 2000
    raw1 = get_raw_balances(db_session, group.id)
    assert raw1[aisha.id][priya.id] == Decimal("2000")

    # Add settlement: Priya pays Aisha 500
    settlement = Settlement(group_id=group.id, paid_by=priya.id, paid_to=aisha.id, amount=Decimal("500"), currency="INR", settled_at=date.today())
    db_session.add(settlement)
    db_session.commit()

    raw2 = get_raw_balances(db_session, group.id)
    assert raw2[aisha.id][priya.id] == Decimal("1500")
