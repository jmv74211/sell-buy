from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import get_db
from app import models, security
import csv
import io
from decimal import Decimal, InvalidOperation
from datetime import datetime

router = APIRouter(
    prefix="/api/import",
    tags=["import"],
)


def _parse_decimal(value_str: str) -> Decimal:
    if not value_str or value_str.strip() == '':
        return Decimal('0.00')
    value_str = value_str.strip().replace(',', '.').replace('€', '').strip()
    try:
        return Decimal(value_str)
    except (InvalidOperation, ValueError):
        return Decimal('0.00')


def _parse_date(date_str: str) -> datetime:
    if not date_str:
        return datetime(2026, 1, 1)
    s = date_str.strip()
    # Treat Excel numeric zeros or empty-like values as missing
    if not s or s in ('0', '0.0', '-', 'N/A', 'n/a'):
        return datetime(2026, 1, 1)
    for fmt in ("%d-%m-%Y", "%d/%m/%Y", "%Y-%m-%d", "%d-%m-%y", "%d/%m/%y"):
        try:
            return datetime.strptime(s, fmt)
        except ValueError:
            continue
    return datetime(2026, 1, 1)


@router.post("/csv")
def import_csv(
    file: UploadFile = File(...),
    current_user: models.User = Depends(security.get_current_user),
    db: Session = Depends(get_db),
):
    if not file.filename or not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="El archivo debe ser un CSV")

    content = file.file.read().decode('utf-8-sig')
    lines = content.splitlines()

    # Detect where the actual header row is (skip summary rows at the top)
    # The header row contains 'ARTÍCULO' or 'ARTICULO'
    header_idx = None
    for i, line in enumerate(lines):
        if 'ARTÍCULO' in line or 'ARTICULO' in line:
            header_idx = i
            break

    if header_idx is None:
        raise HTTPException(status_code=400, detail="No se encontró la cabecera del CSV (columna ARTÍCULO)")

    csv_body = '\n'.join(lines[header_idx:])
    sample = csv_body[:2048]
    try:
        dialect = csv.Sniffer().sniff(sample, delimiters=',;\t')
    except csv.Error:
        dialect = csv.excel

    reader = csv.DictReader(io.StringIO(csv_body), dialect=dialect)

    # Clear existing data for this user only
    db.execute(text(
        "DELETE FROM estimations WHERE purchase_id IN "
        "(SELECT id FROM purchases WHERE user_id = :uid)"
    ), {"uid": current_user.id})
    db.execute(text(
        "DELETE FROM sales WHERE purchase_id IN "
        "(SELECT id FROM purchases WHERE user_id = :uid)"
    ), {"uid": current_user.id})
    db.execute(text("DELETE FROM purchases WHERE user_id = :uid"), {"uid": current_user.id})
    db.commit()

    purchases_created = 0
    sales_created = 0
    estimations_created = 0
    errors = []

    for idx, row in enumerate(reader, 1):
        article_name = (row.get('ARTÍCULO') or row.get('ARTICULO') or '').strip()
        if not article_name:
            continue

        try:
            purchase_price = _parse_decimal(row.get('PRECIO COMPRA', '0'))
            estimation_price = _parse_decimal(row.get('ESTIMACIÓN VENTA', '0'))
            estimated_profit_val = _parse_decimal(row.get('GANANCIA ESTIMADA', '0'))
            sale_price = _parse_decimal(row.get('REVENDIDO POR', '0'))
            actual_profit_val = _parse_decimal(row.get('GANANCIA NETA', '0'))
            fecha_raw = (row.get('FECHA COMPRA') or row.get('FECHA') or '').strip()
            purchase_date = _parse_date(fecha_raw)
            sale_date_raw = (row.get('FECHA VENTA') or '').strip()
            sale_date = _parse_date(sale_date_raw) if sale_date_raw else purchase_date

            purchase = models.Purchase(
                user_id=current_user.id,
                article_name=article_name,
                purchase_date=purchase_date,
                amount=purchase_price,
                platform_id=None,
            )
            db.add(purchase)
            db.flush()
            purchases_created += 1

            sale = None
            if sale_price > 0:
                sale = models.Sale(
                    purchase_id=purchase.id,
                    sale_date=sale_date,
                    amount=sale_price,
                )
                db.add(sale)
                db.flush()
                sales_created += 1

            estimation = models.Estimation(
                purchase_id=purchase.id,
                sale_id=sale.id if sale else None,
                estimated_profit=estimated_profit_val,
                estimated_sale_price=estimation_price if estimation_price > 0 else None,
                actual_profit=actual_profit_val if actual_profit_val != 0 else None,
            )
            db.add(estimation)
            estimations_created += 1

        except Exception as e:
            errors.append(f"Fila {idx}: {str(e)}")

    db.commit()

    return {
        "purchases": purchases_created,
        "sales": sales_created,
        "estimations": estimations_created,
        "errors": errors,
    }
