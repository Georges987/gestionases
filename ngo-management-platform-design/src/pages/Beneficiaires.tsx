import { Card, SectionTitle, num } from "../components/UI";
import { Bars } from "../components/Charts";
import { Icon } from "../components/Icons";
import { countries } from "../data/mockData";

const programs = [
  { name: "Eau & Assainissement", reach: 36600, pct: 100, color: "from-sky-400 to-sky-600" },
  { name: "Éducation", reach: 18400, pct: 50, color: "from-indigo-400 to-indigo-600" },
  { name: "Santé", reach: 23200, pct: 63, color: "from-rose-400 to-rose-600" },
  { name: "Sécurité alimentaire", reach: 21000, pct: 57, color: "from-amber-400 to-amber-600" },
];

const demographics = [
  { label: "Femmes", pct: 54, color: "bg-rose-400" },
  { label: "Enfants", pct: 31, color: "bg-amber-400" },
  { label: "Hommes", pct: 15, color: "bg-teal-400" },
];

export function Beneficiaires() {
  const total = countries.reduce((s, c) => s + c.beneficiaries, 0);
  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-slate-800 to-slate-900 text-white">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-slate-300">Total des bénéficiaires accompagnés</p>
            <p className="mt-1 text-4xl font-bold">{num(total)}</p>
            <p className="mt-1 text-sm text-slate-400">à travers 6 pays et 4 programmes thématiques</p>
          </div>
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10">
            <Icon.Users className="h-8 w-8" />
          </span>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <SectionTitle title="Bénéficiaires par pays" />
          <Bars data={countries.map((c) => ({ name: c.name, value: c.beneficiaries }))} />
        </Card>

        <Card>
          <SectionTitle title="Répartition démographique" />
          <div className="flex h-6 w-full overflow-hidden rounded-full">
            {demographics.map((d) => (
              <div key={d.label} className={d.color} style={{ width: `${d.pct}%` }} />
            ))}
          </div>
          <ul className="mt-4 space-y-2">
            {demographics.map((d) => (
              <li key={d.label} className="flex items-center gap-2 text-sm">
                <span className={`h-3 w-3 rounded-sm ${d.color}`} />
                <span className="text-slate-600">{d.label}</span>
                <span className="ml-auto font-semibold text-slate-800">{d.pct}%</span>
              </li>
            ))}
          </ul>
          <div className="mt-5 rounded-xl bg-teal-50 p-3 text-sm text-teal-700">
            Priorité donnée aux populations les plus vulnérables, conformément à notre charte.
          </div>
        </Card>
      </div>

      <Card>
        <SectionTitle title="Couverture par programme" sub="Nombre de personnes touchées" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {programs.map((p) => (
            <div key={p.name} className="rounded-2xl border border-slate-100 p-4">
              <div className="flex items-center justify-between">
                <p className="font-medium text-slate-800">{p.name}</p>
                <span className="text-sm font-bold text-slate-700">{num(p.reach)}</span>
              </div>
              <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div className={`h-full rounded-full bg-gradient-to-r ${p.color}`} style={{ width: `${p.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
