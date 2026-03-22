from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from decimal import Decimal
from app.database import get_db
from app import models, security

router = APIRouter(
    prefix="/api/analytics",
    tags=["analytics"],
)

@router.get("/summary")
def get_summary(
    current_user: models.User = Depends(security.get_current_user),
    db: Session = Depends(get_db)
):
    """Get summary statistics for the user's purchases and sales"""

    # Total purchases
    total_purchases = db.query(func.sum(models.Purchase.amount)).filter(
        models.Purchase.user_id == current_user.id
    ).scalar() or Decimal(0)

    # Total sales
    total_sales = db.query(func.sum(models.Sale.amount)).join(
        models.Purchase
    ).filter(
        models.Purchase.user_id == current_user.id
    ).scalar() or Decimal(0)

    # Total profit
    total_profit = total_sales - total_purchases

    # Count purchases
    purchase_count = db.query(func.count(models.Purchase.id)).filter(
        models.Purchase.user_id == current_user.id
    ).scalar()

    # Count sales
    sale_count = db.query(func.count(models.Sale.id)).join(
        models.Purchase
    ).filter(
        models.Purchase.user_id == current_user.id
    ).scalar()

    return {
        "total_purchases": float(total_purchases),
        "total_sales": float(total_sales),
        "total_profit": float(total_profit),
        "profit_margin": float((total_profit / total_sales * 100) if total_sales > 0 else 0),
        "purchase_count": purchase_count,
        "sale_count": sale_count,
    }

@router.get("/monthly")
def get_monthly_analytics(
    current_user: models.User = Depends(security.get_current_user),
    db: Session = Depends(get_db)
):
    """Get monthly purchases and sales data"""

    purchases = db.query(
        func.date_trunc('month', models.Purchase.purchase_date).label('month'),
        func.sum(models.Purchase.amount).label('total')
    ).filter(
        models.Purchase.user_id == current_user.id
    ).group_by('month').all()

    sales = db.query(
        func.date_trunc('month', models.Sale.sale_date).label('month'),
        func.sum(models.Sale.amount).label('total')
    ).join(
        models.Purchase
    ).filter(
        models.Purchase.user_id == current_user.id
    ).group_by('month').all()

    return {
        "purchases": [{"month": str(p[0]), "amount": float(p[1])} for p in purchases if p[0]],
        "sales": [{"month": str(s[0]), "amount": float(s[1])} for s in sales if s[0]],
    }

@router.get("/profit-by-article")
def get_profit_by_article(
    current_user: models.User = Depends(security.get_current_user),
    db: Session = Depends(get_db)
):
    """Get profit analysis by article/purchase"""

    purchases = db.query(
        models.Purchase.article_name,
        func.sum(models.Purchase.amount).label('total_purchases'),
        func.coalesce(func.sum(models.Sale.amount), Decimal(0)).label('total_sales')
    ).outerjoin(
        models.Sale
    ).filter(
        models.Purchase.user_id == current_user.id
    ).group_by(
        models.Purchase.article_name
    ).all()

    result = []
    for article_name, purchase_amount, sale_amount in purchases:
        purchases_total = purchase_amount or Decimal(0)
        sales_total = sale_amount or Decimal(0)
        profit = sales_total - purchases_total

        result.append({
            "article_name": article_name,
            "cost": float(purchases_total),
            "revenue": float(sales_total),
            "profit": float(profit),
            "margin": float((profit / sales_total * 100) if sales_total > 0 else 0)
        })

    return result
