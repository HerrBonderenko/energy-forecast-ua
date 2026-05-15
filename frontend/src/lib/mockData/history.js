// History mock data — 248 forecasts spanning last 30 days.

import { mulberry32 } from '../utils';

const MONTH_SHORT_UK = ['січ', 'лют', 'бер', 'кві', 'трав', 'чер', 'лип', 'сер', 'вер', 'жов', 'лис', 'гру'];

function pad2(n) { return n < 10 ? '0' + n : '' + n; }

function formatDateTimeUk(iso) {
  const d = new Date(iso);
  return `${d.getDate()} ${MONTH_SHORT_UK[d.getMonth()]} ${d.getFullYear()}, ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function formatNumUk(v, digits = 2) {
  if (v == null || Number.isNaN(v)) return '—';
  return v.toFixed(digits).replace('.', ',');
}

export const PRECIPITATION_LABELS_UK = {
  none: 'Без опадів',
  'rain-light': 'Дощ слабкий',
  'rain-heavy': 'Дощ сильний',
  'snow-light': 'Сніг слабкий',
  'snow-heavy': 'Сніг сильний',
  thunderstorm: 'Гроза',
};

const HORIZON_OPTIONS = [
  { v: '1h',  weight: 0.60, hours: 1   },
  { v: '24h', weight: 0.25, hours: 24  },
  { v: '7d',  weight: 0.15, hours: 168 },
];

const MODEL_VERSIONS = ['v1.0.0', 'v1.1.5', 'v1.2.0', 'v1.2.3'];
const PRECIPITATIONS = ['none', 'rain-light', 'rain-heavy', 'snow-light', 'thunderstorm'];

const rand = mulberry32(42);

function pickHorizon() {
  const r = rand();
  let acc = 0;
  for (const h of HORIZON_OPTIONS) {
    acc += h.weight;
    if (r < acc) return h;
  }
  return HORIZON_OPTIONS[0];
}

// Baseline consumption (GW) - typical UEL load shape
function baselineLoad(date) {
  const h = date.getHours();
  const dow = date.getDay();
  const hourly = [
    11.8, 11.2, 10.8, 10.6, 10.7, 11.0, 12.2, 13.8,
    15.1, 15.7, 15.9, 15.8, 15.6, 15.4, 15.2, 15.1,
    15.4, 16.2, 16.8, 16.5, 15.7, 14.5, 13.4, 12.5,
  ];
  let v = hourly[h];
  if (dow === 0 || dow === 6) v *= 0.92;
  return v;
}

function generatePoints(startTime, hours, mapeTarget, hasActual) {
  const out = [];
  const step = hours <= 24 ? 1 : hours <= 168 ? 6 : 24;
  const pointCount = Math.max(2, Math.floor(hours / step));
  for (let i = 0; i < pointCount; i++) {
    const t = new Date(startTime.getTime() + i * step * 3600 * 1000);
    const base = baselineLoad(t);
    const forecast = base * (1 + (rand() - 0.5) * 0.02);
    let actual = null;
    if (hasActual) {
      const err = (rand() - 0.5) * 2 * (mapeTarget / 100) * forecast;
      actual = forecast + err;
    }
    const ciHalf = forecast * 0.04;
    out.push({
      timestamp: t.toISOString(),
      actual,
      forecast,
      lowerBound: forecast - ciHalf,
      upperBound: forecast + ciHalf,
    });
  }
  return out;
}

function makeForecast(index, baseDate) {
  const horizon = pickHorizon();
  const ageDays = (index / 248) * 30 + (rand() - 0.5) * 2;
  const created = new Date(baseDate.getTime() - ageDays * 86400 * 1000);
  const startTime = new Date(created.getTime() + 3600 * 1000);
  const startInFuture = startTime.getTime() > baseDate.getTime();
  const hasActual = !startInFuture;

  let mape;
  const r = rand();
  if (r < 0.55)        mape = rand() * 2;
  else if (r < 0.85)   mape = 2 + rand() * 3;
  else                 mape = 5 + rand() * 2;
  const quality = mape < 2 ? 'excellent' : mape < 5 ? 'good' : 'poor';

  const points = generatePoints(startTime, horizon.hours, mape, hasActual);
  const avgForecast = points.reduce((s, p) => s + (p.forecast || 0), 0) / points.length;
  const avgActual = hasActual ? points.reduce((s, p) => s + (p.actual || 0), 0) / points.length : null;

  const source = rand() < 0.8 ? 'auto' : 'manual';
  const modelVersion = MODEL_VERSIONS[Math.min(MODEL_VERSIONS.length - 1, Math.floor(rand() * 5))];

  const isStorm = mape > 5.5 && rand() < 0.6;
  const weather = {
    temperature: Math.round((4 + rand() * 18) * 10) / 10,
    humidity: Math.round(40 + rand() * 50),
    windSpeed: Math.round((1 + rand() * 9) * 10) / 10,
    cloudCover: Math.round(rand() * 100),
    pressure: Math.round(1000 + rand() * 30),
    precipitation: isStorm
      ? 'thunderstorm'
      : (rand() < 0.3 ? PRECIPITATIONS[Math.floor(rand() * 4)] : 'none'),
  };

  const dow = startTime.getDay();
  const calendar = {
    isWeekend: dow === 0 || dow === 6,
    isHoliday: rand() < 0.04,
    isPreHoliday: rand() < 0.04,
    isSchoolBreak: rand() < 0.1,
    dayOfWeek: dow,
    dayOfYear: Math.floor((startTime - new Date(startTime.getFullYear(), 0, 0)) / 86400000),
    hourOfDay: startTime.getHours(),
  };

  const horizonLabel = horizon.v === '1h' ? '+1 год' : horizon.v === '24h' ? '+24 год' : '+7 днів';

  let analysis;
  if (!hasActual) {
    analysis = 'Прогноз очікує надходження фактичних даних. Аналіз помилки буде доступний після завершення прогнозного періоду.';
  } else {
    const sign = avgActual > avgForecast ? 'занижений' : 'завищений';
    if (quality === 'excellent') {
      analysis = `Прогноз був ${sign} лише на ${formatNumUk(mape, 2)} %. Це в межах нормальної точності моделі для звичайного робочого дня.`;
    } else if (quality === 'good') {
      analysis = `Прогноз був ${sign} на ${formatNumUk(mape, 2)} % через помірне відхилення метеорологічних умов від кліматологічного середнього.`;
    } else {
      analysis = weather.precipitation === 'thunderstorm'
        ? `Прогноз був ${sign} на ${formatNumUk(mape, 2)} % через грозову бурю, яка не була передбачена погодним сервісом.`
        : `Прогноз був ${sign} на ${formatNumUk(mape, 2)} % через невраховане підвищення промислової активності у вечірній період.`;
    }
  }

  return {
    id: `f-${index.toString().padStart(4, '0')}`,
    createdAt: created.toISOString(),
    startTime: startTime.toISOString(),
    horizon: horizon.v,
    horizonLabel,
    source,
    modelVersion,
    avgForecast,
    avgActual,
    mape: hasActual ? mape : null,
    quality: hasActual ? quality : null,
    predictedValues: points,
    actualValues: hasActual ? points : null,
    inputs: { weather, calendar },
    analysis,
  };
}

const BASE_DATE = new Date('2026-05-08T14:00:00');

const _all = (() => {
  const arr = [];
  for (let i = 0; i < 248; i++) arr.push(makeForecast(i, BASE_DATE));
  arr.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
  const withActuals = arr.filter((a) => a.mape != null);
  let best = withActuals[0];
  let worst = withActuals[0];
  for (const f of withActuals) {
    if (f.mape < best.mape) best = f;
    if (f.mape > worst.mape) worst = f;
  }
  return {
    forecasts: arr,
    best,
    worst,
    avgMape: withActuals.reduce((s, f) => s + f.mape, 0) / withActuals.length,
  };
})();

export const HISTORY_FORECASTS = _all.forecasts;
export const HISTORY_BEST = _all.best;
export const HISTORY_WORST = _all.worst;
export const HISTORY_AVG_MAPE = _all.avgMape;
export { formatDateTimeUk, formatNumUk, MODEL_VERSIONS };
