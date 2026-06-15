// frontend/src/pages/UserBookings.tsx

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import UserDashboardLayout from "../layouts/UserDashboardLayout";
import { getUserBookingsAPI } from "../api/userBooking";

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
  const [filter, setFilter] = useState<string>("ALL");

  const fetchBookings = async () => {
    try {
      setLoading(true);

      const res = await getUserBookingsAPI();

      setBookings(res.bookings || []);
    } catch (err) {
      console.error(
        "Failed to fetch user bookings",
        err
      );
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
    booking.status === "EXPIRED" ||
    booking.status === "CANCELLED" ||
    booking.status === "REJECTED"
   ) {
    return "REFUNDED";
   }

   return (
    booking.paymentStatus ||
    "PAID"
   );
      };

  return (
    <UserDashboardLayout>
      <div className="min-h-screen">

        <div className="max-w-6xl mx-auto px-1 md:px-2 pb-24 space-y-8">

          {/* HEADER */}
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-[#F8FAFC]">
              My Bookings
            </h1>

            <p className="mt-2 text-white/55 text-sm md:text-base">
              Manage all your bookings
            </p>
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
                bg-white/[0.03]
                border border-white/10
                rounded-[20px]
                px-4 py-3
                text-white
                outline-none
              "
            >
              {filters.map((status) => (
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
            {filters.map((status) => (
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
                        bg-white/[0.07]
                        text-white
                        border-white/20
                      `
                      : `
                        bg-white/[0.03]
                        text-white/70
                        border-white/10
                        hover:bg-white/[0.05]
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
            <div className="space-y-5">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="
                    h-[240px]
                    rounded-[30px]
                    border border-white/10
                    bg-white/[0.03]
                    animate-pulse
                  "
                />
              ))}
            </div>
          )}

          {/* EMPTY */}
          {!loading &&
            filteredBookings.length ===
              0 && (
              <div
                className="
                  rounded-[34px]
                  border border-white/10
                  bg-white/[0.03]
                  backdrop-blur-xl
                  p-10 md:p-14
                  text-center
                "
              >
                <h3 className="text-2xl font-semibold text-white">
                  No bookings yet
                </h3>

                <p className="text-white/50 mt-3 max-w-md mx-auto">
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
                    rounded-2xl
                    bg-white/[0.05]
                    border border-white/10
                    text-white
                    hover:bg-white/[0.08]
                    transition-all
                  "
                >
                  Explore Creators
                </button>
              </div>
            )}

          {/* LIST */}
{!loading && (
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
            rounded-[30px]
            border border-white/10
            bg-gradient-to-br
            from-white/[0.045]
            to-white/[0.015]
            backdrop-blur-xl
            px-5
            py-5
            shadow-[0_10px_30px_rgba(0,0,0,0.35)]
            transition-all
            duration-300
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
                  className="flex items-center gap-3 mt-5"
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
                        border border-[rgba(255,255,255,0.08)]
                      "
                    />
                  ) : (
                    <div
                      className="
                        w-11
                        h-11
                        rounded-full
                        bg-[rgba(255,255,255,0.05)]
                        flex
                        items-center
                        justify-center
                        text-white
                      "
                    >
                      {(
                        b.creator?.profile
                          ?.displayName || "C"
                      )[0]}
                    </div>
                  )}

                  <div className="text-left">

                    <p className="text-xs text-[rgba(255,255,255,0.42)]">
                      Creator
                    </p>

                    <p className="text-[17px] font-semibold text-[#F8FAFC]">
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
                          rounded-xl
                          bg-[rgba(255,255,255,0.03)]
                          border border-[rgba(255,255,255,0.07)]
                          text-[11px]
                          text-[#F8FAFC]
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
    rounded-[28px]
    overflow-hidden
    border border-[rgba(255,255,255,0.08)]
    bg-white/[0.03]
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
      Payment: {getPaymentText(b)}
    </p>
  </div>

  <div className="text-right">

    <p
      className="
        text-[#4ADE80]
        text-sm
        font-semibold
      "
    >
      {b.currency}
    </p>

    <p
      className="
        text-[#4ADE80]
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

{b.status === "REQUESTED" && (
  <p className="text-xs text-[rgba(255,255,255,0.40)]">
    Expires at{" "}
    {new Date(
      b.expiresAt
    ).toLocaleTimeString()}
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

      <p className="text-[rgba(255,255,255,0.38)] text-[11px]">
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
        mt-4
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
            b.creator?.profile
              ?.displayName ||
            "C"
          )[0]}
        </div>
      )}

      <div className="text-left">

        <p className="text-[rgba(255,255,255,0.38)] text-[11px]">
          Creator
        </p>

        <p className="text-[#F8FAFC] font-semibold text-[15px]">
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
              rounded-xl
              bg-white/[0.04]
              border border-white/10
              text-[11px]
              text-[#F8FAFC]
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
    rounded-[28px]
    overflow-hidden
    border border-white/10
    bg-white/[0.03]
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
      {getPaymentText(b)}
    </p>

    <div className="mt-3">

      <p
        className="
          text-[#4ADE80]
          text-xs
          font-semibold
        "
      >
        {b.currency}
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

  {b.status === "REQUESTED" && (
    <p className="mt-4 text-xs text-white/40 text-center">
      Expires at{" "}
      {new Date(
        b.expiresAt
      ).toLocaleTimeString()}
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