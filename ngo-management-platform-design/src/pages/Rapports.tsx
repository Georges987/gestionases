import { Card, SectionTitle } from "../components/UI";
import { AreaChart, Bars } from "../components/Charts";
import { Icon } from "../components/Icons";
import { monthlyDonations, countries } from "../data/mockData";

const reports = [
  { name: "Rapport annuel 2025", type: "PDF", size: "4.2 Mo", date: "15 jan. 2026", color: "text-rose-600 bg-rose-50" },
  { name: "Bilan financier T4", type: "XLSX", size: "820 Ko", date: "08 jan. 2026", color: "text-emerald-600 bg-emerald-50" },
  { name: "Impact programmes — Sahel", type: "PDF", size: "2.7 Mo", date: "20 déc. 2025", color: "text-rose-600 bg-rose-50" },
  { name: "Audit des donateurs", type: "CSV", size: "140 Ko", date: "12 déc. 2025", color: "text-indigo-600 bg-indigo-50" },
];

const indicators = [
  { l: "Taux d'efficacité", v: "82%", d: "des fonds aux missions", up: true },
  { l: "Satisfaction terrain", v: "94%", d: "bénéficiaires interrogés", up: true },
  { l: "Coût par bénéficiaire", v: "€ 14,8", d: "-6% vs. 2024", up: true },
  { l: "Délai moyen projet", v: "8,2 mois", d: "de l'idée au déploiement", up: false },
];

export function Rapports() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {indicators.map((i) => (
          <Card key={i.l}>
            <p className="text-sm text-slate-400">{i.l}</p>
            <p className="mt-2 text-2xl font-bold text-slate-800">{i.v}</p>
            <p className={`mt-1 text-xs ${i.up ? "text-emerald-600" : "text-amber-600"}`}>{i.d}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <SectionTitle title="Tendance d'impact" sub="Bénéficiaires touchés (milliers)" />
          <AreaChart data={monthlyDonations} color="#0ea5e9" />
        </Card>
        <Card>
          <SectionTitle title="Impact par pays" />
          <Bars data={countries.map((c) => ({ name: c.name, value: c.beneficiaries }))} />
        </Card>
      </div>

      <Card>
        <SectionTitle
          title="Documents & rapports"
          sub="Transparence et reddition de comptes"
          action={<button className="inline-flex items-center gap-1.5 rounded-xl bg-teal-600 px-3 py-2 text-sm font-semibold text-white hover:bg-teal-700"><Icon.Plus className="h-4 w-4" />Générer</button>}
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {reports.map((r) => (
            <div key={r.name} className="flex items-center gap-4 rounded-2xl border border-slate-200 p-4 transition hover:border-teal-300 hover:shadow-sm">
              <span className={`flex h-12 w-12 items-center justify-center rounded-xl text-xs font-bold ${r.color}`}>
                {r.type}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-slate-800">{r.name}</p>
                <p className="text-xs text-slate-400">{r.size} · {r.date}</p>
              </div>
              <button className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-teal-600" title="Télécharger">
                <Icon.Chart className="h-5 w-5" />
              </button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
