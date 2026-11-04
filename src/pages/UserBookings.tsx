// frontend/src/pages/UserBookings.tsx

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import UserDashboardLayout from "../layouts/UserDashboardLayout";
import { getUserBookingsAPI } from "../api/userBooking";
import { bookingLocalTimeZone, formatBookingLocalDateTime } from "../utils/bookingDateTime";

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

  price: number;
  currency: string;

  service: {
    _id?: string;
    title?: string;

    data?: {
      media?: string[];
    };
  };

  creator: {
    _id?: string;

    profile: {
      slug?: string;
      displayName?: string;
      avatarUrl?: string | null;
    };
  };

  slots: Slot[];
}

const filters = [
  "ALL",
  "REQUESTED",
  "CONFIRMED",
  "COMPLETED",
  "REJECTED",
  "EXPIRED",
  "CANCELLED",
];

export default function UserBookings() {
  const navigate = useNavigate();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("ALL");

  const fetchBookings = async () => {
    try {
      setLoading(true); setError(null);

      const res = await getUserBookingsAPI();

      setBookings(res.bookings || []);
    } catch (err) {
      console.error(
        "Failed to fetch user bookings",
        err
      );
      setError("Unable to load bookings. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const filteredBookings =
    filter === "ALL"
      ? bookings
      : bookings.filter(
          (b) => b.status === filter
        );

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

  return (
    <UserDashboardLayout>
      <div className="min-h-screen">

        <div className="max-w-6xl mx-auto space-y-8 px-1 pb-24 md:px-2">

          {/* HEADER */}
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-theme-text md:text-4xl">
              My Bookings
            </h1>

            <p className="mt-2 text-sm text-theme-muted md:text-base">
              Manage all your bookings
            </p>
            <p className="mt-1 text-xs text-theme-muted">Booking and expiry times are shown in {bookingLocalTimeZone}.</p>
          </div>

          {/* MOBILE FILTER */}
          <div className="md:hidden">
            <select
              value={filter}
              onChange={(e) =>
                setFilter(e.target.value)
              }
              className="
                w-full
                bg-theme-surface
                border border-theme-border
                rounded-[var(--radius-control)]
                px-4 py-3
                text-theme-text
                outline-none
                focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent
              "
            >
              {filters.map((status) => (
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
            {filters.map((status) => (
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
            <div className="space-y-5">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="
                    h-[240px]
                    rounded-[var(--radius-card)]
                    border border-theme-border
                    bg-theme-inset
                    animate-pulse
                  "
                />
              ))}
            </div>
          )}

          {!loading && error && (
            <div className="rounded-[var(--radius-card)] border border-theme-danger bg-theme-danger-tint p-6 text-center text-sm text-theme-danger">{error}<button type="button" onClick={() => void fetchBookings()} className="ml-3 rounded font-semibold underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent">Retry</button></div>
          )}

          {/* EMPTY */}
          {!loading && !error &&
            filteredBookings.length ===
              0 && (
              <div
                className="
                  rounded-[var(--radius-card)]
                  border border-theme-border
                  bg-theme-surface
                  p-10 md:p-14
                  text-center
                "
              >
                <h3 className="text-2xl font-semibold text-theme-text">
                  No bookings yet
                </h3>

                <p className="mx-auto mt-3 max-w-md text-theme-muted">
                  Browse creators and schedule
                  your first experience.
                </p>

                <button
                  onClick={() =>
                    navigate(
                      "/dashboard/user/browse"
                    )
                  }
                  className="
                    mt-6
                    h-12
                    px-6
                    rounded-[var(--radius-control)]
                    bg-theme-primary
                    text-theme-primary-text
                    transition-opacity hover:opacity-90
                    focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent
                  "
                >
                  Explore Creators
                </button>
              </div>
            )}

          {/* LIST */}
{!loading && !error && (
  <div className="space-y-5">

    {filteredBookings.map((b) => {

      const totalPrice = b.slots.reduce(
        (sum, slot) => sum + slot.price,
        0
      );

      const serviceImage =
        b.service?.data?.media?.find(
          (item) =>
            typeof item === "string" &&
            item.trim() !== ""
        );

      return (

        <div
          key={b._id}
          className="
            group
            relative
            overflow-hidden
            rounded-[var(--radius-card)]
            border border-theme-border
            bg-theme-surface
            px-5
            py-5
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
                  {b.service?.title || "Untitled Service"}
                </p>

                {/* CREATOR */}
                <button
                  type="button"
                  onClick={() => {
                    if (b.creator?._id) {
                      navigate(
                        `/creators/${b.creator.profile?.slug}`
                      );
                    }
                  }}
                  className="mt-5 flex items-center gap-3 rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent"
                >

                  {b.creator?.profile?.avatarUrl ? (
                    <img
                      src={b.creator.profile.avatarUrl}
                      alt="creator"
                      className="
                        w-11
                        h-11
                        rounded-full
                        object-cover
                        border border-theme-border
                      "
                    />
                  ) : (
                    <div
                      className="
                        w-11
                        h-11
                        rounded-full
                        bg-theme-inset
                        flex
                        items-center
                        justify-center
                        text-theme-text
                      "
                    >
                      {(
                        b.creator?.profile
                          ?.displayName || "C"
                      )[0]}
                    </div>
                  )}

                  <div className="text-left">

                    <p className="text-xs text-theme-muted">
                      Creator
                    </p>

                    <p className="text-[17px] font-semibold text-theme-text">
                      {b.creator?.profile?.displayName ||
                        "Unknown"}
                    </p>

                  </div>

                </button>

              </div>

              {/* RIGHT */}
              <div className="flex flex-col items-end gap-3 shrink-0">

                <span
                  className={`
                    px-3
                    py-1.5
                    rounded-full
                    text-[11px]
                    font-semibold
                    whitespace-nowrap
                    ${getStatusStyle(b.status)}
                  `}
                >
                  {b.status}
                </span>

                <div className="flex flex-col items-end gap-2">

                  {b.slots?.map((slot) => {

                    const start = new Date(
                      slot.startTime
                    );

                    const end = new Date(
                      slot.endTime
                    );

                    return (
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
                        {start.toLocaleTimeString(
                          [],
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                        {" - "}
                        {end.toLocaleTimeString(
                          [],
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </div>
                    );
                  })}

                </div>

              </div>

            </div>

                      {/* SERVICE IMAGE */}
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

  {serviceImage ? (
    <img
      src={serviceImage}
      alt={b.service?.title || "Service"}
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
      Payment: {getPaymentText(b)}
    </p>
  </div>

  <div className="text-right">

    <p
      className="
        text-theme-text
        text-sm
        font-semibold
      "
    >
      {b.currency}
    </p>

    <p
      className="
        text-theme-text
        text-[25px]
        font-bold
        leading-none
      "
    >
      {totalPrice}
    </p>

  </div>

</div>

{/* BUTTONS */}
<div className="space-y-2">

  <button
    onClick={() =>
      navigate(
        `/dashboard/user/bookings/${b._id}`
      )
    }
    className="
      w-full
      h-[54px]
      rounded-[var(--radius-control)]
      bg-theme-surface
      border border-theme-border
      text-theme-text
      transition-colors hover:border-theme-border-strong hover:bg-theme-inset
      focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent
      font-semibold
      text-[17px]
    "
  >
    View Details
  </button>

  {b.status === "CONFIRMED" && (

    <button
      onClick={() =>
        navigate(
          `/dashboard/chat/${b._id}`
        )
      }
      className="
        w-full
        h-[54px]
        rounded-[var(--radius-control)]
        bg-theme-surface
        border border-theme-border
        text-theme-text
        transition-colors hover:border-theme-border-strong hover:bg-theme-inset
        focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent
        font-medium
      "
    >
      Open Chat
    </button>

  )}

</div>

{b.status === "REQUESTED" && (
  <p className="text-xs text-theme-muted">
    Expires at{" "}
    {formatBookingLocalDateTime(b.expiresAt)}
  </p>
)}

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
          b.createdAt
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
            b.status
          )}
        `}
      >
        {b.status}
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
          font-bold
          text-theme-text
          mt-1
          truncate
        "
      >
        {b.service?.title ||
          "Untitled Service"}
      </h2>

    </div>

    {/* CREATOR */}
    <button
      type="button"
      onClick={() => {
        if (b.creator?._id) {
          navigate(
            `/creators/${b.creator.profile?.slug}`
          );
        }
      }}
      className="
        flex
        items-center
        gap-3
        mt-4 rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent
      "
    >

      {b.creator?.profile?.avatarUrl ? (
        <img
          src={
            b.creator.profile.avatarUrl
          }
          alt="creator"
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
          {(
            b.creator?.profile
              ?.displayName ||
            "C"
          )[0]}
        </div>
      )}

      <div className="text-left">

        <p className="text-[11px] text-theme-muted">
          Creator
        </p>

        <p className="text-[15px] font-semibold text-theme-text">
          {b.creator?.profile
            ?.displayName ||
            "Unknown"}
        </p>

      </div>

    </button>

    {/* SLOT ROW */}
    <div className="flex flex-wrap gap-2 mt-4">

      {b.slots?.map((slot) => {

        const start = new Date(
          slot.startTime
        );

        const end = new Date(
          slot.endTime
        );

        return (
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
            {start.toLocaleTimeString(
              [],
              {
                hour: "2-digit",
                minute: "2-digit",
              }
            )}
            {" - "}
            {end.toLocaleTimeString(
              [],
              {
                hour: "2-digit",
                minute: "2-digit",
              }
            )}
          </div>
        );
      })}

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

  {serviceImage ? (
    <img
      src={serviceImage}
      alt={b.service?.title || "Service"}
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
      {getPaymentText(b)}
    </p>

    <div className="mt-3">

      <p
        className="
          text-theme-text
          text-xs
          font-semibold
        "
      >
        {b.currency}
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
        {totalPrice}
      </p>

    </div>

  </div>

  <div className="w-full mt-5 space-y-2">

    <button
      onClick={() =>
        navigate(
          `/dashboard/user/bookings/${b._id}`
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
        transition-colors hover:border-theme-border-strong hover:bg-theme-inset
        focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent
      "
    >
      View Details
    </button>

    {b.status === "CONFIRMED" && (

  <button
    onClick={() => {
      console.log(
    "OPEN CHAT BOOKING ID",
    b._id
  );
      if (window.innerWidth >= 1024) {
        navigate(
          `/dashboard/user/messages?bookingId=${b._id}`
        );
      } else {
        navigate(
          `/dashboard/chat/${b._id}`
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
      transition-colors hover:border-theme-border-strong hover:bg-theme-inset
      focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent
    "
  >
    Open Chat
  </button>

)}

  </div>

  {b.status === "REQUESTED" && (
    <p className="mt-4 text-center text-xs text-theme-muted">
      Expires at{" "}
      {formatBookingLocalDateTime(b.expiresAt)}
    </p>
  )}

</div>

</div>

</div>

);
})}

</div>
)}

</div>
</div>
</UserDashboardLayout>
);
}
