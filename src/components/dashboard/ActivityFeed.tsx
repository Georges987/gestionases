import { FolderKanban, Heart, Hand, Bell, Mail, type LucideIcon } from "lucide-react";
import { Card, SectionTitle } from "./UI";

export interface ActivityItem {
  id: string | number;
  who: string;
  action: string;
  time: string;
  type: "project" | "donation" | "volunteer" | "alert" | "comm";
}

interface ActivityFeedProps {
  activities: ActivityItem[];
}

const actIcon: Record<ActivityItem["type"], { icon: LucideIcon; tone: string }> = {
  project: { icon: FolderKanban, tone: "bg-teal-50 text-teal-600" },
  donation: { icon: Heart, tone: "bg-rose-50 text-rose-600" },
  volunteer: { icon: Hand, tone: "bg-indigo-50 text-indigo-600" },
  alert: { icon: Bell, tone: "bg-amber-50 text-amber-600" },
  comm: { icon: Mail, tone: "bg-slate-100 text-slate-600" },
};

function timeAgo(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return "à l'instant";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "hier";
  if (days < 7) return `il y a ${days} jours`;
  return date.toLocaleDateString("fr-FR");
}

function inferType(action: string): ActivityItem["type"] {
  const a = action.toLowerCase();
  if (a.includes("don") || a.includes("donation")) return "donation";
  if (a.includes("alerte") || a.includes("budget")) return "alert";
  if (a.includes("newsletter") || a.includes("publication") || a.includes("mail")) return "comm";
  if (a.includes("membre") || a.includes("rejoint") || a.includes("mission")) return "volunteer";
  return "project";
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  const items: ActivityItem[] = activities.length > 0
    ? activities
    : [];

  if (items.length === 0) {
    return (
      <Card>
        <SectionTitle title="Activité récente" />
        <p className="py-6 text-center text-sm text-slate-400">Aucune activité récente</p>
      </Card>
    );
  }

  return (
    <Card>
      <SectionTitle title="Activité récente" />
      <ul className="space-y-4">
        {items.slice(0, 5).map((a) => {
          const cfg = actIcon[a.type] || actIcon.project;
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
  );
}

export { timeAgo, inferType };
