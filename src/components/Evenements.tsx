import { useState } from 'react';
import { Plus, Search, Edit2, Trash2, X, Calendar, MapPin, Users, Clock } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Evenement } from '../types';

const typeLabels: Record<Evenement['type'], string> = {
  reunion: 'Réunion', formation: 'Formation', collecte: 'Collecte de fonds',
  sensibilisation: 'Sensibilisation', autre: 'Autre',
};
const typeColors: Record<Evenement['type'], string> = {
  reunion: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
  formation: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
  collecte: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
  sensibilisation: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
  autre: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400',
};
const statutColors: Record<Evenement['statut'], string> = {
  planifie: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800',
  confirme: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800',
  termine: 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400',
  annule: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800',
};

const empty: Omit<Evenement, 'id'> = {
  titre: '', description: '', date: '', heure: '09:00', lieu: '',
  type: 'reunion', statut: 'planifie', participants: 0, responsable: '',
};

export default function Evenements() {
  const { data, addEvenement, updateEvenement, deleteEvenement } = useApp();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatut, setFilterStatut] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Evenement | null>(null);
  const [form, setForm] = useState<Omit<Evenement, 'id'>>(empty);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const today = new Date();
  const aVenir = data.evenements.filter(e => new Date(e.date) >= today && e.statut !== 'annule').length;
  const passes = data.evenements.filter(e => new Date(e.date) < today || e.statut === 'termine').length;

  const evenements = data.evenements.filter(e => {
    const q = search.toLowerCase();
    const matchSearch = !q || e.titre.toLowerCase().includes(q) || e.lieu.toLowerCase().includes(q);
    const matchType = !filterType || e.type === filterType;
    const matchStatut = !filterStatut || e.statut === filterStatut;
    return matchSearch && matchType && matchStatut;
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  function openAdd() { setEditing(null); setForm(empty); setShowModal(true); }
  function openEdit(e: Evenement) {
    setEditing(e);
    setForm({ titre: e.titre, description: e.description, date: e.date, heure: e.heure, lieu: e.lieu, type: e.type, statut: e.statut, participants: e.participants, responsable: e.responsable });
    setShowModal(true);
  }
  function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (editing) updateEvenement({ ...editing, ...form });
    else addEvenement(form);
    setShowModal(false);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">Gestion des Événements</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">{aVenir} à venir · {passes} passés</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-lg text-sm font-medium">
          <Plus className="w-4 h-4" /> Nouvel événement
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm flex flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[200px] bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2">
          <Search className="w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..." className="bg-transparent text-sm outline-none flex-1 text-gray-700 dark:text-gray-200" />
        </div>
        <select value={filterType} onChange={e => setFilterType(e.target.value)} className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-700 dark:text-gray-200 outline-none">
          <option value="">Tous les types</option>
          {Object.entries(typeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={filterStatut} onChange={e => setFilterStatut(e.target.value)} className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-700 dark:text-gray-200 outline-none">
          <option value="">Tous les statuts</option>
          <option value="planifie">Planifié</option>
          <option value="confirme">Confirmé</option>
          <option value="termine">Terminé</option>
          <option value="annule">Annulé</option>
        </select>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {evenements.length === 0 ? (
          <div className="col-span-3 text-center py-16 text-gray-400 dark:text-gray-500">Aucun événement trouvé</div>
        ) : evenements.map(e => {
          const isPast = new Date(e.date) < today;
          return (
            <div key={e.id} className={`bg-white dark:bg-gray-800 rounded-xl border shadow-sm hover:shadow-md transition-shadow overflow-hidden ${isPast ? 'border-gray-100 dark:border-gray-700 opacity-80' : 'border-gray-100 dark:border-gray-700'}`}>
              <div className={`h-2 ${e.statut === 'confirme' ? 'bg-green-500' : e.statut === 'annule' ? 'bg-red-400' : e.statut === 'termine' ? 'bg-gray-400' : 'bg-blue-400'}`} />
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${typeColors[e.type]}`}>{typeLabels[e.type]}</span>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(e)} className="p-1.5 rounded hover:bg-blue-50 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400"><Edit2 className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setDeleteConfirm(e.id)} className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/30 text-red-500 dark:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>

                <h3 className="font-bold text-gray-800 dark:text-gray-200 text-base mb-1">{e.titre}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm line-clamp-2 mb-4">{e.description}</p>

                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span>{new Date(e.date).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span>{e.heure}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span>{e.lieu}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span>{e.participants} participant(s) prévu(s)</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-50 dark:border-gray-700 flex items-center justify-between">
                  <span className="text-xs text-gray-400 dark:text-gray-500">Resp: <span className="font-medium text-gray-700 dark:text-gray-300">{e.responsable}</span></span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statutColors[e.statut]}`}>
                    {e.statut === 'planifie' ? 'Planifié' : e.statut === 'confirme' ? 'Confirmé' : e.statut === 'termine' ? 'Terminé' : 'Annulé'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800">
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">{editing ? 'Modifier' : 'Nouvel événement'}</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><X className="w-5 h-5 dark:text-gray-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">Titre *</label>
                <input required value={form.titre} onChange={e => setForm({ ...form, titre: e.target.value })} className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-500 dark:bg-gray-700 dark:text-gray-200" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">Description</label>
                <textarea rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-500 dark:bg-gray-700 dark:text-gray-200" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">Date *</label>
                  <input type="date" required value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-500 dark:bg-gray-700 dark:text-gray-200" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">Heure</label>
                  <input type="time" value={form.heure} onChange={e => setForm({ ...form, heure: e.target.value })} className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-500 dark:bg-gray-700 dark:text-gray-200" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">Lieu</label>
                <input value={form.lieu} onChange={e => setForm({ ...form, lieu: e.target.value })} className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-500 dark:bg-gray-700 dark:text-gray-200" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">Type</label>
                  <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as Evenement['type'] })} className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-500 dark:bg-gray-700 dark:text-gray-200">
                    {Object.entries(typeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">Statut</label>
                  <select value={form.statut} onChange={e => setForm({ ...form, statut: e.target.value as Evenement['statut'] })} className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-500 dark:bg-gray-700 dark:text-gray-200">
                    <option value="planifie">Planifié</option>
                    <option value="confirme">Confirmé</option>
                    <option value="termine">Terminé</option>
                    <option value="annule">Annulé</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">Participants prévus</label>
                  <input type="number" min="0" value={form.participants} onChange={e => setForm({ ...form, participants: +e.target.value })} className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-500 dark:bg-gray-700 dark:text-gray-200" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">Responsable</label>
                  <input value={form.responsable} onChange={e => setForm({ ...form, responsable: e.target.value })} className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-500 dark:bg-gray-700 dark:text-gray-200" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 border border-gray-200 dark:border-gray-600 rounded-lg py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">Annuler</button>
                <button type="submit" className="flex-1 bg-green-700 hover:bg-green-800 text-white rounded-lg py-2 text-sm font-medium">{editing ? 'Modifier' : 'Créer'}</button>
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
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-2">Supprimer cet événement ?</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Cette action est irréversible.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 border border-gray-200 dark:border-gray-600 rounded-lg py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">Annuler</button>
              <button onClick={() => { deleteEvenement(deleteConfirm); setDeleteConfirm(null); }} className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-lg py-2 text-sm font-medium">Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
