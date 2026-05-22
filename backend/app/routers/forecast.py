from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional
import datetime

from app.models.anfis import generate_forecast_series, get_base_load, get_model_info

router = APIRouter()


class WeatherParams(BaseModel):
    temperature: float = Field(10.0, description="Температура (°C)")
    cloud_cover: float = Field(50.0, description="Хмарність (%)")
    wind_speed:  float = Field(5.0,  description="Швидкість вітру (м/с)")
    humidity:    Optional[float] = Field(None, description="Вологість (%)")
    pressure:    Optional[float] = Field(None, description="Тиск (гПа)")


class CalendarParams(BaseModel):
    is_weekend:     bool = False
    is_holiday:     bool = False
    is_pre_holiday: bool = False
    is_school_break: bool = False


class ForecastRequest(BaseModel):
    start:    str = Field(..., description="ISO 8601 дата початку прогнозу")
    hours:    int = Field(24, ge=1, le=168, description="Горизонт (1-168 годин)")
    weather:  WeatherParams  = WeatherParams()
    calendar: CalendarParams = CalendarParams()


@router.post("/")
async def create_forecast(req: ForecastRequest):
    """Створити прогноз споживання — використовує навчену ANFIS модель."""
    try:
        # Якщо погода не задана вручну — беремо реальну з Open-Meteo
        weather_data = req.weather.model_dump()
        try:
            from app.services.openmeteo_client import fetch_current_weather
            w = await fetch_current_weather()
            if w and req.weather.temperature == 10.0:  # дефолтне значення = не задано вручну
                weather_data["temperature"] = w.get("temperature", 10.0)
                weather_data["cloud_cover"]  = w.get("cloud_cover", 50.0)
                weather_data["wind_speed"]   = w.get("wind_speed", 5.0)
        except Exception:
            pass  # fallback на введені значення

        points = generate_forecast_series(
            start_iso=req.start,
            hours=req.hours,
            weather_params=weather_data,
            calendar_params=req.calendar.model_dump(),
        )

        if not points:
            raise HTTPException(status_code=500, detail="Не вдалося згенерувати прогноз")

        values  = [p["forecast"] for p in points]
        max_v   = max(values)
        min_v   = min(values)
        avg_v   = sum(values) / len(values)

        # Версія з навченої моделі
        model_info = get_model_info()

        return {
            "request":       req.model_dump(),
            "points":        points,
            "summary": {
                "avg":      round(avg_v, 3),
                "max":      round(max_v, 3),
                "min":      round(min_v, 3),
                "max_hour": values.index(max_v),
                "min_hour": values.index(min_v),
            },
            "model_version": model_info["version"],
            "model_mape":    model_info["metrics"]["mape"],
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/base-load")
def get_base_load_curve():
    """Базова крива навантаження ОЕС України (24 години) з навченої моделі."""
    return {
        "description": "Середній добовий профіль споживання ОЕС України 2017–2019",
        "unit":        "GW",
        "curve":       get_base_load(),
        "source":      "trained_model",
    }


@router.get("/preview")
async def quick_preview(hours: int = 24):
    """Швидкий прогноз з поточною погодою на N годин."""
    now = datetime.datetime.utcnow().replace(minute=0, second=0, microsecond=0)

    weather = {"temperature": 10.0, "cloud_cover": 50.0, "wind_speed": 5.0}
    try:
        from app.services.openmeteo_client import fetch_current_weather
        w = await fetch_current_weather()
        if w:
            weather = {
                "temperature": w.get("temperature", 10.0),
                "cloud_cover": w.get("cloud_cover", 50.0),
                "wind_speed":  w.get("wind_speed", 5.0),
            }
    except Exception:
        pass

    points = generate_forecast_series(
        start_iso=now.isoformat() + "Z",
        hours=hours,
        weather_params=weather,
        calendar_params={},
    )

    model_info = get_model_info()
    return {
        "start":         now.isoformat() + "Z",
        "points":        points,
        "model_version": model_info["version"],
        "weather_used":  weather,
    }
