import { Card, SectionTitle, eur } from "../components/UI";
import { AreaChart, Donut } from "../components/Charts";
import { Icon } from "../components/Icons";
import { fundAllocation, monthlyDonations } from "../data/mockData";

const ledger = [
  { id: "TX-9001", label: "Subvention Union Européenne", cat: "Recette", date: "2025-12-20", amount: 520000 },
  { id: "TX-9002", label: "Achat de matériel médical — Sénégal", cat: "Dépense", date: "2026-01-05", amount: -84000 },
  { id: "TX-9003", label: "Don Fondation Lumière", cat: "Recette", date: "2026-01-12", amount: 45000 },
  { id: "TX-9004", label: "Salaires équipe terrain Mali", cat: "Dépense", date: "2026-01-10", amount: -62000 },
  { id: "TX-9005", label: "Logistique aide d'urgence Soudan", cat: "Dépense", date: "2026-01-14", amount: -38500 },
  { id: "TX-9006", label: "Campagne marche solidaire", cat: "Recette", date: "2026-01-15", amount: 22500 },
];

export function Finances() {
  const income = ledger.filter((l) => l.amount > 0).reduce((s, l) => s + l.amount, 0);
  const expense = ledger.filter((l) => l.amount < 0).reduce((s, l) => s + l.amount, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-sm text-slate-400">Recettes</p>
          <p className="mt-2 text-2xl font-bold text-emerald-600">{eur(income)}</p>
          <p className="mt-1 flex items-center gap-1 text-xs text-emerald-600"><Icon.Trend className="h-3.5 w-3.5" /> Trésorerie saine</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-400">Dépenses</p>
          <p className="mt-2 text-2xl font-bold text-rose-600">{eur(Math.abs(expense))}</p>
          <p className="mt-1 flex items-center gap-1 text-xs text-slate-400"><Icon.Chart className="h-3.5 w-3.5" /> Conforme au budget</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-400">Solde net</p>
          <p className="mt-2 text-2xl font-bold text-slate-800">{eur(income + expense)}</p>
          <p className="mt-1 flex items-center gap-1 text-xs text-slate-400"><Icon.Wallet className="h-3.5 w-3.5" /> Réserves disponibles</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <SectionTitle title="Trésorerie" sub="Évolution mensuelle (milliers €)" />
          <AreaChart data={monthlyDonations} color="#10b981" />
        </Card>
        <Card>
          <SectionTitle title="Répartition des dépenses" />
          <Donut data={fundAllocation} />
        </Card>
      </div>

      <Card>
        <SectionTitle title="Journal des transactions" sub="Dernières écritures" action={<button className="text-sm font-medium text-teal-600">Voir le grand livre</button>} />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="pb-3 font-medium">Référence</th>
                <th className="pb-3 font-medium">Libellé</th>
                <th className="pb-3 font-medium">Catégorie</th>
                <th className="pb-3 font-medium">Date</th>
                <th className="pb-3 text-right font-medium">Montant</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {ledger.map((l) => (
                <tr key={l.id} className="hover:bg-slate-50/70">
                  <td className="py-3 font-mono text-xs text-slate-400">{l.id}</td>
                  <td className="py-3 font-medium text-slate-700">{l.label}</td>
                  <td className="py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${l.amount > 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}>
                      {l.cat}
                    </span>
                  </td>
                  <td className="py-3 text-slate-500">{new Date(l.date).toLocaleDateString("fr-FR")}</td>
                  <td className={`py-3 text-right font-semibold ${l.amount > 0 ? "text-emerald-600" : "text-rose-600"}`}>
                    {l.amount > 0 ? "+" : ""}{eur(l.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
