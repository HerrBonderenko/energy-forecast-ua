import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ComposedChart, Line, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
  ReferenceLine, ResponsiveContainer,
} from 'recharts';
import { Button, IconButton, StatusDot } from '../components/ui';
import * as I from '../components/ui/Icons';
import { useToast } from '../contexts/ToastContext';
import { useTheme } from '../contexts/ThemeContext';
import {
  CHART_DATA, PERIOD_OPTIONS, PERIOD_SUMMARIES, NOW_REF_INDEX,
  RECENT_FORECASTS, SPARKLINE_24H, SPARKLINE_7D, SPARKLINE_30D,
  ERROR_DISTRIBUTION,
} from '../lib/mockData';
import { cx, fmtDecimal } from '../lib/utils';

// ── Chart palette ────────────────────────────────────────────────────────────
function palette(dark) {
  return {
    actual:    dark ? '#60A5FA' : '#2563EB',
    forecast:  dark ? '#FB923C' : '#EA580C',
    ciFill:    dark ? '#FB923C' : '#FED7AA',
    ciOpacity: dark ? 0.15 : 0.4,
    grid:      dark ? '#334155' : '#E2E8F0',
    text:      dark ? '#94A3B8' : '#64748B',
    refLine:   dark ? '#64748B' : '#94A3B8',
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function fmt(v, d = 1) { return fmtDecimal(v, d); }

function mapeClass(p) {
  if (p < 2) return 'text-green-600 dark:text-green-400';
  if (p < 5) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-red-600 dark:text-red-400';
}

function fmtPeriodDate(iso, period) {
  const d = new Date(iso);
  if (period === '24h' || period === '7d') {
    const mon = ['січ','лют','бер','кві','трав','чер','лип','сер','вер','жов','лис','гру'][d.getMonth()];
    return `${d.getDate()} ${mon}, ${String(d.getHours()).padStart(2,'0')}:00`;
  }
  if (period === '30d' || period === '90d') {
    const mon = ['січ','лют','бер','кві','трав','чер','лип','сер','вер','жов','лис','гру'][d.getMonth()];
    return `${d.getDate()} ${mon} ${d.getFullYear()}`;
  }
  return `${d.getFullYear()}`;
}

// ── Sparkline (SVG, без Recharts для швидкості) ──────────────────────────────
function Sparkline({ data, color, height = 28 }) {
  if (!data || data.length < 2) return null;
  const W = 100, H = height;
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const step = W / (data.length - 1);
  const pts = data.map((v, i) => {
    const x = i * step;
    const y = H - 2 - ((v - min) / range) * (H - 4);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const [lx, ly] = pts[pts.length - 1].split(',').map(Number);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full" style={{ height }}>
      <path d={`M${pts.join(' L')}`} fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      <circle cx={lx} cy={ly} r="2" fill={color} />
    </svg>
  );
}

// ── LegendDot ────────────────────────────────────────────────────────────────
function LegendDot({ type, color, label }) {
  return (
    <div className="inline-flex items-center gap-1.5">
      {type === 'solid' && <span className="inline-block w-3.5 h-0.5 rounded-full" style={{ background: color }} />}
      {type === 'dashed' && <span className="inline-block w-3.5 h-0" style={{ borderTop: `2px dashed ${color}` }} />}
      {type === 'fill' && <span className="inline-block w-3.5 h-2 rounded-sm" style={{ background: color, opacity: 0.6 }} />}
      <span>{label}</span>
    </div>
  );
}

// ── Custom Tooltip ────────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, period, pal }) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  const label = fmtPeriodDate(d.isoDate, period);
  return (
    <div className="rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-md text-xs px-3 py-2 min-w-[150px]">
      <div className="text-slate-500 dark:text-slate-400 mb-1.5">{label}</div>
      {d.fact != null && (
        <div className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
            <span className="inline-block w-3 h-0.5" style={{ background: pal.actual }} />Факт
          </span>
          <span className="font-medium text-slate-900 dark:text-slate-100">{fmt(d.fact)} ГВт</span>
        </div>
      )}
      {d.forecast != null && (
        <div className="flex items-center justify-between gap-3 mt-0.5">
          <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
            <span className="inline-block w-3 h-0" style={{ borderTop: `2px dashed ${pal.forecast}` }} />Прогноз
          </span>
          <span className="font-medium text-slate-900 dark:text-slate-100">{fmt(d.forecast)} ГВт</span>
        </div>
      )}
      {d.lowerBound != null && d.upperBound != null && (
        <div className="flex items-center justify-between gap-3 mt-0.5 text-slate-500 dark:text-slate-400">
          <span>95 % ДІ</span>
          <span>{fmt(d.lowerBound)} – {fmt(d.upperBound)} ГВт</span>
        </div>
      )}
    </div>
  );
}

// ── KPI Row ───────────────────────────────────────────────────────────────────
function KpiRow() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {/* 1 */}
      <div className="rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 hover:shadow-md transition-shadow">
        <div className="text-xs text-slate-500 dark:text-slate-400">Поточне споживання</div>
        <div className="mt-1.5 text-2xl font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
          14,8<span className="text-base font-normal text-slate-500 dark:text-slate-400"> ГВт</span>
        </div>
        <div className="mt-1 text-xs text-slate-400 dark:text-slate-500">фактичне о 14:00</div>
      </div>
      {/* 2 */}
      <div className="rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 hover:shadow-md transition-shadow">
        <div className="text-xs text-slate-500 dark:text-slate-400">Прогноз на 15:00</div>
        <div className="mt-1.5 text-2xl font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
          15,1<span className="text-base font-normal text-slate-500 dark:text-slate-400"> ГВт</span>
        </div>
        <div className="mt-1 text-xs text-blue-600 dark:text-blue-400">±0,3 ГВт (95 % ДІ)</div>
      </div>
      {/* 3 */}
      <div className="rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 hover:shadow-md transition-shadow">
        <div className="text-xs text-slate-500 dark:text-slate-400">MAPE за 7 днів</div>
        <div className="mt-1.5 text-2xl font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
          2,14<span className="text-base font-normal text-slate-500 dark:text-slate-400"> %</span>
        </div>
        <div className="mt-1 text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
          <I.TrendingDown size={12} />-0,3 пп до тижня тому
        </div>
      </div>
      {/* 4 */}
      <div className="rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 hover:shadow-md transition-shadow">
        <div className="text-xs text-slate-500 dark:text-slate-400">Статус моделі</div>
        <div className="mt-1.5 flex items-center gap-2">
          <I.CheckCircle size={20} className="text-green-600 dark:text-green-400" />
          <span className="text-base font-medium text-slate-900 dark:text-slate-100">Активна</span>
        </div>
        <div className="mt-1 text-xs text-slate-400 dark:text-slate-500">оновлено 02.05.2026</div>
      </div>
    </div>
  );
}

