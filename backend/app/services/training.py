"""
Модуль реального перенавчання ANFIS моделі.
Запускається з endpoint POST /api/model/retrain.
"""

import asyncio
import gzip
import json
import pickle
import threading
import time
from datetime import datetime
from pathlib import Path
from typing import Optional

import aiohttp
import numpy as np
import pandas as pd
from sklearn.linear_model import Ridge
from sklearn.metrics import mean_absolute_error, mean_squared_error

# ─── Конфіг ───────────────────────────────────────────────────────────────────
# Render Disk монтується на /data — постійне сховище між перезапусками
import os as _os
_IS_RENDER   = _os.environ.get("RENDER") == "true"
DATA_DIR     = Path(__file__).parent.parent.parent / "data"
CSV_GZ_PATH  = DATA_DIR / "training_data.csv.gz"  # датасет завжди в коді
MODEL_PATH   = Path("/data/anfis_model.pkl") if _IS_RENDER else DATA_DIR / "anfis_model.pkl"
METRICS_PATH = Path("/data/anfis_model_metrics.json") if _IS_RENDER else DATA_DIR / "anfis_model_metrics.json"

KYIV_LAT, KYIV_LON = 50.45, 30.52

TRAIN_YEARS = [2017, 2018, 2019]
VAL_YEAR    = 2020
TEST_YEAR   = 2021

# ─── Глобальний стан навчання ─────────────────────────────────────────────────
_STATE_LOCK = threading.Lock()
_TRAINING_STATE = {
    "in_progress": False,
    "progress":    0,
    "message":     "",
    "started_at":  None,
    "finished_at": None,
    "error":       None,
    "result":      None,
}


def get_training_state() -> dict:
    """Поточний стан навчання."""
    with _STATE_LOCK:
        return dict(_TRAINING_STATE)


def _update_state(**kwargs):
    """Оновлює глобальний стан."""
    with _STATE_LOCK:
        _TRAINING_STATE.update(kwargs)


# ─── МФ та правила ────────────────────────────────────────────────────────────
def tri(x, a, b, c):
    if x <= a or x >= c: return 0.0
    if x <= b: return (x-a)/(b-a) if b != a else 1.0
    return (c-x)/(c-b) if c != b else 1.0

TEMP_MFS = {
    "мороз":      (-35,-10,-2),
    "холодна":    (-5,2,10),
    "прохолодна": (5,12,18),
    "помірна":    (14,20,26),
    "тепла":      (22,27,32),
    "спека":      (28,35,45),
}
HOUR_MFS = {
    "ніч":   (0,0,7),
    "ранок": (5,9,13),
    "день":  (11,14,19),
    "вечір": (17,20,25),
}
CLOUD_MFS = {
    "ясно":    (0,0,35),
    "хмарно":  (25,55,80),
    "похмуро": (65,100,100),
}
WIND_MFS = {
    "тихий":    (0,0,5),
    "помірний": (3,8,15),
    "сильний":  (12,20,40),
}
DAY_MFS = {
    "робочий":  (-0.1, 0.0, 0.6),
    "вихідний": (0.4,  1.0, 1.1),
}
HOLIDAY_MFS = {
    "так": (0.4,  1.0, 1.1),
    "ні":  (-0.1, 0.0, 0.6),
}

def season_mf(label, month):
    if label == "зима":  return 1.0 if month in (12,1,2) else (0.5 if month in (11,3) else 0.0)
    if label == "весна": return tri(month,2,4,6)
    if label == "літо":  return tri(month,5,7,9)
    if label == "осінь": return tri(month,8,10,12)
    return 0.0

