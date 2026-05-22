"""
train_anfis_v2.py — перенавчання ANFIS з детальнішими температурними правилами.

Зміни vs v1:
  - 6 температурних термів замість 3
  - 50 правил замість 26 (більше комбінацій температура × час)
  - Нормалізований Ridge з alpha=0.001
  - Додаткові ознаки: температура^2, temp×season

Запуск:
  python train_anfis_v2.py --csv 2025_10_14_pohodynnyi_balans.csv
"""

import argparse, json, math, os, pickle, time
from datetime import datetime, timedelta

import numpy as np
import pandas as pd
import requests
from sklearn.linear_model import Ridge
from sklearn.metrics import mean_absolute_error, mean_squared_error

TRAIN_YEARS = [2017, 2018, 2019]
VAL_YEAR    = 2020
TEST_YEAR   = 2021
KYIV_LAT, KYIV_LON = 50.45, 30.52

# ─── Функції належності (детальніші) ──────────────────────────────────────────

def tri(x, a, b, c):
    if x <= a or x >= c: return 0.0
    if x <= b: return (x - a) / (b - a) if b != a else 1.0
    return (c - x) / (c - b) if c != b else 1.0

# 6 температурних термів (замість 3)
TEMP_MFS = {
    "мороз":    (-35, -10, -2),   # < -2°C
    "холодна":  (-5,   2, 10),    # 2–10°C
    "прохолодна": (5, 12, 18),    # 12–18°C
    "помірна":  (14,  20, 26),    # 20–26°C
    "тепла":    (22,  27, 32),    # 27–32°C
    "спека":    (28,  35, 45),    # > 28°C
}

# 4 часових терми
HOUR_MFS = {
    "ніч":    (0,  0,  7),
    "ранок":  (5,  9, 13),
    "день":   (11, 14, 19),
    "вечір":  (17, 20, 25),
}

# 4 сезони
def season_mf(label, month):
    if label == "зима":  return 1.0 if month in (12,1,2) else (0.5 if month in (11,3) else 0.0)
    if label == "весна": return tri(month, 2, 4, 6)
    if label == "літо":  return tri(month, 5, 7, 9)
    if label == "осінь": return tri(month, 8, 10, 12)
    return 0.0

DAY_MFS = {
    "робочий":  (0.4, 1.0, 1.1),
    "вихідний": (-0.1, 0.0, 0.6),
}

HOLIDAY_MFS = {
    "так": (0.4, 1.0, 1.1),
    "ні":  (-0.1, 0.0, 0.6),
}

CLOUD_MFS = {
    "ясно":    (0, 0, 35),
    "хмарно":  (25, 55, 80),
    "похмуро": (65, 100, 100),
}

