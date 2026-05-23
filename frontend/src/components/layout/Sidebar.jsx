import { NavLink } from 'react-router-dom';
import * as I from '../ui/Icons';
import { useTheme } from '../../contexts/ThemeContext';
import { cx } from '../../lib/utils';

// Канонічний NAV — групи зі специфікації артефактів
const NAV_GROUPS = [
  {
    title: 'Робота',
    items: [
      { to: '/',                  label: 'Dashboard',          icon: I.LayoutDashboard, hotkey: 'Alt+1', tip: 'Огляд системи' },
      { to: '/forecast',          label: 'Прогноз',            icon: I.TrendingUp,      hotkey: 'Alt+2', tip: 'Створити новий прогноз' },
      { to: '/scenario-analysis', label: 'Сценарний аналіз',   icon: I.Sliders,         hotkey: 'Alt+3', tip: 'Дослідження впливу умов' },
      { to: '/scenarios',         label: 'Мої сценарії',       icon: I.Bookmark,        hotkey: 'Alt+4', tip: 'Збережені сценарії' },
    ],
  },
  {
    title: 'Аналіз',
    items: [
      { to: '/compare',        label: 'Порівняння моделей', icon: I.BarChart3, hotkey: 'Alt+5', tip: 'ANFIS vs LSTM/Prophet/SARIMAX' },
      { to: '/interpretation', label: 'Інтерпретація',      icon: I.Network,   hotkey: 'Alt+6', tip: 'Структура нечіткої моделі' },
      { to: '/history',        label: 'Історія прогнозів',  icon: I.History,   hotkey: 'Alt+7', tip: 'Журнал усіх прогнозів' },
    ],
  },
  {
    title: 'Система',
    items: [
      { to: '/settings', label: 'Налаштування', icon: I.Settings, hotkey: 'Alt+8', tip: 'Управління даними і моделлю' },
    ],
  },
];

function Switch({ checked, onChange, ariaLabel }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={() => onChange(!checked)}
      className={cx(
        'relative inline-flex h-5 w-9 items-center rounded-full transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
        'focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900',
        checked ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700',
      )}
    >
      <span
        className={cx(
          'inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform',
          checked ? 'translate-x-[18px]' : 'translate-x-0.5',
        )}
      />
    </button>
  );
}

function NavItem({ to, label, icon: IconC, onClick, hotkey, tip }) {
  // Використовуємо нативний title — не обрізається на вузьких екранах
  const titleText = hotkey ? `${tip || label}\n${hotkey}` : (tip || label);
  return (
    <NavLink
      to={to}
      end={to === '/'}
      onClick={onClick}
      title={titleText}
      className={({ isActive }) =>
        cx(
          'group relative flex items-center w-full pl-3 pr-3 py-2 rounded-md text-sm font-medium transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
          isActive
            ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300'
            : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-blue-600 dark:bg-blue-400" />
          )}
          <IconC size={18} className="shrink-0" />
          <span className="ml-3 truncate flex-1">{label}</span>
          {hotkey && (
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono shrink-0 ml-2 group-hover:opacity-100 opacity-60">
              {hotkey.replace('Alt+', '⎇')}
            </span>
          )}
        </>
      )}
    </NavLink>
  );
}

export default function Sidebar({ onClose }) {
  const { theme, setTheme } = useTheme();

  return (
    <aside className="flex flex-col h-full w-60 bg-[#F8FAFC] dark:bg-[#0F172A] border-r border-slate-200 dark:border-slate-800 transition-colors">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-4 h-14 shrink-0">
        <div className="flex items-center justify-center h-8 w-8 rounded-md bg-blue-600 text-white">
          <I.Zap size={18} stroke={2.25} />
        </div>
        <div className="font-semibold text-slate-900 dark:text-slate-100 text-[15px] leading-tight">
          Energy Forecast UA
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-auto lg:hidden p-1 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
            aria-label="Закрити меню"
          >
            <I.X size={18} />
          </button>
        )}
      </div>

      {/* Nav groups */}
      <nav className="flex-1 overflow-y-auto px-3 pt-1 pb-2">
        {NAV_GROUPS.map((group, gi) => (
          <div key={group.title}>
            {gi > 0 && <div className="my-3 border-t border-slate-200 dark:border-slate-800" />}
            <div className="px-3 pt-2 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {group.title}
            </div>
            <div className="flex flex-col gap-0.5">
              {group.items.map((item) => (
                <NavItem
                  key={item.to}
                  to={item.to}
                  label={item.label}
                  icon={item.icon}
                  hotkey={item.hotkey}
                  tip={item.tip}
                  onClick={onClose}
                />
              ))}
            </div>
          </div>
        ))}

        {/* Theme toggle */}
        <div className="my-3 border-t border-slate-200 dark:border-slate-800" />
        <div className="flex items-center justify-between px-3 py-2 rounded-md text-sm text-slate-600 dark:text-slate-300">
          <div className="flex items-center gap-3">
            {theme === 'dark' ? <I.Moon size={18} /> : <I.Sun size={18} />}
            <span>Тема</span>
          </div>
          <Switch
            checked={theme === 'dark'}
            onChange={(v) => setTheme(v ? 'dark' : 'light')}
            ariaLabel="Перемкнути тему"
          />
        </div>
      </nav>

      {/* Status footer */}
      <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-60 animate-ping" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
        </span>
        <span className="text-xs text-slate-500 dark:text-slate-400">Модель активна</span>
      </div>
    </aside>
  );
}
