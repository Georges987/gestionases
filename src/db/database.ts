import Dexie, { Table } from 'dexie';
import { Membre, Projet, Don, Transaction, Evenement } from '../types';

export class ONGDatabase extends Dexie {
  membres!: Table<Membre, string>;
  projets!: Table<Projet, string>;
  dons!: Table<Don, string>;
  transactions!: Table<Transaction, string>;
  evenements!: Table<Evenement, string>;
  settings!: Table<{ key: string; value: string }, string>;

  constructor() {
    super('ONGDatabase');
    this.version(1).stores({
      membres: 'id, nom, prenom, email, role, statut',
      projets: 'id, titre, responsable, statut, categorie',
      dons: 'id, donateur, email, montant, date, type, statut',
      transactions: 'id, libelle, montant, type, categorie, date, projetId',
      evenements: 'id, titre, date, type, statut, responsable',
      settings: 'key'
    });
  }
}

export const db = new ONGDatabase();

export async function initializeDatabase() {
  const settingsCount = await db.settings.count();
  if (settingsCount === 0) {
    await db.settings.put({ key: 'ong', value: {
      nom: 'Espoir & Solidarité',
      slogan: 'Ensemble, construisons un monde meilleur',
      email: 'contact@espoir-solidarite.org',
      telephone: '+225 07 00 00 00',
      adresse: 'Abidjan, Côte d\'Ivoire',
      siteWeb: 'www.espoir-solidarite.org',
      devise: 'FCFA',
      primaryColor: '#0d9488',
    }});
  }
}

export async function getONGSettings() {
  const setting = await db.settings.get('ong');
  return setting?.value;
}

export async function updateONGSettings(ong: any) {
  await db.settings.put({ key: 'ong', value: ong });
}
