// frontend/src/pages/CreatorBookingDetails.tsx

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import api from "../api/axios";
import { decideBookingAPI } from "../api/creatorBooking";

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
  status: string;
  price: number;
}

interface Booking {
  _id: string;
  status: string;
  paymentStatus: string;
  createdAt: string;
  expiresAt: string;
  completedAt?: string;

  price: number;
  currency: string;
  durationMinutes: number;

  user: {
    _id: string;
    displayName: string;
    avatarUrl?: string;
  };

  service: {
    title: string;
  };

  slots: Slot[];
}

/* ================= COMPONENT ================= */

export default function CreatorBookingDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewShown, setReviewShown] = useState(false);
  const [disputeOpen, setDisputeOpen] = useState(false);

  /* ================= FETCH ================= */

  const fetchBooking = async (silent = false) => {
    try {
      if (!silent) setLoading(true);

      const res = await api.get(`/v1/creator/bookings/${id}`);

      console.log("FETCH BOOKING RESPONSE:", res.data);

      setBooking(res.data.booking);
    } catch (err: any) {
      console.error("FETCH ERROR:", err);
      console.log("FETCH ERROR RESPONSE:", err?.response?.data);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchBooking();
  }, [id]);

  /* 🔁 POLLING */
  useEffect(() => {
    if (!id) return;

    const interval = setInterval(() => {
      fetchBooking(true);
    }, 15000);

    return () => clearInterval(interval);
  }, [id]);

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

  /* ================= ACTIONS ================= */

  const openChat = () => {
    if (!booking?._id) return;
    navigate(`/dashboard/chat/${booking._id}`);
  };

  const handleDecision = async (
    decision: "ACCEPT" | "REJECT"
  ) => {
    if (!booking?._id || processing) return;

    try {
      setProcessing(true);

      const res = await decideBookingAPI(
        booking._id,
        decision
      );

      console.log("DECISION RESPONSE:", res);

      setTimeout(() => {
        navigate("/dashboard/creator/requests");
      }, 500);
    } catch (err: any) {
      console.error("DECISION ERROR:", err);

      alert(err?.response?.data?.message || "Decision failed");
    } finally {
      setProcessing(false);
    }
  };

  /* ================= CANCEL ================= */

  const handleCancel = async () => {
    if (!booking?._id) return;

    setProcessing(true);

    try {
      const res = await api.post(
        "/v1/bookings/creator/cancel-booking",
        {
          bookingId: booking._id,
        }
      );

      console.log("✅ SUCCESS:", res.data);

      setProcessing(false);
      setShowModal(false);

      window.location.href =
        "/dashboard/creator/bookings";
    } catch (err: any) {
      console.error("❌ ERROR:", err);

      setProcessing(false);

      alert(
        err?.response?.data?.message ||
          "Cancel failed"
      );
    }
  };

  /* ================= COMPLETE ================= */

  const handleCompleted = (updated: any) => {
    setBooking(updated);
  };

  /* ================= DISPUTE LOGIC ================= */

  const canRaiseDispute = () => {
    if (!booking) return false;

    if (
      ["CANCELLED", "EXPIRED"].includes(
        booking.status
      )
    )
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

  /* ================= HELPERS ================= */

  const formatTime = (date: string) =>
    new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return "bg-green-600";
      case "REJECTED":
        return "bg-red-600";
      case "REQUESTED":
        return "bg-yellow-500";
      case "CANCELLED":
        return "bg-gray-500";
      default:
        return "bg-gray-600";
    }
  };

  const groupedSlots: Record<string, Slot[]> = {};

  booking?.slots.forEach((slot) => {
    const dateKey = new Date(
      slot.startTime
    ).toLocaleDateString(undefined, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    if (!groupedSlots[dateKey]) {
      groupedSlots[dateKey] = [];
    }

    groupedSlots[dateKey].push(slot);
  });

  /* ================= UI ================= */

  if (loading) {
    return (
      <DashboardLayout>
        <p className="text-gray-400">
          Loading booking...
        </p>
      </DashboardLayout>
    );
  }

  if (!booking) {
    return (
      <DashboardLayout>
        <p className="text-gray-500">
          Booking not found.
        </p>
      </DashboardLayout>
    );
  }

  const totalPrice = booking.slots.reduce(
    (sum, s) => sum + s.price,
    0
  );

  return (
    <DashboardLayout>
      <div className="max-w-3xl space-y-6">

        <button
          onClick={() => navigate(-1)}
          className="text-sm text-gray-400 hover:text-white"
        >
          ← Back
        </button>

        <h1 className="text-2xl font-bold">
          Booking Details
        </h1>

        <div className="bg-[#0B1220] border border-gray-800 rounded-2xl p-6 space-y-6">

          {/* HEADER */}
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-gray-500">
                {new Date(
                  booking.createdAt
                ).toLocaleString()}
              </p>

              <span
                className={`px-2 py-1 rounded text-xs text-white ${getStatusStyle(
                  booking.status
                )}`}
              >
                {booking.status}
              </span>
            </div>

            <p className="text-green-400 font-semibold">
              ₹{totalPrice}
            </p>
          </div>

          {/* SERVICE */}
          <div>
            <p className="text-xs text-gray-400">
              Service
            </p>
            <p className="text-lg text-white font-medium">
              {booking.service?.title}
            </p>
          </div>

          {/* USER */}
          <div>
            <p className="text-xs text-gray-400">
              User
            </p>
            <p className="text-white">
              {booking.user?.displayName}
            </p>
          </div>

          {/* SLOTS */}
          <div className="space-y-4">
            {Object.entries(groupedSlots).map(
              ([date, slots]) => (
                <div key={date}>
                  <p className="text-blue-400 font-medium mb-2">
                    {date}
                  </p>

                  <div className="space-y-2">
                    {slots.map((slot) => (
                      <div
                        key={slot._id}
                        className="bg-[#0F172A] p-3 rounded-lg border border-gray-800 flex justify-between text-sm"
                      >
                        <span>
                          {formatTime(
                            slot.startTime
                          )}{" "}
                          -{" "}
                          {formatTime(
                            slot.endTime
                          )}
                        </span>
                        <span>
                          ₹{slot.price}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            )}
          </div>

          {/* PAYMENT */}
          <p className="text-sm">
            Payment: {booking.paymentStatus}
          </p>

          {/* ACTIONS */}
          <div className="flex gap-3 flex-wrap">

            {booking.status === "REQUESTED" && (
              <>
                <button
                  onClick={() =>
                    handleDecision("ACCEPT")
                  }
                  disabled={processing}
                  className="px-4 py-2 bg-green-600 rounded-lg"
                >
                  Accept
                </button>

                <button
                  onClick={() =>
                    handleDecision("REJECT")
                  }
                  disabled={processing}
                  className="px-4 py-2 bg-red-600 rounded-lg"
                >
                  Reject
                </button>
              </>
            )}

            {booking.status === "CONFIRMED" && (
              <>
                <button
                  onClick={openChat}
                  className="px-4 py-2 bg-blue-600 rounded-lg"
                >
                  Message User
                </button>

                <CompleteButton
                  bookingId={booking._id}
                  onCompleted={handleCompleted}
                />

                <button
                  onClick={() =>
                    setShowModal(true)
                  }
                  disabled={processing}
                  className="px-4 py-2 bg-red-600 rounded-lg"
                >
                  Cancel Booking
                </button>
              </>
            )}

            {[
              "COMPLETED",
              "CANCELLED",
              "EXPIRED",
            ].includes(booking.status) && (
              <>
                <DisputeTimer
                  status={booking.status}
                  completedAt={
                    booking.completedAt
                  }
                />

                {[
                  "CANCELLED",
                  "EXPIRED",
                ].includes(booking.status) && (
                  <p className="text-yellow-400 text-sm">
                    You can raise a dispute for this booking
                  </p>
                )}

                {canRaiseDispute() && (
                  <button
                    onClick={() =>
                      setDisputeOpen(true)
                    }
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

      {/* MODALS */}
      <ConfirmModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={handleCancel}
        loading={processing}
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
    </DashboardLayout>
  );
}