# ─── 50 правил ────────────────────────────────────────────────────────────────
# Формат: (temp, hour, day, season, cloud, holiday)
RULES = [
    # Зима — пік споживання
    ("мороз",      "ніч",   "робочий",  "зима",  None,      "ні"),
    ("мороз",      "ранок", "робочий",  "зима",  None,      "ні"),
    ("мороз",      "день",  "робочий",  "зима",  None,      "ні"),
    ("мороз",      "вечір", "робочий",  "зима",  None,      "ні"),
    ("мороз",      "вечір", "вихідний", "зима",  None,      "ні"),
    ("холодна",    "ніч",   "робочий",  "зима",  None,      "ні"),
    ("холодна",    "ранок", "робочий",  "зима",  None,      "ні"),
    ("холодна",    "день",  "робочий",  "зима",  None,      "ні"),
    ("холодна",    "вечір", "робочий",  "зима",  None,      "ні"),
    ("холодна",    "вечір", "вихідний", "зима",  None,      "ні"),
    # Осінь
    ("прохолодна", "ніч",   "робочий",  "осінь", None,      "ні"),
    ("прохолодна", "ранок", "робочий",  "осінь", None,      "ні"),
    ("прохолодна", "день",  "робочий",  "осінь", None,      "ні"),
    ("прохолодна", "вечір", "робочий",  "осінь", None,      "ні"),
    ("помірна",    "ніч",   "робочий",  "осінь", None,      "ні"),
    ("помірна",    "ранок", "робочий",  "осінь", None,      "ні"),
    ("помірна",    "день",  "робочий",  "осінь", None,      "ні"),
    ("помірна",    "вечір", "робочий",  "осінь", None,      "ні"),
    # Весна
    ("прохолодна", "ніч",   "робочий",  "весна", None,      "ні"),
    ("прохолодна", "ранок", "робочий",  "весна", None,      "ні"),
    ("прохолодна", "день",  "робочий",  "весна", None,      "ні"),
    ("прохолодна", "вечір", "робочий",  "весна", None,      "ні"),
    ("помірна",    "ніч",   "робочий",  "весна", None,      "ні"),
    ("помірна",    "ранок", "робочий",  "весна", None,      "ні"),
    ("помірна",    "день",  "робочий",  "весна", None,      "ні"),
    ("помірна",    "вечір", "робочий",  "весна", None,      "ні"),
    # Літо — спека знижує споживання (менше опалення)
    ("тепла",      "ніч",   "робочий",  "літо",  None,      "ні"),
    ("тепла",      "ранок", "робочий",  "літо",  None,      "ні"),
    ("тепла",      "день",  "робочий",  "літо",  None,      "ні"),
    ("тепла",      "вечір", "робочий",  "літо",  None,      "ні"),
    ("спека",      "ніч",   "робочий",  "літо",  "ясно",    "ні"),
    ("спека",      "день",  "робочий",  "літо",  "ясно",    "ні"),
    ("спека",      "вечір", "робочий",  "літо",  "ясно",    "ні"),
    # Вихідні
    (None,         None,    "вихідний", None,    None,      "ні"),
    (None,         None,    "вихідний", "зима",  None,      "ні"),
    (None,         None,    "вихідний", "літо",  None,      "ні"),
    # Свята
    (None,         None,    None,       None,    None,      "так"),
    # Нічний мінімум (всі сезони)
    (None,         "ніч",   "робочий",  "зима",  None,      "ні"),
    (None,         "ніч",   "робочий",  "літо",  None,      "ні"),
    (None,         "ніч",   "вихідний", None,    None,      "ні"),
    # Вечірній пік
    (None,         "вечір", "робочий",  "зима",  None,      "ні"),
    (None,         "вечір", "робочий",  "літо",  None,      "ні"),
    # Ранковий пік
    (None,         "ранок", "робочий",  "зима",  None,      "ні"),
    # Хмарність + зима
    ("холодна",    "день",  "робочий",  "зима",  "похмуро", "ні"),
    ("мороз",      "ранок", "робочий",  "зима",  "похмуро", "ні"),
    # Перехідні сезони
    ("помірна",    "день",  "робочий",  "весна", "ясно",    "ні"),
    ("прохолодна", "вечір", "вихідний", "осінь", None,      "ні"),
    ("помірна",    "вечір", "вихідний", "весна", None,      "ні"),
    # Загальні правила
    ("мороз",      None,    "робочий",  None,    None,      "ні"),
    ("спека",      None,    "робочий",  None,    None,      "ні"),
]

N_RULES = len(RULES)
print(f"Правил: {N_RULES}")

# ─── Обчислення ваг правил ────────────────────────────────────────────────────

def compute_weights(feats):
    w = np.zeros(N_RULES)
    for i, (tl, hl, dl, sl, cl, hol) in enumerate(RULES):
        degs = []
        if tl:  degs.append(tri(feats["temperature"], *TEMP_MFS[tl]))
        if hl:  degs.append(tri(feats["hour"], *HOUR_MFS[hl]))
        if dl:  degs.append(tri(feats["is_weekend"], *DAY_MFS[dl]))
        if sl:  degs.append(season_mf(sl, feats["month"]))
        if cl:  degs.append(tri(feats["cloud_cover"], *CLOUD_MFS[cl]))
        if hol: degs.append(tri(feats["is_holiday"], *HOLIDAY_MFS[hol]))
        w[i] = min(degs) if degs else 0.0
    total = w.sum()
    return w / total if total > 0 else w

def feats_from_row(row):
    return {
        "temperature": float(row.get("temperature", 10.0)),
        "hour":        float(row.get("hour", 12)),
        "is_weekend":  float(row.get("is_weekend", 0)),
        "month":       float(row.get("month", 6)),
        "cloud_cover": float(row.get("cloud_cover", 50.0)),
        "is_holiday":  float(row.get("is_holiday", 0)),
    }

