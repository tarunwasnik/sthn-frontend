//frontend/src/components/admin/layout/AdminTopbar.tsx
import { Link } from "react-router-dom";
import { Bell } from "lucide-react";
import { useNotifications } from "../../../hooks/useNotifications";
import ThemeQuickToggle from "../../theme/ThemeQuickToggle";

type Workspace = "operations" | "system";

interface AdminTopbarProps {
  workspace: Workspace;
}

export default function AdminTopbar({ workspace }: AdminTopbarProps) {
  const { unreadCount } = useNotifications();
  return (
    <header className="sticky top-0 z-50 h-16 border-b border-theme-border bg-theme-surface">
      <div className="flex h-full items-center justify-between px-8">
        {/* ======================================================
            BRAND + WORKSPACE SWITCHER
        ====================================================== */}

        <div className="flex items-center gap-10">
          <h1 className="text-xl font-semibold tracking-wide text-theme-text">
            STHN Admin
          </h1>

          <div className="flex overflow-hidden rounded-[var(--radius-control)] border border-theme-border bg-theme-inset">
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

        <div className="flex items-center gap-4">
          <ThemeQuickToggle className="hidden md:inline-flex" />
          {/* Notifications */}

          <Link to="/admin/notifications" aria-label={unreadCount ? `${unreadCount} unread notifications` : "Notifications"} className="relative inline-flex items-center gap-2 rounded-[var(--radius-control)] border border-theme-border px-3 py-2 text-sm text-theme-muted transition-colors hover:bg-theme-inset hover:text-theme-text">
            <Bell size={16} /> Notifications
            {unreadCount > 0 && <span className="rounded-full bg-theme-accent px-1.5 py-0.5 text-[10px] font-semibold leading-none text-theme-primary-text">{unreadCount > 99 ? "99+" : unreadCount}</span>}
          </Link>

          {/* Admin */}

          <button className="rounded-[var(--radius-control)] border border-theme-border bg-theme-inset px-4 py-2 text-sm font-medium text-theme-text transition-colors hover:bg-theme-surface-raised">
            Admin ▼
          </button>
        </div>
      </div>
    </header>
  );
}
