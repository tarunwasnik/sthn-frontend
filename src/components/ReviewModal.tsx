// frontend/src/components/ReviewModal.tsx

import { useState } from "react";
import api from "../api/axios";
import StarRating from "./StarRating";

interface Props {
  open: boolean;
  bookingId: string;
  onClose: () => void;
}

export default function ReviewModal({
  open,
  bookingId,
  onClose,
}: Props) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [reportFlag, setReportFlag] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleSubmit = async () => {
    try {
      setLoading(true);

      await api.post(`/api/v1/reviews/${bookingId}`, {
        rating,
        comment,
        reportFlag,
      });

      alert("Review submitted!");
      onClose();
    } catch (err: any) {
      console.error(err);

      const msg =
        err?.response?.data?.message ||
        "Failed to submit review";

      if (msg.includes("already")) {
        alert("You already reviewed this booking");
      } else {
        alert(msg);
      }

      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-50">
      <div className="w-full max-w-md rounded-[24px] border border-white/10 bg-[#0A0A0A] shadow-[0_20px_60px_rgba(0,0,0,0.55)] backdrop-blur-xl p-5">
        <div>
  <h2 className="text-[18px] font-semibold text-white">
    Submit Review
  </h2>

  <p className="mt-1 text-[11px] text-white/45">
    Share your experience with this booking.
  </p>
</div>

        {/* ⭐ STAR RATING (REPLACED SELECT) */}
        <div>
          <p className="mb-2 text-[11px] text-white/50">
  Rating
</p>

          <StarRating value={rating} onChange={setRating} />
        </div>

        {/* COMMENT */}
        <textarea
          placeholder="Write a comment..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="min-h-[120px] w-full rounded-[16px] border border-white/10 bg-white/[0.04] px-3 py-3 text-[12px] text-white outline-none transition focus:border-white/20"
        />

        {/* REPORT FLAG */}
        <label className="flex items-center gap-2 text-[11px] text-white/55">
          <input
  type="checkbox"
  checked={reportFlag}
  onChange={(e) =>
    setReportFlag(e.target.checked)
  }
  className="h-4 w-4 rounded border-white/20 bg-transparent"
/>
          Report this user
        </label>

        {/* ACTIONS */}
        <div className="mt-5 flex gap-2">

  <button
    onClick={onClose}
    className="flex-1 rounded-[16px] border border-white/10 bg-white/[0.05] px-4 py-3 text-[11px] font-semibold text-white transition hover:bg-white/[0.08]"
  >
    Cancel
  </button>

  <button
    onClick={handleSubmit}
    disabled={loading}
    className="flex-1 rounded-[16px] border border-green-500/20 bg-green-500/15 px-4 py-3 text-[11px] font-semibold text-[#86EFAC] transition hover:bg-green-500/25 disabled:opacity-60"
  >
    {loading
      ? "Submitting..."
      : "Submit Review"}
  </button>

</div>

      </div>
    </div>
  );
}