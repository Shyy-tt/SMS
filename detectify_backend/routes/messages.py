from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import and_, func
from typing import List, Optional
from datetime import datetime, timedelta
from database import get_db
from models.user import User
from models.message import Message
from models.blocked import Blocked
from schemas.message import IncomingSMS, MessageResponse, StatsResponse
from middleware.auth import get_current_user
from ml.predict import predict
import json
import logging
import re
from collections import defaultdict

router = APIRouter(prefix="/messages", tags=["Messages"])
logger = logging.getLogger(__name__)

# Rate limiting
_rate_limit_cache = defaultdict(list)

# Suspicious patterns
SUSPICIOUS_PATTERNS = [
    r"http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+])+",
    r"\+\d{10,15}",
    r"won|winner|claim|prize",
    r"verify|account|login|password",
    r"gcash|maya|paymaya|coins",
    r"bdo|bpi|metrobank|unionbank|landbank",
]

def is_rate_limited(user_id: int, limit: int = 10, window_seconds: int = 60) -> bool:
    now = datetime.now()
    cutoff = now - timedelta(seconds=window_seconds)
    _rate_limit_cache[user_id] = [ts for ts in _rate_limit_cache[user_id] if ts > cutoff]
    if len(_rate_limit_cache[user_id]) >= limit:
        return True
    _rate_limit_cache[user_id].append(now)
    return False

def extract_suspicious_indicators(text: str) -> List[str]:
    indicators = []
    text_lower = text.lower()
    for pattern in SUSPICIOUS_PATTERNS:
        if re.search(pattern, text_lower, re.IGNORECASE):
            if pattern.startswith(r"http"):
                indicators.append("contains_url")
            elif pattern.startswith(r"\+"):
                indicators.append("contains_phone")
            elif "won|winner" in pattern:
                indicators.append("lottery_claim")
            elif "verify|account" in pattern:
                indicators.append("phishing_attempt")
            elif "gcash|maya" in pattern:
                indicators.append("ewallet_related")
            elif "bdo|bpi" in pattern:
                indicators.append("bank_related")
    urgency_words = ["immediately", "urgent", "asap", "now", "today only", "limited time"]
    if any(word in text_lower for word in urgency_words):
        indicators.append("urgency_pressure")
    return list(set(indicators))

def is_duplicate_message(db: Session, user_id: int, sender: str, body: str, minutes: int = 5) -> bool:
    cutoff = datetime.now() - timedelta(minutes=minutes)
    existing = db.query(Message).filter(
        Message.user_id == user_id,
        Message.sender == sender,
        Message.body == body,
        Message.received_at >= cutoff
    ).first()
    return existing is not None

def convert_tags_to_list(obj):
    """Convert tags from JSON string to list"""
    if hasattr(obj, 'tags') and obj.tags:
        if isinstance(obj.tags, str):
            try:
                obj.tags = json.loads(obj.tags)
            except:
                obj.tags = []
    elif hasattr(obj, 'tags') and not obj.tags:
        obj.tags = []
    return obj

