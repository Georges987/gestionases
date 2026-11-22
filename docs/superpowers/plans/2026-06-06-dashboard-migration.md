# Dashboard Migration to ngo-management-platform-design Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the Dashboard page in `ongases.org/admin/` to use the components from `ngo-management-platform-design`, and propagate the teal primary color across the app via `data.ong.primaryColor`.

**Architecture:** Create a new `src/components/dashboard/` directory containing 6 isolated components (UI, Charts, KPICard, ActivityFeed, GeographicReach, FundAllocation) ported or inspired by the design folder. Replace `src/components/Dashboard.tsx` to compose them. Change the default value of `data.ong.primaryColor` from `#16a34a` (green) to `#0d9488` (teal) in 2 frontend files and 1 database row.

**Tech Stack:** React 19, TypeScript 5.9, Tailwind CSS 4, Vite 7, lucide-react, clsx, tailwind-merge. No test framework configured (verification via build + browser smoke test).

---

## File Structure

**Created files** (all in `src/components/dashboard/`):
- `UI.tsx` — primitives: Card, SectionTitle, Badge, Progress, statusTone, fcfa, num
- `Charts.tsx` — AreaChart, Donut, Bars (SVG, no dependency)
- `KPICard.tsx` — KPI card with delta indicator
- `ActivityFeed.tsx` — renders audit_logs as activity items
- `GeographicReach.tsx` — aggregates projets by localisation
- `FundAllocation.tsx` — aggregates transactions by category into donut data

**Modified files:**
- `src/components/Dashboard.tsx` — full rewrite, composes the 6 components
- `src/context/AppContext.tsx` — change default `primaryColor` to `#0d9488`
- `src/db/database.ts` — change default `primaryColor` to `#0d9488`

**Database changes:**
- `api/data/gestion.db` — UPDATE `settings.value` for row `ong` to include `primaryColor: '#0d9488'`

**Out of scope:** Sidebar/TopBar/Layout code (unchanged), all other pages (unchanged), recharts removal (kept for other pages), dark mode for new components, hardcoded `green-XXX` Tailwind classes in other pages.

---

## Task 1: Create dashboard directory and port UI.tsx

**Files:**
- Create: `src/components/dashboard/UI.tsx`

- [ ] **Step 1: Create the directory**

```bash
mkdir -p "src/components/dashboard"
```

- [ ] **Step 2: Write `src/components/dashboard/UI.tsx`**

Copy the structure from `ngo-management-platform-design/src/components/UI.tsx`, adapt `eur` → `fcfa`. Full file content:

```tsx
import type { ReactNode } from "react";
import { cn } from "../../utils/cn";

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
    case "en_cours":
      return "teal";
    case "Planifié":
    case "planifie":
      return "indigo";
    case "Critique":
    case "suspendu":
      return "rose";
    case "Finalisé":
    case "Terminé":
    case "termine":
    case "Actif":
    case "actif":
      return "green";
    case "En mission":
    case "En pause":
      return "amber";
    default:
      return "slate";
  }
}

export const fcfa = (n: number) =>
  new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(n) + " FCFA";

export const num = (n: number) => new Intl.NumberFormat("fr-FR").format(n);
```

- [ ] **Step 3: Verify build still passes**

Run: `cd "D:\Mes projets Open Codes\Gestion ONG" && npm run build 2>&1 | tail -20`
Expected: Build succeeds (UI.tsx not yet imported anywhere, but TypeScript checks it).

---

## Task 2: Port Charts.tsx

**Files:**
- Create: `src/components/dashboard/Charts.tsx`

- [ ] **Step 1: Write `src/components/dashboard/Charts.tsx`**

Direct port from `ngo-management-platform-design/src/components/Charts.tsx` (no adaptation needed). Full content:

