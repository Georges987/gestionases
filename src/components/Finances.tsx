import { useState, useMemo } from 'react';
import { Plus, Search, Edit2, Trash2, X, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { Transaction } from '../types';

const categories = ['Dons', 'Subventions', 'Dons entreprises', 'Matériaux', 'Personnel', 'Équipements', 'Formation', 'Transport', 'Autres'];

const empty: Omit<Transaction, 'id'> = {
  libelle: '', montant: 0, type: 'recette', categorie: 'Dons',
  date: new Date().toISOString().split('T')[0], projetId: '', validee: false,
};

export default function Finances() {
  const { data, addTransaction, updateTransaction, deleteTransaction } = useApp();
  const { isDark } = useTheme();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [form, setForm] = useState<Omit<Transaction, 'id'>>(empty);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const totalRecettes = useMemo(() => data.transactions.filter(t => t.type === 'recette').reduce((s, t) => s + t.montant, 0), [data.transactions]);
  const totalDepenses = useMemo(() => data.transactions.filter(t => t.type === 'depense').reduce((s, t) => s + t.montant, 0), [data.transactions]);
  const solde = totalRecettes - totalDepenses;

  const transactions = useMemo(() => {
    return data.transactions
      .filter(t => {
        const q = search.toLowerCase();
        const matchSearch = !q || t.libelle.toLowerCase().includes(q) || t.categorie.toLowerCase().includes(q);
        const matchType = !filterType || t.type === filterType;
        return matchSearch && matchType;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [data.transactions, search, filterType]);

  const chartData = useMemo(() => {
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû'];
    return months.map((m, i) => {
      const idx = i + 1;
      const rec = data.transactions.filter(t => t.type === 'recette' && new Date(t.date).getMonth() + 1 === idx).reduce((s, t) => s + t.montant, 0);
      const dep = data.transactions.filter(t => t.type === 'depense' && new Date(t.date).getMonth() + 1 === idx).reduce((s, t) => s + t.montant, 0);
      return { mois: m, Recettes: Math.round(rec / 1000), Dépenses: Math.round(dep / 1000) };
    });
  }, [data.transactions]);

  const projetsMap = useMemo(() => {
    const map = new Map<string, string>();
    data.projets.forEach(p => map.set(p.id, p.titre));
    return map;
  }, [data.projets]);

  function openAdd() { setEditing(null); setForm(empty); setShowModal(true); }
  function openEdit(t: Transaction) {
    setEditing(t);
    setForm({ libelle: t.libelle, montant: t.montant, type: t.type, categorie: t.categorie, date: t.date, projetId: t.projetId || '', validee: t.validee });
    setShowModal(true);
  }
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editing) updateTransaction({ ...editing, ...form });
    else addTransaction(form);
    setShowModal(false);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">Gestion Financière</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">{data.transactions.length} transactions enregistrées</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-lg text-sm font-medium">
          <Plus className="w-4 h-4" /> Nouvelle transaction
        </button>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-green-50 dark:bg-green-900/30 rounded-lg"><TrendingUp className="w-5 h-5 text-green-600" /></div>
            <span className="text-sm text-gray-500 dark:text-gray-400">Total Recettes</span>
          </div>
          <p className="text-2xl font-bold text-green-700 dark:text-green-400 mt-1">{totalRecettes.toLocaleString('fr-FR')}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500">FCFA</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-red-50 dark:bg-red-900/30 rounded-lg"><TrendingDown className="w-5 h-5 text-red-500" /></div>
            <span className="text-sm text-gray-500 dark:text-gray-400">Total Dépenses</span>
          </div>
          <p className="text-2xl font-bold text-red-600 mt-1">{totalDepenses.toLocaleString('fr-FR')}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500">FCFA</p>
        </div>
        <div className={`rounded-xl p-5 border shadow-sm ${solde >= 0 ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800' : 'bg-orange-50 dark:bg-orange-900/20 border-orange-100 dark:border-orange-800'}`}>
          <div className="flex items-center gap-3 mb-1">
            <div className={`p-2 rounded-lg ${solde >= 0 ? 'bg-emerald-100 dark:bg-emerald-800' : 'bg-orange-100 dark:bg-orange-800'}`}><Wallet className={`w-5 h-5 ${solde >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-orange-600 dark:text-orange-400'}`} /></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Solde actuel</span>
          </div>
          <p className={`text-2xl font-bold mt-1 ${solde >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-orange-700 dark:text-orange-400'}`}>{solde.toLocaleString('fr-FR')}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">FCFA</p>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
        <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-4">Évolution financière (en milliers FCFA)</h3>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#f0f0f0'} />
            <XAxis dataKey="mois" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip formatter={(val) => [`${val}k FCFA`]} />
            <Legend />
            <Bar dataKey="Recettes" fill="#16a34a" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Dépenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm flex flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[200px] bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2">
          <Search className="w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..." className="bg-transparent text-sm outline-none flex-1 text-gray-700 dark:text-gray-200" />
        </div>
        <select value={filterType} onChange={e => setFilterType(e.target.value)} className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-700 dark:text-gray-200 outline-none">
          <option value="">Tous les types</option>
          <option value="recette">Recettes</option>
          <option value="depense">Dépenses</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800/70 border-b border-gray-100 dark:border-gray-700">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Libellé</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Catégorie</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Type</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Montant</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Projet</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Date</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Statut</th>
                <th className="text-right px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
              {transactions.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-10 text-gray-400 dark:text-gray-500">Aucune transaction</td></tr>
              ) : transactions.map(t => {
                const projetNom = projetsMap.get(t.projetId || '') || '—';
                return (
                  <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-200">{t.libelle}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{t.categorie}</td>
                    <td className="px-4 py-3">
                      <span className={`flex items-center gap-1 text-xs font-medium ${t.type === 'recette' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {t.type === 'recette' ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                        {t.type === 'recette' ? 'Recette' : 'Dépense'}
                      </span>
                    </td>
                    <td className={`px-4 py-3 font-bold ${t.type === 'recette' ? 'text-green-700 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {t.type === 'recette' ? '+' : '-'}{t.montant.toLocaleString('fr-FR')} FCFA
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">{projetNom}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{new Date(t.date).toLocaleDateString('fr-FR')}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${t.validee ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'}`}>
                        {t.validee ? 'Validée' : 'En attente'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => openEdit(t)} className="p-1.5 rounded hover:bg-blue-50 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => setDeleteConfirm(t.id)} className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/30 text-red-500 dark:text-red-400"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">{editing ? 'Modifier' : 'Nouvelle transaction'}</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><X className="w-5 h-5 dark:text-gray-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">Libellé *</label>
                <input required value={form.libelle} onChange={e => setForm({ ...form, libelle: e.target.value })} className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-500 dark:bg-gray-700 dark:text-gray-200" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">Type</label>
                  <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as Transaction['type'] })} className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-500 dark:bg-gray-700 dark:text-gray-200">
                    <option value="recette">Recette</option>
                    <option value="depense">Dépense</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">Montant (FCFA) *</label>
                  <input type="number" min="0" required value={form.montant} onChange={e => setForm({ ...form, montant: +e.target.value })} className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-500 dark:bg-gray-700 dark:text-gray-200" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">Catégorie</label>
                  <select value={form.categorie} onChange={e => setForm({ ...form, categorie: e.target.value })} className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-500 dark:bg-gray-700 dark:text-gray-200">
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">Date</label>
                  <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-500 dark:bg-gray-700 dark:text-gray-200" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">Projet associé</label>
                <select value={form.projetId} onChange={e => setForm({ ...form, projetId: e.target.value })} className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-500 dark:bg-gray-700 dark:text-gray-200">
                  <option value="">Aucun projet</option>
                  {data.projets.map(p => <option key={p.id} value={p.id}>{p.titre}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="validee" checked={form.validee} onChange={e => setForm({ ...form, validee: e.target.checked })} className="w-4 h-4 accent-green-600" />
                <label htmlFor="validee" className="text-sm text-gray-700 dark:text-gray-300">Transaction validée</label>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 border border-gray-200 dark:border-gray-600 rounded-lg py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">Annuler</button>
                <button type="submit" className="flex-1 bg-green-700 hover:bg-green-800 text-white rounded-lg py-2 text-sm font-medium">{editing ? 'Modifier' : 'Enregistrer'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl text-center">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-2">Supprimer cette transaction ?</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Cette action est irréversible.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 border border-gray-200 dark:border-gray-600 rounded-lg py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">Annuler</button>
              <button onClick={() => { deleteTransaction(deleteConfirm); setDeleteConfirm(null); }} className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-lg py-2 text-sm font-medium">Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