# ── Receive new SMS ──────────────────────────────────────────
@router.post("/", response_model=MessageResponse, status_code=201)
def receive_message(
    body: IncomingSMS,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if is_rate_limited(user.id):
        raise HTTPException(status_code=429, detail="Too many messages. Please wait a moment.")
    
    if is_duplicate_message(db, user.id, body.sender, body.body):
        raise HTTPException(status_code=409, detail="Duplicate message ignored")
    
    cleaned_body = body.body.strip()
    if not cleaned_body:
        raise HTTPException(status_code=400, detail="Message body cannot be empty")
    
    if len(cleaned_body) > 1000:
        cleaned_body = cleaned_body[:1000]
    
    try:
        result = predict(cleaned_body)
        logger.info(f"Prediction for user {user.id}: {result}")
    except Exception as e:
        logger.error(f"ML prediction failed: {e}")
        indicators = extract_suspicious_indicators(cleaned_body)
        is_scam = len(indicators) >= 2
        result = {
            "type": "scam" if is_scam else "ham",
            "confidence": 0.7 if is_scam else 0.3,
            "tags": indicators if is_scam else [],
        }
    
    suspicious_indicators = extract_suspicious_indicators(cleaned_body)
    all_tags = list(set(result.get("tags", []) + suspicious_indicators))
    
    is_blocked = db.query(Blocked).filter(
        Blocked.user_id == user.id,
        Blocked.sender == body.sender,
    ).first() is not None
    
    # ✅ UPDATED: Auto-block if confidence is 80% or higher (changed from 95%)
    if result["type"] == "scam" and result.get("confidence", 0) >= 0.80 and not is_blocked:
        existing = db.query(Blocked).filter(
            Blocked.user_id == user.id,
            Blocked.sender == body.sender,
        ).first()
        if existing:
            existing.message_count += 1
        else:
            db.add(Blocked(
                user_id=user.id,
                sender=body.sender,
                display_name=body.display_name,
                reason=f"Auto-blocked: {int(result['confidence']*100)}% confidence scam",
                message_count=1,
            ))
        db.commit()
        is_blocked = True
        logger.info(f"🔒 Auto-blocked {body.sender} with {int(result['confidence']*100)}% confidence")
    
    message = Message(
        user_id=user.id,
        sender=body.sender[:100] if body.sender else "Unknown",
        display_name=body.display_name[:100] if body.display_name else None,
        body=cleaned_body,
        preview=cleaned_body[:80],
        type=result["type"],
        confidence=result.get("confidence", 0.0),
        tags=json.dumps(all_tags),
        is_blocked=is_blocked,
        is_read=False,
    )
    db.add(message)
    db.commit()
    db.refresh(message)
    
    # I-convert ang tags ngadto sa list before i-return
    message = convert_tags_to_list(message)
    
    return MessageResponse.from_orm(message)


# ── Get all messages ──────────────────────────────────────────
@router.get("/", response_model=List[MessageResponse])
def get_messages(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
    skip: int = 0,
    limit: int = 100,
    type_filter: Optional[str] = None,
):
    query = db.query(Message).filter(Message.user_id == user.id)
    if type_filter and type_filter in ["ham", "scam"]:
        query = query.filter(Message.type == type_filter)
    messages = query.order_by(Message.received_at.desc()).offset(skip).limit(limit).all()
    
    for msg in messages:
        msg = convert_tags_to_list(msg)
    
    return [MessageResponse.from_orm(m) for m in messages]


# ── Mark message as read ──────────────────────────────────────
@router.patch("/{message_id}/read", response_model=MessageResponse)
def mark_read(
    message_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    message = db.query(Message).filter(
        Message.id == message_id,
        Message.user_id == user.id,
    ).first()
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    message.is_read = True
    db.commit()
    db.refresh(message)
    
    message = convert_tags_to_list(message)
    return MessageResponse.from_orm(message)


# ── Delete all scam messages ──────────────────────────────────
@router.delete("/spam")
def clear_spam(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    deleted = (
        db.query(Message)
        .filter(Message.user_id == user.id, Message.type == "scam")
        .delete()
    )
    db.commit()
    return {"deleted": deleted}


# ── Stats ─────────────────────────────────────────────────────
@router.get("/stats", response_model=StatsResponse)
def get_stats(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    all_msgs = db.query(Message).filter(Message.user_id == user.id)
    safe_count = all_msgs.filter(Message.type == "ham").count()
    scam_count = all_msgs.filter(Message.type == "scam").count()
    blocked_count = db.query(Blocked).filter(Blocked.user_id == user.id).count()
    unread_count = all_msgs.filter(Message.is_read == False).count()
    last_msg = all_msgs.order_by(Message.received_at.desc()).first()
    total = safe_count + scam_count
    accuracy = round((safe_count / total) * 100, 1) if total > 0 else None

    return StatsResponse(
        safe_messages=safe_count,
        spam_detected=scam_count,
        blocked_numbers=blocked_count,
        active_alerts=unread_count,
        accuracy_rate=accuracy,
        last_scanned_at=last_msg.received_at if last_msg else None,
    )