from fastapi import APIRouter, HTTPException
from app.services.openmeteo_client import (
    fetch_current_weather,
    fetch_forecast_weather,
)

router = APIRouter()


@router.get("/current")
async def get_current_weather():
    """Поточна погода для Києва."""
    try:
        return await fetch_current_weather()
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Open-Meteo error: {e}")


@router.get("/forecast")
async def get_weather_forecast(hours: int = 24):
    """Прогноз погоди на N годин."""
    if hours < 1 or hours > 168:
        raise HTTPException(status_code=400, detail="hours must be 1..168")
    try:
        return await fetch_forecast_weather(hours)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Open-Meteo error: {e}")
