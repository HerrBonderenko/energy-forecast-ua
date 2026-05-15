import { useState, useMemo, memo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip as RTooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import {
  Card, CardBody, CardTitle, Badge, Button, IconButton,
  SectionHeader, Input, Select, Skeleton,
} from '../components/ui';
import * as I from '../components/ui/Icons';
import { useToast } from '../contexts/ToastContext';
import {
  HISTORY_FORECASTS, HISTORY_BEST, HISTORY_WORST, HISTORY_AVG_MAPE,
  PRECIPITATION_LABELS_UK,
} from '../lib/mockData';
import { cx, fmtDecimal, NBSP } from '../lib/utils';
import { useTheme } from '../contexts/ThemeContext';

// ── Helpers ──────────────────────────────────────────────────────────────────
function qualityTone(q) {
  return q === 'excellent' ? 'green' : q === 'good' ? 'yellow' : q === 'poor' ? 'red' : 'slate';
}
function qualityLabel(q) {
  return q === 'excellent' ? 'Відмінно' : q === 'good' ? 'Добре' : q === 'poor' ? 'Погано' : '—';
}
function horizonLabel(h) {
  return h === '1h' ? '+1 год' : h === '24h' ? '+24 год' : '+7 днів';
}
function fmtIso(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  const mon = ['січ','лют','бер','кві','трав','чер','лип','сер','вер','жов','лис','гру'][d.getMonth()];
  const hh = String(d.getHours()).padStart(2,'0');
  const mm = String(d.getMinutes()).padStart(2,'0');
  return `${d.getDate()} ${mon}, ${hh}:${mm}`;
}
function fmtMape(v) {
  if (v == null) return '—';
  return fmtDecimal(v, 2) + ' %';
}
function fmtGW(v) {
  if (v == null) return '—';
  return fmtDecimal(v, 2) + ' ГВт';
}

// ── Summary card ──────────────────────────────────────────────────────────────
function SummaryCard({ label, value, sub, tone = 'slate' }) {
  const textMap = {
    green: 'text-emerald-600 dark:text-emerald-400',
    red:   'text-red-600 dark:text-red-400',
    blue:  'text-blue-600 dark:text-blue-400',
    slate: 'text-slate-900 dark:text-slate-100',
  };
  return (
    <Card padding="p-4" className="flex flex-col gap-1">
      <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">{label}</div>
      <div className={cx('text-2xl font-semibold tabular-nums', textMap[tone] || textMap.slate)}>
        {value}
      </div>
      {sub && <div className="text-xs text-slate-500 dark:text-slate-400 truncate">{sub}</div>}
    </Card>
  );
}

// ── Mini area chart inside expanded row ───────────────────────────────────────
function MiniForecastChart({ forecast }) {
  const { theme } = useTheme();
  const dark = theme === 'dark';
  const pts = forecast.predictedValues?.slice(0, 24) || [];
  if (!pts.length) return <div className="h-32 flex items-center justify-center text-sm text-slate-400">Немає даних</div>;
  const data = pts.map((p, i) => ({
    i,
    forecast: +p.forecast?.toFixed(2),
    actual: p.actual != null ? +p.actual.toFixed(2) : undefined,
  }));
  return (
    <ResponsiveContainer width="100%" height={120}>
      <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="fcGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#2563EB" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={dark ? '#1e293b' : '#f1f5f9'} />
        <XAxis dataKey="i" tick={false} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 10, fill: dark ? '#94a3b8' : '#94a3b8' }} axisLine={false} tickLine={false} width={36} />
        <RTooltip
          contentStyle={{ background: dark ? '#1e293b' : '#fff', border: 'none', borderRadius: 6, fontSize: 12 }}
          labelFormatter={(i) => `Год ${i}`}
          formatter={(v, name) => [v?.toFixed ? `${v.toFixed(2)} ГВт` : v, name === 'forecast' ? 'Прогноз' : 'Факт']}
        />
        <Area type="monotone" dataKey="forecast" stroke="#2563EB" strokeWidth={1.5} fill="url(#fcGrad)" dot={false} />
        {data.some((d) => d.actual != null) && (
          <Area type="monotone" dataKey="actual" stroke="#10b981" strokeWidth={1.5} fill="none" dot={false} />
        )}
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ── Expanded row detail ────────────────────────────────────────────────────────
function ExpandedDetail({ forecast }) {
  const { showToast } = useToast();
  const w = forecast.inputs?.weather || {};
  const cal = forecast.inputs?.calendar || {};
  return (
    <div className="px-4 pb-4 pt-2 bg-slate-50 dark:bg-slate-900/40 border-t border-slate-200 dark:border-slate-700 space-y-4">
      {/* Графік */}
      <div>
        <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
          Крива прогнозу
        </div>
        <MiniForecastChart forecast={forecast} />
        <div className="flex items-center gap-4 mt-1">
          <span className="flex items-center gap-1 text-xs text-slate-500"><span className="inline-block w-3 h-0.5 bg-blue-500 rounded" />Прогноз</span>
          <span className="flex items-center gap-1 text-xs text-slate-500"><span className="inline-block w-3 h-0.5 bg-emerald-500 rounded" />Факт</span>
        </div>
      </div>

      {/* Вхідні умови — 2 колонки на sm+ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Погода */}
        <div>
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Погода</div>
          <dl className="space-y-1.5 text-sm">
            {[
              ['Температура', `${w.temperature?.toFixed(1)} °C`],
              ['Хмарність',   `${w.cloudCover} %`],
              ['Вітер',       `${w.windSpeed?.toFixed(1)} м/с`],
              ['Вологість',   `${w.humidity} %`],
              ['Тиск',        `${w.pressure} гПа`],
              ['Опади',       PRECIPITATION_LABELS_UK[w.precipitation] || '—'],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3">
                <dt className="text-slate-500 dark:text-slate-400">{k}</dt>
                <dd className="text-slate-800 dark:text-slate-100 tabular-nums">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
        {/* Календар */}
        <div>
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Тип дня</div>
          <dl className="space-y-1.5 text-sm">
            {[
              ['Година старту', `${String(cal.hourOfDay || 0).padStart(2,'0')}:00`],
              ['Тип дня', cal.isHoliday ? 'Свято' : cal.isPreHoliday ? 'Передсвятковий' : cal.isWeekend ? 'Вихідний' : 'Робочий'],
              ['Шкільні канікули', cal.isSchoolBreak ? 'Так' : 'Ні'],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3">
                <dt className="text-slate-500 dark:text-slate-400">{k}</dt>
                <dd className="text-slate-800 dark:text-slate-100">{v}</dd>
              </div>
            ))}
          </dl>

          {/* Аналіз */}
          {forecast.analysis && (
            <div className="mt-4 p-3 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {forecast.analysis}
            </div>
          )}
        </div>
      </div>

      {/* Кнопки дій */}
      <div className="flex flex-wrap gap-2 pt-1">
        <Button variant="secondary" size="sm" leftIcon={<I.TrendingUp size={13} />}
          onClick={() => showToast({ type: 'info', title: 'Перейти до Прогнозу', description: 'Буде реалізовано на Етапі 5' })}>
          Повторити прогноз
        </Button>
        <Button variant="ghost" size="sm" leftIcon={<I.Network size={13} />}
          onClick={() => showToast({ type: 'info', title: 'Перейти до Інтерпретації', description: 'Буде реалізовано на Етапі 5' })}>
          Інтерпретація
        </Button>
        <Button variant="ghost" size="sm" leftIcon={<I.Download size={13} />}
          onClick={() => showToast({ type: 'success', title: 'CSV готовий для скачування' })}>
          Завантажити CSV
        </Button>
      </div>
    </div>
  );
}

// ── History row (expandable) ──────────────────────────────────────────────────
const HistoryRow = memo(function HistoryRow({ forecast: f, expanded, onToggle }) {
  return (
    <>
      <tr
        className={cx(
          'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors',
          expanded && 'bg-slate-50 dark:bg-slate-800/40',
        )}
        onClick={() => onToggle(f.id)}
      >
        {/* Дата */}
        <td className="px-4 py-3 whitespace-nowrap">
          <div className="text-sm text-slate-800 dark:text-slate-100 tabular-nums">{fmtIso(f.startTime)}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{f.modelVersion}</div>
        </td>
        {/* Горизонт */}
        <td className="px-4 py-3 whitespace-nowrap hidden sm:table-cell">
          <Badge tone="slate">{horizonLabel(f.horizon)}</Badge>
        </td>
        {/* Джерело */}
        <td className="px-4 py-3 whitespace-nowrap hidden md:table-cell">
          <span className="text-xs text-slate-500 dark:text-slate-400">{f.source === 'auto' ? 'Авто' : 'Ручний'}</span>
        </td>
        {/* Прогноз / Факт */}
        <td className="px-4 py-3 whitespace-nowrap hidden lg:table-cell">
          <div className="text-sm tabular-nums text-slate-800 dark:text-slate-100">{fmtGW(f.avgForecast)}</div>
          {f.avgActual != null && (
            <div className="text-xs tabular-nums text-slate-500 dark:text-slate-400 mt-0.5">
              факт: {fmtGW(f.avgActual)}
            </div>
          )}
        </td>
        {/* MAPE */}
        <td className="px-4 py-3 whitespace-nowrap">
          {f.mape != null ? (
            <span className={cx(
              'text-sm font-semibold tabular-nums',
              f.quality === 'excellent' ? 'text-emerald-600 dark:text-emerald-400'
              : f.quality === 'good' ? 'text-amber-600 dark:text-amber-400'
              : 'text-red-600 dark:text-red-400',
            )}>
              {fmtMape(f.mape)}
            </span>
          ) : (
            <span className="text-xs text-slate-400">очікується</span>
          )}
        </td>
        {/* Якість */}
        <td className="px-4 py-3 whitespace-nowrap hidden sm:table-cell">
          {f.quality ? (
            <Badge tone={qualityTone(f.quality)}>{qualityLabel(f.quality)}</Badge>
          ) : (
            <span className="text-xs text-slate-400">—</span>
          )}
        </td>
        {/* Шеврон */}
        <td className="px-4 py-3 text-right">
          <I.ChevronRight
            size={16}
            className={cx(
              'text-slate-400 transition-transform duration-200',
              expanded && 'rotate-90',
            )}
          />
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={7} className="p-0">
            <ExpandedDetail forecast={f} />
          </td>
        </tr>
      )}
    </>
  );
});

