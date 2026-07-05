//frontend/src/components/chat/MessageActions.tsx

interface MessageActionsProps {
  isOpen: boolean;

  canDelete: boolean;

  onReply: () => void;

  onDelete: () => void;

  onClose: () => void;
}

export default function MessageActions({
  isOpen,
  canDelete,
  onReply,
  onDelete,
  onClose,
}: MessageActionsProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}

      <div className="fixed inset-0 z-[99998]" onClick={onClose} />

      {/* Menu */}

      <div
        className="
    fixed
    bottom-24
    md:bottom-6
    left-1/2
    -translate-x-1/2
    z-[99999]
    min-w-[220px]
    rounded-2xl
    border border-white/10
    bg-[#111]
    shadow-xl
    overflow-hidden
  "
      >
        <button
          onClick={() => {
            onReply();
            onClose();
          }}
          className="
    w-full
    px-4
    py-3
    text-left
    text-white
    hover:bg-white/5
    border-b
    border-white/10
  "
        >
          Reply
        </button>

        {canDelete && (
          <button
            onClick={() => {
              onDelete();
              onClose();
            }}
            className="
              w-full
              px-4
              py-3
              text-left
              text-red-400
              hover:bg-white/5
            "
          >
            Delete Message
          </button>
        )}
      </div>
    </>
  );
}
