import { useState } from 'react';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
  ResponsiveContainer, Cell,
} from 'recharts';
import {
  Card, Badge, Button, InfoBanner, SectionHeader,
} from '../components/ui';
import * as I from '../components/ui/Icons';
import { useToast } from '../contexts/ToastContext';
import { useTheme } from '../contexts/ThemeContext';
import { MODEL_METRICS, CHART_DATA_7D, HOURLY_MAPE_CHART, MODEL_COLORS } from '../lib/mockData';
import { cx, fmtDecimal, DAY_SHORT_UK } from '../lib/utils';

// ── Constants ────────────────────────────────────────────────────────────────
const BEST = (() => {
  const b = {};
  ['mape', 'rmse', 'mae'].forEach((k) => {
    b[k] = Math.min(...MODEL_METRICS.map((m) => m[k]));
  });
  return b;
})();

const INTERP_BADGE = {
  high:   { tone: 'green',  label: 'Висока' },
  medium: { tone: 'yellow', label: 'Середня' },
  low:    { tone: 'red',    label: 'Низька' },
};

const SERIES = [
  { key: 'fact',    label: 'Факт',    width: 2.5 },
  { key: 'anfis',   label: 'ANFIS',   width: 1.7 },
  { key: 'lstm',    label: 'LSTM',    width: 1.5 },
  { key: 'prophet', label: 'Prophet', width: 1.5 },
  { key: 'sarimax', label: 'SARIMAX', width: 1.5 },
  { key: 'naive',   label: 'Naive',   width: 1.4, dashed: true },
];

const BAR_MODELS = [
  { key: 'ANFIS',   color: MODEL_COLORS.ANFIS },
  { key: 'LSTM',    color: MODEL_COLORS.LSTM },
  { key: 'Prophet', color: MODEL_COLORS.Prophet },
  { key: 'SARIMAX', color: MODEL_COLORS.SARIMAX },
];

const DAY_TICKS = Array.from({ length: 7 }, (_, i) => i * 24);

