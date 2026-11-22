import { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import { AppData, Membre, Projet, Don, Transaction, Evenement, Module } from '../types';
import { membresApi, projetsApi, donsApi, transactionsApi, evenementsApi, settingsApi, stocksApi, apiCall } from '../api/client';
import { db, initializeDatabase } from '../db/database';

const initialOngData = {
  nom: 'Espoir & Solidarité',
  slogan: 'Ensemble, construisons un monde meilleur',
  email: 'contact@espoir-solidarite.org',
  telephone: '+225 07 00 00 00',
  adresse: "Abidjan, Côte d'Ivoire",
  siteWeb: 'www.espoir-solidarite.org',
  devise: 'FCFA',
  primaryColor: '#0d9488',
};

interface AppContextType {
  data: AppData;
  activeModule: Module;
  setActiveModule: (module: Module) => void;
  loading: boolean;
  apiLoading: boolean;
  apiError: string;
  // Membres
  addMembre: (m: Omit<Membre, 'id'>) => Promise<void>;
  updateMembre: (m: Membre) => Promise<void>;
  deleteMembre: (id: string) => Promise<void>;
  // Projets
  addProjet: (p: Omit<Projet, 'id'>) => Promise<void>;
  updateProjet: (p: Projet) => Promise<void>;
  deleteProjet: (id: string) => Promise<void>;
  // Dons
  addDon: (d: Omit<Don, 'id'>) => Promise<void>;
  updateDon: (d: Don) => Promise<void>;
  deleteDon: (id: string) => Promise<void>;
  // Transactions
  addTransaction: (t: Omit<Transaction, 'id'>) => Promise<void>;
  updateTransaction: (t: Transaction) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  // Evenements
  addEvenement: (e: Omit<Evenement, 'id'>) => Promise<void>;
  updateEvenement: (e: Evenement) => Promise<void>;
  deleteEvenement: (id: string) => Promise<void>;
  // ONG settings
  updateOng: (ong: AppData['ong']) => Promise<void>;
  reloadData: () => Promise<void>;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

const AppContext = createContext<AppContextType | null>(null);

function mapMembre(raw: unknown): Membre {
  const r = raw as any;
  return {
    id: r.id, nom: r.nom, prenom: r.prenom, email: r.email || '',
    telephone: r.telephone || '', role: r.role, statut: r.statut,
    dateAdhesion: r.date_adhesion || '', adresse: r.adresse || '',
    photo: r.photo || undefined, anniversaire: r.anniversaire || undefined
  };
}

function mapProjet(raw: unknown): Projet {
  const r = raw as any;
  return {
    id: r.id, titre: r.titre, description: r.description || '',
    responsable: r.responsable || '', statut: r.statut,
    dateDebut: r.date_debut || '', dateFin: r.date_fin || '',
    budget: r.budget || 0, depenses: r.depenses || 0,
    categorie: r.categorie || '', beneficiaires: r.beneficiaires || 0,
    localisation: r.localisation || '', progression: r.progression || 0
  };
}

function mapDon(raw: unknown): Don {
  const r = raw as any;
  return {
    id: r.id, donateur: r.donateur, email: r.email || '',
    montant: r.montant, devise: r.devise || 'FCFA', date: r.date,
    type: r.type, projetId: r.projet_id || undefined,
    statut: r.statut, recu: !!r.recu, notes: r.notes || ''
  };
}

function mapTransaction(raw: unknown): Transaction {
  const r = raw as any;
  return {
    id: r.id, libelle: r.libelle, montant: r.montant,
    type: r.type, categorie: r.categorie || '', date: r.date,
    projetId: r.projet_id || undefined, validee: !!r.validee
  };
}

function mapEvenement(raw: unknown): Evenement {
  const r = raw as any;
  return {
    id: r.id, titre: r.titre, description: r.description || '',
    date: r.date, heure: r.heure || '', lieu: r.lieu || '',
    type: r.type, statut: r.statut, participants: r.participants || 0,
    responsable: r.responsable || ''
  };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>({
    membres: [], projets: [], dons: [], transactions: [], evenements: [], fournisseurs: [], stocks: { articles: [], categories: [], mouvements: [] }, logs: [], ong: initialOngData
  });
  const [activeModule, setActiveModule] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [apiLoading, setApiLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  async function loadFromAPI() {
    try {
      setApiLoading(true);
      setApiError('');

      // Tentative de chargement depuis l'API (dépend du cookie auth_token)
      // On passe perPage=10000 pour charger toutes les données en mémoire
      const [membresRes, projetsRes, donsRes, trxRes, evtRes, settingsRes, fournisseursRes, stocksArtRes, stocksCatRes, logsRes] = await Promise.all([
        membresApi.list({ perPage: '10000' }).catch(() => null),
        projetsApi.list({ perPage: '10000' }).catch(() => null),
        donsApi.list({ perPage: '10000' }).catch(() => null),
        transactionsApi.list({ perPage: '10000' }).catch(() => null),
        evenementsApi.list({ perPage: '10000' }).catch(() => null),
        settingsApi.get().catch(() => null),
        apiCall('fournisseurs.php', { action: 'list', perPage: '10000' }).catch(() => null),
        stocksApi.articles.list({ perPage: '10000' }).catch(() => null),
        stocksApi.categories.list({ perPage: '10000' }).catch(() => null),
        apiCall('logs.php', { action: 'list', perPage: '20' }).catch(() => null),
      ]);

      // Si tous les appels ont échoué (ex: 401 Unauthorized), on fallback vers Dexie
      if (!membresRes && !projetsRes && !donsRes && !trxRes && !evtRes && !settingsRes && !fournisseursRes) {
        const allData = await import('../db/services').then(m => m.loadAllData());
        setData(allData);
        setLoading(false);
        return;
      }

      let ongData = initialOngData;
      if (settingsRes && (settingsRes as ApiResponse<any>).success) {
        ongData = (settingsRes as ApiResponse<any>).data;
      } else {
        const dexieOng = await db.settings.get('ong');
        if (dexieOng?.value) ongData = dexieOng.value as AppData['ong'];
      }

      const logs = logsRes && (logsRes as ApiResponse<any>).success ? (logsRes as ApiResponse<any>).data : [];

      const newData: AppData = {
        membres: membresRes && (membresRes as ApiResponse<any>).success ? (membresRes as ApiResponse<any>).data.map(mapMembre) : await db.membres.toArray(),
        projets: projetsRes && (projetsRes as ApiResponse<any>).success ? (projetsRes as ApiResponse<any>).data.map(mapProjet) : await db.projets.toArray(),
        dons: donsRes && (donsRes as ApiResponse<any>).success ? (donsRes as ApiResponse<any>).data.map(mapDon) : await db.dons.toArray(),
        transactions: trxRes && (trxRes as ApiResponse<any>).success ? (trxRes as ApiResponse<any>).data.map(mapTransaction) : await db.transactions.toArray(),
        evenements: evtRes && (evtRes as ApiResponse<any>).success ? (evtRes as ApiResponse<any>).data.map(mapEvenement) : await db.evenements.toArray(),
        fournisseurs: fournisseursRes && (fournisseursRes as ApiResponse<any>).success ? (fournisseursRes as ApiResponse<any>).data : [],
        stocks: {
          articles: stocksArtRes && (stocksArtRes as ApiResponse<any>).success ? (stocksArtRes as ApiResponse<any>).data : [],
          categories: stocksCatRes && (stocksCatRes as ApiResponse<any>).success ? (stocksCatRes as ApiResponse<any>).data : [],
          mouvements: [],
        },
        ong: ongData,
        logs,
      };

      setData(newData);
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : 'Une erreur inconnue est survenue');
    } finally {
      setApiLoading(false);
      setLoading(false);
    }
  }

  const reloadData = async () => { await loadFromAPI(); };

  useEffect(() => {
    initializeDatabase();
    loadFromAPI();
  }, []);

  const addMembre = useCallback(async (m: Omit<Membre, 'id'>) => {
    try {
      await membresApi.create({ ...m, dateAdhesion: m.dateAdhesion });
    } catch { await import('../db/services').then(mod => mod.addMembre(m)); }
    await reloadData();
  }, []);
  const updateMembre = useCallback(async (m: Membre) => {
    try {
      await membresApi.update({ ...m, dateAdhesion: m.dateAdhesion });
    } catch { await import('../db/services').then(mod => mod.updateMembre(m)); }
    await reloadData();
  }, []);
  const deleteMembre = useCallback(async (id: string) => {
    try { await membresApi.delete(id); } catch { await import('../db/services').then(mod => mod.deleteMembre(id)); }
    await reloadData();
  }, []);

  const addProjet = useCallback(async (p: Omit<Projet, 'id'>) => {
    try {
      await projetsApi.create({ ...p, dateDebut: p.dateDebut, dateFin: p.dateFin });
    } catch { await import('../db/services').then(mod => mod.addProjet(p)); }
    await reloadData();
  }, []);
  const updateProjet = useCallback(async (p: Projet) => {
    try {
      await projetsApi.update({ ...p, dateDebut: p.dateDebut, dateFin: p.dateFin });
    } catch { await import('../db/services').then(mod => mod.updateProjet(p)); }
    await reloadData();
  }, []);
  const deleteProjet = useCallback(async (id: string) => {
    try { await projetsApi.delete(id); } catch { await import('../db/services').then(mod => mod.deleteProjet(id)); }
    await reloadData();
  }, []);

  const addDon = useCallback(async (d: Omit<Don, 'id'>) => {
    try {
      await donsApi.create({ ...d, projetId: d.projetId });
    } catch { await import('../db/services').then(mod => mod.addDon(d)); }
    await reloadData();
  }, []);
  const updateDon = useCallback(async (d: Don) => {
    try {
      await donsApi.update({ ...d, projetId: d.projetId });
    } catch { await import('../db/services').then(mod => mod.updateDon(d)); }
    await reloadData();
  }, []);
  const deleteDon = useCallback(async (id: string) => {
    try { await donsApi.delete(id); } catch { await import('../db/services').then(mod => mod.deleteDon(id)); }
    await reloadData();
  }, []);

  const addTransaction = useCallback(async (t: Omit<Transaction, 'id'>) => {
    try {
      await transactionsApi.create({ ...t, projetId: t.projetId });
    } catch { await import('../db/services').then(mod => mod.addTransaction(t)); }
    await reloadData();
  }, []);
  const updateTransaction = useCallback(async (t: Transaction) => {
    try {
      await transactionsApi.update({ ...t, projetId: t.projetId });
    } catch { await import('../db/services').then(mod => mod.updateTransaction(t)); }
    await reloadData();
  }, []);
  const deleteTransaction = useCallback(async (id: string) => {
    try { await transactionsApi.delete(id); } catch { await import('../db/services').then(mod => mod.deleteTransaction(id)); }
    await reloadData();
  }, []);

  const addEvenement = useCallback(async (e: Omit<Evenement, 'id'>) => {
    try {
      await evenementsApi.create(e);
    } catch { await import('../db/services').then(mod => mod.addEvenement(e)); }
    await reloadData();
  }, []);
  const updateEvenement = useCallback(async (e: Evenement) => {
    try {
      await evenementsApi.update(e);
    } catch { await import('../db/services').then(mod => mod.updateEvenement(e)); }
    await reloadData();
  }, []);
  const deleteEvenement = useCallback(async (id: string) => {
    try { await evenementsApi.delete(id); } catch { await import('../db/services').then(mod => mod.deleteEvenement(id)); }
    await reloadData();
  }, []);

  const updateOng = useCallback(async (ong: AppData['ong']) => {
    try { await settingsApi.update(ong); }
    catch { await import('../db/database').then(mod => mod.updateONGSettings(ong)); }
    await reloadData();
  }, []);

  const contextValue = useMemo(() => ({
    data, activeModule, setActiveModule, loading, apiLoading, apiError,
    addMembre, updateMembre, deleteMembre,
    addProjet, updateProjet, deleteProjet,
    addDon, updateDon, deleteDon,
    addTransaction, updateTransaction, deleteTransaction,
    addEvenement, updateEvenement, deleteEvenement,
    updateOng, reloadData,
  }), [data, activeModule, loading, apiLoading, apiError, addMembre, updateMembre, deleteMembre, addProjet, updateProjet, deleteProjet, addDon, updateDon, deleteDon, addTransaction, updateTransaction, deleteTransaction, addEvenement, updateEvenement, deleteEvenement, updateOng, reloadData]);

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
