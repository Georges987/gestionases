import { db } from './database';
import { Membre, Projet, Don, Transaction, Evenement, AppData } from '../types';
import { initialData } from '../data/initialData';

export async function loadAllData(): Promise<AppData> {
  const [membres, projets, dons, transactions, evenements] = await Promise.all([
    db.membres.toArray(),
    db.projets.toArray(),
    db.dons.toArray(),
    db.transactions.toArray(),
    db.evenements.toArray()
  ]);

  const ong = await db.settings.get('ong');
  const ongData = ong?.value || initialData.ong;

  if (membres.length === 0 && projets.length === 0) {
    await initializeWithInitialData();
    return loadAllData();
  }

  return {
    membres,
    projets,
    dons,
    transactions,
    evenements,
    fournisseurs: [],
    stocks: { articles: [], categories: [], mouvements: [] },
    ong: ongData
  };
}

async function initializeWithInitialData() {
  await db.membres.bulkAdd(initialData.membres);
  await db.projets.bulkAdd(initialData.projets);
  await db.dons.bulkAdd(initialData.dons);
  await db.transactions.bulkAdd(initialData.transactions);
  await db.evenements.bulkAdd(initialData.evenements);
  await db.settings.put({ key: 'ong', value: initialData.ong });
}

export async function addMembre(m: Omit<Membre, 'id'>) {
  const id = crypto.randomUUID();
  await db.membres.add({ ...m, id });
  return id;
}

export async function updateMembre(m: Membre) {
  await db.membres.put(m);
}

export async function deleteMembre(id: string) {
  await db.membres.delete(id);
}

export async function addProjet(p: Omit<Projet, 'id'>) {
  const id = crypto.randomUUID();
  await db.projets.add({ ...p, id });
  return id;
}

export async function updateProjet(p: Projet) {
  await db.projets.put(p);
}

export async function deleteProjet(id: string) {
  await db.projets.delete(id);
}

export async function addDon(d: Omit<Don, 'id'>) {
  const id = crypto.randomUUID();
  await db.dons.add({ ...d, id });
  return id;
}

export async function updateDon(d: Don) {
  await db.dons.put(d);
}

export async function deleteDon(id: string) {
  await db.dons.delete(id);
}

export async function addTransaction(t: Omit<Transaction, 'id'>) {
  const id = crypto.randomUUID();
  await db.transactions.add({ ...t, id });
  return id;
}

export async function updateTransaction(t: Transaction) {
  await db.transactions.put(t);
}

export async function deleteTransaction(id: string) {
  await db.transactions.delete(id);
}

export async function addEvenement(e: Omit<Evenement, 'id'>) {
  const id = crypto.randomUUID();
  await db.evenements.add({ ...e, id });
  return id;
}

export async function updateEvenement(e: Evenement) {
  await db.evenements.put(e);
}

export async function deleteEvenement(id: string) {
  await db.evenements.delete(id);
}

export async function updateONGSettings(ong: AppData['ong']) {
  await db.settings.put({ key: 'ong', value: ong });
}

export async function clearAllData() {
  await db.membres.clear();
  await db.projets.clear();
  await db.dons.clear();
  await db.transactions.clear();
  await db.evenements.clear();
  await db.settings.clear();
}
