from fastapi import APIRouter, HTTPException
from app.services.db import get_forecasts, get_forecast_by_id, delete_forecast, get_stats
import datetime

router = APIRouter()


@router.get("/")
def list_history(days: int = 30, limit: int = 50):
    """Список збережених прогнозів."""
    records = get_forecasts(limit=limit, days=days)

    # Форматуємо для фронтенду
    items = []
    for r in records:
        # Розраховуємо умовну "якість" (для демо: чим менше горизонт тим краще)
        hours = r.get("hours", 24)
        if hours <= 6:
            quality = "excellent"
        elif hours <= 24:
            quality = "good"
        else:
            quality = "acceptable"

        items.append({
            "id":             str(r["id"]),
            "created_at":     r["created_at"],
            "start_time":     r["start_time"],
            "horizon":        r["horizon_label"],
            "hours":          r["hours"],
            "model_version":  r["model_version"],
            "model_mape":     r["model_mape"],
            "weather_source": r["weather_source"],
            "avg_forecast":   r["avg_gw"],
            "max_forecast":   r["max_gw"],
            "min_forecast":   r["min_gw"],
            "source":         "manual" if r["weather_source"] == "manual" else "auto",
            "quality":        quality,
        })

    return {"items": items, "total": len(items)}


@router.get("/stats")
def history_stats():
    """Загальна статистика по історії."""
    return get_stats()


@router.get("/{forecast_id}")
def get_forecast_detail(forecast_id: int):
    """Деталі окремого прогнозу."""
    record = get_forecast_by_id(forecast_id)
    if not record:
        raise HTTPException(status_code=404, detail="Прогноз не знайдено")
    return record


@router.delete("/{forecast_id}")
def remove_forecast(forecast_id: int):
    """Видалити прогноз."""
    if delete_forecast(forecast_id):
        return {"deleted": True, "id": forecast_id}
    raise HTTPException(status_code=404, detail="Прогноз не знайдено")
