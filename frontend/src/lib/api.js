/**
 * API клієнт — підключення фронтенду до FastAPI бекенду.
 * Базовий URL береться з .env: VITE_API_URL
 * Локально: http://localhost:8000
 * На Render.com: https://energy-forecast-ua-api.onrender.com
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  try {
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`API ${res.status}: ${err}`);
    }
    return await res.json();
  } catch (e) {
    console.error(`[API] ${path}:`, e.message);
    throw e;
  }
}

// ── Погода ─────────────────────────────────────────────────────────────────
export async function getCurrentWeather() {
  return request('/api/weather/current');
}

export async function getWeatherForecast(hours = 24) {
  return request(`/api/weather/forecast?hours=${hours}`);
}

// ── Прогноз ────────────────────────────────────────────────────────────────
export async function createForecast({ start, hours, weather, calendar }) {
  return request('/api/forecast/', {
    method: 'POST',
    body: JSON.stringify({ start, hours, weather, calendar }),
  });
}

export async function getForecastPreview(hours = 24) {
  return request(`/api/forecast/preview?hours=${hours}`);
}

export async function getBaseLoadCurve() {
  return request('/api/forecast/base-load');
}

// Аліас для ForecastPage
export const getBaseLoad = getBaseLoadCurve;

// ── Модель ─────────────────────────────────────────────────────────────────
export async function getModelInfo() {
  return request('/api/model/info');
}

export async function getModelMetrics() {
  return request('/api/model/metrics');
}

export async function getFuzzyRules() {
  return request('/api/model/rules');
}

export async function getTrainingHistory() {
  return request('/api/model/training-history');
}

// ── Історія ────────────────────────────────────────────────────────────────
export async function getHistory({ days = 7, limit = 50 } = {}) {
  return request(`/api/history/?days=${days}&limit=${limit}`);
}

// ── Health check ───────────────────────────────────────────────────────────
export async function checkHealth() {
  try {
    const data = await request('/health');
    return data.status === 'ok';
  } catch {
    return false;
  }
}
