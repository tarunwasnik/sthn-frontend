// frontend/src/pages/ChatPage.tsx

import { useEffect, useRef, useState } from "react";
import {
  useParams,
  useNavigate,
} from "react-router-dom";

import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { socket } from "../lib/socket";

import UserDashboardLayout from "../layouts/UserDashboardLayout";
import DashboardLayout from "../layouts/DashboardLayout";

interface ChatMessage {
  _id: string;
  bookingId: string;
  senderId: string;
  senderRole: "USER" | "CREATOR";
  message: string;
  createdAt: string;
}

export default function ChatPage() {
  const { bookingId } = useParams();

  const navigate = useNavigate();

  const { role } = useAuth();

  const Layout =
    role === "creator"
      ? DashboardLayout
      : UserDashboardLayout;

  const [messages, setMessages] =
    useState<ChatMessage[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] = useState<
    string | null
  >(null);

  const [input, setInput] =
    useState("");

  const [sending, setSending] =
    useState(false);

  const [chatClosed, setChatClosed] =
    useState(false);

  const [slotText, setSlotText] =
    useState("");

  const [clientName, setClientName] =
    useState("User");

  const [avatarUrl, setAvatarUrl] =
    useState<string | null>(null);

  const bottomRef =
    useRef<HTMLDivElement | null>(null);

  /* ================= FETCH CHAT ================= */

  const fetchChats = async () => {
    try {
      setLoading(true);

      setError(null);

      const res = await api.get(
        `/v1/chat/${bookingId}/messages`
      );

      setMessages(res.data.chats || []);

      await api.post(
        `/v1/chat/${bookingId}/seen`
      );

      socket.emit("chat:seen", {
        bookingId,
      });
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Failed to load chat"
      );
    } finally {
      setLoading(false);
    }
  };

  /* ================= FETCH BOOKING ================= */

  const fetchBookingDetails =
    async () => {
      try {
        let booking = null;

        try {
          const userRes = await api.get(
            "/v1/user/bookings"
          );

          booking =
            userRes.data.bookings.find(
              (b: any) =>
                b._id === bookingId
            );
        } catch {}

        if (!booking) {
          try {
            const creatorRes =
              await api.get(
                "/v1/creator/bookings"
              );

            booking =
              creatorRes.data.bookings.find(
                (b: any) =>
                  b._id === bookingId
              );
          } catch {}
        }

        if (!booking) return;

        const slots = booking.slots || [];

        if (slots.length > 0) {
          const start = new Date(
            slots[0].startTime
          );

          const end = new Date(
            slots[
              slots.length - 1
            ].endTime
          );

          const formatted = `${start.toLocaleDateString(
            [],
            {
              day: "2-digit",
              month: "short",
            }
          )} • ${start.toLocaleTimeString(
            [],
            {
              hour: "2-digit",
              minute: "2-digit",
            }
          )} - ${end.toLocaleTimeString(
            [],
            {
              hour: "2-digit",
              minute: "2-digit",
            }
          )}`;

          setSlotText(formatted);

          if (
            Date.now() > end.getTime()
          ) {
            setChatClosed(true);
          }
        }

        if (
          booking.creator?.profile
        ) {
          setClientName(
            booking.creator.profile
              .displayName || "Creator"
          );

          setAvatarUrl(
            booking.creator.profile
              .avatarUrl || null
          );
        }

        if (
          booking.user?.profile
        ) {
          setClientName(
            booking.user.profile
              .username || "User"
          );

          setAvatarUrl(
            booking.user.profile
              .avatar || null
          );
        }
      } catch (err) {
        console.error(
          "Failed to fetch booking details"
        );
      }
    };

  /* ================= INITIAL ================= */

  useEffect(() => {
    if (!bookingId) return;

    fetchChats();

    fetchBookingDetails();
  }, [bookingId]);

  /* ================= SOCKET ================= */

  useEffect(() => {
    if (!bookingId) return;

    socket.emit(
      "join-booking",
      bookingId
    );

    const handleMessage = (
      msg: ChatMessage
    ) => {
      setMessages((prev) => {
        const exists = prev.find(
          (m) => m._id === msg._id
        );

        if (exists) return prev;

        const isMine =
          (role === "user" &&
            msg.senderRole ===
              "USER") ||
          (role === "creator" &&
            msg.senderRole ===
              "CREATOR");

        if (isMine) return prev;

        return [...prev, msg];
      });

      api.post(
        `/v1/chat/${bookingId}/seen`
      );

      socket.emit("chat:seen", {
        bookingId,
      });
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
  }, [bookingId, role]);

  /* ================= AUTO SCROLL ================= */

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  /* ================= SEND ================= */

  const handleSend = async () => {
    if (
      !input.trim() ||
      !bookingId ||
      sending ||
      chatClosed
    ) {
      return;
    }

    const messageText =
      input.trim();

    setInput("");

    setSending(true);

    const tempMessage: ChatMessage =
      {
        _id:
          "temp-" + Date.now(),

        bookingId,

        senderId: "temp",

        senderRole:
          role === "creator"
            ? "CREATOR"
            : "USER",

        message: messageText,

        createdAt:
          new Date().toISOString(),
      };

    setMessages((prev) => [
      ...prev,
      tempMessage,
    ]);

    try {
      const res = await api.post(
        `/v1/chat/${bookingId}/messages`,
        {
          message: messageText,
        }
      );

      const saved = res.data.chat;

      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === tempMessage._id
            ? saved
            : msg
        )
      );
    } catch (err: any) {
      setMessages((prev) =>
        prev.filter(
          (m) =>
            m._id !== tempMessage._id
        )
      );

      const msg =
        err?.response?.data
          ?.message ||
        "Failed to send message";

      if (
        msg
          .toLowerCase()
          .includes(
            "chat is closed"
          ) ||
        msg
          .toLowerCase()
          .includes(
            "booking time has ended"
          )
      ) {
        setChatClosed(true);
      }

      alert(msg);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (
      e.key === "Enter" &&
      !sending
    ) {
      handleSend();
    }
  };

  const getInitials = (
    name: string
  ) => {
    if (!name) return "U";

    const parts = name
      .trim()
      .split(" ");

    return parts.length === 1
      ? parts[0][0].toUpperCase()
      : (
          parts[0][0] +
          parts[1][0]
        ).toUpperCase();
  };

  return (
    <Layout>
      <div className="h-[calc(90vh-80px)] flex flex-col text-[#F8FAFC]">

        {/* HEADER */}

        <div
          className="
            sticky top-0 z-20
            rounded-[28px]
            border border-white/10
            bg-black
            backdrop-blur-xl
            shadow-[0_10px_30px_rgba(0,0,0,0.35)]
            px-4 sm:px-5
            py-4
            mb-3
          "
        >
          <div className="flex items-center justify-between gap-4">

            <div className="flex items-center gap-3 min-w-0">

              <button
                onClick={() =>
                  navigate(-1)
                }
              >
                ←
              </button>

              <div className="relative shrink-0">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="avatar"
                    className="
                      w-11 h-11
                      rounded-full
                      object-cover
                      border border-white/10
                    "
                  />
                ) : (
                  <div
                    className="
                      w-11 h-11
                      rounded-full
                      bg-white/[0.06]
                      border border-white/10
                      flex items-center justify-center
                      text-sm font-semibold
                    "
                  >
                    {getInitials(
                      clientName
                    )}
                  </div>
                )}
              </div>

              <div className="min-w-0">
                <h2 className="text-[15px] sm:text-[16px] font-semibold truncate">
                  {clientName}
                </h2>

                <p className="text-[11px] sm:text-xs text-white/45 truncate">
                  {chatClosed
                    ? "Chat closed"
                    : slotText ||
                      "Loading booking..."}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CHAT */}

        <div
          className="
            flex-1 overflow-y-auto
            rounded-[28px]
            border border-white/10
            bg-black
            backdrop-blur-xl
            shadow-[0_10px_30px_rgba(0,0,0,0.35)]
            px-3 sm:px-5
            py-4
            space-y-4
          "
        >

          {loading && (
            <p className="text-sm text-white/50">
              Loading chat...
            </p>
          )}

          {!loading &&
            !error &&
            messages.map((msg) => {
              const isMine =
                (role === "user" &&
                  msg.senderRole ===
                    "USER") ||
                (role === "creator" &&
                  msg.senderRole ===
                    "CREATOR");

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
                      max-w-[85%]
                      sm:max-w-[70%]
                      rounded-[24px]
                      px-4 py-3
                      border
                      shadow-[0_4px_20px_rgba(0,0,0,0.25)]
                      ${
                        isMine
                          ? `
                            bg-white/[0.08]
                            border-white/10
                            text-white
                            rounded-br-md
                          `
                          : `
                            bg-white/[0.04]
                            border-white/10
                            text-white/90
                            rounded-bl-md
                          `
                      }
                    `}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                      {msg.message}
                    </p>

                    <div
                      className={`
                        mt-2
                        text-[10px]
                        ${
                          isMine
                            ? "text-white/45 text-right"
                            : "text-white/35"
                        }
                      `}
                    >
                      {new Date(
                        msg.createdAt
                      ).toLocaleTimeString(
                        [],
                        {
                          hour:
                            "2-digit",
                          minute:
                            "2-digit",
                        }
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

          <div ref={bottomRef} />
        </div>

        {/* INPUT */}

        <div
          className="
            mt-3
            rounded-[28px]
            border border-white/10
            bg-black
            backdrop-blur-xl
            shadow-[0_10px_30px_rgba(0,0,0,0.35)]
            p-3
          "
        >
          <div className="flex items-end gap-3">

            <input
              type="text"
              value={input}
              onChange={(e) =>
                setInput(
                  e.target.value
                )
              }
              onKeyDown={
                handleKeyDown
              }
              disabled={
                chatClosed
              }
              placeholder={
                chatClosed
                  ? "Chat closed"
                  : "Type a message..."
              }
              className="
                flex-1
                bg-white/[0.04]
                border border-white/10
                rounded-2xl
                px-4 py-3
                text-sm
                text-white
                placeholder:text-white/35
                focus:outline-none
                focus:border-white/20
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
                h-[48px]
                px-5
                rounded-2xl
                border border-white/10
                bg-white/[0.08]
                hover:bg-white/[0.12]
                disabled:opacity-40
                text-sm font-medium
              "
            >
              {sending
                ? "Sending..."
                : "Send"}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}