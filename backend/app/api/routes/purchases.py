from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app import models, schemas, security

router = APIRouter(
    prefix="/api/purchases",
    tags=["purchases"],
)

@router.get("/", response_model=List[schemas.PurchaseResponse])
def get_purchases(
    current_user: models.User = Depends(security.get_current_user),
    db: Session = Depends(get_db)
):
    purchases = db.query(models.Purchase).filter(
        models.Purchase.user_id == current_user.id
    ).all()
    return purchases

@router.post("/", response_model=schemas.PurchaseResponse)
def create_purchase(
    purchase: schemas.PurchaseCreate,
    current_user: models.User = Depends(security.get_current_user),
    db: Session = Depends(get_db)
):
    db_purchase = models.Purchase(
        **purchase.dict(),
        user_id=current_user.id
    )
    db.add(db_purchase)
    db.commit()
    db.refresh(db_purchase)
    return db_purchase

@router.get("/{purchase_id}", response_model=schemas.PurchaseResponse)
def get_purchase(
    purchase_id: int,
    current_user: models.User = Depends(security.get_current_user),
    db: Session = Depends(get_db)
):
    purchase = db.query(models.Purchase).filter(
        (models.Purchase.id == purchase_id) & (models.Purchase.user_id == current_user.id)
    ).first()
    if not purchase:
        raise HTTPException(status_code=404, detail="Purchase not found")
    return purchase

@router.put("/{purchase_id}", response_model=schemas.PurchaseResponse)
def update_purchase(
    purchase_id: int,
    purchase: schemas.PurchaseCreate,
    current_user: models.User = Depends(security.get_current_user),
    db: Session = Depends(get_db)
):
    db_purchase = db.query(models.Purchase).filter(
        (models.Purchase.id == purchase_id) & (models.Purchase.user_id == current_user.id)
    ).first()
    if not db_purchase:
        raise HTTPException(status_code=404, detail="Purchase not found")

    for key, value in purchase.dict().items():
        setattr(db_purchase, key, value)
    db.commit()
    db.refresh(db_purchase)
    return db_purchase

@router.delete("/{purchase_id}")
def delete_purchase(
    purchase_id: int,
    current_user: models.User = Depends(security.get_current_user),
    db: Session = Depends(get_db)
):
    db_purchase = db.query(models.Purchase).filter(
        (models.Purchase.id == purchase_id) & (models.Purchase.user_id == current_user.id)
    ).first()
    if not db_purchase:
        raise HTTPException(status_code=404, detail="Purchase not found")

    db.delete(db_purchase)
    db.commit()
    return {"detail": "Purchase deleted"}
