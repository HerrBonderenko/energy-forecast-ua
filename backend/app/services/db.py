"""
SQLite БД для збереження прогнозів.
Використовує stdlib sqlite3 — без додаткових залежностей.
"""

import sqlite3
import json
import datetime
from pathlib import Path
from typing import Optional

DB_PATH = Path(__file__).parent.parent.parent / "data" / "forecasts.db"


def get_conn():
    """Підключення до БД (створює якщо не існує)."""
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """Створює таблиці якщо їх немає."""
    conn = get_conn()
    try:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS forecasts (
                id              INTEGER PRIMARY KEY AUTOINCREMENT,
                created_at      TEXT NOT NULL,
                start_time      TEXT NOT NULL,
                hours           INTEGER NOT NULL,
                horizon_label   TEXT NOT NULL,
                model_version   TEXT,
                model_mape      REAL,
                weather_source  TEXT,
                weather_json    TEXT,
                calendar_json   TEXT,
                points_json     TEXT NOT NULL,
                avg_gw          REAL,
                max_gw          REAL,
                min_gw          REAL,
                max_hour        INTEGER,
                min_hour        INTEGER
            )
        """)
        conn.execute("CREATE INDEX IF NOT EXISTS idx_forecasts_created ON forecasts(created_at DESC)")
        conn.commit()
        print(f"✅ SQLite ініціалізована: {DB_PATH}")
    finally:
        conn.close()


def save_forecast(
    start_time: str,
    hours: int,
    model_version: str,
    model_mape: float,
    weather_source: str,
    weather: dict,
    calendar: dict,
    points: list,
    summary: dict,
) -> int:
    """Зберігає прогноз і повертає ID."""
    now_iso = datetime.datetime.utcnow().isoformat() + "Z"
    horizon_map = {1: "1h", 6: "6h", 24: "24h", 48: "48h", 168: "7d"}
    horizon_label = horizon_map.get(hours, f"{hours}h")

    conn = get_conn()
    try:
        cursor = conn.execute("""
            INSERT INTO forecasts (
                created_at, start_time, hours, horizon_label,
                model_version, model_mape, weather_source,
                weather_json, calendar_json, points_json,
                avg_gw, max_gw, min_gw, max_hour, min_hour
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            now_iso, start_time, hours, horizon_label,
            model_version, model_mape, weather_source,
            json.dumps(weather, ensure_ascii=False),
            json.dumps(calendar, ensure_ascii=False),
            json.dumps(points, ensure_ascii=False),
            summary.get("avg"), summary.get("max"), summary.get("min"),
            summary.get("max_hour"), summary.get("min_hour"),
        ))
        conn.commit()
        return cursor.lastrowid
    finally:
        conn.close()


def get_forecasts(limit: int = 50, days: Optional[int] = None) -> list:
    """Повертає останні прогнози."""
    conn = get_conn()
    try:
        if days:
            cutoff = (datetime.datetime.utcnow() - datetime.timedelta(days=days)).isoformat() + "Z"
            cursor = conn.execute("""
                SELECT id, created_at, start_time, hours, horizon_label,
                       model_version, model_mape, weather_source,
                       avg_gw, max_gw, min_gw, max_hour, min_hour
                FROM forecasts
                WHERE created_at >= ?
                ORDER BY created_at DESC
                LIMIT ?
            """, (cutoff, limit))
        else:
            cursor = conn.execute("""
                SELECT id, created_at, start_time, hours, horizon_label,
                       model_version, model_mape, weather_source,
                       avg_gw, max_gw, min_gw, max_hour, min_hour
                FROM forecasts
                ORDER BY created_at DESC
                LIMIT ?
            """, (limit,))
        return [dict(row) for row in cursor.fetchall()]
    finally:
        conn.close()


def get_forecast_by_id(forecast_id: int) -> Optional[dict]:
    """Повертає детальний прогноз з усіма точками."""
    conn = get_conn()
    try:
        cursor = conn.execute("SELECT * FROM forecasts WHERE id = ?", (forecast_id,))
        row = cursor.fetchone()
        if not row:
            return None
        result = dict(row)
        # Розпарсити JSON-поля
        result["weather"]  = json.loads(result.pop("weather_json", "{}"))
        result["calendar"] = json.loads(result.pop("calendar_json", "{}"))
        result["points"]   = json.loads(result.pop("points_json", "[]"))
        return result
    finally:
        conn.close()


def delete_forecast(forecast_id: int) -> bool:
    """Видаляє прогноз за ID."""
    conn = get_conn()
    try:
        cursor = conn.execute("DELETE FROM forecasts WHERE id = ?", (forecast_id,))
        conn.commit()
        return cursor.rowcount > 0
    finally:
        conn.close()


def get_stats() -> dict:
    """Загальна статистика по БД."""
    conn = get_conn()
    try:
        cursor = conn.execute("SELECT COUNT(*) AS total FROM forecasts")
        total = cursor.fetchone()["total"]

        cursor = conn.execute("""
            SELECT COUNT(*) AS today FROM forecasts
            WHERE created_at >= ?
        """, ((datetime.datetime.utcnow() - datetime.timedelta(days=1)).isoformat() + "Z",))
        today = cursor.fetchone()["today"]

        cursor = conn.execute("SELECT AVG(model_mape) AS avg_mape FROM forecasts WHERE model_mape IS NOT NULL")
        avg_mape = cursor.fetchone()["avg_mape"]

        return {
            "total":    total,
            "last_24h": today,
            "avg_mape": round(avg_mape, 3) if avg_mape else None,
        }
    finally:
        conn.close()
