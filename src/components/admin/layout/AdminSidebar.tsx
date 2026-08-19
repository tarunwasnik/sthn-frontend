//frontend/src/components/admin/layout/AdminSidebar.tsx

import { NavLink } from "react-router-dom";
import type { LucideIcon } from "lucide-react";

import {
  Activity,
  ArrowRightLeft,
  BadgeCheck,
  BarChart3,
  CalendarDays,
  Cpu,
  FileCheck,
  Flag,
  Hammer,
  LayoutDashboard,
  Rocket,
  ShieldAlert,
  SlidersHorizontal,
  TriangleAlert,
  UserRound,
  Users,
  Wallet,
  Wrench,
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
      {
        label: "Users",
        path: "/admin/operations/users",
        icon: Users,
      },
      {
        label: "Creators",
        path: "/admin/operations/creators",
        icon: UserRound,
      },
      {
        label: "Bookings",
        path: "/admin/operations/bookings",
        icon: CalendarDays,
      },
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
      { label: "Governance", path: "/admin/operations/governance", icon: Hammer },
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
        label: "Profile Verification",
        path: "/admin/operations/profile-verification",
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
        icon: TriangleAlert,
      },
    ],
  },

  {
    title: "OPERATIONS",
    items: [
      {
        label: "Admin Actions",
        path: "/admin/operations/actions",
        icon: Hammer,
      },
      {
        label: "Control Plane",
        path: "/admin/operations/control-plane",
        icon: SlidersHorizontal,
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
    title: "PLATFORM",
    items: [
      {
        label: "System Health",
        path: "/admin/system/health",
        icon: Activity,
      },
      {
        label: "Bootstrap",
        path: "/admin/system/bootstrap",
        icon: Rocket,
      },
    ],
  },

  {
    title: "FEATURE FLAGS",
    items: [
      {
        label: "Dashboard",
        path: "/admin/system/feature-flags",
        icon: Flag,
      },
      {
        label: "Telemetry",
        path: "/admin/system/telemetry",
        icon: BarChart3,
      },
    ],
  },

  {
    title: "SYSTEM",
    items: [
      {
        label: "System Mode",
        path: "/admin/system/mode",
        icon: Cpu,
      },
      {
        label: "Maintenance",
        path: "/admin/system/maintenance",
        icon: Wrench,
      },
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
    <aside className="sticky top-16 h-[calc(100vh-4rem)] w-72 shrink-0 overflow-y-auto border-r border-neutral-800 bg-neutral-950">
      <div className="px-5 py-6">
        {sections.map((section) => (
          <div key={section.title} className="mb-8">
            <h3 className="mb-3 px-3 text-[11px] font-bold tracking-[0.18em] text-neutral-500">
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
                        "group flex items-center gap-3 rounded-xl px-3 py-3 transition-all duration-200",

                        isActive
                          ? " bg-neutral-900 text-white"
                          : " text-neutral-400 hover:bg-neutral-900 hover:text-white",
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
