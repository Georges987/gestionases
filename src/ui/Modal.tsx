import { forwardRef, useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnBackdrop?: boolean;
}

const sizeClasses: Record<string, string> = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-[calc(100vw-2rem)]',
};

export const Modal = forwardRef<HTMLDivElement, ModalProps>(
  ({ open, onClose, title, description, children, footer, size = 'md', closeOnBackdrop = true }) => {
    useEffect(() => {
      if (!open) return;
      const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
      return () => {
        document.removeEventListener('keydown', handleEsc);
        document.body.style.overflow = '';
      };
    }, [open, onClose]);

    if (!open) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeOnBackdrop ? onClose : undefined} />
        <div className={`relative bg-white rounded-2xl shadow-xl w-full ${sizeClasses[size]} animate-scale-in max-h-[90vh] flex flex-col`}>
          {(title || description) && (
            <div className="flex items-start justify-between p-6 pb-0">
              <div>
                {title && <h2 className="text-lg font-bold text-neutral-800">{title}</h2>}
                {description && <p className="text-sm text-neutral-500 mt-1">{description}</p>}
              </div>
              <button onClick={onClose} className="p-2 hover:bg-neutral-100 rounded-lg transition-colors shrink-0 -mt-2 -mr-2">
                <X className="w-5 h-5 text-neutral-500" />
              </button>
            </div>
          )}
          <div className="p-6 overflow-y-auto flex-1">{children}</div>
          {footer && <div className="p-6 pt-0 flex justify-end gap-3">{footer}</div>}
        </div>
      </div>
    );
  }
);

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  variant = 'danger',
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary';
}) {
  return (
    <Modal open={open} onClose={onClose} size="sm">
      <div className="text-center">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${variant === 'danger' ? 'bg-error-100' : 'bg-info-100'}`}>
          <svg className={`w-6 h-6 ${variant === 'danger' ? 'text-error-600' : 'text-info-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            {variant === 'danger' ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            )}
          </svg>
        </div>
        <h3 className="text-lg font-bold text-neutral-800 mb-2">{title}</h3>
        <p className="text-neutral-500 text-sm mb-6">{message}</p>
        <div className="flex gap-3 justify-center">
          <button onClick={onClose} className="px-6 py-2 border border-neutral-300 rounded-lg text-sm font-medium text-neutral-600 hover:bg-neutral-50 transition-colors">
            {cancelLabel}
          </button>
          <button onClick={() => { onConfirm(); onClose(); }} className={`px-6 py-2 rounded-lg text-sm font-medium text-white transition-colors ${variant === 'danger' ? 'bg-error-600 hover:bg-error-700' : 'bg-primary-600 hover:bg-primary-700'}`}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
