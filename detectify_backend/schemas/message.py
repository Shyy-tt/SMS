from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional, List

class IncomingSMS(BaseModel):
    sender:       str
    display_name: Optional[str] = None
    body:         str

class MessageResponse(BaseModel):
    id:           UUID
    sender:       str
    display_name: Optional[str]
    preview:      str
    body:         str
    type:         str
    confidence:   Optional[float]
    tags:         List[str]
    is_read:      bool
    is_blocked:   bool
    received_at:  datetime

    class Config:
        from_attributes = True

class StatsResponse(BaseModel):
    safe_messages:   int
    spam_detected:   int
    blocked_numbers: int
    active_alerts:   int
    accuracy_rate:   Optional[float]
    last_scanned_at: Optional[datetime]