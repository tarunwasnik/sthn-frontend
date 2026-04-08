// frontend/src/layouts/UserDashboardLayout.tsx

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Search,
  Calendar,
  MessageCircle,
  Settings,
} from "lucide-react";
import api from "../api/axios";

type Props = {
  children: ReactNode;
};

type Profile = {
  username?: string;
  profilePhotos?: string[];
  status?: string;
};

export default function UserDashboardLayout({ children }: Props) {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
  const loadProfile = async () => {
    try {
      // 1. Get auth user
      const authRes = await api.get("/auth/me");

      const userId = authRes.data.id;

      // 2. Get profile using SAME working API
      const profileRes = await api.get(`/v1/users/${userId}`);

      setProfile(profileRes.data.profile);

    } catch (err) {
      console.error("Failed to load profile", err);
    }
  };

    loadProfile();
  }, []);

  /* ================= NAME ================= */
  const displayName = profile?.username || "User";

  /* ================= AVATAR ================= */
  const avatar = profile?.profilePhotos?.[0];

  const initials = displayName
    .charAt(0)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-[#0B1220] text-white flex flex-col md:flex-row">

      {/* ================= SIDEBAR ================= */}
      <aside className="hidden md:flex w-64 bg-[#0F172A] border-r border-gray-800 flex-col">
        <div>
          <div className="p-6 border-b border-gray-800">
            <h1 className="text-xl font-bold">STHN</h1>
            <p className="text-sm text-gray-400">User Panel</p>
          </div>

          <nav className="p-4 space-y-2">
            <SidebarItem to="/dashboard/user" icon={<LayoutDashboard size={18} />} label="Dashboard" end />
            <SidebarItem to="/dashboard/user/browse" icon={<Search size={18} />} label="Browse Creators" />
            <SidebarItem to="/dashboard/user/bookings" icon={<Calendar size={18} />} label="My Bookings" />
            <SidebarItem to="/dashboard/user/messages" icon={<MessageCircle size={18} />} label="Messages" />
            <SidebarItem to="/dashboard/user/settings" icon={<Settings size={18} />} label="Settings" />
          </nav>
        </div>
      </aside>

      {/* ================= MAIN ================= */}
      <div className="flex-1 flex flex-col">

        {/* TOPBAR */}
        <header className="h-16 border-b border-gray-800 flex items-center justify-between px-4 md:px-8">
          <h2 className="text-lg font-semibold">
            Hey, {displayName} 👋
          </h2>

          {/* AVATAR */}
          <div
            onClick={() => navigate("/profile")}
            className="w-9 h-9 rounded-full bg-teal-500/20 flex items-center justify-center cursor-pointer overflow-hidden"
          >
            {avatar ? (
              <img
                src={avatar}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-sm font-semibold text-teal-300">
                {initials}
              </span>
            )}
          </div>
        </header>

        {/* CONTENT */}
        <main className="flex-1 p-4 md:p-8 pb-24 md:pb-8">
          {children}
        </main>

        {/* ================= MOBILE NAV ================= */}
        <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-[#0F172A]/95 backdrop-blur border-t border-gray-800 flex justify-around py-3">

          <BottomNavItem to="/dashboard/user" icon={<LayoutDashboard size={24} />} end />
          <BottomNavItem to="/dashboard/user/browse" icon={<Search size={24} />} />
          <BottomNavItem to="/dashboard/user/bookings" icon={<Calendar size={24} />} />
          <BottomNavItem to="/dashboard/user/messages" icon={<MessageCircle size={24} />} />
          <BottomNavItem to="/dashboard/user/settings" icon={<Settings size={24} />} />

        </nav>
      </div>
    </div>
  );
}

/* ================= SIDEBAR ================= */
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

/* ================= MOBILE NAV ================= */
function BottomNavItem({ to, icon, end = false }: any) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex flex-col items-center justify-center px-3 py-1 ${
          isActive ? "text-teal-400 scale-110" : "text-gray-400"
        }`
      }
    >
      {icon}
    </NavLink>
  );
}