RULES = [
    ("мороз", "ніч", "робочий", "зима", "похмуро", "тихий", "ні"),
    ("мороз", "ранок", "робочий", "зима", "похмуро", "тихий", "ні"),
    ("мороз", "день", "робочий", "зима", "похмуро", "тихий", "ні"),
    ("мороз", "вечір", "робочий", "зима", "похмуро", "тихий", "ні"),
    ("мороз", "вечір", "вихідний", "зима", None, None, "ні"),
    ("мороз", "ніч", "робочий", "зима", None, "сильний", "ні"),
    ("мороз", "день", "робочий", "зима", "ясно", "сильний", "ні"),
    ("холодна", "ніч", "робочий", "зима", None, None, "ні"),
    ("холодна", "ранок", "робочий", "зима", None, None, "ні"),
    ("холодна", "день", "робочий", "зима", None, None, "ні"),
    ("холодна", "вечір", "робочий", "зима", None, None, "ні"),
    ("холодна", "вечір", "вихідний", "зима", None, None, "ні"),
    ("прохолодна", "ніч", "робочий", "осінь", "хмарно", None, "ні"),
    ("прохолодна", "ранок", "робочий", "осінь", None, None, "ні"),
    ("прохолодна", "день", "робочий", "осінь", None, None, "ні"),
    ("прохолодна", "вечір", "робочий", "осінь", "похмуро", None, "ні"),
    ("помірна", "ніч", "робочий", "осінь", None, None, "ні"),
    ("помірна", "день", "робочий", "осінь", None, None, "ні"),
    ("помірна", "вечір", "робочий", "осінь", None, None, "ні"),
    ("прохолодна", "ранок", "робочий", "весна", "ясно", "тихий", "ні"),
    ("прохолодна", "день", "робочий", "весна", None, None, "ні"),
    ("прохолодна", "вечір", "робочий", "весна", None, None, "ні"),
    ("помірна", "ніч", "робочий", "весна", None, None, "ні"),
    ("помірна", "ранок", "робочий", "весна", "ясно", None, "ні"),
    ("помірна", "день", "робочий", "весна", None, None, "ні"),
    ("помірна", "вечір", "робочий", "весна", None, None, "ні"),
    ("тепла", "ніч", "робочий", "літо", None, None, "ні"),
    ("тепла", "ранок", "робочий", "літо", "ясно", "тихий", "ні"),
    ("тепла", "день", "робочий", "літо", None, None, "ні"),
    ("тепла", "вечір", "робочий", "літо", None, None, "ні"),
    ("спека", "ніч", "робочий", "літо", "ясно", "тихий", "ні"),
    ("спека", "день", "робочий", "літо", "ясно", "тихий", "ні"),
    ("спека", "вечір", "робочий", "літо", None, None, "ні"),
    (None, "день", "робочий", "зима", "похмуро", "сильний", "ні"),
    (None, "вечір", "робочий", "зима", "похмуро", "помірний", "ні"),
    (None, "ранок", "робочий", "осінь", "похмуро", "сильний", "ні"),
    (None, "день", "робочий", "літо", "ясно", "тихий", "ні"),
    (None, "ніч", "робочий", None, "ясно", "тихий", "ні"),
    (None, "ніч", "вихідний", None, None, None, "ні"),
    (None, None, "вихідний", "зима", None, None, "ні"),
    (None, None, "вихідний", "літо", None, None, "ні"),
    (None, None, "вихідний", "осінь", None, None, "ні"),
    (None, None, "вихідний", "весна", None, None, "ні"),
    (None, None, None, None, None, None, "так"),
    (None, "ніч", "робочий", "зима", None, None, "ні"),
    (None, "ніч", "робочий", "літо", None, None, "ні"),
    (None, "вечір", "робочий", "зима", None, None, "ні"),
    (None, "вечір", "робочий", "літо", None, None, "ні"),
    (None, "ранок", "робочий", "зима", None, None, "ні"),
    (None, "ранок", "робочий", "літо", None, None, "ні"),
    ("мороз", None, "робочий", None, None, None, "ні"),
    ("спека", None, "робочий", None, None, None, "ні"),
    ("холодна", None, "робочий", None, "похмуро", "сильний", "ні"),
    ("тепла", None, "робочий", None, "ясно", "тихий", "ні"),
    ("помірна", "день", "робочий", None, "ясно", "тихий", "ні"),
]
N_RULES = len(RULES)

HOLIDAYS = {(1,1),(1,7),(3,8),(5,1),(5,2),(5,9),(6,28),(8,24),(10,14),(11,1),(12,25)}


# ─── Обчислення ваг правил ────────────────────────────────────────────────────

def _membership(var, label, value):
    if var == "season":  return season_mf(label, value)
    if var == "temp":    return tri(value, *TEMP_MFS[label])
    if var == "hour":    return tri(value, *HOUR_MFS[label])
    if var == "cloud":   return tri(value, *CLOUD_MFS[label])
    if var == "wind":    return tri(value, *WIND_MFS[label])
    if var == "day":     return tri(value, *DAY_MFS[label])
    if var == "holiday": return tri(value, *HOLIDAY_MFS[label])
    return 0.0

