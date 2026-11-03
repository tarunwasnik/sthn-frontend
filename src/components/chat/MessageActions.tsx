//frontend/src/components/chat/MessageActions.tsx

interface MessageActionsProps {
  isOpen: boolean;

  canDelete: boolean;
  readOnly?: boolean;

  onReply: () => void;

  onDelete: () => void;

  onClose: () => void;
}

export default function MessageActions({
  isOpen,
  canDelete,
  readOnly = false,
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
    rounded-[var(--radius-dialog)]
    border border-theme-border
    bg-theme-surface
    shadow-xl
    overflow-hidden
  "
      >
        {!readOnly && <button
          onClick={() => {
            onReply();
            onClose();
          }}
          className="
    w-full
    px-4
    py-3
    text-left
    text-theme-text
    hover:bg-theme-inset
    border-b
    border-theme-border
    focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent
  "
        >
          Reply
        </button>}

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
              text-theme-danger
              hover:bg-theme-danger-tint
              focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent
            "
          >
            Delete Message
          </button>
        )}
      </div>
    </>
  );
}
