from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

load_dotenv()

from app.routers import forecast, weather, history, model_info
from app.services.db import init_db

app = FastAPI(
    title="Energy Forecast UA — API",
    description="Прогнозування погодинного споживання електроенергії в ОЕС України (ANFIS)",
    version="3.1.0",
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
    """При старті ініціалізуємо SQLite БД і завантажуємо модель."""
    # 1. Ініціалізація SQLite для збереження прогнозів
    try:
        init_db()
    except Exception as e:
        print(f"⚠ Помилка ініціалізації БД: {e}")

    # 2. Перевірка моделі ANFIS
    try:
        from app.models.anfis import _load_model, get_model_info
        model = _load_model()
        if model:
            info = get_model_info()
            print(f"✅ ANFIS активна: {info['version']} (MAPE={info['metrics']['mape']}%)")
        else:
            print("⚠ ANFIS модель не знайдена, використовується fallback")
    except Exception as e:
        print(f"⚠ Помилка завантаження моделі: {e}")


@app.get("/")
def root():
    return {
        "service": "Energy Forecast UA API",
        "version": "3.1.0",
        "status":  "running",
        "docs":    "/docs",
    }


@app.get("/health")
def health():
    from app.models.anfis import get_model_info, get_base_load
    try:
        info = get_model_info()
        return {
            "status": "ok",
            "model_version": info["version"],
            "model_mape":    info["metrics"]["mape"],
            "base_load_sample": get_base_load()[:4],
        }
    except Exception as e:
        return {"status": "error", "detail": str(e)}
