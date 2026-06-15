from datetime import date
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, Field

class SettlementBase(BaseModel):
    group_id: int
    paid_to: int
    amount: Decimal
    currency: str = "INR"
    settled_at: date
    note: Optional[str] = None

class SettlementCreate(SettlementBase):
    pass

class SettlementOut(SettlementBase):
    id: int
    paid_by_name: str
    paid_to_name: str

    model_config = {"from_attributes": True}
