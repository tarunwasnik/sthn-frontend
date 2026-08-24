import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileCheck,
  Lock,
  Plus,
  Scale,
  Unlock,
  User,
} from "lucide-react";
import { useState } from "react";
import AdminConfirmDialog from "../../../components/admin/feedback/AdminConfirmDialog";
import type { useAdminDisputes } from "../useAdminDisputes";

interface AdminInvestigationControlPanelProps {
  operations: ReturnType<typeof useAdminDisputes>;
}

const dateTime = (value: string | null | undefined) => {
  if (!value) return "—";
  const date = new Date(value);
  return `${date.toLocaleDateString([], { month: "short", day: "numeric" })} · ${date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
};

export default function AdminInvestigationControlPanel({ operations }: AdminInvestigationControlPanelProps) {
  const data = operations.investigation;
  const [contextExpanded, setContextExpanded] = useState(false);
  const [addFindingOpen, setAddFindingOpen] = useState(false);

  // Finding state
  const [subject, setSubject] = useState<"CUSTOMER" | "CREATOR" | "BOTH">("CUSTOMER");
  const [category, setCategory] = useState("SERVICE_DELIVERY");
  const [conclusion, setConclusion] = useState<"SUPPORTED" | "NOT_SUPPORTED" | "INCONCLUSIVE">("SUPPORTED");
  const [findingText, setFindingText] = useState("");

  // Final Decision state
  const [customerOutcome, setCustomerOutcome] = useState("NO_ADVERSE_FINDING");
  const [creatorOutcome, setCreatorOutcome] = useState("NO_ADVERSE_FINDING");
  const [summaryText, setSummaryText] = useState("");
  const [financialReviewRequired, setFinancialReviewRequired] = useState(false);
  const [governanceReviewRequired, setGovernanceReviewRequired] = useState(false);
  const [confirmFinalize, setConfirmFinalize] = useState(false);

  if (!data) return null;

  const open = data.dispute.status === "OPEN";
  const customerInputState = data.dispute.investigation.customerInput.state;
  const creatorInputState = data.dispute.investigation.creatorInput.state;
  const readyToFinalize = open && customerInputState === "CLOSED" && creatorInputState === "CLOSED";

  const handleAddFinding = async () => {
    if (!findingText.trim() || operations.pending) return;
    const success = await operations.addFinding({
      subject,
      category,
      conclusion,
      summary: findingText.trim(),
    });
    if (success) {
      setFindingText("");
      setAddFindingOpen(false);
    }
  };

  const handleFinalize = async () => {
    if (!summaryText.trim() || operations.pending) return;
    await operations.finalize({
      customerOutcome,
      customerSummary: "Outcome recorded.",
      creatorOutcome,
      creatorSummary: "Outcome recorded.",
      summary: summaryText.trim(),
      financialReviewRequired,
      governanceReviewRequired,
    });
    setConfirmFinalize(false);
  };

  const selectControlClass =
    "mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-1.5 text-xs text-white outline-none focus:border-sky-400";
  const textareaControlClass =
    "mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-950 p-2.5 text-xs text-white placeholder-neutral-500 outline-none focus:border-sky-400";

  return (
    <div className="space-y-4">
      {/* 1. PARTICIPANT RESPONSE CONTROLS */}
      <section className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 shadow-lg">
        <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-neutral-300">
          <Lock className="h-3.5 w-3.5 text-amber-400" />
          <span>Participant Response Controls</span>
        </h2>

        <div className="mt-3 space-y-2.5">
          {/* Customer Responses */}
          <div className="flex items-center justify-between rounded-xl border border-neutral-800 bg-neutral-950/70 p-3">
            <div>
              <p className="text-xs font-semibold text-sky-200">Customer Responses</p>
              <div className="mt-0.5 flex items-center gap-1.5">
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    customerInputState === "OPEN"
                      ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                      : "bg-neutral-800 text-neutral-400 border border-neutral-700"
                  }`}
                >
                  {customerInputState === "OPEN" ? "Can respond" : "Responses closed"}
                </span>
                {data.dispute.investigation.customerInput.changedAt && (
                  <span className="text-[10px] text-neutral-500">
                    {dateTime(data.dispute.investigation.customerInput.changedAt)}
                  </span>
                )}
              </div>
            </div>

            {open && (
              <button
                type="button"
                disabled={operations.pending}
                onClick={() =>
                  void operations.setInput("CUSTOMER", customerInputState === "OPEN" ? "CLOSED" : "OPEN")
                }
                className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium transition disabled:opacity-50 ${
                  customerInputState === "OPEN"
                    ? "border-amber-500/30 bg-amber-500/10 text-amber-200 hover:bg-amber-500/20"
                    : "border-emerald-500/30 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20"
                }`}
              >
                {customerInputState === "OPEN" ? (
                  <>
                    <Lock className="h-3 w-3" />
                    Close responses
                  </>
                ) : (
                  <>
                    <Unlock className="h-3 w-3" />
                    Reopen
                  </>
                )}
              </button>
            )}
          </div>

          {/* Creator Responses */}
          <div className="flex items-center justify-between rounded-xl border border-neutral-800 bg-neutral-950/70 p-3">
            <div>
              <p className="text-xs font-semibold text-purple-200">Creator Responses</p>
              <div className="mt-0.5 flex items-center gap-1.5">
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    creatorInputState === "OPEN"
                      ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                      : "bg-neutral-800 text-neutral-400 border border-neutral-700"
                  }`}
                >
                  {creatorInputState === "OPEN" ? "Can respond" : "Responses closed"}
                </span>
                {data.dispute.investigation.creatorInput.changedAt && (
                  <span className="text-[10px] text-neutral-500">
                    {dateTime(data.dispute.investigation.creatorInput.changedAt)}
                  </span>
                )}
              </div>
            </div>

            {open && (
              <button
                type="button"
                disabled={operations.pending}
                onClick={() =>
                  void operations.setInput("CREATOR", creatorInputState === "OPEN" ? "CLOSED" : "OPEN")
                }
                className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium transition disabled:opacity-50 ${
                  creatorInputState === "OPEN"
                    ? "border-amber-500/30 bg-amber-500/10 text-amber-200 hover:bg-amber-500/20"
                    : "border-emerald-500/30 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20"
                }`}
              >
                {creatorInputState === "OPEN" ? (
                  <>
                    <Lock className="h-3 w-3" />
                    Close responses
                  </>
                ) : (
                  <>
                    <Unlock className="h-3 w-3" />
                    Reopen
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 2. CASE CONTEXT / VERIFICATION CONTEXT */}
      <section className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-neutral-300">
            <User className="h-3.5 w-3.5 text-sky-400" />
            <span>Case Context</span>
          </h2>
          <button
            type="button"
            onClick={() => setContextExpanded((prev) => !prev)}
            className="inline-flex items-center gap-1 text-[11px] text-sky-300 transition hover:text-sky-200"
          >
            {contextExpanded ? (
              <>
                <span>Collapse</span>
                <ChevronUp className="h-3 w-3" />
              </>
            ) : (
              <>
                <span>Details</span>
                <ChevronDown className="h-3 w-3" />
              </>
            )}
          </button>
        </div>

        {/* Quick Signal Badges */}
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
          <div className="rounded-lg border border-neutral-800 bg-neutral-950/60 p-2 text-center">
            <p className="text-[10px] uppercase text-neutral-500">Chat</p>
            <p className="mt-0.5 font-semibold text-white">{data.context.chat.messages.length} msgs</p>
          </div>
          <div className="rounded-lg border border-neutral-800 bg-neutral-950/60 p-2 text-center">
            <p className="text-[10px] uppercase text-neutral-500">Reviews</p>
            <p className="mt-0.5 font-semibold text-white">{data.context.reviews.length}</p>
          </div>
          <div className="rounded-lg border border-neutral-800 bg-neutral-950/60 p-2 text-center">
            <p className="text-[10px] uppercase text-neutral-500">Moderation</p>
            <p className="mt-0.5 font-semibold text-white">{data.context.moderation.length}</p>
          </div>
        </div>

        {/* Expanded Details */}
        {contextExpanded && (
          <div className="mt-3 space-y-2.5 border-t border-neutral-800 pt-3 text-xs text-neutral-300">
            {/* Customer Details */}
            <div className="rounded-lg bg-neutral-950/80 p-2.5">
              <p className="font-semibold text-sky-200">Customer Identity</p>
              <p className="mt-1 text-white">{data.context.customer?.displayName ?? "Unavailable"}</p>
              <p className="text-[11px] text-neutral-400">
                Governance: <span className="text-white">{data.context.customer?.governanceState ?? "—"}</span> • Abuse
                Score: <span className="text-white">{data.context.customer?.abuseScore ?? 0}</span>
              </p>
              {data.context.customer?.userCooldownUntil && (
                <p className="text-[11px] text-amber-300">
                  User Cooldown: {dateTime(data.context.customer.userCooldownUntil)}
                </p>
              )}
            </div>

            {/* Creator Details */}
            <div className="rounded-lg bg-neutral-950/80 p-2.5">
              <p className="font-semibold text-purple-200">Creator Identity</p>
              <p className="mt-1 text-white">{data.context.creator?.displayName ?? "Unavailable"}</p>
              <p className="text-[11px] text-neutral-400">
                Governance: <span className="text-white">{data.context.creator?.governanceState ?? "—"}</span> • Rating:{" "}
                <span className="text-white">
                  {data.context.creator?.creatorProfile?.rating ?? "—"} (
                  {data.context.creator?.creatorProfile?.reviewCount ?? 0} reviews)
                </span>
              </p>
              {data.context.creator?.creatorProfile?.location && (
                <p className="text-[11px] text-neutral-400">
                  Location: <span className="text-white">{data.context.creator.creatorProfile.location}</span>
                </p>
              )}
            </div>

            {/* Booking Snapshot */}
            {data.context.booking && (
              <div className="rounded-lg bg-neutral-950/80 p-2.5">
                <p className="font-semibold text-neutral-200">Service Snapshot</p>
                <p className="mt-1 text-white">
                  {data.context.booking.serviceSnapshot
                    ? data.context.booking.serviceSnapshot.title
                    : data.context.booking.serviceTitle}
                </p>
                <p className="text-[11px] text-neutral-400">
                  Status: {data.context.booking.status} • Duration: {data.context.booking.durationMinutes}m • Price:{" "}
                  {data.context.booking.price} {data.context.booking.currency}
                </p>
              </div>
            )}
          </div>
        )}
      </section>

      {/* 3. INVESTIGATION NOTES & FINDINGS */}
      <section className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-neutral-300">
            <FileCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span>Investigation Notes & Findings</span>
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-neutral-500">{data.findings.length} recorded</span>
            {open && !data.finalDecision && (
              <button
                type="button"
                onClick={() => setAddFindingOpen((prev) => !prev)}
                className="inline-flex items-center gap-0.5 rounded-md border border-neutral-700 bg-neutral-800 px-2 py-0.5 text-[11px] font-medium text-sky-200 transition hover:bg-neutral-700"
              >
                <Plus className="h-3 w-3" />
                <span>Add</span>
              </button>
            )}
          </div>
        </div>

        {/* Existing Findings List */}
        {data.findings.length > 0 ? (
          <div className="mt-3 space-y-2">
            {data.findings.map((item) => (
              <div key={item.findingReference} className="rounded-xl border border-neutral-800 bg-neutral-950/70 p-2.5">
                <div className="flex flex-wrap items-center justify-between gap-1 text-[11px]">
                  <span className="font-semibold text-sky-200">
                    {item.subject} • {item.category}
                  </span>
                  <span
                    className={`font-semibold ${
                      item.conclusion === "SUPPORTED"
                        ? "text-emerald-300"
                        : item.conclusion === "NOT_SUPPORTED"
                        ? "text-rose-300"
                        : "text-amber-300"
                    }`}
                  >
                    {item.conclusion}
                  </span>
                </div>
                <p className="mt-1 text-xs text-neutral-200">{item.summary}</p>
                <span className="mt-1 block text-right text-[10px] text-neutral-500">{dateTime(item.createdAt)}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-xs text-neutral-500">No findings recorded yet.</p>
        )}

        {/* Add Finding Form (Collapsible / Modal-like) */}
        {open && !data.finalDecision && addFindingOpen && (
          <fieldset className="mt-3 rounded-xl border border-sky-500/30 bg-sky-950/20 p-3">
            <legend className="px-1 text-xs font-semibold text-sky-200">Record Internal Finding</legend>

            <div className="space-y-2">
              <div>
                <label className="text-[11px] text-neutral-400">Subject</label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value as typeof subject)}
                  className={selectControlClass}
                >
                  <option value="CUSTOMER">CUSTOMER</option>
                  <option value="CREATOR">CREATOR</option>
                  <option value="BOTH">BOTH</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-neutral-400">Category</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className={selectControlClass}>
                  <option value="SERVICE_DELIVERY">SERVICE_DELIVERY</option>
                  <option value="SERVICE_SCOPE">SERVICE_SCOPE</option>
                  <option value="PARTICIPANT_CONDUCT">PARTICIPANT_CONDUCT</option>
                  <option value="SAFETY">SAFETY</option>
                  <option value="PRIVACY_RECORDING">PRIVACY_RECORDING</option>
                  <option value="ADDITIONAL_PARTICIPANT">ADDITIONAL_PARTICIPANT</option>
                  <option value="LOCATION">LOCATION</option>
                  <option value="EVIDENCE_INTEGRITY">EVIDENCE_INTEGRITY</option>
                  <option value="PLATFORM_POLICY">PLATFORM_POLICY</option>
                  <option value="OTHER">OTHER</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-neutral-400">Conclusion</label>
                <select
                  value={conclusion}
                  onChange={(e) => setConclusion(e.target.value as typeof conclusion)}
                  className={selectControlClass}
                >
                  <option value="SUPPORTED">SUPPORTED</option>
                  <option value="NOT_SUPPORTED">NOT_SUPPORTED</option>
                  <option value="INCONCLUSIVE">INCONCLUSIVE</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-neutral-400">Finding Summary</label>
                <textarea
                  value={findingText}
                  maxLength={2000}
                  onChange={(e) => setFindingText(e.target.value)}
                  rows={2}
                  placeholder="Concise, objective finding summary..."
                  className={textareaControlClass}
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setAddFindingOpen(false)}
                  className="flex-1 rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-xs text-neutral-300 transition hover:bg-neutral-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!findingText.trim() || operations.pending}
                  onClick={() => void handleAddFinding()}
                  className="flex-1 rounded-lg bg-sky-400/20 border border-sky-400/30 px-3 py-1.5 text-xs font-semibold text-sky-200 transition hover:bg-sky-400/30 disabled:opacity-40"
                >
                  {operations.pending ? "Adding..." : "Save finding"}
                </button>
              </div>
            </div>
          </fieldset>
        )}
      </section>

      {/* 4. FINAL INVESTIGATION DECISION */}
      <section className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 shadow-lg">
        <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-neutral-300">
          <Scale className="h-3.5 w-3.5 text-amber-400" />
          <span>Final Investigation Decision</span>
        </h2>

        {open && !data.finalDecision ? (
          <div className="mt-3 space-y-3">
            {/* Step Readiness Check */}
            <div className="rounded-xl border border-neutral-800 bg-neutral-950/70 p-2.5 text-xs">
              <p className="font-semibold text-neutral-300">Finalization Requirements:</p>
              <div className="mt-1.5 flex flex-wrap gap-2 text-[11px]">
                <span
                  className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 ${
                    customerInputState === "CLOSED"
                      ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                      : "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                  }`}
                >
                  Customer responses: {customerInputState}
                </span>
                <span
                  className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 ${
                    creatorInputState === "CLOSED"
                      ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                      : "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                  }`}
                >
                  Creator responses: {creatorInputState}
                </span>
              </div>
            </div>

            {!readyToFinalize && (
              <div className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-2.5 text-xs text-amber-200">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
                <span>Close both participant input branches above before finalizing.</span>
              </div>
            )}

            <div>
              <label className="text-[11px] text-neutral-400">Customer Outcome</label>
              <select
                value={customerOutcome}
                onChange={(e) => setCustomerOutcome(e.target.value)}
                disabled={!readyToFinalize || operations.pending}
                className={selectControlClass}
              >
                <option value="NO_ADVERSE_FINDING">NO_ADVERSE_FINDING</option>
                <option value="ADVERSE_FINDING">ADVERSE_FINDING</option>
                <option value="MIXED">MIXED</option>
                <option value="INCONCLUSIVE">INCONCLUSIVE</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] text-neutral-400">Creator Outcome</label>
              <select
                value={creatorOutcome}
                onChange={(e) => setCreatorOutcome(e.target.value)}
                disabled={!readyToFinalize || operations.pending}
                className={selectControlClass}
              >
                <option value="NO_ADVERSE_FINDING">NO_ADVERSE_FINDING</option>
                <option value="ADVERSE_FINDING">ADVERSE_FINDING</option>
                <option value="MIXED">MIXED</option>
                <option value="INCONCLUSIVE">INCONCLUSIVE</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] text-neutral-400">Participant-Safe Final Summary</label>
              <textarea
                value={summaryText}
                maxLength={4000}
                onChange={(e) => setSummaryText(e.target.value)}
                disabled={!readyToFinalize || operations.pending}
                rows={3}
                placeholder="Authoritative final summary visible to participants..."
                className={textareaControlClass}
              />
            </div>

            <div className="space-y-2 pt-1 text-xs text-neutral-300">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={financialReviewRequired}
                  onChange={(e) => setFinancialReviewRequired(e.target.checked)}
                  disabled={!readyToFinalize || operations.pending}
                  className="mt-0.5 rounded border-neutral-700"
                />
                <span>Further financial resolution review is required. No money moves now.</span>
              </label>

              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={governanceReviewRequired}
                  onChange={(e) => setGovernanceReviewRequired(e.target.checked)}
                  disabled={!readyToFinalize || operations.pending}
                  className="mt-0.5 rounded border-neutral-700"
                />
                <span>Further Governance review is required. No action occurs now.</span>
              </label>
            </div>

            <button
              type="button"
              disabled={!readyToFinalize || !summaryText.trim() || operations.pending}
              onClick={() => setConfirmFinalize(true)}
              className="w-full rounded-xl bg-amber-300 px-4 py-2.5 text-xs font-bold text-neutral-950 transition hover:bg-amber-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Finalize investigation
            </button>
          </div>
        ) : data.finalDecision ? (
          <div className="mt-3 rounded-xl border border-emerald-500/30 bg-emerald-950/30 p-3 text-xs text-neutral-200 space-y-2">
            <div className="flex items-center gap-1.5 text-emerald-300 font-semibold">
              <CheckCircle2 className="h-4 w-4" />
              <span>Investigation Decision Recorded</span>
            </div>
            <p>
              <strong className="text-white">Customer:</strong> {data.finalDecision.customerOutcome}
            </p>
            <p>
              <strong className="text-white">Creator:</strong> {data.finalDecision.creatorOutcome}
            </p>
            <p className="whitespace-pre-wrap border-t border-neutral-800 pt-2 text-neutral-300">
              {data.finalDecision.summary}
            </p>
            <p className="text-[11px] text-neutral-400">Finalized: {dateTime(data.finalDecision.finalizedAt)}</p>
          </div>
        ) : (
          <p className="mt-2 text-xs text-neutral-500">Dispute is not in an active open state.</p>
        )}

        <AdminConfirmDialog
          open={confirmFinalize}
          title="Finalize investigation"
          description="Findings and outcomes become immutable. Further investigation input ends. This does not issue refunds, payments, or Governance actions."
          confirmText="Finalize"
          loading={operations.pending}
          onCancel={() => setConfirmFinalize(false)}
          onConfirm={() => void handleFinalize()}
        />
      </section>
    </div>
  );
}
