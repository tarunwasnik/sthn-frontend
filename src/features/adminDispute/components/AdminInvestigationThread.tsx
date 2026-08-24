import {
  CheckCircle2,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  MessageSquare,
  Share2,
  Shield,
  User,
} from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import type {
  AdminDisputeInvestigation,
  AdminInvestigationEvidence,
  AdminInvestigationSubmission,
} from "../types";

export type AdminTimelineItem =
  | {
      id: string;
      createdAt: string;
      type: "ADMIN_REQUEST";
      target: "CUSTOMER" | "CREATOR" | "BOTH";
      text: string;
      requestReference: string;
    }
  | {
      id: string;
      createdAt: string;
      type: "SUBMISSION";
      branch: "CUSTOMER" | "CREATOR";
      kind: string;
      text: string | null;
      evidence: AdminInvestigationSubmission["evidence"];
      submissionReference: string;
      sharedWithCounterpartyAt: string | null;
    }
  | {
      id: string;
      createdAt: string;
      type: "DIRECT_EVIDENCE";
      evidence: AdminInvestigationEvidence;
    }
  | {
      id: string;
      createdAt: string;
      type: "ADMIN_EVIDENCE";
      evidence: AdminInvestigationEvidence;
    };

interface AdminInvestigationThreadProps {
  activeTab: "CUSTOMER" | "CREATOR" | "ALL";
  customerBranch: AdminInvestigationSubmission[];
  creatorBranch: AdminInvestigationSubmission[];
  customerAdminRequests: Array<{ requestReference: string; target: "CUSTOMER"; text: string; createdAt: string }>;
  creatorAdminRequests: Array<{ requestReference: string; target: "CREATOR"; text: string; createdAt: string }>;
  sharedAdminRequests: Array<{ requestReference: string; target: "BOTH"; text: string; createdAt: string }>;
  directEvidence: AdminInvestigationEvidence[];
  adminEvidence: AdminInvestigationEvidence[];
  finalDecision: AdminDisputeInvestigation["finalDecision"];
  mutable: boolean;
  onShareSubmission?: (submissionReference: string) => Promise<unknown>;
}

