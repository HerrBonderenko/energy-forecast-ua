import { useState } from 'react';
import {
  Card, CardHeader, CardBody, CardFooter, SectionTitle,
  Button, IconButton, Spinner,
  Badge,
  Label, Input, TextInput, Textarea, Select, Slider, Switch, Toggle, Checkbox,
  Modal,
  Skeleton, InfoBanner, ProgressBar, StatusDot, DeltaChip,
  Tabs,
  PageHeader, SectionHeader, SectionDivider,
  Tooltip, Popover, DropdownMenu,
  Icon,
} from '../components/ui';
import { useToast } from '../contexts/ToastContext';

/** Маленька картка-секція з заголовком */
function Demo({ title, children }) {
  return (
    <Card>
      <CardHeader>
        <SectionTitle>{title}</SectionTitle>
      </CardHeader>
      <CardBody>
        <div className="flex flex-wrap items-center gap-3">{children}</div>
      </CardBody>
    </Card>
  );
}

export default function UIKitDemo() {
  const { showToast } = useToast();

  // local state для інтерактивних елементів
  const [sliderA, setSliderA] = useState(50);
  const [sliderB, setSliderB] = useState(14.5);
  const [switchA, setSwitchA] = useState(true);
  const [switchB, setSwitchB] = useState(false);
  const [checkA, setCheckA] = useState(true);
  const [checkB, setCheckB] = useState(false);
  const [text1, setText1] = useState('');
  const [text2, setText2] = useState('Львів');
  const [textArea, setTextArea] = useState('');
  const [sel1, setSel1] = useState('1d');
  const [sel2, setSel2] = useState('asc');
  const [tab, setTab] = useState('metrics');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalLgOpen, setModalLgOpen] = useState(false);

  return (
    <>
      <PageHeader
        title="UI Kit"
        subtitle="Тимчасова сторінка для перевірки UI-компонентів. На наступному етапі стане справжнім Dashboard."
        actions={
          <>
            <Button variant="secondary" icon="RefreshCw">Оновити</Button>
            <Button icon="Download">Експорт</Button>
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* ---- Buttons ---- */}
        <Demo title="Кнопки — варіанти">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="subtle">Subtle</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
        </Demo>

        <Demo title="Кнопки — розміри">
          <Button size="xs">XS</Button>
          <Button size="sm">SM</Button>
          <Button size="md">MD</Button>
          <Button size="lg">LG</Button>
          <IconButton icon="Settings" label="Налаштування" />
          <IconButton icon="MoreHorizontal" label="Дії" variant="secondary" />
        </Demo>

        <Demo title="Кнопки — іконки">
          <Button icon="Plus">Додати</Button>
          <Button variant="secondary" icon="Download">Експорт</Button>
          <Button variant="secondary" iconRight="ArrowRight">Далі</Button>
          <Button variant="danger" icon="Trash2">Видалити</Button>
          <Button loading>Завантаження…</Button>
          <Button disabled>Неактивно</Button>
        </Demo>

        {/* ---- Badges ---- */}
        <Demo title="Бейджі — кольори (tone)">
          <Badge>Default</Badge>
          <Badge tone="blue">Інфо</Badge>
          <Badge tone="green">MAPE 2,14%</Badge>
          <Badge tone="amber">Увага</Badge>
          <Badge tone="orange">+0,8 °C</Badge>
          <Badge tone="red">Помилка</Badge>
          <Badge tone="purple">Beta</Badge>
        </Demo>

        <Demo title="Бейджі — розміри">
          <Badge size="xs" tone="blue">xs</Badge>
          <Badge size="sm" tone="blue">sm</Badge>
          <Badge size="md" tone="blue">md</Badge>
        </Demo>

        {/* ---- Inputs ---- */}
        <Demo title="Поля вводу">
          <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input
              placeholder="Пошук…"
              leftIcon={<Icon name="Search" size={14} />}
              value={text1}
              onChange={(e) => setText1(e.target.value)}
            />
            <Input
              label="Місто"
              value={text2}
              onChange={(e) => setText2(e.target.value)}
              suffix="UA"
            />
            <Select
              value={sel1}
              onChange={setSel1}
              options={[
                { value: '24h', label: '24 години' },
                { value: '1d',  label: '1 день' },
                { value: '7d',  label: '7 днів' },
                { value: '30d', label: '30 днів' },
              ]}
            />
            <Select
              label="Сортувати"
              value={sel2}
              onChange={setSel2}
              options={[
                { value: 'asc',  label: 'За зростанням' },
                { value: 'desc', label: 'За спаданням' },
                { value: 'date', label: 'За датою' },
              ]}
            />
          </div>
          <Textarea
            placeholder="Опис сценарію…"
            value={textArea}
            onChange={(e) => setTextArea(e.target.value)}
            rows={3}
            className="w-full"
          />
        </Demo>

        {/* ---- Slider ---- */}
        <Demo title="Слайдери">
          <div className="w-full space-y-4">
            <div className="flex flex-col gap-1.5">
              <Label>Без підпису (значення: {sliderA})</Label>
              <Slider value={sliderA} onChange={setSliderA} min={0} max={100} />
            </div>
            <Slider
              label="Температура"
              value={sliderB}
              onChange={setSliderB}
              min={-15}
              max={35}
              step={0.5}
              format={(v) => `${v.toFixed(1)} °C`}
            />
          </div>
        </Demo>

        {/* ---- Switch / Checkbox ---- */}
        <Demo title="Перемикачі та чекбокси">
          <div className="w-full space-y-3">
            <Switch checked={switchA} onChange={setSwitchA} label="Простий switch (inline label)" />
            <Switch
              checked={switchB}
              onChange={setSwitchB}
              label="Структурний switch"
              description="З підказкою-описом нижче для більших списків налаштувань"
            />
            <div className="flex flex-wrap items-center gap-4">
              <Checkbox checked={checkA} onChange={setCheckA} label="ANFIS" />
              <Checkbox checked={checkB} onChange={setCheckB} label="LSTM" />
              <Toggle checked={true} onChange={() => {}} label="Alias Toggle" />
            </div>
          </div>
        </Demo>

        {/* ---- Feedback / Progress / Status ---- */}
        <Demo title="Прогрес і статуси">
          <div className="w-full space-y-3">
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Default</div>
              <ProgressBar value={45} />
            </div>
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Green</div>
              <ProgressBar value={0.78} max={1} tone="green" />
            </div>
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Auto-tone (colorMode="weight")</div>
              <ProgressBar value={0.45} max={1} colorMode="weight" />
              <div className="mt-1">
                <ProgressBar value={0.82} max={1} colorMode="weight" />
              </div>
            </div>
            <div className="flex items-center gap-4 pt-2">
              <span className="inline-flex items-center gap-2 text-sm">
                <StatusDot tone="green" pulse /> Модель активна
              </span>
              <span className="inline-flex items-center gap-2 text-sm">
                <StatusDot tone="amber" /> Очікування
              </span>
              <span className="inline-flex items-center gap-2 text-sm">
                <StatusDot tone="red" /> Помилка
              </span>
              <span className="inline-flex items-center gap-2 text-sm">
                <StatusDot tone="gray" /> Вимкнено
              </span>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <Spinner size={16} className="text-blue-600" />
              <span className="text-sm text-slate-600 dark:text-slate-400">Обчислення прогнозу…</span>
            </div>
          </div>
        </Demo>

        <Demo title="DeltaChip">
          <DeltaChip value={2.1} unit="°C" />
          <DeltaChip value={-1.5} unit="°C" />
          <DeltaChip value={0.3} unit="ГВт" />
          <DeltaChip value={-0.45} unit="ГВт" />
          <DeltaChip value={5} unit="%" />
          <DeltaChip value={0} neutral />
        </Demo>

        {/* ---- InfoBanner ---- */}
        <Demo title="Інфо-банери">
          <div className="w-full space-y-2">
            <InfoBanner tone="blue">
              Прогноз побудовано на основі ANFIS-моделі з 26 нечіткими правилами.
            </InfoBanner>
            <InfoBanner tone="green" icon="CheckCircle">
              Модель успішно перетренована. MAPE 2,14% на тестовій вибірці.
            </InfoBanner>
            <InfoBanner tone="amber" icon="AlertTriangle">
              Деякі дані погоди застарілі (>6 годин). Оновіть для точнішого прогнозу.
            </InfoBanner>
            <InfoBanner tone="red" icon="AlertCircle">
              Помилка з'єднання з ENTSO-E. Використовуються кешовані дані.
            </InfoBanner>
          </div>
        </Demo>

        {/* ---- Tabs ---- */}
        <Demo title="Таби">
          <div className="w-full">
            <Tabs
              value={tab}
              onChange={setTab}
              items={[
                { value: 'metrics', label: 'Метрики' },
                { value: 'charts',  label: 'Графіки', badge: 'NEW' },
                { value: 'errors',  label: 'Помилки' },
                { value: 'export',  label: 'Експорт' },
              ]}
            />
            <div className="pt-4 text-sm text-slate-600 dark:text-slate-400">
              Активний таб: <Badge tone="blue">{tab}</Badge>
            </div>
          </div>
        </Demo>

        {/* ---- Toasts ---- */}
        <Demo title="Тости — клікніть, щоб показати">
          <Button
            variant="primary"
            icon="CheckCircle"
            onClick={() =>
              showToast({
                type: 'success',
                title: 'Прогноз збережено',
                description: 'Файл forecast-2026-05-08.json',
              })
            }
          >
            Success
          </Button>
          <Button
            variant="secondary"
            icon="Info"
            onClick={() =>
              showToast({
                type: 'info',
                title: 'Інформація',
                description: 'Дані погоди оновлено',
              })
            }
          >
            Info
          </Button>
          <Button
            variant="secondary"
            icon="AlertTriangle"
            onClick={() =>
              showToast({
                type: 'warning',
                title: 'Кеш застарів',
                description: 'Останнє оновлення 6 годин тому',
              })
            }
          >
            Warning
          </Button>
          <Button
            variant="danger"
            icon="AlertCircle"
            onClick={() =>
              showToast({
                type: 'error',
                title: 'Помилка з\'єднання',
                description: 'ENTSO-E недоступний',
              })
            }
          >
            Error
          </Button>
        </Demo>

        {/* ---- Modal ---- */}
        <Demo title="Модальні вікна">
          <Button onClick={() => setModalOpen(true)}>Малий модал</Button>
          <Button variant="secondary" onClick={() => setModalLgOpen(true)}>
            Великий модал
          </Button>
        </Demo>

        {/* ---- Overlay: Tooltip / Popover / Dropdown ---- */}
        <Demo title="Tooltip / Popover / Dropdown">
          <Tooltip content="Це підказка зверху">
            <Button variant="secondary">Hover мене</Button>
          </Tooltip>

          <Popover
            trigger={<Button variant="secondary" iconRight="ChevronDown">Popover</Button>}
            width="w-64"
          >
            <div className="p-3 text-sm text-slate-700 dark:text-slate-300">
              <div className="font-medium text-slate-900 dark:text-slate-100 mb-1">
                Вміст поповера
              </div>
              <p>Можна показати будь-який JSX-вміст. Закривається кліком поза.</p>
            </div>
          </Popover>

          <DropdownMenu
            trigger={<IconButton icon="MoreHorizontal" label="Дії" variant="secondary" />}
            items={[
              { label: 'Переглянути', icon: 'Eye', onClick: () => showToast({ title: 'Переглянути' }) },
              { label: 'Дублювати',   icon: 'Copy', onClick: () => showToast({ title: 'Дублювати' }) },
              { separator: true },
              { label: 'Видалити',    icon: 'Trash2', danger: true, onClick: () => showToast({ type: 'error', title: 'Видалено' }) },
            ]}
          />
        </Demo>

        {/* ---- Skeleton ---- */}
        <Demo title="Skeleton (заповнювачі)">
          <div className="w-full space-y-2">
            <Skeleton h={14} className="w-1/3" />
            <Skeleton h={14} className="w-1/2" />
            <Skeleton h={14} className="w-2/3" />
            <div className="flex items-center gap-3 pt-2">
              <Skeleton w={48} h={48} rounded="rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton h={14} className="w-1/2" />
                <Skeleton h={14} className="w-3/4" />
              </div>
            </div>
          </div>
        </Demo>
      </div>

      {/* ---- Section header + divider examples ---- */}
      <div className="mt-6">
        <Card>
          <CardHeader>
            <SectionHeader
              title="SectionHeader всередині картки"
              subtitle="Підзаголовок з контекстом"
              right={
                <>
                  <Badge tone="green">Live</Badge>
                  <Button size="sm" variant="ghost" icon="ExternalLink">Деталі</Button>
                </>
              }
            />
          </CardHeader>
          <CardBody>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Це — основний вміст картки. Картка може мати CardHeader / CardBody / CardFooter.
            </p>
            <SectionDivider>Додатково</SectionDivider>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Текст після розділювача-секції з лейблом.
            </p>
          </CardBody>
          <CardFooter>
            <Button variant="ghost">Скасувати</Button>
            <Button>Зберегти</Button>
          </CardFooter>
        </Card>
      </div>

      {/* ---- Modals ---- */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Підтвердження"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Скасувати</Button>
            <Button
              variant="danger"
              onClick={() => {
                setModalOpen(false);
                showToast({ type: 'error', title: 'Сценарій видалено' });
              }}
            >
              Видалити
            </Button>
          </>
        }
      >
        <p className="mb-2">Видалити сценарій «Зимовий пік»?</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Цю дію неможливо скасувати.
        </p>
      </Modal>

      <Modal
        open={modalLgOpen}
        onClose={() => setModalLgOpen(false)}
        title="Зберегти сценарій"
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalLgOpen(false)}>Скасувати</Button>
            <Button
              onClick={() => {
                setModalLgOpen(false);
                showToast({ type: 'success', title: 'Сценарій збережено' });
              }}
            >
              Зберегти
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Input label="Назва" placeholder="Наприклад: Зимовий пік +20%" />
          <Textarea placeholder="Опис (необов'язково)" rows={3} className="w-full" />
          <Switch checked={true} onChange={() => {}} label="Зробити публічним" />
        </div>
      </Modal>
    </>
  );
}
