import { useState } from 'react';
import { Plus, Search, Edit2, Trash2, X, MapPin, Users, Calendar } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Projet } from '../types';

const statutLabels: Record<Projet['statut'], string> = {
  planifie: 'Planifié', en_cours: 'En cours', termine: 'Terminé', suspendu: 'Suspendu',
};
const statutColors: Record<Projet['statut'], string> = {
  planifie: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
  en_cours: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
  termine: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400',
  suspendu: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
};

const empty: Omit<Projet, 'id'> = {
  titre: '', description: '', responsable: '', statut: 'planifie',
  dateDebut: '', dateFin: '', budget: 0, depenses: 0,
  categorie: '', beneficiaires: 0, localisation: '', progression: 0,
};

export default function Projets() {
  const { data, addProjet, updateProjet, deleteProjet } = useApp();
  const [search, setSearch] = useState('');
  const [filterStatut, setFilterStatut] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Projet | null>(null);
  const [form, setForm] = useState<Omit<Projet, 'id'>>(empty);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [view, setView] = useState<'cards' | 'table'>('cards');

  const categories = [...new Set(data.projets.map(p => p.categorie).filter(Boolean))];

  const projets = data.projets.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = !q || p.titre.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
    const matchStatut = !filterStatut || p.statut === filterStatut;
    const matchCat = !filterCat || p.categorie === filterCat;
    return matchSearch && matchStatut && matchCat;
  });

  function openAdd() { setEditing(null); setForm(empty); setShowModal(true); }
  function openEdit(p: Projet) {
    setEditing(p);
    setForm({ titre: p.titre, description: p.description, responsable: p.responsable, statut: p.statut, dateDebut: p.dateDebut, dateFin: p.dateFin, budget: p.budget, depenses: p.depenses, categorie: p.categorie, beneficiaires: p.beneficiaires, localisation: p.localisation, progression: p.progression });
    setShowModal(true);
  }
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editing) updateProjet({ ...editing, ...form });
    else addProjet(form);
    setShowModal(false);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">Gestion des Projets</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">{data.projets.filter(p => p.statut === 'en_cours').length} projets en cours</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" /> Nouveau projet
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2 flex-1 min-w-[200px] bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2">
          <Search className="w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un projet..." className="bg-transparent text-sm outline-none flex-1 text-gray-700 dark:text-gray-200" />
        </div>
        <select value={filterStatut} onChange={e => setFilterStatut(e.target.value)} className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-700 dark:text-gray-200 outline-none">
          <option value="">Tous les statuts</option>
          <option value="planifie">Planifié</option>
          <option value="en_cours">En cours</option>
          <option value="termine">Terminé</option>
          <option value="suspendu">Suspendu</option>
        </select>
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-700 dark:text-gray-200 outline-none">
          <option value="">Toutes catégories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          <button onClick={() => setView('cards')} className={`px-3 py-1 rounded text-sm ${view === 'cards' ? 'bg-white dark:bg-gray-600 shadow text-green-700 dark:text-green-300 font-medium' : 'text-gray-500 dark:text-gray-400'}`}>Cartes</button>
          <button onClick={() => setView('table')} className={`px-3 py-1 rounded text-sm ${view === 'table' ? 'bg-white dark:bg-gray-600 shadow text-green-700 dark:text-green-300 font-medium' : 'text-gray-500 dark:text-gray-400'}`}>Tableau</button>
        </div>
      </div>

      {view === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {projets.length === 0 ? (
            <div className="col-span-3 text-center py-16 text-gray-400 dark:text-gray-500">Aucun projet trouvé</div>
          ) : projets.map(p => (
            <div key={p.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statutColors[p.statut]}`}>{statutLabels[p.statut]}</span>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(p)} className="p-1.5 rounded hover:bg-blue-50 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400"><Edit2 className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setDeleteConfirm(p.id)} className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/30 text-red-500 dark:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
                <h3 className="font-bold text-gray-800 dark:text-gray-200 text-base mb-1">{p.titre}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm line-clamp-2 mb-3">{p.description}</p>

                <div className="space-y-1.5 text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />{p.localisation}</div>
                  <div className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" />{p.beneficiaires.toLocaleString('fr-FR')} bénéficiaires</div>
                  <div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />{new Date(p.dateDebut).toLocaleDateString('fr-FR')} → {new Date(p.dateFin).toLocaleDateString('fr-FR')}</div>
                </div>

                <div className="mt-4">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-500 dark:text-gray-400">Budget consommé</span>
                    <span className="font-bold text-green-700 dark:text-green-400">{p.progression}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${p.statut === 'termine' ? 'bg-blue-500' : p.progression > 80 ? 'bg-orange-500' : 'bg-green-500'}`} style={{ width: `${p.progression}%` }} />
                  </div>
                  <div className="flex justify-between text-xs mt-1 text-gray-400 dark:text-gray-500">
                    <span>{p.depenses.toLocaleString('fr-FR')} FCFA</span>
                    <span>{p.budget.toLocaleString('fr-FR')} FCFA</span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-gray-50 dark:border-gray-700">
                  <span className="text-xs text-gray-400 dark:text-gray-500">Responsable: </span>
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{p.responsable}</span>
                  <span className="ml-3 text-xs text-gray-400 dark:text-gray-500">Catégorie: </span>
                  <span className="text-xs font-medium text-green-700 dark:text-green-400">{p.categorie}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800/70 border-b border-gray-100 dark:border-gray-700">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Projet</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Statut</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Budget</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Progression</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Responsable</th>
                  <th className="text-right px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                {projets.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800 dark:text-gray-200">{p.titre}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{p.categorie} · {p.localisation}</p>
                    </td>
                    <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-medium ${statutColors[p.statut]}`}>{statutLabels[p.statut]}</span></td>
                    <td className="px-4 py-3">
                      <p className="text-gray-800 dark:text-gray-200">{p.budget.toLocaleString('fr-FR')} FCFA</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{p.depenses.toLocaleString('fr-FR')} dépensés</p>
                    </td>
                    <td className="px-4 py-3 w-36">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div className="h-full bg-green-500 rounded-full" style={{ width: `${p.progression}%` }} />
                        </div>
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400 w-8">{p.progression}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{p.responsable}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => openEdit(p)} className="p-1.5 rounded hover:bg-blue-50 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => setDeleteConfirm(p.id)} className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/30 text-red-500 dark:text-red-400"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800">
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">{editing ? 'Modifier le projet' : 'Nouveau projet'}</h3>
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
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">Responsable *</label>
                  <input required value={form.responsable} onChange={e => setForm({ ...form, responsable: e.target.value })} className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-500 dark:bg-gray-700 dark:text-gray-200" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">Catégorie</label>
                  <input value={form.categorie} onChange={e => setForm({ ...form, categorie: e.target.value })} placeholder="Éducation, Santé..." className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-500 dark:bg-gray-700 dark:text-gray-200" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">Date de début</label>
                  <input type="date" value={form.dateDebut} onChange={e => setForm({ ...form, dateDebut: e.target.value })} className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-500 dark:bg-gray-700 dark:text-gray-200" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">Date de fin</label>
                  <input type="date" value={form.dateFin} onChange={e => setForm({ ...form, dateFin: e.target.value })} className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-500 dark:bg-gray-700 dark:text-gray-200" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">Budget (FCFA)</label>
                  <input type="number" min="0" value={form.budget} onChange={e => setForm({ ...form, budget: +e.target.value })} className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-500 dark:bg-gray-700 dark:text-gray-200" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">Dépenses (FCFA)</label>
                  <input type="number" min="0" value={form.depenses} onChange={e => setForm({ ...form, depenses: +e.target.value })} className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-500 dark:bg-gray-700 dark:text-gray-200" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">Progression (%)</label>
                  <input type="number" min="0" max="100" value={form.progression} onChange={e => setForm({ ...form, progression: +e.target.value })} className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-500 dark:bg-gray-700 dark:text-gray-200" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">Localisation</label>
                  <input value={form.localisation} onChange={e => setForm({ ...form, localisation: e.target.value })} className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-500 dark:bg-gray-700 dark:text-gray-200" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">Bénéficiaires</label>
                  <input type="number" min="0" value={form.beneficiaires} onChange={e => setForm({ ...form, beneficiaires: +e.target.value })} className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-500 dark:bg-gray-700 dark:text-gray-200" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">Statut</label>
                <select value={form.statut} onChange={e => setForm({ ...form, statut: e.target.value as Projet['statut'] })} className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-500 dark:bg-gray-700 dark:text-gray-200">
                  <option value="planifie">Planifié</option>
                  <option value="en_cours">En cours</option>
                  <option value="termine">Terminé</option>
                  <option value="suspendu">Suspendu</option>
                </select>
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
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-2">Supprimer ce projet ?</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Cette action est irréversible.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 border border-gray-200 dark:border-gray-600 rounded-lg py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">Annuler</button>
              <button onClick={() => { deleteProjet(deleteConfirm); setDeleteConfirm(null); }} className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-lg py-2 text-sm font-medium">Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
