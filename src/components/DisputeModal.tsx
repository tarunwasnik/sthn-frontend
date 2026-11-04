// frontend/src/components/DisputeModal.tsx

import { useState } from "react";
import axios from "axios";
import { openDispute } from "../features/dispute/api";
import { useToast } from "../hooks/useToast";

interface Props {
  open: boolean;
  bookingId: string;
  onClose: () => void;
  onSubmitted: () => void;
}

export default function DisputeModal({
  open,
  bookingId,
  onClose,
  onSubmitted,
}: Props) {
  const { showToast } = useToast();
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!open) return null;

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);

      await openDispute({
        bookingId,
        reason,
      });

      onSubmitted();
      onClose();
      showToast("Dispute submitted.", "success");
    } catch (err: unknown) {
      console.error(err);

      const responseData = axios.isAxiosError(err) ? err.response?.data : undefined;

      setErrorMessage(
        (typeof responseData?.message === "string" && responseData.message) ||
        "Failed to raise dispute",
      );
      showToast("Couldn't submit the dispute.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
  <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4">

    <div className="w-full max-w-md rounded-[var(--radius-dialog)] border border-theme-border bg-theme-surface p-5">

      {/* HEADER */}
      <div>
        <h2 className="text-[18px] font-semibold text-theme-text">
          Raise Dispute
        </h2>

        <p className="mt-1 text-[11px] text-theme-muted">
          Explain why you believe this booking requires review.
        </p>
      </div>

      {errorMessage && (
        <p role="alert" className="mt-3 text-sm text-theme-danger">
          {errorMessage}
        </p>
      )}

      {/* REASON */}
      <div className="mt-5">

        <p className="mb-2 text-[11px] text-theme-muted">
          Dispute Reason
        </p>

        <textarea
          placeholder="Describe the issue..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="
            min-h-[170px]
            w-full
            rounded-[var(--radius-control)]
            border border-theme-border
            bg-theme-inset
            px-4 py-3
            text-sm text-theme-text
            outline-none
            transition-colors
            placeholder:text-theme-muted
            focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent
          "
        />

      </div>

      {/* WARNING */}
      <div className="mt-4 rounded-[var(--radius-control)] border border-theme-warning bg-theme-warning-tint p-4">

        <p className="text-[12px] leading-relaxed text-theme-warning">
          Submitting a dispute will notify the moderation team and may require
          additional review before resolution.
        </p>

      </div>

      {/* ACTIONS */}
      <div className="mt-5 flex gap-3">

        <button
          type="button"
          onClick={onClose}
          className="flex-1 rounded-[var(--radius-control)] border border-theme-border bg-theme-surface px-4 py-3 text-sm font-semibold text-theme-text transition-colors hover:border-theme-border-strong hover:bg-theme-inset focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading || !reason.trim()}
          className="
            flex-1
            rounded-[var(--radius-control)]
            border border-theme-danger
            bg-theme-danger-tint
            px-4 py-3
            text-sm font-semibold text-theme-danger
            transition-opacity
            hover:opacity-80
            disabled:cursor-not-allowed disabled:opacity-50
            focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent
          "
        >
          {loading
            ? "Submitting..."
            : "Submit Dispute"}
        </button>

      </div>

    </div>

  </div>
);
}
