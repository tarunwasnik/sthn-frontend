// frontend/src/pages/CreatorBookings.tsx

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import api from "../api/axios";
import { formatMajorUnitBookingMoney } from "../features/bookingFunding/money";
import { useBookingCurrencyMetadata } from "../features/bookingFunding/useBookingCurrencyMetadata";

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

  currency: string;

  serviceTitle?: string;

  service?: {
    title?: string;

    media?: string[];
    thumbnailUrl?: string;
    image?: string;

    data?: {
      media?: string[];
    };
  };

  user?: {
    _id?: string;
    displayName?: string;
    avatarUrl?: string;
  };

  creator?: {
    _id?: string;

    profile?: {
      slug?: string;
      displayName?: string;
      avatarUrl?: string | null;
    };
  };

  slots: Slot[];
}

const getBookedServicePrice = (booking: Booking): number | null => {
  if (booking.slots.length === 0) return null;
  const price = booking.slots.reduce((sum, slot) => sum + slot.price, 0);
  return Number.isFinite(price) ? price : null;
};

export default function CreatorBookings() {
  const navigate = useNavigate();
  const bookingCurrencies = useBookingCurrencyMetadata();

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

    const res = await api.get("/v1/creator/bookings");

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

  const getPaymentText = (
    booking: Booking
  ) => {
    return (
      booking.paymentStatus ||
      "Unavailable"
    );
  };

  /* ================= UI ================= */

  return (
    <DashboardLayout>

      <div className="min-h-screen">

        <div className="max-w-7xl mx-auto px-4 py-6 pb-28 space-y-6">

          {/* HEADER */}
          <div>
  <h1 className="text-2xl font-semibold tracking-tight text-theme-text md:text-4xl">
    My Bookings
  </h1>

  <p className="mt-2 text-sm text-theme-muted md:text-base">
    Manage all your bookings
  </p>

  <div className="mt-5">
    <span className="inline-flex h-11 items-center rounded-[var(--radius-control)] border border-theme-border bg-theme-inset px-5 text-theme-text">
      Received bookings
    </span>
  </div>

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
                bg-theme-surface
                border border-theme-border
                rounded-[var(--radius-control)]
                px-4 py-3
                text-theme-text
                focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent
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
                  className="bg-theme-surface text-theme-text"
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
                  rounded-[var(--radius-control)]
                  text-[15px]
                  transition-colors
                  border
                  ${
                    filter === status
                      ? `
                        bg-theme-accent-tint
                        text-theme-accent
                        border-theme-accent
                      `
                      : `
                        bg-theme-surface
                        text-theme-muted
                        border-theme-border
                        hover:bg-theme-inset hover:text-theme-text
                      `
                  }
                  focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent
                `}
              >
                {status}
              </button>

            ))}

          </div>

          {/* LOADING */}
          {loading && (
            <div className="text-theme-muted">
              Loading bookings...
            </div>
          )}

          {/* EMPTY */}
          {!loading &&
            filteredBookings.length ===
              0 && (
              <div className="
  bg-theme-surface
  border border-theme-border
  rounded-[var(--radius-card)]
  p-10
  text-center
  text-theme-muted
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
  booking.service?.title ||
  booking.serviceTitle ||
  "Untitled Service";

const serviceMedia =
  booking.service?.thumbnailUrl ||
  booking.service?.image ||
  booking.service?.media?.[0];

const personName = booking.user?.displayName;

const personAvatar = booking.user?.avatarUrl;

const personLabel = "Client";

const personLink = `/users/${booking.user?._id}`;
const bookedServicePrice = getBookedServicePrice(booking);

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

      <p className="text-[26px] font-semibold leading-none text-theme-text">
        {serviceTitle}
      </p>

      {/* USER */}
      <button
        type="button"
        onClick={() => {
  if (personLink) {
    navigate(personLink);
  }
}}
        className="mt-5 flex items-center gap-3 rounded-[var(--radius-control)] text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent"
      >

       {personAvatar ? (
          <img
            src={personAvatar}
            alt="avatar"
            className="
              w-11
              h-11
              rounded-full
              object-cover
              border border-theme-border
            "
          />
        ) : (
          <div className="
            w-11
            h-11
            rounded-full
            bg-theme-inset
            flex
            items-center
            justify-center
            text-theme-text
          ">
            {
  (
    personName ||
    "U"
  )[0]
}
          </div>
        )}

        <div className="text-left">

          <p className="text-xs text-theme-muted">
            {personLabel}
          </p>

          <p className="text-[17px] font-semibold text-theme-text">
            {
  personName ||
  "Unknown"
}
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
                rounded-[var(--radius-control)]
                bg-theme-inset
                border border-theme-border
                text-[11px]
                text-theme-text
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
      rounded-[var(--radius-card)]
      overflow-hidden
      border border-theme-border
      bg-theme-inset
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
          text-theme-muted
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
      <p className="text-[12px] text-theme-muted">
        Payment:{" "}
        {getPaymentText(
          booking
        )}
      </p>
    </div>

    <div className="text-right">

      <p className="
        text-theme-text
        text-sm
        font-semibold
      ">
        {booking.currency}
      </p>

      <p className="
        text-theme-text
        text-[25px]
        font-bold
        leading-none
      ">
        {bookedServicePrice === null
          ? "Price unavailable"
          : formatMajorUnitBookingMoney(bookedServicePrice, booking.currency, bookingCurrencies)}
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

                            <p className="text-[11px] text-theme-muted">
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

                            <p className="text-sm text-theme-muted">
                              Service
                            </p>

                            <h2
                              className="
                                text-[16px]
                                font-semibold
                                text-theme-text
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
  if (personLink) {
    navigate(personLink);
  }
}}
                            className="mt-4 flex items-center gap-3 rounded-[var(--radius-control)] text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent"
                          >

                           {personAvatar ? (
                              <img
                                src={personAvatar}
                                alt="avatar"
                                className="
                                  w-9
                                  h-9
                                  rounded-full
                                  object-cover
                                  border border-theme-border
                                "
                              />
                            ) : (
                              <div
                                className="
                                  w-9
                                  h-9
                                  rounded-full
                                  bg-theme-inset
                                  flex
                                  items-center
                                  justify-center
                                  text-theme-text
                                  text-sm
                                "
                              >
                                {
  (
    personName ||
    "U"
  )[0]
}
                              </div>
                            )}

                            <div className="text-left">

                              <p className="text-[11px] text-theme-muted">
                                {personLabel}
                              </p>

                              <p className="text-[15px] font-semibold text-theme-text">
                                {
  personName ||
  "Unknown"
}
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
                                    rounded-[var(--radius-control)]
                                    bg-theme-inset
                                    border border-theme-border
                                    text-[11px]
                                    text-theme-text
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
  rounded-[var(--radius-card)]
  overflow-hidden
  border border-theme-border
  bg-theme-inset
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
                            items-center
                            justify-center
                            h-full
                          "
                        >

                          <div className="text-right">

                            <p className="text-xs text-theme-muted">
                              Payment:{" "}
                              {getPaymentText(
                                booking
                              )}
                            </p>

                            <div className="mt-3">

                              <p
                                className="
                                  text-theme-text
                                  text-xs
                                  font-semibold
                                "
                              >
                                {booking.currency}
                              </p>

                              <p
                                className="
                                  text-theme-text
                                  text-[26px]
                                  font-bold
                                  leading-none
                                  mt-1
                                "
                              >
                                {bookedServicePrice === null
                                  ? "Price unavailable"
                                  : formatMajorUnitBookingMoney(bookedServicePrice, booking.currency, bookingCurrencies)}
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

                            {booking.status ===
  "CONFIRMED" && (

  <button
    onClick={() => {
      if (window.innerWidth >= 1024) {
        navigate(
          `/dashboard/creator/messages?bookingId=${booking._id}`
        );
      } else {
        navigate(
          `/dashboard/chat/${booking._id}`
        );
      }
    }}
    className="
      w-full
      h-11
      rounded-[var(--radius-control)]
      bg-theme-surface
      border border-theme-border
      text-theme-text
      text-sm
      hover:bg-theme-inset
      transition-colors
      focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent
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
