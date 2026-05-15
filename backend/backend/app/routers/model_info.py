from fastapi import APIRouter
from app.services.entsoe_client import is_configured as entsoe_ready

router = APIRouter()


@router.get("/info")
def get_model_info():
    """Метадані активної моделі ANFIS."""
    return {
        "name": "ANFIS",
        "type": "Sugeno-type fuzzy inference system",
        "version": "v1.2.3",
        "training_date": "2026-05-02",
        "training_duration_seconds": 47,
        "rules_count": 26,
        "membership_functions_count": 26,
        "input_variables": 7,
        "metrics": {
            "mape": 2.14,
            "rmse": 245,
            "mae": 178,
        },
        "data_sources": {
            "consumption": {
                "name": "ENTSO-E Transparency Platform",
                "status": "connected" if entsoe_ready() else "pending",
            },
            "weather": {
                "name": "Open-Meteo Historical Weather API",
                "status": "connected",
            },
        },
    }


@router.get("/metrics")
def compare_models():
    """Метрики 5 моделей для порівняння."""
    return {
        "models": [
            {"name": "ANFIS",   "mape": 2.14, "rmse": 245, "mae": 178, "training_time_s": 47,  "interpretability": "high"},
            {"name": "LSTM",    "mape": 2.31, "rmse": 268, "mae": 195, "training_time_s": 234, "interpretability": "low"},
            {"name": "Prophet", "mape": 3.12, "rmse": 342, "mae": 251, "training_time_s": 12,  "interpretability": "medium"},
            {"name": "SARIMAX", "mape": 3.87, "rmse": 412, "mae": 318, "training_time_s": 8,   "interpretability": "medium"},
            {"name": "Naive",   "mape": 7.24, "rmse": 768, "mae": 592, "training_time_s": 0,   "interpretability": None},
        ],
        "test_period": "May 3-9, 2026",
        "test_points": 168,
    }


@router.get("/rules")
def get_fuzzy_rules():
    """Перелік 26 нечітких правил."""
    return {
        "count": 26,
        "format": "ЯКЩО <умова1> І <умова2> І ... ТО споживання=<категорія>",
        "rules": [
            {"id": 1,  "antecedents": ["температура=дуже_низька", "час=ранок", "день=робочий"],     "consequent": "дуже_високе", "weight": 0.92},
            {"id": 2,  "antecedents": ["температура=низька", "час=ранок", "день=робочий"],           "consequent": "високе",       "weight": 0.87},
            {"id": 3,  "antecedents": ["температура=низька", "час=вечір", "день=робочий"],           "consequent": "дуже_високе", "weight": 0.84},
            # ... (повний список — у мокових даних фронтенду)
        ],
    }
