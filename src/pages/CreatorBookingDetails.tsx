// frontend/src/pages/CreatorBookingDetails.tsx

import { useEffect, useMemo, useState } from "react";
import {
  useNavigate,
  useParams,
} from "react-router-dom";

import DashboardLayout from "../layouts/DashboardLayout";
import api from "../api/axios";
import { decideBookingAPI } from "../api/creatorBooking";

import CompleteButton from "../components/CompleteButton";
import ReviewModal from "../components/ReviewModal";
import DisputeModal from "../components/DisputeModal";
import DisputeTimer from "../components/DisputeTimer";

/* ================= MODAL ================= */

function ConfirmModal({
  open,
  onClose,
  onConfirm,
  loading,
}: any) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="w-full max-w-md rounded-[22px] border border-white/10 bg-[#111827] p-4 shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-white">
            Cancel Booking
          </h2>

          <p className="text-sm text-white/55">
            This action cannot be undone.
          </p>
        </div>

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-medium text-white transition hover:bg-white/[0.08]"
          >
            Keep Booking
          </button>

          <button
            onClick={onConfirm}
            disabled={loading}
            className="rounded-lg border border-red-500/20 bg-red-500/15 px-3 py-2 text-sm font-medium text-red-200 transition hover:bg-red-500/25 disabled:opacity-60"
          >
            {loading
              ? "Cancelling..."
              : "Yes, Cancel"}
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

  service: { _id?: string; title: string; data?: { media?: string[]; }; };

  slots: Slot[];
}

/* ================= COMPONENT ================= */

