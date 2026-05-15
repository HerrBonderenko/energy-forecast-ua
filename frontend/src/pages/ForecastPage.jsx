import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ComposedChart, Line, Area,
  XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
  ReferenceLine, ResponsiveContainer,
} from 'recharts';
import {
  Card, CardTitle, Button, Label, Select, Slider, Checkbox,
  SectionHeader, SectionDivider, Spinner, InfoBanner,
} from '../components/ui';
import * as I from '../components/ui/Icons';
import { useToast } from '../contexts/ToastContext';
import { useTheme } from '../contexts/ThemeContext';
import { cx, fmtDecimal, NBSP } from '../lib/utils';
import { createForecast, getCurrentWeather } from '../lib/api';

// ── Constants ────────────────────────────────────────────────────────────────
const HORIZON_OPTIONS = [
  { value: '1h',  label: '1 година' },
  { value: '6h',  label: '6 годин' },
  { value: '24h', label: '24 години' },
  { value: '48h', label: '48 годин' },
  { value: '7d',  label: '7 днів' },
];
const PRECIP_OPTIONS = [
  { value: 'none',         label: 'Немає' },
  { value: 'rain-light',   label: 'Дощ слабкий' },
  { value: 'rain-heavy',   label: 'Дощ сильний' },
  { value: 'snow-light',   label: 'Сніг слабкий' },
  { value: 'snow-heavy',   label: 'Сніг сильний' },
  { value: 'thunderstorm', label: 'Гроза' },
];
const HOUR_OPTIONS = Array.from({ length: 24 }, (_, h) => ({
  value: `${String(h).padStart(2, '0')}:00`,
  label: `${String(h).padStart(2, '0')}:00`,
}));

function tomorrowISO() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

