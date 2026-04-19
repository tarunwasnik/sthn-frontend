// frontend/src/layouts/DashboardLayout.tsx

import type { ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Calendar,
  Briefcase,
  MessageCircle,
  Search,
  Clock,
  DollarSign,
  Settings,
} from "lucide-react";
import { useEffect, useState } from "react";
import api from "../api/axios";

interface Props {
  children: ReactNode;
}

export default function DashboardLayout({ children }: Props) {
  const navigate = useNavigate();

  const [avatar, setAvatar] = useState<string | null>(null);
  const [showMore, setShowMore] = useState(false);

  /* ================= FETCH AVATAR ================= */
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("/v1/profile/me");
        setAvatar(res.data?.avatar || null);
      } catch {
        setAvatar(null);
      }
    };

    fetchProfile();
  }, []);

  return (
    <div className="min-h-screen bg-[#0B1220] text-white flex">

      {/* ================= SIDEBAR (DESKTOP) ================= */}
      <aside className="hidden md:flex w-64 bg-[#0F172A] border-r border-gray-800 flex-col">
        <div>
          <div className="p-6 border-b border-gray-800">
            <h1 className="text-xl font-bold">STHN</h1>
            <p className="text-sm text-gray-400">Creator Panel</p>
          </div>

          <nav className="p-4 space-y-2">
            {/* ✅ FIXED: end added */}
            <SidebarItem
              to="/dashboard/creator"
              icon={<LayoutDashboard size={18} />}
              label="Dashboard"
              end
            />

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
              icon={<Clock size={18} />}
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

      {/* ================= MAIN ================= */}
      <div className="flex-1 flex flex-col">

        {/* ================= HEADER ================= */}
        <header className="h-14 md:h-16 border-b border-gray-800 flex items-center justify-between px-4 md:px-6">
          <h2 className="text-sm md:text-lg font-semibold">
            Creator Dashboard
          </h2>

          <div
            onClick={() => navigate("/creator/profile")}
            className="w-9 h-9 rounded-full bg-gray-700 overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-500 transition"
          >
            {avatar ? (
              <img src={avatar} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs">
                C
              </div>
            )}
          </div>
        </header>

        {/* ================= CONTENT ================= */}
        <main className="flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-6 pb-28 md:pb-6">
          {children}
        </main>

        {/* ================= MOBILE NAV ================= */}
        <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-[#0F172A]/95 backdrop-blur border-t border-gray-800 flex justify-around py-3">

          {/* ✅ FIXED: end added */}
          <BottomNavItem
            to="/dashboard/creator"
            icon={<LayoutDashboard size={20} />}
            label="Dashboard"
            end
          />

          <BottomNavItem
            to="/dashboard/creator/bookings"
            icon={<Calendar size={20} />}
            label="Bookings"
          />

          <BottomNavItem
            to="/dashboard/creator/services"
            icon={<Briefcase size={20} />}
            label="Services"
          />

          <BottomNavItem
            to="/dashboard/creator/messages"
            icon={<MessageCircle size={20} />}
            label="Messages"
          />

          <button
            onClick={() => setShowMore(true)}
            className="flex flex-col items-center text-xs text-gray-400"
          >
            <span className="text-lg">⋯</span>
            <span>More</span>
          </button>
        </nav>

        {/* ================= BOTTOM SHEET ================= */}
        {showMore && (
          <>
            <div
              onClick={() => setShowMore(false)}
              className="fixed inset-0 bg-black/50 z-40"
            />

            <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#0F172A]/95 backdrop-blur-xl border-t border-gray-800 rounded-t-2xl p-5 pt-6 pb-10 max-h-[40%] overflow-y-auto animate-slide-up">

              <div className="w-10 h-1 bg-gray-600 rounded-full mx-auto mb-4" />

              <div className="grid grid-cols-2 gap-3">

                <SheetItem to="/dashboard/creator/availability" icon={<Calendar size={18} />} label="Availability" close={() => setShowMore(false)} />
                <SheetItem to="/dashboard/creator/requests" icon={<Clock size={18} />} label="Requests" close={() => setShowMore(false)} />
                <SheetItem to="/dashboard/creator/browse" icon={<Search size={18} />} label="Browse" close={() => setShowMore(false)} />
                <SheetItem to="/dashboard/creator/earnings" icon={<DollarSign size={18} />} label="Earnings" close={() => setShowMore(false)} />
                <SheetItem to="/dashboard/creator/settings" icon={<Settings size={18} />} label="Settings" close={() => setShowMore(false)} />

              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
}

/* ================= COMPONENTS ================= */

function SidebarItem({ to, icon, label, end = false }: any) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex items-center space-x-3 px-3 py-2 rounded-lg ${
          isActive
            ? "bg-blue-600 text-white"
            : "text-gray-400 hover:bg-gray-800"
        }`
      }
    >
      {icon}
      <span className="text-sm">{label}</span>
    </NavLink>
  );
}

function BottomNavItem({ to, icon, label, end = false }: any) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex flex-col items-center justify-center text-xs ${
          isActive ? "text-teal-400" : "text-gray-400"
        }`
      }
    >
      <div>{icon}</div>
      <span>{label}</span>
    </NavLink>
  );
}

function SheetItem({ to, icon, label, close }: any) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => {
        navigate(to);
        close();
      }}
      className="bg-[#020617] border border-gray-800 rounded-lg py-4 flex flex-col items-center justify-center gap-2 text-sm font-medium hover:border-blue-500 transition"
    >
      <div className="text-blue-400">{icon}</div>
      <span>{label}</span>
    </button>
  );
}