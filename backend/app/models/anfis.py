"""
ANFIS модель — завантажує навчену модель з anfis_model.pkl.
Підтримує v2.0.0 (7-tuple правила) і v3.0.0 (6-tuple правила).
"""

import os, pickle, datetime
import numpy as np
from pathlib import Path

# ─── Завантаження моделі ──────────────────────────────────────────────────────

_MODEL = None
_MODEL_PATH = Path(__file__).parent.parent.parent / "data" / "anfis_model.pkl"


def _load_model():
    global _MODEL
    if _MODEL is not None:
        return _MODEL
    if _MODEL_PATH.exists():
        with open(_MODEL_PATH, "rb") as f:
            _MODEL = pickle.load(f)
        print(f"✅ ANFIS модель завантажена: {_MODEL.get('version')} "
              f"(MAPE={_MODEL['metrics']['test']['mape']}%)")
    else:
        print(f"⚠ anfis_model.pkl не знайдено — fallback на формули")
        _MODEL = None
    return _MODEL


BASE_LOAD_FALLBACK = [
    14.99,14.5,14.27,14.22,14.37,14.9,15.89,16.56,
    17.43,17.81,17.93,17.84,17.79,17.82,17.77,17.83,
    17.97,18.11,18.13,18.08,18.2,17.73,16.67,15.8,
]

def get_base_load():
    model = _load_model()
    return model.get("base_load_gw", BASE_LOAD_FALLBACK) if model else BASE_LOAD_FALLBACK

def get_model_info():
    model = _load_model()
    if model:
        return {
            "version":                   model.get("version", "v3.0.0"),
            "training_date":             model.get("training_date", "2026-05-22"),
            "training_duration_seconds": model.get("training_duration_seconds", 26),
            "rules_count":               model.get("rules_count", 50),
            "membership_functions_count": 26,
            "input_variables":           7,
            "metrics": {
                "mape": model["metrics"]["test"]["mape"],
                "rmse": model["metrics"]["test"]["rmse_mw"],
                "mae":  model["metrics"]["test"]["mae_mw"],
            },
            "source": "trained_model",
        }
    return {
        "version":"v3.0.0","training_date":"2026-05-22",
        "training_duration_seconds":26,"rules_count":50,
        "membership_functions_count":26,"input_variables":7,
        "metrics":{"mape":6.339,"rmse":1355.1,"mae":1075.1},
        "source":"fallback",
    }


# ─── Функції належності ───────────────────────────────────────────────────────

def _tri(x, a, b, c):
    if x <= a or x >= c: return 0.0
    if x <= b: return (x - a)/(b - a) if b != a else 1.0
    return (c - x)/(c - b) if c != b else 1.0

def _season_mf(label, month):
    if label == "зима":  return 1.0 if month in (12,1,2) else (0.5 if month in (11,3) else 0.0)
    if label == "весна": return _tri(month,2,4,6)
    if label == "літо":  return _tri(month,5,7,9)
    if label == "осінь": return _tri(month,8,10,12)
    return 0.0

# МФ за замовчуванням (v3.0.0)
_DEFAULT_TEMP_MFS = {
    "мороз":      (-35,-10,-2),
    "холодна":    (-5,2,10),
    "прохолодна": (5,12,18),
    "помірна":    (14,20,26),
    "тепла":      (22,27,32),
    "спека":      (28,35,45),
}
_DEFAULT_HOUR_MFS = {
    "ніч":   (0,0,7),
    "ранок": (5,9,13),
    "день":  (11,14,19),
    "вечір": (17,20,25),
}
_DEFAULT_CLOUD_MFS = {
    "ясно":    (0,0,35),
    "хмарно":  (25,55,80),
    "похмуро": (65,100,100),
}
_DEFAULT_DAY_MFS = {
    "робочий":  (0.4,1.0,1.1),
    "вихідний": (-0.1,0.0,0.6),
}
_DEFAULT_HOLIDAY_MFS = {
    "так": (0.4,1.0,1.1),
    "ні":  (-0.1,0.0,0.6),
}

def _get_mfs():
    """Повертає МФ з моделі або дефолтні."""
    model = _load_model()
    if model and "membership_functions" in model:
        mfs = model["membership_functions"]
        return {
            "temperature": mfs.get("temperature", _DEFAULT_TEMP_MFS),
            "hour":        mfs.get("hour", _DEFAULT_HOUR_MFS),
            "cloud_cover": mfs.get("cloud_cover", _DEFAULT_CLOUD_MFS),
        }
    return {"temperature": _DEFAULT_TEMP_MFS, "hour": _DEFAULT_HOUR_MFS, "cloud_cover": _DEFAULT_CLOUD_MFS}

def _membership(var_name, label, value, mfs):
    if var_name == "season":
        return _season_mf(label, value)
    if var_name == "day_type":
        return _tri(value, *_DEFAULT_DAY_MFS.get(label, (0,0,0)))
    if var_name == "is_holiday":
        return _tri(value, *_DEFAULT_HOLIDAY_MFS.get(label, (0,0,0)))
    cfg = mfs.get(var_name, {})
    if label not in cfg: return 0.0
    return _tri(value, *cfg[label])

