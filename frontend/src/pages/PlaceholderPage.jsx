import { useState } from 'react';
import {
  Button, Card, CardHeader, CardBody, CardTitle, Badge, Tabs, Skeleton,
  Modal, InfoBanner, SectionHeader, Label, Input, Select, Textarea,
  Slider, Switch, Checkbox, ProgressBar, DeltaChip, Spinner, StatusDot,
  IconButton, SectionDivider,
} from '../components/ui';
import * as I from '../components/ui/Icons';
import { useToast } from '../contexts/ToastContext';
import { useScenarios } from '../contexts/ScenariosContext';
import {
  CHART_DATA, RECENT_FORECASTS, MODEL_METRICS, MOCK_SCENARIOS, USERS,
} from '../lib/mockData';
import { fmtDecimal, fmtGW, fmtSignedPercent, fmtTemp } from '../lib/utils';

const PAGE_META = {
  dashboard:          { icon: I.LayoutDashboard, accent: 'Зведення моделі' },
  forecast:           { icon: I.TrendingUp,      accent: 'Параметри + результат прогнозу' },
  'scenario-analysis':{ icon: I.Sliders,         accent: 'Інтерактивна зміна вхідних умов' },
  scenarios:          { icon: I.Bookmark,        accent: 'Збережені сценарії, групове порівняння' },
  compare:            { icon: I.BarChart3,       accent: 'ANFIS vs LSTM vs Prophet vs SARIMAX vs Naive' },
  interpretation:     { icon: I.Network,         accent: 'Функції приналежності, активні правила' },
  history:            { icon: I.History,         accent: 'Журнал прогнозів і помилок моделі' },
  settings:           { icon: I.Settings,        accent: 'Джерела даних, навчання, користувачі' },
};

export default function PlaceholderPage({ pageId, title }) {
  const meta = PAGE_META[pageId] || { icon: I.Inbox, accent: '' };
  const IconC = meta.icon;
  const { showToast } = useToast();
  const { scenarios } = useScenarios();
  const [sliderValue, setSliderValue] = useState(8);
  const [switchOn, setSwitchOn] = useState(false);
  const [checked, setChecked] = useState(true);
  const [tab, setTab] = useState('overview');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectVal, setSelectVal] = useState('24h');

  // Quick statistics about mock data — proof everything is wired up
  const dataStats = {
    chart24h: CHART_DATA['24h'].length,
    chart7d: CHART_DATA['7d'].length,
    chart30d: CHART_DATA['30d'].length,
    recentForecasts: RECENT_FORECASTS.length,
    models: MODEL_METRICS.length,
    scenarios: scenarios.length,
    users: USERS.length,
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title={title}
        subtitle={meta.accent}
        right={
          <Badge tone="yellow" size="md">
            Етап 2/3 — заглушка
          </Badge>
        }
      />

      <InfoBanner tone="blue" icon="Info">
        Це проміжний екран на Етапі&nbsp;2+3. UI-компоненти і mock-дані готові; повноцінний
        екран «{title}» з’явиться на Етапі&nbsp;4.
      </InfoBanner>

      {/* Mock data stats */}
      <Card padding="p-5">
        <div className="flex items-center justify-between mb-3">
          <CardTitle>Підключені mock-дані</CardTitle>
          <Badge tone="green">
            <I.Check size={12} className="mr-1" /> готово
          </Badge>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Stat label="CHART_DATA[24h]"   value={`${dataStats.chart24h} год`} />
          <Stat label="CHART_DATA[7d]"    value={`${dataStats.chart7d} год`} />
          <Stat label="CHART_DATA[30d]"   value={`${dataStats.chart30d} днів`} />
          <Stat label="RECENT_FORECASTS"  value={dataStats.recentForecasts} />
          <Stat label="MODEL_METRICS"     value={dataStats.models} />
          <Stat label="MOCK_SCENARIOS"    value={dataStats.scenarios} />
          <Stat label="USERS"             value={dataStats.users} />
          <Stat label="HISTORY_FORECASTS" value="248" />
        </div>
      </Card>

      {/* Каталог UI */}
      <Card padding="p-5">
        <CardTitle>UI-компоненти</CardTitle>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Перевірка того, що все підключено та працює в темній і світлій темі.
        </p>

        <Tabs
          className="mt-4"
          items={[
            { value: 'overview',  label: 'Огляд' },
            { value: 'controls',  label: 'Контроли',  badge: '7' },
            { value: 'feedback',  label: 'Сповіщення' },
            { value: 'data',      label: 'Дані' },
          ]}
          value={tab}
          onChange={setTab}
        />

        <div className="mt-5">
          {tab === 'overview' && <OverviewTab onModalOpen={() => setModalOpen(true)} />}
          {tab === 'controls' && (
            <ControlsTab
              sliderValue={sliderValue} setSliderValue={setSliderValue}
              switchOn={switchOn} setSwitchOn={setSwitchOn}
              checked={checked} setChecked={setChecked}
              selectVal={selectVal} setSelectVal={setSelectVal}
            />
          )}
          {tab === 'feedback' && <FeedbackTab showToast={showToast} />}
          {tab === 'data'     && <DataTab />}
        </div>
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Тестове вікно"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              Скасувати
            </Button>
            <Button onClick={() => { setModalOpen(false); showToast({ type: 'success', title: 'Дію виконано' }); }}>
              Підтвердити
            </Button>
          </>
        }
      >
        <p>
          Модалка успішно відкривається з ESC-handler, fade-in анімацією і shadow.
          Дочірні елементи Modal — звичайний React-вміст.
        </p>
      </Modal>

      {/* Footer with page icon */}
      <div className="flex flex-col items-center justify-center text-center py-8">
        <div className="flex items-center justify-center h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 mb-2">
          <IconC size={22} />
        </div>
        <p className="text-xs text-slate-400 dark:text-slate-500">{pageId}</p>
      </div>
    </div>
  );
}

