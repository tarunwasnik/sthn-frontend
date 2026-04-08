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

interface Booking {
  _id: string;
  status: string;
  paymentStatus: string;
  expiresAt: string;
  createdAt: string;
  userId: string;
  slots?: Slot[]; // ✅ MAKE OPTIONAL
}

export default function CreatorRequests() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const navigate = useNavigate();

  const fetchBookings = async () => {
    try {
      setLoading(true);

      const res = await api.get("/v1/creator/bookings", {
        params: { status: "REQUESTED" },
      });

      setBookings(res.data.bookings || []);
    } catch (err) {
      console.error("Failed to fetch bookings", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDecision = async (
    bookingId: string,
    decision: "ACCEPT" | "REJECT"
  ) => {
    if (processingId !== null) return;

    try {
      setProcessingId(bookingId);

      await decideBookingAPI(bookingId, decision);

      await fetchBookings();
    } catch (err) {
      console.error("Decision failed", err);
    } finally {
      setProcessingId(null);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">
          Booking Requests
        </h1>

        {loading && (
          <p className="text-gray-400">Loading bookings...</p>
        )}

        {!loading && bookings.length === 0 && (
          <p className="text-gray-500">
            No booking requests yet.
          </p>
        )}

        {!loading &&
          bookings?.map((booking) => (
            <div
              key={booking._id}
              className="bg-[#111827] border border-gray-800 rounded-xl p-6 space-y-4"
            >
              {/* HEADER */}
              <div className="flex justify-between items-start">

                <div>
                  <p className="text-sm text-gray-400">
                    Status:{" "}
                    <span className="text-white">
                      {booking.status}
                    </span>
                  </p>

                  <p className="text-xs text-gray-500">
                    Requested at{" "}
                    {new Date(booking.createdAt).toLocaleString()}
                  </p>

                  <p className="text-xs text-gray-500">
                    Expires at{" "}
                    {new Date(booking.expiresAt).toLocaleTimeString()}
                  </p>
                </div>

                {/* ACTIONS */}
                <div className="flex space-x-3 flex-wrap">

                  <button
                    onClick={() =>
                      navigate(`/users/${booking.userId}`)
                    }
                    disabled={processingId !== null}
                    className="px-4 py-2 bg-gray-700 rounded-lg text-sm hover:bg-gray-600 transition disabled:opacity-50"
                  >
                    View User
                  </button>

                  <button
                    onClick={() =>
                      navigate(
                        `/dashboard/creator/bookings/${booking._id}`
                      )
                    }
                    className="px-4 py-2 bg-blue-600 rounded-lg text-sm hover:bg-blue-700 transition"
                  >
                    View Details
                  </button>

                  {booking.status === "REQUESTED" && (
                    <button
                      disabled={processingId !== null}
                      onClick={() =>
                        handleDecision(booking._id, "ACCEPT")
                      }
                      className="px-4 py-2 bg-green-600 rounded-lg text-sm hover:bg-green-700 transition disabled:opacity-50"
                    >
                      {processingId === booking._id
                        ? "Processing..."
                        : "Accept"}
                    </button>
                  )}

                  {booking.status === "REQUESTED" && (
                    <button
                      disabled={processingId !== null}
                      onClick={() =>
                        handleDecision(booking._id, "REJECT")
                      }
                      className="px-4 py-2 bg-red-600 rounded-lg text-sm hover:bg-red-700 transition disabled:opacity-50"
                    >
                      {processingId === booking._id
                        ? "Processing..."
                        : "Reject"}
                    </button>
                  )}
                </div>
              </div>

              {/* ✅ SAFE SLOTS RENDER */}
              <div className="space-y-2">
                {booking.slots && booking.slots.length > 0 ? (
                  booking.slots.map((slot) => (
                    <div
                      key={slot._id}
                      className="bg-[#0F172A] p-3 rounded-lg border border-gray-800 text-sm"
                    >
                      {new Date(slot.startTime).toLocaleTimeString()} -{" "}
                      {new Date(slot.endTime).toLocaleTimeString()}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-500">
                    Slots not loaded
                  </p>
                )}
              </div>
            </div>
          ))}
      </div>
    </DashboardLayout>
  );
}