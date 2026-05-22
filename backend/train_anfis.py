"""
train_anfis.py — навчання ANFIS-моделі на реальних даних ОЕС України 2017–2021.

Використовує:
  - CSV з map.ua-energy.org (погодинний баланс ОЕС)
  - Open-Meteo Archive API (погода Київ)

Результат: anfis_model.pkl — файл з параметрами навченої моделі.

Запуск:
  pip install scikit-fuzzy pandas numpy scipy scikit-learn joblib aiohttp requests
  python train_anfis.py --csv 2025_10_14_pohodynnyi_balans.csv
"""

import argparse
import json
import math
import os
import pickle
import time
from datetime import datetime, timedelta

import numpy as np
import pandas as pd
import requests
from sklearn.linear_model import Ridge
from sklearn.metrics import mean_absolute_error, mean_squared_error
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

# ─── Константи ────────────────────────────────────────────────────────────────
TRAIN_YEARS = [2017, 2018, 2019]
VAL_YEAR    = 2020
TEST_YEAR   = 2021

KYIV_LAT = 50.45
KYIV_LON  = 30.52

# Лінгвістичні змінні ANFIS (7 змінних)
LINGUISTIC_VARS = {
    "temperature": {
        "низька":  (-30, -30, 0),    # (a, b, c) трикутна МФ
        "помірна": (-5, 10, 20),
        "висока":  (15, 35, 35),
    },
    "hour": {
        "ніч":    (0, 0, 6),
        "ранок":  (5, 8, 12),
        "день":   (11, 14, 18),
        "вечір":  (17, 20, 24),
    },
    "day_type": {
        "робочий":  (0.4, 1.0, 1.1),   # is_weekend=0 → вихідний, 1 → робочий
        "вихідний": (-0.1, 0.0, 0.6),
    },
    "season": {
        "зима":  (11, 12, 3),   # грудень-лютий (через 0 не йде, використаємо окремо)
        "весна": (2, 4, 6),
        "літо":  (5, 7, 9),
        "осінь": (8, 10, 12),
    },
    "cloud_cover": {
        "ясно":    (0, 0, 30),
        "хмарно":  (20, 50, 80),
        "похмуро": (70, 100, 100),
    },
    "wind_speed": {
        "тихий":    (0, 0, 5),
        "помірний": (3, 8, 15),
        "сильний":  (12, 20, 40),
    },
    "is_holiday": {
        "так": (0.4, 1.0, 1.1),
        "ні":  (-0.1, 0.0, 0.6),
    },
}

# Спеціальна обробка зими (місяці 12, 1, 2)
def _season_mf(label: str, month: float) -> float:
    if label == "зима":
        return 1.0 if month in (12, 1, 2) else (0.5 if month in (11, 3) else 0.0)
    elif label == "весна":
        return tri_mf(month, 2, 4, 6)
    elif label == "літо":
        return tri_mf(month, 5, 7, 9)
    elif label == "осінь":
        return tri_mf(month, 8, 10, 12)
    return 0.0

