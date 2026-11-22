import { useState, useEffect } from 'react';
import { ClipboardList, Search, RefreshCw, Trash2 } from 'lucide-react';
import { apiCall } from '../api/client';
import toast from 'react-hot-toast';

interface AuditLog {
  id: number;
  user_id: string;
  action: string;
  details: string;
  timestamp: string;
}

export default function Logs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  async function loadLogs() {
    setLoading(true);
    try {
      const res = await apiCall('logs.php', { action: 'list' });
      setLogs((res as any).data || []);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erreur lors du chargement des logs');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadLogs(); }, []);

  const filteredLogs = logs.filter(log => 
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (log.details || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <ClipboardList className="w-5 h-5 text-blue-700 dark:text-blue-300" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-200">Journal d'Audit</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Historique détaillé des actions effectuées sur le système</p>
          </div>
        </div>
        <button onClick={loadLogs} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
          <RefreshCw className={`w-4 h-4 text-gray-600 dark:text-gray-400 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder="Rechercher une action..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-200"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Date & Heure</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Utilisateur</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Action</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Détails</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.map(log => (
              <tr key={log.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{// Formatage date simple
                  new Date(log.timestamp).toLocaleString('fr-FR')
                }</td>
                <td className="px-4 py-3 font-mono text-xs text-gray-600 dark:text-gray-400">{log.user_id}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium">
                    {log.action.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{log.details || '—'}</td>
              </tr>
            ))}
            {filteredLogs.length === 0 && (
              <tr><td colSpan={4} className="text-center py-8 text-gray-500 dark:text-gray-400">Aucun log trouvé</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
