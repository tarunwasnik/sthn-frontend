// frontend/src/layouts/DashboardLayout.tsx

import type { ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Calendar,
  Briefcase,
  MessageCircle,
  Bell,
  Search,
  Clock,
  Wallet,
  Settings,
  ChevronDown,
} from "lucide-react";
import { useEffect, useState } from "react";
import api from "../api/axios";
import { useMessaging } from "../hooks/useMessaging";
import { useNotifications } from "../hooks/useNotifications";
import { useBookingRequests } from "../hooks/useBookingRequests";
import ThemeQuickToggle from "../components/theme/ThemeQuickToggle";

interface Props {
  children: ReactNode;
}

export default function DashboardLayout({ children }: Props) {
  const navigate = useNavigate();
  const { totalUnread } = useMessaging();
  const { unreadCount: notificationUnread } = useNotifications();
  const { pendingRequestCount } = useBookingRequests();

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

  /* ================= LOCK BODY SCROLL ================= */
  useEffect(() => {
    if (showMore) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [showMore]);

  return (
    <div className="flex h-[100dvh] overflow-x-hidden bg-theme-bg text-theme-text">
      {/* ================= SIDEBAR ================= */}
      <aside className="hidden h-[100dvh] w-64 shrink-0 flex-col border-r border-theme-border bg-theme-surface md:flex">
        <div>
          <div className="border-b border-theme-border p-6">
            <h1 className="text-xl font-semibold text-theme-text">STHN</h1>

            <p className="text-sm text-theme-muted">
              Creator Panel
            </p>
          </div>

          <nav className="p-4 space-y-2">
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
              unreadCount={pendingRequestCount}
            />

            <SidebarItem
              to="/dashboard/creator/messages"
              icon={<MessageCircle size={18} />}
              label="Messages"
              unreadCount={totalUnread}
            />

            <SidebarItem
              to="/dashboard/creator/notifications"
              icon={<Bell size={18} />}
              label="Notifications"
              unreadCount={notificationUnread}
            />

            <SidebarItem
              to="/dashboard/creator/browse"
              icon={<Search size={18} />}
              label="Browse Creators"
            />

            <SidebarItem
              to="/dashboard/creator/wallet"
              icon={<Wallet size={18} />}
              label="Wallet"
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
      <div className="flex-1 h-[100dvh] flex flex-col relative min-w-0 isolate overflow-hidden">
        {/* ================= HEADER ================= */}
        <header
          className="
          h-14
          md:h-16
          flex
          items-center
          justify-between
          px-3
          sm:px-4
          md:px-6
          border-b
          border-theme-border
          bg-theme-surface
          relative
          z-10
        "
        >
          <h2 className="text-sm font-semibold text-theme-text md:text-lg">
            Creator Dashboard
          </h2>

          <div className="flex items-center gap-2">
          <ThemeQuickToggle className="hidden md:inline-flex" />
          <button
            type="button"
            aria-label="Open creator profile"
            onClick={() => navigate("/creator/profile")}
            className="
              w-9
              h-9
              rounded-full
              bg-theme-inset
              border
              border-theme-border
              overflow-hidden
              hover:bg-theme-accent-tint
              transition
            "
          >
            {avatar ? (
              <img src={avatar} className="w-full h-full object-cover" />
            ) : (
              <div
                className="
                w-full
                h-full
                flex
                items-center
                justify-center
                text-xs
                text-theme-muted
              "
              >
                C
              </div>
            )}
          </button>
          </div>
        </header>

        {/* ================= CONTENT ================= */}
        <main
          className="
          flex-1
          overflow-y-auto
          w-full
          max-w-full
          px-3
          sm:px-4
          md:px-6
          py-4
          md:py-6
          pb-[calc(8rem+env(safe-area-inset-bottom))]
          md:pb-6
          relative
          z-10
        "
        >
          {children}
        </main>

        {/* ================= MOBILE NAV ================= */}
        <nav
          className="
          fixed
          bottom-[max(0.75rem,env(safe-area-inset-bottom))]
          left-1/2
          -translate-x-1/2
          w-[95%]
          max-w-md
          bg-theme-surface-raised
          border
          border-theme-border
          rounded-[var(--radius-card)]
          flex
          justify-around
          items-center
          min-h-[68px]
          px-2
          py-2
          text-xs
          md:hidden
          shadow-sm
          z-[900]
        "
        >
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
            unreadCount={totalUnread}
          />

          <button
            onClick={() => setShowMore(true)}
            className="
              flex
              flex-col
              items-center
              justify-center
              text-theme-muted
              hover:text-theme-text
            "
          >
            <span className="text-lg">⋯</span>
            <span>More</span>
          </button>
        </nav>

        {/* ================= BOTTOM SHEET ================= */}
        {showMore && (
          <>
            {/* Overlay */}
            <div
              onClick={() => setShowMore(false)}
              className="
                fixed
                inset-0
                bg-black/50
                z-[1000]
              "
            />

            {/* Sheet Container */}
            <div className="fixed inset-x-0 bottom-0 z-[1001]">
              <div
                className="
                bg-theme-surface-raised
                border-t
                border-theme-border
                rounded-t-[var(--radius-dialog-mobile)]
                px-5
                pt-5
                pb-[calc(2.5rem+env(safe-area-inset-bottom))]
                max-h-[75vh]
                overflow-y-auto
                relative
              "
              >
                {/* Handle */}
                <div className="flex justify-center mb-4">
                  <div
                    className="
                    w-10
                    h-1
                    bg-theme-border-strong
                    rounded-full
                  "
                  />
                </div>

                {/* Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <SheetItem
                    to="/dashboard/creator/availability"
                    icon={<Calendar size={18} />}
                    label="Availability"
                    close={() => setShowMore(false)}
                  />

                  <SheetItem
                    to="/dashboard/creator/requests"
                    icon={<Clock size={18} />}
                    label="Requests"
                    unreadCount={pendingRequestCount}
                    close={() => setShowMore(false)}
                  />

                  <SheetItem
                    to="/dashboard/creator/browse"
                    icon={<Search size={18} />}
                    label="Browse"
                    close={() => setShowMore(false)}
                  />

                  <SheetItem
                    to="/dashboard/creator/wallet"
                    icon={<Wallet size={18} />}
                    label="Wallet"
                    close={() => setShowMore(false)}
                  />

                  <SheetItem
                    to="/dashboard/creator/settings"
                    icon={<Settings size={18} />}
                    label="Settings"
                    close={() => setShowMore(false)}
                  />

                  <SheetItem
                    to="/dashboard/creator/notifications"
                    icon={<Bell size={18} />}
                    label="Notifications"
                    close={() => setShowMore(false)}
                  />

                </div>

                {/* Floating Arrow */}
                <button
                  onClick={() => setShowMore(false)}
                  className="
                    absolute
                    bottom-4
                    right-4
                    w-10
                    h-10
                    flex
                    items-center
                    justify-center
                    rounded-[var(--radius-control)]
                    bg-theme-inset
                    border
                    border-theme-border
                    text-theme-muted
                    hover:bg-theme-accent-tint
                    transition
                  "
                >
                  <ChevronDown size={18} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ================= COMPONENTS ================= */

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  end?: boolean;
  unreadCount?: number;
}

function SidebarItem({ to, icon, label, end = false, unreadCount = 0 }: NavItemProps) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `
          flex
          items-center
          space-x-3
          px-3
          py-2.5
          rounded-[var(--radius-navigation)]
          transition
          border
          ${
            isActive
              ? `
                bg-theme-accent-tint
                text-theme-accent
                border-transparent
              `
              : `
                text-theme-muted
                border-transparent
                hover:bg-theme-inset
                hover:text-theme-text
              `
          }
        `
      }
    >
      {icon}

      <span className="text-sm">{label}</span>
      {unreadCount > 0 && (
        <span className="ml-auto rounded-full bg-theme-accent px-1.5 py-0.5 text-[10px] font-semibold leading-none text-theme-primary-text">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </NavLink>
  );
}

function BottomNavItem({ to, icon, label, end = false, unreadCount = 0 }: NavItemProps) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `
          flex
          flex-col
          items-center
          justify-center
          ${isActive ? "text-theme-accent" : "text-theme-muted hover:text-theme-text"}
        `
      }
    >
      <div className="relative mb-0.5">
        {icon}
        {unreadCount > 0 && (
          <span className="absolute -right-3 -top-2 rounded-full bg-theme-accent px-1 py-0.5 text-[9px] font-semibold leading-none text-theme-primary-text">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </div>

      <span>{label}</span>
    </NavLink>
  );
}

interface SheetItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  close: () => void;
  unreadCount?: number;
}

function SheetItem({ to, icon, label, close, unreadCount = 0 }: SheetItemProps) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => {
        navigate(to);
        close();
      }}
      className="
        bg-theme-inset
        border
        border-theme-border
        rounded-[var(--radius-card)]
        py-4
        flex
        flex-col
        items-center
        justify-center
        gap-2
        text-sm
        hover:bg-theme-accent-tint
        transition
      "
    >
      <div className="relative text-theme-muted">{icon}{unreadCount > 0 && <span className="absolute -right-3 -top-2 rounded-full bg-theme-accent px-1 py-0.5 text-[9px] font-semibold leading-none text-theme-primary-text">{unreadCount > 99 ? "99+" : unreadCount}</span>}</div>

      <span className="text-theme-text">{label}</span>
    </button>
  );
}
