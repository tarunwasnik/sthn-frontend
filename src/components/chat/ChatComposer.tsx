// frontend/src/components/chat/ChatComposer.tsx

import type { KeyboardEvent } from "react";

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
}: ChatComposerProps) {
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
      <div className="flex items-end gap-2">
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
  >
    📍
  </button>
)}
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