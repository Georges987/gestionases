import type { ReactNode } from "react";
import { cn } from "../utils/cn";

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn("rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm shadow-slate-200/40", className)}>
      {children}
    </div>
  );
}

export function SectionTitle({ title, sub, action }: { title: string; sub?: string; action?: ReactNode }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3">
      <div>
        <h3 className="text-base font-semibold text-slate-800">{title}</h3>
        {sub && <p className="text-sm text-slate-400">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

const tones: Record<string, string> = {
  teal: "bg-teal-50 text-teal-700 ring-teal-600/20",
  amber: "bg-amber-50 text-amber-700 ring-amber-600/20",
  indigo: "bg-indigo-50 text-indigo-700 ring-indigo-600/20",
  rose: "bg-rose-50 text-rose-700 ring-rose-600/20",
  slate: "bg-slate-100 text-slate-600 ring-slate-500/20",
  green: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
};

export function Badge({ children, tone = "slate" }: { children: ReactNode; tone?: keyof typeof tones }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset", tones[tone])}>
      {children}
    </span>
  );
}

export function Progress({ value, color = "bg-teal-500" }: { value: number; color?: string }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
      <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${value}%` }} />
    </div>
  );
}

export function statusTone(status: string): keyof typeof tones {
  switch (status) {
    case "En cours":
      return "teal";
    case "Planifié":
      return "indigo";
    case "Critique":
      return "rose";
    case "Finalisé":
      return "green";
    case "Actif":
      return "green";
    case "En mission":
      return "indigo";
    case "En pause":
      return "amber";
    default:
      return "slate";
  }
}

export const eur = (n: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

export const num = (n: number) => new Intl.NumberFormat("fr-FR").format(n);
