// Mock data for analytics screens: Compare, Interpretation.
// Models metrics, 168h forecasts (5 models), hourly MAPE, membership functions, 26 fuzzy rules.

import { mulberry32, gauss, tri, roundTo, DAY_SHORT_UK } from '../utils';

// ====================== Model metrics table ======================
export const MODEL_METRICS = [
  { modelName: 'ANFIS',   mape: 2.14, rmse: 245, mae: 178, trainingTimeSeconds: 47,  interpretability: 'high'   },
  { modelName: 'LSTM',    mape: 2.31, rmse: 268, mae: 195, trainingTimeSeconds: 234, interpretability: 'low'    },
  { modelName: 'Prophet', mape: 3.12, rmse: 342, mae: 251, trainingTimeSeconds: 12,  interpretability: 'medium' },
  { modelName: 'SARIMAX', mape: 3.87, rmse: 412, mae: 318, trainingTimeSeconds: 8,   interpretability: 'medium' },
  { modelName: 'Naive',   mape: 7.24, rmse: 768, mae: 592, trainingTimeSeconds: 0,   interpretability: null     },
];

// ====================== 168h forecasts: 5 models + fact ======================
function loadCurve(hour) {
  // Daily double-peak (~8 та ~20) з невеликим weekend-зниженням
  const t = hour % 24;
  const morning = 3.4 * Math.exp(-Math.pow((t - 8.5) / 2.2, 2));
  const evening = 4.1 * Math.exp(-Math.pow((t - 20) / 2.5, 2));
  const base = 11.2;
  const overnight = -1.2 * Math.exp(-Math.pow((t - 3) / 2.4, 2));
  const day = Math.floor(hour / 24);
  const isWeekend = day === 0 || day === 6;
  const weekendAdj = isWeekend ? -0.8 : 0;
  return base + morning + evening + overnight + weekendAdj;
}

export const CHART_DATA_7D = (() => {
  const start = new Date('2026-05-03T00:00:00Z'); // Sunday
  const rAnfis   = mulberry32(101);
  const rLstm    = mulberry32(202);
  const rProphet = mulberry32(303);
  const rSarimax = mulberry32(404);
  const rNaive   = mulberry32(505);
  const rFact    = mulberry32(7);
  const arr = [];
  for (let h = 0; h < 168; h++) {
    const baseLd = loadCurve(h);
    const noiseFact = (rFact() - 0.5) * 0.3;
    const fact = baseLd + noiseFact;
    const errAnfis   = (rAnfis() - 0.5) * 0.55;
    const errLstm    = (rLstm() - 0.5) * 0.65;
    const errProphet = (rProphet() - 0.5) * 0.95 + Math.sin(h / 9) * 0.18;
    const errSarimax = (rSarimax() - 0.5) * 1.2 + Math.sin(h / 7) * 0.22;
    const naivePrev = h >= 24 ? arr[h - 24].fact : baseLd - 0.4;
    const naive = naivePrev + (rNaive() - 0.5) * 0.4;
    const d = new Date(start.getTime() + h * 3600 * 1000);
    arr.push({
      h,
      iso: d.toISOString(),
      date: d,
      label: DAY_SHORT_UK[d.getUTCDay()] + ' ' + String(d.getUTCHours()).padStart(2, '0'),
      fact: roundTo(fact, 3),
      anfis: roundTo(fact + errAnfis, 3),
      lstm: roundTo(fact + errLstm, 3),
      prophet: roundTo(fact + errProphet, 3),
      sarimax: roundTo(fact + errSarimax, 3),
      naive: roundTo(naive, 3),
    });
  }
  return arr;
})();

