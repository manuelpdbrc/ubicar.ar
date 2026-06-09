import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from 'react';

// ---- Types ----
type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
  createdAt: number;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const MAX_TOASTS = 3;

const ICONS: Record<ToastType, string> = {
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: 'ℹ',
};

const TYPE_CLASSES: Record<ToastType, string> = {
  success: 'toast--success',
  error: 'toast--error',
  warning: 'toast--warning',
  info: 'toast--info',
};

// ---- Provider ----
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = 'info', duration = 4000) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const toast: Toast = { id, message, type, duration, createdAt: Date.now() };

      setToasts((prev) => {
        const updated = [...prev, toast];
        // Remove oldest if exceeding max
        if (updated.length > MAX_TOASTS) {
          const removed = updated[0];
          if (removed) {
            const timer = timersRef.current.get(removed.id);
            if (timer) {
              clearTimeout(timer);
              timersRef.current.delete(removed.id);
            }
          }
          return updated.slice(1);
        }
        return updated;
      });

      // Auto-remove after duration
      const timer = setTimeout(() => {
        removeToast(id);
      }, duration);
      timersRef.current.set(id, timer);
    },
    [removeToast]
  );

  // Cleanup timers on unmount
  useEffect(() => {
    const currentTimers = timersRef.current;
    return () => {
      currentTimers.forEach((timer) => clearTimeout(timer));
      currentTimers.clear();
    };
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Toast Container */}
      {toasts.length > 0 && (
        <div className="toast-container" role="region" aria-label="Notificaciones" aria-live="polite">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`toast ${TYPE_CLASSES[toast.type]}`}
              role="alert"
            >
              <span className="toast__icon">{ICONS[toast.type]}</span>
              <p className="toast__message">{toast.message}</p>
              <button
                className="toast__dismiss"
                onClick={() => removeToast(toast.id)}
                aria-label="Cerrar notificación"
              >
                ✕
              </button>
              <div
                className="toast__progress"
                style={{ animationDuration: `${toast.duration}ms` }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Toast Styles (scoped) */}
      <style>{`
        .toast-container {
          position: fixed;
          bottom: calc(1rem + var(--safe-area-bottom, 0px));
          right: 1rem;
          z-index: var(--z-toast);
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          max-width: 380px;
          width: calc(100% - 2rem);
          pointer-events: none;
        }

        @media (max-width: 480px) {
          .toast-container {
            right: 0;
            left: 0;
            bottom: calc(0.5rem + var(--safe-area-bottom, 0px));
            margin: 0 auto;
            padding: 0 0.75rem;
            max-width: 100%;
          }
        }

        .toast {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.875rem 1rem;
          border-radius: var(--radius-md);
          background-color: var(--color-surface);
          box-shadow: var(--shadow-lg);
          border: 1px solid var(--color-border);
          animation: toastIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) both;
          pointer-events: auto;
          position: relative;
          overflow: hidden;
        }

        .toast--success { border-left: 3px solid var(--color-success); }
        .toast--error { border-left: 3px solid var(--color-error); }
        .toast--warning { border-left: 3px solid var(--color-warning); }
        .toast--info { border-left: 3px solid var(--color-info); }

        .toast__icon {
          flex-shrink: 0;
          width: 1.5rem;
          height: 1.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: var(--radius-full);
          font-size: 0.75rem;
          font-weight: 700;
        }

        .toast--success .toast__icon { background: var(--color-success-light); color: #065F46; }
        .toast--error .toast__icon { background: var(--color-error-light); color: #991B1B; }
        .toast--warning .toast__icon { background: var(--color-warning-light); color: #92400E; }
        .toast--info .toast__icon { background: var(--color-info-light); color: #1E40AF; }

        .toast__message {
          flex: 1;
          font-size: 0.875rem;
          font-weight: 500;
          line-height: 1.4;
          color: var(--color-text);
        }

        .toast__dismiss {
          flex-shrink: 0;
          width: 1.5rem;
          height: 1.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: var(--radius-sm);
          font-size: 0.625rem;
          color: var(--color-text-tertiary);
          cursor: pointer;
          transition: all var(--transition-fast);
          border: none;
          background: none;
        }

        .toast__dismiss:hover {
          background-color: var(--color-bg-secondary);
          color: var(--color-text);
        }

        .toast__progress {
          position: absolute;
          bottom: 0;
          left: 0;
          height: 2px;
          border-radius: 0 0 0 var(--radius-md);
          animation: progressShrink linear forwards;
        }

        .toast--success .toast__progress { background: var(--color-success); }
        .toast--error .toast__progress { background: var(--color-error); }
        .toast--warning .toast__progress { background: var(--color-warning); }
        .toast--info .toast__progress { background: var(--color-info); }
      `}</style>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast debe usarse dentro de ToastProvider');
  }
  return context;
}
