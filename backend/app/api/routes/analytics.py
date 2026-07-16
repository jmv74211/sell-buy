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

@router.get("/dashboard-stats")
def get_dashboard_stats(
    current_user: models.User = Depends(security.get_current_user),
    db: Session = Depends(get_db)
):
    """Get comprehensive dashboard statistics matching the CSV summary format"""

    # Get all data
    purchases = db.query(models.Purchase).filter(
        models.Purchase.user_id == current_user.id
    ).all()

    sales = db.query(models.Sale).join(
        models.Purchase
    ).filter(
        models.Purchase.user_id == current_user.id
    ).all()

    estimations = db.query(models.Estimation).join(
        models.Purchase
    ).filter(
        models.Purchase.user_id == current_user.id
    ).all()

    # Create dictionaries for easy lookup
    sales_by_purchase = {s.purchase_id: s for s in sales}
    estimations_by_purchase = {e.purchase_id: e for e in estimations}
    purchases_by_id = {p.id: p for p in purchases}

    # TOTAL GASTADO = SUM(PRECIO COMPRA)
    total_spent = sum(Decimal(str(p.amount)) for p in purchases)

    # DINERO RECUPERADO = SUM(REVENDIDO POR)
    money_recovered = sum(Decimal(str(s.amount)) for s in sales)

    # DISTRIBUCIÓN DE ARTÍCULOS
    sold_count = len(sales)
    # Pendientes de vender = sin venta Y con estimación de precio > 0
    pending_count = sum(
        1 for p in purchases
        if p.id not in sales_by_purchase
        and p.id in estimations_by_purchase
        and estimations_by_purchase[p.id].estimated_sale_price
        and Decimal(str(estimations_by_purchase[p.id].estimated_sale_price)) > 0
    )
    # Conservado = sin venta Y sin estimación de precio (o estimación = 0)
    conservado_count = len(purchases) - sold_count - pending_count

    # VENTAS PENDIENTES = SUM(ESTIMACIÓN VENTA where no sale AND estimation > 0)
    pending_sales = Decimal(0)
    for p in purchases:
        if p.id not in sales_by_purchase and p.id in estimations_by_purchase:
            est = estimations_by_purchase[p.id]
            if est.estimated_sale_price and Decimal(str(est.estimated_sale_price)) > 0:
                pending_sales += Decimal(str(est.estimated_sale_price))

    # RECUPERACIÓN TOTAL PREVISTA = money_recovered + pending_sales
    total_expected_recovery = money_recovered + pending_sales

    # SALDO = RECUPERACIÓN TOTAL PREVISTA - TOTAL GASTADO
    balance = total_expected_recovery - total_spent

    # BENEFICIO REALIZADO = SUM(REVENDIDO POR - PRECIO COMPRA) for sold items
    realized_profit = Decimal(0)
    for s in sales:
        p = purchases_by_id.get(s.purchase_id)
        if p:
            realized_profit += Decimal(str(s.amount)) - Decimal(str(p.amount))

    # BENEFICIO PENDIENTE = SUM(GANANCIA ESTIMADA) for pending items
    # Uses stored estimated_profit (= GANANCIA ESTIMADA from CSV) to match the CSV
    # rather than recalculating estimated_sale_price - p.amount, which may differ
    # if purchase prices were updated after the estimation was created.
    pending_profit = Decimal(0)
    for p in purchases:
        if p.id not in sales_by_purchase and p.id in estimations_by_purchase:
            est = estimations_by_purchase[p.id]
            if est.estimated_sale_price and Decimal(str(est.estimated_sale_price)) > 0:
                pending_profit += Decimal(str(est.estimated_profit))

    # BENEFICIO TOTAL = BENEFICIO REALIZADO + BENEFICIO PENDIENTE
    total_profit = realized_profit + pending_profit

    # BENEFICIO MEDIO/VENTA
    avg_profit_per_sale = (realized_profit / sold_count) if sold_count > 0 else Decimal(0)

    # RECUPERACIÓN (%) = RECUPERACIÓN TOTAL PREVISTA / TOTAL GASTADO * 100
    # NOT money_recovered alone — the CSV formula uses total expected recovery
    recovery_pct = (total_expected_recovery / total_spent * 100) if total_spent > 0 else Decimal(0)

    # RENTABILIDAD (ROI) = BENEFICIO TOTAL / TOTAL GASTADO * 100
    roi = (total_profit / total_spent * 100) if total_spent > 0 else Decimal(0)

    # CAPITAL INMOVILIZADO = SUM(PRECIO COMPRA) for conservado items only (no sale, no estimation > 0)
    capital_immobilized = sum(
        Decimal(str(p.amount)) for p in purchases
        if p.id not in sales_by_purchase
        and (
            p.id not in estimations_by_purchase
            or not estimations_by_purchase[p.id].estimated_sale_price
            or Decimal(str(estimations_by_purchase[p.id].estimated_sale_price)) == 0
        )
    )

    # COSTE HACIENDA ACTUAL = BENEFICIO REALIZADO * 20%
    cost_hacienda_current = realized_profit * Decimal('0.20')

    # COSTE HACIENDA TOTAL = BENEFICIO TOTAL * 20%
    cost_hacienda_total = total_profit * Decimal('0.20')

    return {
        "investment": {
            "total_spent": float(total_spent),
            "capital_immobilized": float(capital_immobilized),
            "cost_hacienda_current": float(cost_hacienda_current),
            "cost_hacienda_total": float(cost_hacienda_total),
        },
        "recovery": {
            "money_recovered": float(money_recovered),
            "pending_sales": float(pending_sales),
            "total_expected_recovery": float(total_expected_recovery),
            "balance": float(balance),
        },
        "profitability": {
            "realized_profit": float(realized_profit),
            "pending_profit": float(pending_profit),
            "total_profit": float(total_profit),
            "avg_profit_per_sale": float(avg_profit_per_sale),
        },
        "percentages": {
            "recovery_pct": float(recovery_pct),
            "roi": float(roi),
        },
        "counts": {
            "total_purchases": len(purchases),
            "sold_count": sold_count,
            "pending_count": pending_count,
            "conservado_count": conservado_count,
        }
    }
