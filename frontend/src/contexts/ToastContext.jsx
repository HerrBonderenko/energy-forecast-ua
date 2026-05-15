import { createContext, useContext, useState, useCallback, useRef } from 'react';

const ToastContext = createContext(null);

// Toast shape: { id, type, title, description?, duration? }
// type ∈ 'success' | 'error' | 'warning' | 'info'

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Accepts string OR object — both styles from artifacts
  const showToast = useCallback((arg) => {
    idRef.current += 1;
    const id = idRef.current;
    const toast =
      typeof arg === 'string'
        ? { id, type: 'info', title: arg }
        : { id, type: 'info', ...arg };
    setToasts((prev) => [...prev, toast]);
    return id;
  }, []);

  // Aliases for the 3 different naming conventions in artifacts
  const push = showToast;
  const remove = dismissToast;

  return (
    <ToastContext.Provider value={{ toasts, showToast, dismissToast, push, remove }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
