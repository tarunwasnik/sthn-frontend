// frontend/src/components/chat/MessageList.tsx

import MessageBubble from "./MessageBubble";
import ChatImageGroup from "./ChatImageGroup";

interface MessageListProps {
  loading: boolean;
  error: string | null;
  messages: any[];
  userId: string | null;
  deliveredMessages: Set<string>;
  handleReactToMessage: (messageId: string, emoji: string) => void;
  setSelectedMessageId: (id: string | null) => void;
  setActionsOpen: (open: boolean) => void;
  isTyping: boolean;
  bottomRef: React.RefObject<HTMLDivElement | null>;
  setMapPickerOpen: (open: boolean) => void;
  setSelectedMapLocation: (location: {
    latitude: number;
    longitude: number;
  }) => void;

  setImageViewerOpen: (open: boolean) => void;

  setSelectedImages: (images: any[]) => void;

  setSelectedImageIndex: (index: number) => void;
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
  setImageViewerOpen,
  setSelectedImages,
  setSelectedImageIndex,
}: MessageListProps) {
  /* ======================================================
   BUILD RENDER ITEMS
====================================================== */

  const renderItems: Array<
    | {
        type: "message";
        message: any;
        index: number;
      }
    | {
        type: "image-group";
        groupId: string;
        messages: any[];
        startIndex: number;
      }
  > = [];

  for (let i = 0; i < messages.length; i++) {
    const current = messages[i];

    const isImage =
      (current.type === "image" || current.type === "IMAGE") && current.groupId;

    if (!isImage) {
      renderItems.push({
        type: "message",
        message: current,
        index: i,
      });

      continue;
    }

    const group = [current];

    let j = i + 1;

    while (j < messages.length) {
      const next = messages[j];

      const sameGroup =
        (next.type === "image" || next.type === "IMAGE") &&
        next.groupId === current.groupId;

      if (!sameGroup) {
        break;
      }

      group.push(next);

      j++;
    }

    if (group.length === 1) {
      renderItems.push({
        type: "message",
        message: current,
        index: i,
      });
    } else {
      renderItems.push({
        type: "image-group",
        groupId: current.groupId,
        messages: group,
        startIndex: i,
      });
    }

    i = j - 1;
  }

  return (
    <>
      {loading && <p className="text-sm text-white/50">Loading chat...</p>}

      {error && <p className="text-sm text-red-400">{error}</p>}

      {!loading &&
        !error &&
        renderItems.map((item) => {
          if (item.type === "message") {
            const msg = item.message;
            const index = item.index;

            return (
              <MessageBubble
                key={msg._id}
                msg={msg}
                index={index}
                messages={messages}
                userId={userId}
                deliveredMessages={deliveredMessages}
                handleReactToMessage={handleReactToMessage}
                setSelectedMessageId={setSelectedMessageId}
                setActionsOpen={setActionsOpen}
                setMapPickerOpen={setMapPickerOpen}
                setSelectedMapLocation={setSelectedMapLocation}
                setImageViewerOpen={setImageViewerOpen}
                setSelectedImages={setSelectedImages}
                setSelectedImageIndex={setSelectedImageIndex}
                onContextMenu={(e) => {
                  const canDelete = msg.senderId === userId && !msg.isDeleted;

                  if (!canDelete) {
                    return;
                  }

                  e.preventDefault();

                  setSelectedMessageId(msg._id);

                  setActionsOpen(true);
                }}
              />
            );
          }

          return (
            <ChatImageGroup
              key={`group-${item.groupId}`}
              messages={item.messages}
              onOpenImage={(messages, index) => {
                setSelectedImages(messages);

                setSelectedImageIndex(index);

                setImageViewerOpen(true);
              }}
            />
          );
        })}

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

      <div ref={bottomRef} className="h-4 shrink-0" />
    </>
  );
}
