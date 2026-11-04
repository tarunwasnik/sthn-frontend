// frontend/src/pages/admin/operations/OperationsDashboard.tsx

import { useEffect, useState } from "react";

import api from "../../../api/axios";
import AdminLayout from "../../../components/admin/layout/AdminLayout";

export default function OperationsDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [overview, setOverview] = useState<{ users: { total: number; last7Days: number }; creators: { total: number; approved: number; pending: number }; bookings: { total: number; last7Days: number; today: number } } | null>(null);

  useEffect(() => {
    const loadOverview = async () => {
      try {
        const response = await api.get<{ data: typeof overview }>("/v1/admin/dashboard/overview");
        setOverview(response.data.data);
      } catch {
        setError("Unable to load the Operations overview.");
      } finally {
        setLoading(false);
      }
    };

    void loadOverview();
  }, []);

  if (loading) {
    return (
      <AdminLayout workspace="operations">
        <div className="flex h-[70vh] items-center justify-center">
          <p className="text-neutral-400">
            Initializing Operations Workspace...
          </p>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout workspace="operations">
        <div className="flex h-[70vh] items-center justify-center">
          <p className="text-red-400">{error}</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout workspace="operations">
      <div className="space-y-5"><div><h1 className="text-3xl font-bold">Operations Dashboard</h1><p className="text-neutral-400">Authoritative platform operations overview.</p></div>{overview ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[["Users", overview.users.total, `+${overview.users.last7Days} in 7 days`], ["Creators", overview.creators.total, `${overview.creators.approved} approved · ${overview.creators.pending} pending`], ["Bookings", overview.bookings.total, `${overview.bookings.today} today · ${overview.bookings.last7Days} in 7 days`]].map(([label, value, detail]) => <div key={String(label)} className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-5"><p className="text-sm text-neutral-400">{label}</p><p className="mt-2 text-3xl font-bold">{value}</p><p className="mt-2 text-xs text-neutral-500">{detail}</p></div>)}</div> : <p className="text-neutral-400">No overview data is available.</p>}</div>
    </AdminLayout>
  );
}
