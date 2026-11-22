import { useState, useEffect, useMemo } from 'react';
import {
  Package, Plus, Search, AlertTriangle, ArrowUpCircle, ArrowDownCircle,
  Trash2, Edit2, X, ChevronDown, BarChart3, FileText, Eye, ChevronLeft, ChevronRight
} from 'lucide-react';
import { StockArticle, StockCategorie, StockMouvement } from '../types';
import { stocksApi } from '../api/client';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import toast from 'react-hot-toast';
import { validateRequired } from '../utils/validation';
import { useApp } from '../context/AppContext';
import { hexToRgb } from '../utils/colors';

type TabType = 'articles' | 'mouvements' | 'categories';

export default function Stocks() {
  const [activeTab, setActiveTab] = useState<TabType>('articles');
  const [articles, setArticles] = useState<StockArticle[]>([]);
  const [categories, setCategories] = useState<StockCategorie[]>([]);
  const [mouvements, setMouvements] = useState<StockMouvement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showLowStock, setShowLowStock] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showMouvementForm, setShowMouvementForm] = useState(false);
  const [editingArticle, setEditingArticle] = useState<StockArticle | null>(null);
  const [showDetail, setShowDetail] = useState<StockArticle | null>(null);

  const [formData, setFormData] = useState({
    nom: '', description: '', categorie_id: '', quantite: 0, seuil_alerte: 5, unite: 'unité'
  });
  const [mouvementData, setMouvementData] = useState({
    article_id: '', type: 'entree' as 'entree' | 'sortie', quantite: 1, motif: '', date: new Date().toISOString().split('T')[0]
  });
  const [categorieForm, setCategorieForm] = useState({ nom: '', description: '' });
  const [showCategorieForm, setShowCategorieForm] = useState(false);
  const [showInlineCategorieForm, setShowInlineCategorieForm] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize] = useState(10);

  useEffect(() => { loadData(); }, [showLowStock]);

  async function loadData() {
    setLoading(true);
    try {
      const [articlesRes, categoriesRes, mouvementsRes] = await Promise.all([
        stocksApi.articles.list(showLowStock ? { low_stock: 'true' } : {}),
        stocksApi.categories.list(),
        stocksApi.mouvements.list()
      ]);
      setArticles((articlesRes as any).data || []);
      setCategories((categoriesRes as any).data || []);
      setMouvements((mouvementsRes as any).data || []);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  }
  
  async function handleCreateArticle() {
    try {
      if (!validateRequired(formData.nom)) {
        toast.error('Le nom de l\'article est obligatoire');
        return;
      }
      if (formData.quantite < 0 || formData.seuil_alerte < 0) {
        toast.error('Les quantités et seuils ne peuvent pas être négatifs');
        return;
      }

      if (editingArticle) {
        await stocksApi.articles.update({ id: editingArticle.id, ...formData });
        toast.success('Article modifié avec succès');
      } else {
        await stocksApi.articles.create(formData);
        toast.success('Article créé avec succès');
      }
      resetForm();
      loadData();
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Erreur lors de la création'); }
  }
  
  async function handleMouvement() {
    try {
      if (!mouvementData.article_id) {
        toast.error('Veuillez sélectionner un article');
        return;
      }
      if (mouvementData.quantite <= 0) {
        toast.error('La quantité doit être supérieure à 0');
        return;
      }

      await stocksApi.mouvements.create(mouvementData);
      toast.success('Mouvement enregistré');
      setMouvementData({ article_id: '', type: 'entree', quantite: 1, motif: '', date: new Date().toISOString().split('T')[0] });
      setShowMouvementForm(false);
      loadData();
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Erreur lors de l\'enregistrement'); }
  }
  
  async function handleDeleteArticle(id: string) {
    if (window.confirm('Supprimer cet article ?')) {
      try {
        await stocksApi.articles.delete(id);
        toast.success('Article supprimé');
        loadData();
      } catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Erreur lors de la suppression'); }
    }
  }
  
  async function handleCreateCategorie() {
    if (categories.some(c => c.nom.toLowerCase() === categorieForm.nom.toLowerCase())) {
      toast.error('Une catégorie avec ce nom existe déjà');
      return;
    }
    try {
      await stocksApi.categories.create(categorieForm);
      toast.success('Catégorie créée');
      setCategorieForm({ nom: '', description: '' });
      setShowCategorieForm(false);
      loadData();
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Erreur lors de la création'); }
  }

  async function handleInlineCreateCategorie() {
    if (!newCatName.trim()) {
      toast.error('Le nom est requis');
      return;
    }
    if (categories.some(c => c.nom.toLowerCase() === newCatName.trim().toLowerCase())) {
      toast.error('Une catégorie avec ce nom existe déjà');
      return;
    }
    try {
      const created = await stocksApi.categories.create({ nom: newCatName.trim(), description: '' });
      toast.success('Catégorie créée');
      setNewCatName('');
      setShowInlineCategorieForm(false);
      await loadData();
      setFormData({ ...formData, categorie_id: (created as any).id || '' });
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Erreur lors de la création'); }
  }
  
  async function handleDeleteCategorie(id: string) {
    if (window.confirm('Supprimer cette catégorie ?')) {
      try {
        await stocksApi.categories.delete(id);
        toast.success('Catégorie supprimée');
        loadData();
      } catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Erreur lors de la suppression'); }
    }
  }

  function resetForm() {
    setFormData({ nom: '', description: '', categorie_id: '', quantite: 0, seuil_alerte: 5, unite: 'unité' });
    setShowForm(false);
    setEditingArticle(null);
    setShowInlineCategorieForm(false);
    setNewCatName('');
  }

  function editArticle(article: StockArticle) {
    setEditingArticle(article);
    setFormData({
      nom: article.nom, description: article.description || '', categorie_id: article.categorie_id || '',
      quantite: article.quantite, seuil_alerte: article.seuil_alerte, unite: article.unite
    });
    setShowForm(true);
  }

  function exportPDF() {
    if (articles.length === 0) {
      toast.error('Aucun article à exporter');
      return;
    }
    try {
      const { data } = useApp();
      const primaryColor = hexToRgb(data.ong.primaryColor || '#0d9488');
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text('Inventaire des Stocks', 14, 20);
      doc.setFontSize(10);
      doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, 14, 28);
  
      const tableData = articles.map(a => [
        a.nom,
        a.categorie_nom || '—',
        a.quantite.toString(),
        a.unite,
        a.quantite <= a.seuil_alerte ? '⚠ Bas' : 'OK',
        a.seuil_alerte.toString()
      ]);
  
      autoTable(doc, {
        startY: 35,
        head: [['Article', 'Catégorie', 'Quantité', 'Unité', 'Statut', 'Seuil']],
        body: tableData,
        styles: { fontSize: 9 },
        headStyles: { fillColor: primaryColor }
      });
  
      doc.save(`inventaire_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('Export PDF réussi');
    } catch (err) {
      console.error('Erreur export PDF:', err);
      toast.error('Une erreur est survenue lors de l\'export PDF');
    }
  }

  const filteredArticles = useMemo(() => articles.filter(a =>
    a.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (a.description || '').toLowerCase().includes(searchTerm.toLowerCase())
  ), [articles, searchTerm]);

  const lowStockCount = useMemo(() => articles.filter(a => a.quantite <= a.seuil_alerte).length, [articles]);
  const totalArticles = articles.length;
  const totalCategories = categories.length;

  const totalPages = Math.ceil(filteredArticles.length / pageSize);
  const paginatedArticles = useMemo(() => {
    return filteredArticles.slice(page * pageSize, (page + 1) * pageSize);
  }, [filteredArticles, page, pageSize]);

  // Reset page when search term changes
  useEffect(() => setPage(0), [searchTerm]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full dark:border-green-400"></div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <Package className="w-5 h-5 text-green-700 dark:text-green-300" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-200">Gestion des Stocks</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Articles, mouvements et inventaire</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={exportPDF} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-300">
            <FileText className="w-4 h-4" /> Export PDF
          </button>
          <button onClick={() => { setMouvementData({ ...mouvementData, article_id: '', type: 'entree', quantite: 1, motif: '', date: new Date().toISOString().split('T')[0] }); setShowMouvementForm(true); }} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">
            <ArrowUpCircle className="w-4 h-4" /> Mouvement
          </button>
          <button onClick={() => { resetForm(); setShowForm(true); }} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">
            <Plus className="w-4 h-4" /> Article
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Total articles</p>
            <p className="text-2xl font-bold dark:text-gray-200">{totalArticles}</p>
          </div>
          <Package className="w-8 h-8 text-green-600" />
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Catégories</p>
            <p className="text-2xl font-bold dark:text-gray-200">{totalCategories}</p>
          </div>
          <BarChart3 className="w-8 h-8 text-blue-600" />
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Stock faible</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">{lowStockCount}</p>
          </div>
          <AlertTriangle className="w-8 h-8 text-red-600" />
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Mouvements</p>
            <p className="text-2xl font-bold dark:text-gray-200">{mouvements.length}</p>
          </div>
          <ArrowUpCircle className="w-8 h-8 text-purple-600" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1 w-fit">
        {(['articles', 'mouvements', 'categories'] as TabType[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm rounded-md transition-colors ${activeTab === tab ? 'bg-white dark:bg-gray-600 shadow text-gray-900 dark:text-gray-100 font-medium' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}`}
          >
            {tab === 'articles' ? 'Articles' : tab === 'mouvements' ? 'Mouvements' : 'Catégories'}
          </button>
        ))}
      </div>

      {/* Articles Tab */}
      {activeTab === 'articles' && (
        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un article..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-gray-200"
              />
            </div>
            <button
              onClick={() => setShowLowStock(!showLowStock)}
              className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-sm ${showLowStock ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700 text-red-700 dark:text-red-400' : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400'}`}
            >
              <AlertTriangle className="w-4 h-4" /> Stock faible
            </button>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800/70 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Article</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Catégorie</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Quantité</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Unité</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Statut</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedArticles.map(article => (
                  <tr key={article.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium dark:text-gray-200">{article.nom}</p>
                        {article.description && <p className="text-gray-500 dark:text-gray-400 text-xs truncate max-w-xs">{article.description}</p>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{article.categorie_nom || '—'}</td>
                    <td className={`px-4 py-3 text-right font-medium ${article.quantite <= article.seuil_alerte ? 'text-red-600 dark:text-red-400' : 'dark:text-gray-200'}`}>{article.quantite}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{article.unite}</td>
                    <td className="px-4 py-3 text-center">
                      {article.quantite <= article.seuil_alerte ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full text-xs"><AlertTriangle className="w-3 h-3" /> Faible</span>
                      ) : (
                        <span className="px-2 py-1 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs">OK</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setShowDetail(article)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded" title="Détails"><Eye className="w-4 h-4 text-gray-600 dark:text-gray-400" /></button>
                        <button onClick={() => editArticle(article)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded" title="Modifier"><Edit2 className="w-4 h-4 text-blue-600" /></button>
                        <button onClick={() => handleDeleteArticle(article.id)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded" title="Supprimer"><Trash2 className="w-4 h-4 text-red-600" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {paginatedArticles.length === 0 && (
                  <tr><td colSpan={6} className="text-center py-8 text-gray-500 dark:text-gray-400">Aucun article trouvé</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-3">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Page {page + 1} sur {totalPages} — {filteredArticles.length} résultat{filteredArticles.length > 1 ? 's' : ''}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                      i === page ? 'bg-green-600 text-white' : 'border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page === totalPages - 1}
                  className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mouvements Tab */}
      {activeTab === 'mouvements' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800/70 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Date</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Article</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Type</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Quantité</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Motif</th>
              </tr>
            </thead>
            <tbody>
              {mouvements.map(mvt => (
                <tr key={mvt.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-4 py-3 dark:text-gray-300">{new Date(mvt.date).toLocaleDateString('fr-FR')}</td>
                  <td className="px-4 py-3 font-medium dark:text-gray-200">{mvt.article_nom}</td>
                  <td className="px-4 py-3 text-center">
                    {mvt.type === 'entree' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs"><ArrowUpCircle className="w-3 h-3" /> Entrée</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full text-xs"><ArrowDownCircle className="w-3 h-3" /> Sortie</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-medium dark:text-gray-200">{mvt.quantite}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{mvt.motif || '—'}</td>
                </tr>
              ))}
              {mouvements.length === 0 && (
                <tr><td colSpan={5} className="text-center py-8 text-gray-500 dark:text-gray-400">Aucun mouvement</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Catégories Tab */}
      {activeTab === 'categories' && (
        <div className="space-y-4">
          <button onClick={() => setShowCategorieForm(true)} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">
            <Plus className="w-4 h-4" /> Nouvelle catégorie
          </button>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map(cat => (
              <div key={cat.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium dark:text-gray-200">{cat.nom}</h3>
                    {cat.description && <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{cat.description}</p>}
                    <p className="text-green-600 dark:text-green-400 text-sm mt-2">{cat.article_count || 0} article(s)</p>
                  </div>
                  <button onClick={() => handleDeleteCategorie(cat.id)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          {categories.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">Aucune catégorie</div>
          )}
        </div>
      )}

      {/* Article Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold dark:text-gray-200">{editingArticle ? 'Modifier' : 'Nouvel'} article</h2>
              <button onClick={resetForm}><X className="w-5 h-5 text-gray-500 dark:text-gray-400" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom *</label>
                <input type="text" value={formData.nom} onChange={e => setFormData({ ...formData, nom: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={2} className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Catégorie</label>
                  <select value={showInlineCategorieForm ? '__new__' : formData.categorie_id} onChange={e => {
                    if (e.target.value === '__new__') {
                      setShowInlineCategorieForm(true);
                    } else {
                      setShowInlineCategorieForm(false);
                      setFormData({ ...formData, categorie_id: e.target.value });
                    }
                  }} className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600">
                    <option value="">Aucune</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
                    <option value="__new__">+ Nouvelle catégorie...</option>
                  </select>
                  {showInlineCategorieForm && (
                    <div className="mt-2 flex gap-2">
                      <input type="text" value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder="Nom de la catégorie" onKeyDown={e => e.key === 'Enter' && handleInlineCreateCategorie()} className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600" />
                      <button onClick={handleInlineCreateCategorie} className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">Créer</button>
                      <button onClick={() => { setShowInlineCategorieForm(false); setNewCatName(''); }} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-300">Annuler</button>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Unité</label>
                  <input type="text" value={formData.unite} onChange={e => setFormData({ ...formData, unite: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {!editingArticle && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Quantité initiale</label>
                    <input type="number" value={formData.quantite} onChange={e => setFormData({ ...formData, quantite: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600" />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Seuil alerte</label>
                  <input type="number" value={formData.seuil_alerte} onChange={e => setFormData({ ...formData, seuil_alerte: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600" />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={resetForm} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-300">Annuler</button>
              <button onClick={handleCreateArticle} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">{editingArticle ? 'Modifier' : 'Créer'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Mouvement Form Modal */}
      {showMouvementForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold dark:text-gray-200">Nouveau mouvement de stock</h2>
              <button onClick={() => setShowMouvementForm(false)}><X className="w-5 h-5 text-gray-500 dark:text-gray-400" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Article *</label>
                <select value={mouvementData.article_id} onChange={e => setMouvementData({ ...mouvementData, article_id: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600">
                  <option value="">Sélectionner...</option>
                  {articles.map(a => <option key={a.id} value={a.id}>{a.nom} (stock: {a.quantite})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type *</label>
                  <select value={mouvementData.type} onChange={e => setMouvementData({ ...mouvementData, type: e.target.value as 'entree' | 'sortie' })} className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600">
                    <option value="entree">Entrée</option>
                    <option value="sortie">Sortie</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Quantité *</label>
                  <input type="number" min="1" value={mouvementData.quantite} onChange={e => setMouvementData({ ...mouvementData, quantite: parseInt(e.target.value) || 1 })} className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
                <input type="date" value={mouvementData.date} onChange={e => setMouvementData({ ...mouvementData, date: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Motif</label>
                <input type="text" value={mouvementData.motif} onChange={e => setMouvementData({ ...mouvementData, motif: e.target.value })} placeholder="Ex: Réception fournisseur, Distribution..." className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600" />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowMouvementForm(false)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-300">Annuler</button>
              <button onClick={handleMouvement} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">Enregistrer</button>
            </div>
          </div>
        </div>
      )}

      {/* Catégorie Form Modal */}
      {showCategorieForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold dark:text-gray-200">Nouvelle catégorie</h2>
              <button onClick={() => { setShowCategorieForm(false); setCategorieForm({ nom: '', description: '' }); }}><X className="w-5 h-5 text-gray-500 dark:text-gray-400" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom *</label>
                <input type="text" value={categorieForm.nom} onChange={e => setCategorieForm({ ...categorieForm, nom: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea value={categorieForm.description} onChange={e => setCategorieForm({ ...categorieForm, description: e.target.value })} rows={2} className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600" />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => { setShowCategorieForm(false); setCategorieForm({ nom: '', description: '' }); }} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-300">Annuler</button>
              <button onClick={handleCreateCategorie} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">Créer</button>
            </div>
          </div>
        </div>
      )}

      {/* Article Detail Modal */}
      {showDetail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold dark:text-gray-200">{showDetail.nom}</h2>
              <button onClick={() => setShowDetail(null)}><X className="w-5 h-5 text-gray-500 dark:text-gray-400" /></button>
            </div>
            <div className="space-y-2">
              {showDetail.description && <p className="text-gray-600 dark:text-gray-400">{showDetail.description}</p>}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-gray-500 dark:text-gray-400">Catégorie:</span> <span className="font-medium dark:text-gray-200">{showDetail.categorie_nom || '—'}</span></div>
                <div><span className="text-gray-500 dark:text-gray-400">Quantité:</span> <span className={`font-medium dark:text-gray-200 ${showDetail.quantite <= showDetail.seuil_alerte ? 'text-red-600' : ''}`}>{showDetail.quantite} {showDetail.unite}</span></div>
                <div><span className="text-gray-500 dark:text-gray-400">Seuil alerte:</span> <span className="font-medium dark:text-gray-200">{showDetail.seuil_alerte}</span></div>
                <div><span className="text-gray-500 dark:text-gray-400">Statut:</span> <span className={`font-medium ${showDetail.quantite <= showDetail.seuil_alerte ? 'text-red-600' : 'text-green-600'}`}>{showDetail.quantite <= showDetail.seuil_alerte ? 'Stock faible' : 'OK'}</span></div>
              </div>
            </div>
            {showDetail.mouvements && showDetail.mouvements.length > 0 && (
              <div>
                <h3 className="font-medium dark:text-gray-200 mb-2">Historique des mouvements</h3>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {showDetail.mouvements.map(m => (
                    <div key={m.id} className="flex items-center gap-2 text-sm p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      {m.type === 'entree' ? <ArrowUpCircle className="w-4 h-4 text-green-600" /> : <ArrowDownCircle className="w-4 h-4 text-red-600" />}
                      <span className="font-medium dark:text-gray-200">{m.type === 'entree' ? '+' : '-'}{m.quantite}</span>
                      <span className="text-gray-500 dark:text-gray-400">{new Date(m.date).toLocaleDateString('fr-FR')}</span>
                      {m.motif && <span className="text-gray-600 dark:text-gray-400 truncate">— {m.motif}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
