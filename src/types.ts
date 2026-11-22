export type Module =
  | 'dashboard'
  | 'membres'
  | 'projets'
  | 'dons'
  | 'finances'
  | 'evenements'
  | 'stocks'
  | 'fournisseurs'
  | 'commandes'
  | 'rapports'
  | 'parametres'
  | 'logs';

export interface Notification {
  id: string;
  type: 'stock' | 'don' | 'event' | 'birthday';
  title: string;
  message: string;
  count: number;
  icon: string;
  color: string;
  module: Module;
}

export interface Membre {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  role: 'administrateur' | 'president' | 'directeur' | 'tresorier' | 'secretaire' | 'coordinateur' | 'chef_projet' | 'responsable_programme' | 'logisticien' | 'charge_mission' | 'responsable_partenaire' | 'rh' | 'comptable' | 'charge_communication' | 'juriste' | 'superviseur_zone' | 'animateur_communautaire' | 'formateur' | 'technicien' | 'benevole' | 'donateur' | 'membre';
  statut: 'actif' | 'inactif';
  dateAdhesion: string;
  adresse: string;
  photo?: string;
  anniversaire?: string; // Format MM-DD
}

export interface Projet {
  id: string;
  titre: string;
  description: string;
  responsable: string;
  statut: 'planifie' | 'en_cours' | 'termine' | 'suspendu';
  dateDebut: string;
  dateFin: string;
  budget: number;
  depenses: number;
  categorie: string;
  beneficiaires: number;
  localisation: string;
  progression: number;
}

export interface Don {
  id: string;
  donateur: string;
  email: string;
  montant: number;
  devise: string;
  date: string;
  type: 'financier' | 'materiel' | 'service';
  projetId?: string;
  statut: 'recu' | 'en_attente' | 'annule';
  recu: boolean;
  notes: string;
}

export interface Transaction {
  id: string;
  libelle: string;
  montant: number;
  type: 'recette' | 'depense';
  categorie: string;
  date: string;
  projetId?: string;
  validee: boolean;
}

export interface Evenement {
  id: string;
  titre: string;
  description: string;
  date: string;
  heure: string;
  lieu: string;
  type: 'reunion' | 'formation' | 'collecte' | 'sensibilisation' | 'autre';
  statut: 'planifie' | 'confirme' | 'termine' | 'annule';
  participants: number;
  responsable: string;
}

export interface AppData {
  membres: Membre[];
  projets: Projet[];
  dons: Don[];
  transactions: Transaction[];
  evenements: Evenement[];
  fournisseurs: Fournisseur[];
  logs?: any[];
  stocks: {
    articles: StockArticle[];
    categories: StockCategorie[];
    mouvements: StockMouvement[];
  };
  ong: {
    nom: string;
    slogan: string;
    email: string;
    telephone: string;
    adresse: string;
    siteWeb: string;
    devise: string;
    primaryColor?: string;
    logo?: string;
  };
}

export interface Utilisateur {
  id: number;
  nom: string;
  email: string;
  role: 'administrateur' | 'gestionnaire' | 'lecteur';
  actif: boolean;
  date_creation: string;
  derniere_connexion: string | null;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: Utilisateur | null;
  token: string | null;
}

export interface StockCategorie {
  id: string;
  nom: string;
  description: string;
  article_count?: number;
}

export interface StockArticle {
  id: string;
  nom: string;
  description: string;
  categorie_id: string | null;
  categorie_nom?: string;
  quantite: number;
  seuil_alerte: number;
  unite: string;
  projet_id: string | null;
  mouvements?: StockMouvement[];
}

export interface StockMouvement {
  id: string;
  article_id: string;
  article_nom?: string;
  type: 'entree' | 'sortie';
  quantite: number;
  motif: string;
  projet_id: string | null;
  utilisateur_id: string | null;
  date: string;
}

export interface Fournisseur {
  id: string;
  nom: string;
  contact_nom: string;
  email: string;
  telephone: string;
  adresse: string;
  categorie: string;
  notes: string;
}

export interface CommandeFournisseur {
  id: string;
  fournisseur_id: string;
  fournisseur_nom: string;
  date_commande: string;
  statut: 'en_attente' | 'recue' | 'annulee';
  montant_total: number;
  devise: string;
  notes: string;
  articles: CommandeArticle[];
}

export interface CommandeArticle {
  id: string;
  commande_id: string;
  article_id: string;
  quantite: number;
  prix_unitaire: number;
}
