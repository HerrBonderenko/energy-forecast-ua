import { useState, useMemo } from 'react';
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
import { useToast } from '../contexts/ToastContext';
import { useTheme } from '../contexts/ThemeContext';
import {
  MEMBERSHIP_FUNCTIONS, RULES, ACTIVE_CONTEXT, ACTIVE_RULES, PIE_COLORS,
} from '../lib/mockData';
import { cx, fmtDecimal } from '../lib/utils';

// ── Helpers ──────────────────────────────────────────────────────────────────
function fmt(v, d) {
  if (v == null) return '—';
  return fmtDecimal(v, d);
}

function ruleToString(r) {
  return 'ЯКЩО ' + r.antecedents.join(' І ') + ', ТО споживання=' + r.consequent;
}

// ── TAB 1: Функції належності ────────────────────────────────────────────────
function MembershipCard({ mf }) {
  const { theme } = useTheme();
  const dark = theme === 'dark';
  const gridColor = dark ? '#1e293b' : '#f1f5f9';
  const axisColor = dark ? '#334155' : '#e2e8f0';
  const tickStyle = { fontSize: 10, fill: dark ? '#94a3b8' : '#64748b' };

  const isBar = mf.mode === 'bar' || mf.mode === 'bar-categorical';

  return (
    <Card padding="p-4">
      <div className="mb-2">
        <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{mf.title}</h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{mf.subtitle}</p>
      </div>

      <ResponsiveContainer width="100%" height={170}>
        {isBar ? (
          <BarChart data={mf.data} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
            <CartesianGrid stroke={gridColor} strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey={mf.xKey} tickLine={false} axisLine={{ stroke: axisColor }} interval={0} tick={tickStyle} />
            <YAxis domain={[0, 1]} tickCount={3} tickLine={false} axisLine={false} tick={tickStyle} />
            <RTooltip
              contentStyle={{ background: dark ? '#1e293b' : '#fff', border: 'none', borderRadius: 6, fontSize: 11 }}
              formatter={(v, name) => [fmt(v, 2), name]}
              cursor={{ fill: dark ? 'rgba(148,163,184,0.06)' : 'rgba(15,23,42,0.03)' }}
            />
            {mf.mode === 'bar' ? (
              mf.lines.map((l) => (
                <Bar key={l.key} dataKey={l.key} fill={l.color} name={l.label} radius={[3, 3, 0, 0]} animationDuration={300} />
              ))
            ) : (
              <Bar dataKey={mf.lines[0].key} name={mf.lines[0].label} radius={[3, 3, 0, 0]} animationDuration={300}>
                {mf.data.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Bar>
            )}
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

      {/* Легенда під графіком */}
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

function TabMembership() {
  return (
    <div className="space-y-4">
      <InfoBanner tone="blue" icon="Info">
        Функції належності визначають, як числові вхідні значення перетворюються на нечіткі категорії. Перекриття кривих означає, що значення може одночасно належати до кількох категорій з різними ступенями.
      </InfoBanner>
      {/* Адаптивна сітка: 1 колонка → 2 → 3 */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {MEMBERSHIP_FUNCTIONS.map((mf) => (
          <MembershipCard key={mf.id} mf={mf} />
        ))}
      </div>
    </div>
  );
}

// ── TAB 2: Таблиця правил ───────────────────────────────────────────────────
function Highlight({ text, query }) {
  if (!query) return <>{text}</>;
  const i = text.toLowerCase().indexOf(query.toLowerCase());
  if (i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <mark className="bg-amber-200/70 dark:bg-amber-700/40 rounded-sm px-0.5">
        {text.slice(i, i + query.length)}
      </mark>
      {text.slice(i + query.length)}
    </>
  );
}

function TabRules() {
  const [query, setQuery] = useState('');
  const [page, setPage]   = useState(1);
  const PER_PAGE = 10;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return RULES;
    return RULES.filter((r) => ruleToString(r).toLowerCase().includes(q));
  }, [query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const safePage   = Math.min(page, totalPages);
  const start      = (safePage - 1) * PER_PAGE;
  const pageRules  = filtered.slice(start, start + PER_PAGE);

  return (
    <div className="space-y-3">
      {/* Пошук + лічильник */}
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
          Правил: <span className="font-semibold text-slate-700 dark:text-slate-200">{RULES.length}</span>
          {query && filtered.length !== RULES.length && (
            <> · знайдено: <span className="font-semibold text-slate-700 dark:text-slate-200">{filtered.length}</span></>
          )}
        </div>
      </div>

      {/* Таблиця */}
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-[480px] w-full text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <th className="text-left font-medium px-4 py-2.5 w-10">#</th>
                <th className="text-left font-medium px-4 py-2.5">Правило (IF…THEN…)</th>
                <th className="text-left font-medium px-4 py-2.5 w-40">Вага</th>
              </tr>
            </thead>
            <tbody>
              {pageRules.length === 0 ? (
                <tr><td colSpan={3} className="px-4 py-12 text-center text-sm text-slate-500">Не знайдено</td></tr>
              ) : (
                pageRules.map((r, i) => {
                  const text = ruleToString(r);
                  return (
                    <tr key={r.id} className="border-b border-slate-200 dark:border-slate-800 last:border-b-0 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
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

      {/* Пагінація */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 flex-wrap gap-2">
          <span>
            {filtered.length === 0 ? 0 : start + 1}–{Math.min(filtered.length, start + PER_PAGE)} з {filtered.length}
          </span>
          <div className="flex items-center gap-1">
            <Button variant="secondary" size="sm" leftIcon={<I.ChevronLeft size={14} />} disabled={safePage <= 1} onClick={() => setPage((p) => p - 1)}>
              Попередня
            </Button>
            <span className="px-2 tabular-nums">{safePage} / {totalPages}</span>
            <Button variant="secondary" size="sm" rightIcon={<I.ChevronRight size={14} />} disabled={safePage >= totalPages} onClick={() => setPage((p) => p + 1)}>
              Наступна
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── TAB 3: Активні правила для прогнозу ──────────────────────────────────────

// Кільцева діаграма
function PieView() {
  const { theme } = useTheme();
  const dark = theme === 'dark';
  const data = ACTIVE_RULES.map((r, i) => ({
    name: 'R' + (i + 1),
    value: r.contribution,
    pct: r.pctOfTotal,
  }));
  return (
    <div className="relative" style={{ height: 200 }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={52}
            outerRadius={80}
            paddingAngle={2}
            stroke="none"
            animationDuration={500}
          >
            {data.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
          </Pie>
          <RTooltip
            contentStyle={{ background: dark ? '#1e293b' : '#fff', border: 'none', borderRadius: 6, fontSize: 12 }}
            formatter={(v, n) => [`${fmt(v, 2)} ГВт`, n]}
          />
        </PieChart>
      </ResponsiveContainer>
      {/* Центр пончика */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <div className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-medium">Прогноз</div>
        <div className="text-xl font-semibold text-slate-900 dark:text-slate-100 tabular-nums leading-tight">
          {fmt(ACTIVE_CONTEXT.forecast, 1)} ГВт
        </div>
      </div>
    </div>
  );
}

// Стекований бар
function StackedBar() {
  const total = ACTIVE_RULES.reduce((s, r) => s + r.contribution, 0);
  return (
    <div>
      <div className="flex h-9 w-full overflow-hidden rounded-md ring-1 ring-slate-200 dark:ring-slate-700">
        {ACTIVE_RULES.map((r, i) => {
          const w = (r.contribution / total) * 100;
          return (
            <div
              key={r.id}
              className="relative h-full hover:brightness-110 transition-all"
              style={{ width: `${w}%`, background: PIE_COLORS[i] }}
              title={`R${i + 1}: ${fmt(r.contribution, 2)} ГВт (${fmt(r.pctOfTotal, 1)}%)`}
            >
              {w > 12 && (
                <span className="absolute inset-0 flex items-center justify-center text-[11px] font-medium text-white drop-shadow-sm">
                  R{i + 1}
                </span>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-slate-400 dark:text-slate-500 tabular-nums">
        <span>0 ГВт</span>
        <span>{fmt(total, 1)} ГВт</span>
      </div>
    </div>
  );
}

function AnalysisResult() {
  const CTX = [
    { label: 'Дата',          value: ACTIVE_CONTEXT.dateLabel,           icon: I.Calendar },
    { label: 'Температура',   value: `+${ACTIVE_CONTEXT.temperature} °C`, icon: I.Thermometer },
    { label: 'День',          value: ACTIVE_CONTEXT.dayOfWeekLabel,      icon: I.Clock },
    { label: 'Сезон',         value: ACTIVE_CONTEXT.season,             icon: I.Sun },
    { label: 'Прогноз',       value: `${fmt(ACTIVE_CONTEXT.forecast, 1)} ГВт`, icon: I.TrendingUp, highlight: true },
  ];

  return (
    <div className="space-y-4">
      {/* Контекст */}
      <Card padding="p-4">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">Контекст прогнозу</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {CTX.map((c) => {
            const IconC = c.icon;
            return (
              <div
                key={c.label}
                className={cx(
                  'rounded-md border px-3 py-2.5',
                  c.highlight
                    ? 'border-blue-200 bg-blue-50/60 dark:bg-blue-950/40 dark:border-blue-900/60'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/60',
                )}
              >
                <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-medium">
                  <IconC size={11} />
                  {c.label}
                </div>
                <div className={cx(
                  'mt-1 text-sm font-semibold tabular-nums',
                  c.highlight ? 'text-blue-700 dark:text-blue-300' : 'text-slate-900 dark:text-slate-100',
                )}>
                  {c.value}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Активні правила зі силою */}
      <Card padding="p-4">
        <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Найсильніші правила</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Нечіткі правила з найбільшою активаційною силою</p>
          </div>
          <Badge tone="slate">{ACTIVE_RULES.length} активних</Badge>
        </div>
        <div className="space-y-3">
          {ACTIVE_RULES.map((r, i) => (
            <div key={r.id}>
              <div className="flex items-start gap-2 mb-1">
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono tabular-nums mt-0.5 shrink-0">{i + 1}.</span>
                <div className="font-mono text-xs leading-relaxed text-slate-800 dark:text-slate-200 min-w-0">
                  ЯКЩО {r.antecedents.join(' І ')}
                </div>
              </div>
              <div className="flex items-center gap-2 pl-4">
                <ProgressBar value={r.strength} max={1} className="flex-1" height={8} />
                <span className="text-xs tabular-nums font-medium text-slate-700 dark:text-slate-300 w-8 text-right">{fmt(r.strength, 2)}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Внесок + Pie — стек на мобільному, grid на lg+ */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <Card padding="p-4" className="lg:col-span-3">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1">Внесок у фінальний прогноз</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">Як кожне правило формує прогнозоване значення</p>
          <StackedBar />
          <div className="mt-3 space-y-1.5">
            {ACTIVE_RULES.map((r, i) => (
              <div key={r.id} className="flex items-center gap-2 text-xs">
                <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: PIE_COLORS[i] }} />
                <span className="font-mono text-slate-700 dark:text-slate-300 truncate flex-1 min-w-0">
                  R{i + 1}: ЯКЩО {r.antecedents.join(' І ')}
                </span>
                <span className="tabular-nums text-slate-500 dark:text-slate-400 shrink-0">{fmt(r.contribution, 2)} ГВт</span>
              </div>
            ))}
          </div>
        </Card>

        <Card padding="p-4" className="lg:col-span-2">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1">Розподіл впливу</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Частка кожного правила у підсумковому прогнозі</p>
          <PieView />
        </Card>
      </div>
    </div>
  );
}

function TabActiveRules() {
  const { showToast } = useToast();
  const [date, setDate]       = useState('2026-05-09');
  const [time, setTime]       = useState('18:00');
  const [analyzed, setAnalyzed] = useState(true);
  const [loading, setLoading]   = useState(false);

  const HOURS = Array.from({ length: 24 }, (_, h) => `${String(h).padStart(2, '0')}:00`);

  function onAnalyze() {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setAnalyzed(true);
      showToast({ type: 'success', title: 'Аналіз завершено', description: '5 активних правил знайдено' });
    }, 700);
  }

  return (
    <div className="space-y-4">
      {/* Форма вибору */}
      <Card padding="p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Для якої години аналізувати?</p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Дата</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="h-9 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Час</label>
                <Select value={time} onChange={(v) => setTime(v)} options={HOURS.map((h) => ({ value: h, label: h }))} />
              </div>
            </div>
          </div>
          <Button
            leftIcon={loading ? <Spinner size={14} /> : <I.Play size={14} />}
            disabled={loading}
            onClick={onAnalyze}
          >
            {loading ? 'Аналізую…' : 'Аналізувати'}
          </Button>
        </div>
      </Card>

      {analyzed ? <AnalysisResult /> : (
        <Card padding="p-10 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Натисніть «Аналізувати», щоб побачити активні правила для обраного часу.
          </p>
        </Card>
      )}
    </div>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────
const TABS = [
  { value: 'membership', label: 'Функції належності' },
  { value: 'rules',      label: 'Правила', badge: RULES.length },
  { value: 'active',     label: 'Активні правила' },
];

export default function InterpretationPage() {
  const [tab, setTab]       = useState('membership');
  const [helpOpen, setHelpOpen] = useState(false);

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Структура нечіткої моделі"
        subtitle="Як ANFIS приймає рішення — функції належності і правила виведення"
        right={
          <Button variant="secondary" size="sm" leftIcon={<I.Info size={14} />} onClick={() => setHelpOpen(true)}>
            Що це?
          </Button>
        }
      />

      {/* Tabs з overflow-x-auto */}
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
                  {t.badge != null && (
                    <span className="ml-1.5 inline-flex items-center rounded-md bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 dark:text-slate-300">
                      {t.badge}
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

      {/* Help Modal */}
      <Modal
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
        title="Що таке нечітка логіка?"
        footer={<Button onClick={() => setHelpOpen(false)}>Зрозуміло</Button>}
      >
        <div className="space-y-3 leading-relaxed text-slate-700 dark:text-slate-300">
          <p>
            <span className="font-medium text-slate-900 dark:text-slate-100">Нечітка логіка</span> — це підхід, у якому числові величини (температура, час доби) перетворюються на людино-зрозумілі категорії (низька, помірна, висока) з частковою належністю.
          </p>
          <p>
            <span className="font-medium text-slate-900 dark:text-slate-100">ANFIS</span> (Adaptive Neuro-Fuzzy Inference System) поєднує нечітку логіку з нейронною мережею: правила «ЯКЩО…ТО…» налаштовуються автоматично на історичних даних, але залишаються зрозумілими людині.
          </p>
          <p>
            Це і є ключова перевага моделі — вона <span className="font-medium text-slate-900 dark:text-slate-100">пояснювана</span>: для будь-якого прогнозу можна побачити, які правила і з якою силою спрацювали.
          </p>
        </div>
      </Modal>
    </div>
  );
}