// ── Consumption Chart ────────────────────────────────────────────────────────
function ConsumptionChart({ period, setPeriod }) {
  const { showToast } = useToast();
  const { theme } = useTheme();
  const dark = theme === 'dark';
  const pal = palette(dark);
  const data = CHART_DATA[period];
  const showForecast = period === '24h' || period === '7d';
  const refIdx = NOW_REF_INDEX[period];
  const refName = data[refIdx]?.name || null;

  return (
    <div className="rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-medium text-slate-900 dark:text-slate-100">Споживання</h3>
        <IconButton
          icon={<I.Download size={16} />}
          label="Експортувати CSV"
          onClick={() => showToast({ type: 'success', title: 'Файл збережено в Завантаженнях' })}
        />
      </div>

      {/* Period selector + desktop legend */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        {/* Pill selector з overflow-x-auto */}
        <div className="inline-flex items-center gap-0.5 p-0.5 rounded-md bg-slate-100 dark:bg-slate-900/60 overflow-x-auto scrollbar-none">
          {PERIOD_OPTIONS.map((opt) => {
            const active = opt.id === period;
            return (
              <button
                key={opt.id}
                onClick={() => setPeriod(opt.id)}
                className={cx(
                  'px-3 py-1 rounded-[5px] text-xs font-medium whitespace-nowrap transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
                  active
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800',
                )}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        {/* Легенда — тільки на md+ */}
        <div className="hidden md:flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 shrink-0">
          <LegendDot type="solid"  color={pal.actual}   label="Факт" />
          {showForecast && <LegendDot type="dashed" color={pal.forecast} label="Прогноз" />}
          {showForecast && <LegendDot type="fill"   color={pal.ciFill}   label="95 % ДІ" />}
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={260}>
        <ComposedChart data={data} margin={{ top: 6, right: 6, left: -10, bottom: 0 }}>
          <CartesianGrid stroke={pal.grid} strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: pal.text }}
            tickLine={false}
            axisLine={{ stroke: pal.grid }}
            interval="preserveStartEnd"
            minTickGap={40}
          />
          <YAxis
            tick={{ fontSize: 11, fill: pal.text }}
            tickLine={false}
            axisLine={false}
            domain={
              period === '1y'  ? [8, 21] :
              period === '90d' ? [9, 20] :
              period === '30d' ? [9, 19] :
              [10, 18]
            }
            tickCount={5}
            width={44}
            tickFormatter={(v) => `${v}`}
          />
          <RTooltip content={(p) => <ChartTooltip {...p} period={period} pal={pal} />} cursor={{ stroke: pal.grid }} />

          {showForecast && (
            <Area type="monotone" dataKey="upperBound" stroke="none" fill={pal.ciFill} fillOpacity={pal.ciOpacity} isAnimationActive={false} activeDot={false} />
          )}
          {showForecast && (
            <Area type="monotone" dataKey="lowerBound" stroke="none" fill={dark ? '#020617' : '#fff'} fillOpacity={1} isAnimationActive={false} activeDot={false} />
          )}
          <Line type="monotone" dataKey="fact" stroke={pal.actual} strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 0, fill: pal.actual }} connectNulls={false} animationDuration={300} />
          {showForecast && (
            <Line type="monotone" dataKey="forecast" stroke={pal.forecast} strokeWidth={2} strokeDasharray="5 4" dot={false} activeDot={{ r: 4, strokeWidth: 0, fill: pal.forecast }} connectNulls={false} animationDuration={300} />
          )}
          {showForecast && refName && (
            <ReferenceLine x={refName} stroke={pal.refLine} strokeDasharray="2 3" strokeWidth={1} label={{ value: 'зараз', position: 'top', fill: pal.text, fontSize: 10 }} />
          )}
        </ComposedChart>
      </ResponsiveContainer>

      {/* Mobile legend */}
      <div className="md:hidden flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-slate-500 dark:text-slate-400">
        <LegendDot type="solid"  color={pal.actual}   label="Факт" />
        {showForecast && <LegendDot type="dashed" color={pal.forecast} label="Прогноз" />}
        {showForecast && <LegendDot type="fill"   color={pal.ciFill}   label="95 % ДІ" />}
      </div>

      {/* Summary */}
      <div className="mt-2.5 text-sm text-slate-600 dark:text-slate-300">{PERIOD_SUMMARIES[period]}</div>
    </div>
  );
}

// ── Recent Forecasts ─────────────────────────────────────────────────────────
function RecentForecasts() {
  const navigate = useNavigate();
  return (
    <div className="rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex flex-col hover:shadow-md transition-shadow">
      <div className="px-4 pt-4 pb-2">
        <h3 className="text-base font-medium text-slate-900 dark:text-slate-100">Останні прогнози</h3>
      </div>
      <ul className="flex-1 px-2 pb-1">
        {RECENT_FORECASTS.map((f) => (
          <li key={f.id}>
            <button
              type="button"
              onClick={() => navigate('/history')}
              className="w-full flex items-center justify-between gap-3 px-2 py-2.5 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700/40 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <div className="min-w-0">
                <div className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{f.dateLabel}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">{f.horizonLabel}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-sm font-medium text-slate-900 dark:text-slate-100 tabular-nums">{fmt(f.value)} ГВт</div>
                <div className={cx('text-xs tabular-nums', mapeClass(f.errorPercent))}>
                  δ {fmt(f.errorPercent)} %
                </div>
              </div>
            </button>
          </li>
        ))}
      </ul>
      <div className="border-t border-slate-200 dark:border-slate-700">
        <button
          type="button"
          onClick={() => navigate('/history')}
          className="w-full px-3 py-2.5 text-sm text-blue-600 dark:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-700/40 rounded-b-lg transition-colors"
        >
          Усі прогнози →
        </button>
      </div>
    </div>
  );
}

// ── Model Quality ─────────────────────────────────────────────────────────────
function ModelQuality() {
  const { theme } = useTheme();
  const dark = theme === 'dark';
  const pal = palette(dark);

  const sparklines = [
    { label: 'Rolling MAPE 24 г', value: '2,08 %', data: SPARKLINE_24H },
    { label: 'Rolling MAPE 7 д',  value: '2,14 %', data: SPARKLINE_7D  },
    { label: 'Rolling MAPE 30 д', value: '2,31 %', data: SPARKLINE_30D },
    { label: 'Bias', value: null, footer: 'модель злегка завищує' },
  ];

  return (
    <div className="rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 hover:shadow-md transition-shadow">
      <div className="mb-4">
        <h3 className="text-base font-medium text-slate-900 dark:text-slate-100">Моніторинг якості моделі</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Як модель поводилась за останній період</p>
      </div>

      {/* 4 mini-KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:divide-x divide-slate-200 dark:divide-slate-700">
        {sparklines.map((s) => (
          <div key={s.label} className="pl-0 md:pl-4 first:pl-0">
            <div className="text-xs text-slate-500 dark:text-slate-400">{s.label}</div>
            {s.value != null ? (
              <div className="mt-1 text-xl font-semibold text-slate-900 dark:text-slate-100 tabular-nums">{s.value}</div>
            ) : (
              <div className="mt-1 text-xl font-semibold text-green-600 dark:text-green-400 tabular-nums">+0,8 %</div>
            )}
            <div className="mt-1.5 h-7">
              {s.data ? (
                <Sparkline data={s.data} color={pal.actual} />
              ) : (
                <div className="text-xs text-slate-500 dark:text-slate-400">{s.footer}</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Error distribution histogram */}
      <div className="mt-6">
        <div className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Розподіл помилок прогнозу</div>
        <ResponsiveContainer width="100%" height={140}>
          <BarChart data={ERROR_DISTRIBUTION} margin={{ top: 4, right: 6, left: -12, bottom: 0 }} barCategoryGap={2}>
            <CartesianGrid stroke={pal.grid} strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="x"
              tick={{ fontSize: 10, fill: pal.text }}
              tickLine={false}
              axisLine={{ stroke: pal.grid }}
              interval={1}
              tickFormatter={(v) => {
                const n = Number(v);
                if (n === 0) return '0';
                return n > 0 ? `+${n}` : `-${Math.abs(n)}`;
              }}
            />
            <YAxis tick={{ fontSize: 10, fill: pal.text }} tickLine={false} axisLine={false} width={40} allowDecimals={false} />
            <RTooltip
              contentStyle={{ background: dark ? '#1e293b' : '#fff', border: 'none', borderRadius: 6, fontSize: 11 }}
              formatter={(v, _, p) => [`${v} прогнозів`, `Помилка ${p.payload.x > 0 ? '+' : ''}${p.payload.x} %`]}
              cursor={{ fill: dark ? '#33415544' : '#E2E8F066' }}
            />
            <ReferenceLine x={0} stroke={pal.refLine} strokeDasharray="3 3" />
            <Bar dataKey="count" fill={pal.actual} radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">720 прогнозів за 30 днів</div>
      </div>
    </div>
  );
}

// ── Root ─────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { showToast } = useToast();
  const [period, setPeriod] = useState('7d');

  return (
    <div className="space-y-5">
      {/* Page header */}
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 tracking-tight">Огляд системи</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Стан споживання та якість прогнозу в реальному часі</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">8 травня 2026, 14:32</span>
          <Button
            variant="ghost" size="sm"
            leftIcon={<I.RefreshCw size={14} />}
            onClick={() => showToast({ type: 'success', title: 'Дані оновлено', description: 'Останнє оновлення: щойно' })}
          >
            Оновити
          </Button>
        </div>
      </header>

      {/* KPI */}
      <KpiRow />

      {/* Chart + RecentForecasts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 min-w-0">
          <ConsumptionChart period={period} setPeriod={setPeriod} />
        </div>
        <div className="min-w-0">
          <RecentForecasts />
        </div>
      </div>

      {/* Model quality */}
      <ModelQuality />
    </div>
  );
}
