#!/bin/bash
# Reset database script
# This script drops all tables and reinitializes the database

echo "🔄 Resetting database..."

cd /home/jmv74211/projects/sell-buy/backend

# Drop all tables using Django/SQLAlchemy style
python << 'EOF'
import sys
sys.path.insert(0, '/home/jmv74211/projects/sell-buy/backend')

from app.database import engine
from app import models
from sqlalchemy import text, inspect

# Get all tables
inspector = inspect(engine)
tables = inspector.get_table_names()

print(f"Found {len(tables)} tables: {tables}")

# Drop all tables in reverse order of dependencies
drop_tables = [
    'estimations',
    'sales',
    'purchases',
    'articles',
    'platform_ranges',
    'users'
]

connection = engine.connect()
for table in drop_tables:
    if table in tables:
        print(f"  Dropping table: {table}")
        try:
            connection.execute(text(f'DROP TABLE IF EXISTS {table} CASCADE'))
            connection.commit()
        except Exception as e:
            print(f"    Error: {e}")
connection.close()

print("✅ All tables dropped")

# Recreate tables
print("\n🔨 Creating new tables...")
models.Base.metadata.create_all(bind=engine)
print("✅ Tables created")

# Seed data
print("\n📦 Populating initial data...")
from app.database import SessionLocal

db = SessionLocal()

platforms = [
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

for p in platforms:
    db.add(models.PlatformRange(**p))
db.commit()
print(f"✅ {len(platforms)} platforms created")

platforms_map = {p.code_range: p.id for p in db.query(models.PlatformRange).all()}

articles = [
    (1000, "Harry Potter Y La Piedra Filosofal", 1000),
    (1001, "Harry Potter Y La Cámara Secreta", 1000),
    (1002, "Gran Turismo", 1000),
    (2000, "Need For Speed Hot Pursuit", 2000),
    (2001, "Need For Speed Underground 1", 2000),
    (2003, "Need For Speed Most Wanted", 2000),
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

for code, name, platform_code in articles:
    if platform_code in platforms_map:
        db.add(models.Article(
            article_code=code,
            article_name=name,
            platform_id=platforms_map[platform_code]
        ))
db.commit()
print(f"✅ {len(articles)} articles created")

db.close()

print("\n✅ Database reset complete!")
EOF

echo ""
echo "Database is ready. You can now:"
echo "  1. Start containers: docker-compose up -d"
echo "  2. Test import: curl -X POST http://localhost:8000/api/import/csv ..."
