// frontend/src/components/chat/ChatPanel.tsx

import {
  useEffect,
  useState,
} from "react";

import api from "../../api/axios";
import { socket } from "../../lib/socket";

interface ChatMessage {
  _id: string;
  bookingId: string;
  senderId: string;
  senderRole: "USER" | "CREATOR";
  message: string;
  createdAt: string;
}

interface ChatPanelProps {
  bookingId: string;
  embedded?: boolean;
  onClose?: () => void;
}

export default function ChatPanel({
  bookingId,
  embedded = false,
  onClose,
}: ChatPanelProps) {
  const [messages, setMessages] =
    useState<ChatMessage[]>([]);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [input, setInput] =
    useState("");

  const [sending, setSending] =
    useState(false);

  const [chatClosed, setChatClosed] =
    useState(false);

  /* ======================================================
     FETCH MESSAGES
  ====================================================== */

  useEffect(() => {
    if (!bookingId) return;

    const fetchMessages =
      async () => {
        try {
          setLoading(true);
          setError(null);

          const res =
            await api.get(
              `/v1/chat/${bookingId}/messages`
            );

          setMessages(
            res.data.chats || []
          );
        } catch (err: any) {
          setError(
            err?.response?.data
              ?.message ||
              "Failed to load chat"
          );
        } finally {
          setLoading(false);
        }
      };

    fetchMessages();
  }, [bookingId]);

  /* ======================================================
   SOCKET
====================================================== */

useEffect(() => {
  if (!bookingId) return;

  socket.emit(
    "join-booking",
    bookingId
  );

  const handleMessage = (
    msg: ChatMessage
  ) => {

 console.log(
    "CHAT MESSAGE RECEIVED",
    msg
  );


    setMessages((prev) => {
      const exists =
        prev.find(
          (m) =>
            m._id === msg._id
        );

      if (exists)
        return prev;

      return [
        ...prev,
        msg,
      ];
    });

    api.post(
      `/v1/chat/${bookingId}/seen`
    );

    socket.emit(
      "chat:seen",
      {
        bookingId,
      }
    );
  };

  socket.on(
    "chat:message",
    handleMessage
  );

  return () => {
    socket.emit(
      "leave-booking",
      bookingId
    );

    socket.off(
      "chat:message",
      handleMessage
    );
  };
}, [bookingId]);

  /* ======================================================
     SEND MESSAGE
  ====================================================== */

  const handleSend =
    async () => {
      if (
        !input.trim() ||
        sending ||
        chatClosed
      ) {
        return;
      }

      const messageText =
        input.trim();

      setSending(true);

      try {
        const res =
          await api.post(
            `/v1/chat/${bookingId}/messages`,
            {
              message:
                messageText,
            }
          );

        const saved =
          res.data.chat;

        setMessages((prev) => [
          ...prev,
          saved,
        ]);

        setInput("");
      } catch (err: any) {
        alert(
          err?.response?.data
            ?.message ||
            "Failed to send message"
        );
      } finally {
        setSending(false);
      }
    };

  return (
    <div className="h-full flex flex-col text-[#F8FAFC]">

      {/* HEADER */}

      <div
        className="
          shrink-0
          rounded-t-[28px]
          border-b border-white/10
          px-4
          py-3
        "
      >
        <div className="flex items-center justify-between">

          <div>
            <h2 className="font-semibold">
              Chat
            </h2>

            <p className="text-xs text-white/50">
              Booking {bookingId}
            </p>
          </div>

          {embedded && onClose && (
            <button
              onClick={onClose}
              className="
                text-sm
                text-white/70
                hover:text-white
              "
            >
              Close
            </button>
          )}

        </div>
      </div>

      {/* MESSAGES */}

      <div
        className="
          flex-1
          overflow-y-auto
          px-4
          py-4
        "
      >
        <div className="space-y-3">

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
            messages.map((msg) => {
              const isMine =
                msg.senderRole === "USER";

              return (
                <div
                  key={msg._id}
                  className={`flex ${
                    isMine
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >
                  <div
                    className={`
                      max-w-[80%]
                      rounded-2xl
                      px-3
                      py-2
                      border
                      ${
                        isMine
                          ? `
                            bg-white/[0.08]
                            border-white/[0.10]
                          `
                          : `
                            bg-white/[0.04]
                            border-white/[0.08]
                          `
                      }
                    `}
                  >
                    <p>{msg.message}</p>
                  </div>
                </div>
              );
            })}

        </div>
      </div>

      {/* INPUT */}

      <div
        className="
          shrink-0
          border-t border-white/10
          p-3
        "
      >
        <div className="flex gap-2">

          <input
            value={input}
            onChange={(e) =>
              setInput(
                e.target.value
              )
            }
            onKeyDown={(e) => {
              if (
                e.key === "Enter" &&
                !sending
              ) {
                handleSend();
              }
            }}
            disabled={chatClosed}
            placeholder={
              chatClosed
                ? "Chat closed"
                : "Type a message..."
            }
            className="
              flex-1
              rounded-xl
              bg-white/[0.04]
              border border-white/10
              px-3
              py-2
              text-sm
              focus:outline-none
              disabled:opacity-50
            "
          />

          <button
            onClick={handleSend}
            disabled={
              sending ||
              !input.trim() ||
              chatClosed
            }
            className="
              px-4
              rounded-xl
              border border-white/10
              bg-white/[0.08]
              disabled:opacity-40
            "
          >
            {sending
              ? "Sending..."
              : "Send"}
          </button>

        </div>
      </div>

    </div>
  );
}