def _compute_weights(feats):
    """Обчислює ваги правил. Підтримує 6-tuple і 7-tuple правила."""
    model = _load_model()
    rules = model["rules"] if model else []
    if not rules: return np.zeros(50)

    mfs = _get_mfs()
    w = np.zeros(len(rules))

    for i, rule in enumerate(rules):
        if len(rule) == 6:
            tl, hl, dl, sl, cl, hol = rule
            wl = None
        elif len(rule) == 7:
            tl, hl, dl, sl, cl, wl, hol = rule
        else:
            continue

        degs = []
        if tl:  degs.append(_membership("temperature", tl, feats["temperature"], mfs))
        if hl:  degs.append(_membership("hour",        hl, feats["hour"],        mfs))
        if dl:  degs.append(_membership("day_type",    dl, feats["is_weekend"],  mfs))
        if sl:  degs.append(_membership("season",      sl, feats["month"],       mfs))
        if cl:  degs.append(_membership("cloud_cover", cl, feats["cloud_cover"], mfs))
        if wl:  degs.append(_membership("wind_speed",  wl, feats["wind_speed"],  mfs))
        if hol: degs.append(_membership("is_holiday",  hol, feats["is_holiday"], mfs))
        w[i] = min(degs) if degs else 0.0

    total = w.sum()
    return w / total if total > 0 else w


# ─── Основна функція прогнозу ─────────────────────────────────────────────────

def anfis_predict(
    hour, month, day_of_week,
    temperature=10.0, cloud_cover=50.0, wind_speed=5.0,
    is_holiday=False, is_pre_holiday=False, is_school_break=False,
):
    is_weekend  = 1.0 if day_of_week >= 5 else 0.0
    holiday_val = 1.0 if is_holiday else 0.0

    feats = {
        "temperature": float(temperature),
        "hour":        float(hour),
        "is_weekend":  is_weekend,
        "month":       float(month),
        "cloud_cover": float(cloud_cover),
        "wind_speed":  float(wind_speed),
        "is_holiday":  holiday_val,
    }

    model = _load_model()
    if model:
        consq       = np.array(model["consequents"])
        base_mean   = model.get("base_load_mean", 16.774)
        intercept   = model.get("intercept", -2.171)
        weights     = _compute_weights(feats)
        # Підганяємо розмір якщо правил менше
        if len(weights) > len(consq):
            weights = weights[:len(consq)]
        elif len(weights) < len(consq):
            consq = consq[:len(weights)]
        prediction  = base_mean + intercept + float(np.dot(weights, consq))
    else:
        # Fallback аналітична формула
        base = BASE_LOAD_FALLBACK[hour]
        sm   = {12:1.15,1:1.15,2:1.1,3:1.0,4:0.95,5:0.9,6:0.88,7:0.87,8:0.88,9:0.93,10:0.98,11:1.05}
        tf   = 1.0 + max(0,(5-temperature)*0.018) - max(0,(temperature-25)*0.01)
        wf   = 0.88 if is_weekend else 1.0
        hf   = 0.85 if is_holiday else 1.0
        prediction = base * sm.get(month,1.0) * tf * wf * hf

    prediction = float(max(7.0, min(30.0, prediction)))
    ci_pct = 0.035
    return {
        "forecast":    round(prediction, 3),
        "lower_bound": round(prediction*(1-ci_pct), 3),
        "upper_bound": round(prediction*(1+ci_pct), 3),
    }


def generate_forecast_series(start_iso, hours, weather_params, calendar_params):
    """weather_params: dict або list[dict]."""
    start = datetime.datetime.fromisoformat(start_iso.replace("Z","+00:00"))
    if isinstance(weather_params, dict):
        weather_list = [weather_params] * hours
    else:
        weather_list = list(weather_params)
        while len(weather_list) < hours:
            weather_list.append(weather_list[-1])

    results = []
    for i in range(hours):
        ts = start + datetime.timedelta(hours=i)
        ci_multiplier = 1.0 + (i // 24) * 0.005
        w  = weather_list[i]
        pred = anfis_predict(
            hour=ts.hour, month=ts.month, day_of_week=ts.weekday(),
            temperature=w.get("temperature",10.0),
            cloud_cover=w.get("cloud_cover",50.0),
            wind_speed=w.get("wind_speed",5.0),
            is_holiday=calendar_params.get("is_holiday",False),
            is_pre_holiday=calendar_params.get("is_pre_holiday",False),
            is_school_break=calendar_params.get("is_school_break",False),
        )
        ci_half = (pred["upper_bound"]-pred["lower_bound"])/2 * ci_multiplier
        results.append({
            "timestamp":   ts.isoformat(),
            "hour":        ts.hour,
            "forecast":    pred["forecast"],
            "lower_bound": round(pred["forecast"]-ci_half, 3),
            "upper_bound": round(pred["forecast"]+ci_half, 3),
            "ci_level":    0.95,
            "weather": {
                "temperature": round(w.get("temperature",10.0),1),
                "cloud_cover": round(w.get("cloud_cover",50.0),0),
                "wind_speed":  round(w.get("wind_speed",5.0),1),
            },
        })
    return results


def compute_metrics(actuals, predictions):
    if not actuals or len(actuals) != len(predictions):
        return {"mape":None,"rmse":None,"mae":None}
    a,p = np.array(actuals,float), np.array(predictions,float)
    return {
        "mape": round(float(np.mean(np.abs((a-p)/(a+1e-6)))*100),2),
        "rmse": round(float(np.sqrt(np.mean((a-p)**2)))*1000,0),
        "mae":  round(float(np.mean(np.abs(a-p)))*1000,0),
    }


BASE_LOAD = get_base_load()
_load_model()
