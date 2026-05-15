// Spent helpers: classnames, formatters, constants, forecast math.

export const NBSP = ' '; // non-breaking space
export const MINUS = '-'; // proper minus sign

// ----------------- Date constants ----------------
export const MONTH_SHORT_UK = [
  'січ', 'лют', 'бер', 'кві', 'трав', 'чер',
  'лип', 'сер', 'вер', 'жов', 'лис', 'гру',
];
export const MONTH_LONG_UK = [
  'січня', 'лютого', 'березня', 'квітня', 'травня', 'червня',
  'липня', 'серпня', 'вересня', 'жовтня', 'листопада', 'грудня',
];
export const DAY_SHORT_UK = ['нд', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];
export const DAY_LONG_UK = [
  'неділя', 'понеділок', 'вівторок', 'середа',
  'четвер', 'п\u2019ятниця', 'субота',
];

// "now" anchor — fixed for stable layouts in demo
export const NOW = new Date('2026-05-08T14:32:00');
export const NOW_HOUR_ANCHOR = new Date('2026-05-08T14:00:00');

// ----------------- classnames ----------------
export function cx(...parts) {
  return parts
    .flat(Infinity)
    .filter((x) => typeof x === 'string' && x)
    .join(' ');
}
export const cn = cx;

// ----------------- Seeded random ----------------
export function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function uid(prefix = 'id') {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

// Gaussian PDF (unnormalized peak = 1)
export function gauss(x, center, sigma) {
  return Math.exp(-Math.pow((x - center) / sigma, 2));
}

// Triangular membership (peak at b, zeros at a and c)
export function tri(x, a, b, c) {
  if (x <= a || x >= c) return 0;
  if (x === b) return 1;
  if (x < b) return (x - a) / (b - a);
  return (c - x) / (c - b);
}

// Round to N decimals
export function roundTo(n, decimals = 2) {
  const m = Math.pow(10, decimals);
  return Math.round(n * m) / m;
}

// ----------------- Number formatting ----------------
// "14,8" — comma decimal with proper minus
export function fmtDecimal(n, digits = 1) {
  if (n === null || n === undefined || Number.isNaN(n)) return '—';
  const abs = Math.abs(n);
  const fixed = abs.toFixed(digits);
  const [intPart, decPart] = fixed.split('.');
  const intFormatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, NBSP);
  const s = digits > 0 ? `${intFormatted},${decPart}` : intFormatted;
  return n < 0 ? MINUS + s : s;
}
// Backwards-compat alias
export const formatDecimal = fmtDecimal;

// "14 800" — non-breaking-space thousands
export function fmtInt(n) {
  if (n === null || n === undefined || Number.isNaN(n)) return '—';
  const sign = n < 0 ? MINUS : '';
  return sign + Math.abs(Math.round(n)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, NBSP);
}
export const formatInt = fmtInt;

// "14,8 ГВт"
export function fmtGW(n, digits = 1) {
  return fmtDecimal(n, digits) + NBSP + 'ГВт';
}
export const formatGW = fmtGW;

// "+8 °C", "-15 °C"
export function fmtTemp(n, digits = 0) {
  return fmtDecimal(n, digits) + NBSP + '°C';
}
export const formatTemp = fmtTemp;

// "+0,8 %" / "-0,3 %" / "0,0 %"
export function fmtSignedPercent(n, digits = 1, suffix = '%') {
  if (n === null || n === undefined || Number.isNaN(n)) return '—';
  const v = fmtDecimal(Math.abs(n), digits);
  if (n > 0) return `+${v}${NBSP}${suffix}`;
  if (n < 0) return `${MINUS}${v}${NBSP}${suffix}`;
  return `${v}${NBSP}${suffix}`;
}

// "+1,2 ГВт" / "-0,3 ГВт"
export function fmtSignedGW(n, digits = 1) {
  if (n === null || n === undefined || Number.isNaN(n)) return '—';
  const v = fmtDecimal(Math.abs(n), digits);
  if (n > 0) return `+${v}${NBSP}ГВт`;
  if (n < 0) return `${MINUS}${v}${NBSP}ГВт`;
  return `${v}${NBSP}ГВт`;
}

// Generic signed delta "+5 °C" / "-3"
export function fmtDelta(n, unit = '', digits = 0) {
  if (n === null || n === undefined || Number.isNaN(n)) return '—';
  const sign = n > 0 ? '+' : n < 0 ? MINUS : '';
  const v = fmtDecimal(Math.abs(n), digits);
  return sign + v + (unit ? NBSP + unit : '');
}

