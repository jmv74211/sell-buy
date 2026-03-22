from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app import models, schemas, security

router = APIRouter(
    prefix="/api/sales",
    tags=["sales"],
)

@router.get("/", response_model=List[schemas.SaleResponse])
def get_sales(
    current_user: models.User = Depends(security.get_current_user),
    db: Session = Depends(get_db)
):
    sales = db.query(models.Sale).join(models.Purchase).filter(
        models.Purchase.user_id == current_user.id
    ).all()
    return sales

@router.post("/", response_model=schemas.SaleResponse)
def create_sale(
    sale: schemas.SaleCreate,
    current_user: models.User = Depends(security.get_current_user),
    db: Session = Depends(get_db)
):
    # Verify purchase belongs to user
    purchase = db.query(models.Purchase).filter(
        (models.Purchase.id == sale.purchase_id) & (models.Purchase.user_id == current_user.id)
    ).first()

    if not purchase:
        raise HTTPException(status_code=404, detail="Purchase not found")

    db_sale = models.Sale(**sale.dict())
    db.add(db_sale)
    db.commit()
    db.refresh(db_sale)
    return db_sale

@router.get("/{sale_id}", response_model=schemas.SaleResponse)
def get_sale(
    sale_id: int,
    current_user: models.User = Depends(security.get_current_user),
    db: Session = Depends(get_db)
):
    sale = db.query(models.Sale).join(models.Purchase).filter(
        (models.Sale.id == sale_id) & (models.Purchase.user_id == current_user.id)
    ).first()
    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")
    return sale

@router.put("/{sale_id}", response_model=schemas.SaleResponse)
def update_sale(
    sale_id: int,
    sale: schemas.SaleCreate,
    current_user: models.User = Depends(security.get_current_user),
    db: Session = Depends(get_db)
):
    db_sale = db.query(models.Sale).join(models.Purchase).filter(
        (models.Sale.id == sale_id) & (models.Purchase.user_id == current_user.id)
    ).first()
    if not db_sale:
        raise HTTPException(status_code=404, detail="Sale not found")

    for key, value in sale.dict().items():
        setattr(db_sale, key, value)
    db.commit()
    db.refresh(db_sale)
    return db_sale

@router.delete("/{sale_id}")
def delete_sale(
    sale_id: int,
    current_user: models.User = Depends(security.get_current_user),
    db: Session = Depends(get_db)
):
    db_sale = db.query(models.Sale).join(models.Purchase).filter(
        (models.Sale.id == sale_id) & (models.Purchase.user_id == current_user.id)
    ).first()
    if not db_sale:
        raise HTTPException(status_code=404, detail="Sale not found")

    db.delete(db_sale)
    db.commit()
    return {"detail": "Sale deleted"}
