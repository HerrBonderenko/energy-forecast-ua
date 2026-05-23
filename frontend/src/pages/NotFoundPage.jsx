import { Link } from 'react-router-dom';
import * as I from '../components/ui/Icons';

export default function NotFoundPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        {/* Велика 404 з блискавкою замість 0 */}
        <div className="flex items-center justify-center gap-1 mb-6 text-blue-600 dark:text-blue-400">
          <span className="text-7xl font-bold tabular-nums">4</span>
          <div className="w-20 h-20 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <I.Zap size={48} className="text-blue-600 dark:text-blue-400" />
          </div>
          <span className="text-7xl font-bold tabular-nums">4</span>
        </div>

        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
          Сторінку не знайдено
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          Можливо, ви ввели неправильну адресу, або сторінка була видалена.
          Перевірте URL або поверніться на головну.
        </p>

        <div className="flex flex-wrap gap-2 justify-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 h-10 text-sm font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            <I.Home size={16} />
            На головну
          </Link>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 px-4 h-10 text-sm font-medium rounded-md text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <I.ChevronLeft size={16} />
            Назад
          </button>
        </div>
      </div>
    </div>
  );
}