// ====================== Hourly MAPE per model ======================
function hourlyMape(modelIdx) {
  const base = [];
  for (let h = 0; h < 24; h++) {
    const morning = 2.5 * Math.exp(-Math.pow((h - 8) / 1.8, 2));
    const evening = 2.2 * Math.exp(-Math.pow((h - 20) / 1.8, 2));
    base.push(1.4 + morning + evening);
  }
  const scale = [1.0, 1.12, 1.42, 1.68]; // ANFIS, LSTM, Prophet, SARIMAX
  const r = mulberry32(60 + modelIdx);
  return base.map((v) => roundTo(v * scale[modelIdx] + (r() - 0.5) * 0.25, 2));
}
const HOURLY_MAPE = {
  ANFIS:   hourlyMape(0),
  LSTM:    hourlyMape(1),
  Prophet: hourlyMape(2),
  SARIMAX: hourlyMape(3),
};
export const HOURLY_MAPE_CHART = Array.from({ length: 24 }, (_, h) => ({
  hour: h,
  hourLabel: String(h).padStart(2, '0'),
  ANFIS:   HOURLY_MAPE.ANFIS[h],
  LSTM:    HOURLY_MAPE.LSTM[h],
  Prophet: HOURLY_MAPE.Prophet[h],
  SARIMAX: HOURLY_MAPE.SARIMAX[h],
}));

// ====================== Model line colors ======================
export const MODEL_COLORS = {
  fact: '#0F172A',
  factDark: '#E2E8F0',
  ANFIS: '#2563EB',
  LSTM: '#8B5CF6',
  Prophet: '#10B981',
  SARIMAX: '#F97316',
  Naive: '#94A3B8',
};

// ====================== Membership functions ======================
const MF_TEMP = (() => {
  const lines = [
    { key: 'verylow',  label: 'дуже низька', color: '#1E40AF', center: -20, sigma: 6 },
    { key: 'low',      label: 'низька',      color: '#3B82F6', center: -5,  sigma: 5.5 },
    { key: 'mid',      label: 'помірна',     color: '#64748B', center: 12,  sigma: 5 },
    { key: 'high',     label: 'висока',      color: '#F97316', center: 22,  sigma: 4.5 },
    { key: 'veryhigh', label: 'дуже висока', color: '#DC2626', center: 32,  sigma: 4 },
  ];
  const data = [];
  for (let x = -25; x <= 35; x += 1) {
    const row = { x };
    lines.forEach((l) => { row[l.key] = roundTo(gauss(x, l.center, l.sigma), 4); });
    data.push(row);
  }
  return { id: 'temp', title: 'Температура', subtitle: 'Розподіл температури на нечіткі категорії', xLabel: '°C', xKey: 'x', xType: 'number', data, lines };
})();

const MF_HOUR = (() => {
  const lines = [
    { key: 'night',   label: 'ніч',    color: '#1E3A8A', center: 2,  sigma: 2.5 },
    { key: 'morning', label: 'ранок',  color: '#F97316', center: 8,  sigma: 2.2 },
    { key: 'day',     label: 'день',   color: '#EAB308', center: 14, sigma: 2.5 },
    { key: 'evening', label: 'вечір',  color: '#8B5CF6', center: 20, sigma: 2.4 },
  ];
  const data = [];
  for (let x = 0; x <= 23; x += 0.5) {
    const row = { x };
    lines.forEach((l) => { row[l.key] = roundTo(gauss(x, l.center, l.sigma), 4); });
    data.push(row);
  }
  return { id: 'hour', title: 'Час доби', subtitle: 'Категоризація доби', xLabel: 'година', xKey: 'x', xType: 'number', data, lines };
})();

const MF_DOW = (() => {
  const days = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'нд'];
  const workday = [1, 1, 1, 1, 0.9, 0.15, 0.05];
  const weekend = [0, 0, 0, 0, 0.1, 0.85, 0.95];
  return {
    id: 'dow',
    title: 'День тижня',
    subtitle: 'Робочі та вихідні дні',
    xLabel: '', xKey: 'day', xType: 'category',
    data: days.map((d, i) => ({ day: d, working: workday[i], weekend: weekend[i] })),
    lines: [
      { key: 'working', label: 'робочий',  color: '#2563EB' },
      { key: 'weekend', label: 'вихідний', color: '#F97316' },
    ],
    mode: 'bar',
  };
})();

