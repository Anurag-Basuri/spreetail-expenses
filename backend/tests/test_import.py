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