# 26 нечітких правил (IF ... THEN consumption = k)
RULES = [
    # temperature, hour,   day_type,   season,  cloud, wind, is_holiday
    ("низька",  "ніч",    "робочий",  "зима",  None,   None, "ні"),
    ("низька",  "ранок",  "робочий",  "зима",  None,   None, "ні"),
    ("низька",  "день",   "робочий",  "зима",  None,   None, "ні"),
    ("низька",  "вечір",  "робочий",  "зима",  None,   None, "ні"),
    ("низька",  "вечір",  "вихідний", "зима",  None,   None, "ні"),
    ("помірна", "ніч",    "робочий",  "осінь", None,   None, "ні"),
    ("помірна", "ранок",  "робочий",  "осінь", None,   None, "ні"),
    ("помірна", "день",   "робочий",  "осінь", None,   None, "ні"),
    ("помірна", "вечір",  "робочий",  "осінь", None,   None, "ні"),
    ("помірна", "вечір",  "вихідний", "осінь", None,   None, "ні"),
    ("помірна", "ніч",    "робочий",  "весна", None,   None, "ні"),
    ("помірна", "ранок",  "робочий",  "весна", None,   None, "ні"),
    ("помірна", "день",   "робочий",  "весна", None,   None, "ні"),
    ("помірна", "вечір",  "робочий",  "весна", None,   None, "ні"),
    ("помірна", "вечір",  "вихідний", "весна", None,   None, "ні"),
    ("висока",  "ніч",    "робочий",  "літо",  None,   None, "ні"),
    ("висока",  "ранок",  "робочий",  "літо",  None,   None, "ні"),
    ("висока",  "день",   "робочий",  "літо",  None,   None, "ні"),
    ("висока",  "вечір",  "робочий",  "літо",  None,   None, "ні"),
    ("висока",  "вечір",  "вихідний", "літо",  None,   None, "ні"),
    (None,      None,     "вихідний", None,    None,   None, "ні"),
    (None,      None,     None,       None,    None,   None, "так"),  # свято
    ("низька",  "ранок",  "робочий",  "зима",  "похмуро", "сильний", "ні"),
    ("висока",  "день",   "робочий",  "літо",  "ясно",    "тихий",   "ні"),
    (None,      "вечір",  "робочий",  "зима",  None,   None, "ні"),
    (None,      "ранок",  "робочий",  "зима",  None,   None, "ні"),
]


# ─── Допоміжні функції ────────────────────────────────────────────────────────

def tri_mf(x: float, a: float, b: float, c: float) -> float:
    """Трикутна функція належності."""
    if x <= a or x >= c:
        return 0.0
    if x <= b:
        return (x - a) / (b - a) if b != a else 1.0
    return (c - x) / (c - b) if c != b else 1.0


def membership(var_name: str, label: str, value: float) -> float:
    """Ступінь належності значення до лінгвістичного терму."""
    if var_name == "season":
        return _season_mf(label, value)
    if var_name not in LINGUISTIC_VARS or label not in LINGUISTIC_VARS[var_name]:
        return 0.0
    a, b, c = LINGUISTIC_VARS[var_name][label]
    return tri_mf(value, a, b, c)


def rule_firing(rule: tuple, features: dict) -> float:
    """Ступінь спрацювання правила (мін по всіх умовах)."""
    temp_label, hour_label, day_label, season_label, cloud_label, wind_label, holiday_label = rule
    degrees = []
    if temp_label:
        degrees.append(membership("temperature", temp_label, features["temperature"]))
    if hour_label:
        degrees.append(membership("hour", hour_label, features["hour"]))
    if day_label:
        degrees.append(membership("day_type", day_label, features["is_weekend"]))
    if season_label:
        degrees.append(membership("season", season_label, features["month"]))
    if cloud_label:
        degrees.append(membership("cloud_cover", cloud_label, features["cloud_cover"]))
    if wind_label:
        degrees.append(membership("wind_speed", wind_label, features["wind_speed"]))
    if holiday_label:
        degrees.append(membership("is_holiday", holiday_label, features["is_holiday"]))
    return min(degrees) if degrees else 0.0


def compute_rule_weights(features: dict) -> np.ndarray:
    """Обчислює вектор ступенів спрацювання 26 правил."""
    weights = np.array([rule_firing(r, features) for r in RULES])
    total = weights.sum()
    if total > 0:
        weights = weights / total  # нормування
    return weights


def features_from_row(row: pd.Series) -> dict:
    """Перетворює рядок датафрейму у словник ознак для ANFIS."""
    return {
        "temperature": float(row.get("temperature", 10.0)),
        "hour":        float(row.get("hour", 12)),
        "is_weekend":  float(row.get("is_weekend", 0)),
        "month":       float(row.get("month", 6)),
        "cloud_cover": float(row.get("cloud_cover", 50.0)),
        "wind_speed":  float(row.get("wind_speed", 5.0)),
        "is_holiday":  float(row.get("is_holiday", 0)),
    }


def anfis_predict(features: dict, consequents: np.ndarray) -> float:
    """Прогноз ANFIS: зважена сума консеквентів (Sugeno 0-го порядку)."""
    weights = compute_rule_weights(features)
    return float(np.dot(weights, consequents))


