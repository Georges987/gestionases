import { Card, SectionTitle, Badge, statusTone } from "../components/UI";
import { Icon } from "../components/Icons";
import { volunteers } from "../data/mockData";

export function Benevoles() {
  const totalHours = volunteers.reduce((s, v) => s + v.hours, 0);
  const active = volunteers.filter((v) => v.status === "Actif").length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { l: "Bénévoles", v: String(volunteers.length), i: Icon.Hand, t: "bg-teal-50 text-teal-600" },
          { l: "Actifs", v: String(active), i: Icon.Check, t: "bg-emerald-50 text-emerald-600" },
          { l: "Heures données", v: totalHours.toLocaleString("fr-FR"), i: Icon.Clock, t: "bg-indigo-50 text-indigo-600" },
          { l: "Valeur estimée", v: "€ " + (totalHours * 18).toLocaleString("fr-FR"), i: Icon.Wallet, t: "bg-amber-50 text-amber-600" },
        ].map((s) => (
          <Card key={s.l} className="flex items-center gap-3">
            <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${s.t}`}>
              <s.i className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs text-slate-400">{s.l}</p>
              <p className="text-lg font-bold text-slate-800">{s.v}</p>
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <SectionTitle title="Équipe de bénévoles" sub="Gestion et engagement" action={<button className="inline-flex items-center gap-1.5 rounded-xl bg-teal-600 px-3 py-2 text-sm font-semibold text-white hover:bg-teal-700"><Icon.Plus className="h-4 w-4" />Recruter</button>} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {volunteers.map((v) => (
            <div key={v.id} className="rounded-2xl border border-slate-200 p-4 transition hover:shadow-md">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 font-bold text-white">
                  {v.name.split(" ").map((n) => n[0]).join("")}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-slate-800">{v.name}</p>
                  <p className="truncate text-xs text-slate-400">{v.role}</p>
                </div>
                <Badge tone={statusTone(v.status)}>{v.status}</Badge>
              </div>
              <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1"><Icon.Pin className="h-3.5 w-3.5" />{v.country}</span>
                <span className="flex items-center gap-1"><Icon.Clock className="h-3.5 w-3.5" />{v.hours} h</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {v.skills.map((s) => (
                  <span key={s} className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">{s}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
