import { FileText, Image as ImageIcon, Paperclip, Send, Shield, Upload, Users, X } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import type { DirectEvidenceAudience, InvestigationTarget } from "../types";

interface AdminInvestigationComposerProps {
  activeTab: "CUSTOMER" | "CREATOR";
  onRequestInfo: (target: InvestigationTarget, text: string) => Promise<unknown>;
  onUploadEvidence: (
    type: "IMAGE" | "DOCUMENT",
    file: File,
    audience: DirectEvidenceAudience,
    note: string
  ) => Promise<unknown>;
  pending: boolean;
  disabled?: boolean;
}

function formatFileSize(bytes?: number) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AdminInvestigationComposer({
  activeTab,
  onRequestInfo,
  onUploadEvidence,
  pending,
  disabled = false,
}: AdminInvestigationComposerProps) {
  const [activeMode, setActiveMode] = useState<"REQUEST" | "EVIDENCE">("REQUEST");

  // Request Information State
  const [sendToBoth, setSendToBoth] = useState(false);
  const [requestText, setRequestText] = useState("");

  // Evidence Upload State
  const [audience, setAudience] = useState<DirectEvidenceAudience>(
    activeTab === "CUSTOMER" ? "CUSTOMER" : "CREATOR"
  );
  const [file, setFile] = useState<File | null>(null);
  const [evidenceNote, setEvidenceNote] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Sync default audience and reset sendToBoth when activeTab changes
  useEffect(() => {
    setAudience(activeTab === "CUSTOMER" ? "CUSTOMER" : "CREATOR");
    setSendToBoth(false);
  }, [activeTab]);

  const targetRecipient: InvestigationTarget = sendToBoth ? "BOTH" : activeTab;
  const participantName = activeTab === "CUSTOMER" ? "Customer" : "Creator";

  const handleRequestSubmit = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (pending || disabled || !requestText.trim()) return;

    await onRequestInfo(targetRecipient, requestText.trim());
    setRequestText("");
    setSendToBoth(false);
  };

  const handleEvidenceSubmit = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (pending || disabled || !file) return;

    const type = file.type.startsWith("image/") ? "IMAGE" : "DOCUMENT";
    await onUploadEvidence(type, file, audience, evidenceNote.trim());
    setFile(null);
    setEvidenceNote("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      void handleRequestSubmit();
    }
  };

  if (disabled) {
    return (
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-4 text-center text-xs text-neutral-500">
        This investigation is closed/finalized. Investigation requests and evidence uploads are read-only.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-neutral-800 bg-gradient-to-br from-neutral-900/95 to-neutral-950 p-4 shadow-xl">
      {/* Mode Switcher Tabs */}
      <div className="mb-3 flex items-center justify-between border-b border-neutral-800 pb-2.5">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setActiveMode("REQUEST")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              activeMode === "REQUEST"
                ? "bg-sky-400/15 text-sky-200 border border-sky-400/30"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <Send className="h-3.5 w-3.5" />
            <span>Message {participantName}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveMode("EVIDENCE")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              activeMode === "EVIDENCE"
                ? "bg-amber-400/15 text-amber-200 border border-amber-400/30"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <Paperclip className="h-3.5 w-3.5" />
            <span>Upload Admin Evidence</span>
          </button>
        </div>
        <span className="text-[11px] font-medium text-neutral-400">
          Target: <strong className="text-white">{sendToBoth ? "BOTH (Customer & Creator)" : participantName}</strong>
        </span>
      </div>

      {/* 1. Request Information Tab */}
      {activeMode === "REQUEST" && (
        <form onSubmit={(e) => void handleRequestSubmit(e)} className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-medium text-neutral-300">
              {sendToBoth ? (
                <span className="text-amber-300">Broadcasting request to both Customer and Creator</span>
              ) : (
                `Requesting information from ${participantName}`
              )}
            </p>

            {/* Deliberate Secondary Action: Send to Both */}
            <label className="inline-flex items-center gap-2 cursor-pointer rounded-lg border border-neutral-800 bg-neutral-950/80 px-2.5 py-1 text-xs text-neutral-300 transition hover:border-neutral-700">
              <input
                type="checkbox"
                checked={sendToBoth}
                onChange={(e) => setSendToBoth(e.target.checked)}
                disabled={pending}
                className="rounded border-neutral-700 text-sky-500 focus:ring-0"
              />
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5 text-amber-300" />
                <span>Send to both participants</span>
              </span>
            </label>
          </div>

          <textarea
            value={requestText}
            onChange={(e) => setRequestText(e.target.value)}
            onKeyDown={handleKeyDown}
            maxLength={4000}
            disabled={pending}
            rows={3}
            placeholder={
              sendToBoth
                ? "Draft request visible to both Customer and Creator... (Ctrl+Enter to send)"
                : `Draft request visible to ${participantName.toLowerCase()}... (Ctrl+Enter to send)`
            }
            className="w-full resize-none rounded-xl border border-neutral-700/80 bg-neutral-950 p-3 text-sm text-white placeholder-neutral-500 outline-none transition focus:border-sky-400 focus:bg-black"
          />

          <div className="flex items-center justify-between">
            <span className="text-[11px] text-neutral-500">
              Requests appear directly in the participant's investigation conversation.
            </span>
            <button
              type="submit"
              disabled={pending || !requestText.trim()}
              className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold text-neutral-950 transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 ${
                sendToBoth
                  ? "bg-amber-300 hover:bg-amber-200"
                  : "bg-sky-300 hover:bg-sky-200"
              }`}
            >
              <Send className="h-3.5 w-3.5" />
              <span>
                {pending
                  ? "Sending..."
                  : sendToBoth
                  ? "Send to Both Participants"
                  : `Send to ${participantName}`}
              </span>
            </button>
          </div>
        </form>
      )}

      {/* 2. Upload Admin Evidence Tab */}
      {activeMode === "EVIDENCE" && (
        <form onSubmit={(e) => void handleEvidenceSubmit(e)} className="space-y-3">
          <input
            ref={fileInputRef}
            type="file"
            hidden
            accept="image/*,.pdf,.doc,.docx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            disabled={pending}
          />

          <div className="flex flex-wrap items-center gap-2">
            <label className="text-xs font-medium text-neutral-400">Audience / Visibility:</label>
            <select
              value={audience}
              onChange={(e) => setAudience(e.target.value as DirectEvidenceAudience)}
              disabled={pending}
              className="rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-1 text-xs font-semibold text-amber-200 outline-none focus:border-amber-400"
            >
              <option value="CUSTOMER">CUSTOMER (Visible to Customer)</option>
              <option value="CREATOR">CREATOR (Visible to Creator)</option>
              <option value="BOTH">BOTH (Visible to Customer & Creator)</option>
              <option value="ADMIN_ONLY">ADMIN_ONLY (Confidential Internal Evidence)</option>
            </select>
          </div>

          {/* Selected File Box */}
          {file ? (
            <div className="rounded-xl border border-amber-400/30 bg-amber-400/10 p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-400/20 text-amber-200">
                    {file.type.startsWith("image/") ? (
                      <ImageIcon className="h-4 w-4" />
                    ) : (
                      <FileText className="h-4 w-4" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium text-white">{file.name}</p>
                    <p className="text-[11px] text-amber-200/70">
                      {file.type.startsWith("image/") ? "Image" : "Document"} • {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  disabled={pending}
                  className="rounded-lg p-1 text-neutral-400 transition hover:bg-white/10 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <input
                type="text"
                value={evidenceNote}
                onChange={(e) => setEvidenceNote(e.target.value)}
                maxLength={500}
                placeholder="Add optional note or audit description for this Admin evidence..."
                disabled={pending}
                className="mt-2.5 w-full rounded-lg border border-neutral-700/80 bg-neutral-950 px-3 py-1.5 text-xs text-white placeholder-neutral-500 outline-none transition focus:border-amber-400"
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={pending}
              className="flex w-full flex-col items-center justify-center rounded-xl border border-dashed border-neutral-700 bg-neutral-950/60 p-4 text-neutral-400 transition hover:border-amber-400/60 hover:bg-neutral-900/60 hover:text-white"
            >
              <Upload className="h-5 w-5 text-amber-300" />
              <span className="mt-1 text-xs font-medium">Click to select Admin evidence file</span>
              <span className="mt-0.5 text-[10px] text-neutral-500">
                Images (PNG, JPG, WebP) or Documents (PDF, DOCX, TXT)
              </span>
            </button>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[11px] text-amber-300/80">
              <Shield className="h-3.5 w-3.5" />
              <span>
                {audience === "ADMIN_ONLY"
                  ? "Stored securely — never visible to participants."
                  : `Audience strictly restricted to ${audience}.`}
              </span>
            </div>
            <button
              type="submit"
              disabled={pending || !file}
              className="inline-flex items-center gap-1.5 rounded-xl bg-amber-300 px-4 py-2 text-xs font-semibold text-neutral-950 transition hover:bg-amber-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Upload className="h-3.5 w-3.5" />
              <span>{pending ? "Uploading..." : "Upload evidence"}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