// ====================== Helper components ======================

function Stat({ label, value }) {
  return (
    <div className="rounded-md border border-slate-200 dark:border-slate-700 px-3 py-2">
      <div className="text-[11px] uppercase tracking-wide text-slate-400 dark:text-slate-500">{label}</div>
      <div className="mt-0.5 text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-100">
        {value}
      </div>
    </div>
  );
}

function OverviewTab({ onModalOpen }) {
  return (
    <div className="space-y-5">
      {/* Buttons */}
      <div>
        <Label className="block mb-2">Кнопки</Label>
        <div className="flex flex-wrap gap-2">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="subtle">Subtle</Button>
          <Button variant="danger">Danger</Button>
          <Button leftIcon={<I.Save size={14} />}>З іконкою</Button>
          <Button loading>Loading</Button>
          <Button onClick={onModalOpen}>Відкрити модалку</Button>
        </div>
      </div>

      <SectionDivider>Розміри кнопок</SectionDivider>
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm">Small</Button>
        <Button size="md">Medium</Button>
        <Button size="lg">Large</Button>
        <IconButton icon={<I.Settings size={16} />} label="Налаштування" variant="secondary" />
        <IconButton icon={<I.Trash2 size={16} />} label="Видалити" variant="danger" />
      </div>

      <SectionDivider>Бейджі (Badge — tone)</SectionDivider>
      <div className="flex flex-wrap gap-2">
        <Badge tone="slate">slate</Badge>
        <Badge tone="blue">blue</Badge>
        <Badge tone="green">green</Badge>
        <Badge tone="yellow">yellow</Badge>
        <Badge tone="orange">orange</Badge>
        <Badge tone="red">red</Badge>
        <Badge tone="purple">purple</Badge>
      </div>

      <SectionDivider>InfoBanner</SectionDivider>
      <div className="space-y-2">
        <InfoBanner tone="blue" icon="Info">
          Інформаційне повідомлення синім кольором.
        </InfoBanner>
        <InfoBanner tone="green" icon="CheckCircle">
          Успіх — модель ANFIS навчилася за 47&nbsp;секунд.
        </InfoBanner>
        <InfoBanner tone="amber" icon="AlertTriangle">
          Увага — погодний сервіс відповідає з затримкою більше 2&nbsp;секунд.
        </InfoBanner>
        <InfoBanner tone="red" icon="AlertCircle">
          Помилка — джерело ENTSO-E недоступне.
        </InfoBanner>
      </div>
    </div>
  );
}

