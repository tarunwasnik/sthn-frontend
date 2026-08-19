import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

import DashboardLayout from "../layouts/DashboardLayout";
import UserDashboardLayout from "../layouts/UserDashboardLayout";
import { getMyDisputes } from "../features/dispute/api";
import type { DisputeListItem } from "../features/dispute/types";

type Props = { actor: "user" | "creator" };
type ContentProps = Props & { embedded?: boolean };

function messageFor(error: unknown) {
  if (axios.isAxiosError(error) && typeof error.response?.data?.message === "string") return error.response.data.message;
  return "Disputes are unavailable right now.";
}

export function DisputeTrackingContent({ actor, embedded = false }: ContentProps) {
  const [disputes, setDisputes] = useState<DisputeListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true); setError(null);
    try { setDisputes(await getMyDisputes()); }
    catch (loadError) { setError(messageFor(loadError)); }
    finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, []);

  const bookingPath = actor === "user" ? "/dashboard/user/bookings" : "/dashboard/creator/bookings";
  return (
      <section className="mx-auto max-w-4xl space-y-5">
        <div><h2 className={embedded ? "text-xl font-semibold text-white" : "text-2xl font-bold text-white"}>Disputes</h2><p className="mt-1 text-sm text-white/50">Track disputes affecting your bookings.</p></div>
        {loading && <p className="text-sm text-white/50">Loading disputes...</p>}
        {error && <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-100">{error}<button type="button" onClick={() => void load()} className="ml-3 font-semibold underline">Retry</button></div>}
        {!loading && !error && disputes.length === 0 && <p className="rounded-xl border border-white/10 bg-white/[0.03] p-5 text-sm text-white/50">No disputes found.</p>}
        {!loading && !error && disputes.map((dispute) => (
          <article key={dispute.disputeId} className="space-y-3 rounded-xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex flex-wrap items-center justify-between gap-2"><span className="rounded bg-yellow-500/15 px-2 py-1 text-xs font-semibold text-yellow-100">{dispute.status}</span><span className="text-xs text-white/45">{new Date(dispute.createdAt).toLocaleString()}</span></div>
            <div><p className="text-xs text-white/45">Booking</p><p className="text-sm font-medium text-white">{dispute.booking?.serviceTitle ?? "Booking"}</p><p className="text-xs text-white/50">{dispute.booking?.bookingReference ?? dispute.booking?.status ?? ""}</p></div>
            <p className="text-sm text-white/70">{dispute.reason}</p>
            <p className="text-xs text-white/50">{dispute.raisedByMe ? "Raised by you" : `Raised by ${dispute.raisedByRole === "CREATOR" ? "Creator" : "User"}`}{dispute.escalationLevel !== "NONE" ? ` · Escalation: ${dispute.escalationLevel}` : ""}</p>
            {dispute.resolution && <p className="text-xs text-white/50">Resolution: {dispute.resolution.action}</p>}
            {dispute.booking && <Link className="text-xs font-semibold text-cyan-200 underline" to={`${bookingPath}/${dispute.booking.bookingId}`}>View booking</Link>}
          </article>
        ))}
      </section>
  );
}

export default function DisputesPage({ actor }: Props) {
  const Layout = actor === "user" ? UserDashboardLayout : DashboardLayout;
  return <Layout><DisputeTrackingContent actor={actor} /></Layout>;
}
