from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User
from app.schemas import LoginRequest, LoginResponse, UserOut
from app.auth import create_token

router = APIRouter(tags=["auth"])


@router.post("/login", response_model=LoginResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.name == request.name).first()
    if not user:
        user = User(name=request.name)
        db.add(user)
        db.commit()
        db.refresh(user)

    token = create_token(user.id, user.name)
    return LoginResponse(token=token, user=UserOut.model_validate(user))