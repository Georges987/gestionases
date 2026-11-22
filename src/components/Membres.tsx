import { useState, useMemo } from 'react';
import { Plus, Search, Edit2, Trash2, UserCheck, UserX, Phone, Mail, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Membre } from '../types';
import { addDays, getMonth, getDate } from 'date-fns';

const roleLabels: Record<Membre['role'], string> = {
  administrateur: 'Administrateur',
  president: 'Président',
  directeur: 'Directeur exécutif',
  tresorier: 'Trésorier',
  secretaire: 'Secrétaire général',
  coordinateur: 'Coordinateur',
  chef_projet: 'Chef de projet',
  responsable_programme: 'Responsable de programme',
  logisticien: 'Coordinateur logistique',
  charge_mission: 'Chargé de mission',
  responsable_partenaire: 'Responsable partenariats',
  rh: 'Responsable RH',
  comptable: 'Comptable',
  charge_communication: 'Chargé communication',
  juriste: 'Juriste',
  superviseur_zone: 'Superviseur de zone',
  animateur_communautaire: 'Animateur communautaire',
  formateur: 'Formateur',
  technicien: 'Technicien',
  benevole: 'Bénévole',
  donateur: 'Donateur',
  membre: 'Membre',
};
const roleColors: Record<Membre['role'], string> = {
  administrateur: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
  president: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
  directeur: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
  tresorier: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
  secretaire: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
  coordinateur: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
  chef_projet: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300',
  responsable_programme: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300',
  logisticien: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
  charge_mission: 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300',
  responsable_partenaire: 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300',
  rh: 'bg-fuchsia-100 dark:bg-fuchsia-900/30 text-fuchsia-700 dark:text-fuchsia-300',
  comptable: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
  charge_communication: 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300',
  juriste: 'bg-slate-100 dark:bg-slate-900/30 text-slate-700 dark:text-slate-300',
  superviseur_zone: 'bg-lime-100 dark:bg-lime-900/30 text-lime-700 dark:text-lime-300',
  animateur_communautaire: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
  formateur: 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300',
  technicien: 'bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300',
  benevole: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
  donateur: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
  membre: 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300',
};

const MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

function normalizeAnniversaire(val: string | undefined): string {
  if (!val) return '';
  if (val.length === 5 && val.includes('-')) return val; // MM-DD
  if (val.length === 10 && val.includes('-')) return val.slice(5); // YYYY-MM-DD → MM-DD
  return '';
}

function getMonthDay(val: string | undefined): { month: number; day: number } | null {
  const norm = normalizeAnniversaire(val);
  if (!norm) return null;
  const [m, d] = norm.split('-').map(Number);
  if (!m || !d || m < 1 || m > 12 || d < 1 || d > 31) return null;
  return { month: m, day: d };
}

function formatAnniversaire(val: string | undefined): string {
  const md = getMonthDay(val);
  if (!md) return '';
  return `${String(md.day).padStart(2, '0')}/${String(md.month).padStart(2, '0')}`;
}

export function isBirthdayOnDate(val: string | undefined, target: Date): boolean {
  const md = getMonthDay(val);
  if (!md) return false;
  return md.month - 1 === getMonth(target) && md.day === getDate(target);
}

const empty: Omit<Membre, 'id'> = {
  nom: '', prenom: '', email: '', telephone: '', role: 'benevole',
  statut: 'actif', dateAdhesion: new Date().toISOString().split('T')[0], adresse: '',
  anniversaire: ''
};