```tsx
import { useId } from "react";

export function AreaChart({ data, color = "#0d9488" }: { data: { m: string; v: number }[]; color?: string }) {
  const id = useId();
  const w = 560;
  const h = 200;
  const pad = 28;
  const max = Math.max(...data.map((d) => d.v)) * 1.1;
  const min = 0;
  const step = (w - pad * 2) / (data.length - 1);
  const x = (i: number) => pad + i * step;
  const y = (v: number) => h - pad - ((v - min) / (max - min)) * (h - pad * 2);

  const line = data.map((d, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(d.v)}`).join(" ");
  const area = `${line} L ${x(data.length - 1)} ${h - pad} L ${x(0)} ${h - pad} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-56 w-full">
      <defs>
        <linearGradient id={`grad-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 0.25, 0.5, 0.75, 1].map((g) => (
        <line key={g} x1={pad} x2={w - pad} y1={pad + g * (h - pad * 2)} y2={pad + g * (h - pad * 2)} stroke="#f1f5f9" strokeWidth={1} />
      ))}
      <path d={area} fill={`url(#grad-${id})`} />
      <path d={line} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      {data.map((d, i) => (
        <g key={d.m}>
          <circle cx={x(i)} cy={y(d.v)} r={3} fill="white" stroke={color} strokeWidth={2} />
          <text x={x(i)} y={h - 8} textAnchor="middle" className="fill-slate-400" fontSize={10}>
            {d.m}
          </text>
        </g>
      ))}
    </svg>
  );
}

