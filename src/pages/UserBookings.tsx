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

  service: {
    title: string;
  };

  creator: {
    profile: {
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
  "REJECTED",
  "EXPIRED",
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
      console.error("Failed to fetch user bookings", err);
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
      : bookings.filter((b) => b.status === filter);

  return (
    <UserDashboardLayout>
      <div className="space-y-6 max-w-4xl">

        <h1 className="text-2xl font-bold">
          My Bookings
        </h1>

        {/* FILTER */}
        <div className="flex gap-2 flex-wrap">
          {filters.map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-1.5 rounded-lg text-sm transition ${
                filter === s
                  ? "bg-blue-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {loading && (
          <p className="text-gray-400">
            Loading bookings...
          </p>
        )}

        {!loading && filteredBookings.length === 0 && (
          <p className="text-gray-500">
            No bookings found.
          </p>
        )}

        <div className="space-y-4">
          {filteredBookings.map((b) => {
            const totalPrice = b.slots.reduce(
              (sum, s) => sum + s.price,
              0
            );

            const groupedSlots: Record<string, Slot[]> = {};

            b.slots.forEach((slot) => {
              const dateKey = new Date(slot.startTime)
                .toLocaleDateString(undefined, {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                });

              if (!groupedSlots[dateKey]) {
                groupedSlots[dateKey] = [];
              }

              groupedSlots[dateKey].push(slot);
            });

            return (
              <div
                key={b._id}
                className="bg-[#0B1220] border border-gray-800 rounded-2xl p-5 hover:border-gray-700 transition"
              >
                {/* HEADER */}
                <div className="flex justify-between items-start mb-4">

                  <div className="space-y-1">
                    <p className="text-xs text-gray-500">
                      {new Date(b.createdAt).toLocaleString()}
                    </p>

                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        b.status === "CONFIRMED"
                          ? "bg-green-900 text-green-400"
                          : b.status === "REQUESTED"
                          ? "bg-yellow-900 text-yellow-400"
                          : b.status === "REJECTED"
                          ? "bg-red-900 text-red-400"
                          : "bg-gray-700 text-gray-300"
                      }`}
                    >
                      {b.status}
                    </span>
                  </div>

                  <div className="text-right space-y-1">
                    <p className="text-xs text-gray-400">
                      Payment: {b.paymentStatus}
                    </p>

                    <p className="text-sm text-green-400 font-semibold">
                      ₹{totalPrice}
                    </p>
                  </div>
                </div>

                {/* SERVICE */}
                <div className="mb-4">
                  <p className="text-xs text-gray-400">
                    Service
                  </p>
                  <p className="text-white font-medium text-lg">
                    {b.service?.title || "N/A"}
                  </p>
                </div>

                {/* CREATOR */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center text-sm text-white">
                    {b.creator?.profile?.displayName?.[0]?.toUpperCase() || "C"}
                  </div>

                  <div>
                    <p className="text-xs text-gray-400">
                      Creator
                    </p>
                    <p className="text-sm text-white font-medium">
                      {b.creator?.profile?.displayName || "Unknown"}
                    </p>
                  </div>
                </div>

                {/* SLOTS */}
                <div className="space-y-4 mb-4">
                  {Object.entries(groupedSlots).map(([date, slots]) => (
                    <div key={date}>
                      <p className="text-sm text-blue-400 font-medium mb-2">
                        {date}
                      </p>

                      <div className="space-y-2">
                        {slots.map((slot) => {
                          const start = new Date(slot.startTime);
                          const end = new Date(slot.endTime);

                          return (
                            <div
                              key={slot._id}
                              className="bg-[#0F172A] p-3 rounded-lg border border-gray-800 text-sm flex justify-between"
                            >
                              <span>
                                {start.toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}{" "}
                                -{" "}
                                {end.toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>

                              <span className="text-gray-400">
                                ₹{slot.price}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {/* STATUS */}
                <p className="text-xs font-medium mb-3">
                  {b.status === "CONFIRMED" && (
                    <span className="text-green-400">
                      Booking confirmed ✅
                    </span>
                  )}
                  {b.status === "REQUESTED" && (
                    <span className="text-yellow-400">
                      Waiting for creator ⏳
                    </span>
                  )}
                  {b.status === "REJECTED" && (
                    <span className="text-red-400">
                      Booking rejected ❌
                    </span>
                  )}
                  {b.status === "EXPIRED" && (
                    <span className="text-gray-400">
                      Booking expired
                    </span>
                  )}
                </p>

                {/* 🔥 ACTIONS */}
                <div className="flex gap-2">

                  {/* VIEW BUTTON */}
                  <button
                    onClick={() =>
                      navigate(
                        `/dashboard/user/bookings/${b._id}`
                      )
                    }
                    className="px-3 py-1.5 bg-gray-700 rounded-lg text-xs hover:bg-gray-600"
                  >
                    View
                  </button>

                  {/* CHAT */}
                  {b.status === "CONFIRMED" && (
                    <button
                      onClick={() =>
                        navigate(`/dashboard/chat/${b._id}`)
                      }
                      className="px-4 py-2 bg-blue-600 rounded-lg text-xs hover:bg-blue-700"
                    >
                      Open Chat
                    </button>
                  )}

                </div>

                {/* EXPIRY */}
                {b.status === "REQUESTED" && (
                  <p className="text-xs text-gray-500 mt-2">
                    Expires at:{" "}
                    {new Date(b.expiresAt).toLocaleTimeString()}
                  </p>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </UserDashboardLayout>
  );
}