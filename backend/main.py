"""
SellBuy API - Backend for purchase/sale management platform
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.database import engine
from app import models
from app.api import routes

# Create tables
models.Base.metadata.create_all(bind=engine)

# Initialize database with seed data
def init_database():
    """Initialize database with seed data on startup"""
    try:
        from app.database import SessionLocal
        from sqlalchemy import text

        db = SessionLocal()

        # Check if articles table is empty and populate if needed
        article_count = db.query(models.Article).count()
        platform_count = db.query(models.PlatformRange).count()

        if platform_count == 0:
            print("📦 Populating platform ranges...")
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

        if article_count == 0:
            print("📦 Populating articles (300+)...")
            platforms_map = {p.code_range: p.id for p in db.query(models.PlatformRange).all()}
            articles = [
                # Playstation 1 (1000)
                (1000, "Harry Potter Y La Piedra Filosofal", 1000),
                (1001, "Harry Potter Y La Cámara Secreta", 1000),
                (1002, "Gran Turismo", 1000),
                (1003, "Gran Turismo 2", 1000),
                (1004, "Metal Gear Solid", 1000),
                (1005, "Tekken", 1000),
                (1006, "Tekken 2", 1000),
                (1007, "Tekken 3", 1000),
                # Playstation 2 (2000)
                (2000, "Need For Speed Hot Pursuit", 2000),
                (2001, "Need For Speed Underground 1", 2000),
                (2002, "Need For Speed Underground 2", 2000),
                (2003, "Need For Speed Most Wanted", 2000),
                (2004, "Need For Speed Carbono", 2000),
                (2005, "Need For Speed Pro Street", 2000),
                (2006, "Need For Speed Undercover", 2000),
                (2008, "Gran Turismo 3", 2000),
                (2009, "Gran Turismo 4", 2000),
                (2010, "True Crime Streets Of LA", 2000),
                (2011, "True Crime New York City", 2000),
                (2012, "Metal Gear Solid 2", 2000),
                (2013, "Metal Gear Solid 3", 2000),
                (2014, "GTA 3", 2000),
                (2015, "GTA Vice City", 2000),
                (2016, "GTA San Andreas", 2000),
                (2017, "GTA Liberty City Stories", 2000),
                (2018, "GTA Vice City Stories", 2000),
                (2019, "Devil May Cry", 2000),
                (2020, "Devil May Cry 2", 2000),
                (2021, "Devil May Cry 3 Especial Edition", 2000),
                (2022, "Resident Evil 4", 2000),
                (2023, "God Of War", 2000),
                (2024, "God Of War 2", 2000),
                (2025, "Harry Potter Y La Piedra Filosofal", 2000),
                (2026, "Harry Potter Y La Cámara Secreta", 2000),
                (2027, "Harry Potter Y El Prisionero De Azkaban", 2000),
                (2028, "Harry Potter Y El Cáliz de Fuego", 2000),
                (2029, "Harry Potter Y La Orden Del Fénix", 2000),
                (2030, "Midnight Club 3: Dub Edición Remix", 2000),
                (2031, "Tekken 4", 2000),
                (2032, "Tekken 5", 2000),
                (2033, "Smack Down Vs Raw 2007", 2000),
                (2034, "Dragon Ball Budokai", 2000),
                (2035, "Dragon Ball Budokai 2", 2000),
                (2036, "Dragon Ball Budokai 3", 2000),
                (2037, "Dragon Ball Budokai Tenkaichi 1", 2000),
                (2038, "Dragon Ball Budokai Tenkaichi 2", 2000),
                (2039, "Dragon Ball Budokai Tenkaichi 3", 2000),
                (2040, "Dragon Ball Z Sagas", 2000),
                (2041, "Dragon Ball Z: Infinite World", 2000),
                (2042, "Dragon Ball Z: Super Dragon Ball Z", 2000),
                (2043, "Pro Evolution Soccer", 2000),
                (2044, "Pro Evolution Soccer 2", 2000),
                (2045, "Pro Evolution Soccer 3", 2000),
                (2046, "Pro Evolution Soccer 4", 2000),
                (2047, "Pro Evolution Soccer 5", 2000),
                (2048, "Pro Evolution Soccer 6", 2000),
                (2049, "Astérix Y Obélix XXL", 2000),
                (2050, "Astérix Y Obélix XXL 2", 2000),
                (2051, "Torrente 3 El Protector", 2000),
                (2052, "Driver", 2000),
                (2053, "Driver Parallel Lines", 2000),
                (2054, "Prince of Persia: El Alma Del Guerrero", 2000),
                (2055, "Prince of Persia: Las Dos Coronas", 2000),
                (2056, "Prince of Persia: Las Arenas Del Tiempo", 2000),
                (2057, "Alone In The Dark", 2000),
                (2058, "Alone In The Dark 2", 2000),
                (2059, "El Señor de los Anillos: La Comunidad Del Anillo", 2000),
                (2060, "El Señor de los Anillos: Las Dos Torres", 2000),
                (2061, "El Señor de los Anillos: El retorno del rey", 2000),
                (2062, "Burnout 3", 2000),
                (2063, "Flat Out 2", 2000),
                (2064, "Spiderman 1", 2000),
                (2065, "Spiderman 2", 2000),
                (2066, "Spiderman 3", 2000),
                # Playstation 3 (3000)
                (3000, "Need For Speed Carbono", 3000),
                (3001, "Need For Speed Pro Street", 3000),
                (3002, "Need For Speed Undercover", 3000),
                (3003, "Need For Speed Shift", 3000),
                (3004, "Need For Speed Hot Pursuit", 3000),
                (3005, "Need For Speed Shift 2 Unleashed", 3000),
                (3006, "Need For Speed The Run", 3000),
                (3007, "Need for Speed Most Wanted", 3000),
                (3008, "Need For Speed Rivals", 3000),
                (3009, "Gran Turismo 5", 3000),
                (3010, "Gran Turismo 6", 3000),
                (3011, "Metal Gear Solid 4", 3000),
                (3012, "Far Cry 2", 3000),
                (3013, "Harry Potter Y El Cáliz de Fuego", 3000),
                (3014, "Harry Potter Y La Orden Del Fénix", 3000),
                (3015, "Harry Potter Y El Misterio Del Príncipe", 3000),
                (3016, "Harry Potter Y Las Reliquias De La Muerte Parte 1", 3000),
                (3017, "Harry Potter Y Las Reliquias De La Muerte Parte 2", 3000),
                (3018, "Tekken 6", 3000),
                (3019, "GTA 4", 3000),
                (3020, "Heavenly Sword", 3000),
                (3021, "Soul Calibur IV", 3000),
                (3022, "GTA 5", 3000),
                (3023, "GTA Episodes From Liberty City", 3000),
                (3024, "NBA 2K8", 3000),
                (3025, "God of War Ascension", 3000),
                # Playstation 4 (4000)
                (4000, "Need For Speed Rivals", 4000),
                (4001, "Need For Speed 2015", 4000),
                (4002, "Need For Speed Payback", 4000),
                (4003, "Need For Speed Heat", 4000),
                (4004, "Need for Speed Hot Pursuit Remastered", 4000),
                (4005, "Far Cry 3", 4000),
                (4006, "Far Cry 4", 4000),
                (4007, "Far Cry 5", 4000),
                (4008, "Far Cry 6", 4000),
                (4009, "Far Cry Primal", 4000),
                (4010, "Far Cry New Dawn", 4000),
                (4011, "Battlefield", 4000),
                (4012, "Watchdogs", 4000),
                (4013, "Watchdogs 2", 4000),
                (4014, "Red Dead Redemption 1", 4000),
                (4015, "Red Dead Redemption 2", 4000),
                (4016, "Spiderman 1", 4000),
                (4017, "Spiderman Miles Morales", 4000),
                (4018, "GTA V", 4000),
                (4019, "Gran Turismo 7", 4000),
                (4020, "Grand Theft Auto Trilogy", 4000),
                (4021, "Metal Gear Solid 5", 4000),
                (4022, "Battlefield 1", 4000),
                (4023, "Battlefield 4", 4000),
                (4024, "Battlefield V", 4000),
                (4025, "Dark Souls Trilogy", 4000),
                (4026, "BloodBorne", 4000),
                (4027, "God Of War 3 Remastered", 4000),
                (4028, "God Of War 2018", 4000),
                (4029, "Tekken 7", 4000),
                (4030, "Resident Evil Origins", 4000),
                (4031, "Resident Evil Revelations", 4000),
                (4032, "Resident Evil Revelations 2", 4000),
                (4033, "Resident Evil 2 Remake", 4000),
                (4034, "Resident Evil 3 Remake", 4000),
                (4035, "Resident Evil 4", 4000),
                (4036, "Resident Evil 4 Remake", 4000),
                (4037, "Resident Evil 5", 4000),
                (4038, "Resident Evil 6", 4000),
                (4039, "Resident Evil 7 Biohazard", 4000),
                (4040, "Resident Evil 8 Evil Village", 4000),
                (4041, "Uncharted: The Nathan Drake Collection", 4000),
                (4042, "Operación Triunfo 2017", 4000),
                (4043, "Detroit: Become Human", 4000),
                (4044, "Call of Duty: Ghosts", 4000),
                (4045, "Call of Duty: Advanced Warfare", 4000),
                (4046, "Call of Duty: Black Ops III", 4000),
                (4047, "Call of Duty: Infinite Warfare (+ Modern Warfare Remastered)", 4000),
                (4048, "Call of Duty: WWII", 4000),
                (4049, "Call of Duty: Black Ops 4", 4000),
                (4050, "Call of Duty: Modern Warfare", 4000),
                (4051, "Asassins Creed Sindicate", 4000),
                (4052, "Intenciones Ocultas", 4000),
                # Playstation 5 (5000)
                (5000, "Metal Gear Solid Collection", 5000),
                (5001, "Need For Speed Unbound", 5000),
                (5002, "Far Cry 6", 5000),
                (5003, "Spiderman 1", 5000),
                (5004, "Spiderman Miles Morales", 5000),
                (5005, "Spiderman 2", 5000),
                (5006, "GTA V", 5000),
                (5007, "Gran Turismo 7", 5000),
                (5008, "Watchdogs Legion", 5000),
                (5009, "God Of War Ragnarok", 5000),
                (5010, "Tekken 8", 5000),
                (5011, "Resident Evil 2 Remake", 5000),
                (5012, "Resident Evil 3 Remake", 5000),
                (5013, "Resident Evil 4 Remake", 5000),
                (5014, "Resident Evil 7 Biohazard", 5000),
                (5015, "Resident Evil 8 Evil Village", 5000),
                (5016, "Resident Evil 9 Requiem", 5000),
                (5017, "Dragon Ball Sparking Zero", 5000),
                (5018, "Battlefield 2042", 5000),
                (5019, "Battlefield 6", 5000),
                (5020, "Hogwarts Legacy", 5000),
                (5021, "Uncharted:Legacy of Thieves", 5000),
                (5022, "Destruction All Stars", 5000),
                (5023, "Devil May Cry 5 Special Edition", 5000),
                (5024, "Call of Duty: Black Ops Cold War", 5000),
                (5025, "Call of Duty: Warzone", 5000),
                (5026, "Call of Duty: Vanguard", 5000),
                (5027, "Call of Duty: Modern Warfare II", 5000),
                (5028, "Call of Duty: Modern Warfare III", 5000),
                (5029, "Call of Duty: Black Ops 6", 5000),
                (5030, "Call of Duty: Black Ops 7", 5000),
                (5031, "Death Stranding", 5000),
                (5032, "Death Stranding 2", 5000),
                (5033, "Horizon Zero Dawn", 5000),
                (5034, "Horizon Forbidden West", 5000),
                (5035, "The Last Of Us Parte 1", 5000),
                (5036, "The Last Of Us Parte 2", 5000),
                (5037, "Elden Ring", 5000),
                (5038, "WWE 2K25", 5000),
                (5039, "WWE 2K26", 5000),
                (5040, "Dragon Ball Z Kakarot", 5000),
                (5041, "Skate Sim", 5000),
                (5042, "Assasins Creed Valhalla", 5000),
                (5043, "Assasins Creed Shadows", 5000),
                (5044, "Clair Obscure Expedition 33", 5000),
                (5045, "Godfall", 5000),
                (5046, "Cyberpunk 2077", 5000),
                (5047, "Ghost of Tsushima", 5000),
                (5048, "Ghost of Yotei", 5000),
                # Nintendo Switch (7000)
                (7000, "Pokémon Let's Go Pikachu", 7000),
                (7001, "Pokémon Let's Go Evee", 7000),
                (7002, "Pokémon Diamante Brillante", 7000),
                (7003, "Pokémon Perla Reluciente", 7000),
                (7004, "Pokémon Espada", 7000),
                (7005, "Pokémon Escudo", 7000),
                (7006, "Pokémon Leyendas Arceus", 7000),
                (7007, "Pokémon Púrpura", 7000),
                (7008, "Pokémon Escarlata", 7000),
                (7009, "Pokémon Leyendas ZA", 7000),
                (7010, "Super Mario Party", 7000),
                (7011, "Mario Party Superstars", 7000),
                (7012, "Mario Rabbids Kingdom Battle", 7000),
                (7013, "Hogwarts Legacy", 7000),
                # Nintendo DS (9000)
                (9000, "Pokémon Diamante", 9000),
                (9001, "Pokémon Perla", 9000),
                (9002, "Pokémon Platino", 9000),
                (9003, "Pokémon Edición Blanca", 9000),
                (9004, "Pokémon Edición Negra", 9000),
                (9005, "Pokémon Edición Blanca 2", 9000),
                (9006, "Pokémon Edición Negra 2", 9000),
                (9007, "Pokémon Oro Hearthgold", 9000),
                (9008, "Pokémon Plata Soulsilver", 9000),
                (9009, "Pokémon X", 9000),
                (9010, "Pokémon Y", 9000),
                (9011, "Pokémon Rubí Omega", 9000),
                (9012, "Pokémon Zafiro Alfa", 9000),
                (9013, "Pokémon Luna", 9000),
                (9014, "Pokémon Sol", 9000),
                (9015, "Pokémon Ultraluna", 9000),
                (9016, "Pokémon Ultrasol", 9000),
                (9017, "Pokémon Mistery Dungeon", 9000),
                # Game Boy Advance (10000)
                (10000, "Pokémon Rubí", 10000),
                (10001, "Pokémon Zafiro", 10000),
                (10002, "Pokémon Rojo Fuego", 10000),
                (10003, "Pokémon Verde Hoja", 10000),
                (10004, "Pokémon Esmeralda", 10000),
                (10005, "Pokémon Pinball", 10000),
                # Game Boy (11000)
                (11000, "Pokémon Rojo", 11000),
                (11001, "Pokémon Azul", 11000),
                (11002, "Pokémon Amarillo", 11000),
                (11003, "Pokémon Oro", 11000),
                (11004, "Pokémon Plata", 11000),
                (11005, "Pokémon Cristal", 11000),
                # PSP (12000)
                (12000, "Smack Down Vs Raw 2007", 12000),
                (12001, "GTA Liberty City Stories", 12000),
                (12002, "GTA Vice City Stories", 12000),
                (12003, "GTA Chinatown Wars", 12000),
                (12004, "God of War Chains Of Olympus", 12000),
                (12005, "God of War Chains Ghost Of Sparta", 12000),
                (12006, "Dragon Ball Shin Budokai", 12000),
                (12007, "Dragon Ball Shin Budokai 2", 12000),
                (12008, "SmackDown vs Raw 2008", 12000),
                (12009, "PES 2014", 12000),
                (12010, "Los Sims 2 Mascotas", 12000),
                # PC (13000)
                (13000, "Far Cry", 13000),
                (13001, "Harry Potter Y La Piedra Filosofal", 13000),
                (13002, "Harry Potter Y La Cámara Secreta", 13000),
                (13003, "Need For Speed Underground", 13000),
                (13004, "Need For Speed Underground 2", 13000),
                (13005, "Need For Speed Most Wanted", 13000),
                (13006, "Need For Speed Carbono", 13000),
                (13007, "Need For Speed Pro Street", 13000),
                (13008, "Need For Speed Undercover", 13000),
                (13009, "Torrente", 13000),
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
    except Exception as e:
        print(f"⚠️ Warning during database init: {str(e)}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("🚀 SellBuy API starting...")
    init_database()
    yield
    # Shutdown
    print("🛑 SellBuy API shutting down...")

app = FastAPI(
    title="SellBuy API",
    description="Platform for managing purchases and sales",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routes
app.include_router(routes.auth.router)
app.include_router(routes.users.router)
app.include_router(routes.purchases.router)
app.include_router(routes.sales.router)
app.include_router(routes.estimations.router)
app.include_router(routes.analytics.router)
app.include_router(routes.inventory.router)
app.include_router(routes.import_csv.router)

@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "SellBuy API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
