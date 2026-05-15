// UI primitives: Button, Card, Badge, Tabs, Skeleton, Modal, InfoBanner,
// SectionHeader, Input, Select, Textarea, Slider, Switch, Checkbox,
// ProgressBar, DeltaChip, Spinner, Label.

import { useEffect } from 'react';
import * as I from './Icons';
import { cx, fmtDecimal, NBSP } from '../../lib/utils';

// ====================== Button ======================
const BTN_BASE =
  'inline-flex items-center justify-center gap-2 font-medium rounded-md transition-colors ' +
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 ' +
  'focus-visible:ring-blue-500 dark:focus-visible:ring-offset-slate-900 ' +
  'disabled:opacity-50 disabled:cursor-not-allowed';

const BTN_VARIANTS = {
  primary:
    'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-sm ' +
    'disabled:bg-blue-300 dark:disabled:bg-blue-900/60',
  secondary:
    'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 ' +
    'dark:bg-slate-900 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800',
  ghost:
    'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
  subtle:
    'bg-slate-100 text-slate-700 hover:bg-slate-200 ' +
    'dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700',
  danger:
    'text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 ' +
    'hover:bg-red-50 dark:hover:bg-red-900/20',
  dangerSolid:
    'bg-red-600 hover:bg-red-700 text-white shadow-sm',
};

const BTN_SIZES = {
  sm: 'px-2.5 py-1 text-xs h-7',
  md: 'px-3 py-1.5 text-sm h-9',
  lg: 'px-4 py-2 text-sm h-10',
  icon: 'h-8 w-8 p-0',
};

export function Button({
  variant = 'primary', size = 'md',
  children, className = '',
  leftIcon, icon, iconRight, rightIcon,
  loading, disabled,
  ...rest
}) {
  const left = leftIcon ?? icon;
  const right = rightIcon ?? iconRight;
  return (
    <button
      type="button"
      disabled={disabled || loading}
      className={cx(BTN_BASE, BTN_VARIANTS[variant] || BTN_VARIANTS.primary, BTN_SIZES[size] || BTN_SIZES.md, className)}
      {...rest}
    >
      {loading ? <Spinner size={size === 'lg' ? 16 : 14} /> : left}
      {children}
      {!loading && right ? right : null}
    </button>
  );
}

