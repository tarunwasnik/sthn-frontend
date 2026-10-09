export type ChatMessageType =
  | "text"
  | "location"
  | "document"
  | "image"
  | "voice"
  | "video";

export interface ChatAttachment {
  url: string;
  publicId?: string;
  fileName: string;
  originalFileName?: string;
  mimeType: string;
  fileSize: number;
  resourceType: "raw" | "image" | "video";
}

// Replies persist only the fields needed to render an immutable preview.
export type ChatReplyAttachment = Pick<
  ChatAttachment,
  "url" | "fileName" | "mimeType" | "resourceType"
>;

export interface ChatReply {
  messageId: string;
  senderId: string;
  senderRole: "USER" | "CREATOR";
  type: ChatMessageType;
  message: string;
  attachment?: ChatReplyAttachment;
  isDeleted?: boolean;
}

export interface ChatReaction {
  userId?: string;
  emoji: string;
}

export interface ChatMessage {
  _id: string;
  bookingId: string;
  senderId: string;
  senderRole: "USER" | "CREATOR";
  type: ChatMessageType;
  groupId?: string;
  replyTo?: ChatReply;
  location?: {
    latitude: number;
    longitude: number;
    name: string;
    address: string;
    placeId?: string;
  };
  attachment?: ChatAttachment;
  message: string;
  seenBy: string[];
  isDeleted?: boolean;
  deletedAt?: string;
  reactions?: ChatReaction[];
  isUploading?: boolean;
  uploadProgress?: number;
  uploadFailed?: boolean;
  tempPreviewUrl?: string;
  createdAt: string;
}

type ChatMessagePayloadType = ChatMessageType | "IMAGE";

interface ChatReplyPayload extends Omit<ChatReply, "type"> {
  type: ChatMessagePayloadType;
}

export interface ChatMessagePayload
  extends Omit<ChatMessage, "type" | "replyTo"> {
  type?: ChatMessagePayloadType;
  replyTo?: unknown;
}

const messageTypes: readonly unknown[] = [
  "text",
  "location",
  "document",
  "image",
  "voice",
  "video",
];

const isChatMessageType = (type: unknown): type is ChatMessageType =>
  messageTypes.includes(type);

const normalizeMessageType = (
  type: ChatMessagePayloadType | undefined,
): ChatMessageType => (type === "IMAGE" ? "image" : type ?? "text");

const isReplyAttachment = (
  attachment: unknown,
): attachment is ChatReplyAttachment =>
  !!attachment &&
  typeof attachment === "object" &&
  "url" in attachment &&
  typeof attachment.url === "string" &&
  "fileName" in attachment &&
  typeof attachment.fileName === "string" &&
  "mimeType" in attachment &&
  typeof attachment.mimeType === "string" &&
  "resourceType" in attachment &&
  (attachment.resourceType === "raw" ||
    attachment.resourceType === "image" ||
    attachment.resourceType === "video");

const isReplyPayload = (replyTo: unknown): replyTo is ChatReplyPayload => {
  return (
    !!replyTo &&
    typeof replyTo === "object" &&
    "messageId" in replyTo &&
    typeof replyTo.messageId === "string" &&
    replyTo.messageId.length > 0 &&
    "senderId" in replyTo &&
    typeof replyTo.senderId === "string" &&
    replyTo.senderId.length > 0 &&
    "senderRole" in replyTo &&
    (replyTo.senderRole === "USER" || replyTo.senderRole === "CREATOR") &&
    "type" in replyTo &&
    (isChatMessageType(replyTo.type) || replyTo.type === "IMAGE") &&
    "message" in replyTo &&
    typeof replyTo.message === "string" &&
    (!("attachment" in replyTo) ||
      replyTo.attachment === undefined ||
      isReplyAttachment(replyTo.attachment))
  );
};

export const hasReplyReference = (replyTo: unknown): replyTo is ChatReply =>
  isReplyPayload(replyTo) && replyTo.type !== "IMAGE";

const normalizeReplyReference = (replyTo: unknown): ChatReply | undefined =>
  isReplyPayload(replyTo)
    ? {
        ...replyTo,
        type: normalizeMessageType(replyTo.type),
      }
    : undefined;

export const normalizeChatMessage = (
  message: ChatMessagePayload,
): ChatMessage => ({
  ...message,
  type: normalizeMessageType(message.type),
  replyTo: normalizeReplyReference(message.replyTo),
});
