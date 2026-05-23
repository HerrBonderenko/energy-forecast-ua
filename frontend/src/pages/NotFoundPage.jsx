import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        {/* 404 */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <span className="text-8xl font-bold text-blue-600 dark:text-blue-400 tabular-nums">4</span>
          <div className="w-20 h-20 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600 dark:text-blue-400">
              <path d="M13 3L4 14h6l-1 7 9-11h-6l1-7z"/>
            </svg>
          </div>
          <span className="text-8xl font-bold text-blue-600 dark:text-blue-400 tabular-nums">4</span>
        </div>

        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
          Сторінку не знайдено
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          Можливо, ви ввели неправильну адресу або сторінка була видалена.
        </p>

        <div className="flex flex-wrap gap-2 justify-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 h-10 text-sm font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            На головну
          </Link>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 px-4 h-10 text-sm font-medium rounded-md text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            ← Назад
          </button>
        </div>
      </div>
    </div>
  );
}
