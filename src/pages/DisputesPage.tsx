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
  const disputePath = `/dashboard/${actor}/settings/disputes`;
  return (
      <section className="mx-auto max-w-4xl space-y-5">
        <div><h2 className={embedded ? "text-xl font-semibold text-theme-text" : "text-2xl font-bold text-theme-text"}>Disputes</h2><p className="mt-1 text-sm text-theme-muted">Track disputes affecting your bookings.</p></div>
        {loading && <p className="text-sm text-theme-muted">Loading disputes...</p>}
        {error && <div className="rounded-[var(--radius-card)] border border-theme-danger bg-theme-danger-tint p-4 text-sm text-theme-danger">{error}<button type="button" onClick={() => void load()} className="ml-3 font-semibold underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent">Retry</button></div>}
        {!loading && !error && disputes.length === 0 && <p className="rounded-[var(--radius-card)] border border-theme-border bg-theme-surface p-5 text-sm text-theme-muted">No disputes found.</p>}
        {!loading && !error && disputes.map((dispute) => (
          <article key={dispute.disputeId} className="space-y-3 rounded-[var(--radius-card)] border border-theme-border bg-theme-surface p-5">
            <div className="flex flex-wrap items-center justify-between gap-2"><span className="rounded bg-theme-warning-tint px-2 py-1 text-xs font-semibold text-theme-warning">{dispute.status}</span><span className="text-xs text-theme-muted">{new Date(dispute.createdAt).toLocaleString()}</span></div>
            <div><p className="text-xs text-theme-muted">Booking</p><p className="text-sm font-medium text-theme-text">{dispute.booking?.serviceTitle ?? "Booking"}</p><p className="text-xs text-theme-muted">{dispute.booking?.bookingReference ?? dispute.booking?.status ?? ""}</p></div>
            <p className="text-sm text-theme-text">{dispute.reason}</p>
            <p className="text-xs text-theme-muted">{dispute.raisedByMe ? "Raised by you" : `Raised by ${dispute.raisedByRole === "CREATOR" ? "Creator" : "User"}`}{dispute.escalationLevel !== "NONE" ? ` · Escalation: ${dispute.escalationLevel}` : ""}</p>
            {dispute.resolution && <p className="text-xs text-theme-muted">Resolution: {dispute.resolution.action}</p>}
            <div className="flex flex-wrap gap-4"><Link className="text-xs font-semibold text-theme-accent underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent" to={`${disputePath}/${dispute.disputeId}`}>Open dispute</Link>{dispute.booking && <Link className="text-xs font-semibold text-theme-accent underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent" to={`${bookingPath}/${dispute.booking.bookingId}`}>View booking</Link>}</div>
          </article>
        ))}
      </section>
  );
}

export default function DisputesPage({ actor }: Props) {
  const Layout = actor === "user" ? UserDashboardLayout : DashboardLayout;
  return <Layout><DisputeTrackingContent actor={actor} /></Layout>;
}
