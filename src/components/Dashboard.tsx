import { useMemo } from "react";
import { Users, FolderKanban, Heart, Wallet, FileDown, Pin } from "lucide-react";
import { Card, SectionTitle, Badge, Progress, statusTone, num } from "./dashboard/UI";
import { AreaChart, Donut } from "./dashboard/Charts";
import { KPICard } from "./dashboard/KPICard";
import { ActivityFeed, timeAgo, inferType, type ActivityItem } from "./dashboard/ActivityFeed";
import { GeographicReach } from "./dashboard/GeographicReach";
import { FundAllocation } from "./dashboard/FundAllocation";
import { useApp } from "../context/AppContext";
import { useTheme } from "../context/ThemeContext";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { hexToRgb } from "../utils/colors";
import type { Projet } from "../types";

export default function Dashboard() {
  const { data } = useApp();
  const { isDark } = useTheme();
  const { membres, projets, dons, transactions, evenements, ong } = data;

  const totalDons = useMemo(
    () => dons.filter((d) => d.statut === "recu").reduce((s, d) => s + d.montant, 0),
    [dons]
  );
  const totalDepenses = useMemo(
    () => transactions.filter((t) => t.type === "depense").reduce((s, t) => s + t.montant, 0),
    [transactions]
  );
  const membresActifs = useMemo(() => membres.filter((m) => m.statut === "actif").length, [membres]);
  const projetsEnCours = useMemo(() => projets.filter((p) => p.statut === "en_cours").length, [projets]);
  const beneficiaires = useMemo(() => projets.reduce((s, p) => s + (p.beneficiaires || 0), 0), [projets]);

  const monthlyDonations = useMemo(() => {
    const now = new Date();
    const months: { m: string; v: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const sum = dons
        .filter((x) => x.statut === "recu" && x.date.startsWith(key))
        .reduce((s, x) => s + x.montant, 0);
      months.push({
        m: d.toLocaleDateString("fr-FR", { month: "short" }),
        v: Math.round(sum / 1000),
      });
    }
    return months;
  }, [dons]);

  const priorityProjects = useMemo<Projet[]>(
    () => [...projets].sort((a, b) => (b.progression || 0) - (a.progression || 0)).slice(0, 4),
    [projets]
  );

  const activities: ActivityItem[] = useMemo(() => {
    const logs = (data as any).logs || [];
    return logs.slice(0, 5).map((l: any) => ({
      id: l.id,
      who: l.user_name || l.user_id || "Système",
      action: l.action || l.details || "Activité",
      time: l.timestamp ? timeAgo(l.timestamp) : "",
      type: inferType(l.action || l.details || ""),
    }));
  }, [data]);

  const exportDashboardPDF = () => {
    if (!ong || !ong.nom) {
      alert("Données de l'ONG manquantes");
      return;
    }
    try {
      const primaryColor = hexToRgb(ong.primaryColor || "#0d9488");
      const doc = new jsPDF();
      const dateStr = new Date().toLocaleDateString("fr-FR");

      doc.setFontSize(20);
      doc.text(ong.nom, 14, 22);
      doc.setFontSize(12);
      doc.text(ong.slogan || "", 14, 28);
      doc.text(`Tableau de bord - ${dateStr}`, 14, 34);

      let y = 44;
      doc.setFontSize(16);
      doc.text("Statistiques principales", 14, y);
      y += 10;

      autoTable(doc, {
        startY: y,
        head: [["Indicateur", "Valeur"]],
        body: [
          ["Membres actifs", membresActifs.toString()],
          ["Projets en cours", projetsEnCours.toString()],
          ["Bénéficiaires aidés", num(beneficiaires)],
          ["Total des dons", num(totalDons) + " FCFA"],
          ["Total des dépenses", num(totalDepenses) + " FCFA"],
        ],
        theme: "striped",
        headStyles: { fillColor: primaryColor },
        margin: { left: 14, right: 14 },
      });

      const today = new Date();
      const dateStrFile = today.getFullYear() + "-" + String(today.getMonth() + 1).padStart(2, "0") + "-" + String(today.getDate()).padStart(2, "0");
      doc.save(`dashboard-${dateStrFile}.pdf`);
    } catch (e) {
      console.error("PDF export error", e);
      alert("Erreur lors de l'export PDF");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800">Tableau de bord</h2>
          <p className="text-sm text-slate-400">Vue d'ensemble de votre activité</p>
        </div>
        <button
          onClick={exportDashboardPDF}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
        >
          <FileDown className="h-4 w-4" />
          Exporter en PDF
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KPICard
          label="Dons collectés"
          value={num(totalDons) + " FCFA"}
          delta={12.4}
          up={true}
          sub="Total reçu"
          icon={Heart}
          iconColor="text-rose-500"
        />
        <KPICard
          label="Bénéficiaires aidés"
          value={num(beneficiaires)}
          delta={8.1}
          up={true}
          sub="via les projets"
          icon={Users}
          iconColor="text-blue-500"
        />
        <KPICard
          label="Projets actifs"
          value={projetsEnCours}
          delta={4}
          up={true}
          sub={`sur ${projets.length} au total`}
          icon={FolderKanban}
          iconColor="text-teal-600"
        />
        <KPICard
          label="Membres actifs"
          value={membresActifs}
          delta={-2.3}
          up={false}
          sub={`sur ${membres.length} au total`}
          icon={Users}
          iconColor="text-indigo-500"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <SectionTitle
            title="Évolution des dons"
            sub="Collecte mensuelle sur 12 mois (en milliers FCFA)"
          />
          <AreaChart data={monthlyDonations} />
        </Card>

        <FundAllocation transactions={transactions} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <SectionTitle
            title="Projets prioritaires"
            sub="Suivi de l'avancement"
            action={<button className="text-sm font-medium text-teal-600">Tout voir</button>}
          />
          {priorityProjects.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">Aucun projet</p>
          ) : (
            <div className="space-y-4">
              {priorityProjects.map((p) => (
                <div key={p.id} className="flex flex-col gap-2 rounded-xl border border-slate-100 p-3 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-medium text-slate-800">{p.titre}</p>
                      <Badge tone={statusTone(p.statut)}>{p.statut}</Badge>
                    </div>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-400">
                      <Pin className="h-3.5 w-3.5" /> {p.localisation || "—"} · {num(p.beneficiaires || 0)} bénéficiaires
                    </p>
                  </div>
                  <div className="w-full sm:w-40">
                    <div className="mb-1 flex justify-between text-xs text-slate-500">
                      <span>{p.progression}%</span>
                      <span>{num(p.depenses || 0)} FCFA</span>
                    </div>
                    <Progress
                      value={p.progression || 0}
                      color={p.statut === "suspendu" ? "bg-rose-500" : "bg-teal-500"}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <ActivityFeed activities={activities} />
      </div>

      <GeographicReach projets={projets} />
    </div>
  );
}
