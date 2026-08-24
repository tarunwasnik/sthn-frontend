import { createContext, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";

import api from "../api/axios";
import { getConversations, type Conversation } from "../api/chat";
import { socket } from "../lib/socket";
import { useAuth } from "../hooks/useAuth";

interface ConversationUpdate {
  bookingId: unknown;
  messageId: unknown;
  senderId: unknown;
  message: unknown;
  createdAt: unknown;
}

interface ConversationSeenUpdate {
  bookingId: unknown;
  seenBy: unknown;
}

interface MessagingContextValue {
  conversations: Conversation[];
  loading: boolean;
  totalUnread: number;
  markConversationSeen: (bookingId: string) => Promise<boolean>;
  reconcileConversations: () => Promise<void>;
}

export const MessagingContext = createContext<MessagingContextValue | undefined>(undefined);

export function MessagingProvider({ children }: { children: ReactNode }) {
  const { userId } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const processedIncomingMessageIds = useRef(new Set<string>());
  const liveRevision = useRef(0);
  const latestFetchId = useRef(0);
  const hasConnectedForSession = useRef(false);

  const reconcileConversations = useCallback(async () => {
    if (!userId) return;

    const fetchId = ++latestFetchId.current;
    const revisionAtStart = liveRevision.current;
    setLoading(true);

    try {
      const data = await getConversations();

      if (
        fetchId !== latestFetchId.current ||
        revisionAtStart !== liveRevision.current
      ) {
        return;
      }

      setConversations(data);
    } catch (error) {
      console.error("Failed to reconcile conversations", error);
    } finally {
      if (fetchId === latestFetchId.current) {
        setLoading(false);
      }
    }
  }, [userId]);

  const markConversationSeen = useCallback(async (bookingId: string) => {
    try {
      await api.post(`/v1/chat/${bookingId}/seen`);
      liveRevision.current += 1;
      setConversations((previous) =>
        previous.map((conversation) =>
          String(conversation.bookingId) === String(bookingId)
            ? { ...conversation, unreadCount: 0 }
            : conversation,
        ),
      );
      return true;
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    processedIncomingMessageIds.current.clear();
    liveRevision.current = 0;
    latestFetchId.current = 0;
    hasConnectedForSession.current = socket.connected;

    if (!userId) {
      setConversations([]);
      setLoading(false);
      return;
    }

    void reconcileConversations();

    const handleConversationUpdate = (event: ConversationUpdate) => {
      if (
        event.bookingId === null ||
        event.bookingId === undefined ||
        event.messageId === null ||
        event.messageId === undefined ||
        event.senderId === null ||
        event.senderId === undefined
      ) {
        return;
      }

      const bookingId = String(event.bookingId);
      const messageId = String(event.messageId);
      const senderId = String(event.senderId);

      // Recipient-only delivery is enforced by the server. Keep this client
      // guard so an unexpected self event can never increase unread state.
      if (senderId === String(userId)) return;
      if (processedIncomingMessageIds.current.has(messageId)) return;
      processedIncomingMessageIds.current.add(messageId);

      setConversations((previous) => {
        const index = previous.findIndex(
          (conversation) => String(conversation.bookingId) === bookingId,
        );

        if (index === -1) {
          void reconcileConversations();
          return previous;
        }

        liveRevision.current += 1;
        const next = [...previous];
        next[index] = {
          ...next[index],
          lastMessage: typeof event.message === "string" ? event.message : next[index].lastMessage,
          lastMessageAt: typeof event.createdAt === "string" ? event.createdAt : next[index].lastMessageAt,
          unreadCount: next[index].unreadCount + 1,
        };

        if (index !== 0) {
          const [updated] = next.splice(index, 1);
          next.unshift(updated);
        }

        return next;
      });
    };

    const handleConversationSeen = (event: ConversationSeenUpdate) => {
      if (
        event.bookingId === null ||
        event.bookingId === undefined ||
        String(event.seenBy) !== String(userId)
      ) {
        return;
      }

      const bookingId = String(event.bookingId);
      liveRevision.current += 1;
      setConversations((previous) =>
        previous.map((conversation) =>
          String(conversation.bookingId) === bookingId
            ? { ...conversation, unreadCount: 0 }
            : conversation,
        ),
      );
    };

    const handleConnect = () => {
      const reconnect = hasConnectedForSession.current;
      hasConnectedForSession.current = true;
      if (reconnect) {
        void reconcileConversations();
      }
    };

    socket.on("chat:conversation-update", handleConversationUpdate);
    socket.on("chat:conversation-seen", handleConversationSeen);
    socket.on("connect", handleConnect);

    return () => {
      socket.off("chat:conversation-update", handleConversationUpdate);
      socket.off("chat:conversation-seen", handleConversationSeen);
      socket.off("connect", handleConnect);
    };
  }, [reconcileConversations, userId]);

  const totalUnread = useMemo(
    () => conversations.reduce((total, conversation) => total + conversation.unreadCount, 0),
    [conversations],
  );

  const value = useMemo(
    () => ({
      conversations,
      loading,
      totalUnread,
      markConversationSeen,
      reconcileConversations,
    }),
    [conversations, loading, markConversationSeen, reconcileConversations, totalUnread],
  );

  return <MessagingContext.Provider value={value}>{children}</MessagingContext.Provider>;
}