def _compute_weights(feats):
    w = np.zeros(N_RULES)
    for i, (tl, hl, dl, sl, cl, wl, hol) in enumerate(RULES):
        degs = []
        if tl:  degs.append(_membership("temp",    tl,  feats["temperature"]))
        if hl:  degs.append(_membership("hour",    hl,  feats["hour"]))
        if dl:  degs.append(_membership("day",     dl,  feats["is_weekend"]))
        if sl:  degs.append(_membership("season",  sl,  feats["month"]))
        if cl:  degs.append(_membership("cloud",   cl,  feats["cloud_cover"]))
        if wl:  degs.append(_membership("wind",    wl,  feats["wind_speed"]))
        if hol: degs.append(_membership("holiday", hol, feats["is_holiday"]))
        w[i] = min(degs) if degs else 0.0
    total = w.sum()
    return w / total if total > 0 else w


# ─── Завантаження даних ───────────────────────────────────────────────────────

def _load_consumption_from_gz(years: list) -> pd.DataFrame:
    """Читає стиснутий CSV з тренувальними даними."""
    if not CSV_GZ_PATH.exists():
        raise FileNotFoundError(f"Не знайдено {CSV_GZ_PATH}. Покладіть training_data.csv.gz в backend/data/")

    with gzip.open(CSV_GZ_PATH, "rt", encoding="utf-8-sig") as f:
        df = pd.read_csv(f)

    cons = df[(df["balance_component"] == "споживання") & (df["balance_subcomponent"].isna())].copy()
    cons["date_parsed"] = pd.to_datetime(cons["date"])
    cons["hour"] = cons["time"].str.split(":").str[0].astype(int)
    cons["year"] = cons["date_parsed"].dt.year
    cons = cons[cons["year"].isin(years)].copy()
    cons["datetime"] = cons["date_parsed"] + pd.to_timedelta(cons["hour"], unit="h")
    cons["consumption_gw"] = cons["amount"] / 1000.0
    return cons[["datetime","consumption_gw","hour","year"]].sort_values("datetime").reset_index(drop=True)


async def _fetch_weather_year(session, year: int) -> pd.DataFrame:
    """Завантажує погоду на цілий рік асинхронно."""
    url = (f"https://archive-api.open-meteo.com/v1/archive"
           f"?latitude={KYIV_LAT}&longitude={KYIV_LON}"
           f"&start_date={year}-01-01&end_date={year}-12-31"
           f"&hourly=temperature_2m,cloud_cover,wind_speed_10m"
           f"&timezone=Europe/Kyiv")
    async with session.get(url, timeout=aiohttp.ClientTimeout(total=60)) as resp:
        data = await resp.json()
        h = data["hourly"]
        return pd.DataFrame({
            "datetime":    pd.to_datetime(h["time"]),
            "temperature": h["temperature_2m"],
            "cloud_cover": h["cloud_cover"],
            "wind_speed":  h["wind_speed_10m"],
        })


async def _fetch_all_weather(years: list, progress_cb) -> pd.DataFrame:
    """Завантажує погоду на всі роки."""
    parts = []
    async with aiohttp.ClientSession() as session:
        for i, yr in enumerate(years):
            progress_cb(f"Погода {yr}", 10 + i * 6)
            try:
                df = await _fetch_weather_year(session, yr)
                parts.append(df)
            except Exception as e:
                print(f"⚠ Погода {yr} помилка: {e}")
    return pd.concat(parts, ignore_index=True) if parts else pd.DataFrame()


def _build_dataset(cons: pd.DataFrame, weather: pd.DataFrame) -> pd.DataFrame:
    """Об'єднує споживання і погоду."""
    if weather.empty:
        cons["temperature"] = cons["datetime"].dt.month.map(
            {1:-5,2:-3,3:3,4:10,5:17,6:21,7:23,8:22,9:16,10:9,11:3,12:-2})
        cons["cloud_cover"] = 50.0
        cons["wind_speed"]  = 5.0
        m = cons.copy()
    else:
        weather["datetime"] = weather["datetime"].dt.floor("h")
        cons["datetime"] = cons["datetime"].dt.floor("h")
        m = cons.merge(weather, on="datetime", how="left")
        m["temperature"] = m["temperature"].ffill().fillna(10.0)
        m["cloud_cover"] = m["cloud_cover"].ffill().fillna(50.0)
        m["wind_speed"]  = m["wind_speed"].ffill().fillna(5.0)

    m["month"]      = m["datetime"].dt.month
    m["weekday"]    = m["datetime"].dt.weekday
    m["is_weekend"] = (m["weekday"] >= 5).astype(float)
    m["is_holiday"] = m["datetime"].apply(lambda d: float((d.month,d.day) in HOLIDAYS))
    return m.dropna(subset=["consumption_gw"])


