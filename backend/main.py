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

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("🚀 SellBuy API starting...")
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
app.include_router(routes.platforms.router)
app.include_router(routes.purchases.router)
app.include_router(routes.sales.router)
app.include_router(routes.estimations.router)
app.include_router(routes.analytics.router)
app.include_router(routes.import_csv.router)

@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "SellBuy API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
