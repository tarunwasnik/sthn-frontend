// frontend/src/components/DisputeModal.tsx

import { useState } from "react";
import api from "../api/axios";

interface Props {
  open: boolean;
  bookingId: string;
  onClose: () => void;
}

export default function DisputeModal({
  open,
  bookingId,
  onClose,
}: Props) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleSubmit = async () => {
    try {
      setLoading(true);

      await api.post("/api/v1/disputes/open", {
        bookingId,
        reason,
      });

      alert("Dispute submitted");
      onClose();
    } catch (err: any) {
      console.error(err);

      alert(
        err?.response?.data?.message ||
          "Failed to raise dispute"
      );

      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">

    <div className="w-full max-w-md rounded-[24px] border border-white/10 bg-gradient-to-br from-white/[0.04] to-white/[0.015] backdrop-blur-xl p-5 shadow-[0_20px_60px_rgba(0,0,0,0.55)]">

      {/* HEADER */}
      <div>
        <h2 className="text-[18px] font-semibold text-white">
          Raise Dispute
        </h2>

        <p className="mt-1 text-[11px] text-white/45">
          Explain why you believe this booking requires review.
        </p>
      </div>

      {/* REASON */}
      <div className="mt-5">

        <p className="mb-2 text-[11px] text-white/50">
          Dispute Reason
        </p>

        <textarea
          placeholder="Describe the issue..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="
            min-h-[170px]
            w-full
            rounded-[18px]
            border border-white/10
            bg-white/[0.03]
            px-4 py-3
            text-sm text-white
            outline-none
            transition
            placeholder:text-white/35
            focus:border-white/20
            focus:bg-white/[0.05]
          "
        />

      </div>

      {/* WARNING */}
      <div className="mt-4 rounded-[18px] border border-yellow-500/20 bg-yellow-500/10 p-4">

        <p className="text-[12px] leading-relaxed text-yellow-200">
          Submitting a dispute will notify the moderation team and may require
          additional review before resolution.
        </p>

      </div>

      {/* ACTIONS */}
      <div className="mt-5 flex gap-3">

        <button
          onClick={onClose}
          className="flex-1 rounded-[18px] border border-white/10 bg-white/[0.05] px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
        >
          Cancel
        </button>

        <button
          onClick={handleSubmit}
          disabled={loading || !reason.trim()}
          className="
            flex-1
            rounded-[18px]
            border border-red-500/20
            bg-red-500/15
            px-4 py-3
            text-sm font-semibold text-red-200
            transition
            hover:bg-red-500/25
            disabled:bg-white/[0.05]
            disabled:text-white/25
            disabled:border-white/10
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