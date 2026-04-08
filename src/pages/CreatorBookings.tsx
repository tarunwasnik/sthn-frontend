//frontend/src/pages/CreatorBookings.tsx

import { useEffect, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

interface Booking {
  _id: string;
  status: string;
  paymentStatus: string;
  createdAt: string;

  price: number;
  currency: string;

  serviceTitle: string;

  user?: {
    displayName: string;
    avatarUrl: string | null;
  };
}

const filters = [
  "ALL",
  "REQUESTED",
  "CONFIRMED",
  "REJECTED",
  "EXPIRED",
];

export default function CreatorBookings() {
  const navigate = useNavigate();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filter, setFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await api.get("/v1/creator/bookings");
      setBookings(res.data.bookings || []);
    } catch (err) {
      console.error("Failed to load bookings", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const filtered =
    filter === "ALL"
      ? bookings
      : bookings.filter((b) => b.status === filter);

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl">

        <h1 className="text-2xl font-bold">
          My Bookings
        </h1>

        {/* FILTERS */}
        <div className="flex gap-2 flex-wrap">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-lg text-sm transition ${
                filter === f
                  ? "bg-blue-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* LOADING */}
        {loading && (
          <p className="text-gray-400">
            Loading bookings...
          </p>
        )}

        {/* EMPTY */}
        {!loading && filtered.length === 0 && (
          <p className="text-gray-500">
            No bookings found.
          </p>
        )}

        {/* LIST */}
        <div className="space-y-4">
          {filtered.map((b) => (
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
                    {b.currency} {b.price}
                  </p>
                </div>
              </div>

              {/* SERVICE */}
              <div className="mb-4">
                <p className="text-xs text-gray-400">
                  Service
                </p>
                <p className="text-white font-medium text-lg">
                  {b.serviceTitle || "N/A"}
                </p>
              </div>

              {/* CLIENT */}
              <div className="flex items-center gap-3 mb-4">

                {/* AVATAR WITH FAILSAFE */}
                {b.user?.avatarUrl ? (
                  <img
                    src={b.user.avatarUrl}
                    alt="avatar"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = "none";
                    }}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : null}

                {/* FALLBACK AVATAR */}
                {!b.user?.avatarUrl && (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center text-sm text-white">
                    {b.user?.displayName?.[0]?.toUpperCase() || "U"}
                  </div>
                )}

                <div>
                  <p className="text-xs text-gray-400">
                    Client
                  </p>
                  <p className="text-sm text-white font-medium">
                    {b.user?.displayName || "Unknown"}
                  </p>
                </div>
              </div>

              {/* FOOTER */}
              <div className="flex justify-between items-center">

                <p className="text-xs font-medium">
                  {b.status === "CONFIRMED" && (
                    <span className="text-green-400">
                      Booking confirmed ✅
                    </span>
                  )}
                  {b.status === "REQUESTED" && (
                    <span className="text-yellow-400">
                      Awaiting your action ⏳
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

                <div className="flex gap-2">

                  <button
                    onClick={() =>
                      navigate(
                        `/dashboard/creator/bookings/${b._id}`
                      )
                    }
                    className="px-3 py-1.5 bg-gray-700 rounded-lg text-xs hover:bg-gray-600"
                  >
                    View
                  </button>

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
              </div>
            </div>
          ))}
        </div>

      </div>
    </DashboardLayout>
  );
}