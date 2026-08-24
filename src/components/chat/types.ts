export type ChatMessageType = "text" | "location" | "document" | "image" | "voice" | "video" | "IMAGE";
export interface ChatAttachment { url: string; publicId?: string; fileName: string; originalFileName?: string; mimeType: string; fileSize: number; resourceType: "raw" | "image" | "video"; }
export interface ChatReply { messageId: string; senderId: string; senderRole: "USER" | "CREATOR"; type: ChatMessageType; message: string; attachment?: ChatAttachment; isDeleted?: boolean; }
export interface ChatReaction { userId?: string; emoji: string; }
export interface ChatMessage { _id: string; bookingId: string; senderId: string; senderRole: "USER" | "CREATOR"; type?: ChatMessageType; groupId?: string; replyTo?: ChatReply; location?: { latitude: number; longitude: number; name: string; address: string; placeId?: string }; attachment?: ChatAttachment; message: string; seenBy: string[]; isDeleted?: boolean; deletedAt?: string; reactions?: ChatReaction[]; createdAt: string; }

export const hasReplyReference = (replyTo: unknown): replyTo is ChatReply => {
  if (!replyTo || typeof replyTo !== "object") return false;

  const candidate = replyTo as Partial<ChatReply>;

  return (
    typeof candidate.messageId === "string" &&
    candidate.messageId.length > 0 &&
    typeof candidate.senderId === "string" &&
    candidate.senderId.length > 0 &&
    (candidate.senderRole === "USER" || candidate.senderRole === "CREATOR") &&
    typeof candidate.message === "string"
  );
};

export const normalizeReplyReference = <T extends { replyTo?: unknown }>(
  message: T,
): T => ({
  ...message,
  replyTo: hasReplyReference(message.replyTo) ? message.replyTo : undefined,
});
