import type { ChatParticipantIdentity } from "./replyIdentity";
import { getInitials } from "./replyIdentity";

interface ReplyReferenceProps {
  identity: ChatParticipantIdentity;
  reply: {
    messageId: string;
    type?: string;
    message: string;
    isDeleted?: boolean;
  };
}

const getReplyPreview = (reply: ReplyReferenceProps["reply"]) => {
  if (reply.isDeleted) return "This message was deleted";

  switch (reply.type) {
    case "image":
      return "🖼️ Image";
    case "document":
      return "📄 Document";
    case "location":
      return "📍 Location";
    case "voice":
      return "🎤 Voice message";
    case "video":
      return "🎥 Video";
    default:
      return reply.message;
  }
};

export default function ReplyReference({ identity, reply, onNavigate }: ReplyReferenceProps & { onNavigate?: (messageId: string) => void }) {
  const content = (
    <div className="mb-2 flex min-w-0 items-center gap-2 rounded-[var(--radius-control)] border border-theme-border bg-theme-inset px-3 py-2">
      {identity.avatarUrl ? (
        <img
          src={identity.avatarUrl}
          alt=""
          onError={(event) => {
            event.currentTarget.src = "/default-avatar.png";
          }}
          className="h-6 w-6 shrink-0 rounded-full border border-theme-border object-cover"
        />
      ) : (
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-theme-border bg-theme-surface text-[9px] font-semibold text-theme-text">
          {getInitials(identity.displayName)}
        </div>
      )}

      <div className="min-w-0">
        <p className="truncate text-[11px] font-medium text-theme-accent">
          {identity.displayName}
        </p>
        <p className="truncate text-[12px] text-theme-muted">
          {getReplyPreview(reply)}
        </p>
      </div>
    </div>
  );

  return onNavigate ? (
    <button
      type="button"
      onClick={() => onNavigate(reply.messageId)}
      className="block w-full rounded text-left transition-colors hover:bg-theme-surface-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent"
    >
      {content}
    </button>
  ) : content;
}
