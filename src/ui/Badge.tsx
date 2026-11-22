interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md';
  dot?: boolean;
  className?: string;
}

const variantClasses: Record<string, string> = {
  default: 'bg-neutral-100 text-neutral-700',
  success: 'bg-success-50 text-success-700',
  warning: 'bg-warning-50 text-warning-700',
  error: 'bg-error-50 text-error-700',
  info: 'bg-info-50 text-info-700',
};

const sizeClasses: Record<string, string> = {
  sm: 'px-1.5 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs',
};

export function Badge({ children, variant = 'default', size = 'md', dot = false, className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1 font-medium rounded-full ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}>
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full ${
          variant === 'success' ? 'bg-success-500' :
          variant === 'warning' ? 'bg-warning-500' :
          variant === 'error' ? 'bg-error-500' :
          variant === 'info' ? 'bg-info-500' : 'bg-neutral-500'
        }`} />
      )}
      {children}
    </span>
  );
}
