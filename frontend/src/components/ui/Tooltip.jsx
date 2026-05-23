import { useState, useRef, useEffect } from 'react';

/**
 * Простий Tooltip без зовнішніх залежностей.
 * Використання:
 *   <Tooltip content="MAPE — середня помилка">
 *     <span>MAPE</span>
 *   </Tooltip>
 *
 * Props:
 *   - content: текст підказки (string або JSX)
 *   - position: 'top' | 'bottom' | 'left' | 'right' (default 'top')
 *   - delay: затримка перед показом (default 300мс)
 */
export default function Tooltip({ children, content, position = 'top', delay = 300 }) {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef(null);

  function show() {
    timerRef.current = setTimeout(() => setVisible(true), delay);
  }
  function hide() {
    if (timerRef.current) clearTimeout(timerRef.current);
    setVisible(false);
  }

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const positionClass = {
    top:    'bottom-full left-1/2 -translate-x-1/2 mb-1.5',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-1.5',
    left:   'right-full top-1/2 -translate-y-1/2 mr-1.5',
    right:  'left-full top-1/2 -translate-y-1/2 ml-1.5',
  }[position];

  return (
    <span
      className="relative inline-flex items-center"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      {visible && (
        <span
          role="tooltip"
          className={`absolute z-50 px-2.5 py-1.5 text-xs leading-snug rounded-md shadow-lg
            bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900
            whitespace-nowrap max-w-xs pointer-events-none ${positionClass}`}
          style={{ whiteSpace: 'normal', minWidth: '120px', maxWidth: '280px' }}
        >
          {content}
        </span>
      )}
    </span>
  );
}