export default function CreatorBookingDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] =
    useState<Booking | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [processing, setProcessing] =
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

      const res = await api.get(
        `/v1/creator/bookings/${id}`
      );

      setBooking(res.data.booking);
    } catch (err: any) {
      console.error(err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchBooking();
  }, [id]);

  /* ================= POLLING ================= */

  useEffect(() => {
    if (!id) return;

    const interval = setInterval(() => {
      fetchBooking(true);
    }, 15000);

    return () => clearInterval(interval);
  }, [id]);

  /* ================= REVIEW ================= */

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
    if (!booking?._id || processing)
      return;

    try {
      setProcessing(true);

      await decideBookingAPI(
        booking._id,
        decision
      );

      setTimeout(() => {
        navigate(
          "/dashboard/creator/requests"
        );
      }, 500);
    } catch (err: any) {
      alert(
        err?.response?.data?.message ||
          "Decision failed"
      );
    } finally {
      setProcessing(false);
    }
  };

  /* ================= CANCEL ================= */

  const handleCancel = async () => {
    if (!booking?._id) return;

    setProcessing(true);

    try {
      await api.post(
        "/v1/bookings/creator/cancel-booking",
        {
          bookingId: booking._id,
        }
      );

      setProcessing(false);
      setShowModal(false);

      window.location.href =
        "/dashboard/creator/bookings";
    } catch (err: any) {
      setProcessing(false);

      alert(
        err?.response?.data?.message ||
          "Cancel failed"
      );
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
      ["CANCELLED", "EXPIRED"].includes(
        booking.status
      )
    ) {
      return true;
    }

    if (
      booking.status === "COMPLETED" &&
      booking.completedAt
    ) {
      const end =
        new Date(
          booking.completedAt
        ).getTime() +
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

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString(
      undefined,
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );

  const getStatusClasses = (
    status: string
  ) => {
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

  const groupedSlots: Record<
    string,
    Slot[]
  > = {};

  booking?.slots.forEach((slot) => {
    const dateKey = formatDate(
      slot.startTime
    );

    if (!groupedSlots[dateKey]) {
      groupedSlots[dateKey] = [];
    }

    groupedSlots[dateKey].push(slot);
  });

  const totalPrice = useMemo(() => {
    return booking?.slots.reduce(
      (sum, s) => sum + s.price,
      0
    );
  }, [booking]);

  const serviceImage =
  booking?.service?.data?.media?.[0] || "";

  /* ================= LOADING ================= */

  if (loading) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-[1500px] space-y-3">
          <div className="h-7 w-28 animate-pulse rounded-lg bg-white/5" />

          <div className="grid gap-3 xl:grid-cols-[1.65fr_0.75fr]">
            <div className="space-y-3">
              <div className="h-[260px] animate-pulse rounded-[22px] bg-white/5" />

              <div className="h-[160px] animate-pulse rounded-[22px] bg-white/5" />
            </div>

            <div className="space-y-3">
              <div className="h-[130px] animate-pulse rounded-[22px] bg-white/5" />

              <div className="h-[160px] animate-pulse rounded-[22px] bg-white/5" />
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  /* ================= EMPTY ================= */

  if (!booking) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="w-full max-w-md rounded-[22px] border border-white/10 bg-white/[0.04] p-6 text-center shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
            <h2 className="text-lg font-semibold text-white">
              Booking not found
            </h2>

            <p className="mt-2 text-sm text-white/55">
              This booking may no longer
              exist.
            </p>

            <button
              onClick={() => navigate(-1)}
              className="mt-5 rounded-lg border border-white/10 bg-white/[0.05] px-3 py-2 text-sm font-medium text-white transition hover:bg-white/[0.08]"
            >
              Go Back
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

    /* ================= UI ================= */

return (
  <DashboardLayout>
    <div className="mx-auto max-w-[1020px] space-y-3 pb-4">

      {/* ================= TOP ================= */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">

        <div>
          <button
            onClick={() => navigate(-1)}
            className="mb-1 inline-flex items-center gap-1.5 text-[16px] text-white/45 transition hover:text-white"
          >
            ← Back
          </button>

          <h1 className="text-[22px] font-semibold tracking-tight text-[#F8FAFC]">
            Booking Details
          </h1>

          <p className="mt-0.5 text-[10px] text-white/45">
            Created on{" "}
            {new Date(
              booking.createdAt
            ).toLocaleString()}
          </p>
        </div>

        <div
          className={`inline-flex w-fit items-center gap-1.5 rounded-md px-3 py-1.5 text-[10px] font-medium ${getStatusClasses(
            booking.status
          )}`}
        >
          <div className="h-1.5 w-1.5 rounded-full bg-current" />
          {booking.status}
        </div>
      </div>

      {/* ================= MAIN GRID ================= */}
      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_300px]">

        {/* ================= LEFT CONTENT ================= */}
        <div className="space-y-3">

          {/* ================= MAIN SERVICE CARD ================= */}
          <div className="rounded-[22px] border border-white/10 bg-gradient-to-br from-white/[0.04] to-white/[0.015] p-4 sm:p-5 shadow-[0_10px_30px_rgba(0,0,0,0.28)]">

            {/* ================= TOP CONTENT ================= */}
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:gap-5">

              {/* ================= IMAGE ================= */}
              <div className="relative h-[210px] w-full overflow-hidden rounded-[20px] bg-[#09101F] sm:h-[230px] xl:h-[205px] xl:w-[300px] xl:flex-shrink-0">

                {serviceImage ? (
                  <img
                    src={serviceImage}
                    alt={booking.service?.title}
                    className="h-full w-full object-cover object-center"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-[#050816]">

                    <div className="flex flex-col items-center gap-3">

                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">

                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-7 w-7 text-white/30"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={1.5}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14"
                          />

                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </div>

                      <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[9px] text-white/40">
                        No Service Media
                      </div>
                    </div>
                  </div>
                )}

                
              </div>

              {/* ================= SERVICE INFO ================= */}
              <div className="min-w-0 flex-1 pt-0 xl:pt-2">

                <div className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[8px] text-white/50">
                  Service
                </div>

                <h2 className="mt-3 text-[20px] font-semibold text-white">
                  {booking.service?.title}
                </h2>

                <div className="mt-4 flex flex-wrap gap-2">

                  <div className="rounded-md border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[10px] text-white/65">
                    Duration:{" "}
                    <span className="text-white">
                      {booking.durationMinutes} mins
                    </span>
                  </div>

                  <div className="rounded-md border border-green-500/15 bg-green-500/10 px-3 py-1.5 text-[10px] font-medium text-[#86EFAC]">
                    {booking.currency} {totalPrice}
                  </div>
                </div>

                <div className="mt-3 rounded-md border border-white/10 bg-white/[0.03] px-3 py-2">

  <p className="text-[8px] uppercase tracking-wider text-white/35">
  Booking ID
</p>

<p className="mt-1.5 break-all text-[10px] text-white/70">
  {booking._id}
</p>

</div>

              </div>
            </div>

            {/* ================= SLOT SECTION ================= */}
            <div className="mt-5 border-t border-white/5 pt-5">

              <div className="mb-4 flex items-center justify-between">

                <h3 className="text-[14px] font-semibold text-white">
                  Slot Information
                </h3>

                <div className="text-[10px] text-white/45">
                  {booking.slots.length} slots
                </div>
              </div>

              <div className="space-y-3">

                {Object.entries(groupedSlots).map(([date, slots]) => (

                  <div
                    key={date}
                    className="rounded-[20px] border border-white/10 bg-white/[0.03] p-3 sm:p-5"
                  >

                    <div className="mb-4 flex items-center justify-between">

                      <h4 className="text-[11px] font-medium text-white">
                        {date}
                      </h4>

                      <div className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[8px] text-white/45">
                        {slots.length} slots
                      </div>
                    </div>

                    {/* ================= SLOT GRID ================= */}
                    <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-4">

                      {slots.map((slot) => (

                        <div
                          key={slot._id}
                          className="rounded-[18px] border border-white/10 bg-white/[0.04] p-3 sm:p-4 transition hover:bg-white/[0.06]"
                        >

                          <div className="flex items-start justify-between gap-2">

                            <div className="min-w-0">

                              <p className="text-[10px] font-semibold leading-relaxed text-white">
                                {formatTime(
                                  slot.startTime
                                )}{" "}
                                -{" "}
                                {formatTime(
                                  slot.endTime
                                )}
                              </p>

                              <p className="mt-2 text-[8px] text-white/40">
                                Slot Booking
                              </p>
                            </div>

                            <div className="rounded-md border border-green-500/15 bg-green-500/10 px-2 py-1 text-[7px] font-medium text-[#86EFAC]">
                              {booking.currency}{" "}
                              {slot.price}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

                {/* ================= RIGHT SIDE ================= */}
<div className="space-y-3">

  {/* CLIENT */}
  <div className="rounded-[20px] border border-white/10 bg-white/[0.04] p-2.5 shadow-[0_10px_30px_rgba(0,0,0,0.28)]">

    <div className="flex items-center justify-between">

      <h3 className="text-[12px] font-semibold text-white">
        Client
      </h3>

      <div className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[7px] text-white/45">
        Profile
      </div>
    </div>

    <div className="mt-3">

      <button
        onClick={() =>
          navigate(
            `/users/${booking.user._id}`
          )
        }
        className="group flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-left transition hover:bg-white/[0.06]"
      >

        {booking.user?.avatarUrl ? (

          <img
            src={
              booking.user.avatarUrl
            }
            alt={
              booking.user.displayName
            }
            className="h-11 w-11 rounded-full border border-white/10 object-cover"
          />

        ) : (

          <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-[11px] font-semibold text-white">
            {booking.user?.displayName?.charAt(
              0
            )}
          </div>
        )}

        <div className="min-w-0 flex-1">

          <p className="truncate text-[11px] font-medium text-white">
            {
              booking.user
                ?.displayName
            }
          </p>

          <p className="mt-0.5 text-[8px] text-white/45">
            Client Account
          </p>
        </div>

        <div className="text-white/35 transition group-hover:text-white">
          →
        </div>
      </button>
    </div>
  </div>

  {/* PAYMENT */}
  <div className="rounded-[20px] border border-white/10 bg-gradient-to-br from-white/[0.04] to-white/[0.015] p-2.5 shadow-[0_10px_30px_rgba(0,0,0,0.28)]">

    <div className="flex items-center justify-between">

      <h3 className="text-[12px] font-semibold text-white">
        Payment
      </h3>

      <div className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[7px] text-white/45">
        Transaction
      </div>
    </div>

    <div className="mt-3">

      <p className="text-[8px] text-white/45">
        Total Amount
      </p>

      <h2 className="mt-2 text-[26px] font-semibold tracking-tight text-[#86EFAC] sm:text-[18px]">
        {booking.currency} {totalPrice}
      </h2>

      <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.03] p-2.5">

        <div className="flex items-center justify-between">

          <span className="text-[8px] text-white/45">
            Payment Status
          </span>

          <span className="rounded-full border border-white/10 bg-white/[0.05] px-2 py-0.5 text-[7px] font-medium text-white">
            {
              booking.paymentStatus
            }
          </span>
        </div>
      </div>
    </div>
  </div>

  {/* LIFECYCLE */}
  <div className="rounded-[20px] border border-white/10 bg-white/[0.04] p-2.5 shadow-[0_10px_30px_rgba(0,0,0,0.28)]">

    <div className="flex items-center justify-between">

      <h3 className="text-[12px] font-semibold text-white">
        Booking Lifecycle
      </h3>

      <div className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[7px] text-white/45">
        Live Status
      </div>
    </div>

    <div className="mt-4 space-y-3">

      <div className="flex items-start gap-2">

        <div className="mt-1 h-1.5 w-1.5 rounded-full bg-white/40" />

        <div>

          <p className="text-[9px] font-medium text-white">
            Booking Created
          </p>

          <p className="mt-0.5 text-[7px] text-white/45">
            {new Date(
              booking.createdAt
            ).toLocaleString()}
          </p>
        </div>
      </div>

      {booking.status === "COMPLETED" &&
        booking.completedAt && (
          <div className="flex items-start gap-2">

            <div className="mt-1 h-1.5 w-1.5 rounded-full bg-green-400" />

            <div>

              <p className="text-[9px] font-medium text-white">
                Session Completed
              </p>

              <p className="mt-0.5 text-[7px] text-white/45">
                {new Date(
                  booking.completedAt
                ).toLocaleString()}
              </p>
            </div>
          </div>
        )}

      {booking.status === "CANCELLED" && (
        <div className="flex items-start gap-2">

          <div className="mt-1 h-1.5 w-1.5 rounded-full bg-red-400" />

          <div>

            <p className="text-[9px] font-medium text-white">
              Booking Cancelled
            </p>

            <p className="mt-0.5 text-[7px] text-white/45">
              Booking was cancelled
            </p>
          </div>
        </div>
      )}

      {booking.status === "EXPIRED" && (
        <div className="flex items-start gap-2">

          <div className="mt-1 h-1.5 w-1.5 rounded-full bg-yellow-400" />

          <div>

            <p className="text-[9px] font-medium text-white">
              Booking Expired
            </p>

            <p className="mt-0.5 text-[7px] text-white/45">
              Booking expired automatically
            </p>
          </div>
        </div>
      )}
    </div>
  </div>

  {/* ACTION BAR */}
  <div className="rounded-[20px] border border-white/10 bg-white/[0.04] p-3 shadow-[0_10px_30px_rgba(0,0,0,0.28)]">

    <div className="flex flex-col gap-2">

      {/* REQUESTED */}
      {booking.status === "REQUESTED" && (
        <>
          <button
            onClick={() =>
              handleDecision("ACCEPT")
            }
            disabled={processing}
            className="w-full rounded-[16px] border border-green-500/20 bg-green-500/15 px-4 py-3 text-[11px] font-semibold text-[#86EFAC] transition hover:bg-green-500/25 disabled:opacity-60"
          >
            Accept Booking
          </button>

          <button
            onClick={() =>
              handleDecision("REJECT")
            }
            disabled={processing}
            className="w-full rounded-[16px] border border-red-500/20 bg-red-500/15 px-4 py-3 text-[11px] font-semibold text-red-200 transition hover:bg-red-500/25 disabled:opacity-60"
          >
            Reject Booking
          </button>
        </>
      )}

      {/* CONFIRMED */}
      {booking.status === "CONFIRMED" && (
        <>
          <button
            onClick={openChat}
            className="w-full rounded-[16px] border border-white/10 bg-white/[0.05] px-4 py-3 text-[11px] font-semibold text-white transition hover:bg-white/[0.10]"
          >
            Message User
          </button>

          <div className="overflow-hidden rounded-[16px]">

            <CompleteButton
              bookingId={booking._id}
              role="creator"
              onCompleted={
                handleCompleted
              }
            />
          </div>

          <button
            onClick={() =>
              setShowModal(true)
            }
            disabled={processing}
            className="w-full rounded-[16px] border border-red-500/20 bg-red-500/20 px-4 py-3 text-[11px] font-semibold text-red-200 transition hover:bg-red-500/30 disabled:opacity-60"
          >
            Cancel Booking
          </button>
        </>
      )}

      {/* COMPLETED / CANCELLED / EXPIRED */}
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
            <div className="rounded-[16px] border border-yellow-500/20 bg-yellow-500/10 px-4 py-3 text-[10px] text-yellow-200">
              You can raise a dispute for this booking
            </div>
          )}

          {canRaiseDispute() && (
            <button
              onClick={() =>
                setDisputeOpen(true)
              }
              className="w-full rounded-[16px] border border-yellow-500/20 bg-yellow-500/15 px-4 py-3 text-[11px] font-semibold text-yellow-200 transition hover:bg-yellow-500/25"
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
        onClose={() =>
          setShowModal(false)
        }
        onConfirm={handleCancel}
        loading={processing}
      />

      <ReviewModal
        open={reviewOpen}
        bookingId={booking._id}
        onClose={() =>
          setReviewOpen(false)
        }
      />

      <DisputeModal
        open={disputeOpen}
        bookingId={booking._id}
        onClose={() =>
          setDisputeOpen(false)
        }
      />
    </div>
  </DashboardLayout>
);
}
