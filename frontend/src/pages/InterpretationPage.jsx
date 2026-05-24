import { useState, useEffect, useMemo } from 'react';
import {
  LineChart, Line, BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Card, CardBody, Badge, Button, Modal, InfoBanner,
  SectionHeader, Input, Select, ProgressBar, Spinner,
} from '../components/ui';
import * as I from '../components/ui/Icons';
import Tooltip from '../components/ui/Tooltip';
import { useToast } from '../contexts/ToastContext';
import { useTheme } from '../contexts/ThemeContext';
import { MEMBERSHIP_FUNCTIONS, PIE_COLORS } from '../lib/mockData';
import { cx, fmtDecimal } from '../lib/utils';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function fmt(v, d) {
  if (v == null) return '—';
  return fmtDecimal(v, d);
}

// ── TAB 1: Функції належності (РЕАЛЬНІ — лише ті що в моделі) ────────────
function MembershipCard({ mf }) {
  const { theme } = useTheme();
  const dark = theme === 'dark';
  const gridColor = dark ? '#1e293b' : '#e2e8f0';
  const axisColor = dark ? '#334155' : '#cbd5e1';
  const tickStyle = { fontSize: 10, fill: dark ? '#94a3b8' : '#64748b' };

  return (
    <Card padding="p-4">
      <div className="mb-2">
        <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{mf.title}</h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{mf.subtitle}</p>
      </div>
      <ResponsiveContainer width="100%" height={170}>
        {mf.type === 'bar' ? (
          <BarChart data={mf.data} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
            <CartesianGrid stroke={gridColor} strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey={mf.xKey} tickLine={false} axisLine={{ stroke: axisColor }} tick={tickStyle} />
            <YAxis domain={[0, 1]} tickCount={3} tickLine={false} axisLine={false} tick={tickStyle} />
            <RTooltip
              contentStyle={{ background: dark ? '#1e293b' : '#fff', border: 'none', borderRadius: 6, fontSize: 11 }}
              formatter={(v, name) => [fmt(v, 2), name]}
            />
            <Bar dataKey={mf.lines[0].key} name={mf.lines[0].label} radius={[3, 3, 0, 0]} animationDuration={300}>
              {mf.data.map((d, i) => <Cell key={i} fill={d.color} />)}
            </Bar>
          </BarChart>
        ) : (
          <LineChart data={mf.data} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
            <CartesianGrid stroke={gridColor} strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey={mf.xKey}
              type="number"
              domain={['dataMin', 'dataMax']}
              tickLine={false}
              axisLine={{ stroke: axisColor }}
              tick={tickStyle}
              label={mf.xLabel ? { value: mf.xLabel, position: 'insideBottomRight', offset: -2, style: { fontSize: 10, fill: tickStyle.fill } } : undefined}
            />
            <YAxis domain={[0, 1]} tickCount={3} tickLine={false} axisLine={false} tick={tickStyle} />
            <RTooltip
              contentStyle={{ background: dark ? '#1e293b' : '#fff', border: 'none', borderRadius: 6, fontSize: 11 }}
              formatter={(v, name) => [fmt(v, 2), name]}
              labelFormatter={(x) => `${fmt(x, 1)}${mf.xLabel ? ' ' + mf.xLabel : ''}`}
            />
            {mf.lines.map((l) => (
              <Line key={l.key} type="monotone" dataKey={l.key} stroke={l.color} strokeWidth={2} dot={false} name={l.label} animationDuration={300} />
            ))}
          </LineChart>
        )}
      </ResponsiveContainer>
      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
        {mf.lines.map((l) => (
          <span key={l.key} className="inline-flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-300">
            <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: l.color }} />
            {l.label}
          </span>
        ))}
      </div>
    </Card>
  );
}

// Які МФ показуємо — ТІЛЬКИ ТІ ЩО В МОДЕЛІ

// Дані трикутних МФ для температури
function buildTempData() {
  const terms = [
    { label: 'мороз',      a: -35, b: -10, c: -2,  color: '#818CF8' },
    { label: 'холодна',    a: -5,  b: 2,   c: 10,  color: '#60A5FA' },
    { label: 'прохолодна', a: 5,   b: 12,  c: 18,  color: '#34D399' },
    { label: 'помірна',    a: 14,  b: 20,  c: 26,  color: '#FBBF24' },
    { label: 'тепла',      a: 22,  b: 27,  c: 32,  color: '#F97316' },
    { label: 'спека',      a: 28,  b: 35,  c: 45,  color: '#F43F5E' },
  ];
  const points = [];
  for (let t = -35; t <= 45; t += 1) {
    const pt = { x: t };
    terms.forEach(({ label, a, b, c }) => {
      let v = 0;
      if (t > a && t < c) {
        v = t <= b ? (t - a) / (b - a || 1) : (c - t) / (c - b || 1);
      }
      pt[label] = +v.toFixed(3);
    });
    points.push(pt);
  }
  return { points, terms };
}
const TEMP_MF = buildTempData();

