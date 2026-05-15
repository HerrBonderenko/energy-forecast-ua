from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

load_dotenv()

from app.routers import forecast, weather, history, model_info

app = FastAPI(
    title="Energy Forecast UA — API",
    description="Прогнозування погодинного споживання електроенергії в ОЕС України (ANFIS)",
    version="1.0.0",
)

# CORS — дозволяємо фронтенд
origins = [
    "http://localhost:5173",
    "http://localhost:4173",
    os.getenv("FRONTEND_URL", ""),
    "https://*.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # для розробки — всі; на проді замінити на origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Роутери
app.include_router(forecast.router,    prefix="/api/forecast",  tags=["Прогноз"])
app.include_router(weather.router,     prefix="/api/weather",   tags=["Погода"])
app.include_router(history.router,     prefix="/api/history",   tags=["Історія"])
app.include_router(model_info.router,  prefix="/api/model",     tags=["Модель"])


@app.get("/")
def root():
    return {
        "service": "Energy Forecast UA API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
    }


@app.get("/health")
def health():
    return {"status": "ok"}