# ─── Завантаження погодних даних ──────────────────────────────────────────────

def fetch_weather(start_date: str, end_date: str) -> pd.DataFrame:
    """Завантажує погодинні дані Open-Meteo Archive для Києва."""
    print(f"  Завантаження погоди {start_date} → {end_date}...")
    url = (
        f"https://archive-api.open-meteo.com/v1/archive"
        f"?latitude={KYIV_LAT}&longitude={KYIV_LON}"
        f"&start_date={start_date}&end_date={end_date}"
        f"&hourly=temperature_2m,cloud_cover,wind_speed_10m"
        f"&timezone=Europe/Kyiv"
    )
    try:
        resp = requests.get(url, timeout=60)
        resp.raise_for_status()
        data = resp.json()["hourly"]
        df = pd.DataFrame({
            "datetime":    pd.to_datetime(data["time"]),
            "temperature": data["temperature_2m"],
            "cloud_cover": data["cloud_cover"],
            "wind_speed":  data["wind_speed_10m"],
        })
        print(f"    → {len(df)} годин погоди отримано")
        return df
    except Exception as e:
        print(f"    ⚠ Помилка завантаження погоди: {e}")
        return pd.DataFrame()


# ─── Завантаження даних споживання ────────────────────────────────────────────

def load_consumption(csv_path: str, years: list) -> pd.DataFrame:
    """Читає CSV і витягує погодинне споживання за вказані роки."""
    print(f"Читання CSV: {csv_path}")
    df = pd.read_csv(csv_path, encoding="utf-8-sig")

    # Фільтруємо тільки споживання
    cons = df[
        (df["balance_component"] == "споживання") &
        (df["balance_subcomponent"].isna())
    ].copy()

    # Парсимо дату і час
    cons["date_parsed"] = pd.to_datetime(cons["date"])
    cons["hour"] = cons["time"].str.split(":").str[0].astype(int)
    cons["year"] = cons["date_parsed"].dt.year

    # Фільтруємо роки
    cons = cons[cons["year"].isin(years)].copy()
    cons["datetime"] = cons["date_parsed"] + pd.to_timedelta(cons["hour"], unit="h")
    cons = cons.rename(columns={"amount": "consumption_mw"})
    cons["consumption_gw"] = cons["consumption_mw"] / 1000.0

    result = cons[["datetime", "consumption_gw", "hour", "year"]].copy()
    result = result.sort_values("datetime").reset_index(drop=True)
    print(f"  → {len(result)} годин споживання за {years}")
    return result


# ─── Формування датасету ──────────────────────────────────────────────────────

UKRAINE_HOLIDAYS = {
    (1, 1), (1, 7), (3, 8), (5, 1), (5, 2), (5, 9), (6, 28),
    (8, 24), (10, 14), (11, 1), (12, 25),
}


def build_dataset(cons: pd.DataFrame, weather: pd.DataFrame) -> pd.DataFrame:
    """Об'єднує споживання і погоду, додає ознаки."""
    # Округлюємо datetime до години для join
    weather["datetime"] = weather["datetime"].dt.floor("h")
    cons["datetime"] = cons["datetime"].dt.floor("h")

    merged = cons.merge(weather, on="datetime", how="left")

    # Заповнюємо пропуски погоди (forward fill)
    merged["temperature"] = merged["temperature"].ffill().fillna(10.0)
    merged["cloud_cover"]  = merged["cloud_cover"].ffill().fillna(50.0)
    merged["wind_speed"]   = merged["wind_speed"].ffill().fillna(5.0)

    # Календарні ознаки
    merged["month"]      = merged["datetime"].dt.month
    merged["weekday"]    = merged["datetime"].dt.weekday  # 0=пн, 6=нд
    merged["is_weekend"] = (merged["weekday"] >= 5).astype(float)
    merged["is_holiday"] = merged["datetime"].apply(
        lambda dt: float((dt.month, dt.day) in UKRAINE_HOLIDAYS)
    )

    merged = merged.dropna(subset=["consumption_gw"])
    print(f"  Датасет: {len(merged)} рядків після об'єднання")
    return merged


