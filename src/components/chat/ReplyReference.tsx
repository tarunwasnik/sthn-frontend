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
    case "IMAGE":
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
    <div className="mb-2 flex min-w-0 items-center gap-2 rounded-lg bg-white/5 px-3 py-2">
      {identity.avatarUrl ? (
        <img
          src={identity.avatarUrl}
          alt=""
          onError={(event) => {
            event.currentTarget.src = "/default-avatar.png";
          }}
          className="h-6 w-6 shrink-0 rounded-full border border-white/10 object-cover"
        />
      ) : (
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-[9px] font-semibold text-white/80">
          {getInitials(identity.displayName)}
        </div>
      )}

      <div className="min-w-0">
        <p className="truncate text-[11px] font-medium text-blue-400">
          {identity.displayName}
        </p>
        <p className="truncate text-[12px] text-white/65">
          {getReplyPreview(reply)}
        </p>
      </div>
    </div>
  );

  return onNavigate ? (
    <button
      type="button"
      onClick={() => onNavigate(reply.messageId)}
      className="block w-full text-left transition hover:bg-white/[0.07] focus:outline-none focus-visible:ring-1 focus-visible:ring-blue-400"
    >
      {content}
    </button>
  ) : content;
}
