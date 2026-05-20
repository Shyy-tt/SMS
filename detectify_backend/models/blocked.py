from sqlalchemy import Column, String, Integer, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from database import Base
import uuid
from datetime import datetime

class Blocked(Base):
    __tablename__ = "blocked"

    id            = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id       = Column(String, ForeignKey("users.id"), nullable=False)
    sender        = Column(String, nullable=False)
    display_name  = Column(String, nullable=True)
    reason        = Column(String, nullable=True)
    message_count = Column(Integer, default=1)
    blocked_at    = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="blocked")