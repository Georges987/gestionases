import { Card, SectionTitle, Badge, Progress, statusTone, eur, num } from "../components/UI";
import { AreaChart, Donut } from "../components/Charts";
import { Icon } from "../components/Icons";
import { kpis, monthlyDonations, fundAllocation, projects, activities, countries } from "../data/mockData";

const actIcon = {
  project: { icon: Icon.Project, tone: "bg-teal-50 text-teal-600" },
  donation: { icon: Icon.Heart, tone: "bg-rose-50 text-rose-600" },
  volunteer: { icon: Icon.Hand, tone: "bg-indigo-50 text-indigo-600" },
  alert: { icon: Icon.Bell, tone: "bg-amber-50 text-amber-600" },
  comm: { icon: Icon.Mail, tone: "bg-slate-100 text-slate-600" },
} as const;

export function Dashboard() {
  return (
    <div className="space-y-6">
      {/* KPI grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.id}>
            <p className="text-sm text-slate-400">{k.label}</p>
            <p className="mt-2 text-2xl font-bold tracking-tight text-slate-800">{k.value}</p>
            <div className="mt-3 flex items-center gap-2 text-xs">
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold ${
                  k.up ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                }`}
              >
                {k.up ? <Icon.Trend className="h-3.5 w-3.5" /> : <Icon.TrendDown className="h-3.5 w-3.5" />}
                {k.up ? "+" : ""}
                {k.delta}%
              </span>
              <span className="text-slate-400">{k.sub}</span>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Donations chart */}
        <Card className="lg:col-span-2">
          <SectionTitle
            title="Évolution des dons"
            sub="Collecte mensuelle 2026 (en milliers €)"
            action={
              <div className="flex gap-1 rounded-lg bg-slate-100 p-1 text-xs font-medium text-slate-500">
                <button className="rounded-md bg-white px-3 py-1 text-slate-800 shadow-sm">Année</button>
                <button className="px-3 py-1">Trimestre</button>
              </div>
            }
          />
          <AreaChart data={monthlyDonations} />
        </Card>

        {/* Allocation */}
        <Card>
          <SectionTitle title="Affectation des fonds" sub="Transparence financière" />
          <Donut data={fundAllocation} />
          <div className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">
            <span className="font-semibold">82%</span> des fonds vont directement aux missions sociales.
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Active projects */}
        <Card className="lg:col-span-2">
          <SectionTitle title="Projets prioritaires" sub="Suivi de l'avancement" action={<button className="text-sm font-medium text-teal-600">Tout voir</button>} />
          <div className="space-y-4">
            {projects.slice(0, 4).map((p) => (
              <div key={p.id} className="flex flex-col gap-2 rounded-xl border border-slate-100 p-3 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium text-slate-800">{p.name}</p>
                    <Badge tone={statusTone(p.status)}>{p.status}</Badge>
                  </div>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-400">
                    <Icon.Pin className="h-3.5 w-3.5" /> {p.country} · {num(p.beneficiaries)} bénéficiaires
                  </p>
                </div>
                <div className="w-full sm:w-40">
                  <div className="mb-1 flex justify-between text-xs text-slate-500">
                    <span>{p.progress}%</span>
                    <span>{eur(p.spent)}</span>
                  </div>
                  <Progress value={p.progress} color={p.status === "Critique" ? "bg-rose-500" : "bg-teal-500"} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Activity feed */}
        <Card>
          <SectionTitle title="Activité récente" />
          <ul className="space-y-4">
            {activities.map((a) => {
              const cfg = actIcon[a.type as keyof typeof actIcon];
              const I = cfg.icon;
              return (
                <li key={a.id} className="flex gap-3">
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${cfg.tone}`}>
                    <I className="h-4 w-4" />
                  </span>
                  <div className="text-sm">
                    <p className="text-slate-700">
                      <span className="font-semibold">{a.who}</span> {a.action}
                    </p>
                    <p className="text-xs text-slate-400">{a.time}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>

      {/* Geographic reach */}
      <Card>
        <SectionTitle title="Présence géographique" sub="Bénéficiaires par pays d'intervention" action={<Icon.Globe className="h-5 w-5 text-slate-400" />} />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {countries.map((c) => (
            <div key={c.name} className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 text-center">
              <p className="text-sm font-semibold text-slate-700">{c.name}</p>
              <p className="mt-1 text-2xl font-bold text-teal-600">{num(c.beneficiaries)}</p>
              <p className="text-xs text-slate-400">{c.projects} projets</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