def _feats(row):
    return {
        "temperature": float(row.get("temperature", 10.0)),
        "hour":        float(row.get("hour", 12)),
        "is_weekend":  float(row.get("is_weekend", 0)),
        "month":       float(row.get("month", 6)),
        "cloud_cover": float(row.get("cloud_cover", 50.0)),
        "wind_speed":  float(row.get("wind_speed",  5.0)),
        "is_holiday":  float(row.get("is_holiday",  0)),
    }


def _train(df: pd.DataFrame, progress_cb):
    n = len(df)
    W = np.zeros((n, N_RULES))
    for i, (_, row) in enumerate(df.iterrows()):
        W[i] = _compute_weights(_feats(row))
        if i % 5000 == 0:
            pct = 50 + (i / n) * 30
            progress_cb(f"Формування матриці: {i}/{n}", int(pct))

    y = df["consumption_gw"].values
    base = float(y.mean())
    reg = Ridge(alpha=0.001, fit_intercept=True)
    reg.fit(W, y - base)
    return reg.coef_, base, float(reg.intercept_)


def _evaluate(df, consq, base, intercept):
    y_true = df["consumption_gw"].values
    y_pred = np.array([
        base + intercept + float(np.dot(_compute_weights(_feats(r)), consq))
        for _, r in df.iterrows()
    ])
    mape = float(np.mean(np.abs((y_true-y_pred)/(y_true+1e-6)))*100)
    rmse = float(np.sqrt(mean_squared_error(y_true, y_pred)))
    mae  = float(mean_absolute_error(y_true, y_pred))
    return {"mape": round(mape,3), "rmse_mw": round(rmse*1000,1), "mae_mw": round(mae*1000,1), "n": len(y_true)}


# ─── Головна функція навчання ─────────────────────────────────────────────────

