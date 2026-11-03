// frontend/src/components/chat/ChatComposer.tsx

import { useRef, type KeyboardEvent } from "react";
import ReplyReference from "./ReplyReference";
import type { ChatParticipantIdentity } from "./replyIdentity";

interface ChatComposerProps {
  input: string;

  handleInputChange: (value: string) => void;

  handleKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void;

  handleSend: () => void;

  replyingTo?: {
    _id: string;
    senderId: string;
    senderRole: "USER" | "CREATOR";

    type?: "text" | "location" | "document" | "image" | "voice" | "video";

    message: string;
  } | null;
  replyIdentity?: ChatParticipantIdentity | null;
  onCancelReply?: () => void;

  sending: boolean;

  chatClosed: boolean;

  showLocationButton?: boolean;

  onLocationClick?: () => void;

  onDocumentSelect?: (file: File) => void;

  onImageSelect?: (files: File[]) => void;
}

export default function ChatComposer({
  input,
  handleInputChange,
  handleKeyDown,
  handleSend,
  sending,
  chatClosed,
  showLocationButton,
  onLocationClick,
  onDocumentSelect,
  onImageSelect,

  replyingTo,
  replyIdentity,
  onCancelReply,
}: ChatComposerProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const imageInputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div
      className="
        mt-2
        shrink-0
        rounded-[var(--radius-card)]
        border border-theme-border
        bg-theme-surface
        px-2
        py-1.5
      "
    >
      {replyingTo && (
        <div
          className="
      mb-2
      flex
      items-start
      justify-between
      rounded-[var(--radius-control)]
      border
      border-theme-border
      bg-theme-inset
      px-3
      py-2
    "
        >
          {replyIdentity && (
            <div className="min-w-0 flex-1">
              <ReplyReference
                identity={replyIdentity}
                reply={{ ...replyingTo, messageId: replyingTo._id }}
              />
            </div>
          )}

          <button
            type="button"
            onClick={onCancelReply}
            className="
        ml-3
        text-theme-muted
        hover:text-theme-text
        focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent
      "
          >
            ✕
          </button>
        </div>
      )}

      {/* Hidden Document Picker */}
      <input
        ref={fileInputRef}
        type="file"
        hidden
        multiple
        capture={undefined}
        accept="
.pdf,
.doc,
.docx,
.xls,
.xlsx,
.ppt,
.pptx,
.txt,
.csv,
.zip,
.rar,
application/pdf,
application/msword,
application/vnd.openxmlformats-officedocument.wordprocessingml.document,
application/vnd.ms-excel,
application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,
application/vnd.ms-powerpoint,
application/vnd.openxmlformats-officedocument.presentationml.presentation,
text/plain,
text/csv,
application/zip,
application/x-rar-compressed
"
        onChange={(e) => {
          const file = e.target.files?.[0];

          if (file && onDocumentSelect) {
            onDocumentSelect(file);
          }

          e.currentTarget.value = "";
        }}
      />

      {/* Hidden Image Picker */}
      <input
        ref={imageInputRef}
        type="file"
        hidden
        multiple
        accept="
image/*,
.jpg,
.jpeg,
.png,
.webp,
.gif,
.heic,
.heif
"
        capture={undefined}
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);

          if (files.length > 0 && onImageSelect) {
            onImageSelect(files);
          }

          e.currentTarget.value = "";
        }}
      />

      <div className="flex items-end gap-2">
        {/* Image Button */}
        <button
          type="button"
          disabled={chatClosed}
          onClick={() => imageInputRef.current?.click()}
          className="
            h-[40px]
            w-[40px]
            shrink-0
            rounded-[var(--radius-control)]
            border
            border-theme-border
            bg-theme-inset
            hover:bg-theme-surface-raised
            active:scale-[0.98]
            transition-all
            disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent
            text-lg
          "
          title="Send image"
        >
          🖼️
        </button>

        {/* Document Button */}
        <button
          type="button"
          disabled={chatClosed}
          onClick={() => fileInputRef.current?.click()}
          className="
            h-[40px]
            w-[40px]
            shrink-0
            rounded-[var(--radius-control)]
            border
            border-theme-border
            bg-theme-inset
            hover:bg-theme-surface-raised
            active:scale-[0.98]
            transition-all
            disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent
            text-lg
          "
          title="Send document"
        >
          📎
        </button>

        {/* Location Button */}
        {showLocationButton && (
          <button
            type="button"
            onClick={onLocationClick}
            disabled={chatClosed}
            className="
              h-[40px]
              w-[40px]
              shrink-0
              rounded-[var(--radius-control)]
              border
              border-theme-border
              bg-theme-inset
              hover:bg-theme-surface-raised
              active:scale-[0.98]
              transition-all
              disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent
              text-lg
            "
            title="Share location"
          >
            📍
          </button>
        )}

        {/* Message Input */}
        <input
          type="text"
          value={input}
          onChange={(e) => {
            handleInputChange(e.target.value);
          }}
          onKeyDown={handleKeyDown}
          disabled={chatClosed}
          placeholder={chatClosed ? "Chat closed" : "Type a message..."}
          className="
            flex-1
            min-w-0
            bg-theme-inset
            border border-theme-border
            rounded-[var(--radius-control)]
            px-4
            py-2.5
            text-[14px]
            text-theme-text
            placeholder:text-theme-muted
            focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent
            transition-all
            disabled:opacity-50
          "
        />

        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={sending || !input.trim() || chatClosed}
          className="
            h-[40px]
            px-4
            shrink-0
            rounded-[var(--radius-control)]
            border border-theme-border
            bg-theme-primary
            text-theme-primary-text
            hover:opacity-90
            active:scale-[0.98]
            transition-all
            disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent
            text-[13px]
            font-medium
          "
        >
          {sending ? "Sending..." : "Send"}
        </button>
      </div>
    </div>
  );
}
