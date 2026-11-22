import { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Search, Trash2, X, CheckCircle, Clock, Package, User } from 'lucide-react';
import { CommandeFournisseur, Fournisseur, StockArticle, CommandeArticle } from '../types';
import { apiCall, ApiResponse } from '../api/client';
import toast from 'react-hot-toast';
import { useApp } from '../context/AppContext';

export default function Commandes() {
  const { data } = useApp();
  const [commandes, setCommandes] = useState<CommandeFournisseur[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  
    const [formData, setFormData] = useState({
    fournisseur_id: '', date_commande: new Date().toISOString().split('T')[0],
    statut: 'en_attente' as 'en_attente' | 'recue' | 'annulee',
    montant_total: 0, devise: 'FCFA', notes: '', articles: [] as CommandeArticle[]
  });

  async function loadCommandes() {
    setLoading(true);
    try {
      const res = await apiCall('commandes.php', { action: 'list' });
      setCommandes((res as ApiResponse<CommandeFournisseur[]>).data || []);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erreur lors du chargement des commandes');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadCommandes(); }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.fournisseur_id) {
      toast.error('Veuillez sélectionner un fournisseur');
      return;
    }

    try {
      await apiCall('commandes.php', { action: 'create' }, formData);
      toast.success('Commande créée avec succès');
      setShowForm(false);
      setFormData({ fournisseur_id: '', date_commande: new Date().toISOString().split('T')[0], statut: 'en_attente', montant_total: 0, devise: 'FCFA', notes: '', articles: [] });
      loadCommandes();
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la création');
    }
  }

  async function updateStatus(id: string, newStatut: string) {
    try {
      await apiCall('commandes.php', { action: 'update_statut' }, { id, statut: newStatut });
      toast.success(`Statut mis à jour : ${newStatut}`);
      loadCommandes();
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la mise à jour');
    }
  }

  async function handleDelete(id: string) {
    if (window.confirm('Supprimer cette commande ?')) {
      try {
        await apiCall('commandes.php', { action: 'delete', id });
        toast.success('Commande supprimée');
        loadCommandes();
      } catch (err: any) {
        toast.error(err.message || 'Erreur lors de la suppression');
      }
    }
  }

  const addArticle = (article: StockArticle) => {
    const existing = formData.articles.find(a => a.article_id === article.id);
    if (existing) {
      setFormData({ ...formData, articles: formData.articles.map(a => a.article_id === article.id ? { ...a, quantite: a.quantite + 1 } : a) });
    } else {
      setFormData({ ...formData, articles: [...formData.articles, { article_id: article.id, quantite: 1, prix_unitaire: 0 }] });
    }
  };

  const removeArticle = (id: string) => {
    setFormData({ ...formData, articles: formData.articles.filter(a => a.article_id !== id) });
  };

  const updateArticleQty = (id: string, qty: number) => {
    setFormData({ ...formData, articles: formData.articles.map(a => a.article_id === id ? { ...a, quantite: qty } : a) });
  };

  const updateArticlePrice = (id: string, price: number) => {
    setFormData({ ...formData, articles: formData.articles.map(a => a.article_id === id ? { ...a, prix_unitaire: price } : a) });
  };

  useEffect(() => {
    const total = formData.articles.reduce((sum, art) => sum + (art.quantite * art.prix_unitaire), 0);
    setFormData(prev => ({ ...prev, montant_total: total }));
  }, [formData.articles]);

  const filteredCommandes = commandes.filter(c => 
    c.fournisseur_nom.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.id.toLowerCase().includes(searchTerm.toLowerCase())
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
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <ShoppingCart className="w-5 h-5 text-blue-700 dark:text-blue-300" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-200">Commandes Fournisseurs</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Gestion des approvisionnements et réceptions de stock</p>
          </div>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
          <Plus className="w-4 h-4" /> Nouvelle commande
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input 
          type="text" 
          placeholder="Rechercher une commande ou un fournisseur..." 
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-200"
        />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Date</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Fournisseur</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Statut</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Montant</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCommandes.map(c => (
              <tr key={c.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="px-4 py-3 dark:text-gray-300">{new Date(c.date_commande).toLocaleDateString('fr-FR')}</td>
                <td className="px-4 py-3 font-medium dark:text-gray-200">{c.fournisseur_nom}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    c.statut === 'recue' ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 
                    c.statut === 'annulee' ? 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300' : 'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                  }`}>
                    {c.statut === 'en_attente' ? 'En attente' : c.statut === 'recue' ? 'Reçue' : 'Annulée'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-bold">{c.montant_total} {c.devise}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {c.statut === 'en_attente' && (
                      <button onClick={() => updateStatus(c.id, 'recue')} className="p-1.5 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded hover:bg-green-100 dark:hover:bg-green-900/50" title="Marquer comme reçue">
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    )}
                    <button onClick={() => updateStatus(c.id, 'annulee')} className="p-1.5 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded hover:bg-red-100 dark:hover:bg-red-900/50" title="Annuler">
                      <X className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(c.id)} className="p-1.5 bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded hover:bg-gray-100 dark:hover:bg-gray-600" title="Supprimer">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredCommandes.length === 0 && (
              <tr><td colSpan={5} className="text-center py-8 text-gray-500 dark:text-gray-400">Aucune commande trouvée</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-3xl p-6 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold dark:text-gray-200">Nouvelle Commande</h2>
              <button onClick={() => setShowForm(false)}><X className="w-5 h-5 text-gray-500 dark:text-gray-400" /></button>
            </div>
            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fournisseur *</label>
                  <select 
                    value={formData.fournisseur_id} 
                    onChange={e => setFormData({ ...formData, fournisseur_id: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
                  >
                    <option value="">Sélectionner...</option>
                    {data.fournisseurs?.map(f => <option key={f.id} value={f.id}>{f.nom}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
                  <input type="date" value={formData.date_commande} onChange={e => setFormData({ ...formData, date_commande: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Devise</label>
                  <select value={formData.devise} onChange={e => setFormData({ ...formData, devise: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600">
                    <option value="FCFA">FCFA</option>
                    <option value="EUR">EUR</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Articles</label>
                <div className="flex gap-2 mb-4">
                  <select 
                    className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
                    onChange={e => {
                      const art = data.stocks?.articles.find(a => a.id === e.target.value);
                      if (art) addArticle(art);
                    }}
                    value=""
                  >
                    <option value="">Ajouter un article...</option>
                    {data.stocks?.articles.map(a => <option key={a.id} value={a.id}>{a.nom} ({a.unite})</option>)}
                  </select>
                </div>
                
                <div className="border rounded-xl overflow-hidden dark:border-gray-600">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                      <tr>
                        <th className="text-left px-4 py-2 font-medium text-gray-600 dark:text-gray-300">Article</th>
                        <th className="text-center px-4 py-2 font-medium text-gray-600 dark:text-gray-300 w-24">Qté</th>
                        <th className="text-right px-4 py-2 font-medium text-gray-600 dark:text-gray-300 w-32">Prix Unitaire</th>
                        <th className="text-right px-4 py-2 font-medium text-gray-600 dark:text-gray-300 w-32">Total</th>
                        <th className="text-center px-4 py-2 w-12"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.articles.map((art, idx) => {
                        const articleInfo = data.stocks?.articles.find(a => a.id === art.article_id);
                        return (
                          <tr key={idx} className="border-b border-gray-100 dark:border-gray-700">
                            <td className="px-4 py-2 font-medium dark:text-gray-200">{articleInfo?.nom || 'Inconnu'}</td>
                            <td className="px-4 py-2">
                              <input type="number" value={art.quantite} onChange={e => updateArticleQty(art.article_id, parseInt(e.target.value) || 0)} className="w-full text-center border rounded px-1 py-1 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600" />
                            </td>
                            <td className="px-4 py-2">
                              <input type="number" value={art.prix_unitaire} onChange={e => updateArticlePrice(art.article_id, parseFloat(e.target.value) || 0)} className="w-full text-right border rounded px-1 py-1 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600" />
                            </td>
                            <td className="px-4 py-2 text-right font-medium dark:text-gray-200">{(art.quantite * art.prix_unitaire).toFixed(2)}</td>
                            <td className="px-4 py-2 text-center">
                              <button type="button" onClick={() => removeArticle(art.article_id)} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 p-1 rounded"><X className="w-4 h-4" /></button>
                            </td>
                          </tr>
                        );
                      })}
                      {formData.articles.length === 0 && (
                        <tr><td colSpan={5} className="text-center py-4 text-gray-400 dark:text-gray-500 italic">Aucun article ajouté</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
                <textarea value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} rows={2} className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600" placeholder="Détails de la commande..."></textarea>
              </div>

              <div className="flex items-center justify-between pt-4 border-t dark:border-gray-600">
                <div className="text-right">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total de la commande</p>
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">{formData.montant_total.toFixed(2)} {formData.devise}</p>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-300">Annuler</button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Enregistrer la commande</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
