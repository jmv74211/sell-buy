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
    print(f"[IMPORT] Starting import for user: {current_user.id} ({current_user.user_name})")

    if not file.filename or not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="El archivo debe ser un CSV")

    content = file.file.read().decode('utf-8-sig')
    lines = content.splitlines()
    print(f"[IMPORT] CSV lines read: {len(lines)}")

    # Detect where the actual header row is (skip summary rows at the top)
    # The header row must contain both 'ARTÍCULO' and 'PRECIO COMPRA' (or their variants)
    header_idx = None
    for i, line in enumerate(lines):
        line_upper = line.upper()
        has_articulo = 'ARTÍCULO' in line or 'ARTICULO' in line
        has_precio = 'PRECIO COMPRA' in line or 'PRECIO' in line
        # Must have both markers to be the real header
        if has_articulo and has_precio:
            header_idx = i
            break

    if header_idx is None:
        raise HTTPException(status_code=400, detail="No se encontró la cabecera del CSV (debe contener ARTÍCULO y PRECIO COMPRA)")

    print(f"[IMPORT] Header found at index: {header_idx}")

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

            # Parse article code from COD_ART column (optional)
            article_code = None
            cod_art_str = (row.get('COD_ART') or '').strip()
            if cod_art_str and cod_art_str.isdigit():
                try:
                    article_code = int(cod_art_str)
                    # Try to verify the article exists (but don't fail if it doesn't)
                    try:
                        article = db.query(models.Article).filter(
                            models.Article.article_code == article_code
                        ).first()
                        if not article:
                            article_code = None
                    except:
                        # If query fails, just set to None
                        article_code = None
                except ValueError:
                    article_code = None

            purchase = models.Purchase(
                user_id=current_user.id,
                article_name=article_name,
                article_code=article_code,
                purchase_date=purchase_date,
                amount=purchase_price,
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
            error_msg = f"Fila {idx}: {str(e)}"
            errors.append(error_msg)
            if idx <= 3:  # Log first 3 errors
                print(f"[IMPORT] Error en fila {idx}: {str(e)}")
                print(f"[IMPORT] Row data: {row}")

    db.commit()

    print(f"[IMPORT] Import completed: {purchases_created} purchases, {sales_created} sales, {estimations_created} estimations, {len(errors)} errors")
    if errors:
        print(f"[IMPORT] First error: {errors[0]}")

    return {
        "purchases": purchases_created,
        "sales": sales_created,
        "estimations": estimations_created,
        "errors": errors,
    }
