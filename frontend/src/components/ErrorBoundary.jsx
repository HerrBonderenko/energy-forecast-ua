import { Component } from 'react';
import { Link } from 'react-router-dom';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          {/* Іконка */}
          <div className="flex items-center justify-center mb-6">
            <div className="w-20 h-20 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round"
                className="text-amber-600 dark:text-amber-400">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
          </div>

          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
            Щось пішло не так
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
            Виникла неочікувана помилка. Спробуйте оновити сторінку або повернутись на головну.
          </p>

          {/* Деталі помилки (тільки в dev) */}
          {this.state.error && (
            <details className="mb-4 text-left">
              <summary className="text-xs text-slate-400 cursor-pointer hover:text-slate-600 dark:hover:text-slate-300">
                Деталі помилки
              </summary>
              <pre className="mt-2 p-3 rounded-md bg-slate-100 dark:bg-slate-800 text-xs text-red-600 dark:text-red-400 overflow-auto max-h-32 text-left">
                {this.state.error.message}
              </pre>
            </details>
          )}

          <div className="flex flex-wrap gap-2 justify-center">
            <button
              onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload(); }}
              className="inline-flex items-center gap-2 px-4 h-10 text-sm font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              Оновити сторінку
            </button>
            <Link
              to="/"
              onClick={() => this.setState({ hasError: false, error: null })}
              className="inline-flex items-center gap-2 px-4 h-10 text-sm font-medium rounded-md text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              На головну
            </Link>
          </div>
        </div>
      </div>
    );
  }
}
