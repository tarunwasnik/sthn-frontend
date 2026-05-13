// frontend/src/pages/CreatorBookings.tsx

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import api from "../api/axios";

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
  expiresAt?: string;

  price: number;
  currency: string;

  serviceTitle?: string;

  service?: {
    title?: string;
    media?: string[];
    thumbnailUrl?: string;
    image?: string;
  };

  user?: {
    _id?: string;
    displayName?: string;
    avatarUrl?: string;
  };

  slots: Slot[];
}

export default function CreatorBookings() {
  const navigate = useNavigate();

  const [bookings, setBookings] =
    useState<Booking[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [filter, setFilter] =
    useState("ALL");

  /* ================= FETCH ================= */

  const fetchBookings = async () => {
    try {
      setLoading(true);

      const res = await api.get(
        "/v1/creator/bookings"
      );

      setBookings(
        res.data.bookings || []
      );
    } catch (err) {
      console.error(
        "Failed to fetch creator bookings",
        err
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  /* ================= FILTER ================= */

  const filteredBookings =
    filter === "ALL"
      ? bookings
      : bookings.filter(
          (booking) =>
            booking.status ===
            filter
        );

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

  const formatDate = (
    date: string
  ) =>
    new Date(
      date
    ).toLocaleDateString([], {
      year: "numeric",
      month: "short",
      day: "numeric",
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

  const getPaymentText = (
    booking: Booking
  ) => {
    if (
      booking.status ===
        "EXPIRED" ||
      booking.status ===
        "CANCELLED" ||
      booking.status ===
        "REJECTED"
    ) {
      return "REFUNDED";
    }

    return (
      booking.paymentStatus ||
      "PAID"
    );
  };

  /* ================= UI ================= */

  return (
    <DashboardLayout>

      <div className="min-h-screen">

        <div className="max-w-7xl mx-auto px-4 py-6 pb-28 space-y-6">

          {/* HEADER */}
          <div>
            <h1 className="text-2xl md:text-4xl font-bold text-[#F8FAFC] tracking-tight">
              My Bookings
            </h1>

            <p className="text-sm md:text-base text-[rgba(255,255,255,0.55)] mt-2">
              Manage all your bookings
            </p>
          </div>

          {/* MOBILE FILTER */}
          <div className="md:hidden">
            <select
              value={filter}
              onChange={(e) =>
                setFilter(
                  e.target.value
                )
              }
              className="
                w-full
                bg-[#151515]
                border border-[rgba(255,255,255,0.08)]
                rounded-2xl
                px-4 py-3
                text-[#F8FAFC]
                outline-none
              "
            >
              {[
                "ALL",
                "REQUESTED",
                "CONFIRMED",
                "COMPLETED",
                "REJECTED",
                "EXPIRED",
                "CANCELLED",
              ].map((status) => (
                <option
                  key={status}
                  value={status}
                  className="bg-[#111111]"
                >
                  {status}
                </option>
              ))}
            </select>
          </div>

          {/* DESKTOP FILTER */}
          <div className="hidden md:flex flex-wrap gap-4">

            {[
              "ALL",
              "REQUESTED",
              "CONFIRMED",
              "COMPLETED",
              "REJECTED",
              "EXPIRED",
              "CANCELLED",
            ].map((status) => (

              <button
                key={status}
                onClick={() =>
                  setFilter(status)
                }
                className={`
                  h-12
                  px-6
                  rounded-[18px]
                  text-[15px]
                  transition-all
                  border
                  ${
                    filter === status
                      ? `
                        bg-[rgba(255,255,255,0.07)]
                        text-white
                        border-[rgba(255,255,255,0.18)]
                        shadow-[0_0_20px_rgba(255,255,255,0.02)]
                      `
                      : `
                        bg-[rgba(255,255,255,0.03)]
                        text-[rgba(255,255,255,0.72)]
                        border-[rgba(255,255,255,0.07)]
                        hover:bg-[rgba(255,255,255,0.05)]
                      `
                  }
                `}
              >
                {status}
              </button>

            ))}

          </div>

          {/* LOADING */}
          {loading && (
            <div className="text-[rgba(255,255,255,0.38)]">
              Loading bookings...
            </div>
          )}

          {/* EMPTY */}
          {!loading &&
            filteredBookings.length ===
              0 && (
              <div className="
  bg-[#151515]
  border border-[rgba(255,255,255,0.08)]
  rounded-[28px]
  p-10
  text-center
  text-[rgba(255,255,255,0.38)]
">
  No bookings found.
</div>
            )}

          {/* LIST */}
          <div className="space-y-5">

            {!loading &&
              filteredBookings.map(
                (booking) => {

                  const serviceTitle =
                    booking.service
                      ?.title ||
                    booking
                      .serviceTitle ||
                    "Untitled Service";

                  const serviceMedia =
                    booking.service
                      ?.thumbnailUrl ||
                    booking.service
                      ?.image ||
                    booking.service
                      ?.media?.[0];

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

      <p className="text-[26px] font-bold text-[#F8FAFC] leading-none">
        {serviceTitle}
      </p>

      {/* USER */}
      <button
        type="button"
        onClick={() => {
          if (booking.user?._id) {
            navigate(
              `/users/${booking.user._id}`
            );
          }
        }}
        className="flex items-center gap-3 mt-5"
      >

        {booking.user?.avatarUrl ? (
          <img
            src={
              booking.user.avatarUrl
            }
            alt="avatar"
            className="
              w-11
              h-11
              rounded-full
              object-cover
              border border-[rgba(255,255,255,0.08)]
            "
          />
        ) : (
          <div className="
            w-11
            h-11
            rounded-full
            bg-[rgba(255,255,255,0.05)]
            flex
            items-center
            justify-center
            text-white
          ">
            {(
              booking.user?.displayName ||
              "U"
            )[0]}
          </div>
        )}

        <div className="text-left">

          <p className="text-xs text-[rgba(255,255,255,0.42)]">
            Client
          </p>

          <p className="text-[17px] font-semibold text-[#F8FAFC]">
            {booking.user?.displayName ||
              "Unknown"}
          </p>

        </div>

      </button>

    </div>

    {/* RIGHT */}
    <div className="flex flex-col items-end gap-3 shrink-0">

      {/* STATUS */}
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
        {booking.status}
      </span>

      {/* SLOT CHIPS */}
      <div className="flex flex-col items-end gap-2">

        {booking.slots?.map(
          (slot) => (

            <div
              key={slot._id}
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
        src={serviceMedia}
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

  {/* FOOTER */}
  <div className="flex items-end justify-between">

    <div>
      <p className="text-[12px] text-[rgba(255,255,255,0.50)]">
        Payment:{" "}
        {getPaymentText(
          booking
        )}
      </p>
    </div>

    <div className="text-right">

      <p className="
        text-[#4ADE80]
        text-sm
        font-semibold
      ">
        {booking.currency}
      </p>

      <p className="
        text-[#4ADE80]
        text-[24px]
        font-bold
        leading-none
      ">
        {booking.price}
      </p>

    </div>

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

    {booking.status ===
      "CONFIRMED" && (

      <button
        onClick={() =>
          navigate(
            `/dashboard/chat/${booking._id}`
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
          font-medium
        "
      >
        Open Chat
      </button>

    )}

  </div>

</div>

                      {/* DESKTOP */}
                      <div
                        className="
                          hidden
                          md:grid
                          md:grid-cols-[1fr_minmax(0,50%)_190px]
                          gap-6
                          
                        "
                      >

                        {/* LEFT CONTENT */}
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
                              {booking.status}
                            </span>

                          </div>

                          {/* SERVICE */}
                          <div className="mt-3">

                            <p className="text-[rgba(255,255,255,0.38)] text-sm">
                              Service
                            </p>

                            <h2
                              className="
                                text-[16px]
                                font-bold
                                text-[#F8FAFC]
                                mt-1
                                truncate
                              "
                            >
                              {serviceTitle}
                            </h2>

                          </div>

                          {/* USER */}
                          <button
                            type="button"
                            onClick={() => {
                              if (booking.user?._id) {
                                navigate(
                                  `/users/${booking.user._id}`
                                );
                              }
                            }}
                            className="
                              flex
                              items-center
                              gap-3
                              mt-4
                            "
                          >

                            {booking.user?.avatarUrl ? (
                              <img
                                src={
                                  booking.user.avatarUrl
                                }
                                alt="avatar"
                                className="
                                  w-9
                                  h-9
                                  rounded-full
                                  object-cover
                                  border border-[rgba(255,255,255,0.08)]
                                "
                              />
                            ) : (
                              <div
                                className="
                                  w-9
                                  h-9
                                  rounded-full
                                  bg-[rgba(255,255,255,0.05)]
                                  flex
                                  items-center
                                  justify-center
                                  text-white
                                  text-sm
                                "
                              >
                                {(
                                  booking.user
                                    ?.displayName ||
                                  "U"
                                )[0]}
                              </div>
                            )}

                            <div className="text-left">

                              <p className="text-[rgba(255,255,255,0.38)] text-[11px]">
                                Client
                              </p>

                              <p className="text-[#F8FAFC] font-semibold text-[15px]">
                                {booking.user
                                  ?.displayName ||
                                  "Unknown"}
                              </p>

                            </div>

                          </button>

                          {/* SLOT ROW */}
                          <div className="flex flex-wrap gap-2 mt-4">

                            {booking.slots?.map(
                              (slot) => (

                                <div
                                  key={slot._id}
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
      src={serviceMedia}
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
                            items-center
                            justify-center
                            h-full
                          "
                        >

                          <div className="text-right">

                            <p className="text-[rgba(255,255,255,0.50)] text-xs">
                              Payment:{" "}
                              {getPaymentText(
                                booking
                              )}
                            </p>

                            <div className="mt-3">

                              <p
                                className="
                                  text-[#4ADE80]
                                  text-xs
                                  font-semibold
                                "
                              >
                                {booking.currency}
                              </p>

                              <p
                                className="
                                  text-[#4ADE80]
                                  text-[26px]
                                  font-bold
                                  leading-none
                                  mt-1
                                "
                              >
                                {booking.price}
                              </p>

                            </div>

                          </div>

                          <div className="w-full mt-5 space-y-2">

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

                            {booking.status ===
                              "CONFIRMED" && (

                              <button
                                onClick={() =>
                                  navigate(
                                    `/dashboard/chat/${booking._id}`
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
                                  hover:bg-[rgba(255,255,255,0.07)]
                                  transition
                                "
                              >
                                Open Chat
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