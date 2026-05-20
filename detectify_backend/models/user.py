from sqlalchemy import Column, String, DateTime, Boolean
from sqlalchemy.orm import relationship
from database import Base
import uuid
from datetime import datetime

class User(Base):
    __tablename__ = "users"

    id         = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    full_name  = Column(String, nullable=False)
    email      = Column(String, unique=True, nullable=False, index=True)
    password   = Column(String, nullable=False)
    # phone      = Column(String, nullable=True)  # REMOVED - not needed
    plan       = Column(String, default="free")
    is_active  = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    messages = relationship("Message", back_populates="user", cascade="all, delete")
    blocked  = relationship("Blocked", back_populates="user", cascade="all, delete")