// ----------------- Date formatting ----------------
// "8 трав, 14:00"
export function fmtDateTime(d) {
  const day = d.getDate();
  const mon = MONTH_SHORT_UK[d.getMonth()];
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${day}${NBSP}${mon}, ${hh}:${mm}`;
}

// "8 травня 2026, 14:32"
export function fmtDateFull(d) {
  return `${d.getDate()} ${MONTH_LONG_UK[d.getMonth()]} ${d.getFullYear()}, ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// "пн 14:00"
export function fmtDayHour(d) {
  return `${DAY_SHORT_UK[d.getDay()]} ${String(d.getHours()).padStart(2, '0')}:00`;
}

// "8 трав"
export function fmtDateShort(d) {
  return `${d.getDate()} ${MONTH_SHORT_UK[d.getMonth()]}`;
}

// "8 травня 2026"
export function fmtDateLong(d) {
  return `${d.getDate()} ${MONTH_LONG_UK[d.getMonth()]} ${d.getFullYear()}`;
}

// "14:00"
export function fmtHour(h) {
  return `${String(h).padStart(2, '0')}:00`;
}

// "2026-05-09" → for date inputs
export function toIsoDate(d) {
  return d.toISOString().slice(0, 10);
}

// ----------------- ANFIS demo math ----------------
// Typical 24h Ukrainian load curve, GW (working day baseline)
const BASE_LOAD_CURVE = [
  11.8, 11.4, 11.2, 11.1, 11.3, 12.0, // 0-5: night low
  13.4, 14.6, 15.5, 15.2, 14.8, 14.7, // 6-11: morning peak
  14.5, 14.3, 14.4, 14.8, 15.4, 15.9, // 12-17
  16.3, 16.1, 15.6, 14.7, 13.5, 12.4, // 18-23: evening peak
];
export function baseLoad(hour) {
  return BASE_LOAD_CURVE[((hour % 24) + 24) % 24];
}

// 24-hourly forecast starting at startDate
export function generateForecast24h(startDate, scaleMultiplier = 1, offsetGW = 0) {
  const points = [];
  const start = new Date(startDate);
  for (let i = 0; i < 24; i++) {
    const ts = new Date(start.getTime() + i * 3600 * 1000);
    const hr = ts.getHours();
    const base = baseLoad(hr) * scaleMultiplier + offsetGW;
    const noise = Math.sin(i * 0.9) * 0.12 + Math.cos(i * 0.5) * 0.06;
    const v = +(base + noise).toFixed(2);
    const halfBand = +(0.45 + (i / 24) * 0.25).toFixed(2);
    points.push({
      timestamp: ts.toISOString(),
      hour: ts.getHours(),
      actual: null,
      forecast: v,
      lowerBound: +(v - halfBand).toFixed(2),
      upperBound: +(v + halfBand).toFixed(2),
    });
  }
  return points;
}

// Past 24 hourly actuals ending at endDate
export function generatePast24h(endDate) {
  const points = [];
  const end = new Date(endDate);
  for (let i = 23; i >= 0; i--) {
    const ts = new Date(end.getTime() - (i + 1) * 3600 * 1000);
    const base = baseLoad(ts.getHours());
    const noise = Math.sin(i * 1.3) * 0.15 + Math.cos(i * 0.7) * 0.08;
    points.push({
      timestamp: ts.toISOString(),
      hour: ts.getHours(),
      actual: +(base + noise).toFixed(2),
      forecast: null,
      lowerBound: null,
      upperBound: null,
    });
  }
  return points;
}

// What-if compute — given deltas + flags, return modified 24h curve + pct shift
// baselineCurve: array of 24 numbers; deltas: { dTemp, dCloud, dWind, flags }
export function applyWhatIf(baselineCurve, deltas = {}) {
  const {
    dTemp = 0, dCloud = 0, dWind = 0,
    isWeekend = false, isHoliday = false,
    isPreHoliday = false, isSchoolBreak = false,
  } = deltas;
  let pct = 0;
  pct += dTemp * 1.6;     // 1.6% per °C
  pct += dCloud * 0.05;   // small effect
  pct += -dWind * 0.2;    // higher wind slightly reduces
  if (isWeekend)      pct += -12;
  if (isHoliday)      pct += -15;
  if (isPreHoliday)   pct += -3;
  if (isSchoolBreak)  pct += -5;
  const factor = 1 + pct / 100;
  return {
    curve: baselineCurve.map((v) => +(v * factor).toFixed(2)),
    pct,
  };
}

// Direction from percent change
export function deltaDirection(pct, threshold = 0.5) {
  if (Math.abs(pct) < threshold) return 'neutral';
  return pct > 0 ? 'up' : 'down';
}

// Tomorrow's midnight ISO
export function tomorrowISO() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}
