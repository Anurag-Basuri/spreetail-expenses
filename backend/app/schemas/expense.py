from datetime import date
from decimal import Decimal
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, ConfigDict, Field

class ExpenseCreate(BaseModel):
    description: str = Field(..., max_length=255)
    amount: Decimal
    currency: str = Field(default="INR", max_length=3)
    amount_inr: Decimal
    exchange_rate: Decimal = Decimal("1.0")
    paid_by: int
    split_type: str  # equal, unequal, percentage, share
    expense_date: date
    is_settlement: bool = False
    participants: List[int]
    split_details: Optional[Dict[int, Decimal]] = None

class SplitOut(BaseModel):
    id: int
    expense_id: int
    user_id: int
    amount_owed: Decimal
    share_value: Optional[Decimal]
    settled: bool

    model_config = ConfigDict(from_attributes=True)

class ExpenseOut(BaseModel):
    id: int
    group_id: int
    description: str
    amount: Decimal
    currency: str
    amount_inr: Decimal
    exchange_rate: Decimal
    paid_by: int
    split_type: str
    expense_date: date
    is_settlement: bool
    import_row: Optional[int]
    import_note: Optional[str]
    splits: List[SplitOut] = []

    model_config = ConfigDict(from_attributes=True)