const dateTime = (value: string | null | undefined) => {
  if (!value) return "—";
  const date = new Date(value);
  return `${date.toLocaleDateString([], { month: "short", day: "numeric" })} · ${date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
};

function formatFileSize(bytes?: number) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function InlineEvidenceCard({
  evidence,
}: {
  evidence: {
    evidenceReference: string;
    type: string;
    url: string;
    fileName: string;
    fileSize?: number;
    caption?: string | null;
    note?: string | null;
  };
}) {
  const caption = evidence.caption || evidence.note;
  const isImage = evidence.type === "IMAGE" || evidence.type === "image";

  if (isImage) {
    return (
      <div className="mt-2 space-y-1.5">
        <a
          href={evidence.url}
          target="_blank"
          rel="noreferrer"
          className="group block overflow-hidden rounded-xl border border-neutral-700/60 bg-black/40 transition hover:border-sky-400/50"
        >
          <div className="relative max-h-60 w-full overflow-hidden bg-black/30">
            <img
              src={evidence.url}
              alt={caption ?? evidence.fileName}
              className="h-full max-h-60 w-full object-contain transition duration-200 group-hover:scale-[1.02]"
              loading="lazy"
            />
          </div>
          <div className="flex items-center justify-between gap-2 border-t border-neutral-800 bg-neutral-900/50 px-3 py-1.5 text-[11px] text-sky-200 group-hover:text-sky-100">
            <span className="flex items-center gap-1.5 truncate">
              <ImageIcon className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{evidence.fileName}</span>
            </span>
            <span className="shrink-0 text-neutral-400">
              {evidence.fileSize ? formatFileSize(evidence.fileSize) : "View"}
            </span>
          </div>
        </a>
        {caption && <p className="px-1 text-xs text-neutral-300 italic">{caption}</p>}
      </div>
    );
  }

  return (
    <div className="mt-2 space-y-1">
      <a
        href={evidence.url}
        target="_blank"
        rel="noreferrer"
        className="flex items-center gap-3 rounded-xl border border-neutral-700/60 bg-neutral-950/60 p-2.5 transition hover:border-sky-400/50 hover:bg-neutral-900/60"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-500/15 text-sky-300">
          <FileText className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-white">{evidence.fileName}</p>
          <p className="text-[11px] text-neutral-400">
            Document {evidence.fileSize ? `• ${formatFileSize(evidence.fileSize)}` : ""}
          </p>
        </div>
        <ExternalLink className="h-3.5 w-3.5 shrink-0 text-sky-300" />
      </a>
      {caption && <p className="px-1 text-xs text-neutral-300 italic">{caption}</p>}
    </div>
  );
}

export default function AdminInvestigationThread({
  activeTab,
  customerBranch,
  creatorBranch,
  customerAdminRequests,
  creatorAdminRequests,
  sharedAdminRequests,
  directEvidence,
  adminEvidence,
  finalDecision,
  mutable,
  onShareSubmission,
}: AdminInvestigationThreadProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const items = useMemo<AdminTimelineItem[]>(() => {
    const list: AdminTimelineItem[] = [];

    // 1. Admin Requests (Deduplicated by requestReference)
    const seenRequests = new Set<string>();

    let requestsToInclude: Array<{
      requestReference: string;
      target: "CUSTOMER" | "CREATOR" | "BOTH";
      text: string;
      createdAt: string;
    }> = [];

    if (activeTab === "CUSTOMER") {
      requestsToInclude = [...customerAdminRequests, ...sharedAdminRequests];
    } else if (activeTab === "CREATOR") {
      requestsToInclude = [...creatorAdminRequests, ...sharedAdminRequests];
    } else {
      // ALL ACTIVITY
      requestsToInclude = [
        ...customerAdminRequests,
        ...creatorAdminRequests,
        ...sharedAdminRequests,
      ];
    }

    for (const req of requestsToInclude) {
      if (!seenRequests.has(req.requestReference)) {
        seenRequests.add(req.requestReference);
        list.push({
          id: `req-${req.requestReference}`,
          createdAt: req.createdAt,
          type: "ADMIN_REQUEST",
          target: req.target,
          text: req.text,
          requestReference: req.requestReference,
        });
      }
    }

    // 2. Submissions
    const includeCustomerSubmissions = activeTab === "CUSTOMER" || activeTab === "ALL";
    const includeCreatorSubmissions = activeTab === "CREATOR" || activeTab === "ALL";

    if (includeCustomerSubmissions) {
      for (const sub of customerBranch) {
        list.push({
          id: `sub-customer-${sub.submissionReference}`,
          createdAt: sub.createdAt,
          type: "SUBMISSION",
          branch: "CUSTOMER",
          kind: sub.kind,
          text: sub.text,
          evidence: sub.evidence,
          submissionReference: sub.submissionReference,
          sharedWithCounterpartyAt: sub.sharedWithCounterpartyAt,
        });
      }
    }

    if (includeCreatorSubmissions) {
      for (const sub of creatorBranch) {
        list.push({
          id: `sub-creator-${sub.submissionReference}`,
          createdAt: sub.createdAt,
          type: "SUBMISSION",
          branch: "CREATOR",
          kind: sub.kind,
          text: sub.text,
          evidence: sub.evidence,
          submissionReference: sub.submissionReference,
          sharedWithCounterpartyAt: sub.sharedWithCounterpartyAt,
        });
      }
    }

    // Track evidenceReferences inside submissions to avoid duplicate rendering
    const embeddedEvidenceIds = new Set<string>();
    const relevantSubmissions = [
      ...(includeCustomerSubmissions ? customerBranch : []),
      ...(includeCreatorSubmissions ? creatorBranch : []),
    ];
    for (const sub of relevantSubmissions) {
      for (const evi of sub.evidence) {
        if (evi.evidenceReference) {
          embeddedEvidenceIds.add(evi.evidenceReference);
        }
      }
    }

    // 3. Direct Evidence (Customer / Creator direct uploads)
    for (const evi of directEvidence) {
      const matchTab =
        activeTab === "ALL" ||
        (activeTab === "CUSTOMER" && evi.source === "CUSTOMER") ||
        (activeTab === "CREATOR" && evi.source === "CREATOR");

      if (matchTab && !embeddedEvidenceIds.has(evi.evidenceReference)) {
        list.push({
          id: `evi-direct-${evi.evidenceReference}`,
          createdAt: evi.createdAt,
          type: "DIRECT_EVIDENCE",
          evidence: evi,
        });
      }
    }

    // 4. Admin Evidence
    for (const evi of adminEvidence) {
      const matchAudience =
        activeTab === "ALL" ||
        (activeTab === "CUSTOMER" && (evi.audience === "CUSTOMER" || evi.audience === "BOTH")) ||
        (activeTab === "CREATOR" && (evi.audience === "CREATOR" || evi.audience === "BOTH"));

      if (matchAudience) {
        list.push({
          id: `evi-admin-${evi.evidenceReference}`,
          createdAt: evi.createdAt,
          type: "ADMIN_EVIDENCE",
          evidence: evi,
        });
      }
    }

    // Chronological sort: createdAt ASC
    return list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [
    activeTab,
    customerBranch,
    creatorBranch,
    customerAdminRequests,
    creatorAdminRequests,
    sharedAdminRequests,
    directEvidence,
    adminEvidence,
  ]);

  // Auto-scroll to newest message on tab change and when items length changes
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [activeTab, items.length]);

  if (items.length === 0 && (!finalDecision || activeTab !== "ALL")) {
    const tabName =
      activeTab === "CUSTOMER" ? "Customer" : activeTab === "CREATOR" ? "Creator" : "investigation";
    return (
      <div className="flex h-[450px] flex-col items-center justify-center rounded-2xl border border-neutral-800 bg-neutral-900/30 p-8 text-center">
        <MessageSquare className="h-8 w-8 text-neutral-600" />
        <p className="mt-2 text-sm font-medium text-neutral-400">
          No {tabName} conversation activity recorded yet.
        </p>
        <p className="mt-1 text-xs text-neutral-500">
          {activeTab !== "ALL"
            ? `Use the composer below to message or request information from the ${tabName.toLowerCase()}.`
            : "Investigation activities from all branches will appear here chronologically."}
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="max-h-[65vh] min-h-[420px] overflow-y-auto space-y-4 rounded-2xl border border-neutral-800 bg-neutral-900/30 p-4 sm:p-5 pr-2 sm:pr-3"
    >
      {items.map((entry) => {
        // ADMIN REQUEST (ADMIN → CUSTOMER / CREATOR / BOTH)
        if (entry.type === "ADMIN_REQUEST") {
          const targetLabel =
            entry.target === "BOTH"
              ? "ADMIN → BOTH"
              : `ADMIN → ${entry.target}`;

          const targetClass =
            entry.target === "CUSTOMER"
              ? "border-sky-500/30 bg-sky-500/10 text-sky-200"
              : entry.target === "CREATOR"
              ? "border-purple-500/30 bg-purple-500/10 text-purple-200"
              : "border-amber-500/30 bg-amber-500/10 text-amber-200";

          // In dedicated views (Customer or Creator tab), Admin messages align on Right side
          // In All Activity view, Admin messages align on Left side with clear admin badge
          const isRightAligned = activeTab === "CUSTOMER" || activeTab === "CREATOR";

          return (
            <div key={entry.id} className={`flex ${isRightAligned ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[92%] rounded-2xl p-4 text-white shadow-lg md:max-w-[80%] ${
                  isRightAligned
                    ? "rounded-tr-sm border border-neutral-700/80 bg-gradient-to-br from-neutral-800/90 to-neutral-900"
                    : "rounded-tl-sm border border-neutral-700/80 bg-gradient-to-br from-neutral-800/90 to-neutral-900"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <Shield className="h-3.5 w-3.5 text-neutral-300" />
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wider ${targetClass}`}
                    >
                      {targetLabel}
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-neutral-500">{entry.requestReference}</span>
                </div>

                <p className="mt-2.5 whitespace-pre-wrap text-sm leading-relaxed text-neutral-100">{entry.text}</p>
                <div className="mt-2 text-right text-[10px] text-neutral-400">{dateTime(entry.createdAt)}</div>
              </div>
            </div>
          );
        }

        // SUBMISSION (CUSTOMER OR CREATOR)
        if (entry.type === "SUBMISSION") {
          const isCustomer = entry.branch === "CUSTOMER";
          const branchBadge = isCustomer ? "CUSTOMER" : "CREATOR";
          const badgeClass = isCustomer
            ? "border-sky-400/30 bg-sky-400/10 text-sky-200"
            : "border-purple-400/30 bg-purple-400/10 text-purple-200";

          // Participant messages align on Left side
          return (
            <div key={entry.id} className="flex justify-start">
              <div
                className={`max-w-[92%] rounded-2xl rounded-tl-sm p-4 text-white shadow-lg md:max-w-[80%] ${
                  isCustomer
                    ? "border border-sky-400/25 bg-gradient-to-br from-sky-500/10 to-sky-500/5"
                    : "border border-purple-400/25 bg-gradient-to-br from-purple-500/10 to-purple-500/5"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <User className={`h-3.5 w-3.5 ${isCustomer ? "text-sky-300" : "text-purple-300"}`} />
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wider ${badgeClass}`}
                    >
                      {branchBadge} · {entry.kind.toLowerCase()}
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-neutral-500">{entry.submissionReference}</span>
                </div>

                {entry.text && (
                  <p className="mt-2.5 whitespace-pre-wrap text-sm leading-relaxed text-neutral-100">{entry.text}</p>
                )}

                {entry.evidence && entry.evidence.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {entry.evidence.map((evi) => (
                      <InlineEvidenceCard key={evi.evidenceReference} evidence={evi} />
                    ))}
                  </div>
                )}

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-neutral-800/80 pt-2 text-[10px]">
                  <div>
                    {entry.sharedWithCounterpartyAt ? (
                      <span className="text-emerald-400 font-medium">
                        Shared with counterparty ({dateTime(entry.sharedWithCounterpartyAt)})
                      </span>
                    ) : (
                      mutable &&
                      entry.evidence.length === 0 &&
                      onShareSubmission && (
                        <button
                          type="button"
                          onClick={() => void onShareSubmission(entry.submissionReference)}
                          className="inline-flex items-center gap-1 text-sky-300 transition hover:text-sky-200 underline"
                        >
                          <Share2 className="h-3 w-3" />
                          Share statement with counterparty
                        </button>
                      )
                    )}
                  </div>
                  <span className="text-neutral-500">{dateTime(entry.createdAt)}</span>
                </div>
              </div>
            </div>
          );
        }

        // DIRECT EVIDENCE (CUSTOMER OR CREATOR)
        if (entry.type === "DIRECT_EVIDENCE") {
          const isCustomer = entry.evidence.source === "CUSTOMER";
          const sourceBadge = isCustomer ? "CUSTOMER EVIDENCE" : "CREATOR EVIDENCE";
          const badgeClass = isCustomer
            ? "border-sky-400/30 bg-sky-400/10 text-sky-200"
            : "border-purple-400/30 bg-purple-400/10 text-purple-200";

          // Participant evidence aligns on Left side
          return (
            <div key={entry.id} className="flex justify-start">
              <div
                className={`max-w-[92%] rounded-2xl rounded-tl-sm p-4 text-white shadow-lg md:max-w-[80%] ${
                  isCustomer
                    ? "border border-sky-400/25 bg-gradient-to-br from-sky-500/10 to-sky-500/5"
                    : "border border-purple-400/25 bg-gradient-to-br from-purple-500/10 to-purple-500/5"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wider ${badgeClass}`}
                  >
                    {sourceBadge}
                  </span>
                  <span className="font-mono text-[10px] text-neutral-500">{entry.evidence.evidenceReference}</span>
                </div>

                <InlineEvidenceCard evidence={entry.evidence} />

                <div className="mt-2 text-right text-[10px] text-neutral-500">
                  {dateTime(entry.evidence.createdAt)}
                </div>
              </div>
            </div>
          );
        }

        // ADMIN EVIDENCE
        if (entry.type === "ADMIN_EVIDENCE") {
          const audienceText = entry.evidence.audience
            ? `AUDIENCE: ${entry.evidence.audience}`
            : "AUDIENCE: ADMIN_ONLY";

          const isRightAligned = activeTab === "CUSTOMER" || activeTab === "CREATOR";

          return (
            <div key={entry.id} className={`flex ${isRightAligned ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[92%] rounded-2xl p-4 text-white shadow-lg md:max-w-[80%] ${
                  isRightAligned
                    ? "rounded-tr-sm border border-neutral-700/80 bg-gradient-to-br from-neutral-800/90 to-neutral-900"
                    : "rounded-tl-sm border border-neutral-700/80 bg-gradient-to-br from-neutral-800/90 to-neutral-900"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <Shield className="h-3.5 w-3.5 text-neutral-300" />
                    <span className="rounded-full border border-neutral-700 bg-neutral-800 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-neutral-200">
                      ADMIN EVIDENCE
                    </span>
                    <span className="rounded-full border border-neutral-700 bg-neutral-800 px-2 py-0.5 text-[10px] font-medium text-neutral-400">
                      {audienceText}
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-neutral-500">{entry.evidence.evidenceReference}</span>
                </div>

                <InlineEvidenceCard evidence={entry.evidence} />

                <div className="mt-2 text-right text-[10px] text-neutral-400">
                  {dateTime(entry.evidence.createdAt)}
                </div>
              </div>
            </div>
          );
        }

        return null;
      })}

      {/* Terminal Outcome Card if Finalized (in ALL ACTIVITY view) */}
      {finalDecision && activeTab === "ALL" && (
        <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/40 to-emerald-950/20 p-5 text-white shadow-xl">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-300">
            <CheckCircle2 className="h-4 w-4" />
            <span>Investigation Finalized</span>
          </div>

          <div className="mt-3 grid gap-3 text-xs sm:grid-cols-2">
            <div className="rounded-xl border border-neutral-800 bg-black/30 p-3">
              <span className="text-neutral-400 font-medium">Customer Outcome:</span>
              <p className="mt-1 font-semibold text-emerald-200">{finalDecision.customerOutcome.replace(/_/g, " ")}</p>
              {finalDecision.customerSummary && (
                <p className="mt-1 text-neutral-300 text-[11px]">{finalDecision.customerSummary}</p>
              )}
            </div>
            <div className="rounded-xl border border-neutral-800 bg-black/30 p-3">
              <span className="text-neutral-400 font-medium">Creator Outcome:</span>
              <p className="mt-1 font-semibold text-emerald-200">{finalDecision.creatorOutcome.replace(/_/g, " ")}</p>
              {finalDecision.creatorSummary && (
                <p className="mt-1 text-neutral-300 text-[11px]">{finalDecision.creatorSummary}</p>
              )}
            </div>
          </div>

          <div className="mt-3 rounded-xl border border-neutral-800 bg-black/30 p-3">
            <span className="text-neutral-400 font-medium text-xs">Participant-Safe Summary:</span>
            <p className="mt-1 text-xs text-neutral-200 whitespace-pre-wrap leading-relaxed">{finalDecision.summary}</p>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-neutral-400">
            <span>
              Financial Review:{" "}
              <strong className="text-white">
                {finalDecision.financialReviewRequired ? "Required" : "Not Required"}
              </strong>
            </span>
            <span>•</span>
            <span>
              Governance Review:{" "}
              <strong className="text-white">
                {finalDecision.governanceReviewRequired ? "Required" : "Not Required"}
              </strong>
            </span>
            <span>•</span>
            <span>Finalized: {dateTime(finalDecision.finalizedAt)}</span>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
