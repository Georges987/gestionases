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
