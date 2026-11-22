import { Card, SectionTitle, Badge, eur } from "../components/UI";
import { AreaChart } from "../components/Charts";
import { Icon } from "../components/Icons";
import { donors, monthlyDonations } from "../data/mockData";

const tierTone: Record<string, "indigo" | "amber" | "slate" | "rose"> = {
  Platine: "indigo",
  Or: "amber",
  Argent: "slate",
  Bronze: "rose",
};

const typeIcon: Record<string, string> = {
  Fondation: "🏛️",
  Entreprise: "🏢",
  Particulier: "👤",
  Institution: "🌐",
  Association: "🤝",
};

export function Dons() {
  const total = donors.reduce((s, d) => s + d.total, 0);
  const recurring = donors.filter((d) => d.recurring).length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="bg-gradient-to-br from-teal-600 to-emerald-700 text-white lg:col-span-1">
          <p className="text-sm text-teal-100">Total collecté (cumulé)</p>
          <p className="mt-2 text-3xl font-bold">{eur(total)}</p>
          <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl bg-white/10 p-3">
              <p className="text-2xl font-bold">{donors.length}</p>
              <p className="text-teal-100">Donateurs</p>
            </div>
            <div className="rounded-xl bg-white/10 p-3">
              <p className="text-2xl font-bold">{recurring}</p>
              <p className="text-teal-100">Récurrents</p>
            </div>
          </div>
          <button className="mt-6 w-full rounded-xl bg-white py-2.5 text-sm font-semibold text-teal-700 hover:bg-teal-50">
            + Enregistrer un don
          </button>
        </Card>

        <Card className="lg:col-span-2">
          <SectionTitle title="Flux de dons" sub="Performance des collectes (milliers €)" />
          <AreaChart data={monthlyDonations} color="#6366f1" />
        </Card>
      </div>

      <Card>
        <SectionTitle
          title="Donateurs"
          sub="Suivi des contributions et fidélisation"
          action={<button className="text-sm font-medium text-teal-600">Exporter CSV</button>}
        />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="pb-3 font-medium">Donateur</th>
                <th className="pb-3 font-medium">Type</th>
                <th className="pb-3 font-medium">Niveau</th>
                <th className="pb-3 font-medium">Récurrence</th>
                <th className="pb-3 font-medium">Dernier don</th>
                <th className="pb-3 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {donors.map((d) => (
                <tr key={d.id} className="group hover:bg-slate-50/70">
                  <td className="py-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-base">
                        {typeIcon[d.type]}
                      </span>
                      <span className="font-medium text-slate-800">{d.name}</span>
                    </div>
                  </td>
                  <td className="py-3 text-slate-500">{d.type}</td>
                  <td className="py-3">
                    <Badge tone={tierTone[d.tier]}>{d.tier}</Badge>
                  </td>
                  <td className="py-3">
                    {d.recurring ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600">
                        <Icon.Check className="h-4 w-4" /> Mensuel
                      </span>
                    ) : (
                      <span className="text-slate-400">Ponctuel</span>
                    )}
                  </td>
                  <td className="py-3 text-slate-500">
                    {new Date(d.lastGift).toLocaleDateString("fr-FR")}
                  </td>
                  <td className="py-3 text-right font-semibold text-slate-800">{eur(d.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
