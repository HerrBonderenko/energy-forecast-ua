# Energy Forecast UA — Backend

FastAPI бекенд для прогнозування погодинного споживання електроенергії в ОЕС України на основі ANFIS.

## Структура

```
backend/
├── main.py                  # Точка входу FastAPI
├── requirements.txt         # Залежності
├── .env                     # Конфіг (ENTSOE_TOKEN)
├── app/
│   ├── models/
│   │   └── anfis.py         # ANFIS модель
│   ├── routers/
│   │   ├── forecast.py      # /api/forecast
│   │   ├── weather.py       # /api/weather
│   │   ├── history.py       # /api/history
│   │   └── model_info.py    # /api/model
│   └── services/
│       ├── openmeteo_client.py  # Open-Meteo API (без токену)
│       └── entsoe_client.py     # ENTSO-E API (потребує токен)
└── data/                    # Збережені моделі та БД
```

## Локальний запуск

### 1. Встановити залежності

```powershell
pip install -r requirements.txt
```

### 2. Налаштувати `.env`

Відкрийте `.env` і впишіть свій ENTSO-E токен (коли отримаєте від `transparency@entsoe.eu`):

```
ENTSOE_TOKEN=your-real-token-here
```

Якщо токену ще немає — система працює на mock-даних споживання + реальній погоді.

### 3. Запустити сервер

```powershell
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 4. Відкрити інтерактивну документацію

http://localhost:8000/docs

Тут можна тестувати всі endpoints через Swagger UI.

## Endpoints

| Метод | URL | Опис |
|---|---|---|
| GET | `/` | Інформація про сервіс |
| GET | `/health` | Health check |
| POST | `/api/forecast/` | Створити прогноз |
| GET | `/api/forecast/preview?hours=24` | Швидкий прогноз |
| GET | `/api/forecast/base-load` | Базова крива ОЕС |
| GET | `/api/weather/current` | Поточна погода (Київ) |
| GET | `/api/weather/forecast?hours=24` | Прогноз погоди |
| GET | `/api/history/?days=7` | Історія прогнозів |
| GET | `/api/model/info` | Метадані моделі |
| GET | `/api/model/metrics` | Метрики 5 моделей |
| GET | `/api/model/rules` | Нечіткі правила |

## Деплой на Render.com

1. Зареєструйтесь на [render.com](https://render.com)
2. New + → Web Service → підключіть GitHub
3. Налаштування:
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - Environment: додайте `ENTSOE_TOKEN` як secret
4. Deploy!

Free tier: 750 годин/місяць, засинає після 15хв неактивності (перший запит ~30с).
