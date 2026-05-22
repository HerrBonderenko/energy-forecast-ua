import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ComposedChart, Line, Area,
  XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Card, CardTitle, Badge, Button, Modal,
  Label, Input, Select, Slider, Switch, Checkbox, Textarea,
  SectionHeader, SectionDivider, DeltaChip, ProgressBar,
} from '../components/ui';
import * as I from '../components/ui/Icons';
import { useToast } from '../contexts/ToastContext';
import { useTheme } from '../contexts/ThemeContext';
import { useScenarios } from '../contexts/ScenariosContext';
import { getCurrentWeather } from '../lib/api';
import {
  BASELINE_CURVE, FUZZY_RULES_SHORT, SENSITIVITIES,
} from '../lib/mockData';
import { cx, fmtDecimal, applyWhatIf, NBSP } from '../lib/utils';

// ── Helpers ──────────────────────────────────────────────────────────────────
function fmtGW(v) { return `${fmtDecimal(v, 2)}${NBSP}ГВт`; }
function fmtPct(v, d = 1) { return `${fmtDecimal(v, d)}${NBSP}%`; }

const SENSITIVITY_COLORS = ['#1E40AF', '#2563EB', '#3B82F6', '#60A5FA', '#93C5FD', '#BFDBFE'];

// ── Change slider ─────────────────────────────────────────────────────────────
function ChangeSlider({ label, unit, value, onChange, min, max, step, decimals = 0 }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <Label className="text-xs">{label}</Label>
        <DeltaChip value={value} unit={unit} />
      </div>
      <Slider value={value} onChange={onChange} min={min} max={max} step={step} />
      <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 font-mono">
        <span>{fmtDecimal(min, decimals)}{NBSP}{unit}</span>
        <span>+{fmtDecimal(max, decimals)}{NBSP}{unit}</span>
      </div>
    </div>
  );
}

// ── Result card (кольорова плашка вгорі) ─────────────────────────────────────
function ResultCard({ computed, dTemp }) {
  const { theme } = useTheme();
  const dark = theme === 'dark';
  if (!computed) return <div className="h-28 rounded-lg border border-slate-200 dark:border-slate-700 animate-pulse bg-slate-50 dark:bg-slate-800" />;

  const dir = Math.abs(computed.pct) < 0.5 ? 'neutral' : computed.pct > 0 ? 'up' : 'down';

  const styles = {
    up:      { strip: '#EA580C', label: 'СПОЖИВАННЯ ЗРОСЛО',     bg: dark ? '#1F1410' : '#FFF7ED', border: dark ? '#3a2418' : '#FED7AA', badge: dark ? '#FB923C' : '#9A3412', pct: dark ? '#FB923C' : '#C2410C' },
    down:    { strip: '#16A34A', label: 'СПОЖИВАННЯ ЗМЕНШИЛОСЬ', bg: dark ? '#0F1F15' : '#F0FDF4', border: dark ? '#1a3320' : '#BBF7D0', badge: dark ? '#4ADE80' : '#166534', pct: dark ? '#4ADE80' : '#15803D' },
    neutral: { strip: '#64748B', label: 'БЕЗ ЗМІН',             bg: dark ? '#1E293B' : '#F8FAFC', border: dark ? '#334155' : '#E2E8F0', badge: dark ? '#94A3B8' : '#475569', pct: dark ? '#94A3B8' : '#475569' },
  };
  const s = styles[dir];

  const headline = dTemp !== 0
    ? `Зміна температури на ${dTemp > 0 ? '+' : '-'}${Math.abs(dTemp)}°C`
    : 'Поточний сценарій';

  return (
    <div className="relative rounded-lg border shadow-sm overflow-hidden" style={{ background: s.bg, borderColor: s.border }}>
      <span className="absolute left-0 top-0 bottom-0 w-1" style={{ background: s.strip }} />
      <div className="p-4 pl-6">
        <div className="text-xs font-semibold tracking-wider uppercase mb-1.5" style={{ color: s.badge }}>{s.label}</div>
        <h2 className="text-xl font-semibold" style={{ color: dark ? '#F1F5F9' : '#0F172A' }}>{headline}</h2>
        <p className="mt-1.5 text-sm" style={{ color: dark ? '#CBD5E1' : '#334155' }}>
          {dir === 'up'      && 'збільшує прогнозоване споживання на '}
          {dir === 'down'    && 'зменшує прогнозоване споживання на '}
          {dir === 'neutral' && 'споживання залишається в межах '}
          <span className="font-semibold font-mono tabular-nums" style={{ color: s.pct }}>
            {fmtPct(Math.abs(computed.pct))}
          </span>
          {dir !== 'neutral' && ' за добу'}
        </p>
        <p className="mt-1.5 text-xs" style={{ color: dark ? '#94A3B8' : '#64748B' }}>
          з {fmtGW(computed.baselineAvg)} до {fmtGW(computed.modifiedAvg)} у середньому за добу
        </p>
      </div>
    </div>
  );
}

