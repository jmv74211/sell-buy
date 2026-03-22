from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas, security

router = APIRouter(
    prefix="/api/users",
    tags=["users"],
)

@router.get("/profile", response_model=schemas.UserResponse)
def get_profile(current_user: models.User = Depends(security.get_current_user), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == current_user.id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.put("/profile", response_model=schemas.UserResponse)
def update_profile(
    user_data: schemas.UserBase,
    current_user: models.User = Depends(security.get_current_user),
    db: Session = Depends(get_db)
):
    user = db.query(models.User).filter(models.User.id == current_user.id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.name = user_data.name
    user.email = user_data.email
    db.commit()
    db.refresh(user)
    return user

@router.delete("/account")
def delete_account(
    current_user: models.User = Depends(security.get_current_user),
    db: Session = Depends(get_db)
):
    user = db.query(models.User).filter(models.User.id == current_user.id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.active = False
    db.commit()
    return {"detail": "Account deactivated"}
