import { useEffect } from 'react';
import { useToast } from '../../contexts/ToastContext';
import { Icon } from '../ui/Icons';
import { cx } from '../../lib/utils';

const TONE_MAP = {
  success: { border: 'border-l-emerald-500', icon: 'CheckCircle',   iconColor: 'text-emerald-500' },
  error:   { border: 'border-l-red-500',     icon: 'AlertCircle',   iconColor: 'text-red-500' },
  warning: { border: 'border-l-amber-500',   icon: 'AlertTriangle', iconColor: 'text-amber-500' },
  info:    { border: 'border-l-blue-500',    icon: 'Info',          iconColor: 'text-blue-500' },
};

function Toast({ toast, onDismiss }) {
  useEffect(() => {
    const t = setTimeout(() => onDismiss(toast.id), toast.duration || 3500);
    return () => clearTimeout(t);
  }, [toast.id, toast.duration, onDismiss]);

  const t = TONE_MAP[toast.type] || TONE_MAP.info;

  return (
    <div
      role="status"
      className={cx(
        'pointer-events-auto w-80 px-3 py-2.5 rounded-md shadow-lg animate-toast-in',
        'flex items-start gap-2',
        'bg-white dark:bg-slate-800',
        'border border-slate-200 dark:border-slate-700',
        'border-l-4',
        t.border,
      )}
    >
      <Icon name={t.icon} size={16} className={cx('mt-0.5 shrink-0', t.iconColor)} />
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
          {toast.title}
        </div>
        {toast.description && (
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {toast.description}
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 shrink-0 p-0.5"
        aria-label="Закрити сповіщення"
      >
        <Icon name="X" size={14} />
      </button>
    </div>
  );
}

export default function ToastStack() {
  const { toasts, dismissToast } = useToast();
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <Toast key={t.id} toast={t} onDismiss={dismissToast} />
      ))}
    </div>
  );
}
