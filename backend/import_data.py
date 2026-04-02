#!/usr/bin/env python3
"""
Script para importar datos desde un CSV a la base de datos
"""
import csv
from decimal import Decimal
from datetime import datetime
from sqlalchemy.orm import Session
from app.database import engine, SessionLocal
from app import models
from sqlalchemy import text

def reset_database(db: Session):
    """Elimina todos los datos de Purchase, Sale y Estimation"""
    print("🔄 Limpiando base de datos...")

    # Desactivar temporalmente las restricciones de claves foráneas
    # (En PostgreSQL no es necesario, se usa CASCADE)

    # Eliminar en orden inverso a las dependencias
    db.execute(text("DELETE FROM estimations"))
    db.execute(text("DELETE FROM sales"))
    db.execute(text("DELETE FROM purchases"))
    db.commit()

    print("✅ Base de datos limpiada")

def parse_decimal(value_str):
    """Convierte string a Decimal, manejando comas y espacios"""
    if not value_str or value_str.strip() == '':
        return Decimal('0.00')

    # Reemplazar coma por punto
    value_str = value_str.strip().replace(',', '.')
    # Remover símbolo € si existe
    value_str = value_str.replace('€', '').strip()

    try:
        return Decimal(value_str)
    except:
        return Decimal('0.00')

def parse_date(date_str):
    """Convierte string de fecha en formato DD-MM-YYYY a datetime"""
    if not date_str or date_str.strip() == '':
        return datetime(2026, 1, 1)

    try:
        # Intentar formato DD-MM-YYYY
        return datetime.strptime(date_str.strip(), "%d-%m-%Y")
    except:
        try:
            # Intentar formato YYYY-MM-DD
            return datetime.strptime(date_str.strip(), "%Y-%m-%d")
        except:
            return datetime(2026, 1, 1)

def import_csv_data(db: Session, csv_path: str):
    """Importa datos desde un archivo CSV"""
    print(f"📂 Abriendo archivo: {csv_path}")

    # Obtener el primer usuario (el admin/owner de los datos)
    user = db.query(models.User).first()
    if not user:
        print("❌ Error: No existe ningún usuario en la base de datos")
        return

    print(f"👤 Usando usuario: {user.user_name}")

    # Contador de importaciones
    purchases_created = 0
    sales_created = 0
    estimations_created = 0

    with open(csv_path, 'r', encoding='utf-8') as file:
        # Detectar el delimitador
        sample = file.read(2048)
        file.seek(0)

        dialect = csv.Sniffer().sniff(sample, delimiters=',;\t')

        # Saltar las primeras 7 filas de resumen/totales antes de la cabecera
        for _ in range(7):
            file.readline()

        reader = csv.DictReader(file, dialect=dialect)

        # Procesar cada fila
        for idx, row in enumerate(reader, 1):
            try:
                # Extraer datos del CSV con variaciones de nombres de columna
                article_name = row.get('ARTÍCULO') or row.get('ARTICULO', '').strip()
                if not article_name:
                    print(f"⚠️  Fila {idx}: Artículo vacío, saltando...")
                    continue

                purchase_price = parse_decimal(row.get('PRECIO COMPRA', '0'))
                estimation_price = parse_decimal(row.get('ESTIMACIÓN VENTA', '0'))
                estimated_profit_val = parse_decimal(row.get('GANANCIA ESTIMADA', '0'))
                sale_price = parse_decimal(row.get('REVENDIDO POR', '0'))
                actual_profit_val = parse_decimal(row.get('GANANCIA NETA', '0'))
                purchase_date = parse_date(row.get('FECHA', ''))

                # Crear Purchase
                purchase = models.Purchase(
                    user_id=user.id,
                    article_name=article_name,
                    purchase_date=purchase_date,
                    amount=purchase_price,
                    item_condition=7,  # Valor por defecto
                    platform_id=None
                )
                db.add(purchase)
                db.flush()  # Para obtener el ID
                purchases_created += 1

                # Crear Sale si hay precio de venta
                sale = None
                if sale_price > 0:
                    sale_date = purchase_date  # Usar misma fecha como fallback
                    sale = models.Sale(
                        purchase_id=purchase.id,
                        sale_date=sale_date,
                        amount=sale_price
                    )
                    db.add(sale)
                    db.flush()
                    sales_created += 1

                # Crear Estimation
                # El estimated_profit usa SIEMPRE la columna GANANCIA ESTIMADA del CSV
                estimated_profit_to_use = estimated_profit_val

                estimation = models.Estimation(
                    purchase_id=purchase.id,
                    sale_id=sale.id if sale else None,
                    estimated_profit=estimated_profit_to_use,
                    estimated_sale_price=estimation_price if estimation_price > 0 else None,
                    actual_profit=actual_profit_val if actual_profit_val != 0 else None
                )
                db.add(estimation)
                estimations_created += 1

                if idx % 10 == 0:
                    print(f"  ✓ {idx} artículos procesados...")

            except Exception as e:
                print(f"❌ Error en fila {idx}: {str(e)}")
                db.rollback()
                raise

        # Confirmar cambios
        db.commit()
        print(f"\n✨ Importación completada:")
        print(f"   📦 {purchases_created} compras creadas")
        print(f"   💰 {sales_created} ventas creadas")
        print(f"   📊 {estimations_created} estimaciones creadas")

def main():
    """Función principal"""
    import sys
    import os

    # CSV por defecto en el directorio raíz
    csv_path = "Videojuegos - Compras_Ventas.csv"

    if len(sys.argv) > 1:
        csv_path = sys.argv[1]

    # Verificar que el archivo existe
    if not os.path.exists(csv_path):
        print(f"❌ Archivo no encontrado: {csv_path}")
        print(f"   Buscando en: {os.path.abspath(csv_path)}")
        sys.exit(1)

    print("=" * 60)
    print("📥 IMPORTADOR DE DATOS - SellBuy")
    print("=" * 60)

    db = SessionLocal()
    try:
        # Reset de datos
        reset_database(db)

        # Importar datos
        import_csv_data(db, csv_path)

        print("\n" + "=" * 60)
        print("✅ Proceso completado exitosamente!")
        print("=" * 60)
    except Exception as e:
        print(f"\n❌ Error durante la importación: {str(e)}")
        db.rollback()
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    main()
