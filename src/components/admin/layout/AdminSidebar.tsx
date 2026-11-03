//frontend/src/components/admin/layout/AdminSidebar.tsx

import { NavLink } from "react-router-dom";
import type { LucideIcon } from "lucide-react";

import {
  ArrowRightLeft,
  BadgeCheck,
  CalendarDays,
  FileCheck,
  Hammer,
  LayoutDashboard,
  SlidersHorizontal,
  ShieldAlert,
  UserRound,
  Users,
  Wallet,
} from "lucide-react";

type Workspace = "operations" | "system";

interface AdminSidebarProps {
  workspace: Workspace;
}

interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

/* ======================================================
   OPERATIONS NAVIGATION
====================================================== */

const operationsSections: NavSection[] = [
  {
    title: "OVERVIEW",
    items: [
      {
        label: "Dashboard",
        path: "/admin/operations",
        icon: LayoutDashboard,
      },
    ],
  },

  {
    title: "MANAGEMENT",
    items: [
      { label: "Users", path: "/admin/operations/users", icon: Users },
      { label: "Creators", path: "/admin/operations/creators", icon: UserRound },
      { label: "Bookings", path: "/admin/operations/bookings", icon: CalendarDays },
      {
        label: "Payments",
        path: "/admin/operations/payments",
        icon: Wallet,
      },
      {
        label: "Wallet Top-ups",
        path: "/admin/operations/wallet-top-ups",
        icon: Wallet,
      },
      {
        label: "Wallet Conversions",
        path: "/admin/operations/wallet-conversions",
        icon: ArrowRightLeft,
      },
      { label: "FX Rates", path: "/admin/operations/fx-rates", icon: ArrowRightLeft },
      {
        label: "Booking Escrow",
        path: "/admin/operations/booking-escrow",
        icon: Wallet,
      },
      {
        label: "Settlements",
        path: "/admin/operations/settlements",
        icon: Wallet,
      },
      { label: "Platform Revenue", path: "/admin/operations/platform-revenue", icon: Wallet },
      { label: "Governance & Actions", path: "/admin/operations/governance", icon: Hammer },
      { label: "Control Plane", path: "/admin/operations/control-plane", icon: SlidersHorizontal },
    ],
  },

  {
    title: "MODERATION",
    items: [
      {
        label: "Creator Applications",
        path: "/admin/operations/creator-applications",
        icon: FileCheck,
      },
      {
        label: "AI Verification Queue",
        path: "/admin/operations/profile-verification",
        icon: BadgeCheck,
      },
      {
        label: "Admin Review Queue",
        path: "/admin/operations/profile-verification/admin-review",
        icon: BadgeCheck,
      },
      {
        label: "Disputes",
        path: "/admin/operations/disputes",
        icon: ShieldAlert,
      },
      {
        label: "Risk Center",
        path: "/admin/operations/risk",
        icon: ShieldAlert,
      },
    ],
  },
];

/* ======================================================
   SYSTEM NAVIGATION
====================================================== */

const systemSections: NavSection[] = [
  {
    title: "OVERVIEW",
    items: [
      {
        label: "Dashboard",
        path: "/admin/system",
        icon: LayoutDashboard,
      },
    ],
  },

  {
    title: "SYSTEM",
    items: [
      {
        label: "Wallet Backfill",
        path: "/admin/system/wallet-backfill",
        icon: Wallet,
      },
    ],
  },
];

export default function AdminSidebar({ workspace }: AdminSidebarProps) {
  const sections =
    workspace === "operations" ? operationsSections : systemSections;

  return (
    <aside className="sticky top-16 h-[calc(100dvh-4rem)] w-72 shrink-0 overflow-y-auto border-r border-theme-border bg-theme-surface">
      <div className="px-5 py-6">
        {sections.map((section) => (
          <div key={section.title} className="mb-8">
            <h3 className="mb-3 px-3 text-[11px] font-medium tracking-[0.18em] text-theme-muted">
              {section.title}
            </h3>

            <nav className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end
                    className={({ isActive }) =>
                      [
                        "group flex items-center gap-3 rounded-[var(--radius-navigation)] px-3 py-3 transition-colors duration-200",

                        isActive
                          ? "bg-theme-accent-tint text-theme-accent"
                          : "text-theme-muted hover:bg-theme-inset hover:text-theme-text",
                      ].join(" ")
                    }
                  >
                    <Icon size={19} className="shrink-0" />

                    <span className="text-sm font-medium">{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>
          </div>
        ))}
      </div>
    </aside>
  );
}
