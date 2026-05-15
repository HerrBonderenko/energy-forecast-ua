# Energy Forecast UA

Бакалаврський дипломний проєкт: прогнозування погодинного споживання електроенергії в ОЕС України на основі ANFIS (Adaptive Neuro-Fuzzy Inference System).

**Автор:** Бондаренко Олег Васильович
**Керівник:** Бібічков Ігор Євгенович
**Кафедра штучного інтелекту, ХНУРЕ, 2026**

## Live Demo

- **Frontend:** https://energy-forecast-ua.vercel.app
- **API Backend:** https://energy-forecast-ua-api.onrender.com
- **API Docs (Swagger):** https://energy-forecast-ua-api.onrender.com/docs

## Стек технологій

**Frontend:**
- React 18 + Vite 5
- Tailwind CSS 3
- Recharts
- React Router 6

**Backend:**
- FastAPI
- scikit-fuzzy (ANFIS)
- NumPy, Pandas
- Open-Meteo API (погода)
- ENTSO-E API (споживання)

## Локальний запуск

### Backend

```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Відкрийте `http://localhost:5173` у браузері.

## Структура

```
energy-forecast-ua/
├── frontend/           # React SPA
└── backend/            # FastAPI + ANFIS
```
