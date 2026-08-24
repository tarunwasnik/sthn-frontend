import { CheckCircle2, Lock } from "lucide-react";
import type { DisputeStatus } from "../types";

interface InvestigationClosedFooterProps {
  disputeStatus: DisputeStatus;
  inputState: "OPEN" | "CLOSED";
}

export default function InvestigationClosedFooter({
  disputeStatus,
  inputState: _inputState,
}: InvestigationClosedFooterProps) {
  const isFinalized = disputeStatus !== "OPEN";

  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.04] to-white/[0.015] p-4 text-center backdrop-blur-xl sm:p-5">
      <div className="flex flex-col items-center justify-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-white/60">
          {isFinalized ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          ) : (
            <Lock className="h-4 w-4 text-amber-400" />
          )}
        </div>
        <div>
          <p className="text-sm font-medium text-white/90">
            {isFinalized
              ? "This dispute is finalized and the investigation is read-only."
              : "Further input for your side has been closed by moderation."}
          </p>
          <p className="mt-1 text-xs text-white/50">
            {isFinalized
              ? "All investigation statements, Admin communications, and submitted evidence are preserved above for your reference."
              : "The investigation is currently under active review. The conversation and evidence history remain accessible above."}
          </p>
        </div>
      </div>
    </div>
  );
}
