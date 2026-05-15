// Mock data for scenarios, fuzzy rules, sensitivities.
// Used by Forecast, Scenario Analysis (what-if), My Scenarios, Interpretation pages.

import { baseLoad } from '../utils';

// Baseline: 9 травня 2026, 18:00, working day, 8°C, 40% cloud
export const BASELINE_DATE = '2026-05-09T18:00:00Z';
export const BASELINE_CURVE = Array.from({ length: 24 }, (_, h) => baseLoad(h));

// Scale a curve uniformly by percent
export function scaleCurve(curve, pct) {
  const f = 1 + pct / 100;
  return curve.map((v) => +(v * f).toFixed(2));
}

// 24h sparkline mapping helper
export function makeSparkline(curve) {
  return curve.map((v, i) => ({ x: i, y: v }));
}

// ---------------- Pre-seeded scenarios (artifact 2) ----------------
export const MOCK_SCENARIOS = [
  {
    id: 's1',
    name: 'Холодна зима \u221215°C',
    description: 'Імітація екстремально холодної зими з температурою на 15°C нижче норми',
    createdAt: '2026-05-05T10:24:00Z',
    deltaPct: 18.5,
    direction: 'up',
    curve: scaleCurve(BASELINE_CURVE, 18.5),
    deltas: { dTemp: -15, dCloud: 30, dWind: 2 },
  },
  {
    id: 's2',
    name: 'Спекотне літо +12°C',
    description: 'Літня спека з температурою на 12°C вище норми',
    createdAt: '2026-05-04T14:12:00Z',
    deltaPct: 9.2,
    direction: 'up',
    curve: scaleCurve(BASELINE_CURVE, 9.2),
    deltas: { dTemp: 12, dCloud: -20, dWind: -3 },
  },
  {
    id: 's3',
    name: 'Дощовий вихідний',
    description: 'Прохолодний дощовий день, що випадає на вихідний',
    createdAt: '2026-05-03T09:45:00Z',
    deltaPct: -4.1,
    direction: 'down',
    curve: scaleCurve(BASELINE_CURVE, -4.1),
    deltas: { dTemp: -3, dCloud: 50, dWind: 4, isWeekend: true },
  },
  {
    id: 's4',
    name: 'Свято серед тижня',
    description: 'Великдень припадає на середу, фактично як вихідний день',
    createdAt: '2026-05-02T16:30:00Z',
    deltaPct: -6.8,
    direction: 'down',
    curve: scaleCurve(BASELINE_CURVE, -6.8),
    deltas: { dTemp: 0, dCloud: 0, dWind: 0, isHoliday: true },
  },
  {
    id: 's5',
    name: 'Шкільні канікули',
    description: 'Період зимових канікул, знижене ранкове споживання',
    createdAt: '2026-05-01T11:00:00Z',
    deltaPct: -3.2,
    direction: 'down',
    curve: scaleCurve(BASELINE_CURVE, -3.2),
    deltas: { dTemp: -5, dCloud: 10, dWind: 0, isSchoolBreak: true },
  },
  {
    id: 's6',
    name: 'Передсвятковий пік',
    description: 'Передноворічний понеділок з пізніми покупками',
    createdAt: '2026-04-30T19:18:00Z',
    deltaPct: 2.1,
    direction: 'up',
    curve: scaleCurve(BASELINE_CURVE, 2.1),
    deltas: { dTemp: -2, dCloud: 30, dWind: 1, isPreHoliday: true },
  },
  {
    id: 's7',
    name: 'Стандартний робочий день',
    description: 'Контрольний сценарій без змін від базового',
    createdAt: '2026-04-28T08:00:00Z',
    deltaPct: 0,
    direction: 'neutral',
    curve: [...BASELINE_CURVE],
    deltas: {},
  },
  {
    id: 's8',
    name: 'Безвітряна спека',
    description: 'Спекотний день без вітру, активне кондиціонування',
    createdAt: '2026-04-25T13:50:00Z',
    deltaPct: 11.7,
    direction: 'up',
    curve: scaleCurve(BASELINE_CURVE, 11.7),
    deltas: { dTemp: 10, dCloud: -30, dWind: -8 },
  },
];

// Short fuzzy rules summary (for What-If / Scenario Analysis right panel)
export const FUZZY_RULES_SHORT = [
  { id: 'r1', text: 'ЯКЩО температура низька І час пік І робочий день, ТО споживання дуже високе', weight: 0.87 },
  { id: 'r2', text: 'ЯКЩО температура помірна І час день І вихідний, ТО споживання середнє',     weight: 0.62 },
  { id: 'r3', text: 'ЯКЩО температура висока І час вечір І робочий день, ТО споживання високе',  weight: 0.54 },
];

// Sensitivity ranking (% contribution to forecast)
export const SENSITIVITIES = [
  { feature: 'Температура', value: 78 },
  { feature: 'Час доби',    value: 65 },
  { feature: 'День тижня',  value: 42 },
  { feature: 'Свято',       value: 18 },
  { feature: 'Хмарність',   value: 14 },
  { feature: 'Вологість',   value: 12 },
];
