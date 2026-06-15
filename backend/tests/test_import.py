import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database import get_db
from app.models import Base
from app.models.user import User
from app.models.group import Group, GroupMembership
from app.services.import_service import run_import, get_import_report, resolve_import_anomaly

SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base.metadata.create_all(bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

@pytest.fixture
def db_session():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)

def test_import_pipeline(db_session):
    # Create test user and group
    user = User(name="Aisha", email="aisha@example.com", password_hash="hash")
    db_session.add(user)
    db_session.commit()
    
    group = Group(name="Trip", created_by=user.id)
    db_session.add(group)
    db_session.commit()
    
    import datetime
    membership = GroupMembership(group_id=group.id, user_id=user.id, joined_at=datetime.date(2024, 1, 1))
    db_session.add(membership)
    db_session.commit()

    csv_content = """date,description,amount,currency,paid_by,split_with,split_type,split_details
2024-02-15,Wifi Bill,1200,INR,Aisha,Aisha,equal,
"""
    run_id = "12345678-1234-5678-1234-567812345678"
    
    report = run_import(db_session, csv_content.encode('utf-8'), group.id, run_id, user.id)
    assert report["total_rows"] == 1
    assert report["imported"] == 1
    assert report["run_id"] == run_id

    fetched_report = get_import_report(db_session, run_id)
    assert fetched_report is not None
    assert fetched_report["total_rows"] == 1

import datetime
from app.services.anomaly_detector import detect_anomalies, AnomalyType

def test_duplicate_detection():
    row = {"date": "2024-02-15", "description": "Dinner", "amount": "1000", "currency": "INR", "paid_by": "Aisha", "split_with": "Aisha"}
    all_rows = [
        {"date": "2024-02-15", "description": "Dinner", "amount": "1000", "currency": "INR", "paid_by": "Aisha", "split_with": "Aisha"},
        row
    ]
    memberships = {"Aisha": (datetime.date(2024, 1, 1), None)}
    anomalies = detect_anomalies(row, 2, all_rows, ["Aisha"], memberships)
    types = [a.anomaly_type for a in anomalies]
    assert AnomalyType.DUPLICATE in types

def test_percentage_sum_validation():
    row = {"date": "2024-02-15", "description": "Dinner", "amount": "1000", "currency": "INR", "paid_by": "Aisha", "split_type": "percentage", "split_details": "Aisha 60%; Rohan 50%"}
    memberships = {"Aisha": (datetime.date(2024, 1, 1), None), "Rohan": (datetime.date(2024, 1, 1), None)}
    anomalies = detect_anomalies(row, 1, [row], ["Aisha", "Rohan"], memberships)
    types = [a.anomaly_type for a in anomalies]
    assert AnomalyType.INVALID_PERCENTAGES in types

def test_negative_amount():
    row = {"date": "2024-02-15", "description": "Refund", "amount": "-500", "currency": "INR", "paid_by": "Aisha"}
    anomalies = detect_anomalies(row, 1, [row], ["Aisha"], {"Aisha": (datetime.date(2024, 1, 1), None)})
    types = [a.anomaly_type for a in anomalies]
    assert AnomalyType.NEGATIVE_AMOUNT in types

def test_missing_payer():
    row = {"date": "2024-02-15", "description": "Dinner", "amount": "1000", "currency": "INR", "paid_by": ""}
    anomalies = detect_anomalies(row, 1, [row], ["Aisha"], {"Aisha": (datetime.date(2024, 1, 1), None)})
    types = [a.anomaly_type for a in anomalies]
    assert AnomalyType.MISSING_PAYER in types

def test_settlement_detection():
    row = {"date": "2024-02-15", "description": "paid Aisha back", "amount": "1000", "currency": "INR", "paid_by": "Rohan"}
    anomalies = detect_anomalies(row, 1, [row], ["Aisha", "Rohan"], {"Aisha": (datetime.date(2024, 1, 1), None), "Rohan": (datetime.date(2024, 1, 1), None)})
    types = [a.anomaly_type for a in anomalies]
    assert AnomalyType.SETTLEMENT_AS_EXPENSE in types

def test_inactive_member():
    row = {"date": "2024-04-15", "description": "Dinner", "amount": "1000", "currency": "INR", "paid_by": "Aisha", "split_with": "Meera"}
    memberships = {
        "Aisha": (datetime.date(2024, 1, 1), None),
        "Meera": (datetime.date(2024, 5, 1), None) # Meera joins in May, expense is April
    }
    anomalies = detect_anomalies(row, 1, [row], ["Aisha", "Meera"], memberships)
    types = [a.anomaly_type for a in anomalies]
    assert AnomalyType.INACTIVE_MEMBER in types
