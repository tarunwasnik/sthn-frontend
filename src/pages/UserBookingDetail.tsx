// frontend/src/pages/UserBookingDetail.tsx

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import UserDashboardLayout from "../layouts/UserDashboardLayout";
import { getUserBookingsAPI } from "../api/userBooking";
import api from "../api/axios";

import CompleteButton from "../components/CompleteButton";
import ReviewModal from "../components/ReviewModal";
import DisputeModal from "../components/DisputeModal";
import DisputeTimer from "../components/DisputeTimer";

/* ================= MODAL ================= */

function ConfirmModal({ open, onClose, onConfirm, loading }: any) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
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

/* ================= TYPES ================= */

interface Slot {
  _id: string;
  startTime: string;
  endTime: string;
  price: number;
}

interface Booking {
  _id: string;
  status: string;
  paymentStatus: string;
  createdAt: string;
  expiresAt: string;
  completedAt?: string;

  service: {
    title: string;
  };

  creator: {
    profile: {
      displayName?: string;
    };
  };

  slots: Slot[];
}

/* ================= COMPONENT ================= */

export default function UserBookingDetail() {
  const { bookingId } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewShown, setReviewShown] = useState(false);
  const [disputeOpen, setDisputeOpen] = useState(false);

  /* ================= FETCH ================= */

  const fetchBooking = async (silent = false) => {
    try {
      if (!silent) setLoading(true);

      const res = await getUserBookingsAPI();

      const found = res.bookings.find(
        (b: Booking) => b._id === bookingId
      );

      setBooking(found || null);
    } catch (err) {
      console.error("FETCH ERROR:", err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooking();
  }, [bookingId]);

  /* 🔁 POLLING (AUTO COMPLETION SYNC) */
  useEffect(() => {
    const interval = setInterval(() => {
      fetchBooking(true);
    }, 15000);

    return () => clearInterval(interval);
  }, [bookingId]);

  /* 🔥 AUTO REVIEW TRIGGER */
  useEffect(() => {
    if (
      booking?.status === "COMPLETED" &&
      !reviewShown
    ) {
      setReviewOpen(true);
      setReviewShown(true);
    }
  }, [booking?.status, reviewShown]);

  /* ================= CANCEL ================= */

  const handleCancel = async () => {
    if (!booking) return;

    try {
      setCancelling(true);

      const res = await api.post("/v1/bookings/user/cancel", {
        bookingId: booking._id,
      });

      console.log("CANCEL SUCCESS:", res.data);

      await fetchBooking();
      setShowModal(false);
    } catch (err: any) {
      console.error("CANCEL ERROR:", err);

      alert(
        err?.response?.data?.message ||
          "Failed to cancel booking"
      );
    } finally {
      setCancelling(false);
    }
  };

  /* ================= COMPLETE ================= */

  const handleCompleted = (updated: any) => {
    setBooking(updated);
  };

  /* ================= DISPUTE LOGIC ================= */

  const canRaiseDispute = () => {
    if (!booking) return false;

    if (["CANCELLED", "EXPIRED"].includes(booking.status))
      return true;

    if (
      booking.status === "COMPLETED" &&
      booking.completedAt
    ) {
      const end =
        new Date(booking.completedAt).getTime() +
        24 * 60 * 60 * 1000;

      return Date.now() < end;
    }

    return false;
  };

  /* ================= UI ================= */

  if (loading) {
    return (
      <UserDashboardLayout>
        <p className="text-gray-400">Loading...</p>
      </UserDashboardLayout>
    );
  }

  if (!booking) {
    return (
      <UserDashboardLayout>
        <p className="text-red-400">Booking not found</p>
      </UserDashboardLayout>
    );
  }

  const totalPrice = booking.slots.reduce(
    (sum, s) => sum + s.price,
    0
  );

  const groupedSlots: Record<string, Slot[]> = {};

  booking.slots.forEach((slot) => {
    const dateKey = new Date(slot.startTime).toLocaleDateString(undefined, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    if (!groupedSlots[dateKey]) groupedSlots[dateKey] = [];
    groupedSlots[dateKey].push(slot);
  });

  return (
    <UserDashboardLayout>
      <div className="max-w-3xl space-y-6">
        <h1 className="text-2xl font-bold">Booking Details</h1>

        <div className="bg-[#0B1220] border border-gray-800 rounded-2xl p-6 space-y-6">

          {/* HEADER */}
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-gray-500">
                {new Date(booking.createdAt).toLocaleString()}
              </p>

              <span className="text-sm text-white font-medium">
                {booking.status}
              </span>
            </div>

            <p className="text-green-400 font-semibold">
              ₹{totalPrice}
            </p>
          </div>

          {/* SERVICE */}
          <div>
            <p className="text-xs text-gray-400">Service</p>
            <p className="text-lg text-white font-medium">
              {booking.service?.title}
            </p>
          </div>

          {/* CREATOR */}
          <div>
            <p className="text-xs text-gray-400">Creator</p>
            <p className="text-white">
              {booking.creator?.profile?.displayName || "Unknown"}
            </p>
          </div>

          {/* SLOTS */}
          <div className="space-y-4">
            {Object.entries(groupedSlots).map(([date, slots]) => (
              <div key={date}>
                <p className="text-blue-400 font-medium mb-2">
                  {date}
                </p>

                <div className="space-y-2">
                  {slots.map((slot) => {
                    const start = new Date(slot.startTime);
                    const end = new Date(slot.endTime);

                    return (
                      <div
                        key={slot._id}
                        className="bg-[#0F172A] p-3 rounded-lg border border-gray-800 flex justify-between text-sm"
                      >
                        <span>
                          {start.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}{" "}
                          -{" "}
                          {end.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>

                        <span>₹{slot.price}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* PAYMENT */}
          <p className="text-sm">
            Payment: {booking.paymentStatus}
          </p>

          {/* ACTIONS */}
          <div className="flex gap-3 flex-wrap">

            {booking.status === "CONFIRMED" && (
              <>
                <button
                  onClick={() =>
                    navigate(`/dashboard/chat/${booking._id}`)
                  }
                  className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  Open Chat
                </button>

                <CompleteButton
                  bookingId={booking._id}
                  onCompleted={handleCompleted}
                />

                <button
                  onClick={() => setShowModal(true)}
                  disabled={cancelling}
                  className="px-4 py-2 bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {cancelling ? "Cancelling..." : "Cancel Booking"}
                </button>
              </>
            )}

            {["COMPLETED", "CANCELLED", "EXPIRED"].includes(
              booking.status
            ) && (
              <>
                <DisputeTimer
                  status={booking.status}
                  completedAt={booking.completedAt}
                />

                {["CANCELLED", "EXPIRED"].includes(booking.status) && (
                  <p className="text-yellow-400 text-sm">
                    You can raise a dispute for this booking
                  </p>
                )}

                {canRaiseDispute() && (
                  <button
                    onClick={() => setDisputeOpen(true)}
                    className="px-4 py-2 bg-yellow-600 rounded-lg"
                  >
                    Raise Dispute
                  </button>
                )}
              </>
            )}

          </div>
        </div>
      </div>

      {/* MODAL */}
      <ConfirmModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={handleCancel}
        loading={cancelling}
      />

      <ReviewModal
        open={reviewOpen}
        bookingId={booking._id}
        onClose={() => setReviewOpen(false)}
      />

      <DisputeModal
        open={disputeOpen}
        bookingId={booking._id}
        onClose={() => setDisputeOpen(false)}
      />
    </UserDashboardLayout>
  );
}