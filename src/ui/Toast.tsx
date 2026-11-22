import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

const iconMap: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle className="w-5 h-5 text-success-600" />,
  error: <AlertCircle className="w-5 h-5 text-error-600" />,
  warning: <AlertTriangle className="w-5 h-5 text-warning-600" />,
  info: <Info className="w-5 h-5 text-info-600" />,
};

const borderMap: Record<ToastType, string> = {
  success: 'border-success-200 bg-success-50',
  error: 'border-error-200 bg-error-50',
  warning: 'border-warning-200 bg-warning-50',
  info: 'border-info-200 bg-info-50',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = crypto.randomUUID();
    setToasts(prev => [...prev, { ...toast, id }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const success = useCallback((title: string, message?: string) => addToast({ type: 'success', title, message }), [addToast]);
  const error = useCallback((title: string, message?: string) => addToast({ type: 'error', title, message }), [addToast]);
  const warning = useCallback((title: string, message?: string) => addToast({ type: 'warning', title, message }), [addToast]);
  const info = useCallback((title: string, message?: string) => addToast({ type: 'info', title, message }), [addToast]);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, success, error, warning, info }}>
      {children}
      <div className="fixed top-4 right-4 z-[100] space-y-2 w-80">
        {toasts.map(toast => (
          <div key={toast.id} className={`flex items-start gap-3 p-4 rounded-xl border shadow-md animate-slide-down ${borderMap[toast.type]}`}>
            <div className="shrink-0 mt-0.5">{iconMap[toast.type]}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-neutral-800">{toast.title}</p>
              {toast.message && <p className="text-xs text-neutral-600 mt-0.5">{toast.message}</p>}
            </div>
            <button onClick={() => removeToast(toast.id)} className="shrink-0 p-1 hover:bg-white/50 rounded transition-colors">
              <X className="w-4 h-4 text-neutral-400" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
