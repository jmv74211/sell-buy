from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app import models, schemas, security

router = APIRouter(
    prefix="/api/estimations",
    tags=["estimations"],
)

@router.get("/", response_model=List[schemas.EstimationResponse])
def get_estimations(
    current_user: models.User = Depends(security.get_current_user),
    db: Session = Depends(get_db)
):
    estimations = db.query(models.Estimation).join(
        models.Purchase
    ).filter(
        models.Purchase.user_id == current_user.id
    ).all()
    return estimations

@router.post("/", response_model=schemas.EstimationResponse)
def create_estimation(
    estimation: schemas.EstimationCreate,
    current_user: models.User = Depends(security.get_current_user),
    db: Session = Depends(get_db)
):
    # Verify purchase belongs to user
    purchase = db.query(models.Purchase).filter(
        (models.Purchase.id == estimation.purchase_id) & (models.Purchase.user_id == current_user.id)
    ).first()

    if not purchase:
        raise HTTPException(status_code=404, detail="Purchase not found")

    # Check if sale_id is provided and belongs to user (via purchase)
    if estimation.sale_id:
        sale = db.query(models.Sale).join(models.Purchase).filter(
            (models.Sale.id == estimation.sale_id) & (models.Purchase.user_id == current_user.id)
        ).first()

        if not sale:
            raise HTTPException(status_code=404, detail="Sale not found")

    db_estimation = models.Estimation(**estimation.dict())
    db.add(db_estimation)
    db.commit()
    db.refresh(db_estimation)
    return db_estimation

@router.get("/{estimation_id}", response_model=schemas.EstimationResponse)
def get_estimation(
    estimation_id: int,
    current_user: models.User = Depends(security.get_current_user),
    db: Session = Depends(get_db)
):
    estimation = db.query(models.Estimation).join(
        models.Purchase
    ).filter(
        (models.Estimation.id == estimation_id) & (models.Purchase.user_id == current_user.id)
    ).first()
    if not estimation:
        raise HTTPException(status_code=404, detail="Estimation not found")
    return estimation

@router.put("/{estimation_id}", response_model=schemas.EstimationResponse)
def update_estimation(
    estimation_id: int,
    estimation: schemas.EstimationCreate,
    current_user: models.User = Depends(security.get_current_user),
    db: Session = Depends(get_db)
):
    db_estimation = db.query(models.Estimation).join(
        models.Purchase
    ).filter(
        (models.Estimation.id == estimation_id) & (models.Purchase.user_id == current_user.id)
    ).first()
    if not db_estimation:
        raise HTTPException(status_code=404, detail="Estimation not found")

    for key, value in estimation.dict().items():
        setattr(db_estimation, key, value)
    db.commit()
    db.refresh(db_estimation)
    return db_estimation

@router.delete("/{estimation_id}")
def delete_estimation(
    estimation_id: int,
    current_user: models.User = Depends(security.get_current_user),
    db: Session = Depends(get_db)
):
    db_estimation = db.query(models.Estimation).join(
        models.Purchase
    ).filter(
        (models.Estimation.id == estimation_id) & (models.Purchase.user_id == current_user.id)
    ).first()
    if not db_estimation:
        raise HTTPException(status_code=404, detail="Estimation not found")

    db.delete(db_estimation)
    db.commit()
    return {"detail": "Estimation deleted"}