const MF_SEASON = (() => {
  const lines = [
    { key: 'winter', label: 'зима',  color: '#2563EB', center: 1,  sigma: 1.6, wrap: true },
    { key: 'spring', label: 'весна', color: '#10B981', center: 4,  sigma: 1.5 },
    { key: 'summer', label: 'літо',  color: '#EAB308', center: 7,  sigma: 1.5 },
    { key: 'autumn', label: 'осінь', color: '#F97316', center: 10, sigma: 1.5 },
  ];
  const data = [];
  for (let m = 1; m <= 12; m += 0.25) {
    const row = { m };
    lines.forEach((l) => {
      let v = gauss(m, l.center, l.sigma);
      if (l.wrap) v = Math.max(v, gauss(m, l.center + 12, l.sigma), gauss(m, l.center - 12, l.sigma));
      row[l.key] = roundTo(v, 4);
    });
    data.push(row);
  }
  return { id: 'season', title: 'Сезон', subtitle: 'Сезонна модель', xLabel: 'місяць', xKey: 'm', xType: 'number', data, lines };
})();

const MF_CLOUD = (() => {
  const lines = [
    { key: 'clear',    label: 'ясно',     color: '#EAB308', tri: [-10, 10, 50] },
    { key: 'partial',  label: 'змінна',   color: '#94A3B8', tri: [20, 50, 80] },
    { key: 'overcast', label: 'похмуро',  color: '#475569', tri: [50, 90, 110] },
  ];
  const data = [];
  for (let x = 0; x <= 100; x += 1) {
    const row = { x };
    lines.forEach((l) => { row[l.key] = roundTo(tri(x, ...l.tri), 4); });
    data.push(row);
  }
  return { id: 'cloud', title: 'Хмарність', subtitle: 'Стан небосхилу', xLabel: '%', xKey: 'x', xType: 'number', data, lines };
})();

const MF_WIND = (() => {
  const lines = [
    { key: 'calm',   label: 'тихо',    color: '#10B981', center: 2,  sigma: 2 },
    { key: 'medium', label: 'помірно', color: '#64748B', center: 8,  sigma: 2.5 },
    { key: 'strong', label: 'сильний', color: '#DC2626', center: 18, sigma: 3.2 },
  ];
  const data = [];
  for (let x = 0; x <= 25; x += 0.25) {
    const row = { x };
    lines.forEach((l) => { row[l.key] = roundTo(gauss(x, l.center, l.sigma), 4); });
    data.push(row);
  }
  return { id: 'wind', title: 'Швидкість вітру', subtitle: 'Інтенсивність вітру', xLabel: 'м/с', xKey: 'x', xType: 'number', data, lines };
})();

const MF_DAYTYPE = (() => ({
  id: 'daytype',
  title: 'Тип календарного дня',
  subtitle: 'Категорії дня — частка днів за рік',
  xLabel: '', xKey: 'cat', xType: 'category',
  data: [
    { cat: 'робочий',         weight: 1.00, color: '#2563EB' },
    { cat: 'передсвятковий',  weight: 0.65, color: '#8B5CF6' },
    { cat: 'вихідний',        weight: 0.92, color: '#F97316' },
    { cat: 'святковий',       weight: 0.80, color: '#DC2626' },
    { cat: 'канікули',        weight: 0.55, color: '#10B981' },
  ],
  lines: [{ key: 'weight', label: 'належність', color: '#2563EB' }],
  mode: 'bar-categorical',
}))();

export const MEMBERSHIP_FUNCTIONS = [MF_TEMP, MF_HOUR, MF_DOW, MF_SEASON, MF_CLOUD, MF_WIND, MF_DAYTYPE];

