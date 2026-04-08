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
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
      <div className="bg-[#111827] p-6 rounded-xl w-96 space-y-4">

        <h2 className="text-white font-semibold">
          Submit Review
        </h2>

        {/* ⭐ STAR RATING (REPLACED SELECT) */}
        <div>
          <p className="text-sm text-gray-400 mb-1">
            Rating
          </p>

          <StarRating value={rating} onChange={setRating} />
        </div>

        {/* COMMENT */}
        <textarea
          placeholder="Write a comment..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="w-full p-2 rounded bg-gray-800 text-white"
        />

        {/* REPORT FLAG */}
        <label className="text-sm text-gray-400 flex gap-2">
          <input
            type="checkbox"
            checked={reportFlag}
            onChange={(e) =>
              setReportFlag(e.target.checked)
            }
          />
          Report this user
        </label>

        {/* ACTIONS */}
        <div className="flex justify-end gap-3">
          <button onClick={onClose}>
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-green-600 px-4 py-2 rounded"
          >
            {loading ? "Submitting..." : "Submit"}
          </button>
        </div>

      </div>
    </div>
  );
}