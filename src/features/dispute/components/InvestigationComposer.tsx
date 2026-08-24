import { FileText, Image as ImageIcon, Paperclip, Send, X } from "lucide-react";
import { useRef, useState, type FormEvent, type KeyboardEvent } from "react";

interface InvestigationComposerProps {
  onSubmitStatement: (text: string) => Promise<boolean>;
  onUploadEvidence: (type: "IMAGE" | "DOCUMENT", file: File, note: string) => Promise<boolean>;
  pending: boolean;
  disabled?: boolean;
}

function formatFileSize(bytes?: number) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function InvestigationComposer({
  onSubmitStatement,
  onUploadEvidence,
  pending,
  disabled = false,
}: InvestigationComposerProps) {
  const [text, setText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [note, setNote] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setSelectedFile(file);
    e.target.value = "";
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setNote("");
  };

  const handleSubmit = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (pending || disabled) return;

    const trimmedText = text.trim();
    if (!trimmedText && !selectedFile) return;

    let uploadSuccess = true;
    let statementSuccess = true;

    // If file is selected, upload it
    if (selectedFile) {
      const type = selectedFile.type.startsWith("image/") ? "IMAGE" : "DOCUMENT";
      uploadSuccess = await onUploadEvidence(type, selectedFile, note.trim());
      if (uploadSuccess) {
        setSelectedFile(null);
        setNote("");
      }
    }

    // If text is provided, submit it
    if (trimmedText && uploadSuccess) {
      statementSuccess = await onSubmitStatement(trimmedText);
      if (statementSuccess) {
        setText("");
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Ctrl+Enter or Cmd+Enter to send
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      void handleSubmit();
    }
  };

  const canSubmit = !pending && !disabled && (Boolean(text.trim()) || Boolean(selectedFile));

  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.045] to-white/[0.015] p-3 backdrop-blur-xl sm:p-4">
      {/* Hidden file input for images & documents */}
      <input
        ref={fileInputRef}
        type="file"
        hidden
        accept="image/*,.pdf,.doc,.docx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
        onChange={handleFileChange}
        disabled={disabled || pending}
      />

      {/* Selected file preview pill */}
      {selectedFile && (
        <div className="mb-3 rounded-xl border border-cyan-400/30 bg-cyan-400/10 p-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-400/20 text-cyan-200">
                {selectedFile.type.startsWith("image/") ? (
                  <ImageIcon className="h-4 w-4" />
                ) : (
                  <FileText className="h-4 w-4" />
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-white">{selectedFile.name}</p>
                <p className="text-[11px] text-cyan-200/70">
                  {selectedFile.type.startsWith("image/") ? "Image" : "Document"} • {formatFileSize(selectedFile.size)}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleRemoveFile}
              disabled={pending}
              className="rounded-lg p-1 text-white/50 transition hover:bg-white/10 hover:text-white"
              title="Remove attachment"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Optional note for evidence */}
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={500}
            placeholder="Add optional note or caption for this evidence..."
            disabled={pending || disabled}
            className="mt-2.5 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-1.5 text-xs text-white placeholder-white/40 outline-none transition focus:border-cyan-400/50"
          />
        </div>
      )}

      {/* Main text area & action bar */}
      <form onSubmit={(e) => void handleSubmit(e)}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          maxLength={4000}
          disabled={disabled || pending}
          placeholder="Type your response to the moderation team... (Ctrl+Enter to send)"
          rows={3}
          className="w-full resize-none rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-white placeholder-white/35 outline-none transition focus:border-cyan-400/50 focus:bg-black/30 disabled:opacity-50"
        />

        <div className="mt-2.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || pending || Boolean(selectedFile)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2 text-xs font-medium text-white/80 transition hover:bg-white/[0.1] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              title="Attach evidence (Image or Document)"
            >
              <Paperclip className="h-3.5 w-3.5" />
              <span>Attach evidence</span>
            </button>
            <span className="hidden text-[11px] text-white/40 sm:inline">
              Images (PNG, JPG, WebP) and documents (PDF, DOCX, TXT)
            </span>
          </div>

          <button
            type="submit"
            disabled={!canSubmit}
            className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-300 px-4 py-2 text-xs font-semibold text-neutral-950 transition hover:bg-cyan-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Send className="h-3.5 w-3.5" />
            <span>{pending ? "Submitting..." : "Send response"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
