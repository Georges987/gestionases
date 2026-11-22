import { TrendingUp, TrendingDown, type LucideIcon } from "lucide-react";
import { Card } from "./UI";

interface KPICardProps {
  label: string;
  value: string | number;
  delta?: number;
  up?: boolean;
  sub?: string;
  icon?: LucideIcon;
  iconColor?: string;
}

export function KPICard({ label, value, delta, up = true, sub, icon: Icon, iconColor = "text-teal-600" }: KPICardProps) {
  return (
    <Card>
      <div className="flex items-start justify-between">
        <p className="text-sm text-slate-400">{label}</p>
        {Icon && <Icon className={`h-5 w-5 ${iconColor}`} />}
      </div>
      <p className="mt-2 text-2xl font-bold tracking-tight text-slate-800">{value}</p>
      {(delta !== undefined || sub) && (
        <div className="mt-3 flex items-center gap-2 text-xs">
          {delta !== undefined && (
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold ${
                up ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
              }`}
            >
              {up ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
              {up ? "+" : ""}
              {delta}%
            </span>
          )}
          {sub && <span className="text-slate-400">{sub}</span>}
        </div>
      )}
    </Card>
  );
}
