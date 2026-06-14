from datetime import date, datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict

class GroupBase(BaseModel):
    name: str

class GroupCreate(GroupBase):
    pass

class GroupOut(GroupBase):
    id: int
    created_by: int
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class MembershipCreate(BaseModel):
    user_id: int
    joined_at: date

class MembershipLeave(BaseModel):
    left_at: date

class MembershipOut(BaseModel):
    user_id: int
    user_name: str
    joined_at: date
    left_at: Optional[date]

class GroupDetail(GroupOut):
    members: List[MembershipOut]