const ALLOWED_MF_IDS = ['temperature', 'hour', 'cloud', 'wind', 'season', 'weekday-simple', 'holiday-simple'];

const SIMPLE_MFS = [
  {
    id: 'temperature-real',
    title: 'Температура',
    subtitle: '6 термів — від морозу до спеки',
    type: 'line',
    xKey: 'x',
    xLabel: '°C',
    lines: TEMP_MF.terms.map(t => ({ key: t.label, label: t.label, color: t.color })),
    data: TEMP_MF.points,
  },
  {
    id: 'weekday-simple',
    title: 'День тижня',
    subtitle: 'Робочий vs вихідний',
    type: 'bar',
    xKey: 'name',
    lines: [{ key: 'value', label: 'належність', color: '#60A5FA' }],
    data: [
      { name: 'Робочий (пн–пт)', value: 1.0, color: '#60A5FA' },
      { name: 'Вихідний (сб–нд)', value: 1.0, color: '#FB923C' },
    ],
  },
  {
    id: 'holiday-simple',
    title: 'Тип календарного дня',
    subtitle: 'Звичайний vs свято',
    type: 'bar',
    xKey: 'name',
    lines: [{ key: 'value', label: 'належність', color: '#34D399' }],
    data: [
      { name: 'Звичайний', value: 1.0, color: '#34D399' },
      { name: 'Свято',     value: 1.0, color: '#F59E0B' },
    ],
  },
];

function TabMembership() {
  // Фільтруємо MEMBERSHIP_FUNCTIONS — залишаємо тільки реальні в моделі
  const realMfs = MEMBERSHIP_FUNCTIONS.filter(mf =>
    ['hour', 'cloud', 'wind', 'season'].includes(mf.id)
  );
  const allMfs = [...SIMPLE_MFS, ...realMfs];

  return (
    <div className="space-y-4">
      <InfoBanner tone="blue" icon="Info">
        <Tooltip content="Криві що визначають ступінь належності значення до нечіткої категорії (від 0 до 1)"><span className="font-medium border-b border-dashed border-blue-300 dark:border-blue-700 cursor-help">Функції належності</span></Tooltip> визначають, як числові вхідні значення перетворюються на нечіткі категорії.
        Модель ANFIS v3.1.0 використовує <span className="font-semibold">7 вхідних змінних</span>: температура, час доби, день тижня (робочий/вихідний), сезон, хмарність, швидкість вітру, державне свято.
      </InfoBanner>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {allMfs.map((mf) => (
          <MembershipCard key={mf.id} mf={mf} />
        ))}
      </div>
    </div>
  );
}

// ── TAB 2: Таблиця правил (РЕАЛЬНІ з API) ────────────────────────────────────
function Highlight({ text, query }) {
  if (!query) return <>{text}</>;
  const i = text.toLowerCase().indexOf(query.toLowerCase());
  if (i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <mark className="bg-amber-200/70 dark:bg-amber-700/40 rounded-sm px-0.5">{text.slice(i, i + query.length)}</mark>
      {text.slice(i + query.length)}
    </>
  );
}

