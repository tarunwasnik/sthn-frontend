// frontend/src/components/chat/ChatComposer.tsx

import {
  useRef,
  type KeyboardEvent,
} from "react";

interface ChatComposerProps {
  input: string;

  handleInputChange: (
    value: string
  ) => void;

  handleKeyDown: (
    e: KeyboardEvent<HTMLInputElement>
  ) => void;

  handleSend: () => void;

  sending: boolean;

  chatClosed: boolean;

  showLocationButton?: boolean;

  onLocationClick?: () => void;

  onDocumentSelect?: (
    file: File
  ) => void;

  onImageSelect?: (
    file: File
  ) => void;
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
}: ChatComposerProps) {
  const fileInputRef =
    useRef<HTMLInputElement | null>(
      null
    );

  const imageInputRef =
    useRef<HTMLInputElement | null>(
      null
    );

  return (
    <div
      className="
        mt-2
        shrink-0
        rounded-[20px]
        border border-white/10
        bg-gradient-to-br
        from-white/[0.045]
        to-white/[0.015]
        backdrop-blur-xl
        px-2
        py-1.5
      "
    >
      {/* Hidden Document Picker */}
      <input
        ref={fileInputRef}
        type="file"
        hidden
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
          const file =
            e.target.files?.[0];

          if (
            file &&
            onDocumentSelect
          ) {
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
          const file =
            e.target.files?.[0];

          if (
            file &&
            onImageSelect
          ) {
            onImageSelect(file);
          }

          e.currentTarget.value = "";
        }}
      />

      <div className="flex items-end gap-2">

        {/* Image Button */}
        <button
          type="button"
          disabled={chatClosed}
          onClick={() =>
            imageInputRef.current?.click()
          }
          className="
            h-[40px]
            w-[40px]
            shrink-0
            rounded-[18px]
            border
            border-white/10
            bg-white/[0.07]
            hover:bg-white/[0.1]
            active:scale-[0.98]
            transition-all
            disabled:opacity-40
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
          onClick={() =>
            fileInputRef.current?.click()
          }
          className="
            h-[40px]
            w-[40px]
            shrink-0
            rounded-[18px]
            border
            border-white/10
            bg-white/[0.07]
            hover:bg-white/[0.1]
            active:scale-[0.98]
            transition-all
            disabled:opacity-40
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
              rounded-[18px]
              border
              border-white/10
              bg-white/[0.07]
              hover:bg-white/[0.1]
              active:scale-[0.98]
              transition-all
              disabled:opacity-40
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
            handleInputChange(
              e.target.value
            );
          }}
          onKeyDown={handleKeyDown}
          disabled={chatClosed}
          placeholder={
            chatClosed
              ? "Chat closed"
              : "Type a message..."
          }
          className="
            flex-1
            min-w-0
            bg-white/[0.04]
            border border-white/10
            rounded-[18px]
            px-4
            py-2.5
            text-[14px]
            text-white
            placeholder:text-white/35
            focus:outline-none
            focus:border-white/15
            transition-all
            disabled:opacity-50
          "
        />

        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={
            sending ||
            !input.trim() ||
            chatClosed
          }
          className="
            h-[40px]
            px-4
            shrink-0
            rounded-[18px]
            border border-white/10
            bg-white/[0.07]
            hover:bg-white/[0.1]
            active:scale-[0.98]
            transition-all
            disabled:opacity-40
            text-[13px]
            font-medium
          "
        >
          {sending
            ? "Sending..."
            : "Send"}
        </button>
      </div>
    </div>
  );
}