# ─── Навчання ─────────────────────────────────────────────────────────────────

def train(df: pd.DataFrame):
    """Навчає ANFIS: підбирає консеквенти методом гібридного навчання (LSE).
    
    Архітектура: y = base_load + sum(w_i * c_i)
    де base_load — середнє споживання, c_i — навчені відхилення від базового рівня.
    """
    print("\nФормування матриці ознак...")
    n = len(df)

    # Базовий рівень — середнє по тренувальній вибірці
    y = df["consumption_gw"].values
    base_load_mean = float(np.mean(y))
    y_centered = y - base_load_mean  # центруємо таргет

    # Будуємо матрицю W: кожен рядок = нормовані ступені спрацювання 26 правил
    W = np.zeros((n, len(RULES)))
    for i, (_, row) in enumerate(df.iterrows()):
        feats = features_from_row(row)
        W[i] = compute_rule_weights(feats)
        if i % 5000 == 0:
            print(f"  {i}/{n} рядків оброблено...", end="\r")

    print(f"  {n}/{n} рядків оброблено.   ")
    print(f"  Середнє споживання (base): {base_load_mean:.3f} ГВт")
    sparsity = (W == 0).mean()
    print(f"  Розрідженість матриці W: {sparsity:.1%}")

    # LSE (Ridge regression) на центрованому таргеті
    print("Навчання (Ridge LSE на центрованих даних)...")
    reg = Ridge(alpha=0.1, fit_intercept=True)
    reg.fit(W, y_centered)
    consequents = reg.coef_

    print(f"  Інтерцепт: {reg.intercept_:.3f} ГВт")
    print(f"  Консеквенти: min={consequents.min():.3f}, max={consequents.max():.3f}")
    return consequents, base_load_mean, float(reg.intercept_)


def evaluate(df: pd.DataFrame, consequents: np.ndarray, base_load_mean: float, intercept: float) -> dict:
    """Обчислює метрики якості на датафреймі."""
    y_true = df["consumption_gw"].values
    y_pred = np.array([
        base_load_mean + intercept + anfis_predict(features_from_row(row), consequents)
        for _, row in df.iterrows()
    ])

    mape = float(np.mean(np.abs((y_true - y_pred) / (y_true + 1e-6))) * 100)
    rmse = float(np.sqrt(mean_squared_error(y_true, y_pred)))
    mae  = float(mean_absolute_error(y_true, y_pred))
    bias = float(np.mean(y_pred - y_true))

    return {
        "mape": round(mape, 3),
        "rmse_gw": round(rmse, 4),
        "rmse_mw": round(rmse * 1000, 1),
        "mae_gw":  round(mae, 4),
        "mae_mw":  round(mae * 1000, 1),
        "bias_gw": round(bias, 4),
        "n":       len(y_true),
    }


