// frontend/src/components/admin/layout/AdminLayout.tsx

import type { ReactNode } from "react";

import AdminTopbar from "./AdminTopbar";
import AdminSidebar from "./AdminSidebar";

type Workspace = "operations" | "system";

interface AdminLayoutProps {
  workspace: Workspace;
  children: ReactNode;
}

export default function AdminLayout({ workspace, children }: AdminLayoutProps) {
  return (
    <div className="admin-workspace min-h-[100dvh] bg-theme-bg text-theme-text">
      <style>{`
        .admin-workspace [class*="bg-neutral-"], .admin-workspace [class*="bg-slate-"] { background-color: var(--color-surface) !important; }
        .admin-workspace [class*="bg-neutral-950"], .admin-workspace [class*="bg-slate-950"] { background-color: var(--color-surface-inset) !important; }
        .admin-workspace [class*="border-neutral-"], .admin-workspace [class*="border-slate-"] { border-color: var(--color-border) !important; }
        .admin-workspace [class*="text-neutral-"], .admin-workspace [class*="text-slate-"] { color: var(--color-text-muted) !important; }
        .admin-workspace [class*="bg-cyan-"], .admin-workspace [class*="bg-sky-"] { background-color: var(--color-accent-tint) !important; }
        .admin-workspace [class*="border-cyan-"], .admin-workspace [class*="border-sky-"] { border-color: var(--color-accent) !important; }
        .admin-workspace [class*="text-cyan-"], .admin-workspace [class*="text-sky-"] { color: var(--color-accent) !important; }
        .admin-workspace [class*="bg-red-"], .admin-workspace [class*="bg-rose-"] { background-color: var(--color-danger-tint) !important; }
        .admin-workspace [class*="border-red-"], .admin-workspace [class*="border-rose-"] { border-color: var(--color-danger) !important; }
        .admin-workspace [class*="text-red-"], .admin-workspace [class*="text-rose-"] { color: var(--color-danger) !important; }
        .admin-workspace [class*="bg-amber-"], .admin-workspace [class*="bg-yellow-"] { background-color: var(--color-warning-tint) !important; }
        .admin-workspace [class*="border-amber-"], .admin-workspace [class*="border-yellow-"] { border-color: var(--color-warning) !important; }
        .admin-workspace [class*="text-amber-"], .admin-workspace [class*="text-yellow-"] { color: var(--color-warning) !important; }
        .admin-workspace [class*="bg-emerald-"] { background-color: var(--color-success-tint) !important; }
        .admin-workspace [class*="border-emerald-"] { border-color: var(--color-success) !important; }
        .admin-workspace [class*="text-emerald-"] { color: var(--color-success) !important; }
      `}</style>
      {/* ======================================================
          TOP BAR
      ====================================================== */}

      <AdminTopbar workspace={workspace} />

      {/* ======================================================
          BODY
      ====================================================== */}

      <div className="flex h-[calc(100dvh-4rem)] min-w-0">
        {/* ======================================================
            SIDEBAR
        ====================================================== */}

        <AdminSidebar workspace={workspace} />

        {/* ======================================================
            MAIN CONTENT
        ====================================================== */}

        <main className="min-w-0 flex-1 overflow-y-auto bg-theme-bg">
          <div className="mx-auto max-w-7xl p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
