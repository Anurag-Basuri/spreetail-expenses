from datetime import datetime, date
from decimal import Decimal
from typing import Optional
from sqlalchemy import String, DateTime, Date, Numeric, Boolean, ForeignKey, Text, Integer, Enum
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func
import enum
from .base import Base

class SplitType(enum.Enum):
    equal = "equal"
    unequal = "unequal"
    percentage = "percentage"
    share = "share"

class Expense(Base):
    __tablename__ = "expenses"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    group_id: Mapped[int] = mapped_column(ForeignKey("groups.id"), nullable=False)
    description: Mapped[str] = mapped_column(String(255), nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), nullable=False)
    amount_inr: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    exchange_rate: Mapped[Decimal] = mapped_column(Numeric(10, 4), default=Decimal('1.0'), nullable=False)
    paid_by: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    split_type: Mapped[SplitType] = mapped_column(Enum(SplitType), nullable=False)
    expense_date: Mapped[date] = mapped_column(Date, nullable=False)
    is_settlement: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    import_row: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    import_note: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    splits: Mapped[list["ExpenseSplit"]] = relationship("ExpenseSplit", back_populates="expense", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Expense(id={self.id}, desc='{self.description}', amount={self.amount} {self.currency})>"

class ExpenseSplit(Base):
    __tablename__ = "expense_splits"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    expense_id: Mapped[int] = mapped_column(ForeignKey("expenses.id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    amount_owed: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    share_value: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 4), nullable=True)
    settled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    expense: Mapped["Expense"] = relationship("Expense", back_populates="splits")

    def __repr__(self) -> str:
        return f"<ExpenseSplit(id={self.id}, expense_id={self.expense_id}, user_id={self.user_id}, owed={self.amount_owed})>"
