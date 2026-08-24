import { ArrowLeft, CheckCircle2, Clock, RefreshCw, ShieldAlert } from "lucide-react";
import { Link } from "react-router-dom";
import type { DisputeListItem, DisputeStatus } from "../types";

interface InvestigationHeaderProps {
  dispute: DisputeListItem;
  inputState: "OPEN" | "CLOSED";
  actor: "user" | "creator";
  onRefresh: () => void;
  refreshing: boolean;
}

const dateTime = (value: string) => new Date(value).toLocaleString();

const statusBadgeClass = (status: DisputeStatus) => {
  switch (status) {
    case "OPEN":
      return "border-amber-400/30 bg-amber-400/10 text-amber-200";
    case "RESOLVED":
      return "border-emerald-400/30 bg-emerald-400/10 text-emerald-200";
    case "REJECTED":
      return "border-rose-400/30 bg-rose-400/10 text-rose-200";
    default:
      return "border-white/10 bg-white/5 text-white/70";
  }
};

const outcomeBadgeClass = (outcome: string) => {
  switch (outcome) {
    case "NO_ADVERSE_FINDING":
      return "border-emerald-400/30 bg-emerald-400/15 text-emerald-200";
    case "ADVERSE_FINDING":
      return "border-rose-400/30 bg-rose-400/15 text-rose-200";
    case "MIXED":
      return "border-amber-400/30 bg-amber-400/15 text-amber-200";
    case "INCONCLUSIVE":
    default:
      return "border-white/20 bg-white/10 text-white/80";
  }
};

export default function InvestigationHeader({
  dispute,
  inputState,
  actor,
  onRefresh,
  refreshing,
}: InvestigationHeaderProps) {
  const backPath = `/dashboard/${actor}/settings/disputes`;
  const isInputOpen = dispute.status === "OPEN" && inputState === "OPEN";

  return (
    <header className="space-y-3">
      {/* Top navigation bar */}
      <div className="flex items-center justify-between">
        <Link
          to={backPath}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-200 transition hover:text-cyan-100"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to disputes
        </Link>
        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-xs font-medium text-white/75 transition hover:bg-white/[0.08] hover:text-white disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin text-cyan-200" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Main compact summary card */}
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.045] to-white/[0.015] p-4 backdrop-blur-xl sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide ${statusBadgeClass(
                  dispute.status
                )}`}
              >
                {dispute.status === "OPEN" ? (
                  <Clock className="h-3 w-3" />
                ) : (
                  <CheckCircle2 className="h-3 w-3" />
                )}
                {dispute.status}
              </span>
              <span
                className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide ${
                  isInputOpen
                    ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
                    : "border-neutral-500/30 bg-neutral-500/10 text-neutral-300"
                }`}
              >
                Your input: {inputState}
              </span>
              {dispute.escalationLevel && dispute.escalationLevel !== "NONE" && (
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-200">
                  <ShieldAlert className="h-3 w-3" />
                  {dispute.escalationLevel}
                </span>
              )}
            </div>

            <h1 className="mt-2 text-lg font-bold text-white sm:text-xl">
              {dispute.booking?.serviceTitle ?? "Booking Dispute"}
            </h1>
            {dispute.booking?.bookingReference && (
              <p className="mt-0.5 text-xs text-white/50">
                Booking Reference: <span className="font-mono text-white/70">{dispute.booking.bookingReference}</span>
              </p>
            )}
          </div>

          <div className="text-right text-xs text-white/45">
            <p>Opened {dateTime(dispute.createdAt)}</p>
            <p className="mt-0.5">
              Raised by:{" "}
              <span className="text-white/70">
                {dispute.raisedByMe
                  ? "You"
                  : dispute.raisedByRole === "CREATOR"
                  ? "Creator"
                  : "Customer"}
              </span>
            </p>
          </div>
        </div>

        {/* Dispute Reason */}
        <div className="mt-3 rounded-xl border border-white/[0.06] bg-black/20 p-3">
          <p className="text-[11px] font-medium uppercase tracking-wider text-white/45">Dispute Reason</p>
          <p className="mt-1 whitespace-pre-wrap text-xs leading-relaxed text-white/80 sm:text-sm">{dispute.reason}</p>
        </div>

        {/* Finalized Decision (if available) */}
        {dispute.finalDecision && (
          <div className="mt-3 rounded-xl border border-emerald-400/25 bg-emerald-950/20 p-3.5 sm:p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-300">
                Investigation Finalized
              </span>
              <span
                className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${outcomeBadgeClass(
                  dispute.finalDecision.outcome
                )}`}
              >
                Outcome: {dispute.finalDecision.outcome.replace(/_/g, " ")}
              </span>
            </div>
            <p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-emerald-100/90 sm:text-sm">
              {dispute.finalDecision.summary}
            </p>
            <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-white/50">
              <span>
                Financial Review:{" "}
                <strong className="font-semibold text-white/75">
                  {dispute.finalDecision.financialReviewRequired ? "Required" : "Not Required"}
                </strong>
              </span>
              <span>•</span>
              <span>
                Governance Review:{" "}
                <strong className="font-semibold text-white/75">
                  {dispute.finalDecision.governanceReviewRequired ? "Required" : "Not Required"}
                </strong>
              </span>
              <span>•</span>
              <span>Finalized: {dateTime(dispute.finalDecision.finalizedAt)}</span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
