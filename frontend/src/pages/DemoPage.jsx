import { useState } from 'react';
import { Card, CardHeader, CardBody, SectionHeader, SectionTitle } from '../components/ui/Card';
import { Button, IconButton } from '../components/ui/Button';
import { Badge, StatusDot } from '../components/ui/Badge';
import { Tabs, TabPills } from '../components/ui/Tabs';
import { Skeleton, Spinner, InfoBanner, ProgressBar, Label } from '../components/ui/Feedback';
import { Input, Select, Textarea, Slider, Switch, Checkbox } from '../components/ui/Controls';
import { Modal } from '../components/ui/Modal';
import * as I from '../components/ui/Icons';
import { useToast } from '../contexts/ToastContext';

export default function DemoPage() {
  const [tab, setTab] = useState('a');
  const [pill, setPill] = useState('week');
  const [text, setText] = useState('');
  const [city, setCity] = useState('kyiv');
  const [temp, setTemp] = useState(12);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [confirmed, setConfirmed] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const { showToast } = useToast();

  return (
    <div className="space-y-8">
      <SectionHeader
        title="UI Kit"
        subtitle="Демонстрація всіх компонентів інтерфейсу. Перевірте, як виглядає на телефоні / планшеті / десктопі."
        actions={
          <Button leftIcon={I.Download} variant="secondary" size="sm">
            Експорт
          </Button>
        }
      />

      {/* Buttons */}
      <Card>
        <CardHeader>
          <SectionTitle>Кнопки</SectionTitle>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="subtle">Subtle</Button>
            <Button variant="danger">Danger</Button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
            <Button leftIcon={I.Plus}>З іконкою</Button>
            <Button rightIcon={I.ArrowRight} variant="secondary">Далі</Button>
            <IconButton icon={I.RefreshCw} label="Оновити" variant="secondary" />
            <Button disabled>Disabled</Button>
          </div>
        </CardBody>
      </Card>

      {/* Badges */}
      <Card>
        <CardHeader>
          <SectionTitle>Бейджі та індикатори</SectionTitle>
        </CardHeader>
        <CardBody>
          <div className="flex flex-wrap gap-2 items-center">
            <Badge tone="slate">slate</Badge>
            <Badge tone="blue">blue</Badge>
            <Badge tone="green">green</Badge>
            <Badge tone="amber">amber</Badge>
            <Badge tone="red">red</Badge>
            <Badge tone="purple">purple</Badge>
            <Badge tone="green" size="sm">MAPE 2,14%</Badge>
            <Badge tone="blue" size="lg">v2.1</Badge>
            <span className="inline-flex items-center gap-1.5 text-sm">
              <StatusDot tone="green" pulse /> Активна
            </span>
            <span className="inline-flex items-center gap-1.5 text-sm">
              <StatusDot tone="amber" /> Тренування
            </span>
          </div>
        </CardBody>
      </Card>

      {/* Tabs */}
      <Card>
        <CardHeader>
          <SectionTitle>Вкладки</SectionTitle>
        </CardHeader>
        <CardBody className="space-y-4">
          <Tabs
            value={tab}
            onChange={setTab}
            items={[
              { id: 'a', label: 'Метрики', icon: I.BarChart3 },
              { id: 'b', label: 'Графіки', icon: I.TrendingUp, count: 5 },
              { id: 'c', label: 'Інтерпретація', icon: I.Network },
            ]}
          />
          <div className="text-sm text-slate-500">Активна: {tab}</div>

          <div>
            <TabPills
              value={pill}
              onChange={setPill}
              items={[
                { id: 'day', label: 'Доба' },
                { id: 'week', label: 'Тиждень' },
                { id: 'month', label: 'Місяць' },
                { id: 'year', label: 'Рік' },
              ]}
            />
          </div>
        </CardBody>
      </Card>

      {/* Form controls */}
      <Card>
        <CardHeader>
          <SectionTitle>Поля вводу</SectionTitle>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="search">Пошук</Label>
              <Input
                id="search"
                placeholder="Знайти прогноз..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                leftIcon={I.Search}
              />
            </div>
            <div>
              <Label htmlFor="city">Регіон</Label>
              <Select id="city" value={city} onChange={(e) => setCity(e.target.value)}>
                <option value="kyiv">Київ</option>
                <option value="lviv">Львів</option>
                <option value="kharkiv">Харків</option>
                <option value="odesa">Одеса</option>
              </Select>
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="notes" hint="опційно">
                Коментар
              </Label>
              <Textarea id="notes" placeholder="Опис сценарію..." rows={3} />
            </div>
            <div className="sm:col-span-2">
              <Label>
                Температура: <span className="font-semibold tabular-nums">{temp}°C</span>
              </Label>
              <Slider value={temp} onChange={setTemp} min={-10} max={30} step={0.5} />
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Switch + Checkbox */}
      <Card>
        <CardHeader>
          <SectionTitle>Перемикачі</SectionTitle>
        </CardHeader>
        <CardBody className="flex flex-wrap gap-x-6 gap-y-3">
          <Switch checked={autoRefresh} onChange={setAutoRefresh} label="Автооновлення" />
          <Checkbox checked={confirmed} onChange={setConfirmed} label="Підтверджую використання даних" />
        </CardBody>
      </Card>

      {/* Banners */}
      <Card>
        <CardHeader>
          <SectionTitle>Банери</SectionTitle>
        </CardHeader>
        <CardBody className="space-y-3">
          <InfoBanner tone="info" title="Інформація">
            Період даних: 2017-2021 (до повномасштабного вторгнення)
          </InfoBanner>
          <InfoBanner tone="success" title="Модель навчена">
            ANFIS успішно протренована, MAPE 2,14%
          </InfoBanner>
          <InfoBanner tone="warning" title="Низька впевненість">
            Прогноз для нічних годин має ширший довірчий інтервал
          </InfoBanner>
          <InfoBanner tone="error" title="Помилка з’єднання">
            Не вдалося отримати дані з ENTSO-E API. Використовуються кешовані значення.
          </InfoBanner>
        </CardBody>
      </Card>

      {/* Progress + Skeleton + Spinner */}
      <Card>
        <CardHeader>
          <SectionTitle>Прогрес і завантаження</SectionTitle>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-slate-500">
              <span>Тренування ANFIS</span>
              <span className="tabular-nums">72%</span>
            </div>
            <ProgressBar value={72} tone="blue" />
          </div>
          <div className="flex items-center gap-3">
            <Spinner size={18} className="text-blue-600" />
            <span className="text-sm text-slate-600 dark:text-slate-400">Обчислення прогнозу...</span>
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-72" />
            <Skeleton className="h-4 w-56" />
          </div>
        </CardBody>
      </Card>

      {/* Modal + Toast trigger */}
      <Card>
        <CardHeader>
          <SectionTitle>Інтерактив</SectionTitle>
        </CardHeader>
        <CardBody className="flex flex-wrap gap-2">
          <Button onClick={() => setModalOpen(true)} variant="secondary">
            Відкрити модалку
          </Button>
          <Button
            onClick={() =>
              showToast({
                title: 'Збережено',
                description: 'Сценарій додано в "Мої сценарії"',
              })
            }
            variant="secondary"
            leftIcon={I.Save}
          >
            Показати тост
          </Button>
        </CardBody>
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Зберегти сценарій"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Скасувати
            </Button>
            <Button
              onClick={() => {
                setModalOpen(false);
                showToast('Сценарій збережено');
              }}
            >
              Зберегти
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <Label htmlFor="sn">Назва сценарію</Label>
            <Input id="sn" placeholder="Холодний понеділок, +5°C" />
          </div>
          <div>
            <Label htmlFor="sd">Опис</Label>
            <Textarea id="sd" placeholder="Опишіть умови сценарію..." />
          </div>
        </div>
      </Modal>
    </div>
  );
}
