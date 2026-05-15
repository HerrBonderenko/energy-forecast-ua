from fastapi import APIRouter
from app.models import generate_forecast_series, compute_metrics
import datetime
import random

router = APIRouter()


@router.get("/")
def get_history(days: int = 7, limit: int = 50):
    """
    Згенеровані історичні прогнози за останні N днів.
    У production версії — з SQLite БД.
    """
    random.seed(42)
    now = datetime.datetime.utcnow().replace(minute=0, second=0, microsecond=0)
    results = []

    for i in range(min(limit, days * 24)):
        ts = now - datetime.timedelta(hours=i + 1)
        # Симулюємо прогноз і фактичне значення
        forecast_pts = generate_forecast_series(
            start_iso=ts.isoformat() + "Z",
            hours=1,
            weather_params={"temperature": 10.0 + random.uniform(-5, 5), "cloud_cover": 50.0, "wind_speed": 5.0},
            calendar_params={},
        )
        if not forecast_pts:
            continue
        f = forecast_pts[0]
        # Імітуємо невелику помилку
        error = random.uniform(-0.03, 0.03)
        actual = round(f["forecast"] * (1 + error), 3)
        mape = round(abs(error) * 100, 2)

        results.append({
            "id": f"f_{ts.strftime('%Y%m%d%H')}",
            "start_time": f["timestamp"],
            "horizon": "1h",
            "model_version": "v1.2.3",
            "source": "auto",
            "avg_forecast": f["forecast"],
            "avg_actual": actual,
            "mape": mape,
            "quality": "excellent" if mape < 2 else "good" if mape < 5 else "poor",
        })

    return {"items": results, "total": len(results)}


@router.get("/{forecast_id}")
def get_forecast_detail(forecast_id: str):
    """Деталі окремого прогнозу."""
    return {
        "id": forecast_id,
        "details": "В production — з БД",
        "note": "Mock endpoint",
    }
