// frontend/src/components/admin/feedback/AdminRejectDialog.tsx

import { AlertTriangle } from "lucide-react";

interface AdminRejectDialogProps {
  open: boolean;
  title: string;
  description: string;

  value: string;
  error?: string;

  loading?: boolean;

  onChange: (value: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function AdminRejectDialog({
  open,
  title,
  description,
  value,
  error = "",
  loading = false,
  onChange,
  onConfirm,
  onCancel,
}: AdminRejectDialogProps) {
  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50"
        onClick={() => {
          if (!loading) onCancel();
        }}
      />

      {/* Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="w-full max-w-lg rounded-[var(--radius-dialog)] border border-theme-border bg-theme-surface shadow-xl"
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

          {/* Body */}
          <div className="space-y-2 p-6">
            <label className="block text-sm font-medium text-theme-text">
              Rejection Reason
            </label>

            <textarea
              value={value}
              onChange={(e) => onChange(e.target.value)}
              disabled={loading}
              rows={5}
              placeholder="Explain clearly what the user needs to fix before resubmitting their profile..."
              className={`
                w-full
                resize-none
                rounded-[var(--radius-control)]
                border
                bg-theme-inset
                px-4
                py-3
                text-sm
                text-theme-text
                outline-none
                transition

                ${
                  error
                    ? "border-theme-danger focus:border-theme-danger"
                    : "border-theme-border-strong focus:border-theme-accent"
                }

                disabled:cursor-not-allowed
                disabled:opacity-60
              `}
            />

            {error && <p className="text-sm text-theme-danger">{error}</p>}

            <p className="text-xs leading-5 text-theme-muted">
              This feedback will be shown to the user so they know exactly what
              needs to be corrected before their profile is automatically
              resubmitted for verification.
            </p>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 border-t border-theme-border p-6">
            <button
              onClick={onCancel}
              disabled={loading}
              className="rounded-[var(--radius-control)] border border-theme-border-strong bg-transparent px-4 py-2 text-sm font-medium text-theme-text transition-colors hover:bg-theme-inset disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              onClick={onConfirm}
              disabled={loading}
              className="rounded-[var(--radius-control)] bg-theme-danger px-4 py-2 text-sm font-medium text-theme-danger-tint transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Rejecting..." : "Reject Profile"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
