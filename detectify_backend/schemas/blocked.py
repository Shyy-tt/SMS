from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional

class BlockedResponse(BaseModel):
    id:            UUID
    sender:        str
    display_name:  Optional[str]
    reason:        Optional[str]
    message_count: int
    blocked_at:    datetime

    class Config:
        from_attributes = True