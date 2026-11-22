import { FolderOpen } from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({ icon, title, description, action, className = '' }: EmptyStateProps) {
  return (
    <div className={`text-center py-12 px-6 ${className}`}>
      {icon && <div className="mx-auto mb-4 text-neutral-400">{icon}</div>}
      {!icon && <div className="mx-auto mb-4 text-neutral-400"><FolderOpen className="w-12 h-12 mx-auto" /></div>}
      <h3 className="text-lg font-medium text-neutral-700 mb-1">{title}</h3>
      {description && <p className="text-sm text-neutral-500 mb-6 max-w-sm mx-auto">{description}</p>}
      {action && (
        <button onClick={action.onClick} className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors">
          {action.label}
        </button>
      )}
    </div>
  );
}
