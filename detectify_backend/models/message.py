from sqlalchemy import Column, String, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from database import Base
import uuid
from datetime import datetime

class Message(Base):
    __tablename__ = "messages"

    id           = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id      = Column(String, ForeignKey("users.id"), nullable=False)
    sender       = Column(String, nullable=False)
    display_name = Column(String, nullable=True)
    body         = Column(String, nullable=False)
    preview      = Column(String, nullable=False)
    type         = Column(String, default="unknown")  # 'scam' | 'ham'
    confidence   = Column(Float, nullable=True)
    tags         = Column(String, default="[]")       # stored as JSON string
    is_read      = Column(Boolean, default=False)
    is_blocked   = Column(Boolean, default=False)
    received_at  = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="messages")