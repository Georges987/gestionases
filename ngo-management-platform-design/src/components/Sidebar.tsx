import { Icon, type IconName } from "./Icons";
import { ong } from "../data/mockData";
import { cn } from "../utils/cn";

export type PageId =
  | "dashboard"
  | "projets"
  | "dons"
  | "beneficiaires"
  | "benevoles"
  | "evenements"
  | "finances"
  | "rapports";

const nav: { id: PageId; label: string; icon: IconName }[] = [
  { id: "dashboard", label: "Tableau de bord", icon: "Dashboard" },
  { id: "projets", label: "Projets", icon: "Project" },
  { id: "dons", label: "Dons & Donateurs", icon: "Heart" },
  { id: "beneficiaires", label: "Bénéficiaires", icon: "Users" },
  { id: "benevoles", label: "Bénévoles", icon: "Hand" },
  { id: "evenements", label: "Événements", icon: "Calendar" },
  { id: "finances", label: "Finances", icon: "Wallet" },
  { id: "rapports", label: "Rapports", icon: "Chart" },
];

export function Sidebar({
  current,
  onChange,
  open,
  onClose,
}: {
  current: PageId;
  onChange: (p: PageId) => void;
  open: boolean;
  onClose: () => void;
}) {
  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden" onClick={onClose} />}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center gap-3 px-6 py-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-lg shadow-teal-200">
            <Icon.Leaf className="h-6 w-6" />
          </div>
          <div>
            <p className="text-lg font-bold tracking-tight text-slate-800">{ong.name}</p>
            <p className="text-[11px] text-slate-400">Plateforme ONG</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
          {nav.map((item) => {
            const ActiveIcon = Icon[item.icon];
            const active = current === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onChange(item.id);
                  onClose();
                }}
                className={cn(
                  "group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                  active ? "bg-teal-50 text-teal-700" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800",
                )}
              >
                <ActiveIcon className={cn("h-5 w-5", active ? "text-teal-600" : "text-slate-400 group-hover:text-slate-600")} />
                {item.label}
                {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-teal-500" />}
              </button>
            );
          })}
        </nav>

        <div className="m-3 rounded-2xl bg-gradient-to-br from-teal-600 to-emerald-700 p-4 text-white">
          <p className="text-sm font-semibold">Campagne en cours</p>
          <p className="mt-1 text-xs text-teal-100">Objectif annuel atteint à 78%</p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/25">
            <div className="h-full rounded-full bg-white" style={{ width: "78%" }} />
          </div>
          <button className="mt-3 w-full rounded-lg bg-white/15 py-1.5 text-xs font-semibold backdrop-blur hover:bg-white/25">
            Lancer une campagne
          </button>
        </div>

        <div className="flex items-center gap-3 border-t border-slate-100 px-4 py-3">
          <img
            src="https://i.pravatar.cc/80?img=47"
            alt="profil"
            className="h-9 w-9 rounded-full ring-2 ring-teal-100"
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-700">Claire Dubois</p>
            <p className="truncate text-xs text-slate-400">Directrice des programmes</p>
          </div>
          <Icon.Settings className="ml-auto h-4 w-4 text-slate-400" />
        </div>
      </aside>
    </>
  );
}
