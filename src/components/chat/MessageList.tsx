

// frontend/src/components/chat/MessageList.tsx

import MessageBubble from "./MessageBubble";

interface MessageListProps {
  loading: boolean;
  error: string | null;
  messages: any[];
  userId: string|null;
  deliveredMessages: Set<string>;
  handleReactToMessage: (
    messageId: string,
    emoji: string
  ) => void;
  setSelectedMessageId: (
    id: string | null
  ) => void;
  setActionsOpen: (
    open: boolean
  ) => void;
  isTyping: boolean;
  bottomRef: React.RefObject<HTMLDivElement | null>;
  setMapPickerOpen: (
    open: boolean
  ) => void;
  setSelectedMapLocation: (
    location: {
      latitude: number;
      longitude: number;
    }
  ) => void;
}

export default function MessageList({
  loading,
  error,
  messages,
  userId,
  deliveredMessages,
  handleReactToMessage,
  setSelectedMessageId,
  setActionsOpen,
  isTyping,
  bottomRef,
  setMapPickerOpen,
  setSelectedMapLocation,
}: MessageListProps) {
  return (
    <>
      {loading && (
        <p className="text-sm text-white/50">
          Loading chat...
        </p>
      )}

      {error && (
        <p className="text-sm text-red-400">
          {error}
        </p>
      )}

      {!loading &&
        !error &&
        messages.map((msg, index) => (
          <MessageBubble
  key={msg._id}
  msg={msg}
  index={index}
  messages={messages}
  userId={userId}
  deliveredMessages={deliveredMessages}
  handleReactToMessage={
    handleReactToMessage
  }
  setSelectedMessageId={
    setSelectedMessageId
  }
  setActionsOpen={
    setActionsOpen
  }
  setMapPickerOpen={
    setMapPickerOpen
  }
  setSelectedMapLocation={
    setSelectedMapLocation
  }
  onContextMenu={(e) => {

    const canDelete =
      msg.senderId === userId &&
      !msg.isDeleted;

    if (!canDelete) {
      return;
    }

    e.preventDefault();

    setSelectedMessageId(
      msg._id
    );

    setActionsOpen(true);

  }}
/>
        ))}

      {isTyping && (
        <div
          className="
            flex
            justify-start
            mt-2
          "
        >
          <div
            className="
              max-w-[82%]
              md:max-w-[68%]
              rounded-2xl
              rounded-bl-md
              px-3.5
              py-2
              border
              border-white/[0.05]
              bg-white/[0.04]
              text-white/60
              text-[13px]
              italic
            "
          >
            Typing...
          </div>
        </div>
      )}

      <div
        ref={bottomRef}
        className="h-4 shrink-0"
      />
    </>
  );
}