import { Users, FolderKanban, Heart, Wallet, TrendingUp, TrendingDown, Calendar, Target, FileDown } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { useApp } from '../context/AppContext';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const COLORS = ['#16a34a', '#eab308', '#3b82f6', '#ef4444', '#8b5cf6'];

function fmt(n: number) {
  return n.toLocaleString('fr-FR') + ' FCFA';
}

export default function Dashboard() {
  const { data } = useApp();
  const { membres, projets, dons, transactions, evenements, ong } = data;

  const totalDons = dons.filter(d => d.statut === 'recu').reduce((s, d) => s + d.montant, 0);
  const totalRecettes = transactions.filter(t => t.type === 'recette').reduce((s, t) => s + t.montant, 0);
  const totalDepenses = transactions.filter(t => t.type === 'depense').reduce((s, t) => s + t.montant, 0);
  const solde = totalRecettes - totalDepenses;
  const membresActifs = membres.filter(m => m.statut === 'actif').length;
  const projetsEnCours = projets.filter(p => p.statut === 'en_cours').length;
  const evtsAVenir = evenements.filter(e => new Date(e.date) >= new Date() && e.statut !== 'annule').length;

  // Chart data: recettes vs dépenses par mois
  const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun'];
  const financeData = months.map((m, i) => {
    const monthIdx = i + 1;
    const rec = transactions
      .filter(t => t.type === 'recette' && new Date(t.date).getMonth() + 1 === monthIdx)
      .reduce((s, t) => s + t.montant, 0);
    const dep = transactions
      .filter(t => t.type === 'depense' && new Date(t.date).getMonth() + 1 === monthIdx)
      .reduce((s, t) => s + t.montant, 0);
    return { mois: m, Recettes: rec / 1000, Dépenses: dep / 1000 };
  });

  // Projets par statut
  const projetStats = [
    { name: 'En cours', value: projets.filter(p => p.statut === 'en_cours').length },
    { name: 'Planifié', value: projets.filter(p => p.statut === 'planifie').length },
    { name: 'Terminé', value: projets.filter(p => p.statut === 'termine').length },
    { name: 'Suspendu', value: projets.filter(p => p.statut === 'suspendu').length },
  ].filter(x => x.value > 0);



  const stats = [
    { label: 'Membres actifs', value: membresActifs, icon: Users, color: 'bg-blue-500', light: 'bg-blue-50', text: 'text-blue-600' },
    { label: 'Projets en cours', value: projetsEnCours, icon: FolderKanban, color: 'bg-green-500', light: 'bg-green-50', text: 'text-green-600' },
    { label: 'Total des dons', value: fmt(totalDons), icon: Heart, color: 'bg-red-500', light: 'bg-red-50', text: 'text-red-600', small: true },
    { label: 'Solde trésorerie', value: fmt(solde), icon: Wallet, color: solde >= 0 ? 'bg-emerald-500' : 'bg-orange-500', light: solde >= 0 ? 'bg-emerald-50' : 'bg-orange-50', text: solde >= 0 ? 'text-emerald-600' : 'text-orange-600', small: true },
  ];

  const recentDons = [...dons]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);
  const upcomingEvents = evenements
    .filter(e => new Date(e.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 4);

  const exportDashboardPDF = () => {
    console.log('Début export PDF Dashboard');
    try {
      const doc = new jsPDF();
      const dateStr = new Date().toLocaleDateString('fr-FR');
      
      // En-tête
      doc.setFontSize(20);
      doc.text(ong.nom, 14, 22);
      doc.setFontSize(12);
      doc.text(ong.slogan, 14, 28);
      doc.text(`Tableau de bord - ${dateStr}`, 14, 34);
      
      let y = 44;
      
      // Statistiques principales
      doc.setFontSize(16);
      doc.text('Statistiques principales', 14, y);
      y += 10;
      
      const statsData = [
        ['Membres actifs', membresActifs.toString()],
        ['Projets en cours', projetsEnCours.toString()],
        ['Total des dons', `${totalDons.toLocaleString()} FCFA`],
        ['Solde de trésorerie', `${solde.toLocaleString()} FCFA`]
      ];
      
      (doc as any).autoTable({
        startY: y,
        head: [['Indicateur', 'Valeur']],
        body: statsData,
        theme: 'striped',
        headStyles: { fillColor: [22, 163, 74] },
        margin: { left: 14, right: 14 }
      });
      y = (doc as any).lastAutoTable.finalY + 15;
      
      // Données financières
      if (y > 250) { doc.addPage(); y = 20; }
      doc.setFontSize(16);
      doc.text('Évolution financière (en milliers FCFA)', 14, y);
      y += 10;
      
      const financeTableData = financeData.map(item => [
        item.mois,
        item.Recettes.toFixed(1),
        item.Dépenses.toFixed(1)
      ]);
      
      (doc as any).autoTable({
        startY: y,
        head: [['Mois', 'Recettes', 'Dépenses']],
        body: financeTableData,
        theme: 'striped',
        headStyles: { fillColor: [22, 163, 74] },
        margin: { left: 14, right: 14 }
      });
      y = (doc as any).lastAutoTable.finalY + 15;
      
      // Projets par statut
      if (y > 250) { doc.addPage(); y = 20; }
      doc.setFontSize(16);
      doc.text('Répartition des projets par statut', 14, y);
      y += 10;
      
      const projetTableData = projetStats.map(p => [p.name, p.value.toString()]);
      
      (doc as any).autoTable({
        startY: y,
        head: [['Statut', 'Nombre']],
        body: projetTableData,
        theme: 'striped',
        headStyles: { fillColor: [22, 163, 74] },
        margin: { left: 14, right: 14 }
      });
      y = (doc as any).lastAutoTable.finalY + 15;
      
      // Derniers dons
      if (y > 250) { doc.addPage(); y = 20; }
      doc.setFontSize(16);
      doc.text('Derniers dons reçus', 14, y);
      y += 10;
      
      const donsTableData = recentDons.map(don => [
        don.donateur,
        new Date(don.date).toLocaleDateString('fr-FR'),
        `${don.montant.toLocaleString()} FCFA`,
        don.statut === 'recu' ? 'Reçu' : don.statut === 'en_attente' ? 'En attente' : 'Annulé'
      ]);
      
      (doc as any).autoTable({
        startY: y,
        head: [['Donateur', 'Date', 'Montant', 'Statut']],
        body: donsTableData,
        theme: 'striped',
        headStyles: { fillColor: [22, 163, 74] },
        margin: { left: 14, right: 14 }
      });
      y = (doc as any).lastAutoTable.finalY + 15;
      
      // Événements à venir
      if (y > 250) { doc.addPage(); y = 20; }
      doc.setFontSize(16);
      doc.text('Événements à venir', 14, y);
      y += 10;
      
      const eventsTableData = upcomingEvents.map(evt => [
        evt.titre,
        evt.lieu,
        new Date(evt.date).toLocaleDateString('fr-FR'),
        evt.heure,
        evt.statut === 'confirme' ? 'Confirmé' : 'Planifié'
      ]);
      
      (doc as any).autoTable({
        startY: y,
        head: [['Titre', 'Lieu', 'Date', 'Heure', 'Statut']],
        body: eventsTableData,
        theme: 'striped',
        headStyles: { fillColor: [22, 163, 74] },
        margin: { left: 14, right: 14 }
      });
      
      // Sauvegarde du PDF
      const today = new Date();
      const dateStr = today.getFullYear() + '' + ('0' + (today.getMonth()+1)).slice(-2) + '' + ('0' + today.getDate()).slice(-2);
      doc.save(`tableau_de_bord_${ong.nom.replace(/\s+/g, '_')}_${dateStr}.pdf`);
      console.log('Export PDF réussi');
    } catch (error) {
      console.error('Erreur lors de l\'export PDF:', error);
      alert('Erreur lors de l\'export PDF. Voir la console pour plus de détails.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="bg-gradient-to-r from-green-800 to-green-600 rounded-2xl p-6 text-white">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold">{ong.nom}</h1>
            <p className="text-green-200 mt-1">{ong.slogan}</p>
            <div className="mt-4 flex gap-6 text-sm">
              <span className="flex items-center gap-1"><Target className="w-4 h-4" /> {projets.length} projets totaux</span>
              <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {evtsAVenir} événement(s) à venir</span>
            </div>
          </div>
          <button 
            onClick={exportDashboardPDF}
            className="mt-2 bg-white/20 hover:bg-white/30 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-colors"
          >
            <FileDown className="w-4 h-4" />
            Exporter (PDF)
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-lg ${s.light}`}>
                  <Icon className={`w-5 h-5 ${s.text}`} />
                </div>
              </div>
              <p className={`font-bold ${s.small ? 'text-lg' : 'text-3xl'} text-gray-800`}>{s.value}</p>
              <p className="text-gray-500 text-sm mt-1">{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Finances chart */}
        <div className="lg:col-span-2 bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Finances (en milliers FCFA)</h3>
            <div className="flex gap-3 text-xs text-gray-500">
              <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3 text-green-500" />Recettes</span>
              <span className="flex items-center gap-1"><TrendingDown className="w-3 h-3 text-red-500" />Dépenses</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={financeData}>
              <defs>
                <linearGradient id="colorRec" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#16a34a" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorDep" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="mois" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Area type="monotone" dataKey="Recettes" stroke="#16a34a" fill="url(#colorRec)" strokeWidth={2} />
              <Area type="monotone" dataKey="Dépenses" stroke="#ef4444" fill="url(#colorDep)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Projets par statut */}
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-4">Projets par statut</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={projetStats} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                {projetStats.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-3 space-y-1">
            {projetStats.map((item, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                  <span className="text-gray-600">{item.name}</span>
                </div>
                <span className="font-medium text-gray-800">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Derniers dons */}
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-4">Derniers dons reçus</h3>
          <div className="space-y-3">
            {recentDons.map(don => (
              <div key={don.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center">
                    <Heart className="w-4 h-4 text-red-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{don.donateur}</p>
                    <p className="text-xs text-gray-500">{new Date(don.date).toLocaleDateString('fr-FR')}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-green-700">{don.montant.toLocaleString('fr-FR')} FCFA</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    don.statut === 'recu' ? 'bg-green-100 text-green-700' :
                    don.statut === 'en_attente' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>{don.statut === 'recu' ? 'Reçu' : don.statut === 'en_attente' ? 'En attente' : 'Annulé'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Événements à venir */}
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-4">Événements à venir</h3>
          {upcomingEvents.length === 0 ? (
            <p className="text-gray-500 text-sm">Aucun événement à venir</p>
          ) : (
            <div className="space-y-3">
              {upcomingEvents.map(evt => (
                <div key={evt.id} className="flex gap-3 items-start">
                  <div className="bg-green-100 rounded-lg p-2 text-center min-w-[48px]">
                    <p className="text-green-700 font-bold text-sm">{new Date(evt.date).getDate()}</p>
                    <p className="text-green-500 text-xs">{new Date(evt.date).toLocaleDateString('fr-FR', { month: 'short' })}</p>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">{evt.titre}</p>
                    <p className="text-xs text-gray-500">{evt.lieu} · {evt.heure}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      evt.statut === 'confirme' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                    }`}>{evt.statut === 'confirme' ? 'Confirmé' : 'Planifié'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Progression projets */}
      <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
        <h3 className="font-semibold text-gray-800 mb-4">Progression des projets</h3>
        <div className="space-y-4">
          {projets.filter(p => p.statut !== 'suspendu').map(p => (
            <div key={p.id}>
              <div className="flex items-center justify-between mb-1">
                <div>
                  <span className="text-sm font-medium text-gray-700">{p.titre}</span>
                  <span className="ml-2 text-xs text-gray-400">({p.categorie})</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span>{p.depenses.toLocaleString('fr-FR')} / {p.budget.toLocaleString('fr-FR')} FCFA</span>
                  <span className="font-bold text-green-700">{p.progression}%</span>
                </div>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${p.statut === 'termine' ? 'bg-blue-500' : 'bg-green-500'}`}
                  style={{ width: `${p.progression}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
