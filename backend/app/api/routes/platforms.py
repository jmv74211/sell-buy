from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app import models, schemas

router = APIRouter(
    prefix="/api/platforms",
    tags=["platforms"],
)

@router.get("/", response_model=List[schemas.PlatformResponse])
def get_platforms(db: Session = Depends(get_db)):
    platforms = db.query(models.Platform).all()
    return platforms

@router.post("/", response_model=schemas.PlatformResponse)
def create_platform(
    platform: schemas.PlatformCreate,
    db: Session = Depends(get_db)
):
    db_platform = models.Platform(**platform.dict())
    db.add(db_platform)
    db.commit()
    db.refresh(db_platform)
    return db_platform

@router.get("/{platform_id}", response_model=schemas.PlatformResponse)
def get_platform(platform_id: int, db: Session = Depends(get_db)):
    platform = db.query(models.Platform).filter(models.Platform.id == platform_id).first()
    if not platform:
        raise HTTPException(status_code=404, detail="Platform not found")
    return platform

@router.put("/{platform_id}", response_model=schemas.PlatformResponse)
def update_platform(
    platform_id: int,
    platform: schemas.PlatformCreate,
    db: Session = Depends(get_db)
):
    db_platform = db.query(models.Platform).filter(models.Platform.id == platform_id).first()
    if not db_platform:
        raise HTTPException(status_code=404, detail="Platform not found")
    
    for key, value in platform.dict().items():
        setattr(db_platform, key, value)
    db.commit()
    db.refresh(db_platform)
    return db_platform

@router.delete("/{platform_id}")
def delete_platform(platform_id: int, db: Session = Depends(get_db)):
    db_platform = db.query(models.Platform).filter(models.Platform.id == platform_id).first()
    if not db_platform:
        raise HTTPException(status_code=404, detail="Platform not found")
    
    db.delete(db_platform)
    db.commit()
    return {"detail": "Platform deleted"}
