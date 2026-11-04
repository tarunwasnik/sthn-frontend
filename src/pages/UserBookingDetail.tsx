// frontend/src/pages/UserBookingDetail.tsx

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import UserDashboardLayout from "../layouts/UserDashboardLayout";
import { getUserBookingAPI } from "../api/userBooking";
import { bookingLocalTimeZone } from "../utils/bookingDateTime";
import api from "../api/axios";
import axios from "axios";

import CompleteButton from "../components/CompleteButton";
import ReviewModal from "../components/ReviewModal";
import DisputeModal from "../components/DisputeModal";
import DisputeTimer from "../components/DisputeTimer";
import { useBookingFunding } from "../features/bookingFunding/useBookingFunding";
import { useBookingCurrencyMetadata } from "../features/bookingFunding/useBookingCurrencyMetadata";
import { formatBookingMoney } from "../features/bookingFunding/money";
import { providerFundingLabel } from "../features/bookingFunding/providerFundingLabel";
import { useBookingReview } from "../features/review/useBookingReview";
import { useBookingDispute } from "../features/dispute/useBookingDispute";
import { getMyAppealForDispute, type ParticipantAppeal } from "../features/appeal/api";
import { useToast } from "../hooks/useToast";

/* ================= MODAL ================= */

function ConfirmModal({ open, onClose, onConfirm, loading }: { open: boolean; onClose: () => void; onConfirm: () => void; loading: boolean }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm space-y-4 rounded-[var(--radius-dialog)] border border-theme-border bg-theme-surface p-6">
        <h2 className="text-lg font-semibold text-theme-text">Cancel Booking?</h2>

        <p className="text-sm text-theme-muted">This action cannot be undone.</p>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-[var(--radius-control)] border border-theme-border bg-theme-surface px-4 py-2 text-theme-text transition-colors hover:border-theme-border-strong hover:bg-theme-inset focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent">
            No
          </button>

          <button
            onClick={onConfirm}
            disabled={loading}
            className="rounded-[var(--radius-control)] bg-theme-danger px-4 py-2 text-white transition-opacity hover:opacity-90 disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent"
          >
            {loading ? "Cancelling..." : "Yes, Cancel"}
          </button>
        </div>
      </div>
    </div>
  );
}

function AppealModal({ disputeId, onClose, onSubmitted }: { disputeId: string; onClose: () => void; onSubmitted: () => void }) {
  const [reason, setReason] = useState("");
  const [evidence, setEvidence] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submit = async () => {
    if (!reason.trim()) return;
    try {
      setSubmitting(true); setError(null);
      await api.post(`/v1/appeals/${encodeURIComponent(disputeId)}`, { reason: reason.trim(), evidence: evidence.split("\n").map((item) => item.trim()).filter(Boolean) });
      onSubmitted();
    } catch (requestError) {
      const message = axios.isAxiosError(requestError) && typeof requestError.response?.data?.message === "string" ? requestError.response.data.message : "Unable to submit appeal.";
      setError(message);
    } finally { setSubmitting(false); }
  };
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"><div className="w-full max-w-md rounded-[var(--radius-dialog)] border border-theme-border bg-theme-surface p-5"><h2 className="text-lg font-semibold text-theme-text">Appeal dispute decision</h2><p className="mt-1 text-sm text-theme-muted">Explain why the resolved or rejected dispute decision should be reviewed.</p>{error && <p role="alert" className="mt-3 text-sm text-theme-danger">{error}</p>}<textarea value={reason} maxLength={1500} onChange={(event) => setReason(event.target.value)} placeholder="Appeal reason" className="mt-4 min-h-32 w-full rounded-[var(--radius-control)] border border-theme-border bg-theme-inset p-3 text-sm text-theme-text placeholder:text-theme-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent"/><textarea value={evidence} onChange={(event) => setEvidence(event.target.value)} placeholder="Optional evidence references (one per line)" className="mt-3 min-h-20 w-full rounded-[var(--radius-control)] border border-theme-border bg-theme-inset p-3 text-sm text-theme-text placeholder:text-theme-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent"/><div className="mt-4 flex gap-3"><button type="button" onClick={onClose} className="flex-1 rounded-[var(--radius-control)] border border-theme-border px-4 py-3 text-sm text-theme-text transition-colors hover:border-theme-border-strong hover:bg-theme-inset focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent">Cancel</button><button type="button" disabled={submitting || !reason.trim()} onClick={() => void submit()} className="flex-1 rounded-[var(--radius-control)] bg-theme-primary px-4 py-3 text-sm font-semibold text-theme-primary-text transition-opacity hover:opacity-90 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent">{submitting ? "Submitting..." : "Submit appeal"}</button></div></div></div>;
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
      return "border border-theme-info bg-theme-info-tint text-theme-info";

    case "EXPIRED":
      return "border border-theme-border bg-theme-inset text-theme-muted";

    case "CONFIRMED":
      return "border border-theme-success bg-theme-success-tint text-theme-success";

    case "CANCELLED":
      return "border border-theme-warning bg-theme-warning-tint text-theme-warning";

    case "REJECTED":
      return "border border-theme-danger bg-theme-danger-tint text-theme-danger";

    case "REQUESTED":
      return "border border-theme-warning bg-theme-warning-tint text-theme-warning";

    default:
      return "border border-theme-border bg-theme-inset text-theme-text";
  }
};

