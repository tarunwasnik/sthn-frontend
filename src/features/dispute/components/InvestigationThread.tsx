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
          className="group block overflow-hidden rounded-xl border border-white/10 bg-black/40 transition hover:border-cyan-400/40"
        >
          <div className="relative max-h-56 w-full overflow-hidden bg-black/30">
            <img
              src={evidence.url}
              alt={caption ?? evidence.fileName}
              className="h-full max-h-56 w-full object-contain transition duration-200 group-hover:scale-[1.02]"
              loading="lazy"
            />
          </div>
          <div className="flex items-center justify-between gap-2 border-t border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] text-cyan-200 group-hover:text-cyan-100">
            <span className="flex items-center gap-1.5 truncate">
              <ImageIcon className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{evidence.fileName}</span>
            </span>
            <span className="shrink-0 text-white/40">
              {evidence.fileSize ? formatFileSize(evidence.fileSize) : "View"}
            </span>
          </div>
        </a>
        {caption && <p className="px-1 text-xs text-white/70 italic">{caption}</p>}
      </div>
    );
  }

  return (
    <div className="mt-2 space-y-1">
      <a
        href={evidence.url}
        target="_blank"
        rel="noreferrer"
        className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/30 p-2.5 transition hover:border-cyan-400/40 hover:bg-white/[0.04]"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-500/15 text-cyan-200">
          <FileText className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-white">{evidence.fileName}</p>
          <p className="text-[11px] text-white/45">
            Document {evidence.fileSize ? `• ${formatFileSize(evidence.fileSize)}` : ""}
          </p>
        </div>
        <ExternalLink className="h-3.5 w-3.5 shrink-0 text-cyan-200" />
      </a>
      {caption && <p className="px-1 text-xs text-white/70 italic">{caption}</p>}
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
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8 text-center">
        <p className="text-sm text-white/50">No investigation activity is visible to you yet.</p>
        <p className="mt-1 text-xs text-white/35">
          Messages from the moderation team and your submissions will appear here chronologically.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="max-h-[65vh] min-h-[420px] overflow-y-auto space-y-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:p-5 pr-2 sm:pr-3"
    >
      {items.map((entry) => {
        if (entry.type === "REQUEST") {
          // ADMIN REQUEST: Left-aligned incoming message bubble with distinct admin treatment
          return (
            <div key={entry.id} className="flex justify-start">
              <div className="max-w-[88%] rounded-2xl rounded-tl-sm border border-amber-400/30 bg-gradient-to-br from-amber-400/10 to-amber-400/5 p-4 text-white shadow-lg md:max-w-[75%]">
                <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-amber-200">
                  <Shield className="h-3.5 w-3.5" />
                  Admin Request
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-white/95">{entry.item.text}</p>
                <div className="mt-2.5 text-right text-[10px] text-amber-200/50">{dateTime(entry.createdAt)}</div>
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
                    ? "rounded-tl-sm border border-amber-400/30 bg-gradient-to-br from-amber-400/10 to-amber-400/5 text-white"
                    : "rounded-tr-sm border border-cyan-400/25 bg-gradient-to-br from-cyan-400/10 to-cyan-400/5 text-white"
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-white/60">
                  {isAdminEvidence ? (
                    <>
                      <Shield className="h-3.5 w-3.5 text-amber-300" />
                      <span className="text-amber-200">Admin Evidence</span>
                    </>
                  ) : (
                    <>
                      <User className="h-3.5 w-3.5 text-cyan-300" />
                      <span className="text-cyan-200">Your Evidence</span>
                    </>
                  )}
                </div>

                <InlineEvidenceCard evidence={entry.item} />

                <div
                  className={`mt-2.5 text-right text-[10px] ${
                    isAdminEvidence ? "text-amber-200/50" : "text-cyan-200/50"
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
            <div className="max-w-[88%] rounded-2xl rounded-tr-sm border border-cyan-400/25 bg-gradient-to-br from-cyan-400/10 to-cyan-400/5 p-4 text-white shadow-lg md:max-w-[75%]">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-cyan-200">
                  <User className="h-3.5 w-3.5" />
                  You · {submission.kind.toLowerCase()}
                </div>
                {submission.sharedWithCounterpartyAt && (
                  <span className="rounded-full border border-sky-400/30 bg-sky-400/10 px-2 py-0.5 text-[10px] font-medium text-sky-200">
                    Shared with counterparty
                  </span>
                )}
              </div>

              {submission.text && (
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-white/95">{submission.text}</p>
              )}

              {submission.evidence && submission.evidence.length > 0 && (
                <div className="mt-2 space-y-2">
                  {submission.evidence.map((evi) => (
                    <InlineEvidenceCard key={evi.evidenceReference} evidence={evi} />
                  ))}
                </div>
              )}

              <div className="mt-2.5 text-right text-[10px] text-cyan-200/50">{dateTime(entry.createdAt)}</div>
            </div>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
