import { useState } from 'react';
import { Plus, Search, Edit2, Trash2, X, Heart, CheckCircle, Clock, Receipt } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Don } from '../types';

const statutColors = {
  recu: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
  en_attente: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
  annule: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
};
const typeLabels = { financier: 'Financier', materiel: 'Matériel', service: 'Service' };

const empty: Omit<Don, 'id'> = {
  donateur: '', email: '', montant: 0, devise: 'FCFA',
  date: new Date().toISOString().split('T')[0], type: 'financier',
  projetId: '', statut: 'recu', recu: false, notes: '',
};

export default function Dons() {
  const { data, addDon, updateDon, deleteDon } = useApp();
  const [search, setSearch] = useState('');
  const [filterStatut, setFilterStatut] = useState('');
  const [filterType, setFilterType] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Don | null>(null);
  const [form, setForm] = useState<Omit<Don, 'id'>>(empty);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const totalRecu = data.dons.filter(d => d.statut === 'recu').reduce((s, d) => s + d.montant, 0);
  const totalEnAttente = data.dons.filter(d => d.statut === 'en_attente').reduce((s, d) => s + d.montant, 0);

  const dons = data.dons.filter(d => {
    const q = search.toLowerCase();
    const matchSearch = !q || d.donateur.toLowerCase().includes(q) || d.email.toLowerCase().includes(q);
    const matchStatut = !filterStatut || d.statut === filterStatut;
    const matchType = !filterType || d.type === filterType;
    return matchSearch && matchStatut && matchType;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  function openAdd() { setEditing(null); setForm(empty); setShowModal(true); }
  function openEdit(d: Don) {
    setEditing(d);
    setForm({ donateur: d.donateur, email: d.email, montant: d.montant, devise: d.devise, date: d.date, type: d.type, projetId: d.projetId || '', statut: d.statut, recu: d.recu, notes: d.notes });
    setShowModal(true);
  }
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editing) updateDon({ ...editing, ...form });
    else addDon(form);
    setShowModal(false);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">Gestion des Dons</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">{data.dons.length} dons enregistrés</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" /> Enregistrer un don
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-50 dark:bg-green-900/30 rounded-lg"><CheckCircle className="w-5 h-5 text-green-600" /></div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Total reçu</p>
              <p className="font-bold text-green-700 dark:text-green-400">{totalRecu.toLocaleString('fr-FR')} FCFA</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg"><Clock className="w-5 h-5 text-yellow-600" /></div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">En attente</p>
              <p className="font-bold text-yellow-700 dark:text-yellow-400">{totalEnAttente.toLocaleString('fr-FR')} FCFA</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-50 dark:bg-red-900/30 rounded-lg"><Heart className="w-5 h-5 text-red-500" /></div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Nombre de donateurs</p>
              <p className="font-bold text-gray-800 dark:text-gray-200">{[...new Set(data.dons.map(d => d.email))].length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm flex flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[200px] bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2">
          <Search className="w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un donateur..." className="bg-transparent text-sm outline-none flex-1 text-gray-700 dark:text-gray-200" />
        </div>
        <select value={filterStatut} onChange={e => setFilterStatut(e.target.value)} className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-700 dark:text-gray-200 outline-none">
          <option value="">Tous les statuts</option>
          <option value="recu">Reçu</option>
          <option value="en_attente">En attente</option>
          <option value="annule">Annulé</option>
        </select>
        <select value={filterType} onChange={e => setFilterType(e.target.value)} className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-700 dark:text-gray-200 outline-none">
          <option value="">Tous les types</option>
          <option value="financier">Financier</option>
          <option value="materiel">Matériel</option>
          <option value="service">Service</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800/70 border-b border-gray-100 dark:border-gray-700">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Donateur</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Montant</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Type</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Projet</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Date</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Statut</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Reçu</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
              {dons.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-10 text-gray-400 dark:text-gray-500">Aucun don trouvé</td></tr>
              ) : dons.map(d => {
                const projet = data.projets.find(p => p.id === d.projetId);
                return (
                  <tr key={d.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800 dark:text-gray-200">{d.donateur}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{d.email}</p>
                    </td>
                    <td className="px-4 py-3 font-bold text-green-700 dark:text-green-400">{d.montant.toLocaleString('fr-FR')} {d.devise}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs">{typeLabels[d.type]}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-xs">{projet ? projet.titre : '—'}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{new Date(d.date).toLocaleDateString('fr-FR')}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statutColors[d.statut]}`}>
                        {d.statut === 'recu' ? 'Reçu' : d.statut === 'en_attente' ? 'En attente' : 'Annulé'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {d.recu
                        ? <Receipt className="w-4 h-4 text-green-600" />
                        : <span className="text-gray-300 text-xs">—</span>
                      }
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => openEdit(d)} className="p-1.5 rounded hover:bg-blue-50 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => setDeleteConfirm(d.id)} className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/30 text-red-500 dark:text-red-400"><Trash2 className="w-4 h-4" /></button>
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
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">{editing ? 'Modifier le don' : 'Enregistrer un don'}</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><X className="w-5 h-5 dark:text-gray-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">Donateur *</label>
                <input required value={form.donateur} onChange={e => setForm({ ...form, donateur: e.target.value })} className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-500 dark:bg-gray-700 dark:text-gray-200" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">Email</label>
                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-500 dark:bg-gray-700 dark:text-gray-200" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">Montant *</label>
                  <input type="number" min="0" required value={form.montant} onChange={e => setForm({ ...form, montant: +e.target.value })} className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-500 dark:bg-gray-700 dark:text-gray-200" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">Devise</label>
                  <select value={form.devise} onChange={e => setForm({ ...form, devise: e.target.value })} className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-500 dark:bg-gray-700 dark:text-gray-200">
                    <option>FCFA</option><option>EUR</option><option>USD</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">Type</label>
                  <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as Don['type'] })} className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-500 dark:bg-gray-700 dark:text-gray-200">
                    <option value="financier">Financier</option>
                    <option value="materiel">Matériel</option>
                    <option value="service">Service</option>
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
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">Statut</label>
                <select value={form.statut} onChange={e => setForm({ ...form, statut: e.target.value as Don['statut'] })} className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-500 dark:bg-gray-700 dark:text-gray-200">
                  <option value="recu">Reçu</option>
                  <option value="en_attente">En attente</option>
                  <option value="annule">Annulé</option>
                </select>
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="recu" checked={form.recu} onChange={e => setForm({ ...form, recu: e.target.checked })} className="w-4 h-4 accent-green-600" />
                <label htmlFor="recu" className="text-sm text-gray-700 dark:text-gray-300">Reçu émis</label>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">Notes</label>
                <textarea rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-500 dark:bg-gray-700 dark:text-gray-200 placeholder-gray-400" />
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
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-2">Supprimer ce don ?</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Cette action est irréversible.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 border border-gray-200 dark:border-gray-600 rounded-lg py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">Annuler</button>
              <button onClick={() => { deleteDon(deleteConfirm); setDeleteConfirm(null); }} className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-lg py-2 text-sm font-medium">Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
