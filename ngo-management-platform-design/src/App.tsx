import { useState } from "react";
import { Sidebar, type PageId } from "./components/Sidebar";
import { TopBar } from "./components/TopBar";
import { Dashboard } from "./pages/Dashboard";
import { Projets } from "./pages/Projets";
import { Dons } from "./pages/Dons";
import { Beneficiaires } from "./pages/Beneficiaires";
import { Benevoles } from "./pages/Benevoles";
import { Evenements } from "./pages/Evenements";
import { Finances } from "./pages/Finances";
import { Rapports } from "./pages/Rapports";

const titles: Record<PageId, string> = {
  dashboard: "Tableau de bord",
  projets: "Gestion des projets",
  dons: "Dons & Donateurs",
  beneficiaires: "Bénéficiaires",
  benevoles: "Bénévoles",
  evenements: "Événements & Campagnes",
  finances: "Finances & Trésorerie",
  rapports: "Rapports & Impact",
};

export default function App() {
  const [page, setPage] = useState<PageId>("dashboard");
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <Sidebar current={page} onChange={setPage} open={open} onClose={() => setOpen(false)} />
      <div className="lg:pl-64">
        <TopBar title={titles[page]} onMenu={() => setOpen(true)} />
        <main className="mx-auto max-w-7xl p-4 lg:p-8">
          {page === "dashboard" && <Dashboard />}
          {page === "projets" && <Projets />}
          {page === "dons" && <Dons />}
          {page === "beneficiaires" && <Beneficiaires />}
          {page === "benevoles" && <Benevoles />}
          {page === "evenements" && <Evenements />}
          {page === "finances" && <Finances />}
          {page === "rapports" && <Rapports />}
        </main>
      </div>
    </div>
  );
}
