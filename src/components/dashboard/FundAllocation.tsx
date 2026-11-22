import { Card, SectionTitle } from "./UI";
import { Donut } from "./Charts";
import type { Transaction } from "../../types";

interface FundAllocationProps {
  transactions: Transaction[];
}

const CATEGORY_COLORS: Record<string, string> = {
  Salaires: "#0d9488",
  Logistique: "#f59e0b",
  "Achat matériel": "#6366f1",
  "Frais de mission": "#ec4899",
  "Frais bancaires": "#64748b",
  Investissement: "#10b981",
  Services: "#8b5cf6",
};

const DEFAULT_COLOR = "#94a3b8";

export function FundAllocation({ transactions }: FundAllocationProps) {
  const depenses = transactions.filter((t) => t.type === "depense");
  const total = depenses.reduce((s, t) => s + t.montant, 0);

  if (total === 0) {
    return (
      <Card>
        <SectionTitle title="Affectation des fonds" sub="Transparence financière" />
        <p className="py-6 text-center text-sm text-slate-400">Aucune dépense enregistrée</p>
      </Card>
    );
  }

  const byCat = depenses.reduce<Record<string, number>>((acc, t) => {
    const cat = t.categorie || "Autre";
    acc[cat] = (acc[cat] || 0) + t.montant;
    return acc;
  }, {});

  const data = Object.entries(byCat)
    .map(([label, value]) => ({
      label,
      value: Math.round((value / total) * 100),
      color: CATEGORY_COLORS[label] || DEFAULT_COLOR,
    }))
    .sort((a, b) => b.value - a.value);

  const topPct = data[0]?.value || 0;

  return (
    <Card>
      <SectionTitle title="Affectation des fonds" sub="Répartition des dépenses par catégorie" />
      <Donut data={data} />
      <div className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">
        <span className="font-semibold">{topPct}%</span> des dépenses vont à : <span className="font-semibold">{data[0]?.label}</span>
      </div>
    </Card>
  );
}
