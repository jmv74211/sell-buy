from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from app.database import get_db
from app import models, schemas, security

router = APIRouter(
    prefix="/api/inventory-view",
    tags=["inventory-view"],
)

@router.get("/available", response_model=list)
def get_available_inventory(
    current_user: models.User = Depends(security.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get available inventory items for sale (items with estimated_sale_price > 0
    and no actual_profit, meaning they haven't been sold yet)
    """

    # Get all estimations where:
    # 1. The purchase belongs to current user
    # 2. estimated_sale_price > 0
    # 3. actual_profit is NULL (not sold yet)
    # 4. sale_id is NULL (no sale associated)

    inventory_query = db.query(
        models.Purchase.article_name,
        models.Purchase.article_code,
        models.Estimation.estimated_sale_price,
        func.count(models.Purchase.id).label("quantity")
    ).join(
        models.Estimation,
        models.Estimation.purchase_id == models.Purchase.id
    ).filter(
        and_(
            models.Purchase.user_id == current_user.id,
            models.Estimation.estimated_sale_price > 0,
            models.Estimation.actual_profit == None,
            models.Estimation.sale_id == None
        )
    ).group_by(
        models.Purchase.article_name,
        models.Purchase.article_code,
        models.Estimation.estimated_sale_price
    ).all()

    # Convert to response format
    result = []
    for item in inventory_query:
        result.append({
            "article_name": item.article_name,
            "article_code": item.article_code,
            "quantity_available": item.quantity,
            "estimated_sale_price": float(item.estimated_sale_price) if item.estimated_sale_price else None
        })

    return result
