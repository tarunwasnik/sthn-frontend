// frontend/src/pages/ChatPage.tsx
import UserDashboardLayout from "../layouts/UserDashboardLayout";
import DashboardLayout from "../layouts/DashboardLayout";


import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  useParams,
  useNavigate,
} from "react-router-dom";

import api from "../api/axios";

import {
  getConversations,
} from "../api/chat";

import type {
  Conversation,
} from "../api/chat";

import { useAuth } from "../context/AuthContext";

import { socket } from "../lib/socket";



interface ChatMessage {
  _id: string;
  bookingId: string;
  senderId: string;
  senderRole: "USER" | "CREATOR";
  message: string;
  createdAt: string;
}

export default function ChatPage() {
  const { bookingId } =
    useParams();

  const navigate =
    useNavigate();

  const { role } =
    useAuth();

  const Layout =
    role === "creator"
      ? DashboardLayout
      : UserDashboardLayout;

  const [
    messages,
    setMessages,
  ] = useState<
    ChatMessage[]
  >([]);

  const [
    conversation,
    setConversation,
  ] = useState<Conversation | null>(
    null
  );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(
      null
    );

  const [input, setInput] =
    useState("");

  const [sending, setSending] =
    useState(false);

  const [
    chatClosed,
    setChatClosed,
  ] = useState(false);

  const [slotText, setSlotText] =
    useState("");

  const bottomRef =
    useRef<HTMLDivElement | null>(
      null
    );

  const messagesContainerRef =
    useRef<HTMLDivElement | null>(
      null
    );

  const shouldAutoScrollRef =
    useRef(true);

  /* ======================================================
     FETCH CHAT
  ====================================================== */

  const fetchChats =
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

        await api.post(
          `/v1/chat/${bookingId}/seen`
        );

        socket.emit(
          "chat:seen",
          {
            bookingId,
          }
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

  /* ======================================================
     FETCH CONVERSATION
  ====================================================== */

  const fetchConversation =
    async () => {
      try {
        const conversations =
          await getConversations();

        const matched =
          conversations.find(
            (c) =>
              c.bookingId ===
              bookingId
          ) || null;

        setConversation(
          matched
        );
      } catch (err) {
        console.error(
          "Failed to fetch conversation"
        );
      }
    };

  /* ======================================================
     FETCH BOOKING DETAILS
  ====================================================== */

  const fetchBookingDetails =
    async () => {
      try {
        let booking = null;

        try {
          const userRes =
            await api.get(
              "/v1/user/bookings"
            );

          booking =
            userRes.data.bookings.find(
              (b: any) =>
                b._id ===
                bookingId
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
                  b._id ===
                  bookingId
              );
          } catch {}
        }

        if (!booking) return;

        const slots =
          booking.slots || [];

        if (
          slots.length > 0
        ) {
          const start =
            new Date(
              slots[0]
                .startTime
            );

          const end =
            new Date(
              slots[
                slots.length -
                  1
              ].endTime
            );

          const formatted = `${start.toLocaleDateString(
            [],
            {
              day: "2-digit",
              month:
                "short",
            }
          )} • ${start.toLocaleTimeString(
            [],
            {
              hour:
                "2-digit",
              minute:
                "2-digit",
            }
          )} - ${end.toLocaleTimeString(
            [],
            {
              hour:
                "2-digit",
              minute:
                "2-digit",
            }
          )}`;

          setSlotText(
            formatted
          );

          if (
            Date.now() >
            end.getTime()
          ) {
            setChatClosed(
              true
            );
          }
        }
      } catch (err) {
        console.error(
          "Failed to fetch booking details"
        );
      }
    };

  /* ======================================================
     INITIAL LOAD
  ====================================================== */

  useEffect(() => {
    if (!bookingId)
      return;

    const init =
      async () => {
        await Promise.all([
          fetchChats(),
          fetchBookingDetails(),
          fetchConversation(),
        ]);
      };

    init();
  }, [bookingId]);

  /* ======================================================
     SOCKET
  ====================================================== */

  useEffect(() => {
    if (!bookingId)
      return;

    socket.emit(
      "join-booking",
      bookingId
    );

    const handleMessage =
      (
        msg: ChatMessage
      ) => {
        setMessages(
          (prev) => {
            const exists =
              prev.find(
                (m) =>
                  m._id ===
                  msg._id
              );

            if (exists)
              return prev;

            const isMine =
              (role ===
                "user" &&
                msg.senderRole ===
                  "USER") ||
              (role ===
                "creator" &&
                msg.senderRole ===
                  "CREATOR");

            if (isMine)
              return prev;

            return [
              ...prev,
              msg,
            ];
          }
        );

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
  }, [bookingId, role]);

  /* ======================================================
     SCROLL LOGIC
  ====================================================== */

  const scrollToBottom =
    (
      behavior:
        | ScrollBehavior
        | undefined = "smooth"
    ) => {
      bottomRef.current?.scrollIntoView(
        {
          behavior,
        }
      );
    };

  const handleScroll =
    () => {
      const container =
        messagesContainerRef.current;

      if (!container)
        return;

      const threshold = 120;

      const isNearBottom =
        container.scrollHeight -
          container.scrollTop -
          container.clientHeight <
        threshold;

      shouldAutoScrollRef.current =
        isNearBottom;
    };

  useEffect(() => {
    if (
      shouldAutoScrollRef.current
    ) {
      requestAnimationFrame(
        () => {
          scrollToBottom(
            "smooth"
          );
        }
      );
    }
  }, [messages]);

  useEffect(() => {
    requestAnimationFrame(
      () => {
        scrollToBottom(
          "auto"
        );
      }
    );
  }, []);

  /* ======================================================
     SEND
  ====================================================== */

  const handleSend =
    async () => {
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

      shouldAutoScrollRef.current =
        true;

      const tempMessage: ChatMessage =
        {
          _id:
            "temp-" +
            Date.now(),

          bookingId,

          senderId: "temp",

          senderRole:
            role ===
            "creator"
              ? "CREATOR"
              : "USER",

          message:
            messageText,

          createdAt:
            new Date().toISOString(),
        };

      setMessages(
        (prev) => [
          ...prev,
          tempMessage,
        ]
      );

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

        setMessages(
          (prev) =>
            prev.map(
              (msg) =>
                msg._id ===
                tempMessage._id
                  ? saved
                  : msg
            )
        );
      } catch (err: any) {
        setMessages(
          (prev) =>
            prev.filter(
              (m) =>
                m._id !==
                tempMessage._id
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
          setChatClosed(
            true
          );
        }

        alert(msg);
      } finally {
        setSending(false);
      }
    };

  /* ======================================================
     ENTER SEND
  ====================================================== */

  const handleKeyDown =
    (
      e: React.KeyboardEvent<HTMLInputElement>
    ) => {
      if (
        e.key ===
          "Enter" &&
        !sending
      ) {
        handleSend();
      }
    };

  /* ======================================================
     HELPERS
  ====================================================== */

  const getInitials =
    (name: string) => {
      if (!name)
        return "U";

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

  const profile =
    conversation?.otherUser
      ?.profile;

  const displayName =
    profile?.displayName ||
    profile?.username ||
    "User";

  const avatarUrl =
    profile?.avatarUrl ||
    profile?.avatar ||
    profile
      ?.profilePhotos?.[0] ||
    null;

  const serviceTitle =
    conversation?.service
      ?.title ||
    "Service";

  /* ======================================================
     UI
  ====================================================== */

  return (
    <Layout>

      <div
  className="
    fixed
    inset-0
    md:left-[260px]
    top-[56px]
    md:top-[70px]
    bottom-0
    flex
    flex-col
    overflow-hidden
    text-[#F8FAFC]
    px-2
    md:px-6
    py-2
    
  "
>

        {/* HEADER */}

        <div
          className="
            shrink-0
            rounded-[24px]
            border border-white/10
            bg-gradient-to-br
            from-white/[0.045]
            to-white/[0.015]
            backdrop-blur-xl
            px-3 sm:px-5
            py-2
            mb-2
          "
        >

          <div className="flex items-center gap-3 min-w-0">

            <button
              onClick={() =>
                navigate(-1)
              }
              className="
                shrink-0
                text-white/80
                hover:text-white
                transition-colors
              "
            >
              ←
            </button>

            {/* AVATAR */}

            <div className="relative shrink-0">

              {avatarUrl ? (

                <img
                  src={avatarUrl}
                  alt="avatar"
                  className="
                    w-9
                    h-9
                    rounded-full
                    object-cover
                    border border-white/10
                  "
                />

              ) : (

                <div
                  className="
                    w-9
                    h-9
                    rounded-full
                    bg-white/[0.06]
                    border border-white/10
                    flex items-center justify-center
                    text-sm font-semibold
                  "
                >

                  {getInitials(
                    displayName
                  )}

                </div>
              )}

            </div>

            {/* CONTENT */}

            <div className="min-w-0">

              <h2
                className="
                  text-[15px]
                  sm:text-[16px]
                  font-semibold
                  truncate
                "
              >
                {displayName}
              </h2>

              <div className="mt-[2px] space-y-[2px]">

                <p
                  className="
                    text-[10px]
                    text-white/40
                    truncate
                    leading-none
                  "
                >
                  {serviceTitle}
                </p>

                <p
                  className="
                    text-[11px]
                    sm:text-xs
                    text-white/50
                    truncate
                  "
                >
                  {chatClosed
                    ? "Chat closed"
                    : slotText ||
                      "Booking active"}
                </p>

              </div>

            </div>

          </div>

        </div>

        {/* CHAT BODY */}

<div
  ref={
    messagesContainerRef
  }
  onScroll={
    handleScroll
  }
  className="
    chat-scrollbar
    scroll-smooth
    contain-strict
    flex-[0.86]
    min-h-0
    h-0
    overflow-y-auto
    overflow-x-hidden
    overscroll-contain
    rounded-[22px]
    pr-1
    [mask-image:linear-gradient(to_bottom,black,black)]
    border border-white/10
    bg-gradient-to-br
    from-white/[0.045]
    to-white/[0.015]
    backdrop-blur-xl
    px-3
    md:px-5
    py-3
  "
>

          <div
            className="
              flex
              flex-col
              gap-0
              min-h-full
            "
          >

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
              messages.map(
                (
                  msg,
                  index
                ) => {

                  const isMine =
                    (role ===
                      "user" &&
                      msg.senderRole ===
                        "USER") ||
                    (role ===
                      "creator" &&
                      msg.senderRole ===
                        "CREATOR");

                  return (

                    <div
                      key={msg._id}
                      className={`
                        flex
                        ${
                          isMine
                            ? "justify-end"
                            : "justify-start"
                        }
                        ${
                          index > 0 &&
                          messages[
                            index -
                              1
                          ]
                            .senderRole ===
                            msg.senderRole
                            ? "mt-1"
                            : "mt-3"
                        }
                      `}
                    >

                      <div
                        className={`
                          max-w-[82%]
                          md:max-w-[68%]
                          rounded-2xl
                          px-3.5
                          py-2
                          border
                          ${
                            isMine
                              ? `
                                bg-white/[0.075]
                                border-white/[0.08]
                                text-white
                                rounded-br-md
                              `
                              : `
                                bg-white/[0.04]
                                border-white/[0.05]
                                text-white/90
                                rounded-bl-md
                              `
                          }
                        `}
                      >

                        <p
                          className="
                            text-[14px]
                            leading-relaxed
                            whitespace-pre-wrap
                            break-words
                          "
                        >
                          {msg.message}
                        </p>

                        <div
                          className={`
                            mt-1
                            text-[10px]
                            leading-none
                            ${
                              isMine
                                ? "text-white/40 text-right"
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
                }
              )}

            <div
              ref={bottomRef}
              className="h-4 shrink-0"
            />

          </div>

        </div>

        {/* INPUT */}

        <div
          className="
            mt-2
            shrink-0
            rounded-[20px]
            border border-white/10
            bg-gradient-to-br
            from-white/[0.045]
            to-white/[0.015]
            backdrop-blur-xl
            px-2
            py-1.5
          "
        >

          <div className="flex items-end gap-2">

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
                min-w-0
                bg-white/[0.04]
                border border-white/10
                rounded-[18px]
                px-4
                py-2.5
                text-[14px]
                text-white
                placeholder:text-white/35
                focus:outline-none
                focus:border-white/15
                transition-all
                disabled:opacity-50
              "
            />

            <button
              onClick={
                handleSend
              }
              disabled={
                sending ||
                !input.trim() ||
                chatClosed
              }
              className="
                h-[40px]
                px-4
                shrink-0
                rounded-[18px]
                border border-white/10
                bg-white/[0.07]
                hover:bg-white/[0.1]
                active:scale-[0.98]
                transition-all
                disabled:opacity-40
                text-[13px]
                font-medium
              "
            >

              {sending
                ? "Sending..."
                : "Send"}

            </button>

          </div>

        </div>

        {/* SCROLLBAR */}

        {/* SCROLLBAR */}

<style>
  {`
    .chat-scrollbar {
      scrollbar-width: thin;
      scrollbar-color: rgba(255,255,255,0.10) transparent;
    }

    .chat-scrollbar::-webkit-scrollbar {
      width: 4px;
    }

    .chat-scrollbar::-webkit-scrollbar-track {
      background: transparent;
      margin-block: 12px;
    }

    .chat-scrollbar::-webkit-scrollbar-thumb {
      background: rgba(255,255,255,0.10);
      border-radius: 999px;
    }

    .chat-scrollbar::-webkit-scrollbar-thumb:hover {
      background: rgba(255,255,255,0.16);
    }
  `}
   </style>

      </div>

    </Layout>
  );
}