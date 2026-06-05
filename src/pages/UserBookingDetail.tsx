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
  status?: string;
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

  creator: {
    _id?: string;

    profile: {
      displayName?: string;
      slug?: string;
      avatarUrl?: string;
    };
  };

  service: {
    _id?: string;
    title: string;

    data?: {
      media?: string[];
      durationMinutes?: number;
    };
  };

  slots: Slot[];
}

/* ================= HELPERS ================= */

const formatTime = (date: string) =>
  new Date(date).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const getStatusClasses = (status: string) => {
  switch (status) {
    case "COMPLETED":
      return "bg-cyan-500/15 text-cyan-200 border border-cyan-400/25";

    case "EXPIRED":
      return "bg-gray-500/15 text-gray-200 border border-gray-400/20";

    case "CONFIRMED":
      return "bg-green-500/15 text-green-200 border border-green-400/25";

    case "CANCELLED":
      return "bg-orange-500/15 text-orange-200 border border-orange-400/20";

    case "REJECTED":
      return "bg-red-500/15 text-red-200 border border-red-400/20";

    case "REQUESTED":
      return "bg-yellow-500/15 text-yellow-200 border border-yellow-400/20";

    default:
      return "bg-white/10 text-white border border-white/10";
  }
};

/* ================= COMPONENT ================= */