function ControlsTab({ sliderValue, setSliderValue, switchOn, setSwitchOn, checked, setChecked, selectVal, setSelectVal }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
      <div>
        <Label htmlFor="text-1">Текстове поле</Label>
        <Input id="text-1" placeholder="Введіть текст..." className="mt-1.5" />
      </div>
      <div>
        <Label htmlFor="text-2">З іконкою</Label>
        <Input
          id="text-2"
          placeholder="Пошук..."
          leftIcon={<I.Search size={14} />}
          className="mt-1.5"
        />
      </div>

      <div>
        <Label>Select (options API)</Label>
        <Select
          value={selectVal}
          onChange={setSelectVal}
          options={[
            { value: '24h', label: '24 години' },
            { value: '7d',  label: '7 днів' },
            { value: '30d', label: '30 днів' },
          ]}
          className="mt-1.5"
        />
      </div>
      <div>
        <Label>Select (children API)</Label>
        <Select className="mt-1.5">
          <option>ANFIS</option>
          <option>LSTM</option>
          <option>Prophet</option>
        </Select>
      </div>

      <div className="md:col-span-2">
        <Slider
          label="Температура"
          min={-20} max={30} step={1}
          value={sliderValue}
          onChange={setSliderValue}
          format={(v) => fmtTemp(v)}
        />
        <div className="mt-2 flex gap-2">
          <DeltaChip value={sliderValue - 8} unit="°C" />
          <Badge tone="slate">Базове: 8&nbsp;°C</Badge>
        </div>
      </div>

      <div>
        <Label>Textarea</Label>
        <Textarea rows={3} placeholder="Багаторядковий текст..." className="mt-1.5" />
      </div>

      <div className="flex flex-col gap-3">
        <Switch checked={switchOn} onChange={setSwitchOn} label="Перемикач" />
        <Checkbox checked={checked} onChange={setChecked} label="Чекбокс" />
        <div className="flex items-center gap-2">
          <StatusDot tone="green" pulse />
          <span className="text-sm">Статус: активний</span>
        </div>
      </div>

      <div className="md:col-span-2">
        <Label>ProgressBar (за вагою)</Label>
        <div className="mt-1.5 space-y-2">
          <div className="flex items-center gap-3">
            <span className="text-xs w-12">0.87</span>
            <ProgressBar value={0.87} max={1} className="flex-1" />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs w-12">0.52</span>
            <ProgressBar value={0.52} max={1} className="flex-1" />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs w-12">0.28</span>
            <ProgressBar value={0.28} max={1} className="flex-1" />
          </div>
        </div>
      </div>
    </div>
  );
}

function FeedbackTab({ showToast }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button
          variant="secondary"
          leftIcon={<I.CheckCircle size={14} />}
          onClick={() => showToast({ type: 'success', title: 'Сценарій збережено', description: 'Сценарій "Холодна зима" додано до бібліотеки' })}
        >
          Success
        </Button>
        <Button
          variant="secondary"
          leftIcon={<I.AlertCircle size={14} />}
          onClick={() => showToast({ type: 'error', title: 'Помилка завантаження', description: 'ENTSO-E API не відповідає' })}
        >
          Error
        </Button>
        <Button
          variant="secondary"
          leftIcon={<I.AlertTriangle size={14} />}
          onClick={() => showToast({ type: 'warning', title: 'Великі значення CI', description: 'Довірчий інтервал > 5%' })}
        >
          Warning
        </Button>
        <Button
          variant="secondary"
          leftIcon={<I.Info size={14} />}
          onClick={() => showToast({ type: 'info', title: 'Інфо', description: 'Останнє оновлення даних 2 хв тому' })}
        >
          Info
        </Button>
      </div>

      <SectionDivider>Skeleton / Spinner</SectionDivider>
      <div className="space-y-2">
        <Skeleton h={14} className="w-1/3" />
        <Skeleton h={14} className="w-2/3" />
        <Skeleton h={14} className="w-1/2" />
        <div className="flex items-center gap-2 mt-3">
          <Spinner size={18} />
          <span className="text-sm">Завантаження моделі...</span>
        </div>
      </div>
    </div>
  );
}

function DataTab() {
  const samples = MOCK_SCENARIOS.slice(0, 3);
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card padding="p-4">
        <CardTitle className="mb-3">Приклад сценаріїв</CardTitle>
        <div className="space-y-3">
          {samples.map((s) => (
            <div key={s.id} className="flex items-start justify-between gap-3 pb-3 border-b last:border-b-0 last:pb-0 border-slate-200 dark:border-slate-700">
              <div className="min-w-0">
                <div className="font-medium text-sm text-slate-900 dark:text-slate-100">{s.name}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">{s.description}</div>
              </div>
              <Badge tone={s.direction === 'up' ? 'orange' : s.direction === 'down' ? 'blue' : 'slate'}>
                {fmtSignedPercent(s.deltaPct, 1)}
              </Badge>
            </div>
          ))}
        </div>
      </Card>

      <Card padding="p-4">
        <CardTitle className="mb-3">Метрики моделей</CardTitle>
        <div className="space-y-2">
          {MODEL_METRICS.map((m) => (
            <div key={m.modelName} className="flex items-center justify-between text-sm">
              <span className="font-medium">{m.modelName}</span>
              <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                <span>MAPE: <span className="font-mono tabular-nums text-slate-900 dark:text-slate-100">{fmtDecimal(m.mape, 2)}%</span></span>
                <span>RMSE: <span className="font-mono tabular-nums text-slate-900 dark:text-slate-100">{m.rmse}</span></span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
