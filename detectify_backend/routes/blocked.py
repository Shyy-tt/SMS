from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models.user import User
from models.blocked import Blocked
from schemas.blocked import BlockedResponse
from middleware.auth import get_current_user

router = APIRouter(prefix="/blocked", tags=["Blocked"])

@router.get("/", response_model=List[BlockedResponse])
def get_blocked(
    db:   Session = Depends(get_db),
    user: User    = Depends(get_current_user),
):
    return (
        db.query(Blocked)
        .filter(Blocked.user_id == user.id)
        .order_by(Blocked.blocked_at.desc())
        .all()
    )

@router.delete("/{blocked_id}")
def unblock(
    blocked_id: str,
    db:         Session = Depends(get_db),
    user:       User    = Depends(get_current_user),
):
    entry = db.query(Blocked).filter(
        Blocked.id      == blocked_id,
        Blocked.user_id == user.id,
    ).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Not found")

    db.delete(entry)
    db.commit()
    return {"unblocked": blocked_id}