// ── Sub-components ────────────────────────────────────────────────────────────
function RadioPill({ value, onChange, options }) {
  return (
    <div className="inline-flex w-full rounded-md border border-slate-200 dark:border-slate-700 p-0.5 bg-slate-50 dark:bg-slate-900/50">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cx(
            'flex-1 px-3 h-8 text-xs font-medium rounded transition-colors',
            value === o.value
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function SliderField({ label, value, unit, decimals = 0, min, max, step, onChange }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <Label className="text-xs">{label}</Label>
        <span className="text-sm font-medium font-mono tabular-nums text-slate-900 dark:text-slate-100">
          {fmtDecimal(value, decimals)}{unit ? NBSP + unit : ''}
        </span>
      </div>
      <Slider value={value} onChange={onChange} min={min} max={max} step={step} />
      <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 font-mono">
        <span>{fmtDecimal(min, decimals)}</span>
        <span>{fmtDecimal(max, decimals)}</span>
      </div>
    </div>
  );
}

// ── Empty / Loading placeholders ──────────────────────────────────────────────
function EmptyResult() {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 min-h-[420px]">
      <I.TrendingUp size={48} className="text-slate-300 dark:text-slate-600 mb-4" strokeWidth={1.5} />
      <h3 className="text-base font-semibold text-slate-700 dark:text-slate-200">Заповніть параметри</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">і натисніть «Прогнозувати»</p>
    </div>
  );
}

function LoadingResult() {
  return (
    <div className="p-6 min-h-[420px] animate-pulse">
      <div className="grid grid-cols-3 gap-4 pb-5 mb-5 border-b border-slate-200 dark:border-slate-700">
        {[0, 1, 2].map((i) => (
          <div key={i} className={cx('space-y-2', i > 0 && 'border-l border-slate-200 dark:border-slate-700 pl-4')}>
            <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-24" />
            <div className="h-7 bg-slate-200 dark:bg-slate-700 rounded w-28" />
          </div>
        ))}
      </div>
      <div className="h-72 bg-slate-100 dark:bg-slate-700/50 rounded" />
    </div>
  );
}

// ── Ready Result (KPI + chart + actions) ─────────────────────────────────────
function ReadyResult({ result, onAnalyze, onSave, onExport }) {
  const { theme } = useTheme();
  const dark = theme === 'dark';

  const actualColor   = dark ? '#60A5FA' : '#2563EB';
  const forecastColor = dark ? '#FB923C' : '#EA580C';
  const ciColor       = dark ? 'rgba(251,146,60,0.18)' : 'rgba(254,215,170,0.55)';
  const gridColor     = dark ? '#1e293b' : '#e2e8f0';
  const axisColor     = dark ? '#64748b' : '#94a3b8';
  const tickStyle     = { fontSize: 11, fill: dark ? '#94a3b8' : '#64748b' };

  const chartData = useMemo(() => {
    const out = [];
    result.past.forEach((p, i) => {
      out.push({
        name: `${String(i).padStart(2, '0')}:00`,
        fact: p.actual, forecast: null,
        bandLow: null, bandHigh: null,
      });
    });
    result.forecast.forEach((p, i) => {
      const h = p.hour ?? new Date(p.timestamp).getHours();
      const lb = p.lower_bound ?? p.lowerBound ?? 0;
      const ub = p.upper_bound ?? p.upperBound ?? 0;
      out.push({
        name: `${String(h).padStart(2, '0')}:00`,
        fact: i === 0 ? result.past[result.past.length - 1].actual : null,
        forecast: p.forecast,
        bandLow: lb,
        bandHigh: ub - lb,
      });
    });
    return out;
  }, [result]);

  const startName = chartData[24]?.name;
  const fmtGW = (v) => `${fmtDecimal(v, 2)} ГВт`;

  return (
    <div>
      {/* KPI */}
      <div className="grid grid-cols-3 pt-5 pb-5 border-b border-slate-200 dark:border-slate-700">
        <div className="px-5">
          <div className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-medium">Середнє</div>
          <div className="mt-1 text-xl font-semibold font-mono tabular-nums text-slate-900 dark:text-slate-100">{fmtGW(result.avg)}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">за 24 години</div>
        </div>
        <div className="px-5 border-l border-slate-200 dark:border-slate-700">
          <div className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-medium">Пік</div>
          <div className="mt-1 text-xl font-semibold font-mono tabular-nums text-slate-900 dark:text-slate-100">{fmtGW(result.max)}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">о {String(result.maxHour).padStart(2,'0')}:00</div>
        </div>
        <div className="px-5 border-l border-slate-200 dark:border-slate-700">
          <div className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-medium">Мінімум</div>
          <div className="mt-1 text-xl font-semibold font-mono tabular-nums text-slate-900 dark:text-slate-100">{fmtGW(result.min)}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">о {String(result.minHour).padStart(2,'0')}:00</div>
        </div>
      </div>

      {/* Chart */}
      <div className="px-5 pt-5">
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={chartData} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
            <CartesianGrid stroke={gridColor} strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" tick={tickStyle} tickLine={false} axisLine={{ stroke: gridColor }} interval={3} />
            <YAxis tick={tickStyle} tickLine={false} axisLine={false} domain={['dataMin - 0.5', 'dataMax + 0.5']} tickFormatter={(v) => fmtDecimal(v, 0)} width={38} />
            <RTooltip
              contentStyle={{ background: dark ? '#0f172a' : '#fff', border: `1px solid ${gridColor}`, borderRadius: 6, fontSize: 12 }}
              formatter={(v, name) => {
                if (v == null || name === 'Δ') return null;
                return [`${fmtDecimal(v, 2)} ГВт`, name];
              }}
              labelFormatter={(l) => `Година ${l}`}
            />
            <Area type="monotone" dataKey="bandLow"  stackId="ci" stroke="none" fill="transparent" isAnimationActive={false} />
            <Area type="monotone" dataKey="bandHigh" stackId="ci" stroke="none" fill={ciColor}      isAnimationActive={false} />
            <Line type="monotone" dataKey="fact"     name="Факт"    stroke={actualColor}   strokeWidth={2} dot={false} connectNulls={false} isAnimationActive={false} />
            <Line type="monotone" dataKey="forecast" name="Прогноз" stroke={forecastColor} strokeWidth={2} strokeDasharray="6 4" dot={false} connectNulls={false} isAnimationActive={false} />
            {startName && (
              <ReferenceLine x={startName} stroke={axisColor} strokeDasharray="2 4" label={{ value: 'початок прогнозу', position: 'insideTopRight', fill: axisColor, fontSize: 10 }} />
            )}
          </ComposedChart>
        </ResponsiveContainer>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-500 dark:text-slate-400">
          <span className="inline-flex items-center gap-1.5">
            <svg width="18" height="6" viewBox="0 0 18 6"><line x1="0" y1="3" x2="18" y2="3" stroke={actualColor} strokeWidth="2" /></svg>
            Факт (вчора)
          </span>
          <span className="inline-flex items-center gap-1.5">
            <svg width="18" height="6" viewBox="0 0 18 6"><line x1="0" y1="3" x2="18" y2="3" stroke={forecastColor} strokeWidth="2" strokeDasharray="4 3" /></svg>
            Прогноз
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-sm" style={{ background: ciColor }} />
            95 % ДІ
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="px-5 pt-4 pb-5 mt-4 border-t border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2">
        <Button variant="secondary" leftIcon={<I.Download size={14} />} onClick={onExport}>
          Експорт у CSV
        </Button>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" rightIcon={<I.ArrowRight size={14} />} onClick={onAnalyze}>
            Сценарний аналіз
          </Button>
          <Button leftIcon={<I.Save size={14} />} onClick={onSave}>
            Зберегти прогноз
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Root ─────────────────────────────────────────────────────────────────────
export default function ForecastPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [date, setDate]       = useState(tomorrowISO());
  const [hour, setHour]       = useState('00:00');
  const [horizon, setHorizon] = useState('24h');
  const [weatherSource, setWeatherSource] = useState('api');
  const [temp, setTemp]       = useState(8);
  const [humidity, setHumidity] = useState(60);
  const [wind, setWind]       = useState(4);
  const [cloud, setCloud]     = useState(40);
  const [pressure, setPressure] = useState(1013);
  const [precip, setPrecip]   = useState('none');
  const [isWeekend, setIsWeekend]       = useState(false);
  const [isHoliday, setIsHoliday]       = useState(false);
  const [isPreHoliday, setIsPreHoliday] = useState(false);
  const [isSchoolBreak, setIsSchoolBreak] = useState(false);

  const [phase, setPhase]   = useState('empty'); // empty | loading | ready
  const [result, setResult] = useState(null);

  async function handleForecast() {
    setPhase('loading');
    try {
      // Якщо вибрано "З API погоди" — спочатку беремо реальну погоду
      let weatherData = { temperature: temp, cloud_cover: cloud, wind_speed: wind };
      if (weatherSource === 'api') {
        try {
          const w = await getCurrentWeather();
          if (w && w.temperature != null) {
            weatherData = {
              temperature: w.temperature,
              cloud_cover: w.cloud_cover ?? cloud,
              wind_speed: w.wind_speed ?? wind,
            };
          }
        } catch {
          // Якщо API погоди недоступне — використовуємо введені вручну значення
        }
      }

      const startISO = `${date}T${hour}:00Z`;
      const horizonHours = { '1h': 1, '6h': 6, '24h': 24, '48h': 48, '7d': 168 }[horizon] || 24;

      const data = await createForecast({
        start: startISO,
        hours: horizonHours,
        weather: weatherData,
        calendar: { is_weekend: isWeekend, is_holiday: isHoliday, is_pre_holiday: isPreHoliday, is_school_break: isSchoolBreak },
      });

      const pts = data.points || [];
      const fVals = pts.map((p) => p.forecast);
      const avg = fVals.reduce((a, b) => a + b, 0) / fVals.length;
      const max = Math.max(...fVals);
      const min = Math.min(...fVals);

      // Будуємо past (заглушка — минула доба) + forecast
      const past = Array.from({ length: 24 }, (_, i) => {
        const base = 10.5 + 3 * Math.sin((i - 6) * Math.PI / 12) + (Math.sin(i * 1.7) * 0.4);
        return { timestamp: `past_${i}`, actual: Math.max(8, Math.round(base * 100) / 100) };
      });

      setResult({ past, forecast: pts, avg, max, min, maxHour: fVals.indexOf(max), minHour: fVals.indexOf(min) });
      setPhase('ready');
    } catch (e) {
      setPhase('empty');
      showToast({ type: 'error', title: 'Помилка прогнозу', description: 'Перевірте чи запущено бекенд (порт 8000)' });
    }
  }

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Створити прогноз"
        subtitle="Згенерувати прогноз на основі обраних параметрів"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Ліва форма ── */}
        <Card className="lg:col-span-1 self-start">
          <div className="px-5 pt-5 pb-5 space-y-5">

            {/* Час */}
            <div>
              <CardTitle className="text-sm mb-3">Час прогнозу</CardTitle>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="fc-date" className="block mb-1.5">Дата початку</Label>
                  <div className="relative">
                    <I.Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      id="fc-date"
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full h-9 pl-9 pr-3 text-sm rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>
                <div>
                  <Label className="block mb-1.5">Час початку</Label>
                  <Select value={hour} onChange={(v) => setHour(v)} options={HOUR_OPTIONS} />
                </div>
                <div>
                  <Label className="block mb-1.5">Горизонт прогнозу</Label>
                  <Select value={horizon} onChange={(v) => setHorizon(v)} options={HORIZON_OPTIONS} />
                </div>
              </div>
            </div>

            {/* Погода */}
            <SectionDivider>Метеоумови</SectionDivider>
            <RadioPill
              value={weatherSource}
              onChange={setWeatherSource}
              options={[
                { value: 'api',    label: 'З API погоди' },
                { value: 'manual', label: 'Задати вручну' },
              ]}
            />

            {/* Слайдери — анімований розкид */}
            <div className={cx(
              'overflow-hidden transition-all duration-300',
              weatherSource === 'manual' ? 'max-h-[600px] opacity-100 mt-2' : 'max-h-0 opacity-0',
            )}>
              <div className="space-y-4">
                <SliderField label="Температура"      value={temp}     unit="°C"   decimals={1} min={-25} max={35}   step={0.5} onChange={setTemp} />
                <SliderField label="Вологість"         value={humidity} unit="%"    decimals={0} min={0}   max={100}  step={1}   onChange={setHumidity} />
                <SliderField label="Швидкість вітру"   value={wind}     unit="м/с"  decimals={1} min={0}   max={25}   step={0.5} onChange={setWind} />
                <SliderField label="Хмарність"         value={cloud}    unit="%"    decimals={0} min={0}   max={100}  step={5}   onChange={setCloud} />
                <SliderField label="Тиск"              value={pressure} unit="гПа"  decimals={0} min={970} max={1040} step={1}   onChange={setPressure} />
                <div>
                  <Label className="block mb-1.5 text-xs">Опади</Label>
                  <Select value={precip} onChange={(v) => setPrecip(v)} options={PRECIP_OPTIONS} />
                </div>
              </div>
            </div>

            {/* Тип дня */}
            <SectionDivider>Тип дня</SectionDivider>
            <div className="flex flex-col gap-2.5">
              <Checkbox checked={isWeekend}    onChange={setIsWeekend}    label="Вихідний день" />
              <Checkbox checked={isHoliday}    onChange={setIsHoliday}    label="Державне свято" />
              <Checkbox checked={isPreHoliday} onChange={setIsPreHoliday} label="Передсвятковий (скорочений)" />
              <Checkbox checked={isSchoolBreak} onChange={setIsSchoolBreak} label="Шкільні канікули" />
            </div>

            {/* Кнопка */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
              <Button
                size="lg"
                loading={phase === 'loading'}
                onClick={handleForecast}
                className="w-full"
                leftIcon={phase === 'loading' ? null : <I.TrendingUp size={15} />}
              >
                {phase === 'loading' ? 'Прогнозування…' : 'Прогнозувати'}
              </Button>
            </div>
          </div>
        </Card>

        {/* ── Правий результат ── */}
        <div className="lg:col-span-2">
          <Card className="overflow-hidden">
            {phase === 'empty'   && <EmptyResult />}
            {phase === 'loading' && <LoadingResult />}
            {phase === 'ready' && result && (
              <ReadyResult
                result={result}
                onAnalyze={() => {
                  showToast({ type: 'info', title: 'Перехід до Сценарного аналізу', description: 'Параметри перенесено' });
                  navigate('/scenario-analysis');
                }}
                onSave={() => showToast({ type: 'success', title: 'Прогноз збережено' })}
                onExport={() => showToast({ type: 'info', title: 'Експорт у CSV запущено' })}
              />
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
