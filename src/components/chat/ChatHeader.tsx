// frontend/src/components/chat/ChatHeader.tsx

interface ChatHeaderProps {
  displayName: string;
  avatarUrl?: string | null;
  serviceTitle: string;
  slotText: string;
  chatClosed: boolean;
  onClose?: () => void;
  getInitials: (name: string) => string;
}

export default function ChatHeader({
  displayName,
  avatarUrl,
  serviceTitle,
  slotText,
  chatClosed,
  onClose,
  getInitials,
}: ChatHeaderProps) {
  return (
    <div
      className="
        shrink-0
        rounded-[24px]
        border border-white/10
        bg-gradient-to-br
        from-white/[0.045]
        to-white/[0.015]
        backdrop-blur-xl
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
              text-white/80
              hover:text-white
              transition-colors
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
                border border-white/10
              "
            />

          ) : (

            <div
              className="
                w-9
                h-9
                rounded-full
                bg-white/[0.06]
                border border-white/10
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
                text-white/40
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
                text-white/50
                truncate
              "
            >
              {chatClosed
                ? "Chat closed"
                : slotText || "Booking active"}
            </p>

          </div>

        </div>

      </div>
    </div>
  );

}