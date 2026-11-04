// frontend/src/components/admin/layout/AdminLayout.tsx

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { X } from "lucide-react";

import AdminTopbar from "./AdminTopbar";
import AdminSidebar from "./AdminSidebar";

type Workspace = "operations" | "system";

interface AdminLayoutProps {
  workspace: Workspace;
  children: ReactNode;
}

export default function AdminLayout({ workspace, children }: AdminLayoutProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const menuTriggerRef = useRef<HTMLButtonElement | null>(null);
  const drawerRef = useRef<HTMLElement | null>(null);

  const closeDrawer = useCallback((restoreFocus = true) => {
    setDrawerOpen(false);
    if (restoreFocus) requestAnimationFrame(() => menuTriggerRef.current?.focus());
  }, []);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeDrawer();
        return;
      }
      if (event.key === "Tab") {
        const focusable = Array.from(drawerRef.current?.querySelectorAll<HTMLElement>("a[href], button:not([disabled])") ?? []);
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKeyDown);
    requestAnimationFrame(() => drawerRef.current?.querySelector<HTMLElement>("button, a[href]")?.focus());
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [closeDrawer, drawerOpen]);

  useEffect(() => {
    const desktopQuery = window.matchMedia("(min-width: 1024px)");
    const closeAtDesktop = () => {
      if (desktopQuery.matches) setDrawerOpen(false);
    };
    desktopQuery.addEventListener("change", closeAtDesktop);
    return () => desktopQuery.removeEventListener("change", closeAtDesktop);
  }, []);

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

      <AdminTopbar workspace={workspace} menuOpen={drawerOpen} menuButtonRef={menuTriggerRef} onMenuOpen={() => setDrawerOpen(true)} />

      {drawerOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <button type="button" aria-label="Close Admin navigation" className="absolute inset-0 cursor-default bg-black/50" onClick={() => closeDrawer()} />
          <aside ref={drawerRef} id="admin-mobile-navigation" role="dialog" aria-modal="true" aria-label="Admin navigation" className="relative flex h-full w-[min(20rem,calc(100vw-2rem))] flex-col border-r border-theme-border bg-theme-surface shadow-xl">
            <div className="flex min-h-16 items-center justify-between border-b border-theme-border px-4">
              <p className="font-semibold text-theme-text">Admin navigation</p>
              <button type="button" onClick={() => closeDrawer()} aria-label="Close Admin navigation" className="inline-flex h-11 w-11 items-center justify-center rounded-[var(--radius-control)] text-theme-muted hover:bg-theme-inset hover:text-theme-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent">
                <X size={20} aria-hidden="true" />
              </button>
            </div>
            <div className="border-b border-theme-border p-3">
              <p className="mb-2 text-xs font-medium uppercase tracking-[0.18em] text-theme-muted">Workspace</p>
              <div className="grid grid-cols-2 gap-2">
                <Link to="/admin/operations" onClick={() => closeDrawer(false)} className={`rounded-[var(--radius-control)] px-3 py-2 text-center text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent ${workspace === "operations" ? "bg-theme-accent-tint text-theme-accent" : "bg-theme-inset text-theme-muted hover:text-theme-text"}`}>Operations</Link>
                <Link to="/admin/system" onClick={() => closeDrawer(false)} className={`rounded-[var(--radius-control)] px-3 py-2 text-center text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent ${workspace === "system" ? "bg-theme-accent-tint text-theme-accent" : "bg-theme-inset text-theme-muted hover:text-theme-text"}`}>System</Link>
              </div>
            </div>
            <div className="min-h-0 flex-1">
              <AdminSidebar workspace={workspace} mobile onNavigate={() => closeDrawer(false)} />
            </div>
          </aside>
        </div>
      )}

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

        <main aria-hidden={drawerOpen || undefined} className="min-w-0 flex-1 overflow-y-auto bg-theme-bg">
          <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