// ====================== Card ======================
export function Card({
  children, className = '', hover = false, padding = '',
  as: Tag = 'div', ...rest
}) {
  return (
    <Tag
      className={cx(
        'rounded-lg border bg-white border-slate-200',
        'dark:bg-slate-800 dark:border-slate-700',
        hover && 'transition-shadow hover:shadow-md',
        padding,
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}

export function CardHeader({ children, className = '' }) {
  return <div className={cx('px-5 pt-5 pb-3', className)}>{children}</div>;
}

export function CardBody({ children, className = '' }) {
  return <div className={cx('px-5 pb-5', className)}>{children}</div>;
}

export function CardTitle({ children, className = '' }) {
  return (
    <h3 className={cx('text-base font-semibold text-slate-900 dark:text-slate-100', className)}>
      {children}
    </h3>
  );
}

// ====================== Badge ======================
const BADGE_TONES = {
  slate:  'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200 ring-slate-200 dark:ring-slate-700',
  gray:   'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 ring-slate-200 dark:ring-slate-700',
  blue:   'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 ring-blue-200 dark:ring-blue-900/40',
  green:  'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 ring-green-200 dark:ring-green-900/40',
  yellow: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 ring-amber-200 dark:ring-amber-900/40',
  orange: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 ring-orange-200 dark:ring-orange-900/40',
  red:    'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 ring-red-200 dark:ring-red-900/40',
  purple: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300 ring-violet-200 dark:ring-violet-900/40',
};
const BADGE_SIZES = {
  xs: 'text-[10px] px-1.5 py-0.5',
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-1',
};

export function Badge({ tone, color, size = 'sm', children, className = '' }) {
  const t = tone || color || 'slate';
  return (
    <span className={cx(
      'inline-flex items-center rounded-md font-medium ring-1 ring-inset',
      BADGE_TONES[t] || BADGE_TONES.slate,
      BADGE_SIZES[size] || BADGE_SIZES.sm,
      className,
    )}>
      {children}
    </span>
  );
}

// ====================== Tabs ======================
export function Tabs({ items, value, onChange, sticky = false, className = '' }) {
  return (
    <div
      className={cx(
        'border-b border-slate-200 dark:border-slate-800',
        sticky && 'sticky top-0 z-20 bg-slate-50/80 dark:bg-slate-950/70 backdrop-blur',
        className,
      )}
    >
      <div className="flex gap-1 -mb-px">
        {items.map((it) => {
          const active = it.value === value;
          return (
            <button
              key={it.value}
              onClick={() => onChange(it.value)}
              className={cx(
                'relative px-3 py-2.5 text-sm font-medium border-b-2 transition-colors',
                active
                  ? 'text-blue-600 border-blue-600 dark:text-blue-400 dark:border-blue-400'
                  : 'text-slate-600 border-transparent hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100',
              )}
            >
              {it.label}
              {it.badge != null && (
                <span className="ml-1.5 align-middle">
                  <Badge tone="slate" size="xs">{it.badge}</Badge>
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ====================== Skeleton ======================
export function Skeleton({ w, h, rounded = 'rounded-md', className = '' }) {
  const style = {};
  if (w) style.width = typeof w === 'number' ? `${w}px` : w;
  if (h) style.height = typeof h === 'number' ? `${h}px` : h;
  return <div className={cx('skel', rounded, className)} style={style} />;
}

// ====================== Modal ======================
const MODAL_SIZES = {
  sm: 'max-w-md',
  md: 'max-w-xl',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};
export function Modal({ open, onClose, title, children, footer, size = 'md', maxWidth }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  const widthClass = maxWidth || MODAL_SIZES[size] || MODAL_SIZES.md;
  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-slate-900/50 dark:bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className={cx(
          'w-full rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl animate-scale-in',
          widthClass,
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-slate-800">
          <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            aria-label="Закрити"
          >
            <I.X size={16} />
          </button>
        </div>
        <div className="px-5 py-4 text-sm text-slate-700 dark:text-slate-300">{children}</div>
        {footer && (
          <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

// ====================== InfoBanner ======================
const BANNER_TONES = {
  blue:  'border-blue-500 bg-blue-50/60 dark:bg-blue-950/40 dark:border-blue-400 text-blue-900 dark:text-blue-200',
  amber: 'border-amber-500 bg-amber-50/60 dark:bg-amber-950/40 dark:border-amber-400 text-amber-900 dark:text-amber-200',
  green: 'border-green-500 bg-green-50/60 dark:bg-green-950/40 dark:border-green-400 text-green-900 dark:text-green-200',
  red:   'border-red-500 bg-red-50/60 dark:bg-red-950/40 dark:border-red-400 text-red-900 dark:text-red-200',
};
export function InfoBanner({ tone = 'blue', icon = 'Info', children, className = '' }) {
  return (
    <div className={cx(
      'flex gap-3 rounded-md border-l-4 px-4 py-3 text-sm leading-relaxed',
      BANNER_TONES[tone] || BANNER_TONES.blue,
      className,
    )}>
      <I.Icon name={icon} size={18} className="mt-0.5 shrink-0 opacity-80" />
      <div className="flex-1">{children}</div>
    </div>
  );
}

// ====================== SectionHeader ======================
export function SectionHeader({ title, subtitle, right, className = '' }) {
  return (
    <div className={cx('flex items-start justify-between gap-4 flex-wrap', className)}>
      <div className="min-w-0">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100 tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
      {right && <div className="shrink-0 flex items-center gap-2">{right}</div>}
    </div>
  );
}

// ====================== Section Divider ======================
export function SectionDivider({ children, className = '' }) {
  return (
    <div className={cx('pt-4 mt-4 border-t border-slate-200 dark:border-slate-700', className)}>
      {children && (
        <h4 className="text-xs uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400 mb-3">
          {children}
        </h4>
      )}
    </div>
  );
}

// ====================== Label ======================
export function Label({ children, className = '', htmlFor }) {
  return (
    <label
      htmlFor={htmlFor}
      className={cx('text-sm font-medium text-slate-700 dark:text-slate-300', className)}
    >
      {children}
    </label>
  );
}

// ====================== Input ======================
export function Input({ leftIcon, icon, className = '', ...rest }) {
  const left = leftIcon ?? icon;
  return (
    <div className="relative">
      {left && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
          {left}
        </span>
      )}
      <input
        className={cx(
          'h-9 w-full rounded-md border bg-white text-sm text-slate-900 placeholder:text-slate-400',
          'dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500',
          'border-slate-300 dark:border-slate-700',
          'hover:border-slate-400 dark:hover:border-slate-600',
          'focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500',
          left ? 'pl-9 pr-3' : 'px-3',
          className,
        )}
        {...rest}
      />
    </div>
  );
}

// ====================== Textarea ======================
export function Textarea({ className = '', ...rest }) {
  return (
    <textarea
      className={cx(
        'w-full text-sm rounded-md px-3 py-2 resize-none',
        'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100',
        'border border-slate-300 dark:border-slate-700',
        'placeholder:text-slate-400 dark:placeholder:text-slate-500',
        'focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20',
        className,
      )}
      {...rest}
    />
  );
}

// ====================== Select ======================
export function Select({ value, onChange, options, children, className = '', ...rest }) {
  const handle = (e) => {
    if (!onChange) return;
    if (options) onChange(e.target.value);
    else onChange(e);
  };
  return (
    <div className={cx('relative', className)}>
      <select
        value={value}
        onChange={handle}
        className={cx(
          'h-9 w-full appearance-none rounded-md text-sm pl-3 pr-9 cursor-pointer',
          'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100',
          'border border-slate-300 dark:border-slate-700',
          'hover:border-slate-400 dark:hover:border-slate-600',
          'focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500',
        )}
        {...rest}
      >
        {options
          ? options.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))
          : children}
      </select>
      <I.ChevronDown
        size={14}
        className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400"
      />
    </div>
  );
}

// ====================== Slider ======================
export function Slider({ value, onChange, min, max, step = 1, className = '', label, format, unit }) {
  return (
    <div className="w-full">
      {(label || format != null) && (
        <div className="flex items-center justify-between mb-1.5">
          {label && <Label>{label}</Label>}
          {format && (
            <span className="text-sm font-mono tabular-nums text-slate-700 dark:text-slate-300">
              {format(value)}{unit ? NBSP + unit : ''}
            </span>
          )}
        </div>
      )}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={cx('ef-range', className)}
      />
    </div>
  );
}

// ====================== Switch ======================
export function Switch({ checked, onChange, label, id, disabled = false }) {
  return (
    <label className={cx(
      'inline-flex items-center gap-2 select-none',
      disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
    )}>
      <span
        role="switch"
        aria-checked={checked}
        tabIndex={disabled ? -1 : 0}
        onClick={() => !disabled && onChange(!checked)}
        onKeyDown={(e) => {
          if (disabled) return;
          if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            onChange(!checked);
          }
        }}
        className={cx(
          'relative inline-flex h-5 w-9 items-center rounded-full transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
          'dark:focus-visible:ring-offset-slate-900',
          checked ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600',
        )}
      >
        <span
          className={cx(
            'inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform',
            checked ? 'translate-x-[18px]' : 'translate-x-0.5',
          )}
        />
      </span>
      {label && (
        <span className="text-sm text-slate-700 dark:text-slate-300">{label}</span>
      )}
    </label>
  );
}

// ====================== Checkbox ======================
export function Checkbox({ checked, onChange, label, id, className = '' }) {
  return (
    <label className={cx('flex items-center gap-2.5 cursor-pointer select-none w-fit', className)}>
      <input
        type="checkbox"
        className="ef-check"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="ef-check-box" />
      {label && (
        <span className="text-sm text-slate-700 dark:text-slate-300">{label}</span>
      )}
    </label>
  );
}

// ====================== ProgressBar ======================
export function ProgressBar({ value, max = 1, height = 6, className = '', colorMode = 'weight', tone }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  let color = 'bg-slate-400 dark:bg-slate-600';
  if (tone) {
    const map = {
      green: 'bg-green-500',
      yellow: 'bg-amber-500',
      red: 'bg-red-500',
      slate: 'bg-slate-400 dark:bg-slate-600',
      blue: 'bg-blue-500',
      orange: 'bg-orange-500',
    };
    color = map[tone] || color;
  } else if (colorMode === 'weight') {
    if (value / max >= 0.7) color = 'bg-green-500';
    else if (value / max >= 0.4) color = 'bg-amber-500';
    else color = 'bg-slate-400 dark:bg-slate-600';
  }
  return (
    <div
      className={cx(
        'relative w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden',
        className,
      )}
      style={{ height }}
    >
      <div
        className={cx('h-full rounded-full transition-all duration-500', color)}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// ====================== DeltaChip ======================
export function DeltaChip({ value, unit, neutral = false }) {
  const v = Number(value);
  let cls = 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300';
  if (!neutral && v > 0) {
    cls = 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300';
  } else if (!neutral && v < 0) {
    cls = 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
  }
  const sign = v > 0 ? '+' : v < 0 ? '-' : '';
  const num = fmtDecimal(Math.abs(v), Number.isInteger(v) ? 0 : 1);
  return (
    <span className={cx(
      'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium font-mono tabular-nums',
      cls,
    )}>
      {sign}{num}{unit ? NBSP + unit : ''}
    </span>
  );
}

// ====================== Spinner ======================
export function Spinner({ size = 14, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={cx('animate-spin', className)}
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path
        d="M22 12a10 10 0 0 1-10 10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ====================== StatusDot ======================
export function StatusDot({ tone = 'green', pulse = false, className = '' }) {
  const map = {
    green: 'bg-green-500',
    red: 'bg-red-500',
    amber: 'bg-amber-500',
    yellow: 'bg-yellow-500',
    blue: 'bg-blue-500',
    slate: 'bg-slate-400',
  };
  const color = map[tone] || map.slate;
  return (
    <span className={cx('relative flex h-2 w-2', className)}>
      {pulse && <span className={cx('absolute inline-flex h-full w-full rounded-full opacity-60 animate-ping', color)} />}
      <span className={cx('relative inline-flex rounded-full h-2 w-2', color)} />
    </span>
  );
}

// ====================== IconButton ======================
export function IconButton({ icon, label, onClick, variant = 'ghost', size = 'icon', className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cx(BTN_BASE, BTN_VARIANTS[variant] || BTN_VARIANTS.ghost, BTN_SIZES[size] || BTN_SIZES.icon, className)}
    >
      {icon}
    </button>
  );
}