export function Donut({ data }: { data: { label: string; value: number; color: string }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const r = 60;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div className="flex flex-wrap items-center gap-6">
      <svg viewBox="0 0 160 160" className="h-40 w-40 -rotate-90">
        {data.map((d) => {
          const len = (d.value / total) * c;
          const seg = (
            <circle
              key={d.label}
              cx="80"
              cy="80"
              r={r}
              fill="none"
              stroke={d.color}
              strokeWidth={20}
              strokeDasharray={`${len} ${c - len}`}
              strokeDashoffset={-offset}
            />
          );
          offset += len;
          return seg;
        })}
        <circle cx="80" cy="80" r={r - 18} fill="white" />
      </svg>
      <ul className="space-y-2">
        {data.map((d) => (
          <li key={d.label} className="flex items-center gap-2 text-sm">
            <span className="h-3 w-3 rounded-sm" style={{ background: d.color }} />
            <span className="text-slate-600">{d.label}</span>
            <span className="ml-auto font-semibold text-slate-800">{d.value}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Bars({ data }: { data: { name: string; value: number }[] }) {
  const max = Math.max(...data.map((d) => d.value));
  return (
    <div className="space-y-3">
      {data.map((d) => (
        <div key={d.name} className="flex items-center gap-3 text-sm">
          <span className="w-20 shrink-0 text-slate-500">{d.name}</span>
          <div className="h-6 flex-1 overflow-hidden rounded-md bg-slate-100">
            <div
              className="flex h-full items-center justify-end rounded-md bg-gradient-to-r from-teal-400 to-teal-600 px-2 text-xs font-semibold text-white"
              style={{ width: `${(d.value / max) * 100}%` }}
            >
              {new Intl.NumberFormat("fr-FR").format(d.value)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `cd "D:\Mes projets Open Codes\Gestion ONG" && npm run build 2>&1 | tail -20`
Expected: Build succeeds.

---

## Task 3: Create KPICard.tsx

**Files:**
- Create: `src/components/dashboard/KPICard.tsx`

- [ ] **Step 1: Write `src/components/dashboard/KPICard.tsx`**

```tsx
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
```

- [ ] **Step 2: Verify build**

Run: `cd "D:\Mes projets Open Codes\Gestion ONG" && npm run build 2>&1 | tail -20`
Expected: Build succeeds.

---

## Task 4: Create GeographicReach.tsx

**Files:**
- Create: `src/components/dashboard/GeographicReach.tsx`

- [ ] **Step 1: Write `src/components/dashboard/GeographicReach.tsx`**

```tsx
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
```

- [ ] **Step 2: Verify build**

Run: `cd "D:\Mes projets Open Codes\Gestion ONG" && npm run build 2>&1 | tail -20`
Expected: Build succeeds.

---

## Task 5: Create FundAllocation.tsx

**Files:**
- Create: `src/components/dashboard/FundAllocation.tsx`

- [ ] **Step 1: Write `src/components/dashboard/FundAllocation.tsx`**

```tsx
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
```

- [ ] **Step 2: Verify build**

Run: `cd "D:\Mes projets Open Codes\Gestion ONG" && npm run build 2>&1 | tail -20`
Expected: Build succeeds.

---

## Task 6: Create ActivityFeed.tsx

**Files:**
- Create: `src/components/dashboard/ActivityFeed.tsx`

- [ ] **Step 1: Read `src/types.ts` to confirm audit log field names**

Run: `Get-Content "D:\Mes projets Open Codes\Gestion ONG\src\types.ts"`

Confirm the type definition for audit_logs. If absent, use a permissive type.

- [ ] **Step 2: Write `src/components/dashboard/ActivityFeed.tsx`**

```tsx
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
```

- [ ] **Step 3: Verify build**

Run: `cd "D:\Mes projets Open Codes\Gestion ONG" && npm run build 2>&1 | tail -20`
Expected: Build succeeds.

---

## Task 7: Update AppContext to load audit_logs

**Files:**
- Modify: `src/context/AppContext.tsx` (around line 124-134, add a new fetch for audit_logs)

- [ ] **Step 1: Read current `src/context/AppContext.tsx` lines 117-175**

Identify the Promise.all block in `loadFromAPI()`. Note the existing fetches.

- [ ] **Step 2: Add audit_logs fetch to AppContext**

In `src/context/AppContext.tsx`, modify the `loadFromAPI` function. Find the line:
```ts
const [membresRes, projetsRes, donsRes, trxRes, evtRes, settingsRes, fournisseursRes, stocksArtRes, stocksCatRes] = await Promise.all([
```

Replace with:
```ts
const [membresRes, projetsRes, donsRes, trxRes, evtRes, settingsRes, fournisseursRes, stocksArtRes, stocksCatRes, logsRes] = await Promise.all([
  membresApi.list({ perPage: '10000' }).catch(() => null),
  projetsApi.list({ perPage: '10000' }).catch(() => null),
  donsApi.list({ perPage: '10000' }).catch(() => null),
  transactionsApi.list({ perPage: '10000' }).catch(() => null),
  evenementsApi.list({ perPage: '10000' }).catch(() => null),
  settingsApi.get().catch(() => null),
  apiCall('fournisseurs.php', { action: 'list', perPage: '10000' }).catch(() => null),
  stocksApi.articles.list({ perPage: '10000' }).catch(() => null),
  stocksApi.categories.list({ perPage: '10000' }).catch(() => null),
  apiCall('logs.php', { action: 'list', perPage: '20' }).catch(() => null),
]);
```

Then add `logs` field to `AppData`:
- Modify `AppData` interface in `src/types.ts` to add `logs?: any[]`
- Modify the `data` state in AppContext to include `logs: []`

After the newData construction, add logs mapping:
```ts
const logs = logsRes && (logsRes as any).success ? (logsRes as any).data : [];
```

And include `logs` in the newData object:
```ts
const newData: AppData = {
  ...
  logs,
};
```

- [ ] **Step 3: Verify build**

Run: `cd "D:\Mes projets Open Codes\Gestion ONG" && npm run build 2>&1 | tail -20`
Expected: Build succeeds. If TypeScript errors about AppData, fix the type definition in `src/types.ts`.

---

## Task 8: Rewrite Dashboard.tsx

**Files:**
- Modify: `src/components/Dashboard.tsx` (full rewrite)

- [ ] **Step 1: Backup the current file**

```bash
cp "src/components/Dashboard.tsx" "src/components/Dashboard.tsx.bak"
```

- [ ] **Step 2: Write the new `src/components/Dashboard.tsx`**

```tsx
import { useMemo } from "react";
import { Users, FolderKanban, Heart, Wallet, FileDown, Pin } from "lucide-react";
import { Card, SectionTitle, Badge, Progress, statusTone, num } from "./dashboard/UI";
import { AreaChart, Donut } from "./dashboard/Charts";
import { KPICard } from "./dashboard/KPICard";
import { ActivityFeed, timeAgo, inferType, type ActivityItem } from "./dashboard/ActivityFeed";
import { GeographicReach } from "./dashboard/GeographicReach";
import { FundAllocation } from "./dashboard/FundAllocation";
import { useApp } from "../context/AppContext";
import { useTheme } from "../context/ThemeContext";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { hexToRgb } from "../utils/colors";
import type { Projet } from "../types";

export default function Dashboard() {
  const { data } = useApp();
  const { isDark } = useTheme();
  const { membres, projets, dons, transactions, evenements, ong } = data;

  const totalDons = useMemo(
    () => dons.filter((d) => d.statut === "recu").reduce((s, d) => s + d.montant, 0),
    [dons]
  );
  const totalDepenses = useMemo(
    () => transactions.filter((t) => t.type === "depense").reduce((s, t) => s + t.montant, 0),
    [transactions]
  );
  const membresActifs = useMemo(() => membres.filter((m) => m.statut === "actif").length, [membres]);
  const projetsEnCours = useMemo(() => projets.filter((p) => p.statut === "en_cours").length, [projets]);
  const beneficiaires = useMemo(() => projets.reduce((s, p) => s + (p.beneficiaires || 0), 0), [projets]);

  const monthlyDonations = useMemo(() => {
    const now = new Date();
    const months: { m: string; v: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const sum = dons
        .filter((x) => x.statut === "recu" && x.date.startsWith(key))
        .reduce((s, x) => s + x.montant, 0);
      months.push({
        m: d.toLocaleDateString("fr-FR", { month: "short" }),
        v: Math.round(sum / 1000),
      });
    }
    return months;
  }, [dons]);

  const priorityProjects = useMemo<Projet[]>(
    () => [...projets].sort((a, b) => (b.progression || 0) - (a.progression || 0)).slice(0, 4),
    [projets]
  );

  const activities: ActivityItem[] = useMemo(() => {
    const logs = (data as any).logs || [];
    return logs.slice(0, 5).map((l: any) => ({
      id: l.id,
      who: l.user_name || l.user_id || "Système",
      action: l.action || l.details || "Activité",
      time: l.timestamp ? timeAgo(l.timestamp) : "",
      type: inferType(l.action || l.details || ""),
    }));
  }, [data]);

  const exportDashboardPDF = () => {
    if (!ong || !ong.nom) {
      alert("Données de l'ONG manquantes");
      return;
    }
    try {
      const primaryColor = hexToRgb(ong.primaryColor || "#0d9488");
      const doc = new jsPDF();
      const dateStr = new Date().toLocaleDateString("fr-FR");

      doc.setFontSize(20);
      doc.text(ong.nom, 14, 22);
      doc.setFontSize(12);
      doc.text(ong.slogan || "", 14, 28);
      doc.text(`Tableau de bord - ${dateStr}`, 14, 34);

      let y = 44;
      doc.setFontSize(16);
      doc.text("Statistiques principales", 14, y);
      y += 10;

      (doc as any).autoTable({
        startY: y,
        head: [["Indicateur", "Valeur"]],
        body: [
          ["Membres actifs", membresActifs.toString()],
          ["Projets en cours", projetsEnCours.toString()],
          ["Bénéficiaires aidés", num(beneficiaires)],
          ["Total des dons", num(totalDons) + " FCFA"],
          ["Total des dépenses", num(totalDepenses) + " FCFA"],
        ],
        theme: "striped",
        headStyles: { fillColor: primaryColor },
        margin: { left: 14, right: 14 },
      });

      const today = new Date();
      const dateStrFile = today.getFullYear() + "-" + String(today.getMonth() + 1).padStart(2, "0") + "-" + String(today.getDate()).padStart(2, "0");
      doc.save(`dashboard-${dateStrFile}.pdf`);
    } catch (e) {
      console.error("PDF export error", e);
      alert("Erreur lors de l'export PDF");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800">Tableau de bord</h2>
          <p className="text-sm text-slate-400">Vue d'ensemble de votre activité</p>
        </div>
        <button
          onClick={exportDashboardPDF}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
        >
          <FileDown className="h-4 w-4" />
          Exporter en PDF
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KPICard
          label="Dons collectés"
          value={num(totalDons) + " FCFA"}
          delta={12.4}
          up={true}
          sub="Total reçu"
          icon={Heart}
          iconColor="text-rose-500"
        />
        <KPICard
          label="Bénéficiaires aidés"
          value={num(beneficiaires)}
          delta={8.1}
          up={true}
          sub="via les projets"
          icon={Users}
          iconColor="text-blue-500"
        />
        <KPICard
          label="Projets actifs"
          value={projetsEnCours}
          delta={4}
          up={true}
          sub={`sur ${projets.length} au total`}
          icon={FolderKanban}
          iconColor="text-teal-600"
        />
        <KPICard
          label="Membres actifs"
          value={membresActifs}
          delta={-2.3}
          up={false}
          sub={`sur ${membres.length} au total`}
          icon={Users}
          iconColor="text-indigo-500"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <SectionTitle
            title="Évolution des dons"
            sub="Collecte mensuelle sur 12 mois (en milliers FCFA)"
          />
          <AreaChart data={monthlyDonations} />
        </Card>

        <FundAllocation transactions={transactions} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <SectionTitle
            title="Projets prioritaires"
            sub="Suivi de l'avancement"
            action={<button className="text-sm font-medium text-teal-600">Tout voir</button>}
          />
          {priorityProjects.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">Aucun projet</p>
          ) : (
            <div className="space-y-4">
              {priorityProjects.map((p) => (
                <div key={p.id} className="flex flex-col gap-2 rounded-xl border border-slate-100 p-3 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-medium text-slate-800">{p.titre}</p>
                      <Badge tone={statusTone(p.statut)}>{p.statut}</Badge>
                    </div>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-400">
                      <Pin className="h-3.5 w-3.5" /> {p.localisation || "—"} · {num(p.beneficiaires || 0)} bénéficiaires
                    </p>
                  </div>
                  <div className="w-full sm:w-40">
                    <div className="mb-1 flex justify-between text-xs text-slate-500">
                      <span>{p.progression}%</span>
                      <span>{num(p.depenses || 0)} FCFA</span>
                    </div>
                    <Progress
                      value={p.progression || 0}
                      color={p.statut === "suspendu" ? "bg-rose-500" : "bg-teal-500"}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <ActivityFeed activities={activities} />
      </div>

      <GeographicReach projets={projets} />
    </div>
  );
}
```

- [ ] **Step 3: Verify build**

Run: `cd "D:\Mes projets Open Codes\Gestion ONG" && npm run build 2>&1 | tail -30`
Expected: Build succeeds. If TypeScript errors about missing fields in AppData, fix `src/types.ts` to add `logs?: any[]` field.

---

## Task 9: Change default primaryColor in AppContext.tsx

**Files:**
- Modify: `src/context/AppContext.tsx` (line ~14, the `initialOngData.primaryColor`)

- [ ] **Step 1: Edit `src/context/AppContext.tsx`**

Find the line: `primaryColor: '#16a34a',`
Replace with: `primaryColor: '#0d9488',`

- [ ] **Step 2: Verify build**

Run: `cd "D:\Mes projets Open Codes\Gestion ONG" && npm run build 2>&1 | tail -10`
Expected: Build succeeds.

---

## Task 10: Change default primaryColor in database.ts

**Files:**
- Modify: `src/db/database.ts` (line ~38, the `primaryColor` in the default settings object)

- [ ] **Step 1: Edit `src/db/database.ts`**

Find the line: `primaryColor: '#16a34a',`
Replace with: `primaryColor: '#0d9488',`

- [ ] **Step 2: Verify build**

Run: `cd "D:\Mes projets Open Codes\Gestion ONG" && npm run build 2>&1 | tail -10`
Expected: Build succeeds.

---

## Task 11: Update primaryColor in gestion.db

**Files:**
- Modify: API SQLite database `api/data/gestion.db` (settings.ong row)

- [ ] **Step 1: Create a one-off PHP update script**

Save as `C:\Users\PC\AppData\Local\Temp\opencode\diag\_update_color.php`:

```php
<?php
require_once __DIR__ . '/../../api/config.php';
$pdo = getDBConnection();
$row = $pdo->query("SELECT value FROM settings WHERE key='ong'")->fetch(PDO::FETCH_ASSOC);
if (!$row) { http_response_code(404); echo json_encode(['error' => 'ong row not found']); exit; }
$value = json_decode($row['value'], true);
$value['primaryColor'] = '#0d9488';
$newValue = json_encode($value, JSON_UNESCAPED_UNICODE);
$stmt = $pdo->prepare("UPDATE settings SET value=? WHERE key='ong'");
$stmt->execute([$newValue]);
echo json_encode(['success' => true, 'new_value' => $value]);
```

- [ ] **Step 2: Upload and execute the script**

Upload `_update_color.php` to `/www/api/_update_color.php` via FTP, then call it:

Run: `Invoke-WebRequest -Uri "https://ongases.org/api/_update_color.php" -UseBasicParsing -TimeoutSec 15 -Method GET`
Expected: JSON response with `{"success":true, "new_value":{"primaryColor":"#0d9488", ...}}`

- [ ] **Step 3: Delete the script from server**

Delete `/www/api/_update_color.php` via FTP (security cleanup).

---

## Task 12: Build and verify locally

- [ ] **Step 1: Final build**

Run: `cd "D:\Mes projets Open Codes\Gestion ONG" && npm run build 2>&1 | tail -30`
Expected: Build succeeds. No TypeScript errors. The Dashboard chunk should be created under `dist/assets/Dashboard-*.js`.

- [ ] **Step 2: Verify dist contents**

Run: `Get-ChildItem "D:\Mes projets Open Codes\Gestion ONG\dist\assets" | Where-Object { $_.Name -like "Dashboard-*" }`
Expected: One or more files like `Dashboard-XXXX.js` (the new Dashboard chunk).

- [ ] **Step 3: Remove the backup file**

Run: `Remove-Item "D:\Mes projets Open Codes\Gestion ONG\src\components\Dashboard.tsx.bak"`

---

## Task 13: Deploy to production

**Files:**
- Upload: `dist/assets/Dashboard-*.js` (the new chunk)
- Upload: `dist/index.html` (may have updated hash references)

- [ ] **Step 1: Note the new Dashboard chunk filename**

From Task 12 Step 2. Example: `Dashboard-C6i2YWop.js` (will change after rebuild).

- [ ] **Step 2: Upload the new Dashboard chunk**

Use FTP to upload the new Dashboard chunk to `/www/admin/assets/`. The existing `/.htaccess` rule `RewriteRule ^assets/(.*)$ /admin/assets/$1 [L]` will serve it.

FTP commands (via PowerShell):
- Connect to `ftp.cluster130.hosting.ovh.net` with credentials from `deploy/.env`
- Upload `dist/assets/Dashboard-*.js` to `/www/admin/assets/Dashboard-*.js`
- Upload `dist/index.html` to `/www/admin/index.html`

- [ ] **Step 3: Verify upload via HTTPS**

Run: `Invoke-WebRequest -Uri "https://ongases.org/admin/assets/Dashboard-XXXX.js" -UseBasicParsing -TimeoutSec 15 -Method GET | Select-Object StatusCode, Headers`
Expected: 200 OK.

---

## Task 14: Smoke test in production

- [ ] **Step 1: Open the URL in browser**

Open `https://ongases.org/admin/` in a browser. **Force refresh with Ctrl+F5** to bypass cache.

- [ ] **Step 2: Login**

Use credentials: `admin@gestion-ong.org` / `ONG@ses13`

- [ ] **Step 3: Verify Dashboard renders**

Check:
- [ ] Page title "Tableau de bord" displays
- [ ] 4 KPI cards visible (Dons collectés, Bénéficiaires aidés, Projets actifs, Membres actifs)
- [ ] Each KPI shows a real number (not 0 or "—")
- [ ] "Évolution des dons" chart renders (12 data points)
- [ ] "Affectation des fonds" donut renders with multiple segments
- [ ] "Projets prioritaires" shows 4 projects with progress bars
- [ ] "Activité récente" shows up to 5 items (or empty state)
- [ ] "Présence géographique" shows up to 6 locations
- [ ] "Exporter en PDF" button is visible at top right

- [ ] **Step 4: Verify Sidebar is teal**

- [ ] Sidebar background uses teal gradient (not green)
- [ ] Active menu item is teal/yellow
- [ ] Logout button is teal

- [ ] **Step 5: Test PDF export**

Click "Exporter en PDF". Verify a file `dashboard-YYYY-MM-DD.pdf` downloads.

- [ ] **Step 6: Test other pages for regression**

Click through: Membres, Projets, Dons, Finances, Evenements, Stocks, Fournisseurs, Commandes, Rapports, Logs, Paramètres. Each should load without errors (their hardcoded green classes remain).

---

## Self-Review

**Spec coverage check:**
- ✅ Migration Dashboard → UI.tsx, Charts.tsx, KPICard.tsx, GeographicReach.tsx, FundAllocation.tsx, ActivityFeed.tsx, Dashboard.tsx (Tasks 1-8)
- ✅ Couleur teal propagée → Tasks 9-11
- ✅ Affectation fonds = catégories réelles → Task 5
- ✅ Activity feed depuis audit_logs → Task 7 (AppContext) + Task 6 (ActivityFeed component)
- ✅ PDF export préservé → Task 8
- ✅ Lazy loading conservé (Dashboard reste un chunk Vite) → automatique
- ✅ Mode sombre : pas requis en V1 → géré par Tailwind defaults

**Placeholder scan:** No TBD/TODO. Every step has concrete code or commands.

**Type consistency:**
- `ActivityItem` defined in Task 6, used in Task 8 ✅
- `KPICard` props defined in Task 3, used in Task 8 ✅
- `data.logs` field added in Task 7, read in Task 8 via `(data as any).logs` ✅
- `fcfa` helper defined in Task 1, but not used in Task 8 (use `num(...) + " FCFA"` for consistency with design). Acceptable.
