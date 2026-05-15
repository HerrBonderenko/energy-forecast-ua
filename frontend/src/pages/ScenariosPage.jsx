import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip as RTooltip, ResponsiveContainer,
} from 'recharts';
import {
  Card, Badge, Button, IconButton, Modal, Input, Select,
  SectionHeader, Checkbox,
} from '../components/ui';
import * as I from '../components/ui/Icons';
import { useToast } from '../contexts/ToastContext';
import { useTheme } from '../contexts/ThemeContext';
import { useScenarios } from '../contexts/ScenariosContext';
import { BASELINE_CURVE } from '../lib/mockData';
import { cx, fmtDecimal, MONTH_SHORT_UK } from '../lib/utils';

// ── Helpers ──────────────────────────────────────────────────────────────────
function fmtPct(v) {
  if (v === 0) return '0,0 %';
  const sign = v > 0 ? '+' : '-';
  return `${sign}${fmtDecimal(Math.abs(v), 1)} %`;
}

function fmtDateShort(iso) {
  const d = new Date(iso);
  return `${d.getDate()} ${MONTH_SHORT_UK[d.getMonth()]} ${d.getFullYear()}`;
}

function fmtGW(v) { return `${fmtDecimal(v, 2)} ГВт`; }

function deltaTone(dir) {
  if (dir === 'up')   return 'orange';
  if (dir === 'down') return 'blue';
  return 'slate';
}

function sparkColor(dir, dark) {
  if (dir === 'up')   return dark ? '#FB923C' : '#EA580C';
  if (dir === 'down') return dark ? '#4ADE80' : '#16A34A';
  return dark ? '#94A3B8' : '#64748B';
}

const SORT_OPTIONS = [
  { value: 'date-desc',   label: 'За датою (нові спочатку)' },
  { value: 'name-asc',    label: 'За назвою (А→Я)' },
  { value: 'impact-desc', label: 'За впливом (більший Δ)' },
];

// ── Scenario Card ─────────────────────────────────────────────────────────────
function ScenarioCard({ scenario: s, checked, onToggle, onOpen, onDuplicate, onDelete }) {
  const { theme } = useTheme();
  const dark = theme === 'dark';
  const sparkData = s.curve.map((y, x) => ({ x, y }));
  const stroke = sparkColor(s.direction, dark);

  return (
    <div className={cx(
      'group relative rounded-lg border bg-white dark:bg-slate-800 transition-shadow',
      checked
        ? 'border-blue-500 dark:border-blue-400 shadow-sm ring-1 ring-blue-500 dark:ring-blue-400'
        : 'border-slate-200 dark:border-slate-700 hover:shadow-md',
    )}>
      {/* Checkbox (видно при hover або checked) */}
      <div className={cx(
        'absolute top-3 left-3 z-10 transition-opacity',
        checked ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 focus-within:opacity-100',
      )}>
        <Checkbox checked={checked} onChange={onToggle} />
      </div>

      {/* Delta badge */}
      <div className="absolute top-3 right-3 z-10">
        <Badge tone={deltaTone(s.direction)} size="sm">{fmtPct(s.deltaPct)}</Badge>
      </div>

      {/* Body */}
      <div className="px-4 pt-10 pb-2">
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 line-clamp-1 pr-16">{s.name}</h3>
        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
          створено {fmtDateShort(s.createdAt)}
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 my-2.5 min-h-[40px]">
          {s.description || '—'}
        </p>

        {/* Sparkline */}
        <div className="h-14 -mx-1">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sparkData} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
              <Line type="monotone" dataKey="y" stroke={stroke} strokeWidth={1.75} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Actions */}
      <div className="px-3 pb-3 pt-1 flex items-center justify-end gap-1 border-t border-slate-100 dark:border-slate-700/50">
        <IconButton icon={<I.Eye size={14} />}   label="Відкрити"   onClick={onOpen} />
        <IconButton icon={<I.Copy size={14} />}   label="Дублювати"  onClick={onDuplicate} />
        <IconButton icon={<I.Trash2 size={14} />} label="Видалити"   onClick={onDelete} variant="danger" />
      </div>
    </div>
  );
}

