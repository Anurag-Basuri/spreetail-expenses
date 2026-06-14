import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import String, DateTime, Integer, Boolean, ForeignKey, Text, JSON, Uuid
from sqlalchemy.orm import Mapped, mapped_column
from .base import Base

class ImportAnomaly(Base):
    __tablename__ = "import_anomalies"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    import_run_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), nullable=False)
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
