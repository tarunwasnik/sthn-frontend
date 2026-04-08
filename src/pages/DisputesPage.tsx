// frontend/src/pages/DisputesPage.tsx

import { useEffect, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import api from "../api/axios";

interface Dispute {
  _id: string;
  status: "OPEN" | "RESOLVED" | "REJECTED";
  reason: string;
  createdAt: string;

  bookingId: {
    _id: string;
    status: string;

    service?: {
      title: string;
    };

    user?: {
      displayName: string;
    };
  };
}

export default function DisputesPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDisputes = async () => {
    try {
      setLoading(true);

      const res = await api.get("/api/v1/disputes/my");

      setDisputes(res.data.disputes || []);
    } catch (err) {
      console.error("DISPUTES ERROR:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisputes();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "OPEN":
        return "bg-yellow-500";
      case "RESOLVED":
        return "bg-green-600";
      case "REJECTED":
        return "bg-red-600";
      default:
        return "bg-gray-500";
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <p className="text-gray-400">Loading disputes...</p>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl space-y-6">

        <h1 className="text-2xl font-bold">
          My Disputes
        </h1>

        {disputes.length === 0 ? (
          <p className="text-gray-400">
            No disputes found
          </p>
        ) : (
          <div className="space-y-4">
            {disputes.map((d) => (
              <div
                key={d._id}
                className="bg-[#0B1220] border border-gray-800 p-5 rounded-xl space-y-3"
              >
                {/* HEADER */}
                <div className="flex justify-between">
                  <span
                    className={`text-xs px-2 py-1 rounded text-white ${getStatusColor(
                      d.status
                    )}`}
                  >
                    {d.status}
                  </span>

                  <span className="text-xs text-gray-400">
                    {new Date(d.createdAt).toLocaleString()}
                  </span>
                </div>

                {/* BOOKING */}
                <div>
                  <p className="text-sm text-gray-400">
                    Booking
                  </p>
                  <p className="text-white">
                    {d.bookingId?.service?.title ||
                      "Service"}
                  </p>
                </div>

                {/* USER */}
                {d.bookingId?.user && (
                  <div>
                    <p className="text-xs text-gray-400">
                      User
                    </p>
                    <p className="text-white">
                      {d.bookingId.user.displayName}
                    </p>
                  </div>
                )}

                {/* REASON */}
                <div>
                  <p className="text-xs text-gray-400">
                    Reason
                  </p>
                  <p className="text-sm text-white">
                    {d.reason}
                  </p>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}