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
      return "border-theme-warning bg-theme-warning-tint text-theme-warning";
    case "RESOLVED":
      return "border-theme-success bg-theme-success-tint text-theme-success";
    case "REJECTED":
      return "border-theme-danger bg-theme-danger-tint text-theme-danger";
    default:
      return "border-theme-border bg-theme-inset text-theme-muted";
  }
};

const outcomeBadgeClass = (outcome: string) => {
  switch (outcome) {
    case "NO_ADVERSE_FINDING":
      return "border-theme-success bg-theme-success-tint text-theme-success";
    case "ADVERSE_FINDING":
      return "border-theme-danger bg-theme-danger-tint text-theme-danger";
    case "MIXED":
      return "border-theme-warning bg-theme-warning-tint text-theme-warning";
    case "INCONCLUSIVE":
    default:
      return "border-theme-border bg-theme-inset text-theme-text";
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
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-theme-accent transition hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to disputes
        </Link>
        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-1.5 rounded-[var(--radius-control)] border border-theme-border bg-theme-inset px-2.5 py-1.5 text-xs font-medium text-theme-text transition hover:bg-theme-surface-raised disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin text-theme-accent" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Main compact summary card */}
      <div className="rounded-[var(--radius-card)] border border-theme-border bg-theme-surface p-4 sm:p-5">
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
                    ? "border-theme-success bg-theme-success-tint text-theme-success"
                    : "border-theme-border bg-theme-inset text-theme-muted"
                }`}
              >
                Your input: {inputState}
              </span>
              {dispute.escalationLevel && dispute.escalationLevel !== "NONE" && (
                <span className="inline-flex items-center gap-1 rounded-full border border-theme-warning bg-theme-warning-tint px-2 py-0.5 text-[11px] font-medium text-theme-warning">
                  <ShieldAlert className="h-3 w-3" />
                  {dispute.escalationLevel}
                </span>
              )}
            </div>

            <h1 className="mt-2 text-lg font-bold text-theme-text sm:text-xl">
              {dispute.booking?.serviceTitle ?? "Booking Dispute"}
            </h1>
            {dispute.booking?.bookingReference && (
              <p className="mt-0.5 text-xs text-theme-muted">
                Booking Reference: <span className="font-mono text-theme-text">{dispute.booking.bookingReference}</span>
              </p>
            )}
          </div>

          <div className="text-right text-xs text-theme-muted">
            <p>Opened {dateTime(dispute.createdAt)}</p>
            <p className="mt-0.5">
              Raised by:{" "}
              <span className="text-theme-text">
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
        <div className="mt-3 rounded-[var(--radius-control)] border border-theme-border bg-theme-inset p-3">
          <p className="text-[11px] font-medium uppercase tracking-wider text-theme-muted">Dispute Reason</p>
          <p className="mt-1 whitespace-pre-wrap text-xs leading-relaxed text-theme-text sm:text-sm">{dispute.reason}</p>
        </div>

        {/* Finalized Decision (if available) */}
        {dispute.finalDecision && (
          <div className="mt-3 rounded-[var(--radius-control)] border border-theme-success bg-theme-success-tint p-3.5 sm:p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-theme-success">
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
            <p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-theme-text sm:text-sm">
              {dispute.finalDecision.summary}
            </p>
            <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-theme-muted">
              <span>
                Financial Review:{" "}
                <strong className="font-semibold text-theme-text">
                  {dispute.finalDecision.financialReviewRequired ? "Required" : "Not Required"}
                </strong>
              </span>
              <span>•</span>
              <span>
                Governance Review:{" "}
                <strong className="font-semibold text-theme-text">
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
