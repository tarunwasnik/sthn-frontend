//frontend/src/components/chat/ChatImageGroup.tsx

import ChatImage from "./ChatImage";

interface ChatImageGroupProps {
  messages: any[];

  onOpenImage: (messages: any[], index: number) => void;
}

export default function ChatImageGroup({
  messages,
  onOpenImage,
}: ChatImageGroupProps) {
  const count = messages.length;

  if (count === 2) {
    return (
      <div
        className="
          grid
          grid-cols-2
          gap-1
        "
      >
        {messages.map((msg, index) => (
          <ChatImage
            key={msg._id}
            msg={msg}
            variant="group"
            onOpen={() => onOpenImage(messages, index)}
          />
        ))}
      </div>
    );
  }

  if (count === 3) {
    return (
      <div
        className="
          grid
          grid-cols-2
          gap-1
        "
      >
        {messages.map((msg, index) => (
          <ChatImage
            key={msg._id}
            msg={msg}
            variant="group"
            onOpen={() => onOpenImage(messages, index)}
          />
        ))}
      </div>
    );
  }

  if (count === 4) {
    return (
      <div
        className="
          grid
          grid-cols-2
          gap-1
        "
      >
        {messages.map((msg, index) => (
          <ChatImage
            key={msg._id}
            msg={msg}
            variant="group"
            onOpen={() => onOpenImage(messages, index)}
          />
        ))}
      </div>
    );
  }

  const visible = messages.slice(0, 4);

  const remaining = count - 4;

  return (
    <div
      className="
        grid
        grid-cols-2
        gap-1
      "
    >
      {visible.map((msg, index) => {
        if (index === 3) {
          return (
            <div
              key={msg._id}
              className="
                relative
              "
            >
              <ChatImage
                msg={msg}
                variant="group"
                onOpen={() => onOpenImage(messages, index)}
              />

              <button
                type="button"
                onClick={() => onOpenImage(messages, index)}
                className="
                  absolute
                  inset-0
                  flex
                  items-center
                  justify-center
                  bg-black/55
                  text-white
                  text-2xl
                  font-semibold
                "
              >
                +{remaining}
              </button>
            </div>
          );
        }

        return (
          <ChatImage
            key={msg._id}
            msg={msg}
            variant="group"
            onOpen={() => onOpenImage(messages, index)}
          />
        );
      })}
    </div>
  );
}
