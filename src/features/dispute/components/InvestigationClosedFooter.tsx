import { CheckCircle2, Lock } from "lucide-react";
import type { DisputeStatus } from "../types";

interface InvestigationClosedFooterProps {
  disputeStatus: DisputeStatus;
  inputState: "OPEN" | "CLOSED";
}

export default function InvestigationClosedFooter({
  disputeStatus,
}: InvestigationClosedFooterProps) {
  const isFinalized = disputeStatus !== "OPEN";

  return (
    <div className="rounded-[var(--radius-card)] border border-theme-border bg-theme-surface p-4 text-center sm:p-5">
      <div className="flex flex-col items-center justify-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full border border-theme-border bg-theme-inset text-theme-muted">
          {isFinalized ? (
            <CheckCircle2 className="h-4 w-4 text-theme-success" />
          ) : (
            <Lock className="h-4 w-4 text-theme-warning" />
          )}
        </div>
        <div>
          <p className="text-sm font-medium text-theme-text">
            {isFinalized
              ? "This dispute is finalized and the investigation is read-only."
              : "Further input for your side has been closed by moderation."}
          </p>
          <p className="mt-1 text-xs text-theme-muted">
            {isFinalized
              ? "All investigation statements, Admin communications, and submitted evidence are preserved above for your reference."
              : "The investigation is currently under active review. The conversation and evidence history remain accessible above."}
          </p>
        </div>
      </div>
    </div>
  );
}
