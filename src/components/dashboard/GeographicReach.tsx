import { Globe } from "lucide-react";
import { Card, SectionTitle, num } from "./UI";
import type { Projet } from "../../types";

interface GeographicReachProps {
  projets: Projet[];
}

export function GeographicReach({ projets }: GeographicReachProps) {
  const countries = projets.reduce<Record<string, { name: string; projects: number; beneficiaries: number }>>(
    (acc, p) => {
      const loc = p.localisation || "Non localisé";
      if (!acc[loc]) acc[loc] = { name: loc, projects: 0, beneficiaries: 0 };
      acc[loc].projects += 1;
      acc[loc].beneficiaries += p.beneficiaires || 0;
      return acc;
    },
    {}
  );

  const list = Object.values(countries)
    .sort((a, b) => b.beneficiaries - a.beneficiaries)
    .slice(0, 6);

  if (list.length === 0) {
    return (
      <Card>
        <SectionTitle title="Présence géographique" sub="Bénéficiaires par pays d'intervention" action={<Globe className="h-5 w-5 text-slate-400" />} />
        <p className="py-6 text-center text-sm text-slate-400">Aucune donnée de localisation disponible</p>
      </Card>
    );
  }

  return (
    <Card>
      <SectionTitle
        title="Présence géographique"
        sub="Bénéficiaires par pays d'intervention"
        action={<Globe className="h-5 w-5 text-slate-400" />}
      />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {list.map((c) => (
          <div key={c.name} className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 text-center">
            <p className="text-sm font-semibold text-slate-700">{c.name}</p>
            <p className="mt-1 text-2xl font-bold text-teal-600">{num(c.beneficiaries)}</p>
            <p className="text-xs text-slate-400">{c.projects} projet{c.projects > 1 ? "s" : ""}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