export default function Membres() {
  const { data, addMembre, updateMembre, deleteMembre } = useApp();
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStatut, setFilterStatut] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Membre | null>(null);
  const [form, setForm] = useState<Omit<Membre, 'id'>>(empty);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [pageSize] = useState(10);

  // Calculate upcoming birthdays (today and tomorrow)
  const today = useMemo(() => new Date(), []);
  const tomorrow = useMemo(() => addDays(today, 1), [today]);
  
  const upcomingBirthdays = useMemo(() => {
    return data.membres.filter(m => {
      if (!m.anniversaire) return false;
      return isBirthdayOnDate(m.anniversaire, today) || isBirthdayOnDate(m.anniversaire, tomorrow);
    });
  }, [data.membres, today, tomorrow]);

  const membres = useMemo(() => {
    return data.membres.filter(m => {
      const q = search.toLowerCase();
      const matchSearch = !q || `${m.nom} ${m.prenom} ${m.email}`.toLowerCase().includes(q);
      const matchRole = !filterRole || m.role === filterRole;
      const matchStatut = !filterStatut || m.statut === filterStatut;
      return matchSearch && matchRole && matchStatut;
    });
  }, [data.membres, search, filterRole, filterStatut]);

  const totalPages = Math.ceil(membres.length / pageSize);
  const paginatedMembres = useMemo(() => {
    return membres.slice(page * pageSize, (page + 1) * pageSize);
  }, [membres, page, pageSize]);

  const actifsCount = useMemo(() => data.membres.filter(m => m.statut === 'actif').length, [data.membres]);
  const totalCount = data.membres.length;

  // Reset page when filters change
  useMemo(() => setPage(0), [search, filterRole, filterStatut]);

  function openAdd() {
    setEditing(null);
    setForm(empty);
    setShowModal(true);
  }
  function openEdit(m: Membre) {
    setEditing(m);
    setForm({ nom: m.nom, prenom: m.prenom, email: m.email, telephone: m.telephone, role: m.role, statut: m.statut, dateAdhesion: m.dateAdhesion, adresse: m.adresse, anniversaire: m.anniversaire || '' });
    setShowModal(true);
  }
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editing) updateMembre({ ...editing, ...form });
    else addMembre(form);
    setShowModal(false);
  }
  function handleDelete(id: string) {
    deleteMembre(id);
    setDeleteConfirm(null);
  }

  return (
    <div className="space-y-5">
       {/* Header */}
       <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
         <div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">Gestion des Membres</h2>
             <p className="text-gray-500 dark:text-gray-400 text-sm">{actifsCount} membres actifs sur {totalCount}</p>
         </div>
         <button onClick={openAdd} className="flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
           <Plus className="w-4 h-4" /> Nouveau membre
         </button>
       </div>

       {/* Upcoming Birthdays Notice */}
        {upcomingBirthdays.length > 0 && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-4 mb-4 rounded-r-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <UserCheck className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                 {upcomingBirthdays.length === 1 
                   ? 'Anniversaire demain' 
                   : `${upcomingBirthdays.length} anniversaires demain`}
               </h3>
                <p className="text-sm text-yellow-700 dark:text-yellow-400">
                 {upcomingBirthdays.map(m => `${m.prenom} ${m.nom}`).join(', ')}
               </p>
             </div>
           </div>
         </div>
       )}

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm flex flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[200px] bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2">
          <Search className="w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..." className="bg-transparent text-sm outline-none flex-1 text-gray-700 dark:text-gray-200" />
        </div>
        <select value={filterRole} onChange={e => setFilterRole(e.target.value)} className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-700 dark:text-gray-200 outline-none">
          <option value="">Tous les rôles</option>
          {Object.entries(roleLabels).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        <select value={filterStatut} onChange={e => setFilterStatut(e.target.value)} className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-700 dark:text-gray-200 outline-none">
          <option value="">Tous les statuts</option>
          <option value="actif">Actif</option>
          <option value="inactif">Inactif</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800/70 border-b border-gray-100 dark:border-gray-700">
               <tr>
                 <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Membre</th>
                 <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Contact</th>
                 <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Rôle</th>
                 <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Adhésion</th>
                 <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Anniversaire</th>
                 <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Statut</th>
                 <th className="text-right px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Actions</th>
               </tr>
            </thead>
             <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
               {paginatedMembres.length === 0 ? (
                 <tr><td colSpan={7} className="text-center py-10 text-gray-400 dark:text-gray-500">Aucun membre trouvé</td></tr>
                ) : paginatedMembres.map(m => {
                  let isBirthdayToday = false;
                  let isBirthdayTomorrow = false;
                  
                  if (m.anniversaire) {
                    isBirthdayToday = isBirthdayOnDate(m.anniversaire, today);
                    isBirthdayTomorrow = isBirthdayOnDate(m.anniversaire, tomorrow);
                  }
                  
                  return (
                    <tr key={m.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${isBirthdayTomorrow ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''} ${isBirthdayToday ? 'bg-green-50 dark:bg-green-900/20' : ''}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-bold text-sm">
                            {m.prenom[0]}{m.nom[0]}
                          </div>
                          <div>
                            <p className="font-medium text-gray-800 dark:text-gray-200">{m.prenom} {m.nom}</p>
                            <p className="text-gray-400 dark:text-gray-500 text-xs">{m.adresse}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-0.5">
                          <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400"><Mail className="w-3 h-3" /> {m.email}</span>
                          <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400 text-xs"><Phone className="w-3 h-3" /> {m.telephone}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${roleColors[m.role]}`}>{roleLabels[m.role]}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{new Date(m.dateAdhesion).toLocaleDateString('fr-FR')}</td>
                      <td className="px-4 py-3">
                        {m.anniversaire ? (
                          <>
                            {isBirthdayToday && (
                              <span className="flex items-center gap-1 text-green-600 dark:text-green-400 text-sm">
                                <UserCheck className="w-3 h-3" /> Aujourd'hui
                              </span>
                            )}
                            {isBirthdayTomorrow && !isBirthdayToday && (
                              <span className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400 text-sm">
                                <UserCheck className="w-3 h-3" /> Demain
                              </span>
                            )}
                            {!isBirthdayToday && !isBirthdayTomorrow && (
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                {formatAnniversaire(m.anniversaire)}
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500 text-xs">Non renseigné</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`flex items-center gap-1 text-xs font-medium ${m.statut === 'actif' ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`}>
                          {m.statut === 'actif' ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                          {m.statut === 'actif' ? 'Actif' : 'Inactif'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => openEdit(m)} className="p-1.5 rounded hover:bg-blue-50 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 transition-colors"><Edit2 className="w-4 h-4" /></button>
                          <button onClick={() => setDeleteConfirm(m.id)} className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/30 text-red-500 dark:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
             </tbody>
           </table>
         </div>
       </div>

       {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm px-4 py-3">
            <p className="text-sm text-gray-500 dark:text-gray-400">
             Page {page + 1} sur {totalPages} — {membres.length} résultat{membres.length > 1 ? 's' : ''}
           </p>
           <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4 dark:text-gray-300" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                    i === page
                      ? 'bg-green-700 text-white'
                      : 'border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page === totalPages - 1}
                className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4 dark:text-gray-300" />
              </button>
           </div>
         </div>
       )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">{editing ? 'Modifier le membre' : 'Nouveau membre'}</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><X className="w-5 h-5 dark:text-gray-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">Prénom *</label>
                  <input required value={form.prenom} onChange={e => setForm({ ...form, prenom: e.target.value })} className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-500 dark:bg-gray-700 dark:text-gray-200" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">Nom *</label>
                  <input required value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-500 dark:bg-gray-700 dark:text-gray-200" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">Email *</label>
                <input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full border border-gray-200 dark:border-gray-600 dark:text-gray-200 dark:bg-gray-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-500" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">Téléphone</label>
                <input value={form.telephone} onChange={e => setForm({ ...form, telephone: e.target.value })} className="w-full border border-gray-200 dark:border-gray-600 dark:text-gray-200 dark:bg-gray-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">Rôle</label>
                  <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value as Membre['role'] })} className="w-full border border-gray-200 dark:border-gray-600 dark:text-gray-200 dark:bg-gray-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-500">
                    {Object.entries(roleLabels).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">Statut</label>
                  <select value={form.statut} onChange={e => setForm({ ...form, statut: e.target.value as Membre['statut'] })} className="w-full border border-gray-200 dark:border-gray-600 dark:text-gray-200 dark:bg-gray-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-500">
                    <option value="actif">Actif</option>
                    <option value="inactif">Inactif</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">Date d'adhésion</label>
                <input type="date" value={form.dateAdhesion} onChange={e => setForm({ ...form, dateAdhesion: e.target.value })} className="w-full border border-gray-200 dark:border-gray-600 dark:text-gray-200 dark:bg-gray-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-500" />
              </div>
               <div>
                 <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">Adresse</label>
                 <input value={form.adresse} onChange={e => setForm({ ...form, adresse: e.target.value })} className="w-full border border-gray-200 dark:border-gray-600 dark:text-gray-200 dark:bg-gray-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-500" />
               </div>
               <div>
                 <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">Anniversaire (optionnel)</label>
                 <div className="flex gap-2">
                    <select
                      value={normalizeAnniversaire(form.anniversaire).split('-')[0] || ''}
                      onChange={e => {
                        const day = normalizeAnniversaire(form.anniversaire).split('-')[1] || '01';
                        const month = e.target.value;
                        setForm({ ...form, anniversaire: month ? `${month}-${day}` : '' });
                      }}
                      className="flex-1 border border-gray-200 dark:border-gray-600 dark:text-gray-200 dark:bg-gray-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-500"
                    >
                      <option value="">Mois</option>
                      {MONTHS.map((name, i) => (
                        <option key={i} value={String(i + 1).padStart(2, '0')}>{name}</option>
                      ))}
                    </select>
                    <select
                      value={normalizeAnniversaire(form.anniversaire).split('-')[1] || ''}
                      onChange={e => {
                        const month = normalizeAnniversaire(form.anniversaire).split('-')[0] || '01';
                        const day = e.target.value;
                        setForm({ ...form, anniversaire: day ? `${month}-${day}` : '' });
                      }}
                      className="flex-1 border border-gray-200 dark:border-gray-600 dark:text-gray-200 dark:bg-gray-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-500"
                    >
                      <option value="">Jour</option>
                      {Array.from({ length: 31 }, (_, i) => (
                        <option key={i + 1} value={String(i + 1).padStart(2, '0')}>{i + 1}</option>
                      ))}
                    </select>
                 </div>
               </div>
               <div className="flex gap-3 pt-2">
                 <button type="button" onClick={() => setShowModal(false)} className="flex-1 border border-gray-200 dark:border-gray-600 rounded-lg py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">Annuler</button>
                 <button type="submit" className="flex-1 bg-green-700 hover:bg-green-800 text-white rounded-lg py-2 text-sm font-medium transition-colors">{editing ? 'Modifier' : 'Ajouter'}</button>
               </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl text-center">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-2">Supprimer ce membre ?</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Cette action est irréversible.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 border border-gray-200 dark:border-gray-600 rounded-lg py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">Annuler</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-lg py-2 text-sm font-medium transition-colors">Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