export default function UserBookingDetail() {
  const { bookingId } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] =
    useState<Booking | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [cancelling, setCancelling] =
    useState(false);

  const [showModal, setShowModal] =
    useState(false);

  const [reviewOpen, setReviewOpen] =
    useState(false);

  const [reviewShown, setReviewShown] =
    useState(false);

  const [disputeOpen, setDisputeOpen] =
    useState(false);

  /* ================= FETCH ================= */

  const fetchBooking = async (
    silent = false
  ) => {
    try {
      if (!silent) setLoading(true);

      const res =
        await getUserBookingsAPI();

      const found =
  res.bookings.find(
    (b: Booking) =>
      b._id === bookingId
  );
setBooking(found || null);
    } catch (err) {
      console.error(
        "FETCH ERROR:",
        err
      );
    } finally {
      if (!silent)
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooking();
  }, [bookingId]);

  /* ================= POLLING ================= */

  useEffect(() => {
    const interval =
      setInterval(() => {
        fetchBooking(true);
      }, 15000);

    return () =>
      clearInterval(interval);
  }, [bookingId]);

  /* ================= REVIEW ================= */

  useEffect(() => {
    if (
      booking?.status ===
        "COMPLETED" &&
      !reviewShown
    ) {
      setReviewOpen(true);
      setReviewShown(true);
    }
  }, [
    booking?.status,
    reviewShown,
  ]);

  /* ================= CANCEL ================= */

  const handleCancel =
    async () => {
      if (!booking) return;

      try {
        setCancelling(true);

        await api.post(
          "/v1/bookings/user/cancel",
          {
            bookingId:
              booking._id,
          }
        );

        await fetchBooking();

        setShowModal(false);
      } catch (err: any) {
        alert(
          err?.response?.data
            ?.message ||
            "Failed to cancel booking"
        );
      } finally {
        setCancelling(false);
      }
    };

  /* ================= COMPLETE ================= */

  const handleCompleted = (
    updated: any
  ) => {
    setBooking(updated);
  };

  /* ================= DISPUTE ================= */

  const canRaiseDispute = () => {
    if (!booking) return false;

    if (
      [
        "CANCELLED",
        "EXPIRED",
      ].includes(booking.status)
    ) {
      return true;
    }

    if (
      booking.status ===
        "COMPLETED" &&
      booking.completedAt
    ) {
      const end =
        new Date(
          booking.completedAt
        ).getTime() +
        24 *
          60 *
          60 *
          1000;

      return (
        Date.now() < end
      );
    }

    return false;
  };

  /* ================= UI ================= */

  if (loading) {
    return (
      <UserDashboardLayout>
        <div className="mx-auto max-w-7xl space-y-3">

          <div className="h-7 w-32 animate-pulse rounded-lg bg-white/5" />

          <div className="grid gap-3 xl:grid-cols-[1.65fr_0.75fr]">

            <div className="space-y-3">

              <div className="h-[260px] animate-pulse rounded-[24px] bg-white/5" />

              <div className="h-[180px] animate-pulse rounded-[24px] bg-white/5" />
            </div>

            <div className="space-y-3">

              <div className="h-[140px] animate-pulse rounded-[24px] bg-white/5" />

              <div className="h-[180px] animate-pulse rounded-[24px] bg-white/5" />
            </div>
          </div>
        </div>
      </UserDashboardLayout>
    );
  }

  if (!booking) {
    return (
      <UserDashboardLayout>
        <div className="flex min-h-[50vh] items-center justify-center">

          <div className="w-full max-w-md rounded-[24px] border border-white/10 bg-white/[0.04] p-6 text-center">

            <h2 className="text-lg font-semibold text-white">
              Booking not found
            </h2>

            <p className="mt-2 text-sm text-white/55">
              This booking may no longer
              exist.
            </p>

            <button
              onClick={() =>
                navigate(-1)
              }
              className="mt-5 rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2 text-sm text-white hover:bg-white/[0.08]"
            >
              Go Back
            </button>
          </div>
        </div>
      </UserDashboardLayout>
    );
  }

  const totalPrice =
    booking.slots.reduce(
      (sum, s) =>
        sum + s.price,
      0
    );

  const groupedSlots: Record<
    string,
    Slot[]
  > = {};

  booking.slots.forEach(
    (slot) => {
      const dateKey =
        formatDate(
          slot.startTime
        );

      if (
        !groupedSlots[
          dateKey
        ]
      ) {
        groupedSlots[
          dateKey
        ] = [];
      }

      groupedSlots[
        dateKey
      ].push(slot);
    }
  );

  const serviceImage =
    booking?.service?.data
      ?.media?.[0] || "";

  const creatorAvatar =
    booking?.creator?.profile
      ?.avatarUrl || "";

  const creatorName =
    booking?.creator?.profile
      ?.displayName ||
    "Unknown Creator";

  const creatorSlug =
    booking?.creator?.profile
      ?.slug || "";

  return (
  <UserDashboardLayout>

    <div className="mx-auto max-w-[1020px] space-y-3 pb-4">

      {/* ================= HEADER ================= */}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">

        <div>

          <button
            onClick={() => navigate(-1)}
            className="mb-2 inline-flex items-center gap-2 text-white/45 transition hover:text-white"
          >
            ← Back
          </button>

          <h1 className="text-[22px] font-semibold tracking-tight text-[#F8FAFC]">
            Booking Details
          </h1>

          <p className="mt-1 text-xs text-white/45">
            Created on{" "}
            {new Date(
              booking.createdAt
            ).toLocaleString()}
          </p>

          <p className="mt-1 text-xs text-white/30">
            Booking ID: {booking._id}
          </p>

        </div>

        <div
          className={`inline-flex w-fit items-center gap-1.5 rounded-md px-3 py-1.5 text-[10px] font-medium ${getStatusClasses(
            booking.status
          )}`}
        >
          <div className="h-2 w-2 rounded-full bg-current" />
          {booking.status}
        </div>

      </div>

      {/* ================= MAIN GRID ================= */}

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_300px]">

        {/* ================= LEFT ================= */}

        <div className="space-y-4">

          <div className="rounded-[22px] border border-white/10 bg-gradient-to-br from-white/[0.045] to-white/[0.015] p-5 backdrop-blur-xl">

            <div className="flex flex-col gap-5 xl:flex-row">

              {/* IMAGE */}

              <div className="relative h-[210px] w-full overflow-hidden rounded-[20px] bg-[#09101F] sm:h-[230px] xl:h-[205px] xl:w-[300px] xl:flex-shrink-0">

                {serviceImage ? (
                  <img
                    src={serviceImage}
                    alt={booking.service.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-white/35">
                    No Service Media
                  </div>
                )}

              </div>

              {/* SERVICE INFO */}

              <div className="flex-1">

                <div className="inline-flex rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] text-white/50">
                  Service
                </div>

                <h2 className="mt-3 text-[20px] font-semibold text-white">
                  {booking.service.title}
                </h2>

                <div className="mt-5 flex flex-wrap gap-2">

                  <div className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-xs text-white/65">
                    Duration:{" "}
                    <span className="text-white">
                      {booking.durationMinutes} mins
                    </span>
                  </div>

                  <div className="rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-2 text-xs font-semibold text-[#86EFAC]">
                    {booking.currency} {totalPrice}
                  </div>

                </div>

              </div>

            </div>

            {/* SLOT INFORMATION */}

            <div className="mt-6 border-t border-white/5 pt-6">

              <div className="mb-4 flex items-center justify-between">

                <h3 className="text-[14px] font-semibold text-white">
                  Slot Information
                </h3>

                <div className="text-xs text-white/45">
                  {booking.slots.length} slots
                </div>

              </div>

              <div className="space-y-3">

                {Object.entries(groupedSlots).map(
                  ([date, slots]) => (

                    <div
                      key={date}
                      className="rounded-[20px] border border-white/10 bg-white/[0.03] p-3 sm:p-5"
                    >

                      <div className="mb-4 flex items-center justify-between">

                        <h4 className="font-medium text-white">
                          {date}
                        </h4>

                        <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] text-white/45">
                          {slots.length} slots
                        </div>

                      </div>

                      <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-4">

                        {slots.map((slot) => (

                          <div
                            key={slot._id}
                            className="rounded-[18px] border border-white/10 bg-white/[0.04] p-3 sm:p-4 transition hover:bg-white/[0.06]"
                          >

                            <div className="flex items-start justify-between">

                              <div>

                                <p className="text-sm font-medium text-white">
                                  {formatTime(slot.startTime)}
                                  {" - "}
                                  {formatTime(slot.endTime)}
                                </p>

                                <p className="mt-2 text-xs text-white/40">
                                  Slot Booking
                                </p>

                              </div>

                              <div className="rounded-lg border border-green-500/20 bg-green-500/10 px-3 py-1 text-xs font-medium text-[#86EFAC]">
                                {booking.currency} {slot.price}
                              </div>

                            </div>

                          </div>

                        ))}

                      </div>

                    </div>

                  )
                )}

              </div>

            </div>

          </div>

        </div>
        {/* ================= RIGHT SIDEBAR ================= */}

        <div className="space-y-4">

          {/* ================= CREATOR CARD ================= */}

          <div className="rounded-[20px] border border-white/10 bg-white/[0.04] p-2.5 shadow-[0_10px_30px_rgba(0,0,0,0.28)]">

            <div className="flex items-center justify-between">

              <h3 className="text-sm font-semibold text-white">
                Creator
              </h3>

              <div className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-[10px] text-white/45">
                Profile
              </div>

            </div>

            <button
              onClick={() =>
                creatorSlug &&
                navigate(`/creators/${creatorSlug}`)
              }
              className="mt-3 flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-left transition hover:bg-white/[0.06]"
            >

              {creatorAvatar ? (
                <img
                  src={creatorAvatar}
                  alt={creatorName}
                  className="h-12 w-12 rounded-full border border-white/10 object-cover"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] font-semibold text-white">
                  {creatorName.charAt(0)}
                </div>
              )}

              <div className="flex-1 min-w-0">

                <p className="truncate text-sm font-medium text-white">
                  {creatorName}
                </p>

                <p className="text-xs text-white/45">
                  Creator Account
                </p>

              </div>

              <div className="text-white/35">
                →
              </div>

            </button>

          </div>

          {/* ================= PAYMENT ================= */}

          <div className="rounded-[20px] border border-white/10 bg-gradient-to-br from-white/[0.045] to-white/[0.015] p-4 backdrop-blur-xl">

            <div className="flex items-center justify-between">

              <h3 className="text-sm font-semibold text-white">
                Payment
              </h3>

              <div className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-[10px] text-white/45">
                Transaction
              </div>

            </div>

            <div className="mt-4">

              <p className="text-xs text-white/45">
                Total Amount
              </p>

              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-[#86EFAC]">
                {booking.currency} {totalPrice}
              </h2>

              <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-3">

                <div className="flex items-center justify-between">

                  <span className="text-xs text-white/45">
                    Payment Status
                  </span>

                  <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-[10px] font-medium text-white">
                    {booking.paymentStatus}
                  </span>

                </div>

              </div>

            </div>

          </div>

          {/* ================= LIFECYCLE ================= */}

         <div className="rounded-[20px] border border-white/10 bg-white/[0.04] p-2.5 shadow-[0_10px_30px_rgba(0,0,0,0.28)]">

            <div className="flex items-center justify-between">

              <h3 className="text-sm font-semibold text-white">
                Booking Lifecycle
              </h3>

              <div className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-[10px] text-white/45">
                Live Status
              </div>

            </div>

            <div className="mt-4 space-y-4">

              <div className="flex items-start gap-3">

                <div className="mt-1.5 h-2 w-2 rounded-full bg-white/40" />

                <div>

                  <p className="text-sm font-medium text-white">
                    Booking Created
                  </p>

                  <p className="text-xs text-white/45">
                    {new Date(
                      booking.createdAt
                    ).toLocaleString()}
                  </p>

                </div>

              </div>

              {booking.status === "COMPLETED" &&
                booking.completedAt && (

                  <div className="flex items-start gap-3">

                    <div className="mt-1.5 h-2 w-2 rounded-full bg-green-400" />

                    <div>

                      <p className="text-sm font-medium text-white">
                        Session Completed
                      </p>

                      <p className="text-xs text-white/45">
                        {new Date(
                          booking.completedAt
                        ).toLocaleString()}
                      </p>

                    </div>

                  </div>

                )}

              {booking.status === "CANCELLED" && (

                <div className="flex items-start gap-3">

                  <div className="mt-1.5 h-2 w-2 rounded-full bg-red-400" />

                  <div>

                    <p className="text-sm font-medium text-white">
                      Booking Cancelled
                    </p>

                    <p className="text-xs text-white/45">
                      Booking was cancelled
                    </p>

                  </div>

                </div>

              )}

              {booking.status === "EXPIRED" && (

                <div className="flex items-start gap-3">

                  <div className="mt-1.5 h-2 w-2 rounded-full bg-yellow-400" />

                  <div>

                    <p className="text-sm font-medium text-white">
                      Booking Expired
                    </p>

                    <p className="text-xs text-white/45">
                      Booking expired automatically
                    </p>

                  </div>

                </div>

              )}

            </div>

          </div>

          {/* ================= ACTIONS ================= */}

          <div className="rounded-[20px] border border-white/10 bg-white/[0.04] p-3 shadow-[0_10px_30px_rgba(0,0,0,0.28)]">

            <div className="flex flex-col gap-3">

              {booking.status === "CONFIRMED" && (
                <>
                  <button
                    onClick={() =>
                      navigate(
                        `/dashboard/chat/${booking._id}`
                      )
                    }
                    className="w-full rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.10]"
                  >
                    Open Chat
                  </button>

                  <div className="overflow-hidden rounded-2xl">
                    <CompleteButton
                      bookingId={booking._id}
                      role="user"
                      onCompleted={handleCompleted}
                    />
                  </div>

                  <button
                    onClick={() => setShowModal(true)}
                    disabled={cancelling}
                    className="w-full rounded-2xl border border-red-500/20 bg-red-500/20 px-4 py-3 text-sm font-semibold text-red-200 transition hover:bg-red-500/30 disabled:opacity-60"
                  >
                    {cancelling
                      ? "Cancelling..."
                      : "Cancel Booking"}
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
                    completedAt={booking.completedAt}
                  />

                  {[
                    "CANCELLED",
                    "EXPIRED",
                  ].includes(booking.status) && (
                    <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-200">
                      You can raise a dispute for this booking
                    </div>
                  )}

                  {canRaiseDispute() && (
                    <button
                      onClick={() =>
                        setDisputeOpen(true)
                      }
                      className="w-full rounded-2xl border border-yellow-500/20 bg-yellow-500/15 px-4 py-3 text-sm font-semibold text-yellow-200 transition hover:bg-yellow-500/25"
                    >
                      Raise Dispute
                    </button>
                  )}
                </>
              )}

            </div>

          </div>

        </div>
      </div>

      {/* ================= MODALS ================= */}

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

    </div>

  </UserDashboardLayout>
);
}