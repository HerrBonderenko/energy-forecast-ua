"""
SQLite БД для збереження прогнозів.
Використовує stdlib sqlite3 — без додаткових залежностей.
"""

import sqlite3
import json
import datetime
from pathlib import Path
from typing import Optional

# Render Disk монтується на /data — постійне сховище між перезапусками
# Локально (dev) — зберігаємо в папці data/ проекту
import os
_IS_RENDER = os.environ.get("RENDER") == "true"
DB_PATH = Path("/data/forecasts.db") if _IS_RENDER else Path(__file__).parent.parent.parent / "data" / "forecasts.db"


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
        # Таблиця прогнозів
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
                min_hour        INTEGER,
                name            TEXT,
                note            TEXT
            )
        """)
        conn.execute("CREATE INDEX IF NOT EXISTS idx_forecasts_created ON forecasts(created_at DESC)")

        # Додаємо колонки name/note якщо їх ще немає (для вже існуючих БД)
        for col in ("name TEXT", "note TEXT"):
            try:
                conn.execute(f"ALTER TABLE forecasts ADD COLUMN {col}")
            except Exception:
                pass  # колонка вже існує

        # Таблиця історії навчань
        conn.execute("""
            CREATE TABLE IF NOT EXISTS training_history (
                id           INTEGER PRIMARY KEY AUTOINCREMENT,
                started_at   TEXT NOT NULL,
                finished_at  TEXT NOT NULL,
                version      TEXT NOT NULL,
                mape_before  REAL,
                mape_after   REAL,
                rmse_after   REAL,
                mae_after    REAL,
                duration_s   INTEGER,
                status       TEXT DEFAULT 'success',
                error        TEXT
            )
        """)

        # Таблиця сценаріїв
        conn.execute("""
            CREATE TABLE IF NOT EXISTS scenarios (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                name        TEXT NOT NULL,
                description TEXT,
                created_at  TEXT NOT NULL,
                delta_pct   REAL,
                direction   TEXT,
                curve_json  TEXT,
                deltas_json TEXT
            )
        """)
        conn.execute("CREATE INDEX IF NOT EXISTS idx_scenarios_created ON scenarios(created_at DESC)")
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
                       avg_gw, max_gw, min_gw, max_hour, min_hour,
                       name, note
                FROM forecasts
                WHERE created_at >= ?
                ORDER BY created_at DESC
                LIMIT ?
            """, (cutoff, limit))
        else:
            cursor = conn.execute("""
                SELECT id, created_at, start_time, hours, horizon_label,
                       model_version, model_mape, weather_source,
                       avg_gw, max_gw, min_gw, max_hour, min_hour,
                       name, note
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


# ─── Сценарії ─────────────────────────────────────────────────────────────────

def save_scenario(
    name: str,
    description: Optional[str],
    delta_pct: float,
    direction: str,
    curve: list,
    deltas: dict,
    created_at: Optional[str] = None,
) -> int:
    """Зберігає сценарій."""
    now_iso = created_at or (datetime.datetime.utcnow().isoformat() + "Z")
    conn = get_conn()
    try:
        cursor = conn.execute("""
            INSERT INTO scenarios (
                name, description, created_at,
                delta_pct, direction, curve_json, deltas_json
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            name, description, now_iso,
            delta_pct, direction,
            json.dumps(curve, ensure_ascii=False),
            json.dumps(deltas, ensure_ascii=False),
        ))
        conn.commit()
        return cursor.lastrowid
    finally:
        conn.close()


def get_scenarios() -> list:
    """Повертає всі сценарії."""
    conn = get_conn()
    try:
        cursor = conn.execute("""
            SELECT id, name, description, created_at,
                   delta_pct, direction, curve_json, deltas_json
            FROM scenarios
            ORDER BY created_at DESC
        """)
        result = []
        for row in cursor.fetchall():
            r = dict(row)
            r["curve"]  = json.loads(r.pop("curve_json")  or "[]")
            r["deltas"] = json.loads(r.pop("deltas_json") or "{}")
            # Перейменовуємо для сумісності з фронтендом
            r["deltaPct"]  = r.pop("delta_pct")
            r["createdAt"] = r.pop("created_at")
            r["id"]        = str(r["id"])  # фронт очікує string id
            result.append(r)
        return result
    finally:
        conn.close()


def get_scenario_by_id(scenario_id: int) -> Optional[dict]:
    """Повертає сценарій за ID."""
    conn = get_conn()
    try:
        cursor = conn.execute("""
            SELECT id, name, description, created_at,
                   delta_pct, direction, curve_json, deltas_json
            FROM scenarios WHERE id = ?
        """, (scenario_id,))
        row = cursor.fetchone()
        if not row:
            return None
        r = dict(row)
        r["curve"]     = json.loads(r.pop("curve_json")  or "[]")
        r["deltas"]    = json.loads(r.pop("deltas_json") or "{}")
        r["deltaPct"]  = r.pop("delta_pct")
        r["createdAt"] = r.pop("created_at")
        r["id"]        = str(r["id"])
        return r
    finally:
        conn.close()


def delete_scenario(scenario_id: int) -> bool:
    """Видаляє сценарій."""
    conn = get_conn()
    try:
        cursor = conn.execute("DELETE FROM scenarios WHERE id = ?", (scenario_id,))
        conn.commit()
        return cursor.rowcount > 0
    finally:
        conn.close()


def duplicate_scenario(scenario_id: int) -> Optional[dict]:
    """Дублює сценарій з суфіксом '(копія)'."""
    src = get_scenario_by_id(scenario_id)
    if not src:
        return None
    new_id = save_scenario(
        name=f"{src['name']} (копія)",
        description=src.get("description"),
        delta_pct=src["deltaPct"],
        direction=src["direction"],
        curve=src["curve"],
        deltas=src["deltas"],
    )
    return get_scenario_by_id(new_id)


def update_forecast_label(forecast_id: int, name: Optional[str], note: Optional[str]) -> bool:
    """Оновлює назву і примітку прогнозу."""
    conn = get_conn()
    try:
        cursor = conn.execute(
            "UPDATE forecasts SET name = ?, note = ? WHERE id = ?",
            (name, note, forecast_id)
        )
        conn.commit()
        return cursor.rowcount > 0
    finally:
        conn.close()


def save_training_record(version: str, mape_before: float, mape_after: float,
                          rmse_after: float, mae_after: float, duration_s: int,
                          started_at: str, finished_at: str,
                          status: str = "success", error: str = None):
    """Зберігає запис про навчання моделі."""
    conn = get_conn()
    try:
        conn.execute(
            """INSERT INTO training_history
               (started_at, finished_at, version, mape_before, mape_after,
                rmse_after, mae_after, duration_s, status, error)
               VALUES (?,?,?,?,?,?,?,?,?,?)""",
            (started_at, finished_at, version, mape_before, mape_after,
             rmse_after, mae_after, duration_s, status, error)
        )
        conn.commit()
    finally:
        conn.close()


def get_training_history(limit: int = 20) -> list:
    """Повертає історію навчань (найновіші спочатку)."""
    conn = get_conn()
    try:
        rows = conn.execute(
            """SELECT id, started_at, finished_at, version,
                      mape_before, mape_after, rmse_after, mae_after,
                      duration_s, status, error
               FROM training_history
               ORDER BY started_at DESC
               LIMIT ?""",
            (limit,)
        ).fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()
