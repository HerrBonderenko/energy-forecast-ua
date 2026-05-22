import { useState, useMemo, memo, useEffect } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip as RTooltip, ResponsiveContainer,
} from 'recharts';
import {
  Card, Badge, Button, IconButton,
  SectionHeader, Input, Select, Spinner,
} from '../components/ui';
import * as I from '../components/ui/Icons';
import { useToast } from '../contexts/ToastContext';
import { cx, fmtDecimal } from '../lib/utils';
import { useTheme } from '../contexts/ThemeContext';
import { getHistory } from '../lib/api';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// ── Helpers ──────────────────────────────────────────────────────────────────
function qualityTone(q) {
  return q === 'excellent' ? 'green' : q === 'good' ? 'yellow' : q === 'acceptable' ? 'slate' : 'slate';
}
function qualityLabel(q) {
  return q === 'excellent' ? 'Відмінно' : q === 'good' ? 'Добре' : q === 'acceptable' ? 'Прийнятно' : '—';
}
function horizonLabel(h) {
  const map = { '1h': '+1 год', '6h': '+6 год', '24h': '+24 год', '48h': '+48 год', '7d': '+7 днів' };
  return map[h] || h;
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

// ── Mini area chart ───────────────────────────────────────────────────────────
function MiniForecastChart({ points }) {
  const { theme } = useTheme();
  const dark = theme === 'dark';
  if (!points || !points.length) return <div className="h-32 flex items-center justify-center text-sm text-slate-400">Немає даних</div>;
  const data = points.slice(0, 48).map((p, i) => ({
    i,
    forecast: +Number(p.forecast).toFixed(2),
    lower:    +Number(p.lower_bound).toFixed(2),
    upper:    +Number(p.upper_bound).toFixed(2),
  }));
  return (
    <ResponsiveContainer width="100%" height={140}>
      <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="fcGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#2563EB" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={dark ? '#1e293b' : '#f1f5f9'} />
        <XAxis dataKey="i" tick={{ fontSize: 10, fill: dark ? '#94a3b8' : '#94a3b8' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 10, fill: dark ? '#94a3b8' : '#94a3b8' }} axisLine={false} tickLine={false} width={36} />
        <RTooltip
          contentStyle={{ background: dark ? '#1e293b' : '#fff', border: 'none', borderRadius: 6, fontSize: 12 }}
          labelFormatter={(i) => `Год ${i}`}
          formatter={(v) => [v?.toFixed ? `${v.toFixed(2)} ГВт` : v, 'Прогноз']}
        />
        <Area type="monotone" dataKey="forecast" stroke="#2563EB" strokeWidth={1.5} fill="url(#fcGrad)" dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ── Expanded detail ───────────────────────────────────────────────────────────
function ExpandedDetail({ forecastId }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE}/api/history/${forecastId}`)
      .then((r) => r.ok ? r.json() : Promise.reject(r.status))
      .then((data) => { setDetail(data); setLoading(false); })
      .catch(() => { setLoading(false); });
  }, [forecastId]);

  if (loading) {
    return (
      <div className="px-4 py-6 bg-slate-50 dark:bg-slate-900/40 border-t border-slate-200 dark:border-slate-700 flex justify-center">
        <Spinner size={20} />
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="px-4 py-6 bg-slate-50 dark:bg-slate-900/40 border-t border-slate-200 dark:border-slate-700 text-sm text-slate-500 text-center">
        Не вдалося завантажити деталі
      </div>
    );
  }

  const w = detail.weather || {};
  const cal = detail.calendar || {};

  return (
    <div className="px-4 pb-4 pt-2 bg-slate-50 dark:bg-slate-900/40 border-t border-slate-200 dark:border-slate-700 space-y-4">
      <div>
        <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
          Крива прогнозу ({detail.points?.length || 0} точок)
        </div>
        <MiniForecastChart points={detail.points} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Погода (вхід)</div>
          <dl className="space-y-1.5 text-sm">
            {[
              ['Температура', w.temperature != null ? `${Number(w.temperature).toFixed(1)} °C` : '—'],
              ['Хмарність',   w.cloud_cover != null ? `${w.cloud_cover} %` : '—'],
              ['Вітер',       w.wind_speed != null ? `${Number(w.wind_speed).toFixed(1)} м/с` : '—'],
              ['Джерело',     detail.weather_source === 'manual' ? 'Задано вручну' : detail.weather_source === 'hourly' ? 'API погодинно' : detail.weather_source === 'fallback' ? 'Резервне' : '—'],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3">
                <dt className="text-slate-500 dark:text-slate-400">{k}</dt>
                <dd className="text-slate-800 dark:text-slate-100 tabular-nums">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div>
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Параметри</div>
          {detail.name && (
            <div className="mb-2 p-2 rounded-md bg-blue-50 dark:bg-blue-900/20 text-sm font-medium text-blue-800 dark:text-blue-300">
              📌 {detail.name}
              {detail.note && <div className="text-xs font-normal mt-0.5 text-blue-600 dark:text-blue-400">{detail.note}</div>}
            </div>
          )}
          <dl className="space-y-1.5 text-sm">
            {[
              ['Початок', fmtIso(detail.start_time)],
              ['Горизонт', detail.horizon_label],
              ['Тип дня', cal.is_holiday ? 'Свято' : cal.is_weekend ? 'Вихідний' : 'Робочий'],
              ['Модель', `${detail.model_version} (MAPE ${detail.model_mape}%)`],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3">
                <dt className="text-slate-500 dark:text-slate-400">{k}</dt>
                <dd className="text-slate-800 dark:text-slate-100">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 pt-2">
        <div className="rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 text-center">
          <div className="text-[10px] uppercase tracking-wider text-slate-500">Середнє</div>
          <div className="text-base font-semibold tabular-nums mt-0.5">{fmtGW(detail.avg_gw)}</div>
        </div>
        <div className="rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 text-center">
          <div className="text-[10px] uppercase tracking-wider text-slate-500">Пік</div>
          <div className="text-base font-semibold tabular-nums mt-0.5">{fmtGW(detail.max_gw)}</div>
        </div>
        <div className="rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 text-center">
          <div className="text-[10px] uppercase tracking-wider text-slate-500">Мінімум</div>
          <div className="text-base font-semibold tabular-nums mt-0.5">{fmtGW(detail.min_gw)}</div>
        </div>
      </div>
    </div>
  );
}

// ── History row ───────────────────────────────────────────────────────────────
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
        <td className="px-4 py-3 whitespace-nowrap">
          {f.name && (
            <div className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate max-w-[180px]">{f.name}</div>
          )}
          <div className="text-sm text-slate-800 dark:text-slate-100 tabular-nums">{fmtIso(f.created_at)}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{f.model_version}</div>
        </td>
        <td className="px-4 py-3 whitespace-nowrap hidden sm:table-cell">
          <Badge tone="slate">{horizonLabel(f.horizon)}</Badge>
        </td>
        <td className="px-4 py-3 whitespace-nowrap hidden md:table-cell">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {f.source === 'auto' ? 'Авто' : 'Ручний'}
          </span>
        </td>
        <td className="px-4 py-3 whitespace-nowrap hidden lg:table-cell">
          <div className="text-sm tabular-nums text-slate-800 dark:text-slate-100">{fmtGW(f.avg_forecast)}</div>
          <div className="text-xs tabular-nums text-slate-500 dark:text-slate-400 mt-0.5">
            мін: {fmtGW(f.min_forecast)} · макс: {fmtGW(f.max_forecast)}
          </div>
        </td>
        <td className="px-4 py-3 whitespace-nowrap">
          <span className="text-sm font-semibold tabular-nums text-blue-600 dark:text-blue-400">
            {fmtMape(f.model_mape)}
          </span>
        </td>
        <td className="px-4 py-3 whitespace-nowrap hidden sm:table-cell">
          {f.quality ? (
            <Badge tone={qualityTone(f.quality)}>{qualityLabel(f.quality)}</Badge>
          ) : (
            <span className="text-xs text-slate-400">—</span>
          )}
        </td>
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
            <ExpandedDetail forecastId={f.id} />
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
          { value: '6h',  label: '+6 годин' },
          { value: '24h', label: '+24 години' },
          { value: '48h', label: '+48 годин' },
          { value: '7d',  label: '+7 днів' },
        ]}
      />
      <Select
        value={quality}
        onChange={(v) => setQuality(v)}
        options={[
          { value: 'all',        label: 'Будь-яка якість' },
          { value: 'excellent',  label: 'Відмінна' },
          { value: 'good',       label: 'Добра' },
          { value: 'acceptable', label: 'Прийнятна' },
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
      <Button variant="ghost" size="sm" leftIcon={<I.ChevronLeft size={14} />}
        disabled={page === 0} onClick={() => onPage(page - 1)}>
        Попередня
      </Button>
      <span className="text-sm text-slate-500 dark:text-slate-400 tabular-nums">
        {page + 1} / {pageCount}
      </span>
      <Button variant="ghost" size="sm" rightIcon={<I.ChevronRight size={14} />}
        disabled={page === pageCount - 1} onClick={() => onPage(page + 1)}>
        Наступна
      </Button>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
const PAGE_SIZE = 20;

export default function HistoryPage() {
  const { showToast } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [horizon, setHorizon] = useState('all');
  const [quality, setQuality] = useState('all');
  const [page, setPage]       = useState(0);
  const [expandedId, setExpandedId] = useState(null);

  // Завантажуємо з API
  useEffect(() => {
    setLoading(true);
    getHistory({ days: 30, limit: 100 })
      .then((data) => {
        setItems(data.items || []);
        setLoading(false);
      })
      .catch((err) => {
        showToast({ type: 'error', title: 'Помилка завантаження історії', description: err.message });
        setLoading(false);
      });
  }, []);

  function refresh() {
    setLoading(true);
    getHistory({ days: 30, limit: 100 })
      .then((data) => {
        setItems(data.items || []);
        setLoading(false);
        showToast({ type: 'success', title: 'Історію оновлено' });
      })
      .catch(() => setLoading(false));
  }

  function handleToggle(id) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  function handleReset() {
    setSearch(''); setHorizon('all'); setQuality('all'); setPage(0); setExpandedId(null);
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return items.filter((f) => {
      if (search && !fmtIso(f.created_at).toLowerCase().includes(q) && !(f.model_version || '').toLowerCase().includes(q)) return false;
      if (horizon !== 'all' && f.horizon !== horizon) return false;
      if (quality !== 'all' && f.quality !== quality) return false;
      return true;
    });
  }, [items, search, horizon, quality]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage  = Math.min(page, pageCount - 1);
  const pageData  = filtered.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

  // Statistics
  const avgMape = items.length ? items.reduce((s, f) => s + (f.model_mape || 0), 0) / items.length : null;
  const totalSaved = items.length;
  const manualCount = items.filter((i) => i.source === 'manual').length;
  const autoCount = totalSaved - manualCount;

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Історія прогнозів"
        subtitle="Журнал усіх збережених прогнозів з реальної SQLite БД"
        right={
          <Button variant="ghost" size="sm" leftIcon={<I.RefreshCw size={14} />} onClick={refresh}>
            Оновити
          </Button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <SummaryCard label="Всього записів" value={totalSaved.toString()} sub="за останні 30 днів" />
        <SummaryCard label="Середній MAPE моделі" value={fmtMape(avgMape)} sub={`${totalSaved} прогнозів`} tone="blue" />
        <SummaryCard label="Авто (API)" value={autoCount.toString()} sub="з Open-Meteo" tone="green" />
        <SummaryCard label="Ручні" value={manualCount.toString()} sub="задані вручну" />
      </div>

      <FilterBar
        search={search} setSearch={setSearch}
        horizon={horizon} setHorizon={setHorizon}
        quality={quality} setQuality={setQuality}
        onReset={handleReset}
        count={filtered.length}
      />

      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-[480px] w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">Дата і час</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 hidden sm:table-cell">Горизонт</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 hidden md:table-cell">Джерело</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 hidden lg:table-cell">Прогноз (середнє)</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">MAPE моделі</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 hidden sm:table-cell">Якість</th>
                <th className="px-4 py-2.5 w-8" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <Spinner size={24} />
                  </td>
                </tr>
              ) : pageData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-slate-500 dark:text-slate-400">
                    {items.length === 0
                      ? 'Поки немає збережених прогнозів. Створіть прогноз на сторінці «Прогноз».'
                      : 'За вашими фільтрами нічого не знайдено'}
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

        {pageCount > 1 && (
          <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700">
            <Pagination page={safePage} pageCount={pageCount} onPage={(p) => { setPage(p); setExpandedId(null); }} />
          </div>
        )}
      </Card>
    </div>
  );
}