function xTickLabel(h) {
  const d = new Date('2026-05-03T00:00:00Z');
  const day = DAY_SHORT_UK[(d.getUTCDay() + Math.floor(h / 24)) % 7];
  const date = 3 + Math.floor(h / 24);
  return `${day} ${date}/05`;
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function fmt(v, d) {
  if (v == null) return '—';
  return fmtDecimal(v, d);
}

function BestCell({ value, isBest, decimals }) {
  return (
    <span className="inline-flex items-center justify-end gap-2">
      {isBest && <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" aria-label="Найкраще" />}
      <span className={isBest ? 'font-semibold text-green-700 dark:text-green-300' : 'text-slate-700 dark:text-slate-300'}>
        {fmt(value, decimals)}
      </span>
    </span>
  );
}

// ── TAB 1: Метрики ──────────────────────────────────────────────────────────
function TabMetrics() {
  return (
    <div className="space-y-4">
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-[600px] w-full text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
                <th className="text-left font-medium px-4 py-2.5 sticky left-0 bg-slate-50 dark:bg-slate-800 z-10 whitespace-nowrap">Модель</th>
                <th className="text-right font-medium px-4 py-2.5 whitespace-nowrap">MAPE, %</th>
                <th className="text-right font-medium px-4 py-2.5 whitespace-nowrap">RMSE, МВт</th>
                <th className="text-right font-medium px-4 py-2.5 whitespace-nowrap">MAE, МВт</th>
                <th className="text-right font-medium px-4 py-2.5 whitespace-nowrap">Час навч., с</th>
                <th className="text-left  font-medium px-4 py-2.5 whitespace-nowrap">Інтерпрет.</th>
              </tr>
            </thead>
            <tbody>
              {MODEL_METRICS.map((m, idx) => {
                const isAnfis = m.modelName === 'ANFIS';
                return (
                  <tr
                    key={m.modelName}
                    className={cx(
                      'border-b border-slate-200 dark:border-slate-800 last:border-b-0 transition-colors',
                      isAnfis
                        ? 'bg-green-50/40 dark:bg-green-950/20 ring-1 ring-inset ring-green-500/30 dark:ring-green-400/30'
                        : 'hover:bg-slate-50/60 dark:hover:bg-slate-800/40',
                    )}
                  >
                    <td className={cx(
                      'px-4 py-3 font-medium text-slate-900 dark:text-slate-100 sticky left-0 z-10 whitespace-nowrap',
                      isAnfis ? 'bg-green-50/60 dark:bg-green-950/30' : 'bg-white dark:bg-slate-900',
                    )}>
                      <div className="flex items-center gap-2">
                        <span className="inline-block w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: MODEL_COLORS[m.modelName] || '#94A3B8' }} />
                        {m.modelName}
                        {isAnfis && <Badge tone="green" size="xs">обрана</Badge>}
                        {m.modelName === 'Naive' && <span className="text-xs text-slate-500 font-normal">(baseline)</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums"><BestCell value={m.mape}                isBest={m.mape === BEST.mape}   decimals={2} /></td>
                    <td className="px-4 py-3 text-right tabular-nums"><BestCell value={m.rmse}                isBest={m.rmse === BEST.rmse}   decimals={0} /></td>
                    <td className="px-4 py-3 text-right tabular-nums"><BestCell value={m.mae}                 isBest={m.mae  === BEST.mae}    decimals={0} /></td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-700 dark:text-slate-300">{m.trainingTimeSeconds}</td>
                    <td className="px-4 py-3">
                      {m.interpretability
                        ? <Badge tone={INTERP_BADGE[m.interpretability].tone}>{INTERP_BADGE[m.interpretability].label}</Badge>
                        : <Badge tone="gray">—</Badge>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <InfoBanner tone="blue" icon="Info">
        <span className="font-medium">ANFIS показує найкращу точність</span> серед розглянутих моделей при збереженні високої інтерпретованості. Час навчання вищий за статистичні методи, але прийнятний для одноразового навчання.
      </InfoBanner>
    </div>
  );
}

// ── TAB 2: Графіки ─────────────────────────────────────────────────────────
function LegendItem({ color, label, visible, dashed, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className={cx(
        'inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-colors',
        visible
          ? 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
          : 'text-slate-400 dark:text-slate-600 line-through',
      )}
    >
      <svg width="18" height="8" viewBox="0 0 18 8" className="shrink-0">
        <line x1="0" y1="4" x2="18" y2="4"
          stroke={visible ? color : '#cbd5e1'}
          strokeWidth={2.5}
          strokeDasharray={dashed ? '3 3' : undefined}
          strokeLinecap="round"
        />
      </svg>
      {label}
    </button>
  );
}

function TabCharts() {
  const { theme } = useTheme();
  const dark = theme === 'dark';

  const seriesWithColors = SERIES.map((s) => ({
    ...s,
    color: s.key === 'fact'
      ? (dark ? MODEL_COLORS.factDark : MODEL_COLORS.fact)
      : MODEL_COLORS[s.key.charAt(0).toUpperCase() + s.key.slice(1)] || MODEL_COLORS[s.key.toUpperCase()] || '#94A3B8',
  }));

  const [visible, setVisible] = useState(() =>
    Object.fromEntries(seriesWithColors.map((s) => [s.key, true])),
  );

  const gridColor = dark ? '#1e293b' : '#e2e8f0';
  const axisColor = dark ? '#334155' : '#cbd5e1';
  const tickStyle = { fontSize: 11, fill: dark ? '#94a3b8' : '#64748b' };

  return (
    <div className="space-y-4">
      <Card padding="p-5">
        {/* Заголовок + легенда */}
        <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Прогнози всіх моделей на тестовому тижні</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Клікніть на легенду, щоб приховати лінію</p>
          </div>
          <div className="flex flex-wrap gap-1">
            {seriesWithColors.map((s) => (
              <LegendItem
                key={s.key}
                color={s.color}
                label={s.label}
                visible={visible[s.key]}
                dashed={s.dashed}
                onToggle={() => setVisible((v) => ({ ...v, [s.key]: !v[s.key] }))}
              />
            ))}
          </div>
        </div>

        {/* Графік — висота адаптивна */}
        <ResponsiveContainer width="100%" height={360}>
          <LineChart data={CHART_DATA_7D} margin={{ top: 4, right: 8, left: -8, bottom: 4 }}>
            <CartesianGrid stroke={gridColor} strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="h"
              type="number"
              domain={[0, 167]}
              ticks={DAY_TICKS}
              tickFormatter={xTickLabel}
              tickLine={false}
              axisLine={{ stroke: axisColor }}
              tick={tickStyle}
            />
            <YAxis
              domain={[9, 19]}
              tickCount={6}
              tickFormatter={(v) => fmt(v, 0)}
              tickLine={false}
              axisLine={false}
              tick={tickStyle}
              label={{ value: 'ГВт', angle: -90, position: 'insideLeft', dx: 18, dy: 20, style: { fontSize: 11, fill: tickStyle.fill } }}
            />
            <RTooltip
              contentStyle={{ background: dark ? '#1e293b' : '#fff', border: 'none', borderRadius: 8, fontSize: 12 }}
              formatter={(v, name) => [`${fmt(v, 2)} ГВт`, name]}
              labelFormatter={(h) => {
                const d = new Date(new Date('2026-05-03T00:00:00Z').getTime() + h * 3600 * 1000);
                return `${d.getUTCDate()}.05 ${String(d.getUTCHours()).padStart(2,'0')}:00`;
              }}
            />
            {seriesWithColors.map((s) =>
              visible[s.key] ? (
                <Line
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  stroke={s.color}
                  strokeWidth={s.width}
                  strokeDasharray={s.dashed ? '4 4' : undefined}
                  dot={false}
                  activeDot={{ r: 3, strokeWidth: 0, fill: s.color }}
                  name={s.label}
                  animationDuration={400}
                  isAnimationActive
                />
              ) : null,
            )}
          </LineChart>
        </ResponsiveContainer>

        <div className="mt-3 text-xs text-slate-500 dark:text-slate-400 space-y-0.5">
          <div>Тестова вибірка: <span className="font-medium text-slate-700 dark:text-slate-200">7 днів · 168 точок · травень 2026</span></div>
          <div>ANFIS відхиляється від факту в середньому на <span className="font-semibold text-green-700 dark:text-green-400">2,14 %</span> — найкраще серед усіх моделей.</div>
        </div>
      </Card>
    </div>
  );
}

// ── TAB 3: MAPE за годинами ──────────────────────────────────────────────────
function TabErrors() {
  const { theme } = useTheme();
  const dark = theme === 'dark';
  const gridColor = dark ? '#1e293b' : '#e2e8f0';
  const axisColor = dark ? '#334155' : '#cbd5e1';
  const tickStyle = { fontSize: 10, fill: dark ? '#94a3b8' : '#64748b' };

  return (
    <div className="space-y-4">
      <Card padding="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">MAPE за годинами доби</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Де моделі сильні, а де помиляються більше</p>
          </div>
          <div className="flex flex-wrap gap-3">
            {BAR_MODELS.map((b) => (
              <span key={b.key} className="inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: b.color }} />
                {b.key}
              </span>
            ))}
          </div>
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={HOURLY_MAPE_CHART} margin={{ top: 4, right: 8, left: -8, bottom: 16 }}>
            <CartesianGrid stroke={gridColor} strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="hourLabel"
              tickLine={false}
              axisLine={{ stroke: axisColor }}
              tick={tickStyle}
              interval={3}
              label={{ value: 'година доби', position: 'insideBottom', offset: -10, style: { fontSize: 11, fill: tickStyle.fill } }}
            />
            <YAxis
              tickFormatter={(v) => fmt(v, 0)}
              tickLine={false}
              axisLine={false}
              tick={tickStyle}
              label={{ value: 'MAPE, %', angle: -90, position: 'insideLeft', dx: 18, dy: 20, style: { fontSize: 11, fill: tickStyle.fill } }}
            />
            <RTooltip
              contentStyle={{ background: dark ? '#1e293b' : '#fff', border: 'none', borderRadius: 8, fontSize: 12 }}
              formatter={(v, name) => [`${fmtDecimal(v, 2)} %`, name]}
              labelFormatter={(h) => `Година ${h}:00`}
              cursor={{ fill: dark ? 'rgba(148,163,184,0.08)' : 'rgba(15,23,42,0.04)' }}
            />
            {BAR_MODELS.map((b) => (
              <Bar key={b.key} dataKey={b.key} fill={b.color} radius={[2, 2, 0, 0]} name={b.key} animationDuration={400} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <InfoBanner tone="amber" icon="AlertTriangle">
        Найбільші помилки всіх моделей — ранкові (07–09) і вечірні (18–21) піки навантаження. ANFIS зберігає перевагу саме в ці критичні години, що важливо для оперативного управління мережею.
      </InfoBanner>
    </div>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────
const TABS = [
  { value: 'metrics', label: 'Метрики' },
  { value: 'charts',  label: 'Графіки' },
  { value: 'errors',  label: 'MAPE за годинами' },
];

export default function ComparePage() {
  const { showToast } = useToast();
  const [tab, setTab] = useState('metrics');

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Порівняння моделей"
        subtitle="Зіставлення ANFIS з референсними методами на тестовому тижні"
        right={
          <Button
            variant="ghost" size="sm"
            leftIcon={<I.Download size={14} />}
            onClick={() => showToast({ type: 'success', title: 'Експорт підготовано', description: 'comparison-results.csv' })}
          >
            Експорт
          </Button>
        }
      />

      {/* Tabs з overflow-x-auto для мобільного */}
      <div className="overflow-x-auto scrollbar-none">
        <div className="border-b border-slate-200 dark:border-slate-800">
          <div className="flex gap-1 -mb-px min-w-max">
            {TABS.map((t) => {
              const active = t.value === tab;
              return (
                <button
                  key={t.value}
                  onClick={() => setTab(t.value)}
                  className={cx(
                    'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                    active
                      ? 'text-blue-600 border-blue-600 dark:text-blue-400 dark:border-blue-400'
                      : 'text-slate-600 border-transparent hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100',
                  )}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div>
        {tab === 'metrics' && <TabMetrics />}
        {tab === 'charts'  && <TabCharts />}
        {tab === 'errors'  && <TabErrors />}
      </div>
    </div>
  );
}
