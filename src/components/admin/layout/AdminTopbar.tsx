//frontend/src/components/admin/layout/AdminTopbar.tsx
import type { RefObject } from "react";
import { Link } from "react-router-dom";
import { Bell, Menu, UserRound } from "lucide-react";
import { useNotifications } from "../../../hooks/useNotifications";
import ThemeQuickToggle from "../../theme/ThemeQuickToggle";

type Workspace = "operations" | "system";

interface AdminTopbarProps {
  workspace: Workspace;
  onMenuOpen: () => void;
  menuOpen: boolean;
  menuButtonRef: RefObject<HTMLButtonElement | null>;
}

export default function AdminTopbar({ workspace, onMenuOpen, menuOpen, menuButtonRef }: AdminTopbarProps) {
  const { unreadCount } = useNotifications();
  return (
    <header className="sticky top-0 z-50 h-16 border-b border-theme-border bg-theme-surface">
      <div className="flex h-full min-w-0 items-center justify-between gap-3 px-3 sm:px-5 lg:px-8">
        {/* ======================================================
            BRAND + WORKSPACE SWITCHER
        ====================================================== */}

        <div className="flex min-w-0 items-center gap-3 lg:gap-10">
          <button
            ref={menuButtonRef}
            type="button"
            onClick={onMenuOpen}
            aria-label="Open Admin navigation"
            aria-controls="admin-mobile-navigation"
            aria-expanded={menuOpen}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-control)] border border-theme-border bg-theme-inset text-theme-text transition-colors hover:bg-theme-surface-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent lg:hidden"
          >
            <Menu size={20} aria-hidden="true" />
          </button>
          <h1 className="truncate text-base font-semibold tracking-wide text-theme-text sm:text-xl">
            <span className="hidden sm:inline">STHN </span>Admin
          </h1>

          <div className="hidden overflow-hidden rounded-[var(--radius-control)] border border-theme-border bg-theme-inset lg:flex">
            <Link
              to="/admin/operations"
              className={`px-5 py-2 text-sm font-medium transition-colors ${
                workspace === "operations"
                  ? "bg-theme-accent-tint text-theme-accent"
                  : "text-theme-muted hover:bg-theme-surface-raised hover:text-theme-text"
              }`}
            >
              Operations
            </Link>

            <Link
              to="/admin/system"
              className={`px-5 py-2 text-sm font-medium transition-colors ${
                workspace === "system"
                  ? "bg-theme-accent-tint text-theme-accent"
                  : "text-theme-muted hover:bg-theme-surface-raised hover:text-theme-text"
              }`}
            >
              System
            </Link>
          </div>
        </div>

        {/* ======================================================
            RIGHT SIDE
        ====================================================== */}

        <div className="flex shrink-0 items-center gap-2 sm:gap-3 lg:gap-4">
          <ThemeQuickToggle className="inline-flex" />
          {/* Notifications */}

          <Link to="/admin/notifications" aria-label={unreadCount ? `${unreadCount} unread notifications` : "Notifications"} className="relative inline-flex h-11 items-center gap-2 rounded-[var(--radius-control)] border border-theme-border px-3 text-sm text-theme-muted transition-colors hover:bg-theme-inset hover:text-theme-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent">
            <Bell size={16} /> <span className="hidden md:inline">Notifications</span>
            {unreadCount > 0 && <span className="rounded-full bg-theme-accent px-1.5 py-0.5 text-[10px] font-semibold leading-none text-theme-primary-text">{unreadCount > 99 ? "99+" : unreadCount}</span>}
          </Link>

          {/* Admin */}

          <button type="button" aria-label="Admin account controls" className="inline-flex h-11 items-center gap-2 rounded-[var(--radius-control)] border border-theme-border bg-theme-inset px-3 text-sm font-medium text-theme-text transition-colors hover:bg-theme-surface-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent">
            <UserRound size={17} aria-hidden="true" />
            <span className="hidden sm:inline">Admin</span>
          </button>
        </div>
      </div>
    </header>
  );
}