async def retrain_model_async():
    """Реальне навчання моделі (async)."""
    started_at = time.time()
    started_iso = datetime.utcnow().isoformat() + "Z"
    _update_state(
        in_progress=True, progress=0, message="Старт навчання...",
        started_at=started_iso, finished_at=None, error=None, result=None,
    )

    def progress_cb(msg, pct):
        _update_state(progress=pct, message=msg)

    try:
        # 1. Завантаження CSV
        progress_cb("Розпакування CSV...", 5)
        all_years = TRAIN_YEARS + [VAL_YEAR, TEST_YEAR]
        cons = await asyncio.to_thread(_load_consumption_from_gz, all_years)
        progress_cb(f"Завантажено {len(cons)} годин споживання", 10)

        # 2. Завантаження погоди (паралельно)
        weather = await _fetch_all_weather(all_years, progress_cb)
        progress_cb(f"Погода: {len(weather)} годин", 40)

        # 3. Об'єднання
        progress_cb("Об'єднання даних...", 45)
        df_all = await asyncio.to_thread(_build_dataset, cons, weather)

        df_train = df_all[df_all["year"].isin(TRAIN_YEARS)]
        df_val   = df_all[df_all["year"] == VAL_YEAR]
        df_test  = df_all[df_all["year"] == TEST_YEAR]

        # 4. Навчання
        progress_cb("Формування матриці правил...", 50)
        consq, base, intercept = await asyncio.to_thread(_train, df_train, progress_cb)

        # 5. Метрики
        progress_cb("Оцінка на test...", 85)
        m_train = await asyncio.to_thread(_evaluate, df_train, consq, base, intercept)
        m_val   = await asyncio.to_thread(_evaluate, df_val,   consq, base, intercept)
        m_test  = await asyncio.to_thread(_evaluate, df_test,  consq, base, intercept)

        # 6. Базова крива
        df_train_copy = df_train.copy()
        df_train_copy["hour_int"] = df_train_copy["datetime"].dt.hour
        base_load = df_train_copy.groupby("hour_int")["consumption_gw"].mean().reindex(range(24)).round(3).tolist()

        # 7. Версія: інкремент patch number
        progress_cb("Збереження моделі...", 95)
        new_version = _next_version()

        duration = round(time.time() - started_at)
        model = {
            "version":       new_version,
            "training_date": datetime.now().strftime("%Y-%m-%d"),
            "training_duration_seconds": duration,
            "train_years":   TRAIN_YEARS,
            "val_year":      VAL_YEAR,
            "test_year":     TEST_YEAR,
            "rules_count":   N_RULES,
            "rules":         RULES,
            "membership_functions": {
                "temperature": TEMP_MFS,
                "hour":        HOUR_MFS,
                "cloud_cover": CLOUD_MFS,
                "wind_speed":  WIND_MFS,
            },
            "consequents":    consq.tolist(),
            "base_load_mean": base,
            "intercept":      intercept,
            "base_load_gw":   base_load,
            "metrics": {"train": m_train, "val": m_val, "test": m_test},
        }

        # 8. Збереження
        with open(MODEL_PATH, "wb") as f:
            pickle.dump(model, f)
        with open(METRICS_PATH, "w", encoding="utf-8") as f:
            json.dump({
                "version": new_version,
                "training_date": model["training_date"],
                "training_duration_seconds": duration,
                "rules_count": N_RULES,
                "input_variables": 7,
                "membership_functions_count": 26,
                "metrics": {"mape": m_test["mape"], "rmse": m_test["rmse_mw"], "mae": m_test["mae_mw"]},
            }, f, ensure_ascii=False, indent=2)

        # 9. Очистити кеш ANFIS
        try:
            from app.models import anfis as anfis_mod
            anfis_mod._MODEL = None
        except Exception:
            pass

        finished_iso = datetime.utcnow().isoformat() + "Z"
        result = {
            "version":  new_version,
            "duration": duration,
            "metrics":  {
                "mape": m_test["mape"],
                "rmse": m_test["rmse_mw"],
                "mae":  m_test["mae_mw"],
            },
        }

        # Зберігаємо запис про навчання в БД
        try:
            from app.services.db import save_training_record
            old_mape = None
            try:
                if MODEL_PATH.exists():
                    import json as _json
                    meta_path = MODEL_PATH.parent / "model_metadata.json"
                    if meta_path.exists():
                        with open(meta_path) as _f:
                            _meta = _json.load(_f)
                        old_mape = _meta.get("metrics", {}).get("test", {}).get("mape")
            except Exception:
                pass
            save_training_record(
                version=new_version,
                mape_before=old_mape,
                mape_after=m_test["mape"],
                rmse_after=m_test["rmse_mw"],
                mae_after=m_test["mae_mw"],
                duration_s=int(duration),
                started_at=started_iso,
                finished_at=finished_iso,
                status="success",
            )
        except Exception as _e:
            print(f"⚠ Не вдалось зберегти запис навчання: {_e}")

        _update_state(
            in_progress=False, progress=100,
            message=f"Готово! MAPE={m_test['mape']}%",
            finished_at=finished_iso, result=result,
        )

    except Exception as e:
        finished_iso = datetime.utcnow().isoformat() + "Z"
        try:
            from app.services.db import save_training_record
            save_training_record(
                version="unknown", mape_before=None, mape_after=None,
                rmse_after=None, mae_after=None, duration_s=0,
                started_at=started_iso, finished_at=finished_iso,
                status="error", error=str(e),
            )
        except Exception:
            pass
        _update_state(
            in_progress=False, progress=0,
            message=f"Помилка: {e}",
            finished_at=finished_iso, error=str(e),
        )
        raise


def _next_version() -> str:
    """Розраховує наступну версію (інкремент patch)."""
    try:
        if MODEL_PATH.exists():
            with open(MODEL_PATH, "rb") as f:
                old = pickle.load(f)
            old_v = old.get("version", "v3.1.0")
            # Парсимо vX.Y.Z
            parts = old_v.lstrip("v").split(".")
            if len(parts) == 3:
                major, minor, patch = int(parts[0]), int(parts[1]), int(parts[2])
                return f"v{major}.{minor}.{patch + 1}"
    except Exception:
        pass
    return "v3.1.1"


def start_retrain_background():
    """Запускає навчання в фоновому потоці (не блокує запит)."""
    with _STATE_LOCK:
        if _TRAINING_STATE["in_progress"]:
            return False
        _TRAINING_STATE.update({"in_progress": True, "progress": 0, "message": "Стартую..."})

    def _runner():
        try:
            asyncio.run(retrain_model_async())
        except Exception as e:
            print(f"⚠ retrain error: {e}")

    t = threading.Thread(target=_runner, daemon=True)
    t.start()
    return True
