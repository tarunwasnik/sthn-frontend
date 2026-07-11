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
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        onClick={() => {
          if (!loading) onCancel();
        }}
      />

      {/* Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start gap-4 border-b border-slate-800 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10 text-red-400">
              <AlertTriangle size={24} />
            </div>

            <div className="flex-1">
              <h2 className="text-lg font-semibold text-white">{title}</h2>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                {description}
              </p>
            </div>
          </div>

          {/* Body */}
          <div className="space-y-2 p-6">
            <label className="block text-sm font-medium text-slate-300">
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
                rounded-xl
                border
                bg-slate-950
                px-4
                py-3
                text-sm
                text-white
                outline-none
                transition

                ${
                  error
                    ? "border-red-500 focus:border-red-400"
                    : "border-slate-700 focus:border-blue-500"
                }

                disabled:cursor-not-allowed
                disabled:opacity-60
              `}
            />

            {error && <p className="text-sm text-red-400">{error}</p>}

            <p className="text-xs leading-5 text-slate-500">
              This feedback will be shown to the user so they know exactly what
              needs to be corrected before their profile is automatically
              resubmitted for verification.
            </p>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 border-t border-slate-800 p-6">
            <button
              onClick={onCancel}
              disabled={loading}
              className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-700 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              onClick={onConfirm}
              disabled={loading}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-500 disabled:opacity-50"
            >
              {loading ? "Rejecting..." : "Reject Profile"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
