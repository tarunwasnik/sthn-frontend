// frontend/src/layouts/UserDashboardLayout.tsx
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Search,
  Calendar,
  MessageCircle,
  Bell,
  Wallet,
  Settings,
  ChevronDown,
} from "lucide-react";
import api from "../api/axios";
import { useMessaging } from "../hooks/useMessaging";
import { useNotifications } from "../hooks/useNotifications";
import ThemeQuickToggle from "../components/theme/ThemeQuickToggle";

type Props = {
  children: ReactNode;
};

type Profile = {
  username?: string;
  profilePhotos?: string[];
};

export default function UserDashboardLayout({ children }: Props) {
  const navigate = useNavigate();
  const { totalUnread } = useMessaging();
  const { unreadCount: notificationUnread } = useNotifications();

  const [profile, setProfile] = useState<Profile | null>(null);

  const [showMore, setShowMore] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profileRes = await api.get("/v1/profile/me");

        setProfile(profileRes.data);
      } catch (err) {
        console.error("Failed to load profile", err);
      }
    };

    loadProfile();
  }, []);

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

  const avatar = profile?.profilePhotos?.[0];

  const displayName = profile?.username || "User";

  const initials = displayName.charAt(0).toUpperCase();

  return (
    <div className="flex h-[100dvh] overflow-x-hidden bg-theme-bg text-theme-text">
      {/* SIDEBAR */}
      <aside
        className="
          hidden
          md:flex
          w-64
          h-[100dvh]
          shrink-0
          flex-col
          bg-theme-surface
          border-r
          border-theme-border
        "
      >
        <div>
          <div
            className="
              p-6
              border-b
              border-theme-border
            "
          >
            <h1
              className="
                text-xl
              font-semibold
              text-theme-text
              "
            >
              STHN
            </h1>

            <p
              className="
                text-sm
                text-theme-muted
              "
            >
              User Panel
            </p>
          </div>

          <nav className="p-4 space-y-2">
            <SidebarItem
              to="/dashboard/user"
              icon={<LayoutDashboard size={18} />}
              label="Dashboard"
              end
            />

            <SidebarItem
              to="/dashboard/user/browse"
              icon={<Search size={18} />}
              label="Browse Creators"
            />

            <SidebarItem
              to="/dashboard/user/bookings"
              icon={<Calendar size={18} />}
              label="My Bookings"
            />

            <SidebarItem
              to="/dashboard/user/messages"
              icon={<MessageCircle size={18} />}
              label="Messages"
              unreadCount={totalUnread}
            />

            <SidebarItem
              to="/dashboard/user/notifications"
              icon={<Bell size={18} />}
              label="Notifications"
              unreadCount={notificationUnread}
            />

            <SidebarItem
              to="/dashboard/user/wallet"
              icon={<Wallet size={18} />}
              label="Wallet"
            />

            <SidebarItem
              to="/dashboard/user/settings"
              icon={<Settings size={18} />}
              label="Settings"
            />

          </nav>
        </div>
      </aside>

      {/* MAIN */}
      <div
        className="
          flex-1
          h-[100dvh]
          flex
          flex-col
          relative
          min-w-0
          isolate
          overflow-hidden
        "
      >
        {/* HEADER */}
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
          <h2
            className="
              text-sm
              md:text-lg
              font-semibold
              text-theme-text
            "
          >
            User Dashboard
          </h2>

          <div className="flex items-center gap-2">
          <ThemeQuickToggle className="hidden md:inline-flex" />
          <button
            type="button"
            aria-label="Open profile"
            onClick={() => navigate("/profile")}
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
              <img
                src={avatar}
                className="
                  w-full
                  h-full
                  object-cover
                "
              />
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
                {initials}
              </div>
            )}
          </button>
          </div>
        </header>

        {/* CONTENT */}
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

        {/* MOBILE NAV */}
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
            to="/dashboard/user"
            icon={<LayoutDashboard size={20} />}
            label="Home"
            end
          />

          <BottomNavItem
            to="/dashboard/user/browse"
            icon={<Search size={20} />}
            label="Browse"
          />

          <BottomNavItem
            to="/dashboard/user/bookings"
            icon={<Calendar size={20} />}
            label="Bookings"
          />

          <BottomNavItem
            to="/dashboard/user/wallet"
            icon={<Wallet size={20} />}
            label="Wallet"
          />

          <button
            onClick={() => setShowMore(true)}
            className="
              flex
              flex-col
              items-center
              justify-center
              text-theme-muted
            "
          >
            <span className="text-lg">⋯</span>
            <span>More</span>
          </button>
        </nav>

        {/* MORE SHEET */}
        {showMore && (
          <>
            <div
              onClick={() => setShowMore(false)}
              className="
                fixed
                inset-0
                bg-black/50
                z-[1000]
              "
            />

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

                <div className="grid grid-cols-2 gap-3">
                  <SheetItem
                    to="/dashboard/user/messages"
                    icon={<MessageCircle size={18} />}
                    label="Messages"
                    unreadCount={totalUnread}
                    close={() => setShowMore(false)}
                  />

                  <SheetItem
                    to="/dashboard/user/notifications"
                    icon={<Bell size={18} />}
                    label="Notifications"
                    unreadCount={notificationUnread}
                    close={() => setShowMore(false)}
                  />

                  <SheetItem
                    to="/dashboard/user/settings"
                    icon={<Settings size={18} />}
                    label="Settings"
                    close={() => setShowMore(false)}
                  />

                </div>

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

/* SIDEBAR ITEM */

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

function BottomNavItem({ to, icon, label, end = false }: NavItemProps) {
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
      <div className="mb-0.5">{icon}</div>

      <span>{label}</span>
    </NavLink>
  );
}

interface SheetItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  unreadCount?: number;
  close: () => void;
}

function SheetItem({ to, icon, label, unreadCount = 0, close }: SheetItemProps) {
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
      <div className="relative text-theme-muted">
        {icon}
        {unreadCount > 0 && (
          <span className="absolute -right-3 -top-2 rounded-full bg-theme-accent px-1 py-0.5 text-[9px] font-semibold leading-none text-theme-primary-text">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </div>

      <span className="text-theme-text">{label}</span>
    </button>
  );
}
