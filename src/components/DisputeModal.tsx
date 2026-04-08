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
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
      <div className="bg-[#111827] p-6 rounded-xl w-96 space-y-4">
        <h2 className="text-white font-semibold">
          Raise Dispute
        </h2>

        <textarea
          placeholder="Enter reason..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full p-2 rounded bg-gray-800 text-white"
        />

        <div className="flex justify-end gap-3">
          <button onClick={onClose}>Cancel</button>

          <button
            onClick={handleSubmit}
            disabled={loading || !reason.trim()}
            className="bg-red-600 px-4 py-2 rounded"
          >
            {loading ? "Submitting..." : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );
}