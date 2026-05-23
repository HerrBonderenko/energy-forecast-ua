import { useState, useRef, useEffect } from 'react';
import {
  Card, CardHeader, CardBody, CardTitle, Badge, Button, IconButton,
  Tabs, Modal, InfoBanner, SectionHeader, Label, Input, Select,
  Slider, Switch, ProgressBar, Spinner, StatusDot, SectionDivider,
} from '../components/ui';
import * as I from '../components/ui/Icons';
import { useToast } from '../contexts/ToastContext';
import {
  USERS, TECH_STACK, SOURCES_LINKS, SYSTEM_INFO,
} from '../lib/mockData';
import { cx } from '../lib/utils';
import { getModelInfo } from '../lib/api';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// ── Helpers ─────────────────────────────────────────────────────────────────
function sourceTone(status) {
  if (status === 'connected') return 'green';
  if (status === 'error')     return 'red';
  return 'yellow';
}
function sourceLabel(status) {
  if (status === 'connected') return 'Підключено';
  if (status === 'pending')   return 'Очікує';
  if (status === 'error')     return 'Помилка';
  return 'Не підключено';
}

// ── TABLE HEADER helper ──────────────────────────────────────────────────────
function Th({ children, right = false }) {
  return (
    <th className={cx(
      'px-4 py-2.5 text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap',
      right ? 'text-right' : 'text-left',
    )}>
      {children}
    </th>
  );
}