// ── Empty State ───────────────────────────────────────────────────────────────
function EmptyState({ onNew }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16">
      <I.Bookmark size={48} className="text-slate-300 dark:text-slate-600" strokeWidth={1.5} />
      <h3 className="text-base font-semibold text-slate-700 dark:text-slate-200 mt-5">
        Немає збережених сценаріїв
      </h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 max-w-sm">
        Створіть сценарій на сторінці «Сценарний аналіз» і збережіть для повторного використання
      </p>
      <Button className="mt-5" onClick={onNew} leftIcon={<I.Plus size={14} />}>
        Новий сценарій
      </Button>
    </div>
  );
}

// ── Compare Modal ─────────────────────────────────────────────────────────────
const COMPARE_COLORS = ['#2563EB', '#EA580C', '#16A34A'];

function CompareModal({ open, onClose, scenarios }) {
  const { theme } = useTheme();
  const dark = theme === 'dark';
  const gridColor = dark ? '#1e293b' : '#e2e8f0';
  const tickStyle = { fontSize: 11, fill: dark ? '#94a3b8' : '#64748b' };

  const data = Array.from({ length: 24 }, (_, h) => {
    const row = { h: String(h).padStart(2, '0') };
    scenarios.forEach((s, i) => { row[`s${i}`] = s.curve[h]; });
    return row;
  });

  const avgBase = BASELINE_CURVE.reduce((a, b) => a + b, 0) / 24;
  const peakBase = Math.max(...BASELINE_CURVE);
  const minBase  = Math.min(...BASELINE_CURVE);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Порівняння сценаріїв"
      size="lg"
      footer={<Button onClick={onClose}>Закрити</Button>}
    >
      {/* Chart */}
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
          <CartesianGrid stroke={gridColor} strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="h"
            tick={tickStyle}
            tickLine={false}
            axisLine={{ stroke: gridColor }}
            interval={2}
            tickFormatter={(v) => `${v}:00`}
          />
          <YAxis
            tick={tickStyle}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => fmtDecimal(v, 0)}
          />
          <RTooltip
            contentStyle={{ background: dark ? '#1e293b' : '#fff', border: 'none', borderRadius: 6, fontSize: 12 }}
            formatter={(v, name) => [fmtGW(v), scenarios[parseInt(name.replace('s', ''), 10)]?.name || name]}
            labelFormatter={(l) => `${l}:00`}
          />
          {scenarios.map((s, i) => (
            <Line key={s.id} type="monotone" dataKey={`s${i}`} stroke={COMPARE_COLORS[i]} strokeWidth={2} dot={false} isAnimationActive={false} name={`s${i}`} />
          ))}
        </LineChart>
      </ResponsiveContainer>

      {/* Легенда */}
      <div className="flex flex-wrap gap-3 mt-2 text-xs">
        {scenarios.map((s, i) => (
          <span key={s.id} className="inline-flex items-center gap-1.5 text-slate-700 dark:text-slate-200">
            <span className="inline-block w-3 h-2.5 rounded-sm" style={{ background: COMPARE_COLORS[i] }} />
            {s.name}
          </span>
        ))}
      </div>

      {/* Порівняльна таблиця */}
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-[420px] w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
              <th className="py-2 pr-3 font-medium">Сценарій</th>
              <th className="py-2 px-3 font-medium text-right">Δ середнє</th>
              <th className="py-2 px-3 font-medium text-right">Δ пік</th>
              <th className="py-2 px-3 font-medium text-right">Δ мінімум</th>
            </tr>
          </thead>
          <tbody>
            {scenarios.map((s, i) => {
              const avgMod  = s.curve.reduce((a, b) => a + b, 0) / 24;
              const peakMod = Math.max(...s.curve);
              const minMod  = Math.min(...s.curve);
              const avgPct  = ((avgMod  - avgBase)  / avgBase)  * 100;
              const peakPct = ((peakMod - peakBase) / peakBase) * 100;
              const minPct  = ((minMod  - minBase)  / minBase)  * 100;
              const col = (v) => v > 0 ? 'text-orange-600 dark:text-orange-400' : v < 0 ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500';
              return (
                <tr key={s.id} className="border-b border-slate-100 dark:border-slate-700/50 last:border-b-0">
                  <td className="py-2.5 pr-3">
                    <span className="inline-flex items-center gap-2">
                      <span className="inline-block w-2.5 h-2.5 rounded-full shrink-0" style={{ background: COMPARE_COLORS[i] }} />
                      <span className="font-medium text-slate-900 dark:text-slate-100 line-clamp-1">{s.name}</span>
                    </span>
                  </td>
                  <td className={cx('py-2.5 px-3 text-right tabular-nums font-medium', col(avgPct))}>{fmtPct(avgPct)}</td>
                  <td className={cx('py-2.5 px-3 text-right tabular-nums font-medium', col(peakPct))}>{fmtPct(peakPct)}</td>
                  <td className={cx('py-2.5 px-3 text-right tabular-nums font-medium', col(minPct))}>{fmtPct(minPct)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Modal>
  );
}

// ── Root ─────────────────────────────────────────────────────────────────────
export default function ScenariosPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { scenarios, deleteScenario, duplicateScenario } = useScenarios();

  const [search, setSearch]   = useState('');
  const [sort, setSort]       = useState('date-desc');
  const [selected, setSelected] = useState(new Set());
  const [compareOpen, setCompareOpen] = useState(false);

  const filtered = useMemo(() => {
    let list = scenarios.filter((s) =>
      !search.trim() || s.name.toLowerCase().includes(search.trim().toLowerCase()),
    );
    if (sort === 'date-desc')   list = [...list].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    if (sort === 'name-asc')    list = [...list].sort((a, b) => a.name.localeCompare(b.name, 'uk'));
    if (sort === 'impact-desc') list = [...list].sort((a, b) => Math.abs(b.deltaPct) - Math.abs(a.deltaPct));
    return list;
  }, [scenarios, search, sort]);

  function toggleSelected(id) {
    const next = new Set(selected);
    if (next.has(id)) {
      next.delete(id);
    } else {
      if (next.size >= 3) {
        showToast({ type: 'warning', title: 'Максимум 3 сценарії для порівняння' });
        return;
      }
      next.add(id);
    }
    setSelected(next);
  }

  function handleDelete(id) {
    deleteScenario(id);
    const next = new Set(selected);
    next.delete(id);
    setSelected(next);
    showToast({ type: 'success', title: 'Сценарій видалено' });
  }

  function handleDuplicate(s) {
    const dup = duplicateScenario(s.id);
    showToast({ type: 'success', title: `Дубльовано: ${dup?.name || s.name}` });
  }

  return (
    <div className="space-y-5 pb-24">
      <SectionHeader
        title="Мої сценарії"
        subtitle="Збережені сценарії для повторного аналізу та порівняння"
        right={
          <Button leftIcon={<I.Plus size={14} />} onClick={() => navigate('/scenario-analysis')}>
            Новий сценарій
          </Button>
        }
      />

      {/* Пошук + сортування */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px] max-w-sm">
          <Input
            leftIcon={<I.Search size={14} />}
            placeholder="Пошук за назвою…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select
          value={sort}
          onChange={(v) => setSort(v)}
          options={SORT_OPTIONS}
          className="w-56"
        />
        <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums ml-auto">
          {scenarios.length} сценаріїв
        </span>
      </div>

      {/* Grid або порожній стан */}
      {scenarios.length === 0 ? (
        <EmptyState onNew={() => navigate('/scenario-analysis')} />
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-sm text-slate-500 dark:text-slate-400">
          За запитом «{search}» нічого не знайдено
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((s) => (
            <ScenarioCard
              key={s.id}
              scenario={s}
              checked={selected.has(s.id)}
              onToggle={() => toggleSelected(s.id)}
              onOpen={() => {
                showToast({ type: 'info', title: `Відкрито: ${s.name}`, description: 'Перехід до Сценарного аналізу — Етап 5' });
                navigate('/scenario-analysis');
              }}
              onDuplicate={() => handleDuplicate(s)}
              onDelete={() => handleDelete(s.id)}
            />
          ))}
        </div>
      )}

      {/* Sticky compare panel — з'являється при ≥2 обраних */}
      {selected.size >= 2 && (
        <div className="fixed bottom-0 left-0 right-0 lg:left-60 z-30 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shadow-lg animate-fade-in">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3 flex-wrap">
            <div className="text-sm text-slate-700 dark:text-slate-200">
              Обрано <span className="font-semibold tabular-nums">{selected.size}</span>{' '}
              {selected.size === 2 ? 'сценарії' : 'сценарії'}
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setSelected(new Set())}>
                Скасувати
              </Button>
              <Button
                leftIcon={<I.GitBranch size={14} />}
                onClick={() => setCompareOpen(true)}
              >
                Порівняти ({selected.size})
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Compare Modal */}
      <CompareModal
        open={compareOpen}
        onClose={() => setCompareOpen(false)}
        scenarios={scenarios.filter((s) => selected.has(s.id))}
      />
    </div>
  );
}
