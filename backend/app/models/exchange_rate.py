from datetime import date
from decimal import Decimal
from sqlalchemy import String, Date, Numeric
from sqlalchemy.orm import Mapped, mapped_column
from .base import Base

class ExchangeRate(Base):
    __tablename__ = "exchange_rates"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    from_ccy: Mapped[str] = mapped_column(String(3), nullable=False)
    to_ccy: Mapped[str] = mapped_column(String(3), nullable=False)
    rate: Mapped[Decimal] = mapped_column(Numeric(10, 4), nullable=False)
    effective_date: Mapped[date] = mapped_column(Date, nullable=False)
    source: Mapped[str] = mapped_column(String(100), nullable=False)

    def __repr__(self) -> str:
        return f"<ExchangeRate(from={self.from_ccy}, to={self.to_ccy}, rate={self.rate}, date={self.effective_date})>"
