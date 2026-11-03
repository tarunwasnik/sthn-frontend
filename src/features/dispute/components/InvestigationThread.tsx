import { ExternalLink, FileText, Image as ImageIcon, Shield, User } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import type {
  ParticipantAdminRequest,
  ParticipantDirectEvidence,
  ParticipantInvestigationSubmission,
} from "../types";

export type ThreadTimelineItem =
  | { id: string; createdAt: string; type: "REQUEST"; item: ParticipantAdminRequest }
  | { id: string; createdAt: string; type: "SUBMISSION"; item: ParticipantInvestigationSubmission }
  | { id: string; createdAt: string; type: "EVIDENCE"; item: ParticipantDirectEvidence };

interface InvestigationThreadProps {
  submissions: ParticipantInvestigationSubmission[];
  adminRequests: ParticipantAdminRequest[];
  directEvidence: ParticipantDirectEvidence[];
}

const dateTime = (value: string) => {
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
    type: "IMAGE" | "DOCUMENT";
    url: string;
    fileName: string;
    fileSize?: number;
    caption?: string | null;
    note?: string | null;
  };
}) {
  const caption = evidence.caption || evidence.note;

  if (evidence.type === "IMAGE") {
    return (
      <div className="mt-2 space-y-1.5">
        <a
          href={evidence.url}
          target="_blank"
          rel="noreferrer"
          className="group block overflow-hidden rounded-[var(--radius-control)] border border-theme-border bg-theme-inset transition hover:border-theme-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent"
        >
          <div className="relative max-h-56 w-full overflow-hidden bg-black/30">
            <img
              src={evidence.url}
              alt={caption ?? evidence.fileName}
              className="h-full max-h-56 w-full object-contain transition duration-200 group-hover:scale-[1.02]"
              loading="lazy"
            />
          </div>
          <div className="flex items-center justify-between gap-2 border-t border-theme-border bg-theme-surface px-3 py-1.5 text-[11px] text-theme-accent">
            <span className="flex items-center gap-1.5 truncate">
              <ImageIcon className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{evidence.fileName}</span>
            </span>
            <span className="shrink-0 text-theme-muted">
              {evidence.fileSize ? formatFileSize(evidence.fileSize) : "View"}
            </span>
          </div>
        </a>
        {caption && <p className="px-1 text-xs italic text-theme-muted">{caption}</p>}
      </div>
    );
  }

  return (
    <div className="mt-2 space-y-1">
      <a
        href={evidence.url}
        target="_blank"
        rel="noreferrer"
        className="flex items-center gap-3 rounded-[var(--radius-control)] border border-theme-border bg-theme-inset p-2.5 transition hover:border-theme-accent hover:bg-theme-surface-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-control)] bg-theme-accent-tint text-theme-accent">
          <FileText className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-theme-text">{evidence.fileName}</p>
          <p className="text-[11px] text-theme-muted">
            Document {evidence.fileSize ? `• ${formatFileSize(evidence.fileSize)}` : ""}
          </p>
        </div>
        <ExternalLink className="h-3.5 w-3.5 shrink-0 text-theme-accent" />
      </a>
      {caption && <p className="px-1 text-xs italic text-theme-muted">{caption}</p>}
    </div>
  );
}

