// frontend/src/dashboards/CreatorRequests.tsx

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import api from "../api/axios";
import { decideBookingAPI } from "../api/creatorBooking";

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

  const [bookings, setBookings] =
    useState<Booking[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [processingId, setProcessingId] =
    useState<string | null>(null);

  /* ================= FETCH ================= */

  const fetchBookings = async () => {
    try {
      setLoading(true);

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

      await decideBookingAPI(
        bookingId,
        decision
      );

      await fetchBookings();
    } catch (err) {
      console.error(
        "Decision failed",
        err
      );
    } finally {
      setProcessingId(null);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  /* ================= HELPERS ================= */

  const formatTime = (
    date: string
  ) =>
    new Date(
      date
    ).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

  const getStatusStyle = (
    status: string
  ) => {
    switch (status) {
      case "CONFIRMED":
        return `
          bg-[rgba(34,197,94,0.14)]
          text-[#86EFAC]
          border border-[rgba(34,197,94,0.22)]
        `;

      case "REQUESTED":
        return `
          bg-[rgba(255,255,255,0.05)]
          text-[#E5E7EB]
          border border-[rgba(255,255,255,0.10)]
        `;

      case "REJECTED":
        return `
          bg-[rgba(239,68,68,0.14)]
          text-[#FCA5A5]
          border border-[rgba(239,68,68,0.22)]
        `;

      case "EXPIRED":
        return `
          bg-[rgba(107,114,128,0.16)]
          text-[#E5E7EB]
          border border-[rgba(107,114,128,0.20)]
        `;

      case "CANCELLED":
        return `
          bg-[rgba(249,115,22,0.14)]
          text-[#FDBA74]
          border border-[rgba(249,115,22,0.20)]
        `;

      case "COMPLETED":
        return `
          bg-[rgba(6,182,212,0.14)]
          text-[#67E8F9]
          border border-[rgba(6,182,212,0.22)]
        `;

      default:
        return `
          bg-[rgba(255,255,255,0.05)]
          text-[#F8FAFC]
          border border-[rgba(255,255,255,0.08)]
        `;
    }
  };

  /* ================= UI ================= */

  return (
    <DashboardLayout>
      <div className="min-h-screen">
        <div className="max-w-7xl mx-auto px-4 py-6 pb-28 space-y-6">
          {/* HEADER */}
          <div>
            <h1 className="text-2xl md:text-4xl font-bold text-[#F8FAFC] tracking-tight">
              Booking Requests
            </h1>

            <p className="text-sm md:text-base text-[rgba(255,255,255,0.55)] mt-2">
              Manage incoming booking
              requests
            </p>
          </div>

          {/* LOADING */}
          {loading && (
            <div className="text-[rgba(255,255,255,0.38)]">
              Loading booking
              requests...
            </div>
          )}

          {/* EMPTY */}
          {!loading &&
            bookings.length === 0 && (
              <div
                className="
                bg-[#151515]
                border border-[rgba(255,255,255,0.08)]
                rounded-[28px]
                p-10
                text-center
                text-[rgba(255,255,255,0.38)]
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
                      rounded-[30px]
                      border border-white/10
                      bg-gradient-to-br from-white/[0.045] to-white/[0.015]
                      backdrop-blur-xl
                      px-5 py-5
                      shadow-[0_10px_30px_rgba(0,0,0,0.35)]
                      transition-all duration-300
                      hover:-translate-y-[2px]
                      hover:shadow-[0_14px_40px_rgba(0,0,0,0.45)]
                    "
                    >
                      {/* MOBILE */}
                      <div className="md:hidden relative z-10 space-y-5">
                        {/* TOP */}
                        <div className="flex justify-between gap-4">
                          {/* LEFT */}
                          <div className="flex-1 min-w-0">
                            <p className="text-[26px] font-bold text-[#F8FAFC] leading-none break-words">
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
                                bg-[rgba(255,255,255,0.05)]
                                text-[#E5E7EB]
                                border border-[rgba(255,255,255,0.10)]
                              "
                              >
                                {booking.paymentStatus ||
                                  "PAID"}
                              </span>
                            </div>

                            <div className="mt-4 space-y-1">
                              <p className="text-[12px] text-[rgba(255,255,255,0.50)]">
                                Requested at{" "}
                                {new Date(
                                  booking.createdAt
                                ).toLocaleString()}
                              </p>

                              <p className="text-[12px] text-[rgba(255,255,255,0.42)]">
                                Expires at{" "}
                                {new Date(
                                  booking.expiresAt
                                ).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* MEDIA */}
                        <div
                          className="
                          w-full
                          h-[190px]
                          rounded-[28px]
                          overflow-hidden
                          border border-[rgba(255,255,255,0.08)]
                          bg-white/[0.03]
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
                              text-[rgba(255,255,255,0.35)]
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
                                rounded-xl
                                bg-[rgba(255,255,255,0.03)]
                                border border-[rgba(255,255,255,0.07)]
                                text-[11px]
                                text-[#F8FAFC]
                                whitespace-nowrap
                              "
                              >
                                {formatTime(
                                  slot.startTime
                                )}{" "}
                                -{" "}
                                {formatTime(
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
                            rounded-2xl
                            bg-[rgba(255,255,255,0.04)]
                            border border-[rgba(255,255,255,0.08)]
                            text-white
                            hover:bg-[rgba(255,255,255,0.07)]
                            transition
                            font-semibold
                            text-[17px]
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
                            rounded-2xl
                            bg-[rgba(255,255,255,0.04)]
                            border border-[rgba(255,255,255,0.08)]
                            text-white
                            hover:bg-[rgba(255,255,255,0.07)]
                            transition
                            font-medium
                          "
                          >
                            View User
                          </button>

                          {booking.status ===
                            "REQUESTED" && (
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
                              rounded-2xl
                              bg-[#22C55E]
                              hover:bg-[#16A34A]
                              text-white
                              transition
                              font-semibold
                              text-[17px]
                              disabled:opacity-50
                            "
                            >
                              {processingId ===
                              booking._id
                                ? "Processing..."
                                : "Accept"}
                            </button>
                          )}

                          {booking.status ===
                            "REQUESTED" && (
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
                              rounded-2xl
                              bg-[rgba(239,68,68,0.14)]
                              border border-[rgba(239,68,68,0.22)]
                              text-[#FCA5A5]
                              hover:bg-[rgba(239,68,68,0.22)]
                              transition
                              font-semibold
                              text-[17px]
                              disabled:opacity-50
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
                            <p className="text-[rgba(255,255,255,0.38)] text-[11px]">
                              {new Date(
                                booking.createdAt
                              ).toLocaleString()}
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
                              bg-[rgba(255,255,255,0.05)]
                              text-[#E5E7EB]
                              border border-[rgba(255,255,255,0.10)]
                            "
                            >
                              {booking.paymentStatus ||
                                "PAID"}
                            </span>
                          </div>

                          {/* SERVICE */}
                          <div className="mt-3">
                            <p className="text-[rgba(255,255,255,0.38)] text-sm">
                              Service
                            </p>

                            <h2
                              className="
                              text-[18px]
                              font-bold
                              text-[#F8FAFC]
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
                            <p className="text-[12px] text-[rgba(255,255,255,0.50)]">
                              Requested at{" "}
                              {new Date(
                                booking.createdAt
                              ).toLocaleString()}
                            </p>

                            <p className="text-[12px] text-[rgba(255,255,255,0.42)]">
                              Expires at{" "}
                              {new Date(
                                booking.expiresAt
                              ).toLocaleString()}
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
                                  rounded-xl
                                  bg-white/[0.04]
                                  border border-white/10
                                  text-[11px]
                                  text-[#F8FAFC]
                                "
                                >
                                  {formatTime(
                                    slot.startTime
                                  )}{" "}
                                  -{" "}
                                  {formatTime(
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
                          rounded-[28px]
                          overflow-hidden
                          border border-white/10
                          bg-white/[0.03]
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
                              text-[rgba(255,255,255,0.35)]
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
                              rounded-2xl
                              bg-[rgba(255,255,255,0.04)]
                              border border-[rgba(255,255,255,0.08)]
                              text-white
                              text-sm
                              font-medium
                              hover:bg-[rgba(255,255,255,0.07)]
                              transition
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
                              rounded-2xl
                              bg-[rgba(255,255,255,0.04)]
                              border border-[rgba(255,255,255,0.08)]
                              text-white
                              text-sm
                              font-medium
                              hover:bg-[rgba(255,255,255,0.07)]
                              transition
                              disabled:opacity-50
                            "
                            >
                              View User
                            </button>

                            {booking.status ===
                              "REQUESTED" && (
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
                                rounded-2xl
                                bg-[#22C55E]
                                hover:bg-[#16A34A]
                                text-white
                                text-sm
                                font-semibold
                                transition
                                disabled:opacity-50
                              "
                              >
                                {processingId ===
                                booking._id
                                  ? "Processing..."
                                  : "Accept"}
                              </button>
                            )}

                            {booking.status ===
                              "REQUESTED" && (
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
                                rounded-2xl
                                bg-[rgba(239,68,68,0.14)]
                                border border-[rgba(239,68,68,0.22)]
                                text-[#FCA5A5]
                                hover:bg-[rgba(239,68,68,0.22)]
                                text-sm
                                font-semibold
                                transition
                                disabled:opacity-50
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