// ── Filter bar ────────────────────────────────────────────────────────────────
function FilterBar({ search, setSearch, horizon, setHorizon, quality, setQuality, onReset, count }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      <Input
        leftIcon={<I.Search size={14} />}
        placeholder="Пошук за датою, версією…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <Select
        value={horizon}
        onChange={(v) => setHorizon(v)}
        options={[
          { value: 'all', label: 'Будь-який горизонт' },
          { value: '1h',  label: '+1 година' },
          { value: '24h', label: '+24 години' },
          { value: '7d',  label: '+7 днів' },
        ]}
      />
      <Select
        value={quality}
        onChange={(v) => setQuality(v)}
        options={[
          { value: 'all',       label: 'Будь-яка якість' },
          { value: 'excellent', label: 'Відмінна (< 2 %)' },
          { value: 'good',      label: 'Хороша (2–5 %)' },
          { value: 'poor',      label: 'Погана (> 5 %)' },
        ]}
      />
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" leftIcon={<I.RefreshCw size={13} />} onClick={onReset}>
          Скинути
        </Button>
        <span className="text-sm text-slate-500 dark:text-slate-400 tabular-nums ml-auto">
          {count} записів
        </span>
      </div>
    </div>
  );
}

// ── Pagination ────────────────────────────────────────────────────────────────
function Pagination({ page, pageCount, onPage }) {
  if (pageCount <= 1) return null;
  return (
    <div className="flex items-center justify-between gap-3 flex-wrap">
      <Button
        variant="ghost" size="sm"
        leftIcon={<I.ChevronLeft size={14} />}
        disabled={page === 0}
        onClick={() => onPage(page - 1)}
      >
        Попередня
      </Button>
      <span className="text-sm text-slate-500 dark:text-slate-400 tabular-nums">
        {page + 1} / {pageCount}
      </span>
      <Button
        variant="ghost" size="sm"
        rightIcon={<I.ChevronRight size={14} />}
        disabled={page === pageCount - 1}
        onClick={() => onPage(page + 1)}
      >
        Наступна
      </Button>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
const PAGE_SIZE = 20;

export default function HistoryPage() {
  const { showToast } = useToast();
  const [search, setSearch]   = useState('');
  const [horizon, setHorizon] = useState('all');
  const [quality, setQuality] = useState('all');
  const [page, setPage]       = useState(0);
  const [expandedId, setExpandedId] = useState(null);

  function handleToggle(id) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  function handleReset() {
    setSearch(''); setHorizon('all'); setQuality('all'); setPage(0); setExpandedId(null);
  }

  // Фільтрація
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return HISTORY_FORECASTS.filter((f) => {
      if (search && !fmtIso(f.startTime).toLowerCase().includes(q) && !(f.modelVersion || '').toLowerCase().includes(q)) return false;
      if (horizon !== 'all' && f.horizon !== horizon) return false;
      if (quality !== 'all' && f.quality !== quality) return false;
      return true;
    });
  }, [search, horizon, quality]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage  = Math.min(page, pageCount - 1);
  const pageData  = filtered.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Історія прогнозів"
        subtitle="Журнал усіх запусків моделі — фактичні та прогнозовані значення"
        right={
          <Button variant="ghost" size="sm" leftIcon={<I.Download size={14} />}
            onClick={() => showToast({ type: 'success', title: 'Експорт підготовано' })}>
            Експорт CSV
          </Button>
        }
      />

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <SummaryCard
          label="Середній MAPE"
          value={fmtMape(HISTORY_AVG_MAPE)}
          sub={`${HISTORY_FORECASTS.filter((f) => f.mape != null).length} оцінених прогнозів`}
          tone="blue"
        />
        <SummaryCard
          label="Найкращий прогноз"
          value={fmtMape(HISTORY_BEST?.mape)}
          sub={HISTORY_BEST ? fmtIso(HISTORY_BEST.startTime) : '—'}
          tone="green"
        />
        <SummaryCard
          label="Найгірший прогноз"
          value={fmtMape(HISTORY_WORST?.mape)}
          sub={HISTORY_WORST ? fmtIso(HISTORY_WORST.startTime) : '—'}
          tone="red"
        />
        <SummaryCard
          label="Всього записів"
          value={HISTORY_FORECASTS.length.toString()}
          sub="за останні 30 днів"
        />
      </div>

      {/* Фільтри */}
      <FilterBar
        search={search} setSearch={setSearch}
        horizon={horizon} setHorizon={setHorizon}
        quality={quality} setQuality={setQuality}
        onReset={handleReset}
        count={filtered.length}
      />

      {/* Таблиця з горизонтальним скролом */}
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-[480px] w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Дата і час
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 hidden sm:table-cell">
                  Горизонт
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 hidden md:table-cell">
                  Джерело
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 hidden lg:table-cell">
                  ГВт (прогноз / факт)
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  MAPE
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 hidden sm:table-cell">
                  Якість
                </th>
                <th className="px-4 py-2.5 w-8" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700/60">
              {pageData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-slate-500 dark:text-slate-400">
                    За вашими фільтрами нічого не знайдено
                  </td>
                </tr>
              ) : (
                pageData.map((f) => (
                  <HistoryRow
                    key={f.id}
                    forecast={f}
                    expanded={expandedId === f.id}
                    onToggle={handleToggle}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Пагінація */}
        {pageCount > 1 && (
          <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700">
            <Pagination page={safePage} pageCount={pageCount} onPage={(p) => { setPage(p); setExpandedId(null); }} />
          </div>
        )}
      </Card>
    </div>
  );
}