// ── Comparison Chart ──────────────────────────────────────────────────────────
function ComparisonChart({ computed }) {
  const { theme } = useTheme();
  const dark = theme === 'dark';

  const data = useMemo(() => {
    if (!computed) return [];
    return BASELINE_CURVE.map((b, i) => {
      const m = computed.curve[i];
      return { h: String(i).padStart(2, '0'), baseline: b, modified: m, lower: Math.min(b, m), fillHeight: Math.abs(b - m) };
    });
  }, [computed]);

  if (!computed) return <div className="h-72 rounded-lg border border-slate-200 dark:border-slate-700 animate-pulse bg-slate-50 dark:bg-slate-800" />;

  const dir        = computed.pct > 0.5 ? 'up' : computed.pct < -0.5 ? 'down' : 'neutral';
  const fillColor  = dir === 'up' ? (dark ? 'rgba(251,146,60,0.22)' : 'rgba(251,146,60,0.28)') : dir === 'down' ? (dark ? 'rgba(74,222,128,0.20)' : 'rgba(34,197,94,0.22)') : 'rgba(148,163,184,0.18)';
  const baseColor  = '#94A3B8';
  const modColor   = dark ? '#60A5FA' : '#2563EB';
  const gridColor  = dark ? '#1e293b' : '#e2e8f0';
  const tickStyle  = { fontSize: 11, fill: dark ? '#94a3b8' : '#64748b' };

  return (
    <Card>
      <div className="px-5 pt-5 pb-3 flex flex-wrap items-center justify-between gap-3">
        <CardTitle className="text-base">Порівняння сценаріїв (24 години)</CardTitle>
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
          {[
            { color: baseColor, dashed: true,  label: 'Базовий' },
            { color: modColor,  dashed: false, label: 'Модифікований' },
          ].map((l) => (
            <span key={l.label} className="inline-flex items-center gap-1.5">
              <svg width="18" height="6" viewBox="0 0 18 6"><line x1="0" y1="3" x2="18" y2="3" stroke={l.color} strokeWidth="2" strokeDasharray={l.dashed ? '4 3' : ''} /></svg>
              {l.label}
            </span>
          ))}
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-sm" style={{ background: fillColor }} />Δ
          </span>
        </div>
      </div>
      <div className="px-5 pb-5">
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={data} margin={{ top: 6, right: 8, left: -10, bottom: 0 }}>
            <CartesianGrid stroke={gridColor} strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="h" tick={tickStyle} tickLine={false} axisLine={{ stroke: gridColor }} interval={2} tickFormatter={(v) => `${v}:00`} />
            <YAxis tick={tickStyle} tickLine={false} axisLine={false} tickFormatter={(v) => fmtDecimal(v, 0)} width={38} />
            <RTooltip
              contentStyle={{ background: dark ? '#0f172a' : '#fff', border: `1px solid ${gridColor}`, borderRadius: 6, fontSize: 12 }}
              formatter={(v, name) => {
                if (v == null || name === 'Δ') return null;
                return [`${fmtDecimal(v, 2)} ГВт`, name];
              }}
              labelFormatter={(l) => `${l}:00`}
            />
            <Area type="monotone" dataKey="lower"      stackId="diff" stroke="none" fill="transparent" isAnimationActive={false} />
            <Area type="monotone" dataKey="fillHeight" stackId="diff" name="Δ" stroke="none" fill={fillColor} isAnimationActive={false} />
            <Line type="monotone" dataKey="baseline" name="Базовий"        stroke={baseColor} strokeWidth={1.75} strokeDasharray="6 4" dot={false} isAnimationActive={false} />
            <Line type="monotone" dataKey="modified" name="Модифікований"  stroke={modColor}  strokeWidth={2.25} dot={false} isAnimationActive={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

// ── Rules + Sensitivity ───────────────────────────────────────────────────────
function RulesCard() {
  return (
    <Card padding="p-5">
      <CardTitle className="text-sm mb-3">Найвпливовіші правила</CardTitle>
      <div className="space-y-3">
        {FUZZY_RULES_SHORT.map((r) => (
          <div key={r.id} className="flex items-start gap-2.5 py-0.5">
            <p className="flex-1 text-xs font-mono leading-relaxed text-slate-600 dark:text-slate-300">{r.text}</p>
            <Badge
              tone={r.weight > 0.7 ? 'green' : r.weight >= 0.4 ? 'yellow' : 'slate'}
              className="font-mono whitespace-nowrap shrink-0"
            >
              {fmtDecimal(r.weight, 2)}
            </Badge>
          </div>
        ))}
      </div>
    </Card>
  );
}

function SensitivityCard() {
  return (
    <Card padding="p-5">
      <CardTitle className="text-sm mb-3">Чутливість до факторів</CardTitle>
      <div className="space-y-2.5">
        {SENSITIVITIES.map((s, i) => (
          <div key={s.feature} className="grid grid-cols-[100px_1fr] items-center gap-3">
            <div className="text-xs text-slate-600 dark:text-slate-300 truncate">{s.feature}</div>
            <div className="relative h-5 rounded-md bg-slate-100 dark:bg-slate-700/60 overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 rounded-md flex items-center justify-end pr-2"
                style={{ width: `${s.value}%`, background: SENSITIVITY_COLORS[Math.min(i, 5)] }}
              >
                <span className="text-[10px] font-mono font-semibold text-white tabular-nums">{s.value}{NBSP}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ── Save Modal ────────────────────────────────────────────────────────────────
function SaveModal({ open, onClose, onSave }) {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');

  function handleSave() {
    if (!name.trim()) return;
    onSave(name.trim(), desc.trim());
    setName(''); setDesc('');
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Зберегти сценарій"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Скасувати</Button>
          <Button disabled={!name.trim()} onClick={handleSave}>Зберегти</Button>
        </>
      }
    >
      <div className="space-y-3">
        <div>
          <Label className="block mb-1.5">Назва сценарію</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="напр., Холодний понеділок"
            autoFocus
          />
        </div>
        <div>
          <Label className="block mb-1.5">Опис (необов'язково)</Label>
          <Textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Що моделює цей сценарій"
            rows={3}
          />
        </div>
      </div>
    </Modal>
  );
}

// ── Root ─────────────────────────────────────────────────────────────────────
export default function ScenarioAnalysisPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { scenarios, addScenario, getScenario } = useScenarios();
  const [searchParams] = useSearchParams();
  const scenarioIdFromUrl = searchParams.get('id');

  const [dTemp,  setDTemp]  = useState(0);
  const [dCloud, setDCloud] = useState(0);
  const [dWind,  setDWind]  = useState(0);
  const [isWeekend,    setIsWeekend]    = useState(false);
  const [isHoliday,    setIsHoliday]    = useState(false);
  const [baseline, setBaseline] = useState({
    temperature: 8,
    cloud_cover: 40,
    date: new Date(),
    weekday: new Date().getDay(),
  });

  // Завантаження реальної поточної погоди Києва
  useEffect(() => {
    let cancelled = false;
    getCurrentWeather()
      .then((w) => {
        if (cancelled || !w) return;
        setBaseline({
          temperature: w.temperature ?? 8,
          cloud_cover: w.cloud_cover ?? 40,
          date: new Date(),
          weekday: new Date().getDay(),
        });
      })
      .catch(() => {
        // fallback на дефолтні значення
      });
    return () => { cancelled = true; };
  }, []);
  const [saveOpen, setSaveOpen] = useState(false);
  const [loadOpen, setLoadOpen] = useState(false);

  // Реактивне обчислення
  const [computed, setComputed] = useState(null);
  useEffect(() => {
    const t = setTimeout(() => {
      const { curve, pct } = applyWhatIf(BASELINE_CURVE, { dTemp, dCloud, dWind, isWeekend, isHoliday });
      const baselineAvg = BASELINE_CURVE.reduce((a, b) => a + b, 0) / 24;
      setComputed({
        curve, pct,
        baselineAvg,
        modifiedAvg: curve.reduce((a, b) => a + b, 0) / 24,
        baselineMax: Math.max(...BASELINE_CURVE), modifiedMax: Math.max(...curve),
        baselineMin: Math.min(...BASELINE_CURVE), modifiedMin: Math.min(...curve),
      });
    }, 100);
    return () => clearTimeout(t);
  }, [dTemp, dCloud, dWind, isWeekend, isHoliday]);

  function reset() {
    setDTemp(0); setDCloud(0); setDWind(0);
    setIsWeekend(false); setIsHoliday(false); setIsPreHoliday(false); setIsSchoolBreak(false);
  }

  function loadScenario(s) {
    setDTemp(s.deltas?.dTemp || 0);
    setDCloud(s.deltas?.dCloud || 0);
    setDWind(s.deltas?.dWind || 0);
    setIsWeekend(!!s.deltas?.isWeekend);
    setIsHoliday(!!s.deltas?.isHoliday);
    setLoadOpen(false);
    showToast({ type: 'info', title: 'Сценарій завантажено', description: `«${s.name}»` });
  }

  // Авто-завантаження сценарію з URL (при кліку «Відкрити» на сторінці Мої сценарії)
  useEffect(() => {
    if (scenarioIdFromUrl && scenarios.length > 0) {
      const s = getScenario(scenarioIdFromUrl);
      if (s) loadScenario(s);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenarioIdFromUrl, scenarios.length]);

  function handleSave(name, desc) {
    const dir = !computed ? 'neutral' : Math.abs(computed.pct) < 0.5 ? 'neutral' : computed.pct > 0 ? 'up' : 'down';
    addScenario({
      name,
      description: desc || null,
      createdAt: new Date().toISOString(),
      deltaPct: +(computed?.pct || 0).toFixed(2),
      direction: dir,
      curve: computed ? [...computed.curve] : [...BASELINE_CURVE],
      deltas: { dTemp, dCloud, dWind, isWeekend, isHoliday },
    });
    showToast({ type: 'success', title: 'Сценарій збережено', description: `«${name}»` });
    setSaveOpen(false);
  }

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Сценарний аналіз"
        subtitle="Дослідіть, як зміна умов впливає на прогнозоване споживання"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* ── Ліва панель керування ── */}
        <div className="lg:col-span-1 space-y-4 lg:sticky lg:top-6 self-start">
          {/* Базовий сценарій */}
          <Card padding="p-4">
            <CardTitle className="text-sm mb-3">Базовий сценарій</CardTitle>
            <dl className="space-y-1.5 text-sm">
              {(() => {
                const months = ['січня','лютого','березня','квітня','травня','червня','липня','серпня','вересня','жовтня','листопада','грудня'];
                const d = baseline.date;
                const dateStr = `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}, ${String(d.getHours()).padStart(2,'0')}:00`;
                const isWknd = baseline.weekday === 0 || baseline.weekday === 6;
                const dayLbl = isWknd ? 'Вихідний' : 'Робочий';
                const tempSign = baseline.temperature >= 0 ? '+' : '';
                return [
                  ['Дата',        dateStr],
                  ['Тип дня',     dayLbl],
                  ['Температура', `${tempSign}${Math.round(baseline.temperature)} °C`],
                  ['Хмарність',   `${Math.round(baseline.cloud_cover)} %`],
                ];
              })().map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3">
                  <dt className="text-slate-500 dark:text-slate-400">{k}</dt>
                  <dd className="font-medium font-mono tabular-nums text-slate-900 dark:text-slate-100">{v}</dd>
                </div>
              ))}
            </dl>
            <button
              onClick={reset}
              className="mt-3 inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            >
              <I.RefreshCw size={12} />Скинути до базового
            </button>
          </Card>

          {/* Зміни (слайдери) */}
          <Card padding="p-4">
            <CardTitle className="text-sm mb-3">Зміни умов</CardTitle>
            <div className="space-y-4">
              <ChangeSlider label="Δ Температура"    unit="°C"  value={dTemp}  onChange={setDTemp}  min={-15} max={15}  step={1}   decimals={0} />
              <ChangeSlider label="Δ Хмарність"      unit="%"   value={dCloud} onChange={setDCloud} min={-50} max={50}  step={5}   decimals={0} />
              <ChangeSlider label="Δ Швидкість вітру" unit="м/с" value={dWind}  onChange={setDWind}  min={-10} max={10}  step={0.5} decimals={1} />
            </div>
            <SectionDivider>Тип дня</SectionDivider>
            <div className="flex flex-col gap-2.5">
              <Checkbox checked={isWeekend} onChange={setIsWeekend} label="Вихідний день" />
              <Checkbox checked={isHoliday} onChange={setIsHoliday} label="Державне свято" />
            </div>
          </Card>

          {/* Дії */}
          <Card padding="p-4">
            <div className="space-y-2">
              <Button variant="secondary" className="w-full" leftIcon={<I.Bookmark size={14} />} onClick={() => setSaveOpen(true)}>
                Зберегти як сценарій
              </Button>
              {/* Завантажити — dropdown */}
              <div className="relative">
                <Button variant="secondary" className="w-full" leftIcon={<I.FolderOpen size={14} />} onClick={() => setLoadOpen((v) => !v)}>
                  Завантажити сценарій
                </Button>
                {loadOpen && (
                  <div className="absolute z-20 left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md shadow-lg max-h-[260px] overflow-y-auto animate-scale-in">
                    {scenarios.length === 0 ? (
                      <div className="px-3 py-3 text-xs text-slate-500 dark:text-slate-400">Немає збережених сценаріїв</div>
                    ) : scenarios.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => loadScenario(s)}
                        className="w-full text-left px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700/60 flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-700/50 last:border-b-0"
                      >
                        <span className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{s.name}</span>
                        <Badge tone={s.direction === 'up' ? 'orange' : s.direction === 'down' ? 'blue' : 'slate'} size="xs">
                          {s.deltaPct > 0 ? '+' : ''}{fmtDecimal(s.deltaPct, 1)}{NBSP}%
                        </Badge>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={() => { setLoadOpen(false); navigate('/scenarios'); }}
                className="block w-full text-center text-sm text-blue-600 dark:text-blue-400 hover:underline pt-1"
              >
                Усі мої сценарії →
              </button>
            </div>
          </Card>
        </div>

        {/* ── Права частина (результати) ── */}
        <div className="lg:col-span-2 space-y-4">
          <ResultCard computed={computed} dTemp={dTemp} />
          <ComparisonChart computed={computed} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <RulesCard />
            <SensitivityCard />
          </div>
        </div>
      </div>

      <SaveModal open={saveOpen} onClose={() => setSaveOpen(false)} onSave={handleSave} />
    </div>
  );
}
