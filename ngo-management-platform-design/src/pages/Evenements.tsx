import { Card, SectionTitle, Badge, Progress, eur } from "../components/UI";
import { Icon } from "../components/Icons";
import { events } from "../data/mockData";

const typeTone: Record<string, "teal" | "indigo" | "amber" | "rose"> = {
  Collecte: "rose",
  Sensibilisation: "amber",
  Formation: "indigo",
  Terrain: "teal",
};

export function Evenements() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <SectionTitle
            title="Événements à venir"
            sub="Mobilisation et collecte"
            action={<button className="inline-flex items-center gap-1.5 rounded-xl bg-teal-600 px-3 py-2 text-sm font-semibold text-white hover:bg-teal-700"><Icon.Plus className="h-4 w-4" />Créer</button>}
          />
          <div className="space-y-4">
            {events.map((e) => {
              const d = new Date(e.date);
              const pct = e.goal ? Math.round((e.raised / e.goal) * 100) : 0;
              return (
                <div key={e.id} className="flex flex-col gap-4 rounded-2xl border border-slate-200 p-4 sm:flex-row sm:items-center">
                  <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                    <span className="text-xl font-bold leading-none">{d.getDate()}</span>
                    <span className="text-xs uppercase">{d.toLocaleDateString("fr-FR", { month: "short" })}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-slate-800">{e.title}</p>
                      <Badge tone={typeTone[e.type]}>{e.type}</Badge>
                    </div>
                    <p className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                      <Icon.Pin className="h-3.5 w-3.5" /> {e.place}
                    </p>
                    {e.goal > 0 && (
                      <div className="mt-2 max-w-xs">
                        <div className="mb-1 flex justify-between text-xs text-slate-500">
                          <span>{eur(e.raised)}</span>
                          <span>{pct}% de {eur(e.goal)}</span>
                        </div>
                        <Progress value={pct} />
                      </div>
                    )}
                  </div>
                  <button className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
                    Détails
                  </button>
                </div>
              );
            })}
          </div>
        </Card>

        <div className="space-y-6">
          <Card>
            <SectionTitle title="Calendrier" />
            <MiniCalendar />
          </Card>
          <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
            <p className="text-sm text-indigo-100">Objectif événements 2026</p>
            <p className="mt-1 text-3xl font-bold">{eur(370000)}</p>
            <p className="mt-1 text-sm text-indigo-100">€ 221 500 déjà collectés</p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/25">
              <div className="h-full rounded-full bg-white" style={{ width: "60%" }} />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function MiniCalendar() {
  const days = ["L", "M", "M", "J", "V", "S", "D"];
  const marked = [8, 14, 22];
  const cells = Array.from({ length: 35 }, (_, i) => i - 2); // offset start
  return (
    <div>
      <p className="mb-3 text-center text-sm font-semibold text-slate-700">Février 2026</p>
      <div className="grid grid-cols-7 gap-1 text-center text-xs">
        {days.map((d, i) => (
          <span key={i} className="py-1 font-medium text-slate-400">{d}</span>
        ))}
        {cells.map((n, i) => {
          const valid = n >= 1 && n <= 28;
          const isMarked = marked.includes(n);
          return (
            <span
              key={i}
              className={`flex aspect-square items-center justify-center rounded-lg ${
                !valid ? "text-transparent" : isMarked ? "bg-teal-600 font-semibold text-white" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {valid ? n : "."}
            </span>
          );
        })}
      </div>
    </div>
  );
}
