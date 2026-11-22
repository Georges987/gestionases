import { useState } from "react";
import { Card, Badge, Progress, statusTone, eur, num } from "../components/UI";
import { Icon } from "../components/Icons";
import { projects } from "../data/mockData";

const filters = ["Tous", "En cours", "Planifié", "Critique", "Finalisé"];

export function Projets() {
  const [filter, setFilter] = useState("Tous");
  const [q, setQ] = useState("");

  const list = projects.filter(
    (p) => (filter === "Tous" || p.status === filter) && p.name.toLowerCase().includes(q.toLowerCase()),
  );

  const totalBudget = projects.reduce((s, p) => s + p.budget, 0);
  const totalSpent = projects.reduce((s, p) => s + p.spent, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { l: "Budget total", v: eur(totalBudget), i: Icon.Wallet, t: "text-teal-600 bg-teal-50" },
          { l: "Dépensé", v: eur(totalSpent), i: Icon.Chart, t: "text-indigo-600 bg-indigo-50" },
          { l: "Projets actifs", v: String(projects.filter((p) => p.status === "En cours").length), i: Icon.Project, t: "text-amber-600 bg-amber-50" },
          { l: "Bénéficiaires", v: num(projects.reduce((s, p) => s + p.beneficiaries, 0)), i: Icon.Users, t: "text-rose-600 bg-rose-50" },
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
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1 text-sm font-medium text-slate-500">
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-lg px-3 py-1.5 transition ${filter === f ? "bg-white text-slate-800 shadow-sm" : "hover:text-slate-700"}`}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Icon.Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Rechercher…"
                className="w-44 rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none focus:border-teal-400 focus:bg-white"
              />
            </div>
            <button className="inline-flex items-center gap-1.5 rounded-xl bg-teal-600 px-3 py-2 text-sm font-semibold text-white hover:bg-teal-700">
              <Icon.Plus className="h-4 w-4" /> Projet
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {list.map((p) => (
            <div key={p.id} className="group rounded-2xl border border-slate-200 p-4 transition hover:border-teal-300 hover:shadow-md">
              <div className="flex items-start justify-between">
                <Badge tone={statusTone(p.status)}>{p.status}</Badge>
                <button className="text-slate-300 hover:text-slate-500">
                  <Icon.Dots className="h-5 w-5" />
                </button>
              </div>
              <p className="mt-3 font-semibold leading-snug text-slate-800">{p.name}</p>
              <p className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                <Icon.Pin className="h-3.5 w-3.5" /> {p.country} · {p.category}
              </p>

              <div className="mt-4">
                <div className="mb-1 flex justify-between text-xs">
                  <span className="text-slate-500">Avancement</span>
                  <span className="font-semibold text-slate-700">{p.progress}%</span>
                </div>
                <Progress value={p.progress} color={p.status === "Critique" ? "bg-rose-500" : "bg-teal-500"} />
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg bg-slate-50 p-2">
                  <p className="text-slate-400">Budget</p>
                  <p className="font-semibold text-slate-700">{eur(p.budget)}</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-2">
                  <p className="text-slate-400">Bénéficiaires</p>
                  <p className="font-semibold text-slate-700">{num(p.beneficiaries)}</p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-100 text-[10px] font-bold text-teal-700">
                    {p.lead.split(" ").map((n) => n[0]).join("")}
                  </span>
                  {p.lead}
                </span>
                <span className="flex items-center gap-1">
                  <Icon.Clock className="h-3.5 w-3.5" />
                  {new Date(p.deadline).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}
                </span>
              </div>
            </div>
          ))}
        </div>
        {list.length === 0 && <p className="py-10 text-center text-sm text-slate-400">Aucun projet trouvé.</p>}
      </Card>
    </div>
  );
}
