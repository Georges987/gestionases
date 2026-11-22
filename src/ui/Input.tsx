import { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, leftIcon, rightIcon, className = '', id, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && <label htmlFor={id} className="block text-sm font-medium text-neutral-700">{label}</label>}
        <div className="relative">
          {leftIcon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">{leftIcon}</div>}
          <input
            ref={ref}
            id={id}
            className={`w-full border rounded-lg px-3 py-2 text-sm outline-none transition-colors duration-150 bg-white placeholder:text-neutral-400 ${leftIcon ? 'pl-10' : ''} ${rightIcon ? 'pr-10' : ''} ${error ? 'border-error-500 focus:border-error-500 focus:ring-2 focus:ring-error-500/20' : 'border-neutral-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20'} ${className}`}
            {...props}
          />
          {rightIcon && <div className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400">{rightIcon}</div>}
        </div>
        {error && <p className="text-xs text-error-600">{error}</p>}
      </div>
    );
  }
);

export function Textarea({ label, error, className = '', id, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string; error?: string }) {
  return (
    <div className="space-y-1.5">
      {label && <label htmlFor={id} className="block text-sm font-medium text-neutral-700">{label}</label>}
      <textarea
        id={id}
        className={`w-full border rounded-lg px-3 py-2 text-sm outline-none resize-y min-h-[80px] transition-colors duration-150 bg-white placeholder:text-neutral-400 ${error ? 'border-error-500 focus:border-error-500' : 'border-neutral-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20'} ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-error-600">{error}</p>}
    </div>
  );
}

export function Select({ label, error, className = '', id, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string; error?: string }) {
  return (
    <div className="space-y-1.5">
      {label && <label htmlFor={id} className="block text-sm font-medium text-neutral-700">{label}</label>}
      <select
        id={id}
        className={`w-full border rounded-lg px-3 py-2 text-sm outline-none transition-colors duration-150 bg-white ${error ? 'border-error-500 focus:border-error-500' : 'border-neutral-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20'} ${className}`}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-error-600">{error}</p>}
    </div>
  );
}
