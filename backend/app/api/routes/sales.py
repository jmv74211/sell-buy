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

    # Update or create estimation with sale_id
    estimation = db.query(models.Estimation).filter(
        models.Estimation.purchase_id == sale.purchase_id
    ).first()

    if estimation:
        # Update existing estimation with sale_id and actual_profit
        estimation.sale_id = db_sale.id
        estimation.actual_profit = db_sale.amount - purchase.amount
        db.commit()
        db.refresh(estimation)
    else:
        # Create new estimation with sale_id if it doesn't exist
        new_estimation = models.Estimation(
            purchase_id=sale.purchase_id,
            sale_id=db_sale.id,
            estimated_profit=db_sale.amount - purchase.amount,
            actual_profit=db_sale.amount - purchase.amount,
        )
        db.add(new_estimation)
        db.commit()

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

    old_purchase_id = db_sale.purchase_id

    for key, value in sale.dict().items():
        setattr(db_sale, key, value)
    db.commit()
    db.refresh(db_sale)

    # If purchase_id changed, update estimations
    if old_purchase_id != db_sale.purchase_id:
        # Clear sale_id and actual_profit from old estimation
        old_estimation = db.query(models.Estimation).filter(
            models.Estimation.purchase_id == old_purchase_id
        ).first()
        if old_estimation:
            old_estimation.sale_id = None
            old_estimation.actual_profit = None

        # Set sale_id and actual_profit in new estimation
        new_purchase = db.query(models.Purchase).filter(
            models.Purchase.id == db_sale.purchase_id
        ).first()
        new_estimation = db.query(models.Estimation).filter(
            models.Estimation.purchase_id == db_sale.purchase_id
        ).first()
        if new_estimation and new_purchase:
            new_estimation.sale_id = db_sale.id
            new_estimation.actual_profit = db_sale.amount - new_purchase.amount

        db.commit()
    else:
        # Same purchase_id: update actual_profit if sale amount changed
        estimation = db.query(models.Estimation).filter(
            models.Estimation.purchase_id == db_sale.purchase_id
        ).first()
        if estimation and estimation.sale_id == db_sale.id:
            same_purchase = db.query(models.Purchase).filter(
                models.Purchase.id == db_sale.purchase_id
            ).first()
            if same_purchase:
                estimation.actual_profit = db_sale.amount - same_purchase.amount
            db.commit()

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

    # Clear sale_id from estimation
    estimation = db.query(models.Estimation).filter(
        models.Estimation.sale_id == sale_id
    ).first()

    if estimation:
        estimation.sale_id = None
        estimation.actual_profit = None
        db.commit()

    db.delete(db_sale)
    db.commit()
    return {"detail": "Sale deleted"}
