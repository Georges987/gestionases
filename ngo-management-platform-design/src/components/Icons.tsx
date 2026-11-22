import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  viewBox: "0 0 24 24",
};

export const Icon = {
  Dashboard: (p: IconProps) => (
    <svg {...base} {...p}>
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </svg>
  ),
  Project: (p: IconProps) => (
    <svg {...base} {...p}>
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    </svg>
  ),
  Heart: (p: IconProps) => (
    <svg {...base} {...p}>
      <path d="M20.8 8.6a5 5 0 0 0-8.8-3 5 5 0 0 0-8.8 3c0 4.6 5.5 8.4 8.8 10.6 3.3-2.2 8.8-6 8.8-10.6Z" />
    </svg>
  ),
  Users: (p: IconProps) => (
    <svg {...base} {...p}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20a6 6 0 0 1 12 0" />
      <path d="M16 5.2a3 3 0 0 1 0 5.6" />
      <path d="M18 20a6 6 0 0 0-3-5.2" />
    </svg>
  ),
  Hand: (p: IconProps) => (
    <svg {...base} {...p}>
      <path d="M7 11V6a1.5 1.5 0 0 1 3 0v4" />
      <path d="M10 10V4.5a1.5 1.5 0 0 1 3 0V10" />
      <path d="M13 10V5.5a1.5 1.5 0 0 1 3 0V12" />
      <path d="M16 11.5V8a1.5 1.5 0 0 1 3 0v6a6 6 0 0 1-6 6h-1.6a5 5 0 0 1-3.5-1.5L4 14.5a1.6 1.6 0 0 1 2.3-2.2L8 14" />
    </svg>
  ),
  Calendar: (p: IconProps) => (
    <svg {...base} {...p}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 9h18M8 3v4M16 3v4" />
    </svg>
  ),
  Wallet: (p: IconProps) => (
    <svg {...base} {...p}>
      <path d="M3 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v1" />
      <path d="M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2H5" />
      <circle cx="16" cy="13" r="1.3" />
    </svg>
  ),
  Chart: (p: IconProps) => (
    <svg {...base} {...p}>
      <path d="M4 4v16h16" />
      <path d="M8 14l3-4 3 3 4-6" />
    </svg>
  ),
  Settings: (p: IconProps) => (
    <svg {...base} {...p}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 0 1-4 0v-.1A1.6 1.6 0 0 0 6.8 19l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.6 1.6 0 0 0 3 13.6H3a2 2 0 0 1 0-4h.1A1.6 1.6 0 0 0 4.6 6.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.6 1.6 0 0 0 10 3.1V3a2 2 0 0 1 4 0v.1a1.6 1.6 0 0 0 2.7 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8 1.6 1.6 0 0 0 1.4 1h.2a2 2 0 0 1 0 4H21a1.6 1.6 0 0 0-1.5 1Z" />
    </svg>
  ),
  Search: (p: IconProps) => (
    <svg {...base} {...p}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  ),
  Bell: (p: IconProps) => (
    <svg {...base} {...p}>
      <path d="M6 9a6 6 0 0 1 12 0c0 6 2 7 2 7H4s2-1 2-7" />
      <path d="M10 20a2 2 0 0 0 4 0" />
    </svg>
  ),
  Plus: (p: IconProps) => (
    <svg {...base} {...p}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  Trend: (p: IconProps) => (
    <svg {...base} {...p}>
      <path d="M3 17l6-6 4 4 7-7" />
      <path d="M14 7h6v6" />
    </svg>
  ),
  TrendDown: (p: IconProps) => (
    <svg {...base} {...p}>
      <path d="M3 7l6 6 4-4 7 7" />
      <path d="M14 17h6v-6" />
    </svg>
  ),
  Globe: (p: IconProps) => (
    <svg {...base} {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18Z" />
    </svg>
  ),
  Dots: (p: IconProps) => (
    <svg {...base} {...p}>
      <circle cx="5" cy="12" r="1.4" />
      <circle cx="12" cy="12" r="1.4" />
      <circle cx="19" cy="12" r="1.4" />
    </svg>
  ),
  Check: (p: IconProps) => (
    <svg {...base} {...p}>
      <path d="m5 12 4 4 10-10" />
    </svg>
  ),
  Menu: (p: IconProps) => (
    <svg {...base} {...p}>
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  ),
  Close: (p: IconProps) => (
    <svg {...base} {...p}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  ),
  Pin: (p: IconProps) => (
    <svg {...base} {...p}>
      <path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  ),
  Clock: (p: IconProps) => (
    <svg {...base} {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  ),
  Mail: (p: IconProps) => (
    <svg {...base} {...p}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  ),
  Leaf: (p: IconProps) => (
    <svg {...base} {...p}>
      <path d="M11 20A7 7 0 0 1 4 13c0-5 4-9 16-9 0 12-4 16-9 16Z" />
      <path d="M9 14c2-4 5-6 8-7" />
    </svg>
  ),
};

export type IconName = keyof typeof Icon;
