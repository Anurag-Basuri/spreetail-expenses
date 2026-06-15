import uuid
from datetime import datetime
from decimal import Decimal
from typing import Optional
from sqlalchemy import String, DateTime, Integer, Boolean, ForeignKey, Text, JSON, Uuid, Numeric
from sqlalchemy.sql import func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import Base

class ImportRun(Base):
    __tablename__ = "import_runs"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    group_id: Mapped[int] = mapped_column(ForeignKey("groups.id"), nullable=False)
    total_rows: Mapped[int] = mapped_column(Integer, default=0)
    imported: Mapped[int] = mapped_column(Integer, default=0)
    flagged: Mapped[int] = mapped_column(Integer, default=0)
    skipped: Mapped[int] = mapped_column(Integer, default=0)
    auto_fixed: Mapped[int] = mapped_column(Integer, default=0)
    exchange_rate_used: Mapped[Decimal] = mapped_column(Numeric(10, 4), default=Decimal("83.5"))
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=func.now())

class ImportAnomaly(Base):
    __tablename__ = "import_anomalies"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    import_run_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("import_runs.id"), nullable=False)
    csv_row: Mapped[int] = mapped_column(Integer, nullable=False)
    anomaly_type: Mapped[str] = mapped_column(String(50), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    raw_data: Mapped[dict] = mapped_column(JSON, nullable=False)
    action_taken: Mapped[str] = mapped_column(String(255), nullable=False)
    resolved: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    resolved_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    resolved_by: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"), nullable=True)

    def __repr__(self) -> str:
        return f"<ImportAnomaly(id={self.id}, type='{self.anomaly_type}', row={self.csv_row})>"
