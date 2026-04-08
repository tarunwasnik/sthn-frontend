//frontend/src/ConfirmModal.tsx

import React from "react";

export default function ConfirmModal({
  open,
  onClose,
  onConfirm,
  loading,
}: any) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <div className="bg-[#111827] p-6 rounded-xl w-96 space-y-4">
        <h2 className="text-lg font-semibold text-white">
          Cancel Booking?
        </h2>

        <p className="text-sm text-gray-400">
          This action cannot be undone.
        </p>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 rounded"
          >
            No
          </button>

          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 bg-red-600 rounded"
          >
            {loading ? "Cancelling..." : "Yes, Cancel"}
          </button>
        </div>
      </div>
    </div>
  );
}