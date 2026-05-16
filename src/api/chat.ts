//frontend/src/api/chat.ts
import api from "./axios";

/* ======================================================
   TYPES
====================================================== */

export interface Conversation {
  bookingId: string;
  lastMessage: string;
  lastMessageAt: string;
  otherUser: { _id: string; profile: any; };
  unreadCount: number;
}

/* ======================================================
   GET CONVERSATIONS
====================================================== */

export const getConversations = async (): Promise<
  Conversation[]
> => {
  const res = await api.get("/v1/chat/conversations");
  return res.data.conversations;
};