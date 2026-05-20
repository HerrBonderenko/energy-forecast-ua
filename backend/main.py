from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
import asyncio

load_dotenv()

from app.routers import forecast, weather, history, model_info

app = FastAPI(
    title="Energy Forecast UA — API",
    description="Прогнозування погодинного споживання електроенергії в ОЕС України (ANFIS)",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(forecast.router,   prefix="/api/forecast",  tags=["Прогноз"])
app.include_router(weather.router,    prefix="/api/weather",   tags=["Погода"])
app.include_router(history.router,    prefix="/api/history",   tags=["Історія"])
app.include_router(model_info.router, prefix="/api/model",     tags=["Модель"])


@app.on_event("startup")
async def startup_event():
    """При старті завантажуємо реальну базову криву з ENTSO-E."""
    try:
        from app.services.entsoe_client import fetch_base_load_curve, is_configured
        from app.models.anfis import set_base_load_curve

        if is_configured():
            print("Завантаження базової кривої з ENTSO-E...")
            curve = await fetch_base_load_curve()
            if curve:
                set_base_load_curve(curve)
                print(f"Базова крива оновлена: {[round(v,1) for v in curve]}")
            else:
                print("ENTSO-E: дані недоступні, використовуємо резервну криву")
        else:
            print("ENTSO-E не налаштований, використовуємо резервну криву")
    except Exception as e:
        print(f"Помилка завантаження кривої: {e}")


@app.get("/")
def root():
    return {
        "service": "Energy Forecast UA API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
    }


@app.get("/health")
def health():
    from app.services.entsoe_client import is_configured
    from app.models.anfis import _cache_updated_at, get_base_load_curve
    return {
        "status": "ok",
        "entsoe_configured": is_configured(),
        "base_load_updated_at": _cache_updated_at.isoformat() if _cache_updated_at else None,
        "base_load_sample": get_base_load_curve()[:4],
    }
