// frontend/src/dashboards/CreatorRequests.tsx

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import api from "../api/axios";
import { decideBookingAPI } from "../api/creatorBooking";
import { useBookingRequests } from "../hooks/useBookingRequests";
import { formatBookingLocalDateTime, formatBookingLocalTime, bookingLocalTimeZone } from "../utils/bookingDateTime";
import { getApiErrorMessage } from "../api/errorMessage";

interface Slot {
  _id: string;
  startTime: string;
  endTime: string;
  status: string;
}

interface Service {
  _id?: string;
  title?: string;
  media?: string[];
  thumbnailUrl?: string;
  image?: string;
}

interface Booking {
  _id: string;
  status: string;
  paymentStatus: string;
  expiresAt: string;
  createdAt: string;
  userId: string;

  service?: Service;

  slots?: Slot[];
}

export default function CreatorRequests() {
  const navigate = useNavigate();
  const { refreshPendingRequestCount } = useBookingRequests();

  const [bookings, setBookings] =
    useState<Booking[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [processingId, setProcessingId] =
    useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  /* ================= FETCH ================= */

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await api.get(
        "/v1/creator/bookings",
        {
          params: {
            status: "REQUESTED",
          },
        }
      );

      setBookings(
        res.data.bookings || []
      );
    } catch (err) {
      console.error(
        "Failed to fetch bookings",
        err
      );
      setBookings([]);
      setError(getApiErrorMessage(err, "Unable to load booking requests."));
    } finally {
      setLoading(false);
    }
  };

  /* ================= DECISION ================= */

  const handleDecision = async (
    bookingId: string,
    decision: "ACCEPT" | "REJECT"
  ) => {
    if (processingId !== null)
      return;

    try {
      setProcessingId(bookingId);
      setError(null);

      await decideBookingAPI(
        bookingId,
        decision
      );

      await fetchBookings();
      await refreshPendingRequestCount();
    } catch (err) {
      console.error(
        "Decision failed",
        err
      );
      setError(getApiErrorMessage(err, "Unable to update this booking request."));
      await fetchBookings();
      await refreshPendingRequestCount();
    } finally {
      setProcessingId(null);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [refreshPendingRequestCount]);

  /* ================= HELPERS ================= */

  const getStatusStyle = (
    status: string
  ) => {
    switch (status) {
      case "CONFIRMED":
        return "border border-theme-success bg-theme-success-tint text-theme-success";

      case "REQUESTED":
        return "border border-theme-warning bg-theme-warning-tint text-theme-warning";

      case "REJECTED":
        return "border border-theme-danger bg-theme-danger-tint text-theme-danger";

      case "EXPIRED":
        return "border border-theme-border bg-theme-inset text-theme-muted";

      case "CANCELLED":
        return "border border-theme-warning bg-theme-warning-tint text-theme-warning";

      case "COMPLETED":
        return "border border-theme-info bg-theme-info-tint text-theme-info";

      default:
        return "border border-theme-border bg-theme-inset text-theme-text";
    }
  };

  /* ================= UI ================= */

  return (
    <DashboardLayout>
      <div className="min-h-screen">
        <div className="max-w-7xl mx-auto px-4 py-6 pb-28 space-y-6">
          {/* HEADER */}
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-theme-text md:text-4xl">
              Booking Requests
            </h1>

            <p className="mt-2 text-sm text-theme-muted md:text-base">
              Manage incoming booking
              requests
            </p>
            <p className="mt-1 text-xs text-theme-muted">Times are shown in {bookingLocalTimeZone}.</p>
          </div>

          {/* LOADING */}
          {loading && (
            <div className="text-theme-muted">
              Loading booking
              requests...
            </div>
          )}

          {!loading && error && (
            <div role="alert" className="rounded-[var(--radius-card)] border border-theme-danger bg-theme-danger-tint p-4 text-sm text-theme-danger">
              {error}<button type="button" onClick={() => void fetchBookings()} className="ml-3 font-semibold underline">Retry</button>
            </div>
          )}

          {/* EMPTY */}
          {!loading &&
            bookings.length === 0 && (
              <div
                className="
                bg-theme-surface
                border border-theme-border
                rounded-[var(--radius-card)]
                p-10
                text-center
                text-theme-muted
              "
              >
                No booking requests
                found.
              </div>
            )}

          {/* LIST */}
          <div className="space-y-5">
            {!loading &&
              bookings.map(
                (booking) => {
                  const requestExpired = booking.status === "REQUESTED" && new Date(booking.expiresAt).getTime() <= Date.now();
                  const serviceTitle =
                    booking.service
                      ?.title ||
                    "Untitled Service";

                  const serviceMedia =
  booking.service?.thumbnailUrl ||
  booking.service?.image ||
  booking.service?.media?.[0] ||
  "";

                  return (
                    <div
                      key={
                        booking._id
                      }
                      className="
                      group
                      relative
                      overflow-hidden
                      rounded-[var(--radius-card)]
                      border border-theme-border
                      bg-theme-surface
                      px-5 py-5
                      transition-colors
                      hover:bg-theme-surface-raised
                    "
                    >
                      {/* MOBILE */}
                      <div className="md:hidden relative z-10 space-y-5">
                        {/* TOP */}
                        <div className="flex justify-between gap-4">
                          {/* LEFT */}
                          <div className="flex-1 min-w-0">
                            <p className="text-[26px] font-semibold leading-none break-words text-theme-text">
                              {
                                serviceTitle
                              }
                            </p>

                            <div className="mt-4 flex flex-wrap gap-2">
                              <span
                                className={`
                                px-3
                                py-1.5
                                rounded-full
                                text-[11px]
                                font-semibold
                                whitespace-nowrap
                                ${getStatusStyle(
                                  booking.status
                                )}
                              `}
                              >
                                {
                                  booking.status
                                }
                              </span>

                              <span
                                className="
                                px-3
                                py-1.5
                                rounded-full
                                text-[11px]
                                font-semibold
                                whitespace-nowrap
                                bg-theme-inset
                                text-theme-text
                                border border-theme-border
                              "
                              >
                                {booking.paymentStatus ||
                                  "PAID"}
                              </span>
                            </div>

                            <div className="mt-4 space-y-1">
                              <p className="text-[12px] text-theme-muted">
                                Requested at{" "}
                                {formatBookingLocalDateTime(booking.createdAt)}
                              </p>

                              <p className="text-[12px] text-theme-muted">
                                Expires at{" "}
                                {formatBookingLocalDateTime(booking.expiresAt)}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* MEDIA */}
                        <div
                          className="
                          w-full
                          h-[190px]
                          rounded-[var(--radius-card)]
                          overflow-hidden
                          border border-theme-border
                          bg-theme-inset
                        "
                        >
                          {serviceMedia ? (
                            <img
                              src={
                                serviceMedia
                              }
                              alt="service"
                              className="
                              w-full
                              h-full
                              object-cover
                            "
                            />
                          ) : (
                            <div
                              className="
                              w-full
                              h-full
                              flex
                              items-center
                              justify-center
                              text-theme-muted
                              text-sm
                            "
                            >
                              No Media
                            </div>
                          )}
                        </div>

                        {/* SLOT CHIPS */}
                        <div className="flex flex-wrap gap-2">
                          {booking.slots?.map(
                            (
                              slot
                            ) => (
                              <div
                                key={
                                  slot._id
                                }
                                className="
                                px-3
                                py-2
                                rounded-[var(--radius-control)]
                                bg-theme-inset
                                border border-theme-border
                                text-[11px]
                                text-theme-text
                                whitespace-nowrap
                              "
                              >
                                {formatBookingLocalTime(
                                  slot.startTime
                                )}{" "}
                                -{" "}
                                {formatBookingLocalTime(
                                  slot.endTime
                                )}
                              </div>
                            )
                          )}
                        </div>

                        {/* BUTTONS */}
                        <div className="space-y-2">
                          <button
                            onClick={() =>
                              navigate(
                                `/dashboard/creator/bookings/${booking._id}`
                              )
                            }
                            className="
                            w-full
                            h-[54px]
                            rounded-[var(--radius-control)]
                            bg-theme-surface
                            border border-theme-border
                            text-theme-text
                            hover:bg-theme-inset
                            transition-colors
                            font-semibold
                            text-[17px]
                            focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent
                          "
                          >
                            View Details
                          </button>

                          <button
                            onClick={() =>
                              navigate(
                                `/users/${booking.userId}`
                              )
                            }
                            disabled={
                              processingId !==
                              null
                            }
                            className="
                            w-full
                            h-[54px]
                            rounded-[var(--radius-control)]
                            bg-theme-surface
                            border border-theme-border
                            text-theme-text
                            hover:bg-theme-inset
                            transition-colors
                            font-medium
                            focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent
                          "
                          >
                            View User
                          </button>

                          {booking.status ===
                            "REQUESTED" && (
                            requestExpired ? (
                              <p className="rounded-[var(--radius-control)] border border-theme-warning bg-theme-warning-tint p-3 text-center text-sm text-theme-warning">This request has expired and is awaiting server refresh.</p>
                            ) :
                            <button
                              disabled={
                                processingId !==
                                null
                              }
                              onClick={() =>
                                handleDecision(
                                  booking._id,
                                  "ACCEPT"
                                )
                              }
                              className="
                              w-full
                              h-[54px]
                              rounded-[var(--radius-control)]
                              bg-theme-primary
                              hover:opacity-90
                              text-theme-primary-text
                              transition-opacity
                              font-semibold
                              text-[17px]
                              disabled:opacity-50
                              focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent
                            "
                            >
                              {processingId ===
                              booking._id
                                ? "Processing..."
                                : "Accept"}
                            </button>
                          )}

                          {booking.status ===
                            "REQUESTED" && !requestExpired && (
                            <button
                              disabled={
                                processingId !==
                                null
                              }
                              onClick={() =>
                                handleDecision(
                                  booking._id,
                                  "REJECT"
                                )
                              }
                              className="
                              w-full
                              h-[54px]
                              rounded-[var(--radius-control)]
                              bg-theme-danger-tint
                              border border-theme-danger
                              text-theme-danger
                              hover:opacity-85
                              transition-opacity
                              font-semibold
                              text-[17px]
                              disabled:opacity-50
                              focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent
                            "
                            >
                              {processingId ===
                              booking._id
                                ? "Processing..."
                                : "Reject"}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* DESKTOP */}
                      <div
                        className="
                        hidden
                        md:grid
                        md:grid-cols-[1fr_minmax(0,42%)_190px]
                        gap-6
                      "
                      >
                        {/* LEFT */}
                        <div className="min-w-0">
                          {/* TOP */}
                          <div className="flex items-center gap-3 flex-wrap">
                            <p className="text-[11px] text-theme-muted">
                              {formatBookingLocalDateTime(booking.createdAt)}
                            </p>

                            <span
                              className={`
                              px-3
                              py-1
                              rounded-full
                              text-[10px]
                              font-semibold
                              ${getStatusStyle(
                                booking.status
                              )}
                            `}
                            >
                              {
                                booking.status
                              }
                            </span>

                            <span
                              className="
                              px-3
                              py-1
                              rounded-full
                              text-[10px]
                              font-semibold
                              bg-theme-inset
                              text-theme-text
                              border border-theme-border
                            "
                            >
                              {booking.paymentStatus ||
                                "PAID"}
                            </span>
                          </div>

                          {/* SERVICE */}
                          <div className="mt-3">
                            <p className="text-sm text-theme-muted">
                              Service
                            </p>

                            <h2
                              className="
                              text-[18px]
                              font-semibold
                              text-theme-text
                              mt-1
                              break-words
                            "
                            >
                              {
                                serviceTitle
                              }
                            </h2>
                          </div>

                          {/* DATES */}
                          <div className="mt-4 space-y-1">
                            <p className="text-[12px] text-theme-muted">
                              Requested at{" "}
                              {new Date(
                                booking.createdAt
                              ).toLocaleString()}
                            </p>

                            <p className="text-[12px] text-theme-muted">
                              Expires at{" "}
                              {formatBookingLocalDateTime(booking.expiresAt)}
                            </p>
                          </div>

                          {/* SLOT ROW */}
                          <div className="flex flex-wrap gap-2 mt-5">
                            {booking.slots?.map(
                              (
                                slot
                              ) => (
                                <div
                                  key={
                                    slot._id
                                  }
                                  className="
                                  px-3
                                  py-2
                                  rounded-[var(--radius-control)]
                                  bg-theme-inset
                                  border border-theme-border
                                  text-[11px]
                                  text-theme-text
                                "
                                >
                                  {formatBookingLocalTime(
                                    slot.startTime
                                  )}{" "}
                                  -{" "}
                                  {formatBookingLocalTime(
                                    slot.endTime
                                  )}
                                </div>
                              )
                            )}
                          </div>
                        </div>

                        {/* MIDDLE IMAGE */}
                        <div
                          className="
                          h-[190px]
                          w-full
                          max-w-[380px]
                          rounded-[var(--radius-card)]
                          overflow-hidden
                          border border-theme-border
                          bg-theme-inset
                          justify-self-start
                        "
                        >
                          {serviceMedia ? (
                            <img
                              src={
                                serviceMedia
                              }
                              alt="service"
                              className="
                              w-full
                              h-full
                              object-cover
                            "
                            />
                          ) : (
                            <div
                              className="
                              w-full
                              h-full
                              flex
                              items-center
                              justify-center
                              text-theme-muted
                              text-sm
                            "
                            >
                              No Media
                            </div>
                          )}
                        </div>

                        {/* RIGHT */}
                        <div
                          className="
                          flex
                          flex-col
                          justify-center
                          h-full
                        "
                        >
                          <div className="space-y-2">
                            <button
                              onClick={() =>
                                navigate(
                                  `/dashboard/creator/bookings/${booking._id}`
                                )
                              }
                              className="
                              w-full
                              h-11
                              rounded-[var(--radius-control)]
                              bg-theme-surface
                              border border-theme-border
                              text-theme-text
                              text-sm
                              font-medium
                              hover:bg-theme-inset
                              transition-colors
                              focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent
                            "
                            >
                              View Details
                            </button>

                            <button
                              onClick={() =>
                                navigate(
                                  `/users/${booking.userId}`
                                )
                              }
                              disabled={
                                processingId !==
                                null
                              }
                              className="
                              w-full
                              h-11
                              rounded-[var(--radius-control)]
                              bg-theme-surface
                              border border-theme-border
                              text-theme-text
                              text-sm
                              font-medium
                              hover:bg-theme-inset
                              transition-colors
                              disabled:opacity-50
                              focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent
                            "
                            >
                              View User
                            </button>

                            {booking.status ===
                              "REQUESTED" && (
                              requestExpired ? (
                                <p className="rounded-[var(--radius-control)] border border-theme-warning bg-theme-warning-tint p-3 text-center text-xs text-theme-warning">This request has expired and is awaiting server refresh.</p>
                              ) :
                              <button
                                disabled={
                                  processingId !==
                                  null
                                }
                                onClick={() =>
                                  handleDecision(
                                    booking._id,
                                    "ACCEPT"
                                  )
                                }
                                className="
                                w-full
                                h-11
                                rounded-[var(--radius-control)]
                                bg-theme-primary
                                hover:opacity-90
                                text-theme-primary-text
                                text-sm
                                font-semibold
                                transition-opacity
                                disabled:opacity-50
                                focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent
                              "
                              >
                                {processingId ===
                                booking._id
                                  ? "Processing..."
                                  : "Accept"}
                              </button>
                            )}

                            {booking.status ===
                              "REQUESTED" && !requestExpired && (
                              <button
                                disabled={
                                  processingId !==
                                  null
                                }
                                onClick={() =>
                                  handleDecision(
                                    booking._id,
                                    "REJECT"
                                  )
                                }
                                className="
                                w-full
                                h-11
                                rounded-[var(--radius-control)]
                                bg-theme-danger-tint
                                border border-theme-danger
                                text-theme-danger
                                hover:opacity-85
                                text-sm
                                font-semibold
                                transition-opacity
                                disabled:opacity-50
                                focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent
                              "
                              >
                                {processingId ===
                                booking._id
                                  ? "Processing..."
                                  : "Reject"}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }
              )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
