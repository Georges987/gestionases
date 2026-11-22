import { Icon } from "./Icons";

export function TopBar({ title, onMenu }: { title: string; onMenu: () => void }) {
  return (
    <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-slate-200 bg-white/80 px-4 py-3 backdrop-blur lg:px-8">
      <button onClick={onMenu} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden">
        <Icon.Menu className="h-5 w-5" />
      </button>
      <div className="flex-1">
        <h1 className="text-lg font-semibold text-slate-800">{title}</h1>
        <p className="hidden text-xs text-slate-400 sm:block">Bonjour Claire 👋 — voici l'activité de votre organisation</p>
      </div>

      <div className="relative hidden md:block">
        <Icon.Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          placeholder="Rechercher un projet, donateur…"
          className="w-64 rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-100"
        />
      </div>

      <button className="relative rounded-xl p-2.5 text-slate-500 hover:bg-slate-100">
        <Icon.Bell className="h-5 w-5" />
        <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
      </button>

      <button className="hidden items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-teal-200 transition hover:bg-teal-700 sm:inline-flex">
        <Icon.Plus className="h-4 w-4" />
        Nouveau
      </button>
    </header>
  );
}