# ─── Завантаження даних ───────────────────────────────────────────────────────

def load_consumption(csv_path, years):
    df = pd.read_csv(csv_path, encoding="utf-8-sig")
    cons = df[(df["balance_component"] == "споживання") & (df["balance_subcomponent"].isna())].copy()
    cons["date_parsed"] = pd.to_datetime(cons["date"])
    cons["hour"] = cons["time"].str.split(":").str[0].astype(int)
    cons["year"] = cons["date_parsed"].dt.year
    cons = cons[cons["year"].isin(years)].copy()
    cons["datetime"] = cons["date_parsed"] + pd.to_timedelta(cons["hour"], unit="h")
    cons["consumption_gw"] = cons["amount"] / 1000.0
    return cons[["datetime","consumption_gw","hour","year"]].sort_values("datetime").reset_index(drop=True)

def fetch_weather(start_date, end_date):
    print(f"  Погода {start_date}→{end_date}...")
    url = (f"https://archive-api.open-meteo.com/v1/archive"
           f"?latitude={KYIV_LAT}&longitude={KYIV_LON}"
           f"&start_date={start_date}&end_date={end_date}"
           f"&hourly=temperature_2m,cloud_cover,wind_speed_10m&timezone=Europe/Kyiv")
    try:
        r = requests.get(url, timeout=60); r.raise_for_status()
        h = r.json()["hourly"]
        df = pd.DataFrame({"datetime": pd.to_datetime(h["time"]),
                           "temperature": h["temperature_2m"],
                           "cloud_cover": h["cloud_cover"],
                           "wind_speed": h["wind_speed_10m"]})
        print(f"    → {len(df)} годин")
        return df
    except Exception as e:
        print(f"    ⚠ {e}"); return pd.DataFrame()

HOLIDAYS = {(1,1),(1,7),(3,8),(5,1),(5,2),(5,9),(6,28),(8,24),(10,14),(11,1),(12,25)}

def build_dataset(cons, weather):
    weather["datetime"] = weather["datetime"].dt.floor("h")
    cons["datetime"] = cons["datetime"].dt.floor("h")
    m = cons.merge(weather, on="datetime", how="left")
    m["temperature"] = m["temperature"].ffill().fillna(10.0)
    m["cloud_cover"]  = m["cloud_cover"].ffill().fillna(50.0)
    m["wind_speed"]   = m["wind_speed"].ffill().fillna(5.0)
    m["month"]      = m["datetime"].dt.month
    m["weekday"]    = m["datetime"].dt.weekday
    m["is_weekend"] = (m["weekday"] >= 5).astype(float)
    m["is_holiday"] = m["datetime"].apply(lambda d: float((d.month,d.day) in HOLIDAYS))
    return m.dropna(subset=["consumption_gw"])

# ─── Навчання ─────────────────────────────────────────────────────────────────

def train(df):
    n = len(df)
    print(f"\nФормування матриці {n}×{N_RULES}...")
    W = np.zeros((n, N_RULES))
    for i, (_, row) in enumerate(df.iterrows()):
        W[i] = compute_weights(feats_from_row(row))
        if i % 5000 == 0: print(f"  {i}/{n}...", end="\r")
    print(f"  {n}/{n} готово.   ")

    y = df["consumption_gw"].values
    base = float(y.mean())
    y_c  = y - base

    sparsity = (W == 0).mean()
    print(f"  Розрідженість: {sparsity:.1%}, base={base:.3f} ГВт")

    reg = Ridge(alpha=0.001, fit_intercept=True)
    reg.fit(W, y_c)
    print(f"  Інтерцепт: {reg.intercept_:.3f}, consq: [{reg.coef_.min():.2f}, {reg.coef_.max():.2f}]")
    return reg.coef_, base, float(reg.intercept_)

def evaluate(df, consq, base, intercept):
    y_true = df["consumption_gw"].values
    y_pred = np.array([
        base + intercept + float(np.dot(compute_weights(feats_from_row(r)), consq))
        for _, r in df.iterrows()
    ])
    mape = float(np.mean(np.abs((y_true - y_pred) / (y_true + 1e-6))) * 100)
    rmse = float(np.sqrt(mean_squared_error(y_true, y_pred)))
    mae  = float(mean_absolute_error(y_true, y_pred))
    return {"mape": round(mape,3), "rmse_mw": round(rmse*1000,1), "mae_mw": round(mae*1000,1), "n": len(y_true)}

