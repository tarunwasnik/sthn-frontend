//frontend/src/components/admin/panel/AdminDetailPanel.tsx

import React from "react";
import { X } from "lucide-react";

interface AdminDetailPanelProps {
  title: string;
  subtitle?: string;
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export default function AdminDetailPanel({
  title,
  subtitle,
  open,
  onClose,
  children,
  footer,
}: AdminDetailPanelProps) {
  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-200 ${
          open
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
      />

      {/* Panel */}
      <aside
        className={`fixed right-0 top-0 z-50 flex h-screen w-full max-w-6xl flex-col border-l border-theme-border bg-theme-surface shadow-2xl transition-transform duration-300 lg:w-[60vw] ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-theme-border p-6">
          <div>
            <h2 className="text-xl font-semibold text-theme-text">{title}</h2>

            {subtitle && (
              <p className="mt-1 text-sm text-theme-muted">{subtitle}</p>
            )}
          </div>

          <button
            onClick={onClose}
            className="rounded-[var(--radius-control)] p-2 text-theme-muted transition hover:bg-theme-inset hover:text-theme-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="border-t border-theme-border bg-theme-inset p-5">
            {footer}
          </div>
        )}
      </aside>
    </>
  );
}