# ─── Main ─────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--csv", required=True, help="Шлях до CSV з балансом ОЕС")
    parser.add_argument("--out", default="anfis_model.pkl", help="Шлях збереження моделі")
    parser.add_argument("--no-weather", action="store_true", help="Не завантажувати погоду (тест)")
    args = parser.parse_args()

    t0 = time.time()

    # 1. Завантаження споживання
    all_years = TRAIN_YEARS + [VAL_YEAR, TEST_YEAR]
    cons = load_consumption(args.csv, all_years)

    # 2. Завантаження погоди (по роках щоб не перевантажити API)
    if args.no_weather:
        weather_all = pd.DataFrame()
    else:
        weather_parts = []
        for yr in all_years:
            w = fetch_weather(f"{yr}-01-01", f"{yr}-12-31")
            if not w.empty:
                weather_parts.append(w)
            time.sleep(1)  # щоб не тригерити rate limit
        weather_all = pd.concat(weather_parts, ignore_index=True) if weather_parts else pd.DataFrame()

    # 3. Формування датасету
    print("\nОб'єднання даних...")
    if weather_all.empty:
        # Якщо погоди немає — генеруємо типові значення за місяцем
        print("  ⚠ Погода недоступна, використовуємо сезонні замінники")
        cons["temperature"] = cons["datetime"].dt.month.map(
            {1:-5, 2:-3, 3:3, 4:10, 5:17, 6:21, 7:23, 8:22, 9:16, 10:9, 11:3, 12:-2}
        )
        cons["cloud_cover"] = 50.0
        cons["wind_speed"]  = 5.0
        df_all = cons.copy()
        df_all["month"]      = df_all["datetime"].dt.month
        df_all["weekday"]    = df_all["datetime"].dt.weekday
        df_all["is_weekend"] = (df_all["weekday"] >= 5).astype(float)
        df_all["is_holiday"] = df_all["datetime"].apply(
            lambda dt: float((dt.month, dt.day) in UKRAINE_HOLIDAYS)
        )
    else:
        df_all = build_dataset(cons, weather_all)

    # 4. Розбивка train/val/test
    df_train = df_all[df_all["year"].isin(TRAIN_YEARS)]
    df_val   = df_all[df_all["year"] == VAL_YEAR]
    df_test  = df_all[df_all["year"] == TEST_YEAR]
    print(f"\nРозбивка: train={len(df_train)}, val={len(df_val)}, test={len(df_test)}")

    # 5. Навчання
    print("\n=== НАВЧАННЯ ===")
    consequents, base_load_mean, intercept = train(df_train)

    # 6. Оцінка
    print("\n=== МЕТРИКИ ===")
    m_train = evaluate(df_train, consequents, base_load_mean, intercept)
    m_val   = evaluate(df_val,   consequents, base_load_mean, intercept)
    m_test  = evaluate(df_test,  consequents, base_load_mean, intercept)

    for name, m in [("Train", m_train), ("Val", m_val), ("Test", m_test)]:
        print(f"  {name}: MAPE={m['mape']}%  RMSE={m['rmse_mw']} МВт  MAE={m['mae_mw']} МВт  Bias={m['bias_gw']:.3f} ГВт")

    # 7. Базова крива (середній добовий профіль 2017-2021)
    df_train["hour_int"] = df_train["datetime"].dt.hour
    base_load = (
        df_train.groupby("hour_int")["consumption_gw"]
        .mean()
        .reindex(range(24))
        .round(3)
        .tolist()
    )
    print(f"\nБазова крива: {[round(v, 2) for v in base_load]}")

    # 8. Збереження моделі
    model = {
        "version": "v2.0.0",
        "training_date": datetime.now().strftime("%Y-%m-%d"),
        "training_duration_seconds": round(time.time() - t0),
        "train_years": TRAIN_YEARS,
        "val_year": VAL_YEAR,
        "test_year": TEST_YEAR,
        "rules_count": len(RULES),
        "rules": RULES,
        "membership_functions": LINGUISTIC_VARS,
        "consequents": consequents.tolist(),
        "base_load_mean": base_load_mean,
        "intercept": intercept,
        "base_load_gw": base_load,
        "metrics": {
            "train": m_train,
            "val":   m_val,
            "test":  m_test,
        },
    }

    with open(args.out, "wb") as f:
        pickle.dump(model, f)

    # Зберігаємо також JSON-версію метрик для бекенду
    metrics_path = args.out.replace(".pkl", "_metrics.json")
    with open(metrics_path, "w", encoding="utf-8") as f:
        json.dump({
            "version":                  model["version"],
            "training_date":            model["training_date"],
            "training_duration_seconds": model["training_duration_seconds"],
            "rules_count":              model["rules_count"],
            "input_variables":          7,
            "membership_functions_count": sum(len(v) for v in LINGUISTIC_VARS.values()),
            "metrics": {
                "mape": m_test["mape"],
                "rmse": m_test["rmse_mw"],
                "mae":  m_test["mae_mw"],
            },
        }, f, ensure_ascii=False, indent=2)

    print(f"\n✅ Модель збережена: {args.out}")
    print(f"✅ Метрики збережені: {metrics_path}")
    print(f"✅ Час навчання: {round(time.time() - t0)} сек")


if __name__ == "__main__":
    main()