// ── TAB 1: ДАНІ ──────────────────────────────────────────────────────────────
function DataTab() {
  const { showToast } = useToast();
  const [cacheData, setCacheData] = useState(null);
  const [cacheLoading, setCacheLoading] = useState(true);
  const [dataSources, setDataSources] = useState([]);

  useEffect(() => {
    // Завантажуємо реальну статистику з API
    Promise.all([
      fetch(`${API_BASE}/api/history/stats`).then((r) => r.json()).catch(() => null),
      fetch(`${API_BASE}/api/scenarios/`).then((r) => r.json()).catch(() => null),
      fetch(`${API_BASE}/api/model/info`).then((r) => r.json()).catch(() => null),
    ]).then(([histStats, scenariosData, modelInfo]) => {
      const now = new Date().toLocaleDateString('uk-UA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
      // Статус джерел даних з реального API
      setDataSources([
        {
          id: 'entsoe', name: 'ENTSO-E Transparency Platform',
          description: 'Дані споживання та генерації',
          status: modelInfo?.data_sources?.consumption?.status === 'connected' ? 'connected' : 'pending',
          lastUpdate: modelInfo?.training_date ? modelInfo.training_date + 'T00:00:00Z' : null,
        },
        {
          id: 'openmeteo', name: 'Open-Meteo API',
          description: 'Історична та поточна погода',
          status: 'connected',
          lastUpdate: new Date().toISOString(),
        },

      ]);

      setCacheData([
        {
          sourceName: 'Прогнози (SQLite)',
          coverage:   'Поточна сесія',
          records:    histStats?.total ?? '—',
          lastUpdated: now,
        },
        {
          sourceName: 'Сценарії (SQLite)',
          coverage:   'Всі сесії',
          records:    scenariosData?.items?.length ?? '—',
          lastUpdated: now,
        },
        {
          sourceName: 'Модель ANFIS',
          coverage:   `2017–2021 (${43794} год.)`,
          records:    modelInfo?.rules_count ?? '—',
          lastUpdated: modelInfo?.training_date ?? '—',
        },
        {
          sourceName: 'Open-Meteo API',
          coverage:   'Поточна погода Київ',
          records:    '24',
          lastUpdated: now,
        },
      ]);
      setCacheLoading(false);
    });
  }, []);

  return (
    <div className="space-y-4">

      {/* Джерела даних */}
      <Card>
        <div className="px-5 pt-5 pb-3">
          <CardTitle>Підключення джерел даних</CardTitle>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">API для отримання історичних та поточних даних</p>
        </div>
        <CardBody>
          <ul className="divide-y divide-slate-200 dark:divide-slate-700/60 -mx-1">
            {(dataSources.length ? dataSources : []).map((s) => (
              <li key={s.id} className="flex flex-wrap items-start sm:items-center gap-3 py-3 px-1">
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <StatusDot tone={s.status === 'connected' ? 'green' : s.status === 'error' ? 'red' : 'amber'} />
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-slate-800 dark:text-slate-100 leading-tight">{s.name}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{s.description}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
                    {s.lastUpdate ? new Date(s.lastUpdate).toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' }) : 'не використовується'}
                  </span>
                  <Badge tone={sourceTone(s.status)}>{sourceLabel(s.status)}</Badge>
                  <Button
                    variant="secondary" size="sm"
                    onClick={() => showToast({ type: 'info', title: `Налаштування: ${s.name}`, description: 'Доступно адміністратору' })}
                  >
                    Налаштувати
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>

      {/* Кеш — таблиця з горизонтальним скролом */}
      <Card>
        <div className="px-5 pt-5 pb-3">
          <CardTitle>Кеш даних</CardTitle>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Стан локально збережених даних</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[600px] w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-y border-slate-200 dark:border-slate-700">
              <tr>
                <Th>Тип даних</Th>
                <Th>Покриття</Th>
                <Th>Записів</Th>
                <Th>Оновлено</Th>
                
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700/60">
              {cacheLoading ? (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-sm text-slate-400">Завантаження…</td></tr>
              ) : (cacheData || []).map((r, i) => (
                <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-100 whitespace-nowrap">{r.sourceName}</td>
                  <td className="px-4 py-3 text-xs font-mono text-slate-600 dark:text-slate-300 whitespace-nowrap">{r.coverage}</td>
                  <td className="px-4 py-3 tabular-nums text-slate-600 dark:text-slate-300 whitespace-nowrap">{r.records}</td>
                  <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">{r.lastUpdated}</td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

    </div>
  );
}

// ── HISTORY TABLE ────────────────────────────────────────────────────────────
function HistoryTable() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/api/model/training-history`)
      .then(r => r.json())
      .then(d => { setHistory(d.history || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <Card>
      <div className="px-5 pt-5 pb-3">
        <CardTitle>Історія навчань</CardTitle>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-[560px] w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800/60 border-y border-slate-200 dark:border-slate-700">
            <tr>
              <Th>Дата</Th>
              <Th>Версія</Th>
              <Th>MAPE до → після</Th>
              <Th>Час</Th>
              <Th>Статус</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700/60">
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-sm text-slate-400">Завантаження…</td></tr>
            ) : history.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-sm text-slate-400">Навчань ще не проводилось</td></tr>
            ) : history.map((t, i) => (
              <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                <td className="px-4 py-3 tabular-nums text-slate-700 dark:text-slate-200 whitespace-nowrap">{t.date}</td>
                <td className="px-4 py-3 font-mono text-xs text-slate-600 dark:text-slate-300">{t.version}</td>
                <td className="px-4 py-3 tabular-nums whitespace-nowrap">
                  {t.mape_before != null ? (
                    <span className="text-slate-700 dark:text-slate-200">
                      {Number(t.mape_before).toFixed(2).replace('.', ',')} %{' '}
                      <span className="text-slate-400">→</span>{' '}
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                        {Number(t.mape_after).toFixed(2).replace('.', ',')} %
                      </span>
                    </span>
                  ) : t.mape_after != null ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                      {Number(t.mape_after).toFixed(2).replace('.', ',')} %
                    </span>
                  ) : <span className="text-slate-400">—</span>}
                </td>
                <td className="px-4 py-3 tabular-nums text-slate-600 dark:text-slate-300">{t.duration_s} с</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {t.status === 'success' ? (
                    <Badge tone="green"><I.Check size={11} className="mr-1" />Успішно</Badge>
                  ) : (
                    <Badge tone="red"><I.X size={11} className="mr-1" />Помилка</Badge>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

// ── TAB 2: МОДЕЛЬ ────────────────────────────────────────────────────────────
function ModelTab() {
  const { showToast } = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [retraining, setRetraining] = useState({ inProgress: false, progress: 0 });
  const [params, setParams] = useState({
    epochs: 100, learningRate: 0.01, batchSize: 64, validationSplit: 20,
    membershipType: 'gaussian',
  });

  const [modelInfo, setModelInfo] = useState(null);
  useEffect(() => {
    getModelInfo()
      .then(setModelInfo)
      .catch((err) => console.warn('Не вдалось завантажити model info:', err));
  }, []);

  const formatDate = (iso) => {
    if (!iso) return '—';
    const parts = iso.split('-');
    return parts.length === 3 ? `${parts[2]}.${parts[1]}.${parts[0]}` : iso;
  };
  const fmt = (n) => (n != null ? String(n).replace('.', ',') : '—');

  const [retrainMsg, setRetrainMsg] = useState('');

  async function startRetrain() {
    setConfirmOpen(false);
    setRetraining({ inProgress: true, progress: 0 });
    setRetrainMsg('Запит до сервера...');

    try {
      const resp = await fetch(`${API_BASE}/api/model/retrain`, { method: 'POST' });
      const data = await resp.json();
      if (!data.started && !data.state?.in_progress) {
        showToast({ type: 'error', title: 'Не вдалося запустити навчання', description: data.message });
        setRetraining({ inProgress: false, progress: 0 });
        return;
      }

      // Polling статусу кожні 2 секунди
      const pollInterval = setInterval(async () => {
        try {
          const sresp = await fetch(`${API_BASE}/api/model/retrain/status`);
          const state = await sresp.json();
          setRetraining({ inProgress: state.in_progress, progress: state.progress || 0 });
          setRetrainMsg(state.message || '');

          if (!state.in_progress) {
            clearInterval(pollInterval);
            if (state.error) {
              showToast({ type: 'error', title: 'Помилка навчання', description: state.error });
            } else if (state.result) {
              showToast({
                type: 'success',
                title: 'Перетренування завершено',
                description: `${state.result.version} — MAPE ${state.result.metrics.mape}%`,
              });
              // Оновлюємо інформацію про модель
              getModelInfo().then(setModelInfo).catch(() => {});
            }
            setRetraining({ inProgress: false, progress: 100 });
          }
        } catch (err) {
          clearInterval(pollInterval);
          showToast({ type: 'error', title: 'Помилка опитування статусу' });
          setRetraining({ inProgress: false, progress: 0 });
        }
      }, 2000);
    } catch (err) {
      showToast({ type: 'error', title: 'Помилка запиту', description: err.message });
      setRetraining({ inProgress: false, progress: 0 });
    }
  }

  return (
    <div className="space-y-4">
      {/* Активна модель */}
      <Card>
        <div className="px-5 pt-5 pb-3"><CardTitle>Активна модель</CardTitle></div>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Метаданні */}
            <dl className="space-y-2 text-sm">
              {[
                ['Версія', modelInfo?.version ?? 'v3.0.0', 'font-mono'],
                ['Тип', modelInfo?.type ?? 'ANFIS (Sugeno)', ''],
                ['Кількість правил', String(modelInfo?.rules_count ?? 50), 'tabular-nums'],
                ['Функцій належності', `${modelInfo?.membership_functions_count ?? 26} (${modelInfo?.input_variables ?? 7} змінних)`, 'tabular-nums'],
                ['Дата навчання', formatDate(modelInfo?.training_date), 'tabular-nums'],
                ['Тривалість', `${modelInfo?.training_duration_seconds ?? '—'} секунд`, 'tabular-nums'],
              ].map(([k, v, cls]) => (
                <div key={k} className="flex justify-between gap-4">
                  <dt className="text-slate-500 dark:text-slate-400">{k}</dt>
                  <dd className={cx('text-slate-800 dark:text-slate-100 text-right', cls)}>{v}</dd>
                </div>
              ))}
            </dl>
            {/* KPI */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'MAPE', value: fmt(modelInfo?.metrics?.mape), unit: '%' },
                { label: 'RMSE', value: fmt(modelInfo?.metrics?.rmse), unit: 'МВт' },
                { label: 'MAE',  value: fmt(modelInfo?.metrics?.mae),  unit: 'МВт' },
              ].map((m) => (
                <div key={m.label} className="rounded-lg bg-slate-50 dark:bg-slate-900/40 p-3 border border-slate-200 dark:border-slate-700 text-center">
                  <div className="text-xs text-slate-500 dark:text-slate-400">{m.label}</div>
                  <div className="text-lg font-semibold text-slate-900 dark:text-slate-100 tabular-nums mt-0.5">
                    {m.value}<span className="text-xs font-normal text-slate-500 ml-0.5">{m.unit}</span>
                  </div>
                </div>
              ))}
              <div className="col-span-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200/60 dark:border-emerald-800/60">
                <StatusDot tone="green" pulse />
                <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Модель активна</span>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Перетренування */}
      <Card>
        <div className="px-5 pt-5 pb-3">
          <CardTitle>Перетренувати модель</CardTitle>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Запустити навчання на актуальних даних</p>
        </div>
        <CardBody>
          <InfoBanner tone="amber" icon="AlertTriangle">
            Перетренування займає 30–60 секунд. Модель залишається доступною — нова версія активується після завершення.
          </InfoBanner>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button
              variant="primary"
              leftIcon={retraining.inProgress ? <Spinner size={14} /> : <I.PlayCircle size={15} />}
              disabled={retraining.inProgress}
              onClick={() => setConfirmOpen(true)}
            >
              {retraining.inProgress ? 'Триває навчання…' : 'Запустити перетренування'}
            </Button>
            {retraining.inProgress && (
              <div className="flex-1 min-w-[200px] space-y-1">
                <div className="flex items-center gap-2">
                  <ProgressBar value={retraining.progress} max={100} tone="blue" className="flex-1" />
                  <span className="text-xs tabular-nums text-slate-500 min-w-[3rem] text-right">
                    {Math.round(retraining.progress)} %
                  </span>
                </div>
                {retrainMsg && <div className="text-xs text-slate-500 dark:text-slate-400">{retrainMsg}</div>}
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Підтвердити перетренування?"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmOpen(false)}>Скасувати</Button>
            <Button variant="primary" onClick={startRetrain}>Так, перетренувати</Button>
          </>
        }
      >
        Поточну модель буде замінено після завершення навчання. Бажаєте продовжити?
      </Modal>

      {/* Історія навчань — реальні дані з БД */}
      <HistoryTable />
    </div>
  );
}

// ── TAB 3: КОРИСТУВАЧІ ───────────────────────────────────────────────────────
function UsersTab() {
  const { showToast } = useToast();
  const [users, setUsers] = useState(USERS);
  const [confirmDelete, setConfirmDelete] = useState(null);

  return (
    <div className="space-y-4">
      {/* Банер демо-режиму */}
      <div className="rounded-lg border border-amber-200 dark:border-amber-700/40 bg-amber-50 dark:bg-amber-900/20 p-3">
        <div className="flex items-start gap-2.5">
          <I.AlertTriangle size={16} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1 text-sm">
            <div className="font-medium text-amber-900 dark:text-amber-200">Демо-режим управління користувачами</div>
            <p className="text-xs text-amber-800/80 dark:text-amber-300/80 mt-0.5">
              Список користувачів є демонстраційним. Реальна авторизація з JWT-токенами та паролями
              винесена за межі дипломного проекту і впроваджуватиметься на етапі промислового впровадження.
            </p>
          </div>
        </div>
      </div>

      <Card>
        {/* Заголовок + кнопка */}
        <div className="px-5 pt-5 pb-3 flex items-center justify-between gap-3 flex-wrap">
          <div>
            <CardTitle>Користувачі</CardTitle>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Активних: <span className="font-medium text-slate-700 dark:text-slate-200">{users.length}</span> з 10
            </p>
          </div>
          <Button
            size="sm"
            leftIcon={<I.Plus size={14} />}
            onClick={() => showToast({ type: 'info', title: 'Додавання користувача', description: 'Недоступно в демо-режимі' })}
          >
            Додати
          </Button>
        </div>

        {/* Таблиця на md+ / картки на sm- */}

        {/* Десктоп таблиця */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-[560px] w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-y border-slate-200 dark:border-slate-700">
              <tr>
                <Th>Користувач</Th>
                <Th>Email</Th>
                <Th>Роль</Th>
                <Th>Останній вхід</Th>
                
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700/60">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className={cx('w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0', u.color)}>
                        {u.initials}
                      </div>
                      <span className="font-medium text-slate-800 dark:text-slate-100">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs font-mono text-slate-600 dark:text-slate-300">{u.email}</td>
                  <td className="px-4 py-3"><Badge tone={u.roleTone}>{u.roleLabel}</Badge></td>
                  <td className="px-4 py-3 text-xs tabular-nums text-slate-500 dark:text-slate-400">{u.lastLogin}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <IconButton
                        icon={<I.Edit size={14} />}
                        label="Редагувати"
                        variant="ghost"
                        onClick={() => showToast({ type: 'info', title: `Редагування: ${u.name}`, description: 'Недоступно в демо' })}
                      />
                      <IconButton
                        icon={<I.Trash2 size={14} />}
                        label="Видалити"
                        variant="danger"
                        onClick={() => setConfirmDelete(u)}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Мобільні картки */}
        <div className="md:hidden divide-y divide-slate-200 dark:divide-slate-700/60">
          {users.map((u) => (
            <div key={u.id} className="px-5 py-4 flex items-start gap-3">
              <div className={cx('w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold shrink-0', u.color)}>
                {u.initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="font-medium text-slate-800 dark:text-slate-100">{u.name}</span>
                  <Badge tone={u.roleTone}>{u.roleLabel}</Badge>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">{u.email}</div>
                <div className="text-xs text-slate-400 mt-0.5">{u.lastLogin}</div>
              </div>
              <IconButton
                icon={<I.Trash2 size={14} />}
                label="Видалити"
                variant="danger"
                onClick={() => setConfirmDelete(u)}
              />
            </div>
          ))}
        </div>
      </Card>

      <Modal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Видалити користувача?"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmDelete(null)}>Скасувати</Button>
            <Button
              variant="dangerSolid"
              leftIcon={<I.Trash2 size={14} />}
              onClick={() => {
                setUsers((us) => us.filter((x) => x.id !== confirmDelete.id));
                showToast({ type: 'success', title: `${confirmDelete.name} видалено` });
                setConfirmDelete(null);
              }}
            >
              Видалити
            </Button>
          </>
        }
      >
        Цю дію не можна скасувати. Користувач{' '}
        <span className="font-semibold text-slate-900 dark:text-slate-100">{confirmDelete?.name}</span>{' '}
        втратить доступ до системи.
      </Modal>
    </div>
  );
}

// ── TAB 4: ПРО СИСТЕМУ ───────────────────────────────────────────────────────
function AboutTab() {
  return (
    <div className="space-y-4">
      {/* Загальна інформація */}
      <Card>
        <CardBody className="pt-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Логотип + опис */}
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-md bg-blue-600 flex items-center justify-center text-white shrink-0">
                  <I.Zap size={20} stroke={2.5} />
                </div>
                <div>
                  <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">Energy Forecast UA</div>
                  <div className="text-xs font-mono text-slate-500">{SYSTEM_INFO.version}</div>
                </div>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {SYSTEM_INFO.description}
              </p>
            </div>
            {/* Дані дипломної */}
            <dl className="space-y-2.5 text-sm">
              {[
                { k: 'Тема', v: 'Прогнозування погодинного споживання електроенергії в ОЕС України на основі ANFIS' },
                { k: 'Автор', v: 'Бондаренко Олег Васильович', italic: true },
                { k: 'Керівник', v: 'Бібічков Ігор Євгенович', italic: true },
                { k: 'Кафедра', v: 'Кафедра штучного інтелекту', italic: true },
                { k: 'Університет', v: 'Харківський національний університет радіоелектроніки', italic: true },
                { k: 'Захист', v: 'червень 2026' },
              ].map(({ k, v, italic }) => (
                <div key={k}>
                  <dt className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400">{k}</dt>
                  <dd className={cx('text-slate-800 dark:text-slate-100 mt-0.5', italic && 'italic')}>{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </CardBody>
      </Card>

      {/* Технологічний стек */}
      <Card>
        <div className="px-5 pt-5 pb-3"><CardTitle>Технологічний стек</CardTitle></div>
        <CardBody>
          <div className="flex flex-wrap gap-1.5">
            {TECH_STACK.map((t) => (
              <span key={t} className="inline-flex items-center px-2.5 py-1 text-xs rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                {t}
              </span>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Джерела даних */}
      <Card>
        <div className="px-5 pt-5 pb-3"><CardTitle>Джерела даних та посилання</CardTitle></div>
        <CardBody>
          <ul className="space-y-2">
            {SOURCES_LINKS.map((s) => (
              <li key={s.label}>
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-start gap-2 text-sm text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 group"
                >
                  <I.ExternalLink size={14} className="mt-0.5 shrink-0 group-hover:text-blue-500" />
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>

      {/* Контакти */}
      <Card>
        <div className="px-5 pt-5 pb-3"><CardTitle>Контакти</CardTitle></div>
        <CardBody>
          <div className="flex flex-col gap-3">
            <a href="mailto:thesis@example.com" className="inline-flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400">
              <I.Mail size={15} />
              thesis@example.com
            </a>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400">
              <I.Github size={15} />
              github.com/example/energy-forecast-ua
            </a>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

// ── ROOT ─────────────────────────────────────────────────────────────────────
const TABS = [
  { value: 'data',   label: 'Дані' },
  { value: 'model',  label: 'Модель' },
  { value: 'users',  label: 'Користувачі' },
  { value: 'about',  label: 'Про систему' },
];

export default function SettingsPage() {
  const [tab, setTab] = useState('data');

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Налаштування"
        subtitle="Управління даними, моделлю та системою"
      />

      {/* Tabs — overflow-x-auto для мобільного */}
      <div className="overflow-x-auto scrollbar-none">
        <Tabs items={TABS} value={tab} onChange={setTab} />
      </div>

      <div className="pt-1">
        {tab === 'data'  && <DataTab />}
        {tab === 'model' && <ModelTab />}
        {tab === 'users' && <UsersTab />}
        {tab === 'about' && <AboutTab />}
      </div>
    </div>
  );
}
