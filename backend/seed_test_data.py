#!/usr/bin/env python3
"""
Genera datos de prueba para el usuario 'test' (id=2).
Borra los datos previos de ese usuario antes de insertar.
"""
from decimal import Decimal
from datetime import datetime
from sqlalchemy import text
from app.database import SessionLocal
from app import models

TEST_USER_ID = 2

PURCHASES = [
    # (article_name, purchase_date, amount, estimated_sale_price, estimated_profit,
    #  sale_amount, actual_profit, sale_date)  ← None = sin vender
    ("The Last of Us Part II PS4",        "2026-01-10",  8.00,  25.00, 17.00,  22.00,  14.00, "2026-01-20"),
    ("God of War PS4",                    "2026-01-12",  5.00,  18.00, 13.00,  16.00,  11.00, "2026-02-01"),
    ("Red Dead Redemption 2 PS4",         "2026-01-15", 12.00,  30.00, 18.00,  28.00,  16.00, "2026-02-10"),
    ("Spider-Man PS4",                    "2026-01-18",  6.00,  20.00, 14.00,  None,   None,  None),
    ("Horizon Zero Dawn PS4",             "2026-01-20",  4.00,  15.00, 11.00,  13.00,   9.00, "2026-02-15"),
    ("FIFA 23 PS5",                       "2026-01-22",  7.00,  14.00,  7.00,  None,   None,  None),
    ("Elden Ring PS5",                    "2026-01-25", 20.00,  40.00, 20.00,  38.00,  18.00, "2026-02-20"),
    ("Gran Turismo 7 PS5",               "2026-01-28", 15.00,  28.00, 13.00,  26.00,  11.00, "2026-03-01"),
    ("Demon's Souls PS5",                "2026-02-02", 18.00,  35.00, 17.00,  None,   None,  None),
    ("Returnal PS5",                      "2026-02-05", 16.00,  32.00, 16.00,  None,   None,  None),
    ("Assassin's Creed Odyssey PS4",      "2026-02-08",  5.00,  12.00,  7.00,  10.00,   5.00, "2026-02-25"),
    ("Ghost of Tsushima PS4",             "2026-02-10",  9.00,  22.00, 13.00,  20.00,  11.00, "2026-03-05"),
    ("Death Stranding PS4",               "2026-02-12",  6.00,  15.00,  9.00,  None,   None,  None),
    ("Uncharted 4 PS4",                   "2026-02-14",  4.00,  12.00,  8.00,  11.00,   7.00, "2026-03-10"),
    ("Batman Arkham Knight PS4",          "2026-02-16",  3.00,  10.00,  7.00,  None,   None,  None),
    ("Need for Speed Heat PS4",           "2026-02-18",  5.00,  11.00,  6.00,   9.00,   4.00, "2026-03-12"),
    ("Days Gone PS4",                     "2026-02-20",  7.00,  18.00, 11.00,  None,   None,  None),
    ("Control PS4",                       "2026-02-22",  5.00,  13.00,  8.00,  12.00,   7.00, "2026-03-15"),
    ("Sekiro PS4",                        "2026-02-24", 14.00,  28.00, 14.00,  25.00,  11.00, "2026-03-20"),
    ("Cyberpunk 2077 PS5",               "2026-02-26", 10.00,  22.00, 12.00,  None,   None,  None),
]


def main():
    db = SessionLocal()
    try:
        print("🔄 Borrando datos previos del usuario test...")
        db.execute(text(
            "DELETE FROM estimations WHERE purchase_id IN "
            "(SELECT id FROM purchases WHERE user_id = :uid)"
        ), {"uid": TEST_USER_ID})
        db.execute(text(
            "DELETE FROM sales WHERE purchase_id IN "
            "(SELECT id FROM purchases WHERE user_id = :uid)"
        ), {"uid": TEST_USER_ID})
        db.execute(text("DELETE FROM purchases WHERE user_id = :uid"), {"uid": TEST_USER_ID})
        db.commit()
        print("✅ Datos previos eliminados")

        purchases_created = sales_created = estimations_created = 0

        for row in PURCHASES:
            (article, p_date_s, p_amount, est_price, est_profit,
             s_amount, act_profit, s_date_s) = row

            purchase = models.Purchase(
                user_id=TEST_USER_ID,
                article_name=article,
                purchase_date=datetime.strptime(p_date_s, "%Y-%m-%d"),
                amount=Decimal(str(p_amount)),
                platform_id=None,
            )
            db.add(purchase)
            db.flush()
            purchases_created += 1

            sale = None
            if s_amount is not None:
                sale = models.Sale(
                    purchase_id=purchase.id,
                    sale_date=datetime.strptime(s_date_s, "%Y-%m-%d"),
                    amount=Decimal(str(s_amount)),
                )
                db.add(sale)
                db.flush()
                sales_created += 1

            estimation = models.Estimation(
                purchase_id=purchase.id,
                sale_id=sale.id if sale else None,
                estimated_profit=Decimal(str(est_profit)),
                estimated_sale_price=Decimal(str(est_price)) if est_price else None,
                actual_profit=Decimal(str(act_profit)) if act_profit is not None else None,
            )
            db.add(estimation)
            estimations_created += 1

        db.commit()
        print(f"✅ Seed completado: {purchases_created} compras, {sales_created} ventas, {estimations_created} estimaciones")

    except Exception as e:
        db.rollback()
        print(f"❌ Error: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
