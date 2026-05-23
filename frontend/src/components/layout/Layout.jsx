import { useState } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import Sidebar from './Sidebar';
import ToastStack from './ToastStack';
import * as I from '../ui/Icons';

// Маппінг маршрутів на хлібні крихти
const BREADCRUMBS = {
  '/':                    [{ label: 'Dashboard', to: '/' }],
  '/forecast':            [{ label: 'Прогноз', to: '/forecast' }],
  '/scenario-analysis':   [{ label: 'Сценарний аналіз', to: '/scenario-analysis' }],
  '/scenarios':           [{ label: 'Мої сценарії', to: '/scenarios' }],
  '/compare':             [{ label: 'Порівняння моделей', to: '/compare' }],
  '/interpretation':      [{ label: 'Інтерпретація', to: '/interpretation' }],
  '/history':             [{ label: 'Історія прогнозів', to: '/history' }],
  '/settings':            [{ label: 'Налаштування', to: '/settings' }],
};

function Breadcrumbs() {
  const { pathname } = useLocation();
  const crumbs = BREADCRUMBS[pathname];
  if (!crumbs || crumbs.length === 0) return null;

  const isLast = (i) => i === crumbs.length - 1;

  return (
    <nav aria-label="Хлібні крихти" className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 mb-3">
      <Link to="/" className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
        Головна
      </Link>
      {crumbs.map((crumb, i) => (
        <span key={i} className="flex items-center gap-1.5">
          <I.ChevronRight size={12} />
          <Link
            to={crumb.to}
            className={isLast(i)
              ? 'text-slate-700 dark:text-slate-300 font-medium pointer-events-none'
              : 'hover:text-slate-600 dark:hover:text-slate-300 transition-colors'
            }
          >
            {crumb.label}
          </Link>
        </span>
      ))}
    </nav>
  );
}

export default function Layout() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#020617] text-slate-900 dark:text-slate-100 transition-colors">
      {/* Mobile top bar */}
      <div className="lg:hidden sticky top-0 z-20 flex items-center justify-between h-14 px-4 bg-white dark:bg-[#0F172A] border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setMobileNavOpen(true)}
          className="p-1.5 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          aria-label="Відкрити меню"
        >
          <I.Menu size={20} />
        </button>
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center h-7 w-7 rounded-md bg-blue-600 text-white">
            <I.Zap size={15} stroke={2.25} />
          </div>
          <span className="font-semibold text-sm">Energy Forecast UA</span>
        </div>
        <div className="w-8" />
      </div>

      <div className="flex">
        {/* Desktop sidebar */}
        <div className="hidden lg:block fixed inset-y-0 left-0 w-60 z-10">
          <Sidebar />
        </div>

        {/* Mobile sidebar drawer */}
        {mobileNavOpen && (
          <div className="lg:hidden fixed inset-0 z-30">
            <div
              className="absolute inset-0 bg-slate-900/50"
              onClick={() => setMobileNavOpen(false)}
              aria-hidden="true"
            />
            <div className="absolute inset-y-0 left-0 w-60 shadow-xl animate-slide-in-left">
              <Sidebar onClose={() => setMobileNavOpen(false)} />
            </div>
          </div>
        )}

        {/* Main content */}
        <main className="flex-1 lg:ml-60 min-w-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
            <Breadcrumbs />
            <Outlet />
          </div>
        </main>
      </div>

      <ToastStack />
    </div>
  );
}
