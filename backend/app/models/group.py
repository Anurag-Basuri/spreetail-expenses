from datetime import datetime, date
from typing import Optional
from sqlalchemy import String, DateTime, Date, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func
from .base import Base

class Group(Base):
    __tablename__ = "groups"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    created_by: Mapped[int] = mapped_column(ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    def __repr__(self) -> str:
        return f"<Group(id={self.id}, name='{self.name}')>"

class GroupMembership(Base):
    __tablename__ = "group_memberships"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    group_id: Mapped[int] = mapped_column(ForeignKey("groups.id"), nullable=False)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    joined_at: Mapped[date] = mapped_column(Date, nullable=False)
    left_at: Mapped[Optional[date]] = mapped_column(Date, nullable=True)

    def __repr__(self) -> str:
        return f"<GroupMembership(id={self.id}, group_id={self.group_id}, user_id={self.user_id}, active={self.left_at is None})>"