// ====================== 26 fuzzy rules ======================
export const RULES = [
  { antecedents: ['температура=дуже низька', 'час=ранок', 'день=робочий'], consequent: 'дуже високе', weight: 0.92 },
  { antecedents: ['температура=низька', 'час=ранок', 'день=робочий'],      consequent: 'високе',      weight: 0.87 },
  { antecedents: ['температура=низька', 'час=вечір', 'день=робочий'],      consequent: 'дуже високе', weight: 0.84 },
  { antecedents: ['температура=низька', 'хмарність=похмуро', 'час=вечір'], consequent: 'дуже високе', weight: 0.79 },
  { antecedents: ['температура=дуже низька', 'час=ніч', 'день=робочий'],   consequent: 'високе',      weight: 0.74 },
  { antecedents: ['температура=помірна', 'час=ніч', 'день=будь-який'],     consequent: 'низьке',      weight: 0.71 },
  { antecedents: ['день=святковий', 'час=будь-який'],                      consequent: 'низьке',      weight: 0.68 },
  { antecedents: ['температура=помірна', 'час=день', 'день=вихідний'],     consequent: 'середнє',     weight: 0.62 },
  { antecedents: ['температура=висока', 'час=день', 'день=робочий'],       consequent: 'високе',      weight: 0.58 },
  { antecedents: ['температура=помірна', 'час=вечір', 'день=вихідний'],    consequent: 'середнє',     weight: 0.56 },
  { antecedents: ['температура=дуже висока', 'час=день', 'сезон=літо'],    consequent: 'високе',      weight: 0.53 },
  { antecedents: ['хмарність=ясно', 'сезон=літо', 'час=день'],             consequent: 'знижене',     weight: 0.42 },
  { antecedents: ['вітер=сильний', 'температура=низька'],                   consequent: 'високе',      weight: 0.49 },
  { antecedents: ['температура=низька', 'час=день', 'день=робочий'],       consequent: 'високе',      weight: 0.61 },
  { antecedents: ['температура=помірна', 'час=ранок', 'день=робочий'],     consequent: 'високе',      weight: 0.65 },
  { antecedents: ['температура=висока', 'час=ніч', 'сезон=літо'],          consequent: 'середнє',     weight: 0.45 },
  { antecedents: ['температура=низька', 'час=ніч', 'день=робочий'],        consequent: 'середнє',     weight: 0.51 },
  { antecedents: ['сезон=весна', 'день=вихідний', 'час=день'],             consequent: 'середнє',     weight: 0.47 },
  { antecedents: ['сезон=осінь', 'температура=помірна', 'час=вечір'],      consequent: 'високе',      weight: 0.55 },
  { antecedents: ['день=передсвятковий', 'час=вечір'],                     consequent: 'високе',      weight: 0.50 },
  { antecedents: ['температура=дуже висока', 'хмарність=ясно', 'день=робочий'], consequent: 'високе', weight: 0.46 },
  { antecedents: ['температура=низька', 'вітер=сильний', 'час=вечір'],     consequent: 'дуже високе', weight: 0.43 },
  { antecedents: ['день=канікули', 'час=день'],                             consequent: 'знижене',     weight: 0.39 },
  { antecedents: ['температура=помірна', 'сезон=весна', 'час=ранок'],      consequent: 'середнє',     weight: 0.57 },
  { antecedents: ['температура=низька', 'сезон=зима', 'час=вечір'],        consequent: 'дуже високе', weight: 0.81 },
  { antecedents: ['температура=помірна', 'хмарність=змінна', 'час=день'],  consequent: 'середнє',     weight: 0.36 },
].map((r, i) => ({ id: 'R' + String(i + 1).padStart(2, '0'), ...r }));

// ====================== Active context for Interpretation page ======================
export const ACTIVE_CONTEXT = {
  iso: '2026-05-09T18:00:00Z',
  dateLabel: '9 травня 2026, 18:00',
  temperature: 8,
  dayOfWeekLabel: 'Субота (вихідний)',
  season: 'Весна',
  forecast: 13.5,
};

const ACTIVE_RULES_RAW = [
  { antecedents: ['температура=помірна', 'час=вечір', 'день=вихідний'], consequent: 'середнє', strength: 0.89 },
  { antecedents: ['день=вихідний', 'час=вечір'],                         consequent: 'середнє', strength: 0.76 },
  { antecedents: ['температура=помірна', 'сезон=весна'],                consequent: 'середнє', strength: 0.68 },
  { antecedents: ['час=вечір', 'сезон=весна'],                          consequent: 'середнє', strength: 0.52 },
  { antecedents: ['температура=помірна', 'час=вечір'],                  consequent: 'середнє', strength: 0.45 },
];

export const ACTIVE_RULES = (() => {
  const total = ACTIVE_RULES_RAW.reduce((s, r) => s + r.strength, 0);
  return ACTIVE_RULES_RAW.map((r, i) => ({
    id: 'AR' + (i + 1),
    ...r,
    contribution: roundTo((r.strength / total) * ACTIVE_CONTEXT.forecast, 2),
    pctOfTotal: roundTo((r.strength / total) * 100, 1),
  }));
})();

export const PIE_COLORS = ['#22C55E', '#10B981', '#F59E0B', '#94A3B8', '#64748B'];
