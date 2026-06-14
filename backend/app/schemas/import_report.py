from datetime import datetime
from decimal import Decimal
from typing import List
from pydantic import BaseModel

class AnomalyOut(BaseModel):
    id: int
    row_number: int
    anomaly_type: str
    severity: str
    description: str
    suggested_action: str
    auto_resolved: bool

class ImportReportOut(BaseModel):
    run_id: str
    total_rows: int
    imported: int
    flagged: int
    skipped: int
    auto_fixed: int
    anomalies: List[AnomalyOut]
    exchange_rate_used: Decimal
    timestamp: datetime