function TabRules() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [page, setPage]   = useState(1);
  const PER_PAGE = 10;

  useEffect(() => {
    fetch(`${API_BASE}/api/model/rules`)
      .then(r => r.json())
      .then(d => { setRules(d.rules || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rules;
    return rules.filter((r) => (r.condition || '').toLowerCase().includes(q));
  }, [query, rules]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const safePage   = Math.min(page, totalPages);
  const start      = (safePage - 1) * PER_PAGE;
  const pageRules  = filtered.slice(start, start + PER_PAGE);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="w-full sm:w-72">
          <Input
            leftIcon={<I.Search size={14} />}
            placeholder="Пошук у правилах…"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1); }}
          />
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400">
          Правил: <span className="font-semibold text-slate-700 dark:text-slate-200">{rules.length}</span>
          {query && filtered.length !== rules.length && (
            <> · знайдено: <span className="font-semibold text-slate-700 dark:text-slate-200">{filtered.length}</span></>
          )}
        </div>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-[480px] w-full text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <th className="text-left font-medium px-4 py-2.5 w-10">#</th>
                <th className="text-left font-medium px-4 py-2.5"><Tooltip content="База нечітких правил типу ЯКЩО (умови) ТО (наслідок). Кожне правило має консеквент — числове значення яке додається до прогнозу."><span className="border-b border-dashed border-slate-300 dark:border-slate-600 cursor-help">Правило (IF…THEN…)</span></Tooltip></th>
                <th className="text-left font-medium px-4 py-2.5 w-40"><Tooltip content="Абсолютне значення консеквента — наскільки сильно правило впливає на прогноз"><span className="border-b border-dashed border-slate-300 dark:border-slate-600 cursor-help">Вага</span></Tooltip></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={3} className="px-4 py-12 text-center"><Spinner size={20} /></td></tr>
              ) : pageRules.length === 0 ? (
                <tr><td colSpan={3} className="px-4 py-12 text-center text-sm text-slate-500">Не знайдено</td></tr>
              ) : (
                pageRules.map((r, i) => {
                  const text = `ЯКЩО ${r.condition}, ТО споживання=${r.consequent_gw >= 0 ? '+' : ''}${r.consequent_gw.toFixed(2)} ГВт`;
                  return (
                    <tr key={r.id} className="border-b border-slate-200 dark:border-slate-800 last:border-b-0 hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      <td className="px-4 py-3 text-xs text-slate-400 dark:text-slate-500 tabular-nums">{start + i + 1}</td>
                      <td className="px-4 py-3">
                        <div className="font-mono text-[12px] leading-relaxed text-slate-800 dark:text-slate-200">
                          <Highlight text={text} query={query.trim()} />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <ProgressBar value={r.weight} max={1} className="flex-1" height={6} />
                          <span className="text-xs tabular-nums font-medium text-slate-700 dark:text-slate-300 w-8 text-right">{fmt(r.weight, 2)}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 flex-wrap gap-2">
          <span>{filtered.length === 0 ? 0 : start + 1}–{Math.min(filtered.length, start + PER_PAGE)} з {filtered.length}</span>
          <div className="flex items-center gap-1">
            <Button variant="secondary" size="sm" leftIcon={<I.ChevronLeft size={14} />} disabled={safePage <= 1} onClick={() => setPage((p) => p - 1)}>Попередня</Button>
            <span className="px-2 tabular-nums">{safePage} / {totalPages}</span>
            <Button variant="secondary" size="sm" rightIcon={<I.ChevronRight size={14} />} disabled={safePage >= totalPages} onClick={() => setPage((p) => p + 1)}>Наступна</Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── TAB 3: Активні правила (РЕАЛЬНІ через POST /api/model/analyze) ───────
function TabActiveRules() {
  const { showToast } = useToast();
  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(today);
  const [time, setTime] = useState('18:00');
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleAnalyze() {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/model/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, time }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setAnalysis(data);
    } catch (e) {
      showToast({ type: 'error', title: 'Помилка аналізу', description: e.message });
    } finally {
      setLoading(false);
    }
  }

  // Авто-аналіз при першому відкритті
  useEffect(() => {
    handleAnalyze();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-4">
      {/* Форма вибору моменту */}
      <Card padding="p-4">
        <div className="text-sm font-semibold mb-3 text-slate-900 dark:text-slate-100">Для якої години аналізувати?</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          <div>
            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Дата</label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Час</label>
            <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </div>
          <Button variant="primary" leftIcon={<I.Zap size={14} />} onClick={handleAnalyze} disabled={loading}>
            {loading ? 'Аналізую…' : 'Аналізувати'}
          </Button>
        </div>
      </Card>

      {!analysis ? (
        <Card padding="p-8" className="text-center text-slate-500">
          {loading ? <Spinner size={24} /> : 'Натисніть «Аналізувати»'}
        </Card>
      ) : (
        <>
          {/* Контекст прогнозу */}
          <Card padding="p-4">
            <div className="text-sm font-semibold mb-3 text-slate-900 dark:text-slate-100">Контекст прогнозу</div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[
                { icon: 'Calendar', label: 'Дата',        value: `${analysis.context.date}, ${analysis.context.time}` },
                { icon: 'Thermometer', label: 'Температура', value: `${analysis.context.temperature >= 0 ? '+' : ''}${analysis.context.temperature} °C` },
                { icon: 'Calendar', label: 'День',        value: `${analysis.context.weekday} (${analysis.context.day_type.toLowerCase()})` },
                { icon: 'Sun',      label: 'Сезон',       value: analysis.context.season },
                { icon: 'TrendingUp', label: 'Прогноз',   value: `${analysis.forecast_gw} ГВт`, highlight: true },
              ].map((item) => (
                <div key={item.label} className={cx(
                  'rounded-md border p-3',
                  item.highlight
                    ? 'border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40'
                )}>
                  <div className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400">{item.label}</div>
                  <div className={cx('text-sm font-semibold mt-1', item.highlight ? 'text-blue-700 dark:text-blue-300' : 'text-slate-800 dark:text-slate-100')}>
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Топ-5 правил */}
          <Card padding="p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100"><Tooltip content="Топ-5 правил з найбільшою активаційною силою для обраної дати/часу"><span className="border-b border-dashed border-slate-300 dark:border-slate-600 cursor-help">Найсильніші правила</span></Tooltip></div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Нечіткі правила з найбільшою активаційною силою</div>
              </div>
              <Badge tone="slate">{analysis.active_rules.filter(r => r.weight > 0).length} активних</Badge>
            </div>
            <div className="space-y-2.5">
              {analysis.active_rules.filter(r => r.weight > 0).map((r, i) => {
                const tone = r.weight > 0.7 ? 'bg-emerald-500' : r.weight >= 0.4 ? 'bg-amber-500' : 'bg-slate-400';
                return (
                  <div key={r.id} className="flex items-center gap-2.5">
                    <div className="w-5 text-xs text-slate-500 tabular-nums">{i + 1}.</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-mono text-slate-700 dark:text-slate-300 mb-1 truncate" title={r.condition}>
                        ЯКЩО {r.condition}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div className={cx('h-full', tone)} style={{ width: `${r.weight * 100}%` }} />
                        </div>
                        <span className="text-xs tabular-nums font-medium text-slate-700 dark:text-slate-300 w-10 text-right">
                          {fmt(r.weight, 2)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Внесок у фінальний прогноз */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            <Card padding="p-4" className="lg:col-span-3">
              <div className="text-sm font-semibold mb-2 text-slate-900 dark:text-slate-100"><Tooltip content="Як кожне активне правило додає або віднімає від базового рівня для формування підсумкового прогнозу"><span className="border-b border-dashed border-slate-300 dark:border-slate-600 cursor-help">Внесок у фінальний прогноз</span></Tooltip></div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mb-3">Як кожне правило формує прогнозоване значення</div>
              <div className="space-y-2">
                {analysis.active_rules.filter(r => r.weight > 0).map((r, i) => (
                  <div key={r.id} className="flex items-center gap-2 text-xs">
                    <span className="font-medium text-slate-700 dark:text-slate-300 w-8">R{i + 1}:</span>
                    <span className="flex-1 font-mono text-slate-600 dark:text-slate-400 truncate">{r.condition}</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200 tabular-nums w-20 text-right">
                      {r.contribution_gw.toFixed(2)} ГВт
                    </span>
                  </div>
                ))}
                <div className="border-t pt-2 mt-2 flex items-center gap-2 text-sm font-semibold">
                  <span className="flex-1 text-slate-700 dark:text-slate-200">Сума (фінальний прогноз):</span>
                  <span className="text-blue-700 dark:text-blue-300 tabular-nums">{analysis.forecast_gw} ГВт</span>
                </div>
              </div>
            </Card>

            {/* Розподіл впливу */}
            <Card padding="p-4" className="lg:col-span-2">
              <div className="text-sm font-semibold mb-2 text-slate-900 dark:text-slate-100"><Tooltip content="Pie-діаграма часток кожного активного правила у фінальному прогнозі"><span className="border-b border-dashed border-slate-300 dark:border-slate-600 cursor-help">Розподіл впливу</span></Tooltip></div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mb-3">Частка кожного правила</div>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={analysis.active_rules.filter(r => r.weight > 0).map((r, i) => ({ name: `R${i+1}`, value: Math.abs(r.contribution_gw) }))}
                    dataKey="value"
                    cx="50%" cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={2}
                  >
                    {analysis.active_rules.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <RTooltip
                    formatter={(v) => `${fmt(v, 2)} ГВт`}
                    contentStyle={{ background: 'rgba(15,23,42,0.95)', border: 'none', borderRadius: 6, fontSize: 11, color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="text-center text-xs text-slate-500 dark:text-slate-400 -mt-2">
                Прогноз: <span className="font-semibold text-slate-800 dark:text-slate-200">{analysis.forecast_gw} ГВт</span>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

// ── Root ─────────────────────────────────────────────────────────────────────
const TABS = [
  { value: 'membership', label: 'Функції належності' },
  { value: 'rules',      label: 'Правила' },
  { value: 'active',     label: 'Активні правила' },
];

export default function InterpretationPage() {
  const [tab, setTab] = useState('membership');
  const [rulesCount, setRulesCount] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/model/rules`)
      .then(r => r.json())
      .then(d => setRulesCount(d.rules?.length || 0))
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Структура нечіткої моделі"
        subtitle="Як ANFIS приймає рішення — функції належності і правила виведення"
      />

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
                  {t.value === 'rules' && rulesCount != null && (
                    <span className="ml-2 inline-flex items-center px-1.5 py-0.5 text-[10px] rounded bg-slate-200 dark:bg-slate-700">
                      {rulesCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div>
        {tab === 'membership' && <TabMembership />}
        {tab === 'rules'      && <TabRules />}
        {tab === 'active'     && <TabActiveRules />}
      </div>
    </div>
  );
}
