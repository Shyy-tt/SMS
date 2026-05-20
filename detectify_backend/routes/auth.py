from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from database import get_db
from models.user import User
from schemas.user import RegisterRequest, LoginRequest, TokenResponse, UserResponse
from middleware.auth import create_token
from uuid import UUID

router = APIRouter(prefix="/auth", tags=["Auth"])
pwd    = CryptContext(schemes=["bcrypt"], deprecated="auto")

@router.post("/register", response_model=TokenResponse, status_code=201)
def register(body: RegisterRequest, db: Session = Depends(get_db)):
    # Check if email already exists
    if db.query(User).filter(User.email == body.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    # Create new user
    user = User(
        full_name = body.full_name,
        email     = body.email,
        password  = pwd.hash(body.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Return token with user info
    return TokenResponse(
        access_token = create_token(user.id),
        user         = UserResponse(
            id=UUID(user.id),
            full_name=user.full_name,
            email=user.email,
            plan=user.plan,
            created_at=user.created_at
        ),
    )

@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email).first()
    if not user or not pwd.verify(body.password, user.password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")

    return TokenResponse(
        access_token = create_token(user.id),
        user         = UserResponse(
            id=UUID(user.id),
            full_name=user.full_name,
            email=user.email,
            plan=user.plan,
            created_at=user.created_at
        ),
    )