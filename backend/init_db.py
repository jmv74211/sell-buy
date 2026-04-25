"""
Database initialization script
Runs on application startup to ensure all tables and seed data exist
"""
import sys
sys.path.insert(0, '/home/jmv74211/projects/sell-buy/backend')

from sqlalchemy.orm import Session
from app.database import SessionLocal, engine
from app import models

# Platform ranges data
PLATFORM_RANGES = [
    {"platform_name": "Playstation 1", "code_range": 1000},
    {"platform_name": "Playstation 2", "code_range": 2000},
    {"platform_name": "Playstation 3", "code_range": 3000},
    {"platform_name": "Playstation 4", "code_range": 4000},
    {"platform_name": "Playstation 5", "code_range": 5000},
    {"platform_name": "Playstation 6", "code_range": 6000},
    {"platform_name": "Nintendo Switch", "code_range": 7000},
    {"platform_name": "Nintendo Switch 2", "code_range": 8000},
    {"platform_name": "Nintendo DS", "code_range": 9000},
    {"platform_name": "Game Boy Advance", "code_range": 10000},
    {"platform_name": "Game Boy", "code_range": 11000},
    {"platform_name": "PSP", "code_range": 12000},
    {"platform_name": "PC", "code_range": 13000},
]

# Articles data (simplified - only most used)
ARTICLES = [
    (1000, "Harry Potter Y La Piedra Filosofal", 1000),
    (1001, "Harry Potter Y La Cámara Secreta", 1000),
    (2000, "Need For Speed Hot Pursuit", 2000),
    (2001, "Need For Speed Underground 1", 2000),
    (3022, "GTA 5", 3000),
    (4003, "Need For Speed Heat", 4000),
    (5000, "Metal Gear Solid Collection", 5000),
    (5006, "GTA V ps5", 5000),
    (5009, "God Of War Ragnarok", 5000),
    (7000, "Pokemon Lets Go Pikachu", 7000),
    (7009, "Pokemon Leyendas ZA", 7000),
    (9001, "Pokemon Pearl", 9000),
    (12001, "GTA Liberty City Stories", 12000),
    (13001, "Harry Potter", 13000),
]


def init_database():
    """Initialize database with tables and seed data"""
    try:
        # Create all tables
        print("🔧 Creating database tables...")
        models.Base.metadata.create_all(bind=engine)
        print("✅ Tables created successfully")

        db = SessionLocal()

        # Check if platforms exist
        platform_count = db.query(models.PlatformRange).count()
        if platform_count == 0:
            print("📦 Populating platform ranges...")
            for platform_data in PLATFORM_RANGES:
                platform = models.PlatformRange(**platform_data)
                db.add(platform)
            db.commit()
            print(f"✅ {len(PLATFORM_RANGES)} platforms created")
        else:
            print(f"✅ Platforms already exist ({platform_count} found)")

        # Check if articles exist
        article_count = db.query(models.Article).count()
        if article_count == 0:
            print("📦 Populating articles...")
            platforms_by_code = {}
            for platform in db.query(models.PlatformRange).all():
                platforms_by_code[platform.code_range] = platform.id

            for article_code, article_name, platform_code_range in ARTICLES:
                if platform_code_range in platforms_by_code:
                    article = models.Article(
                        article_code=article_code,
                        article_name=article_name,
                        platform_id=platforms_by_code[platform_code_range]
                    )
                    db.add(article)
            db.commit()
            print(f"✅ {len(ARTICLES)} articles created")
        else:
            print(f"✅ Articles already exist ({article_count} found)")

        db.close()
        print("✅ Database initialization complete!")

    except Exception as e:
        print(f"❌ Error initializing database: {str(e)}")
        raise


if __name__ == "__main__":
    init_database()
