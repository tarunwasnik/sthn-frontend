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
        className={`fixed right-0 top-0 z-50 flex h-screen w-full max-w-6xl flex-col border-l border-slate-800 bg-slate-950 shadow-2xl transition-transform duration-300 lg:w-[60vw] ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 p-6">
          <div>
            <h2 className="text-xl font-semibold text-white">{title}</h2>

            {subtitle && (
              <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
            )}
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="border-t border-slate-800 bg-slate-900 p-5">
            {footer}
          </div>
        )}
      </aside>
    </>
  );
}
