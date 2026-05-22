from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List
import datetime

from app.models.anfis import generate_forecast_series, get_base_load, get_model_info

router = APIRouter()


class WeatherParams(BaseModel):
    temperature: float = Field(10.0, description="Температура (°C)")
    cloud_cover: float = Field(50.0, description="Хмарність (%)")
    wind_speed:  float = Field(5.0,  description="Швидкість вітру (м/с)")
    humidity:    Optional[float] = Field(None)
    pressure:    Optional[float] = Field(None)


class CalendarParams(BaseModel):
    is_weekend:      bool = False
    is_holiday:      bool = False
    is_pre_holiday:  bool = False
    is_school_break: bool = False


class ForecastRequest(BaseModel):
    start:    str = Field(..., description="ISO 8601 дата початку прогнозу")
    hours:    int = Field(24, ge=1, le=168)
    weather:  WeatherParams  = WeatherParams()
    calendar: CalendarParams = CalendarParams()
    # Якщо фронтенд передає погодинну погоду — використовуємо її
    hourly_weather: Optional[List[dict]] = Field(None, description="Погодинна погода (список по годинах)")


async def _fetch_hourly_weather(start_iso: str, hours: int) -> list:
    """Завантажує погодинний прогноз погоди з Open-Meteo."""
    try:
        import aiohttp
        forecast_days = min(7, (hours // 24) + 2)
        url = (
            f"https://api.open-meteo.com/v1/forecast"
            f"?latitude=50.45&longitude=30.52"
            f"&hourly=temperature_2m,cloud_cover,wind_speed_10m"
            f"&forecast_days={forecast_days}"
            f"&timezone=Europe/Kyiv"
        )
        async with aiohttp.ClientSession() as session:
            async with session.get(url, timeout=aiohttp.ClientTimeout(total=15)) as resp:
                data = await resp.json()
                h = data.get("hourly", {})
                temps  = h.get("temperature_2m", [])
                clouds = h.get("cloud_cover", [])
                winds  = h.get("wind_speed_10m", [])
                result = []
                for i in range(min(hours, len(temps))):
                    result.append({
                        "temperature": float(temps[i]) if temps[i] is not None else 10.0,
                        "cloud_cover": float(clouds[i]) if i < len(clouds) and clouds[i] is not None else 50.0,
                        "wind_speed":  float(winds[i])  if i < len(winds)  and winds[i]  is not None else 5.0,
                    })
                return result
    except Exception as e:
        print(f"⚠ _fetch_hourly_weather: {e}")
        return []


@router.post("/")
async def create_forecast(req: ForecastRequest):
    """Створити прогноз споживання з погодинною погодою."""
    try:
        # 1. Визначаємо погоду для кожної години горизонту
        hourly_weather = req.hourly_weather  # якщо фронтенд вже передав

        if not hourly_weather:
            # Намагаємось взяти погодинний прогноз з Open-Meteo
            hourly_weather = await _fetch_hourly_weather(req.start, req.hours)

        if not hourly_weather:
            # Fallback: один snapshot для всіх годин
            w = req.weather.model_dump()
            try:
                from app.services.openmeteo_client import fetch_current_weather
                cur = await fetch_current_weather()
                if cur:
                    w = {
                        "temperature": cur.get("temperature", w["temperature"]),
                        "cloud_cover": cur.get("cloud_cover", w["cloud_cover"]),
                        "wind_speed":  cur.get("wind_speed",  w["wind_speed"]),
                    }
            except Exception:
                pass
            hourly_weather = [w] * req.hours

        # Доповнюємо до потрібної кількості годин якщо бракує
        while len(hourly_weather) < req.hours:
            hourly_weather.append(hourly_weather[-1])

        # 2. Прогноз з погодинною погодою
        points = generate_forecast_series(
            start_iso=req.start,
            hours=req.hours,
            weather_params=hourly_weather,   # тепер список, а не один dict
            calendar_params=req.calendar.model_dump(),
        )

        if not points:
            raise HTTPException(status_code=500, detail="Не вдалося згенерувати прогноз")

        values = [p["forecast"] for p in points]
        avg_v  = sum(values) / len(values)
        max_v  = max(values)
        min_v  = min(values)

        model_info = get_model_info()

        return {
            "request":       req.model_dump(exclude={"hourly_weather"}),
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
            "weather_source": "hourly" if len(set(w.get("temperature",0) for w in hourly_weather)) > 1 else "snapshot",
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/base-load")
def get_base_load_curve():
    return {
        "description": "Середній добовий профіль споживання ОЕС України 2017–2019",
        "unit":        "GW",
        "curve":       get_base_load(),
        "source":      "trained_model",
    }


@router.get("/preview")
async def quick_preview(hours: int = 24):
    """Швидкий прогноз з погодинною погодою."""
    now = datetime.datetime.utcnow().replace(minute=0, second=0, microsecond=0)

    hourly_weather = await _fetch_hourly_weather(now.isoformat() + "Z", hours)
    if not hourly_weather:
        hourly_weather = [{"temperature": 10.0, "cloud_cover": 50.0, "wind_speed": 5.0}] * hours

    points = generate_forecast_series(
        start_iso=now.isoformat() + "Z",
        hours=hours,
        weather_params=hourly_weather,
        calendar_params={},
    )

    model_info = get_model_info()
    return {
        "start":         now.isoformat() + "Z",
        "points":        points,
        "model_version": model_info["version"],
        "weather_source": "hourly",
    }