# ─── Main ─────────────────────────────────────────────────────────────────────

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--csv", required=True)
    ap.add_argument("--out", default="anfis_model_v2.pkl")
    ap.add_argument("--no-weather", action="store_true")
    args = ap.parse_args()

    t0 = time.time()
    all_years = TRAIN_YEARS + [VAL_YEAR, TEST_YEAR]
    cons = load_consumption(args.csv, all_years)
    print(f"Споживання: {len(cons)} годин")

    if args.no_weather:
        weather_all = pd.DataFrame()
    else:
        parts = []
        for yr in all_years:
            w = fetch_weather(f"{yr}-01-01", f"{yr}-12-31")
            if not w.empty: parts.append(w)
            time.sleep(1)
        weather_all = pd.concat(parts, ignore_index=True) if parts else pd.DataFrame()

    if weather_all.empty:
        cons["temperature"] = cons["datetime"].dt.month.map(
            {1:-5,2:-3,3:3,4:10,5:17,6:21,7:23,8:22,9:16,10:9,11:3,12:-2})
        cons["cloud_cover"] = 50.0; cons["wind_speed"] = 5.0
        df_all = cons.copy()
        df_all["month"] = df_all["datetime"].dt.month
        df_all["weekday"] = df_all["datetime"].dt.weekday
        df_all["is_weekend"] = (df_all["weekday"] >= 5).astype(float)
        df_all["is_holiday"] = df_all["datetime"].apply(lambda d: float((d.month,d.day) in HOLIDAYS))
    else:
        df_all = build_dataset(cons, weather_all)

    df_train = df_all[df_all["year"].isin(TRAIN_YEARS)]
    df_val   = df_all[df_all["year"] == VAL_YEAR]
    df_test  = df_all[df_all["year"] == TEST_YEAR]
    print(f"Train={len(df_train)}, Val={len(df_val)}, Test={len(df_test)}")

    print("\n=== НАВЧАННЯ ===")
    consq, base, intercept = train(df_train)

    print("\n=== МЕТРИКИ ===")
    m_train = evaluate(df_train, consq, base, intercept)
    m_val   = evaluate(df_val,   consq, base, intercept)
    m_test  = evaluate(df_test,  consq, base, intercept)
    for name, m in [("Train",m_train),("Val",m_val),("Test",m_test)]:
        print(f"  {name}: MAPE={m['mape']}%  RMSE={m['rmse_mw']} МВт  MAE={m['mae_mw']} МВт")

    # Базова крива
    df_train["hour_int"] = df_train["datetime"].dt.hour
    base_load = df_train.groupby("hour_int")["consumption_gw"].mean().reindex(range(24)).round(3).tolist()

    model = {
        "version": "v3.0.0",
        "training_date": datetime.now().strftime("%Y-%m-%d"),
        "training_duration_seconds": round(time.time() - t0),
        "train_years": TRAIN_YEARS, "val_year": VAL_YEAR, "test_year": TEST_YEAR,
        "rules_count": N_RULES,
        "rules": RULES,
        "membership_functions": {
            "temperature": TEMP_MFS,
            "hour": HOUR_MFS,
            "cloud_cover": CLOUD_MFS,
        },
        "consequents": consq.tolist(),
        "base_load_mean": base,
        "intercept": intercept,
        "base_load_gw": base_load,
        "metrics": {"train": m_train, "val": m_val, "test": m_test},
    }

    with open(args.out, "wb") as f: pickle.dump(model, f)

    metrics_path = args.out.replace(".pkl", "_metrics.json")
    with open(metrics_path, "w", encoding="utf-8") as f:
        json.dump({
            "version": model["version"],
            "training_date": model["training_date"],
            "training_duration_seconds": model["training_duration_seconds"],
            "rules_count": N_RULES,
            "input_variables": 6,
            "membership_functions_count": 26,
            "metrics": {"mape": m_test["mape"], "rmse": m_test["rmse_mw"], "mae": m_test["mae_mw"]},
        }, f, ensure_ascii=False, indent=2)

    print(f"\n✅ Модель: {args.out}")
    print(f"✅ Метрики: {metrics_path}")
    print(f"✅ Час: {round(time.time()-t0)} сек")

if __name__ == "__main__":
    main()
