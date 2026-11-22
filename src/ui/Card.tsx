interface CardProps {
  children: React.ReactNode;
  className?: string;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  onClick?: () => void;
}

const paddingClasses: Record<string, string> = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export function Card({ children, className = '', header, footer, padding = 'md', hover = false, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`bg-white border border-neutral-200 rounded-xl ${hover ? 'cursor-pointer hover:shadow-md hover:border-neutral-300 transition-all duration-200' : 'shadow-xs'} ${className}`}
    >
      {header && <div className="px-6 py-4 border-b border-neutral-100">{header}</div>}
      <div className={padding !== 'none' ? paddingClasses[padding] : ''}>{children}</div>
      {footer && <div className="px-6 py-4 border-t border-neutral-100 bg-neutral-50 rounded-b-xl">{footer}</div>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  icon,
  trend,
  className = '',
}: {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: { value: string; positive: boolean };
  className?: string;
}) {
  return (
    <div className={`bg-white border border-neutral-200 rounded-xl p-5 shadow-xs ${className}`}>
      <div className="flex items-center justify-between mb-3">
        {icon && <div className="p-2 bg-primary-50 rounded-lg">{icon}</div>}
        {trend && (
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${trend.positive ? 'bg-success-50 text-success-700' : 'bg-error-50 text-error-700'}`}>
            {trend.positive ? '↑' : '↓'} {trend.value}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-neutral-800">{value}</p>
      <p className="text-neutral-500 text-sm mt-1">{label}</p>
    </div>
  );
}
