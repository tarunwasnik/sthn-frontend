// frontend/src/components/ReviewModal.tsx

import { useState } from "react";
import axios from "axios";
import StarRating from "./StarRating";
import { submitReview } from "../features/review/api";

interface Props {
  open: boolean;
  bookingId: string;
  onClose: () => void;
  onSubmitted: () => void;
}

export default function ReviewModal({
  open,
  bookingId,
  onClose,
  onSubmitted,
}: Props) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [reportFlag, setReportFlag] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!open) return null;

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);

      await submitReview(bookingId, {
        rating,
        comment,
        reportFlag,
      });

      onSubmitted();
      onClose();
    } catch (err: unknown) {
      console.error(err);

      const responseData = axios.isAxiosError(err) ? err.response?.data : undefined;

      setErrorMessage(
        (typeof responseData?.message === "string" && responseData.message) ||
        "Failed to submit review",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4">
      <div className="w-full max-w-md rounded-[var(--radius-dialog)] border border-theme-border bg-theme-surface p-5">
        <div>
  <h2 className="text-[18px] font-semibold text-theme-text">
    Submit Review
  </h2>

  <p className="mt-1 text-[11px] text-theme-muted">
    Share your experience with this booking.
  </p>
</div>

        {/* ⭐ STAR RATING (REPLACED SELECT) */}
        <div>
          <p className="mb-2 text-[11px] text-theme-muted">
  Rating
</p>

          <StarRating value={rating} onChange={setRating} />
        </div>

        {/* COMMENT */}
        <textarea
          placeholder="Write a comment..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="min-h-[120px] w-full rounded-[var(--radius-control)] border border-theme-border bg-theme-inset px-3 py-3 text-[12px] text-theme-text outline-none transition-colors placeholder:text-theme-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent"
        />

        {/* REPORT FLAG */}
        <label className="flex items-center gap-2 text-[11px] text-theme-muted">
          <input
  type="checkbox"
  checked={reportFlag}
  onChange={(e) =>
    setReportFlag(e.target.checked)
  }
  className="h-4 w-4 rounded border-theme-border bg-theme-surface text-theme-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent"
/>
          Report this user
        </label>

        {errorMessage && (
          <p role="alert" className="text-[11px] text-theme-danger">
            {errorMessage}
          </p>
        )}

        {/* ACTIONS */}
        <div className="mt-5 flex gap-2">

  <button
    type="button"
    onClick={onClose}
    className="flex-1 rounded-[var(--radius-control)] border border-theme-border bg-theme-surface px-4 py-3 text-[11px] font-semibold text-theme-text transition-colors hover:border-theme-border-strong hover:bg-theme-inset focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent"
  >
    Cancel
  </button>

  <button
    type="button"
    onClick={handleSubmit}
    disabled={loading}
    className="flex-1 rounded-[var(--radius-control)] border border-theme-success bg-theme-success-tint px-4 py-3 text-[11px] font-semibold text-theme-success transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent"
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
