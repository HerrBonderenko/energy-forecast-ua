import { useState, useRef } from 'react';
import {
  Card, CardHeader, CardBody, CardTitle, Badge, Button, IconButton,
  Tabs, Modal, InfoBanner, SectionHeader, Label, Input, Select,
  Slider, Switch, ProgressBar, Spinner, StatusDot, SectionDivider,
} from '../components/ui';
import * as I from '../components/ui/Icons';
import { useToast } from '../contexts/ToastContext';
import {
  DATA_SOURCES, DATA_CACHE, AUTO_UPDATE_RULES,
  TRAINING_HISTORY, USERS, TECH_STACK, SOURCES_LINKS, SYSTEM_INFO,
} from '../lib/mockData';
import { cx } from '../lib/utils';

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
  const [rules, setRules] = useState(
    () => Object.fromEntries(AUTO_UPDATE_RULES.map((r) => [r.id, r.default])),
  );
  const [uploadedFile, setUploadedFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  function handleFile(file) {
    if (file) setUploadedFile({ name: file.name, size: file.size });
  }

  function startImport() {
    showToast({ type: 'success', title: 'Імпорт розпочато', description: uploadedFile.name });
    setTimeout(() => setUploadedFile(null), 500);
  }

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
            {DATA_SOURCES.map((s) => (
              <li key={s.id} className="flex flex-wrap items-start sm:items-center gap-3 py-3 px-1">
                {/* Назва + статус-крапка */}
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <StatusDot tone={s.status === 'connected' ? 'green' : s.status === 'error' ? 'red' : 'amber'} />
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-slate-800 dark:text-slate-100 leading-tight">{s.name}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{s.description}</div>
                  </div>
                </div>
                {/* Дата + бейдж + кнопка — переносяться на новий рядок на sm */}
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

      {/* Імпорт */}
      <Card>
        <div className="px-5 pt-5 pb-3">
          <CardTitle>Імпорт даних</CardTitle>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Завантажте файл CSV або Excel</p>
        </div>
        <CardBody>
          {!uploadedFile ? (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files?.[0]); }}
              className={cx(
                'border-2 border-dashed rounded-lg py-10 px-4 text-center transition-colors cursor-pointer',
                dragOver
                  ? 'border-blue-500 bg-blue-50/40 dark:bg-blue-900/10'
                  : 'border-slate-300 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500',
              )}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                  <I.Upload size={18} className="text-slate-400" />
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Перетягніть або{' '}
                  <span className="text-blue-600 dark:text-blue-400 font-medium">оберіть файл</span>
                </p>
                <p className="text-xs text-slate-400">.csv, .xlsx, .xls</p>
              </div>
              <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
            </div>
          ) : (
            <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 flex flex-wrap items-center gap-3">
              <div className="w-10 h-10 rounded bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                <I.FileText size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">{uploadedFile.name}</div>
                <div className="text-xs text-slate-500">{(uploadedFile.size / 1024).toFixed(1)} КБ</div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setUploadedFile(null)}>Видалити</Button>
              <Button variant="primary" size="sm" leftIcon={<I.Upload size={14} />} onClick={startImport}>Імпортувати</Button>
            </div>
          )}
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
                <Th right> </Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700/60">
              {DATA_CACHE.map((r, i) => (
                <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-100 whitespace-nowrap">{r.sourceName}</td>
                  <td className="px-4 py-3 text-xs font-mono text-slate-600 dark:text-slate-300 whitespace-nowrap">{r.coverage}</td>
                  <td className="px-4 py-3 tabular-nums text-slate-600 dark:text-slate-300 whitespace-nowrap">{r.records}</td>
                  <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">{r.lastUpdated}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <Button
                      variant="secondary" size="sm"
                      leftIcon={r.action.startsWith('Оновити') ? <I.RefreshCw size={13} /> : <I.Trash2 size={13} />}
                      onClick={() => showToast({ type: 'success', title: r.action, description: r.sourceName })}
                    >
                      {r.action.startsWith('Оновити') ? 'Оновити' : 'Очистити'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Автооновлення */}
      <Card>
        <div className="px-5 pt-5 pb-3">
          <CardTitle>Розклад автооновлення</CardTitle>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Фонове оновлення даних</p>
        </div>
        <CardBody>
          <ul className="divide-y divide-slate-200 dark:divide-slate-700/60">
            {AUTO_UPDATE_RULES.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 py-3">
                <span className="text-sm text-slate-700 dark:text-slate-300">{r.label}</span>
                <Switch
                  checked={rules[r.id]}
                  onChange={(v) => setRules((s) => ({ ...s, [r.id]: v }))}
                />
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">Останнє виконання: 8 трав, 14:00</p>
        </CardBody>
      </Card>
    </div>
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

  function startRetrain() {
    setConfirmOpen(false);
    setRetraining({ inProgress: true, progress: 0 });
    let p = 0;
    const iv = setInterval(() => {
      p += 2 + Math.random() * 3;
      if (p >= 100) {
        clearInterval(iv);
        setRetraining({ inProgress: false, progress: 100 });
        showToast({ type: 'success', title: 'Перетренування завершено', description: 'Нова модель v1.2.4 активована' });
      } else {
        setRetraining({ inProgress: true, progress: p });
      }
    }, 400);
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
                ['Версія', 'v1.2.3', 'font-mono'],
                ['Тип', 'ANFIS (Sugeno)', ''],
                ['Кількість правил', '26', 'tabular-nums'],
                ['Функцій належності', '26 (7 змінних)', 'tabular-nums'],
                ['Дата навчання', '02.05.2026', 'tabular-nums'],
                ['Тривалість', '47 секунд', 'tabular-nums'],
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
                { label: 'MAPE', value: '2,14', unit: '%' },
                { label: 'RMSE', value: '245', unit: 'МВт' },
                { label: 'MAE',  value: '178', unit: 'МВт' },
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
            Перетренування може зайняти до 15 хвилин. У цей час модель буде недоступна.
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
              <div className="flex-1 min-w-[160px] flex items-center gap-2">
                <ProgressBar value={retraining.progress} max={100} tone="blue" className="flex-1" />
                <span className="text-xs tabular-nums text-slate-500 min-w-[3rem] text-right">
                  {Math.round(retraining.progress)} %
                </span>
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

      {/* Параметри навчання */}
      <Card>
        <div className="px-5 pt-5 pb-3">
          <CardTitle>Параметри навчання (ANFIS)</CardTitle>
        </div>
        <CardBody>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="epochs">Кількість епох</Label>
              <Input id="epochs" type="number" value={params.epochs} onChange={(e) => setParams((p) => ({ ...p, epochs: +e.target.value }))} className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="lr">Швидкість навчання (η)</Label>
              <Input id="lr" type="number" step="0.001" value={params.learningRate} onChange={(e) => setParams((p) => ({ ...p, learningRate: +e.target.value }))} className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="batch">Розмір батчу</Label>
              <Input id="batch" type="number" value={params.batchSize} onChange={(e) => setParams((p) => ({ ...p, batchSize: +e.target.value }))} className="mt-1.5" />
            </div>
            <div>
              <Label>Валідаційна вибірка — {params.validationSplit} %</Label>
              <Slider min={10} max={30} step={1} value={params.validationSplit} onChange={(v) => setParams((p) => ({ ...p, validationSplit: v }))} className="mt-2" />
            </div>
            <div className="sm:col-span-2">
              <Label>Тип функцій належності</Label>
              <Select
                value={params.membershipType}
                onChange={(v) => setParams((p) => ({ ...p, membershipType: v }))}
                options={[
                  { value: 'gaussian',    label: 'Гаусівська (Gaussian)' },
                  { value: 'triangular',  label: 'Трикутна (Triangular)' },
                  { value: 'bell',        label: 'Дзвіноподібна (Bell-shaped)' },
                ]}
                className="mt-1.5"
              />
            </div>
          </div>
          <div className="mt-5 flex justify-end">
            <Button
              leftIcon={<I.Save size={14} />}
              onClick={() => showToast({ type: 'success', title: 'Параметри збережено' })}
            >
              Зберегти параметри
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Історія навчань — таблиця з горизонтальним скролом */}
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
              {TRAINING_HISTORY.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3 tabular-nums text-slate-700 dark:text-slate-200 whitespace-nowrap">{t.date}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-600 dark:text-slate-300">{t.version}</td>
                  <td className="px-4 py-3 tabular-nums whitespace-nowrap">
                    {t.mapeBefore != null ? (
                      <span className="text-slate-700 dark:text-slate-200">
                        {t.mapeBefore.toFixed(2).replace('.', ',')} %{' '}
                        <span className="text-slate-400">→</span>{' '}
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                          {t.mapeAfter.toFixed(2).replace('.', ',')} %
                        </span>
                      </span>
                    ) : <span className="text-slate-400">—</span>}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-slate-600 dark:text-slate-300">{t.duration} с</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {t.status === 'success' ? (
                      <Badge tone="green"><I.Check size={11} className="mr-1" />Успішно</Badge>
                    ) : (
                      <Badge tone="red" title={t.error}><I.X size={11} className="mr-1" />Помилка</Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
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
                <Th right> </Th>
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