/* ================= COMPONENT ================= */

export default function UserBookingDetail() {
  const { showToast } = useToast();
  const { bookingId } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { funding } = useBookingFunding(bookingId);
  const bookingCurrencies = useBookingCurrencyMetadata();
  const {
    reviewState,
    loading: reviewLoading,
    error: reviewError,
    refresh: refreshReviewState,
  } = useBookingReview(booking?.status === "COMPLETED" ? bookingId : undefined);
  const {
    disputeState,
    loading: disputeLoading,
    error: disputeError,
    refresh: refreshDisputeState,
  } = useBookingDispute(booking?._id);

  const [loading, setLoading] = useState(true);

  const [cancelling, setCancelling] = useState(false);

  const [showModal, setShowModal] = useState(false);

  const [reviewOpen, setReviewOpen] = useState(false);

  const [reviewShown, setReviewShown] = useState(false);

  const [disputeOpen, setDisputeOpen] = useState(false);
  const [appealOpen, setAppealOpen] = useState(false);
  const [appeal, setAppeal] = useState<ParticipantAppeal | null>(null);
  const [appealLoading, setAppealLoading] = useState(false);
  const [appealError, setAppealError] = useState<string | null>(null);

  /* ================= FETCH ================= */

  const fetchBooking = async () => {
    try {
      setLoading(true); setError(null);
      if (!bookingId) { setBooking(null); return; }
      const res = await getUserBookingAPI(bookingId);
      setBooking(res.booking ?? null);
    } catch (requestError) {
      setBooking(null);
      setError(axios.isAxiosError(requestError) && typeof requestError.response?.data?.message === "string" ? requestError.response.data.message : "Unable to load this booking.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooking();
  }, [bookingId]);

  const refreshAppeal = async () => {
    const disputeId = disputeState?.dispute?.disputeId;
    if (!disputeId || !["RESOLVED", "REJECTED"].includes(disputeState.dispute?.status ?? "")) { setAppeal(null); return; }
    try { setAppealLoading(true); setAppealError(null); setAppeal(await getMyAppealForDispute(disputeId)); }
    catch { setAppealError("Appeal status is unavailable right now."); }
    finally { setAppealLoading(false); }
  };

  useEffect(() => { void refreshAppeal(); }, [disputeState?.dispute?.disputeId, disputeState?.dispute?.status]);

  /* ================= REVIEW ================= */

  useEffect(() => {
    if (
      booking?.status === "COMPLETED" &&
      !reviewLoading &&
      reviewState?.hasReviewed === false &&
      !reviewShown
    ) {
      setReviewOpen(true);
      setReviewShown(true);
    }
  }, [booking?.status, reviewLoading, reviewShown, reviewState?.hasReviewed]);

  /* ================= CANCEL ================= */

  const handleCancel = async () => {
    if (!booking) return;

    try {
      setCancelling(true);

      await api.post(`/v1/bookings/${booking._id}/cancel`);

      await fetchBooking();

      setShowModal(false);
      showToast("Booking cancelled.", "success");
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.message
        : null;
      showToast(typeof message === "string" ? message : "Failed to cancel booking", "error");
    } finally {
      setCancelling(false);
    }
  };

  /* ================= COMPLETE ================= */

  const handleCompleted = (updated: Booking) => {
    setBooking(updated);
  };

  /* ================= UI ================= */

  if (loading) {
    return (
      <UserDashboardLayout>
        <div className="mx-auto max-w-[1500px] space-y-3">
          <div className="h-7 w-28 animate-pulse rounded-[var(--radius-control)] bg-theme-inset" />

          <div className="grid gap-3 xl:grid-cols-[1.65fr_0.75fr]">
            <div className="space-y-3">
              <div className="h-[260px] animate-pulse rounded-[var(--radius-card)] bg-theme-inset" />

              <div className="h-[160px] animate-pulse rounded-[var(--radius-card)] bg-theme-inset" />
            </div>

            <div className="space-y-3">
              <div className="h-[130px] animate-pulse rounded-[var(--radius-card)] bg-theme-inset" />

              <div className="h-[160px] animate-pulse rounded-[var(--radius-card)] bg-theme-inset" />
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
          <div className="w-full max-w-md rounded-[var(--radius-card)] border border-theme-border bg-theme-surface p-6 text-center">
            <h2 className="text-lg font-semibold text-theme-text">
              Booking not found
            </h2>

            <p className="mt-2 text-sm text-theme-muted">
              {error ?? "This booking may no longer exist or you do not have access to it."}
            </p>

            <button
              onClick={() => navigate(-1)}
              className="mt-5 rounded-[var(--radius-control)] border border-theme-border bg-theme-surface px-3 py-2 text-sm font-medium text-theme-text transition-colors hover:border-theme-border-strong hover:bg-theme-inset focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent"
            >
              Go Back
            </button>
          </div>
        </div>
      </UserDashboardLayout>
    );
  }

  const totalPrice = booking.slots.reduce((sum, s) => sum + s.price, 0);

  const groupedSlots: Record<string, Slot[]> = {};

  booking.slots.forEach((slot) => {
    const dateKey = formatDate(slot.startTime);

    if (!groupedSlots[dateKey]) {
      groupedSlots[dateKey] = [];
    }

    groupedSlots[dateKey].push(slot);
  });

  const serviceImage = booking?.service?.data?.media?.[0] || "";

  const creatorAvatar = booking?.creator?.profile?.avatarUrl || "";

  const creatorName =
    booking?.creator?.profile?.displayName || "Unknown Creator";

  const creatorSlug = booking?.creator?.profile?.slug || "";

  return (
    <UserDashboardLayout>
      <div className="mx-auto max-w-[1020px] space-y-3 pb-4">
        {/* ================= TOP ================= */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <button
              onClick={() => navigate(-1)}
              className="mb-1 inline-flex items-center gap-1.5 rounded text-[16px] text-theme-muted transition-colors hover:text-theme-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent"
            >
              ← Back
            </button>

            <h1 className="text-[22px] font-semibold tracking-tight text-theme-text">
              Booking Details
            </h1>

            <p className="mt-0.5 text-[10px] text-theme-muted">
              Created on {new Date(booking.createdAt).toLocaleString()}
            </p>
          </div>

          <div
            className={`inline-flex w-fit items-center gap-1.5 rounded-md px-3 py-1.5 text-[10px] font-medium ${getStatusClasses(
              booking.status,
            )}`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
            {booking.status}
          </div>
        </div>

        {/* ================= MAIN GRID ================= */}
        <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_300px]">
          {/* ================= LEFT CONTENT ================= */}
          <div className="space-y-3">
            {/* ================= MAIN SERVICE CARD ================= */}
            <div className="rounded-[var(--radius-card)] border border-theme-border bg-theme-surface p-4 sm:p-5">
              {/* ================= TOP CONTENT ================= */}
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:gap-5">
                {/* ================= IMAGE ================= */}
                <div className="relative h-[210px] w-full overflow-hidden rounded-[var(--radius-card)] border border-theme-border bg-theme-inset sm:h-[230px] xl:h-[205px] xl:w-[300px] xl:flex-shrink-0">
                  {serviceImage ? (
                    <img
                      src={serviceImage}
                      alt={booking.service?.title}
                      className="h-full w-full object-cover object-center"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-theme-inset">
                      <div className="flex flex-col items-center gap-3">
                        <div className="flex h-14 w-14 items-center justify-center rounded-[var(--radius-control)] border border-theme-border bg-theme-surface">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-7 w-7 text-theme-muted"
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

                        <div className="rounded-full border border-theme-border bg-theme-surface px-3 py-1 text-[9px] text-theme-muted">
                          No Service Media
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* ================= SERVICE INFO ================= */}
                <div className="min-w-0 flex-1 pt-0 xl:pt-2">
                  <div className="inline-flex items-center rounded-full border border-theme-border bg-theme-inset px-2 py-0.5 text-[8px] text-theme-muted">
                    Service
                  </div>

                  <h2 className="mt-3 break-words text-[20px] font-semibold text-theme-text">
                    {booking.service?.title}
                  </h2>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <div className="rounded-[var(--radius-control)] border border-theme-border bg-theme-inset px-3 py-1.5 text-[10px] text-theme-muted">
                      Duration:{" "}
                      <span className="text-theme-text">
                        {booking.durationMinutes} mins
                      </span>
                    </div>

                    <div className="rounded-[var(--radius-control)] border border-theme-border bg-theme-inset px-3 py-1.5 text-[10px] font-medium text-theme-text">
                      {booking.currency} {totalPrice}
                    </div>
                  </div>
                  <div className="mt-3 rounded-[var(--radius-control)] border border-theme-border bg-theme-inset px-3 py-2">
                    <p className="text-[8px] uppercase tracking-wider text-theme-muted">
                      Booking ID
                    </p>

                    <p className="mt-1.5 break-all text-[10px] text-theme-text">
                      {booking._id}
                    </p>
                  </div>
                </div>
              </div>

              {/* ================= SLOT SECTION ================= */}
              <div className="mt-5 border-t border-theme-border pt-5">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-[14px] font-semibold text-theme-text">
                    Slot Information
                  </h3>

                  <div className="text-[10px] text-theme-muted">
                    {booking.slots.length} slots
                  </div>
                </div>
                <p className="-mt-2 mb-4 text-[10px] text-theme-muted">Times shown in {bookingLocalTimeZone}.</p>

                <div className="space-y-3">
                  {Object.entries(groupedSlots).map(([date, slots]) => (
                    <div
                      key={date}
                      className="rounded-[var(--radius-card)] border border-theme-border bg-theme-inset p-3 sm:p-5"
                    >
                      <div className="mb-4 flex items-center justify-between">
                        <h4 className="text-[11px] font-medium text-theme-text">
                          {date}
                        </h4>

                        <div className="rounded-full border border-theme-border bg-theme-surface px-2 py-0.5 text-[8px] text-theme-muted">
                          {slots.length} slots
                        </div>
                      </div>

                      {/* ================= SLOT GRID ================= */}
                      <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-4">
                        {slots.map((slot) => (
                          <div
                            key={slot._id}
                            className="rounded-[var(--radius-control)] border border-theme-border bg-theme-surface p-3 transition-colors hover:bg-theme-surface-raised sm:p-4"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="text-[10px] font-semibold leading-relaxed text-theme-text">
                                  {formatTime(slot.startTime)} -{" "}
                                  {formatTime(slot.endTime)}
                                </p>

                                <p className="mt-2 text-[8px] text-theme-muted">
                                  Slot Booking
                                </p>
                              </div>

                              <div className="rounded-[var(--radius-control)] border border-theme-border bg-theme-inset px-2 py-1 text-[7px] font-medium text-theme-text">
                                {booking.currency} {slot.price}
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
            {/* CREATOR */}
            <div className="rounded-[var(--radius-card)] border border-theme-border bg-theme-surface p-3">
              <div className="flex items-center justify-between">
                <h3 className="text-[12px] font-semibold text-theme-text">
                  Creator
                </h3>

                <div className="rounded-full border border-theme-border bg-theme-inset px-2 py-0.5 text-[7px] text-theme-muted">
                  Profile
                </div>
              </div>

              <div className="mt-3">
                <button
                  onClick={() =>
                    creatorSlug && navigate(`/creators/${creatorSlug}`)
                  }
                  className="group flex w-full items-center gap-3 rounded-[var(--radius-control)] border border-theme-border bg-theme-inset p-3 text-left transition-colors hover:bg-theme-surface-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent"
                >
                  {creatorAvatar ? (
                    <img
                      src={creatorAvatar}
                      alt={creatorName}
                      className="h-11 w-11 rounded-full border border-theme-border object-cover"
                    />
                  ) : (
                    <div className="flex h-11 w-11 items-center justify-center rounded-full border border-theme-border bg-theme-surface text-[11px] font-semibold text-theme-text">
                      {creatorName?.charAt(0)}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[11px] font-medium text-theme-text">
                      {creatorName}
                    </p>

                    <p className="mt-0.5 text-[8px] text-theme-muted">
                      Creator Account
                    </p>
                  </div>

                  <div className="text-theme-muted transition-colors group-hover:text-theme-text">
                    →
                  </div>
                </button>
              </div>
            </div>

            {/* PAYMENT */}
            <div className="rounded-[var(--radius-card)] border border-theme-border bg-theme-surface p-3">
              <div className="flex items-center justify-between">
                <h3 className="text-[12px] font-semibold text-theme-text">
                  Payment
                </h3>

                <div className="rounded-full border border-theme-border bg-theme-inset px-2 py-0.5 text-[7px] text-theme-muted">
                  Transaction
                </div>
              </div>

              <div className="mt-3">
                <p className="text-[8px] text-theme-muted">Total Amount</p>

                <h2 className="mt-2 break-words text-[26px] font-semibold tracking-tight text-theme-text sm:text-[18px]">
                  {booking.currency} {totalPrice}
                </h2>

                <div className="mt-3 rounded-[var(--radius-control)] border border-theme-border bg-theme-inset p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[8px] text-theme-muted">
                      Payment Status
                    </span>

                    <span className="rounded-full border border-theme-border bg-theme-surface px-2 py-0.5 text-[7px] font-medium text-theme-text">
                      {funding?.providerFunding ? providerFundingLabel(funding.providerFunding.state, funding.payment?.method) : booking.paymentStatus}
                    </span>
                  </div>
                  {funding && <div className="mt-3 space-y-2 rounded-[var(--radius-control)] border border-theme-border bg-theme-surface p-3 text-[10px] text-theme-muted"><p className="font-semibold uppercase tracking-wider text-theme-muted">Payment & funding</p><p className="flex justify-between gap-3"><span>Service</span><span className="text-right text-theme-text">{formatBookingMoney(funding.pricing.serviceAmount, funding.booking.currency, bookingCurrencies)}</span></p><p className="flex justify-between gap-3"><span>Platform fee</span><span className="text-right text-theme-text">{formatBookingMoney(funding.pricing.customerFeeAmount, funding.booking.currency, bookingCurrencies)}</span></p><p className="flex justify-between gap-3 font-semibold text-theme-text"><span>Total funding</span><span className="text-right">{formatBookingMoney(funding.pricing.grossFundingAmount, funding.booking.currency, bookingCurrencies)}</span></p><p>Payment: {funding.payment?.method ?? "Legacy"} · {funding.payment?.status ?? "Unavailable"}</p><p className="font-medium text-theme-text">{funding.providerFunding ? providerFundingLabel(funding.providerFunding.state, funding.payment?.method) : funding.walletFunding.state === "ACTIVE" ? "Funds reserved" : funding.walletFunding.state === "RELEASED" ? "Funds released" : funding.walletFunding.state === "CAPTURED" ? "Funds captured" : "Wallet funding not applicable"}</p></div>}
                </div>
              </div>
            </div>

            {/* LIFECYCLE */}
            <div className="rounded-[var(--radius-card)] border border-theme-border bg-theme-surface p-3">
              <div className="flex items-center justify-between">
                <h3 className="text-[12px] font-semibold text-theme-text">
                  Booking Lifecycle
                </h3>

                <div className="rounded-full border border-theme-border bg-theme-inset px-2 py-0.5 text-[7px] text-theme-muted">
                  Live Status
                </div>
              </div>

              <div className="mt-4 space-y-3">
                <div className="flex items-start gap-2">
                  <div className="mt-1 h-1.5 w-1.5 rounded-full bg-theme-muted" />

                  <div>
                    <p className="text-[9px] font-medium text-theme-text">
                      Booking Created
                    </p>

                    <p className="mt-0.5 text-[7px] text-theme-muted">
                      {new Date(booking.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                {booking.status === "COMPLETED" && booking.completedAt && (
                  <div className="flex items-start gap-2">
                    <div className="mt-1 h-1.5 w-1.5 rounded-full bg-theme-success" />

                    <div>
                      <p className="text-[9px] font-medium text-theme-text">
                        Session Completed
                      </p>

                      <p className="mt-0.5 text-[7px] text-theme-muted">
                        {new Date(booking.completedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}

                {booking.status === "CANCELLED" && (
                  <div className="flex items-start gap-2">
                    <div className="mt-1 h-1.5 w-1.5 rounded-full bg-theme-danger" />

                    <div>
                      <p className="text-[9px] font-medium text-theme-text">
                        Booking Cancelled
                      </p>

                      <p className="mt-0.5 text-[7px] text-theme-muted">
                        Booking was cancelled
                      </p>
                    </div>
                  </div>
                )}

                {booking.status === "REJECTED" && (
                  <div className="flex items-start gap-2">
                    <div className="mt-1 h-1.5 w-1.5 rounded-full bg-theme-danger" />

                    <div>
                      <p className="text-[9px] font-medium text-theme-text">
                        Booking Request Declined
                      </p>

                      <p className="mt-0.5 text-[7px] text-theme-muted">
                        The Creator declined this booking request.
                      </p>
                    </div>
                  </div>
                )}

                {booking.status === "EXPIRED" && (
                  <div className="flex items-start gap-2">
                    <div className="mt-1 h-1.5 w-1.5 rounded-full bg-theme-warning" />

                    <div>
                      <p className="text-[9px] font-medium text-theme-text">
                        Booking Expired
                      </p>

                      <p className="mt-0.5 text-[7px] text-theme-muted">
                        Booking expired automatically
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ACTION BAR */}
            <div className="rounded-[var(--radius-card)] border border-theme-border bg-theme-surface p-3">
              <div className="flex flex-col gap-2">
                {/* CONFIRMED */}
                {["REQUESTED", "CONFIRMED"].includes(booking.status) && (
                  <>
                    {booking.status === "CONFIRMED" && <button
                      onClick={() => {
                        if (window.innerWidth >= 1024) {
                          navigate(
                            `/dashboard/user/messages?bookingId=${booking._id}`,
                          );
                        } else {
                          navigate(`/dashboard/chat/${booking._id}`);
                        }
                      }}
                      className="w-full rounded-[var(--radius-control)] border border-theme-border bg-theme-surface px-4 py-3 text-[11px] font-semibold text-theme-text transition-colors hover:border-theme-border-strong hover:bg-theme-inset focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent"
                    >
                      Open Chat
                    </button>}

                    {booking.status === "CONFIRMED" && <div className="overflow-hidden rounded-[var(--radius-control)]">
                      <CompleteButton
                        bookingId={booking._id}
                        role="user"
                        onCompleted={handleCompleted}
                      />
                    </div>}

                    <button
                      onClick={() => setShowModal(true)}
                      disabled={cancelling}
                      className="w-full rounded-[var(--radius-control)] border border-theme-danger bg-theme-danger-tint px-4 py-3 text-[11px] font-semibold text-theme-danger transition-opacity hover:opacity-80 disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent"
                    >
                      {cancelling ? "Cancelling..." : "Cancel Booking"}
                    </button>
                  </>
                )}

                {booking.status === "COMPLETED" && (
                  <>
                    {reviewLoading && (
                      <p className="px-1 text-[10px] text-theme-muted">
                        Checking review status...
                      </p>
                    )}
                    {reviewError && (
                      <button
                        type="button"
                        onClick={refreshReviewState}
                        className="w-full rounded-[var(--radius-control)] border border-theme-danger bg-theme-danger-tint px-4 py-3 text-[11px] font-semibold text-theme-danger focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent"
                      >
                        Review status unavailable — Retry
                      </button>
                    )}
                    {reviewState?.hasReviewed && (
                      <div className="rounded-[var(--radius-control)] border border-theme-success bg-theme-success-tint px-4 py-3 text-[11px] text-theme-success">
                        Reviewed{reviewState.review ? `: ${reviewState.review.rating}/5` : ""}
                      </div>
                    )}
                    {reviewState?.hasReviewed === false && !reviewLoading && (
                      <button
                        type="button"
                        onClick={() => setReviewOpen(true)}
                        className="w-full rounded-[var(--radius-control)] border border-theme-info bg-theme-info-tint px-4 py-3 text-[11px] font-semibold text-theme-info focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent"
                      >
                        Rate Booking
                      </button>
                    )}
                  </>
                )}

                {/* COMPLETED / CANCELLED / EXPIRED */}
                {["COMPLETED", "CANCELLED", "EXPIRED"].includes(
                  booking.status,
                ) && (
                  <>
                    <DisputeTimer
                      status={booking.status}
                      completedAt={booking.completedAt}
                    />

                    {["CANCELLED", "EXPIRED"].includes(booking.status) && (
                      <div className="rounded-[var(--radius-control)] border border-theme-warning bg-theme-warning-tint px-4 py-3 text-[10px] text-theme-warning">
                        You can raise a dispute for this booking
                      </div>
                    )}

                    {disputeLoading && (
                      <p className="px-1 text-[10px] text-theme-muted">Checking dispute status...</p>
                    )}

                    {disputeError && (
                      <button type="button" onClick={refreshDisputeState} className="w-full rounded-[var(--radius-control)] border border-theme-danger bg-theme-danger-tint px-4 py-3 text-[11px] font-semibold text-theme-danger focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent">
                        Dispute status unavailable — Retry
                      </button>
                    )}

                    {disputeState?.hasDispute && disputeState.dispute && (
                      <div className="rounded-[var(--radius-control)] border border-theme-warning bg-theme-warning-tint px-4 py-3 text-[10px] text-theme-warning">
                        Dispute {disputeState.dispute.status.toLowerCase()} · {disputeState.dispute.raisedByMe ? "raised by you" : "raised by Creator"}
                        <button type="button" onClick={() => navigate("/dashboard/user/settings/disputes")} className="ml-2 rounded font-semibold underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent">Track disputes</button>
                      </div>
                    )}

                    {appealLoading && <p className="px-1 text-[10px] text-theme-muted">Checking appeal status...</p>}
                    {appealError && <button type="button" onClick={() => void refreshAppeal()} className="w-full rounded-[var(--radius-control)] border border-theme-danger bg-theme-danger-tint px-4 py-3 text-[11px] font-semibold text-theme-danger focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent">Appeal status unavailable — Retry</button>}
                    {appeal && <div className="rounded-[var(--radius-control)] border border-theme-warning bg-theme-warning-tint px-4 py-3 text-[10px] text-theme-warning"><p className="font-semibold">Appeal {appeal.status.toLowerCase()}</p><p className="mt-1">{appeal.decision ? `Decision: ${appeal.decision.action === "REVERSE_DECISION" ? "decision reversed" : "decision confirmed"}` : "Awaiting Admin decision."}</p></div>}
                    {disputeState?.hasDispute && disputeState.dispute && ["RESOLVED", "REJECTED"].includes(disputeState.dispute.status) && !appeal && !appealLoading && !appealError && (
                      <button type="button" onClick={() => setAppealOpen(true)} className="w-full rounded-[var(--radius-control)] border border-theme-warning bg-theme-warning-tint px-4 py-3 text-[11px] font-semibold text-theme-warning focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent">Appeal decision</button>
                    )}

                    {disputeState?.hasDispute === false && disputeState.canOpenDispute && !disputeLoading && (
                      <button
                        onClick={() => setDisputeOpen(true)}
                        className="w-full rounded-[var(--radius-control)] border border-theme-warning bg-theme-warning-tint px-4 py-3 text-[11px] font-semibold text-theme-warning transition-opacity hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent"
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
          onSubmitted={refreshReviewState}
        />

        <DisputeModal
          open={disputeOpen}
          bookingId={booking._id}
          onClose={() => setDisputeOpen(false)}
          onSubmitted={refreshDisputeState}
        />
      {appealOpen && disputeState?.dispute && <AppealModal disputeId={disputeState.dispute.disputeId} onClose={() => setAppealOpen(false)} onSubmitted={() => { setAppealOpen(false); void refreshAppeal(); showToast("Appeal submitted.", "success"); }} />}
      </div>
    </UserDashboardLayout>
  );
}
