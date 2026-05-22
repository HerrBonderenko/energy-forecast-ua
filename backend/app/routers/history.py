from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.services.db import (
    get_forecasts, get_forecast_by_id,
    delete_forecast, get_stats, update_forecast_label,
)
import datetime

router = APIRouter()


class ForecastLabel(BaseModel):
    name: Optional[str] = None
    note: Optional[str] = None


@router.get("/")
def list_history(days: int = 30, limit: int = 50):
    records = get_forecasts(limit=limit, days=days)
    items = []
    for r in records:
        hours = r.get("hours", 24)
        if hours <= 6:   quality = "excellent"
        elif hours <= 24: quality = "good"
        else:             quality = "acceptable"
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
            "name":           r.get("name"),
            "note":           r.get("note"),
        })
    return {"items": items, "total": len(items)}


@router.get("/stats")
def history_stats():
    return get_stats()


@router.get("/{forecast_id}")
def get_forecast_detail(forecast_id: int):
    record = get_forecast_by_id(forecast_id)
    if not record:
        raise HTTPException(status_code=404, detail="Прогноз не знайдено")
    return record


@router.patch("/{forecast_id}/label")
def label_forecast(forecast_id: int, body: ForecastLabel):
    """Оновлює назву і примітку прогнозу."""
    if update_forecast_label(forecast_id, body.name, body.note):
        return {"id": forecast_id, "name": body.name, "note": body.note}
    raise HTTPException(status_code=404, detail="Прогноз не знайдено")


@router.delete("/{forecast_id}")
def remove_forecast(forecast_id: int):
    if delete_forecast(forecast_id):
        return {"deleted": True, "id": forecast_id}
    raise HTTPException(status_code=404, detail="Прогноз не знайдено")
