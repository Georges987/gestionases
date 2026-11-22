import { useState, useEffect } from 'react';
import { Truck, Plus, Search, Edit2, Trash2, X, Phone, Mail, MapPin, User, Tag } from 'lucide-react';
import { Fournisseur } from '../types';
import { apiCall, ApiResponse } from '../api/client';
import toast from 'react-hot-toast';
import { validateRequired } from '../utils/validation';

export default function Fournisseurs() {
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingFournisseur, setEditingFournisseur] = useState<Fournisseur | null>(null);

  const [formData, setFormData] = useState({
    nom: '', contact_nom: '', email: '', telephone: '', adresse: '', categorie: 'Général', notes: ''
  });

  async function loadFournisseurs() {
    setLoading(true);
    try {
      const res = await apiCall('fournisseurs.php', { action: 'list' });
      setFournisseurs((res as ApiResponse<Fournisseur[]>).data || []);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erreur lors du chargement des fournisseurs');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadFournisseurs(); }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!validateRequired(formData.nom)) {
      toast.error('Le nom du fournisseur est obligatoire');
      return;
    }

    try {
      if (editingFournisseur) {
        await apiCall('fournisseurs.php', { action: 'update' }, { ...formData, id: editingFournisseur.id });
        toast.success('Fournisseur mis à jour');
      } else {
        await apiCall('fournisseurs.php', { action: 'create' }, formData);
        toast.success('Fournisseur créé');
      }
      resetForm();
      loadFournisseurs();
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de l\'enregistrement');
    }
  }

  async function handleDelete(id: string) {
    if (window.confirm('Supprimer ce fournisseur ?')) {
      try {
        await apiCall('fournisseurs.php', { action: 'delete', id });
        toast.success('Fournisseur supprimé');
        loadFournisseurs();
      } catch (err: any) {
        toast.error(err.message || 'Erreur lors de la suppression');
      }
    }
  }

  function resetForm() {
    setFormData({ nom: '', contact_nom: '', email: '', telephone: '', adresse: '', categorie: 'Général', notes: '' });
    setEditingFournisseur(null);
    setShowForm(false);
  }

  function editFournisseur(f: Fournisseur) {
    setEditingFournisseur(f);
    setFormData({
      nom: f.nom, contact_nom: f.contact_nom, email: f.email,
      telephone: f.telephone, adresse: f.adresse, categorie: f.categorie, notes: f.notes
    });
    setShowForm(true);
  }

  const filteredFournisseurs = fournisseurs.filter(f => 
    f.nom.toLowerCase().includes(searchTerm.toLowerCase()) || 
    f.contact_nom.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full dark:border-green-400"></div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <Truck className="w-5 h-5 text-green-700 dark:text-green-300" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-200">Gestion des Fournisseurs</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Répertoire des partenaires et fournisseurs de l'ONG</p>
          </div>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">
          <Plus className="w-4 h-4" /> Nouveau fournisseur
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input 
          type="text" 
          placeholder="Rechercher un fournisseur..." 
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-gray-200"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredFournisseurs.map(f => (
          <div key={f.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-green-50 dark:bg-green-900/30 rounded-lg">
                <Truck className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex gap-1">
                <button onClick={() => editFournisseur(f)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-blue-600 dark:text-blue-400" title="Modifier"><Edit2 className="w-4 h-4" /></button>
                <button onClick={() => handleDelete(f.id)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-red-600" title="Supprimer"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
            <h3 className="font-bold text-gray-900 dark:text-gray-200 mb-1">{f.nom}</h3>
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-3">
              <Tag className="w-3 h-3" /> {f.categorie}
            </div>
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-400" /> <span className="font-medium dark:text-gray-300">{f.contact_nom}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-400" /> <span>{f.telephone || '—'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-400" /> <span className="truncate">{f.email || '—'}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-400" /> <span className="truncate">{f.adresse || '—'}</span>
              </div>
            </div>
            {f.notes && (
              <div className="mt-4 p-2 bg-gray-50 dark:bg-gray-700 rounded text-xs text-gray-500 dark:text-gray-400 italic">
                {f.notes}
              </div>
            )}
          </div>
        ))}
        {filteredFournisseurs.length === 0 && (
          <div className="col-span-full text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400">
            Aucun fournisseur trouvé
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold dark:text-gray-200">{editingFournisseur ? 'Modifier' : 'Nouveau'} fournisseur</h2>
              <button onClick={resetForm}><X className="w-5 h-5 text-gray-500 dark:text-gray-400" /></button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom de l'entreprise *</label>
                  <input type="text" value={formData.nom} onChange={e => setFormData({ ...formData, nom: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600" placeholder="Ex: Bureau Vallée" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contact principal</label>
                  <input type="text" value={formData.contact_nom} onChange={e => setFormData({ ...formData, contact_nom: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600" placeholder="Nom du contact" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Catégorie</label>
                  <input type="text" value={formData.categorie} onChange={e => setFormData({ ...formData, categorie: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600" placeholder="Ex: Fournitures, Logistique..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Téléphone</label>
                  <input type="text" value={formData.telephone} onChange={e => setFormData({ ...formData, telephone: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600" placeholder="+225..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                  <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600" placeholder="contact@fournisseur.com" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Adresse</label>
                  <input type="text" value={formData.adresse} onChange={e => setFormData({ ...formData, adresse: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600" placeholder="Adresse physique" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
                  <textarea value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} rows={3} className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600" placeholder="Remarques sur ce fournisseur..."></textarea>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={resetForm} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-300">Annuler</button>
                <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">
                  {editingFournisseur ? 'Mettre à jour' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
