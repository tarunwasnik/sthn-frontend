//frontend/src/components/admin/feedback/AdminConfirmDialog.tsx

import { AlertTriangle } from "lucide-react";

interface AdminConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: "primary" | "danger";
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function AdminConfirmDialog({
  open,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmVariant = "primary",
  loading = false,
  onConfirm,
  onCancel,
}: AdminConfirmDialogProps) {
  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50"
        onClick={onCancel}
      />

      {/* Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="w-full max-w-md rounded-[var(--radius-dialog)] border border-theme-border bg-theme-surface shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start gap-4 border-b border-theme-border p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-card)] bg-theme-danger-tint text-theme-danger">
              <AlertTriangle size={24} />
            </div>

            <div className="flex-1">
              <h2 className="text-lg font-semibold text-theme-text">{title}</h2>

              <p className="mt-2 text-sm leading-6 text-theme-muted">
                {description}
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-6">
            <button
              onClick={onCancel}
              disabled={loading}
              className="rounded-[var(--radius-control)] border border-theme-border-strong bg-transparent px-4 py-2 text-sm font-medium text-theme-text transition-colors hover:bg-theme-inset disabled:opacity-50"
            >
              {cancelText}
            </button>

            <button
              onClick={onConfirm}
              disabled={loading}
              className={`rounded-[var(--radius-control)] px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
                confirmVariant === "danger"
                  ? "bg-theme-danger text-theme-danger-tint hover:opacity-90"
                  : "bg-theme-primary text-theme-primary-text hover:opacity-90"
              }`}
            >
              {loading ? "Processing..." : confirmText}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
