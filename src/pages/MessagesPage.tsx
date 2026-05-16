
// frontend/src/pages/MessagesPage.tsx

import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import UserDashboardLayout from "../layouts/UserDashboardLayout";
import DashboardLayout from "../layouts/DashboardLayout";

import { getConversations } from "../api/chat";
import type { Conversation } from "../api/chat";

import { socket } from "../lib/socket";

export default function MessagesPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const isCreator = location.pathname.includes("/creator");

  const [conversations, setConversations] = useState<
    Conversation[]
  >([]);

  const [loading, setLoading] = useState(true);

  const fetchConversations = async () => {
    try {
      setLoading(true);

      const data = await getConversations();

      setConversations(data);
    } catch (err) {
      console.error(
        "Failed to load conversations",
        err
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  /* ================= REALTIME ================= */

  useEffect(() => {
    const handleMessage = (msg: any) => {
      setConversations((prev) => {
        const index = prev.findIndex(
          (c) => c.bookingId === msg.bookingId
        );

        if (index === -1) return prev;

        const updated = [...prev];

        updated[index] = {
          ...updated[index],
          lastMessage: msg.message,
          lastMessageAt: msg.createdAt,
          unreadCount:
            updated[index].unreadCount + 1,
        };

        const [moved] = updated.splice(
          index,
          1
        );

        updated.unshift(moved);

        return updated;
      });
    };

    const handleSeen = (data: any) => {
      if (!data?.bookingId) return;

      setConversations((prev) =>
        prev.map((c) =>
          c.bookingId === data.bookingId
            ? {
                ...c,
                unreadCount: 0,
              }
            : c
        )
      );
    };

    socket.on(
      "chat:message",
      handleMessage
    );

    socket.on(
      "chat:seen",
      handleSeen
    );

    return () => {
      socket.off(
        "chat:message",
        handleMessage
      );

      socket.off(
        "chat:seen",
        handleSeen
      );
    };
  }, []);

  /* ================= HELPERS ================= */

  const openChat = (
    bookingId: string
  ) => {
    navigate(
      `/dashboard/chat/${bookingId}`
    );
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

  /* ================= UI ================= */

  const renderContent = () => (
    <div className="min-h-screen text-[#F8FAFC]">
      <div className="max-w-5xl mx-auto px-3 sm:px-5 lg:px-6 py-4 sm:py-6">

        {/* ================= HEADER ================= */}

        <div className="mb-5 sm:mb-6">
          <div
            className="
              rounded-[30px]
              border border-white/10
              bg-[rgba(10,10,15,0.92)]
              backdrop-blur-xl
              shadow-[0_10px_30px_rgba(0,0,0,0.35)]
              px-5 sm:px-6
              py-5
            "
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <h1 className="text-[28px] sm:text-[32px] font-semibold tracking-tight text-[#F8FAFC]">
                  Messages
                </h1>

                <p className="mt-1 text-sm text-white/50">
                  Manage conversations and booking chats
                </p>
              </div>

              <div
                className="
                  hidden sm:flex
                  items-center justify-center
                  rounded-2xl
                  border border-white/10
                  bg-white/[0.03]
                  px-4 py-2
                "
              >
                <span className="text-sm text-white/70">
                  {conversations.length} Conversation
                  {conversations.length !== 1
                    ? "s"
                    : ""}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ================= LOADING ================= */}

        {loading && (
          <div className="space-y-3">
            {[...Array(5)].map(
              (_, index) => (
                <div
                  key={index}
                  className="
                    rounded-[28px]
                    border border-white/10
                    bg-[rgba(10,10,15,0.92)]
                    backdrop-blur-xl
                    shadow-[0_10px_30px_rgba(0,0,0,0.35)]
                    p-4 sm:p-5
                    animate-pulse
                  "
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-white/10" />

                    <div className="flex-1 min-w-0">
                      <div className="h-4 w-40 rounded bg-white/10 mb-3" />

                      <div className="h-3 w-24 rounded bg-white/5 mb-2" />

                      <div className="h-3 w-56 rounded bg-white/5" />
                    </div>

                    <div className="h-3 w-14 rounded bg-white/10" />
                  </div>
                </div>
              )
            )}
          </div>
        )}

        {/* ================= EMPTY ================= */}

        {!loading &&
          conversations.length === 0 && (
            <div
              className="
                rounded-[30px]
                border border-white/10
                bg-[rgba(10,10,15,0.92)]
                backdrop-blur-xl
                shadow-[0_10px_30px_rgba(0,0,0,0.35)]
                px-6 py-14
                text-center
              "
            >
              <div
                className="
                  w-16 h-16
                  mx-auto mb-5
                  rounded-full
                  border border-white/10
                  bg-white/[0.04]
                  flex items-center justify-center
                "
              >
                <svg
                  className="w-7 h-7 text-white/50"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.7}
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-4l-4 4v-4z"
                  />
                </svg>
              </div>

              <h2 className="text-xl font-semibold text-[#F8FAFC]">
                No conversations yet
              </h2>

              <p className="mt-2 text-sm text-white/50 max-w-md mx-auto">
                Your active booking conversations will appear here once messaging starts.
              </p>
            </div>
          )}

        {/* ================= CONVERSATIONS ================= */}

        {!loading &&
          conversations.length > 0 && (
            <div className="space-y-3">
              {conversations.map((c) => {

                const profile =
                  c.otherUser?.profile;

                const displayName =
                  profile?.displayName ||
                  profile?.username ||
                  "User";

                const avatarUrl =
                  profile?.avatarUrl ||
                  profile?.avatar ||
                  null;

                return (
                  <div
                    key={c.bookingId}
                    onClick={() =>
                      openChat(c.bookingId)
                    }
                    className="
                      group
                      cursor-pointer
                      rounded-[28px]
                      border border-white/10
                      bg-[rgba(10,10,15,0.92)]
                      backdrop-blur-xl
                      shadow-[0_10px_30px_rgba(0,0,0,0.35)]
                      hover:bg-[rgba(16,16,22,0.96)]
                      hover:border-white/15
                      transition-all duration-200
                    "
                  >
                    <div className="p-4 sm:p-5">
                      <div className="flex items-center gap-3 sm:gap-4">

                        {/* ================= AVATAR ================= */}

                        <div className="relative shrink-0">
                          {avatarUrl ? (
                            <img
                              src={avatarUrl}
                              alt="avatar"
                              className="
                                w-12 h-12
                                sm:w-14 sm:h-14
                                rounded-full
                                object-cover
                                border border-white/10
                                shadow-[0_4px_20px_rgba(0,0,0,0.35)]
                              "
                            />
                          ) : (
                            <div
                              className="
                                w-12 h-12
                                sm:w-14 sm:h-14
                                rounded-full
                                border border-white/10
                                bg-white/[0.06]
                                flex items-center justify-center
                                text-sm sm:text-base
                                font-semibold
                                text-white
                                shadow-[0_4px_20px_rgba(0,0,0,0.35)]
                              "
                            >
                              {getInitials(
                                displayName
                              )}
                            </div>
                          )}

                          {c.unreadCount > 0 && (
                            <span
                              className="
                                absolute
                                -top-1 -right-1
                                min-w-[20px]
                                h-5
                                px-1.5
                                rounded-full
                                bg-[#22C55E]
                                text-black
                                text-[10px]
                                font-semibold
                                flex items-center justify-center
                                border border-[#16A34A]
                              "
                            >
                              {c.unreadCount > 99
                                ? "99+"
                                : c.unreadCount}
                            </span>
                          )}
                        </div>

                        {/* ================= CONTENT ================= */}

                        <div className="flex-1 min-w-0">

                          {/* ================= TOP ================= */}

                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h2 className="text-[15px] sm:text-[16px] font-semibold text-[#F8FAFC] truncate">
                                  {displayName}
                                </h2>

                                {isCreator && (
                                  <span
                                    className="
                                      text-[10px]
                                      sm:text-[11px]
                                      px-2 py-0.5
                                      rounded-full
                                      border border-white/10
                                      bg-white/[0.04]
                                      text-white/60
                                    "
                                  >
                                    Client
                                  </span>
                                )}
                              </div>

                              <div className="mt-1 flex items-center gap-2 flex-wrap">
                                <span className="text-[11px] text-white/40">
                                  Booking
                                </span>

                                <span className="text-[11px] text-white/60 font-medium">
                                  #
                                  {c.bookingId.slice(
                                    -6
                                  )}
                                </span>
                              </div>
                            </div>

                            <div className="shrink-0">
                              <p className="text-[11px] sm:text-xs text-white/40">
                                {new Date(
                                  c.lastMessageAt
                                ).toLocaleTimeString(
                                  [],
                                  {
                                    hour:
                                      "2-digit",
                                    minute:
                                      "2-digit",
                                  }
                                )}
                              </p>
                            </div>
                          </div>

                          {/* ================= MESSAGE ================= */}

                          <div className="mt-3 flex items-center justify-between gap-3">
                            <p className="text-sm text-white/55 truncate leading-relaxed">
                              {c.lastMessage}
                            </p>

                            <div
                              className="
                                opacity-0
                                group-hover:opacity-100
                                transition-opacity duration-200
                                shrink-0
                                hidden sm:flex
                              "
                            >
                              <div
                                className="
                                  w-9 h-9
                                  rounded-xl
                                  border border-white/10
                                  bg-white/[0.04]
                                  flex items-center justify-center
                                "
                              >
                                <svg
                                  className="w-4 h-4 text-white/60"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 5l7 7-7 7"
                                  />
                                </svg>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
      </div>

      {/* ================= SCROLLBAR ================= */}

      <style>
        {`
          ::-webkit-scrollbar {
            width: 8px;
          }

          ::-webkit-scrollbar-track {
            background: #050816;
          }

          ::-webkit-scrollbar-thumb {
            background: rgba(255,255,255,0.12);
            border-radius: 999px;
          }

          ::-webkit-scrollbar-thumb:hover {
            background: rgba(255,255,255,0.2);
          }
        `}
      </style>
    </div>
  );

  return isCreator ? (
    <DashboardLayout>
      {renderContent()}
    </DashboardLayout>
  ) : (
    <UserDashboardLayout>
      {renderContent()}
    </UserDashboardLayout>
  );
};
