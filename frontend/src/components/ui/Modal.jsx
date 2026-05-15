import { useEffect } from 'react';
import { cx } from '../../lib/utils';
import { IconButton } from './Button';
import * as I from './Icons';

// API:
//   <Modal isOpen onClose title size="md">
//     ...body...
//   </Modal>
// size: 'sm' | 'md' | 'lg' | 'xl' | 'full'
//
// На phone (<sm) автоматично fullscreen, на desktop — діалог.
export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  footer,
  closeOnEscape = true,
  closeOnBackdrop = true,
  hideClose = false,
  className = '',
}) {
  // Escape to close
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, closeOnEscape, onClose]);

  // Lock body scroll
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeCx = {
    sm: 'sm:max-w-md',
    md: 'sm:max-w-lg',
    lg: 'sm:max-w-2xl',
    xl: 'sm:max-w-4xl',
    full: 'sm:max-w-[calc(100vw-4rem)]',
  }[size] || 'sm:max-w-lg';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
      className="fixed inset-0 z-50 flex items-stretch sm:items-center justify-center animate-fade-in"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/60"
        onClick={() => closeOnBackdrop && onClose?.()}
        aria-hidden="true"
      />

      {/* Panel — на phone fullscreen, на desktop dialog */}
      <div
        className={cx(
          'relative z-10 flex flex-col w-full',
          'h-screen sm:h-auto sm:max-h-[90vh] sm:my-4',
          'sm:rounded-xl bg-white dark:bg-slate-900',
          'sm:border sm:border-slate-200 sm:dark:border-slate-800 sm:shadow-2xl',
          'animate-scale-in',
          sizeCx,
          className,
        )}
      >
        {/* Header */}
        {(title || !hideClose) && (
          <div className="flex items-start justify-between gap-3 px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
            <div className="min-w-0">
              {title && (
                <h2
                  id="modal-title"
                  className="text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-100 truncate"
                >
                  {title}
                </h2>
              )}
              {description && (
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>
              )}
            </div>
            {!hideClose && (
              <IconButton
                icon={I.X}
                label="Закрити"
                size="sm"
                variant="ghost"
                onClick={onClose}
              />
            )}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-2 flex-wrap px-4 sm:px-6 py-3 border-t border-slate-200 dark:border-slate-800 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
