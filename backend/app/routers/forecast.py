from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional
import datetime

from app.models import generate_forecast_series, BASE_LOAD

router = APIRouter()


class WeatherParams(BaseModel):
    temperature: float = Field(10.0, description="Температура (°C)")
    cloud_cover: float = Field(50.0, description="Хмарність (%)")
    wind_speed: float = Field(5.0, description="Швидкість вітру (м/с)")
    humidity: Optional[float] = Field(None, description="Вологість (%)")
    pressure: Optional[float] = Field(None, description="Тиск (гПа)")


class CalendarParams(BaseModel):
    is_weekend: bool = False
    is_holiday: bool = False
    is_pre_holiday: bool = False
    is_school_break: bool = False


class ForecastRequest(BaseModel):
    start: str = Field(..., description="ISO 8601 дата початку прогнозу")
    hours: int = Field(24, ge=1, le=168, description="Горизонт (1-168 годин)")
    weather: WeatherParams = WeatherParams()
    calendar: CalendarParams = CalendarParams()


class ForecastPoint(BaseModel):
    timestamp: str
    hour: int
    forecast: float
    lower_bound: float
    upper_bound: float
    ci_level: float


class ForecastResponse(BaseModel):
    request: ForecastRequest
    points: list[ForecastPoint]
    summary: dict
    model_version: str = "v1.2.3"


@router.post("/", response_model=ForecastResponse)
async def create_forecast(req: ForecastRequest):
    """Створити прогноз споживання."""
    try:
        points = generate_forecast_series(
            start_iso=req.start,
            hours=req.hours,
            weather_params=req.weather.model_dump(),
            calendar_params=req.calendar.model_dump(),
        )

        if not points:
            raise HTTPException(status_code=500, detail="Не вдалося згенерувати прогноз")

        values = [p["forecast"] for p in points]
        max_v = max(values)
        min_v = min(values)
        avg_v = sum(values) / len(values)

        summary = {
            "avg": round(avg_v, 2),
            "max": round(max_v, 2),
            "min": round(min_v, 2),
            "max_hour": values.index(max_v),
            "min_hour": values.index(min_v),
        }

        return ForecastResponse(request=req, points=points, summary=summary)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/base-load")
def get_base_load_curve():
    """Базова крива навантаження ОЕС України (24 години)."""
    return {
        "description": "Типовий добовий профіль споживання, робочий день",
        "unit": "GW",
        "curve": BASE_LOAD,
    }


@router.get("/preview")
def quick_preview(hours: int = 24):
    """Швидкий прогноз з дефолтними параметрами на N годин."""
    now = datetime.datetime.utcnow().replace(minute=0, second=0, microsecond=0)
    points = generate_forecast_series(
        start_iso=now.isoformat() + "Z",
        hours=hours,
        weather_params={"temperature": 10.0, "cloud_cover": 50.0, "wind_speed": 5.0},
        calendar_params={"is_holiday": False, "is_pre_holiday": False, "is_school_break": False},
    )
    return {"start": now.isoformat() + "Z", "points": points}


@router.get("/actual-load")
async def get_actual_load(hours: int = 24):
    """Реальне споживання з ENTSO-E за останні N годин."""
    from app.services.entsoe_client import fetch_actual_load, is_configured
    import datetime

    if not is_configured():
        return {"status": "not_configured", "data": []}

    now = datetime.datetime.utcnow().replace(minute=0, second=0, microsecond=0)
    start = now - datetime.timedelta(hours=hours)

    data = await fetch_actual_load(start, now)
    return {
        "status": "ok",
        "source": "ENTSO-E",
        "country": "Ukraine (UA_IPS)",
        "points": len(data),
        "data": data,
    }