export default function InvestigationThread({
  submissions,
  adminRequests,
  directEvidence,
}: InvestigationThreadProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const items = useMemo<ThreadTimelineItem[]>(() => {
    const list: ThreadTimelineItem[] = [
      ...submissions.map(
        (item): ThreadTimelineItem => ({
          id: `sub-${item.submissionReference}`,
          createdAt: item.createdAt,
          type: "SUBMISSION",
          item,
        })
      ),
      ...adminRequests.map(
        (item): ThreadTimelineItem => ({
          id: `req-${item.requestReference}`,
          createdAt: item.createdAt,
          type: "REQUEST",
          item,
        })
      ),
      ...directEvidence.map(
        (item): ThreadTimelineItem => ({
          id: `evi-${item.evidenceReference}`,
          createdAt: item.createdAt,
          type: "EVIDENCE",
          item,
        })
      ),
    ];

    return list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [submissions, adminRequests, directEvidence]);

  // Auto-scroll to newest message on initial load and when items change
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [items.length]);

  if (items.length === 0) {
    return (
      <div className="rounded-[var(--radius-card)] border border-theme-border bg-theme-surface p-8 text-center">
        <p className="text-sm text-theme-muted">No investigation activity is visible to you yet.</p>
        <p className="mt-1 text-xs text-theme-muted">
          Messages from the moderation team and your submissions will appear here chronologically.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="max-h-[65vh] min-h-[420px] overflow-y-auto space-y-4 rounded-[var(--radius-card)] border border-theme-border bg-theme-surface p-4 pr-2 sm:p-5 sm:pr-3"
    >
      {items.map((entry) => {
        if (entry.type === "REQUEST") {
          // ADMIN REQUEST: Left-aligned incoming message bubble with distinct admin treatment
          return (
            <div key={entry.id} className="flex justify-start">
              <div className="max-w-[88%] rounded-[var(--radius-card)] rounded-tl-sm border border-theme-warning bg-theme-warning-tint p-4 text-theme-text shadow-sm md:max-w-[75%]">
                <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-theme-warning">
                  <Shield className="h-3.5 w-3.5" />
                  Admin Request
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-theme-text">{entry.item.text}</p>
                <div className="mt-2.5 text-right text-[10px] text-theme-warning">{dateTime(entry.createdAt)}</div>
              </div>
            </div>
          );
        }

        if (entry.type === "EVIDENCE") {
          const isAdminEvidence = entry.item.source === "ADMIN";

          return (
            <div key={entry.id} className={`flex ${isAdminEvidence ? "justify-start" : "justify-end"}`}>
              <div
                className={`max-w-[88%] rounded-2xl p-4 shadow-lg md:max-w-[75%] ${
                  isAdminEvidence
                    ? "rounded-tl-sm border border-theme-warning bg-theme-warning-tint text-theme-text"
                    : "rounded-tr-sm border border-theme-accent bg-theme-accent-tint text-theme-text"
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-theme-muted">
                  {isAdminEvidence ? (
                    <>
                      <Shield className="h-3.5 w-3.5 text-theme-warning" />
                      <span className="text-theme-warning">Admin Evidence</span>
                    </>
                  ) : (
                    <>
                      <User className="h-3.5 w-3.5 text-theme-accent" />
                      <span className="text-theme-accent">Your Evidence</span>
                    </>
                  )}
                </div>

                <InlineEvidenceCard evidence={entry.item} />

                <div
                  className={`mt-2.5 text-right text-[10px] ${
                    isAdminEvidence ? "text-theme-warning" : "text-theme-accent"
                  }`}
                >
                  {dateTime(entry.createdAt)}
                </div>
              </div>
            </div>
          );
        }

        // PARTICIPANT SUBMISSION (STATEMENT / CLARIFICATION / EVIDENCE): Right-aligned outgoing message
        const submission = entry.item;
        return (
          <div key={entry.id} className="flex justify-end">
            <div className="max-w-[88%] rounded-[var(--radius-card)] rounded-tr-sm border border-theme-accent bg-theme-accent-tint p-4 text-theme-text shadow-sm md:max-w-[75%]">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-theme-accent">
                  <User className="h-3.5 w-3.5" />
                  You · {submission.kind.toLowerCase()}
                </div>
                {submission.sharedWithCounterpartyAt && (
                  <span className="rounded-full border border-theme-border bg-theme-surface px-2 py-0.5 text-[10px] font-medium text-theme-text">
                    Shared with counterparty
                  </span>
                )}
              </div>

              {submission.text && (
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-theme-text">{submission.text}</p>
              )}

              {submission.evidence && submission.evidence.length > 0 && (
                <div className="mt-2 space-y-2">
                  {submission.evidence.map((evi) => (
                    <InlineEvidenceCard key={evi.evidenceReference} evidence={evi} />
                  ))}
                </div>
              )}

              <div className="mt-2.5 text-right text-[10px] text-theme-accent">{dateTime(entry.createdAt)}</div>
            </div>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
