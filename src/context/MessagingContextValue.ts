import { createContext } from "react";
import type { Conversation } from "../api/chat";

export interface MessagingContextValue {
  conversations: Conversation[];
  loading: boolean;
  totalUnread: number;
  markConversationSeen: (bookingId: string) => Promise<boolean>;
  reconcileConversations: () => Promise<void>;
}

export const MessagingContext = createContext<MessagingContextValue | undefined>(undefined);
