# Energy Forecast UA

Дипломний проєкт: прогнозування погодинного споживання електроенергії в ОЕС України методом ANFIS.

## Стек

- **React 18** + **Vite 5** — основа
- **React Router v6** — навігація
- **Tailwind CSS 3** — стилі (через `tailwind.config.js`)
- **Recharts** — графіки (буде на Етапі 4)
- Власні SVG-обгортки іконок (lucide-style, у `src/components/ui/Icons.jsx`)
- State: `useState` + Context (`ThemeContext`, `ToastContext`, `ScenariosContext`)

## Запуск

```bash
npm install
npm run dev
```

Відкриється [http://localhost:5173](http://localhost:5173).

## Структура проєкту

```
src/
├── main.jsx                  # точка входу
├── App.jsx                   # роутер + 3 провайдери
├── index.css                 # Tailwind + кастомні стилі (skel, ef-range, ef-check)
│
├── components/
│   ├── layout/
│   │   ├── Layout.jsx        # сайдбар + Outlet + тости
│   │   ├── Sidebar.jsx       # навігація з React Router
│   │   └── ToastStack.jsx    # рендер тостів з типами (success/error/warning/info)
│   └── ui/
│       ├── Icons.jsx         # ~60 SVG-іконок (PascalCase + kebab-case alias)
│       └── index.jsx         # 20+ UI-компонентів
│
├── pages/
│   └── PlaceholderPage.jsx   # каталог компонентів (тимчасова заглушка)
│
├── contexts/
│   ├── ThemeContext.jsx      # light/dark
│   ├── ToastContext.jsx      # тости (string OR object API)
│   └── ScenariosContext.jsx  # бібліотека сценаріїв (CRUD + duplicate)
│
└── lib/
    ├── utils.js              # форматери, baseLoad, generateForecast24h, applyWhatIf,
    │                         #   gauss, tri, mulberry32, cx, NOW
    └── mockData/
        ├── dashboard.js      # CHART_DATA[5 періодів], RECENT_FORECASTS, SPARKLINES, ERROR_DIST
        ├── scenarios.js      # MOCK_SCENARIOS[8], FUZZY_RULES_SHORT, SENSITIVITIES, BASELINE
        ├── analytics.js      # MODEL_METRICS[5], CHART_DATA_7D, HOURLY_MAPE_CHART,
        │                     #   MEMBERSHIP_FUNCTIONS[7], RULES[26], ACTIVE_CONTEXT/RULES
        ├── history.js        # HISTORY_FORECASTS[248], HISTORY_BEST/WORST/AVG_MAPE
        ├── system.js         # DATA_SOURCES, USERS, TRAINING_HISTORY, TECH_STACK
        └── index.js          # re-exports everything
```

## UI-компоненти (доступні з `'@/components/ui'`)

| Компонент       | API |
|-----------------|-----|
| `Button`        | variants: primary/secondary/ghost/subtle/danger; sizes: sm/md/lg; +loading, +leftIcon |
| `IconButton`    | icon, label (a11y), variant, size |
| `Card`          | + `CardHeader`, `CardBody`, `CardTitle`, `padding`, `hover` |
| `Badge`         | tone OR color: slate/gray/blue/green/yellow/orange/red/purple; sizes xs/sm/md |
| `Tabs`          | items=`[{value,label,badge?}]`, value, onChange, sticky |
| `Modal`         | open, onClose, title, footer, size (sm/md/lg/xl) OR maxWidth; +Escape +backdrop click |
| `InfoBanner`    | tone: blue/amber/green/red; icon (за назвою) |
| `SectionHeader` | title, subtitle, right |
| `Label`, `Input`, `Textarea` | leftIcon OR icon (alias) |
| `Select`        | options=`[{value,label}]` OR children=`<option>` |
| `Slider`        | + label, format (custom display), unit |
| `Switch`, `Checkbox` | стандартний checked/onChange |
| `ProgressBar`   | tone OR colorMode='weight' (автоматичні кольори за значенням) |
| `DeltaChip`     | для what-if слайдерів: +5 °C / −3 °C з кольоровим тлом |
| `Spinner`, `Skeleton`, `StatusDot` | індикатори стану |
| `SectionDivider` | розділювач з опційним підзаголовком |

## Mock-дані

Імпорт зручний через єдиний entry point:
```js
import { CHART_DATA, MOCK_SCENARIOS, MODEL_METRICS, HISTORY_FORECASTS, USERS } from '@/lib/mockData';
```

Ключові набори:

| Константа               | Опис |
|-------------------------|------|
| `CHART_DATA['24h'/'7d'/'30d'/'90d'/'1y']` | Серії для Dashboard |
| `RECENT_FORECASTS`      | 5 останніх прогнозів |
| `MOCK_SCENARIOS`        | 8 базових сценаріїв (холодна зима, спека, свято тощо) |
| `MODEL_METRICS`         | ANFIS / LSTM / Prophet / SARIMAX / Naive — MAPE, RMSE, MAE |
| `CHART_DATA_7D`         | 168 годинних точок з прогнозами 5 моделей |
| `HOURLY_MAPE_CHART`     | MAPE по годинах для 4 моделей |
| `MEMBERSHIP_FUNCTIONS`  | 7 функцій приналежності (temp, hour, dow, season, cloud, wind, daytype) |
| `RULES`                 | 26 нечітких правил |
| `ACTIVE_CONTEXT`, `ACTIVE_RULES` | Активні правила для конкретного моменту |
| `HISTORY_FORECASTS`     | 248 згенерованих прогнозів за 30 днів |
| `DATA_SOURCES`, `USERS`, `TRAINING_HISTORY`, `TECH_STACK` | Settings |

## Маршрути

| URL | Сторінка |
|---|---|
| `/` | Dashboard |
| `/forecast` | Прогноз |
| `/scenario-analysis` | Сценарний аналіз |
| `/scenarios` | Мої сценарії |
| `/compare` | Порівняння моделей |
| `/interpretation` | Інтерпретація |
| `/history` | Історія прогнозів |
| `/settings` | Налаштування |

Зараз на всіх маршрутах показано `PlaceholderPage` — каталог UI-компонентів,
де можна перевірити, що все працює (кнопки, тости, модалка, перемикання теми).

## Поточний стан

- ✅ **Етап 1** — Каркас, навігація, sidebar
- ✅ **Етап 2** — UI-компоненти (20+ примітивів)
- ✅ **Етап 3** — Mock-дані (~1200 рядків даних з 4 артефактів об'єднано)
- ⏳ **Етап 4** — 8 повних екранів (наступний крок)
- ⏳ **Етап 5** — Cross-screen переходи з router state
