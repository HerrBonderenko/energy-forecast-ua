// System mock data — data sources, cache, training history, users, tech stack.
// Used on the Settings page.

export const DATA_SOURCES = [
  {
    id: 'ds-entsoe',
    type: 'entsoe',
    name: 'ENTSO-E Transparency Platform',
    description: 'Дані споживання та генерації',
    status: 'connected',
    lastUpdate: '2026-05-08T14:00:00Z',
  },
  {
    id: 'ds-meteo',
    type: 'open-meteo',
    name: 'Open-Meteo API',
    description: 'Історична та поточна погода',
    status: 'connected',
    lastUpdate: '2026-05-08T12:00:00Z',
  },
  {
    id: 'ds-manual',
    type: 'manual-upload',
    name: 'Ручне завантаження',
    description: 'Імпорт CSV/Excel файлів',
    status: 'pending',
    lastUpdate: null,
  },
];

export const DATA_CACHE = [
  {
    sourceName: 'Споживання ENTSO-E',
    coverage: '2017-01-01 → 2026-05-08',
    records: '82 488 годин',
    lastUpdated: '8 трав, 14:00',
    action: 'Оновити',
  },
  {
    sourceName: 'Погода Open-Meteo',
    coverage: '2017-01-01 → 2026-05-08',
    records: '494 928 точок (6 міст)',
    lastUpdated: '8 трав, 12:00',
    action: 'Оновити',
  },
  {
    sourceName: 'Прогнози моделі',
    coverage: '—',
    records: '1 247 записів',
    lastUpdated: '8 трав, 13:42',
    action: 'Очистити старіші за 90 днів',
  },
];

export const AUTO_UPDATE_RULES = [
  { id: 'r1', label: 'Оновлювати дані ENTSO-E щогодини',              default: true  },
  { id: 'r2', label: 'Оновлювати погоду тричі на добу (00:00, 12:00, 18:00)', default: true  },
  { id: 'r3', label: 'Очищати застарілі прогнози щонеділі',           default: false },
  { id: 'r4', label: 'Перевіряти зв\u2019язок з API кожні 5 хвилин',  default: true  },
];

export const TRAINING_HISTORY = [
  { id: 't1', date: '02.05.2026 14:00', version: 'v1.2.3', mapeBefore: 2.31, mapeAfter: 2.14, duration: 47, status: 'success' },
  { id: 't2', date: '25.04.2026 09:00', version: 'v1.2.2', mapeBefore: 2.42, mapeAfter: 2.31, duration: 51, status: 'success' },
  { id: 't3', date: '18.04.2026 12:00', version: 'v1.2.1', mapeBefore: 2.58, mapeAfter: 2.42, duration: 49, status: 'success' },
  { id: 't4', date: '11.04.2026 10:00', version: 'v1.2.0', mapeBefore: 2.87, mapeAfter: 2.58, duration: 53, status: 'success' },
  { id: 't5', date: '04.04.2026 11:00', version: 'v1.1.5', mapeBefore: null, mapeAfter: null, duration: 12, status: 'error', error: 'Помилка завантаження даних' },
];

export const USERS = [
  {
    id: 'u1', name: 'Олексій Петренко', initials: 'ОП',
    email: 'petrenko@example.com', role: 'admin', roleLabel: 'Адміністратор', roleTone: 'purple',
    lastLogin: '8 трав 2026, 14:30',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  },
  {
    id: 'u2', name: 'Ірина Коваль', initials: 'ІК',
    email: 'koval@example.com', role: 'analyst', roleLabel: 'Аналітик', roleTone: 'blue',
    lastLogin: '8 трав 2026, 11:15',
    color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  },
  {
    id: 'u3', name: 'Микола Шевченко', initials: 'МШ',
    email: 'shevchenko@example.com', role: 'viewer', roleLabel: 'Глядач', roleTone: 'slate',
    lastLogin: '7 трав 2026, 16:42',
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  },
];

// Реальний стек проєкту (без TypeScript і shadcn/ui — JS + Tailwind)
export const TECH_STACK = [
  'React 18', 'JavaScript (ES2022)', 'Vite 5',
  'React Router 6', 'Tailwind CSS 3', 'Recharts',
  'FastAPI', 'PostgreSQL', 'PyTorch', 'scikit-fuzzy', 'pandas', 'NumPy',
  'ENTSO-E API', 'Open-Meteo API',
];

export const SOURCES_LINKS = [
  { label: 'ENTSO-E Transparency Platform', url: 'https://transparency.entsoe.eu/' },
  { label: 'Open-Meteo Historical Weather API', url: 'https://open-meteo.com/' },
  {
    label: 'ANFIS: Adaptive-Network-Based Fuzzy Inference System (Jang, 1993)',
    url: 'https://ieeexplore.ieee.org/document/256541',
  },
];

export const SYSTEM_INFO = {
  appName: 'Energy Forecast UA',
  version: 'v1.2.3',
  description:
    'Веб-сервіс для прогнозування погодинного споживання електроенергії в ОЕС України на основі ANFIS — адаптивно-мережевої нечіткої системи виведення.',
  thesis: 'Дипломна робота, 2026 р.',
};
