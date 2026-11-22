import { useApp } from '../context/AppContext';
import { useRef } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function Rapports() {
  const { data } = useApp();
  const { membres, projets, dons, transactions, evenements, ong } = data;

  const totalDons = dons.filter(d => d.statut === 'recu').reduce((s, d) => s + d.montant, 0);
  const totalRecettes = transactions.filter(t => t.type === 'recette').reduce((s, t) => s + t.montant, 0);
  const totalDepenses = transactions.filter(t => t.type === 'depense').reduce((s, t) => s + t.montant, 0);
  const solde = totalRecettes - totalDepenses;

  const exportPDF = (type: string) => {
    const doc = new jsPDF();
    const dateStr = format(new Date(), 'dd/MM/yyyy');

    doc.setFontSize(18);
    doc.text(ong.nom, 14, 22);
    doc.setFontSize(10);
    doc.text(ong.slogan, 14, 28);
    doc.text(`Date: ${dateStr}`, 14, 34);

    doc.setFontSize(14);
    doc.text(`Rapport: ${type}`, 14, 44);

    let y = 52;

    if (type === 'Général' || type === 'Membres') {
      doc.setFontSize(12);
      doc.text('Membres', 14, y);
      y += 6;
      const membresData = membres.map(m => [
        `${m.prenom} ${m.nom}`,
        m.email,
        m.role,
        m.statut,
        format(new Date(m.dateAdhesion), 'dd/MM/yyyy')
      ]);
      autoTable(doc, {
        startY: y,
        head: [['Nom', 'Email', 'Rôle', 'Statut', 'Adhésion']],
        body: membresData,
        theme: 'striped',
        headStyles: { fillColor: [22, 163, 74] },
      });
      y = (doc as any).lastAutoTable.finalY + 10;
    }

    if (type === 'Général' || type === 'Projets') {
      doc.setFontSize(12);
      doc.text('Projets', 14, y);
      y += 6;
      const projetsData = projets.map(p => [
        p.titre,
        p.responsable,
        p.statut,
        `${p.progression}%`,
        `${p.budget.toLocaleString()} FCFA`
      ]);
      autoTable(doc, {
        startY: y,
        head: [['Titre', 'Responsable', 'Statut', 'Progression', 'Budget']],
        body: projetsData,
        theme: 'striped',
        headStyles: { fillColor: [22, 163, 74] },
      });
      y = (doc as any).lastAutoTable.finalY + 10;
    }

    if (type === 'Général' || type === 'Finances') {
      doc.setFontSize(12);
      doc.text('Finances', 14, y);
      y += 6;
      const financeData = [
        ['Total Dons', `${totalDons.toLocaleString()} FCFA`],
        ['Total Recettes', `${totalRecettes.toLocaleString()} FCFA`],
        ['Total Dépenses', `${totalDepenses.toLocaleString()} FCFA`],
        ['Solde', `${solde.toLocaleString()} FCFA`]
      ];
      autoTable(doc, {
        startY: y,
        body: financeData,
        theme: 'plain',
        styles: { fontSize: 10 },
      });
      y = (doc as any).lastAutoTable.finalY + 10;
    }

    doc.save(`rapport_${type.toLowerCase()}_${format(new Date(), 'yyyyMMdd')}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">Rapports et Exportations</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm">Générez des rapports détaillés sur les activités de l'ONG</p>
      </div>

      {/* Statistiques générales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <p className="text-gray-500 dark:text-gray-400 text-sm">Total Membres</p>
          <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">{membres.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <p className="text-gray-500 dark:text-gray-400 text-sm">Total Projets</p>
          <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">{projets.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <p className="text-gray-500 dark:text-gray-400 text-sm">Total Dons</p>
          <p className="text-2xl font-bold text-green-700 dark:text-green-400">{totalDons.toLocaleString()} FCFA</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <p className="text-gray-500 dark:text-gray-400 text-sm">Solde</p>
          <p className={`text-2xl font-bold ${solde >= 0 ? 'text-green-700 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {solde.toLocaleString()} FCFA
          </p>
        </div>
      </div>

      {/* Boutons d'export */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-4">Exporter les données (PDF)</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <button
            onClick={() => exportPDF('Général')}
            className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/30 hover:border-green-300 dark:hover:border-green-600 transition-colors text-left"
          >
            <p className="font-medium text-gray-800 dark:text-gray-200">Rapport Général</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Toutes les données</p>
          </button>
          <button
            onClick={() => exportPDF('Membres')}
            className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:border-blue-300 dark:hover:border-blue-600 transition-colors text-left"
          >
            <p className="font-medium text-gray-800 dark:text-gray-200">Membres</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{membres.length} membres</p>
          </button>
          <button
            onClick={() => exportPDF('Projets')}
            className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/30 hover:border-purple-300 dark:hover:border-purple-600 transition-colors text-left"
          >
            <p className="font-medium text-gray-800 dark:text-gray-200">Projets</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{projets.length} projets</p>
          </button>
          <button
            onClick={() => exportPDF('Finances')}
            className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:border-emerald-300 dark:hover:border-emerald-600 transition-colors text-left"
          >
            <p className="font-medium text-gray-800 dark:text-gray-200">Finances</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Recettes & Dépenses</p>
          </button>
        </div>
      </div>

      {/* Aperçu rapide */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">Dons récents</h3>
          <div className="space-y-2">
            {dons.slice(0, 5).map(don => (
              <div key={don.id} className="flex justify-between items-center text-sm">
                <span className="text-gray-700 dark:text-gray-300">{don.donateur}</span>
                <span className="font-medium text-green-700 dark:text-green-400">{don.montant.toLocaleString()} FCFA</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">Événements à venir</h3>
          <div className="space-y-2">
            {evenements.filter(e => new Date(e.date) >= new Date()).slice(0, 5).map(evt => (
              <div key={evt.id} className="flex justify-between items-center text-sm">
                <span className="text-gray-700 dark:text-gray-300">{evt.titre}</span>
                <span className="text-gray-500 dark:text-gray-400">{format(new Date(evt.date), 'dd MMM yyyy', { locale: fr })}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
