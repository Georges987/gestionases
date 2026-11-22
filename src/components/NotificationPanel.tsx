import { useEffect, useRef } from 'react';
import { Package, Heart, Calendar, Cake, Bell } from 'lucide-react';
import type { Notification } from '../types';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Package,
  Heart,
  Calendar,
  Cake,
  Bell,
};

interface NotificationPanelProps {
  notifications: Notification[];
  totalCount: number;
  onNavigate: (module: Notification['module']) => void;
  onClose: () => void;
}

export function NotificationPanel({ notifications, totalCount, onNavigate, onClose }: NotificationPanelProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xl z-50 overflow-hidden"
    >
      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
          Notifications
        </h3>
        {totalCount > 0 && (
          <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full font-medium">
            {totalCount}
          </span>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="px-4 py-8 text-center">
          <Bell className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
          <p className="text-sm text-gray-400 dark:text-gray-500">Aucune notification</p>
        </div>
      ) : (
        <ul className="divide-y divide-gray-50 dark:divide-gray-700 max-h-80 overflow-y-auto">
          {notifications.map(notif => {
            const Icon = iconMap[notif.icon] || Bell;
            return (
              <li key={notif.id}>
                <button
                  onClick={() => {
                    onNavigate(notif.module);
                    onClose();
                  }}
                  className="w-full px-4 py-3 flex items-start gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left"
                >
                  <div className={`mt-0.5 ${notif.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                        {notif.title}
                      </p>
                      <span className="shrink-0 text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-1.5 py-0.5 rounded font-medium">
                        {notif.count}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                      {notif.message}
                    </p>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
