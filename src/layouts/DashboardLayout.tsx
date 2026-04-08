// frontend/src/layouts/DashboardLayout.tsx

import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Search,
  Calendar,
  DollarSign,
  Settings,
  Briefcase,
  MessageCircle,
} from "lucide-react";

interface Props {
  children: ReactNode;
}

export default function DashboardLayout({ children }: Props) {
  return (
    <div className="min-h-screen bg-[#0B1220] text-white flex">
      {/* Sidebar */}
      <aside className="w-64 bg-[#0F172A] border-r border-gray-800 flex flex-col justify-between">
        <div>
          <div className="p-6 border-b border-gray-800">
            <h1 className="text-xl font-bold">STHN</h1>
            <p className="text-sm text-gray-400">Creator Panel</p>
          </div>

          <nav className="p-4 space-y-2">
            <SidebarItem
              to="/dashboard/creator"
              icon={<LayoutDashboard size={18} />}
              label="Dashboard"
            />

            {/* ✅ NEW: CREATOR BOOKINGS */}
            <SidebarItem
              to="/dashboard/creator/bookings"
              icon={<Calendar size={18} />}
              label="My Bookings"
            />

            <SidebarItem
              to="/dashboard/creator/services"
              icon={<Briefcase size={18} />}
              label="Services"
            />

            <SidebarItem
              to="/dashboard/creator/availability"
              icon={<Calendar size={18} />}
              label="Availability"
            />

            <SidebarItem
              to="/dashboard/creator/requests"
              icon={<Calendar size={18} />}
              label="Booking Requests"
            />

            <SidebarItem
              to="/dashboard/creator/messages"
              icon={<MessageCircle size={18} />}
              label="Messages"
            />

            <SidebarItem
              to="/dashboard/creator/browse"
              icon={<Search size={18} />}
              label="Browse Creators"
            />

            <SidebarItem
              to="/dashboard/creator/earnings"
              icon={<DollarSign size={18} />}
              label="Earnings"
            />

            <SidebarItem
              to="/dashboard/creator/settings"
              icon={<Settings size={18} />}
              label="Settings"
            />
          </nav>
        </div>
      </aside>

      {/* Main Area */}
      <div className="flex-1 flex flex-col">
        <header className="h-16 border-b border-gray-800 flex items-center justify-between px-8">
          <h2 className="text-lg font-semibold">
            Creator Dashboard
          </h2>
          <div className="w-9 h-9 bg-gray-700 rounded-full" />
        </header>

        <main className="p-8">{children}</main>
      </div>
    </div>
  );
}

function SidebarItem({
  to,
  icon,
  label,
}: {
  to: string;
  icon: ReactNode;
  label: string;
}) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center space-x-3 px-3 py-2 rounded-lg transition ${
          isActive
            ? "bg-blue-600 text-white"
            : "text-gray-400 hover:bg-gray-800 hover:text-white"
        }`
      }
    >
      {icon}
      <span className="text-sm">{label}</span>
    </NavLink>
  );
}