// frontend/src/components/chat/ChatHeader.tsx

interface ChatHeaderProps {
  displayName: string;
  avatarUrl?: string | null;
  serviceTitle: string;
  slotText: string;
  chatClosed: boolean;
  terminalStatus?: "CANCELLED" | "COMPLETED" | null;
  onClose?: () => void;
  getInitials: (name: string) => string;
}

export default function ChatHeader({
  displayName,
  avatarUrl,
  serviceTitle,
  slotText,
  chatClosed,
  terminalStatus,
  onClose,
  getInitials,
}: ChatHeaderProps) {
  return (
    <div
      className="
        shrink-0
        rounded-[var(--radius-card)]
        border border-theme-border
        bg-theme-surface
        px-3 sm:px-5
        py-2
        mb-2
      "
    >
      <div className="flex items-center gap-3 min-w-0">

        {onClose && (
          <button
            onClick={onClose}
            className="
              shrink-0
              text-theme-muted
              hover:text-theme-text
              transition-colors
              focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent
            "
          >
            ←
          </button>
        )}

        {/* Avatar */}

        <div className="relative shrink-0">

          {avatarUrl ? (

            <img
              src={avatarUrl}
              alt="avatar"
              className="
                w-9
                h-9
                rounded-full
                object-cover
                border border-theme-border
              "
            />

          ) : (

            <div
              className="
                w-9
                h-9
                rounded-full
                bg-theme-inset
                border border-theme-border
                flex
                items-center
                justify-center
                text-sm
                font-semibold
              "
            >
              {getInitials(displayName)}
            </div>

          )}

        </div>

        {/* Content */}

        <div className="min-w-0">

          <h2
            className="
              text-[15px]
              sm:text-[16px]
              font-semibold
              truncate
            "
          >
            {displayName}
          </h2>

          <div className="mt-[2px] space-y-[2px]">

            <p
              className="
                text-[10px]
                text-theme-muted
                truncate
                leading-none
              "
            >
              {serviceTitle}
            </p>

            <p
              className="
                text-[11px]
                sm:text-xs
                text-theme-muted
                truncate
              "
            >
              {chatClosed
                ? `${terminalStatus === "CANCELLED" ? "Cancelled" : "Completed"} · Read only`
                : slotText || "Booking active"}
            </p>

          </div>

        </div>

      </div>
    </div>
  );

}
