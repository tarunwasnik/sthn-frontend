// frontend/src/pages/MessagesPage.tsx

import { useEffect, useMemo, useRef, useState } from "react";

import { useLocation, useNavigate, useSearchParams } from "react-router-dom";

import DashboardLayout from "../layouts/DashboardLayout";
import UserDashboardLayout from "../layouts/UserDashboardLayout";
import ChatWindow from "../components/chat/ChatWindow";
import { useMessaging } from "../hooks/useMessaging";
import { socket } from "../lib/socket";

export default function MessagesPage() {
  const { conversations, loading, markConversationSeen } = useMessaging();
  const navigate = useNavigate();

  const location = useLocation();

  const [searchParams] = useSearchParams();

  const isCreator = location.pathname.includes("/creator");

  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  const [searchQuery, setSearchQuery] = useState("");

  const [initialRouteBookingId] = useState<string | null>(
    () => window.innerWidth >= 1024 ? searchParams.get("bookingId") : null,
  );

  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(
    initialRouteBookingId,
  );

  const [chatOpen, setChatOpen] = useState(false);
  const [routeChatDismissed, setRouteChatDismissed] = useState(false);
  const autoReadBookingIds = useRef(new Set<string>());
  /* ======================================================
   AUTO OPEN CHAT FROM BOOKING
====================================================== */

  const autoOpenedBookingId = !loading && !routeChatDismissed
    ? initialRouteBookingId
    : null;
  const activeBookingId = selectedBookingId;
  const isChatOpen = autoOpenedBookingId !== null || chatOpen;

  useEffect(() => {
    if (
      !autoOpenedBookingId ||
      autoReadBookingIds.current.has(autoOpenedBookingId) ||
      !conversations.some((conversation) => conversation.bookingId === autoOpenedBookingId)
    ) {
      return;
    }

    autoReadBookingIds.current.add(autoOpenedBookingId);
    void markConversationSeen(autoOpenedBookingId);
  }, [autoOpenedBookingId, conversations, markConversationSeen]);

  /* ======================================================
   PRESENCE
====================================================== */

  useEffect(() => {
    const handlePresenceInit = (users: string[]) => {
      console.log("PRESENCE INIT", users);

      setOnlineUsers(new Set(users));
    };

    const handlePresenceUpdate = (data: {
      userId: string;
      online: boolean;
    }) => {
      console.log("PRESENCE UPDATE", data);

      setOnlineUsers((prev) => {
        const next = new Set(prev);

        if (data.online) {
          next.add(data.userId);
        } else {
          next.delete(data.userId);
        }

        return next;
      });
    };

    socket.on("presence:init", handlePresenceInit);

    socket.on("presence:update", handlePresenceUpdate);

    const requestPresence = () => socket.emit("presence:get");
    socket.on("connect", requestPresence);
    if (socket.connected) requestPresence();

    return () => {
      socket.off("presence:init", handlePresenceInit);

      socket.off("presence:update", handlePresenceUpdate);
      socket.off("connect", requestPresence);
    };
  }, []);

  /* ======================================================
     HELPERS
  ====================================================== */

  const openChat = (bookingId: string) => {
    if (window.innerWidth < 1024) {
      navigate(`/dashboard/chat/${bookingId}`);
      return;
    }

    if (activeBookingId === bookingId && isChatOpen) {
      setRouteChatDismissed(true);
      setChatOpen(false);
      return;
    }

    setSelectedBookingId(bookingId);

    setRouteChatDismissed(true);
    setChatOpen(true);

    void markConversationSeen(bookingId);

  };

  const closeChat = () => {
    setRouteChatDismissed(true);
    setChatOpen(false);
  };

  const getInitials = (name: string) => {
    if (!name) return "U";

    const parts = name.trim().split(" ");

    return parts.length === 1
      ? parts[0][0].toUpperCase()
      : (parts[0][0] + parts[1][0]).toUpperCase();
  };

  const formatMessageTime = (date: string) => {
    return new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  /* ======================================================
     SORTED CONVERSATIONS
  ====================================================== */

  const sortedConversations = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const filtered = conversations.filter((c) => {
      if (!query) return true;

      const profile = c.otherUser?.profile;

      const displayName = (
        profile?.displayName ||
        profile?.username ||
        ""
      ).toLowerCase();

      const serviceTitle = (c.service?.title || "").toLowerCase();

      const lastMessage = (c.lastMessage || "").toLowerCase();

      return (
        displayName.includes(query) ||
        serviceTitle.includes(query) ||
        lastMessage.includes(query)
      );
    });

    return filtered.sort(
      (a, b) =>
        new Date(b.lastMessageAt).getTime() -
        new Date(a.lastMessageAt).getTime(),
    );
  }, [conversations, searchQuery]);

  /* ======================================================
     UI
  ====================================================== */

  const renderContent = () => (
    <div
      className="
    h-full
    overflow-hidden
    text-theme-text
    flex
    flex-col
    min-h-0
  "
    >
      <div
        className="
    flex-1
    min-h-0
    max-w-6xl
    mx-auto
    w-full
    px-3
    md:px-5
    py-4
    pb-0
    flex
    flex-col
  "
      >
        {/* ======================================================
   HEADER
====================================================== */}

        <div className="mb-4">
          <h1 className="mb-3 text-2xl font-semibold text-theme-text">Messages</h1>
          <div
            className="
      hidden
      md:block
      
      max-w-2xl
    "
          >
            <input
              type="text"
              aria-label="Search conversations"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Creator or Service..."
              className="
        w-full
        h-12
        rounded-[var(--radius-control)]
        border border-theme-border
        bg-theme-surface
        px-5
        text-sm
        text-theme-text
        placeholder:text-theme-muted
        focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent
        hover:border-theme-border-strong
        transition-colors
      "
            />
          </div>
        </div>

        {/* ======================================================
           LOADING
        ====================================================== */}

        {loading && (
          <div className="space-y-4">
            {[...Array(5)].map((_, index) => (
              <div
                key={index}
                className="
                    rounded-[var(--radius-card)]
                    border border-theme-border
                    bg-theme-surface
                    p-4
                    animate-pulse
                  "
              >
                <div className="flex items-center gap-4">
                  <div
                    className="
                        w-14
                        h-14
                        rounded-full
                        bg-theme-inset
                      "
                  />

                  <div className="flex-1">
                    <div
                      className="
                          h-4
                          w-40
                          rounded
                          bg-theme-inset
                          mb-3
                        "
                    />

                    <div
                      className="
                          h-3
                          w-24
                          rounded
                          bg-theme-inset
                          mb-2
                        "
                    />

                    <div
                      className="
                          h-3
                          w-56
                          rounded
                          bg-theme-inset
                        "
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ======================================================
           EMPTY
        ====================================================== */}

        {!loading && sortedConversations.length === 0 && (
          <div
            className="
                rounded-[var(--radius-card)]
                border border-theme-border
                bg-theme-surface
                px-6
                py-16
                text-center
              "
          >
            <div
              className="
                  w-16
                  h-16
                  mx-auto
                  mb-5
                  rounded-full
                  border border-theme-border
                  bg-theme-inset
                  flex items-center justify-center
                "
            >
              <svg
                className="
                    w-7
                    h-7
                    text-theme-muted
                  "
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

            <h2
              className="
                  text-2xl
                  font-semibold
                  text-theme-text
                "
            >
              No conversations yet
            </h2>

            <p
              className="
                  mt-2
                  text-sm
                  text-theme-muted
                  max-w-md
                  mx-auto
                "
            >
              Your active booking conversations will appear here once messaging
              starts.
            </p>
          </div>
        )}

        {/* ======================================================
    CONVERSATIONS
====================================================== */}

        {!loading && sortedConversations.length > 0 && (
          <>
            {/* MOBILE */}

            {/* MOBILE */}

            <div
              className="
    lg:hidden
    flex-1
    min-h-0
    overflow-y-auto
    pr-1
  "
            >
              <div className="space-y-3">
                {sortedConversations.map((c) => {
                  const profile = c.otherUser?.profile;

                  const displayName =
                    profile?.displayName || profile?.username || "User";

                  const avatarUrl =
                    profile?.avatarUrl ||
                    profile?.avatar ||
                    profile?.profilePhotos?.[0] ||
                    null;

                  const isOnline = onlineUsers.has(c.otherUser._id);

                  return (
                    <button
                      type="button"
                      key={c.bookingId}
                      onClick={() => openChat(c.bookingId)}
                      aria-label={`Open conversation with ${displayName}`}
                      className="
                  group
                  w-full
                  text-left
                  cursor-pointer
                  rounded-[var(--radius-card)]
                  border border-theme-border
                  bg-theme-surface
                  hover:border-theme-border-strong
                  hover:bg-theme-surface-raised
                  transition-colors
                  focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent
                "
                    >
                      <div className="px-5 py-2.5">
                        <div className="flex items-center gap-3">
                          {/* ======================================================
                      AVATAR
                  ====================================================== */}

                          <div className="relative shrink-0">
                            {avatarUrl ? (
                              <img
                                src={avatarUrl}
                                alt="avatar"
                                onError={(e) => {
                                  e.currentTarget.src = "/default-avatar.png";
                                }}
                                className="
                          w-11
                          h-11
                          rounded-full
                          object-cover
                          border border-theme-border
                        "
                              />
                            ) : (
                              <div
                                className="
                          w-11
                          h-11
                          rounded-full
                          border border-theme-border
                          bg-theme-inset
                          flex items-center justify-center
                          text-[13px]
                          font-semibold
                          text-theme-text
                        "
                              >
                                {getInitials(displayName)}
                              </div>
                            )}

                            {/* ONLINE DOT */}

                            {isOnline && (
                              <span
                                className="
        absolute
        bottom-0
        right-0
        w-3
        h-3
        rounded-full
        bg-theme-success
        border-2
        border-theme-surface
      "
                              />
                            )}

                            {c.unreadCount > 0 && (
                              <span
                                className="
                          absolute
                          -top-1
                          -right-1
                          min-w-[18px]
                          h-[18px]
                          px-1
                          rounded-full
                          bg-theme-accent
                          text-theme-primary-text
                          text-[9px]
                          font-semibold
                          flex items-center justify-center
                        "
                              >
                                {c.unreadCount > 99 ? "99+" : c.unreadCount}
                              </span>
                            )}
                          </div>

                          {/* ======================================================
                      CONTENT
                  ====================================================== */}

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h2
                                      className="
        text-[14px]
        font-semibold
        text-theme-text
        truncate
      "
                                    >
                                      {displayName}
                                    </h2>

                                    {isCreator && (
                                      <span
                                        className="
          px-2
          py-[3px]
          rounded-full
          text-[9px]
          border border-theme-border
          bg-theme-inset
          text-theme-muted
          leading-none
        "
                                      >
                                        Client
                                      </span>
                                    )}
                                  </div>

                                  {isOnline && (
                                    <p
                                      className="
        text-[10px]
        text-theme-success
        leading-none
        mt-[2px]
      "
                                    >
                                      Online
                                    </p>
                                  )}
                                </div>

                                {/* ======================================================
                            SERVICE TITLE
                        ====================================================== */}

                                <div className="mt-[2px]">
                                  <p
                                    className="
                              text-[10px]
                              text-theme-muted
                              truncate
                              leading-none
                            "
                                  >
                                    {c.service?.title || "Service"}
                                  </p>
                                </div>
                              </div>

                              {/* ======================================================
                          TIME
                      ====================================================== */}

                              <div className="shrink-0">
                                <p
                                  className="
                            text-[11px]
                            text-theme-muted
                          "
                                >
                                  {formatMessageTime(c.lastMessageAt)}
                                </p>
                              </div>
                            </div>

                            {/* ======================================================
                        MESSAGE
                    ====================================================== */}

                            <div className="mt-1.5 flex items-center justify-between gap-3">
                              <p
                                className="
    text-[12px]
    text-theme-muted
    truncate
    leading-none
  "
                              >
                                {c.lastMessage || "No messages yet"}
                              </p>

                              <div
                                className="
                          hidden md:flex
                          opacity-0
                          group-hover:opacity-100
                          transition-opacity
                          duration-200
                          shrink-0
                        "
                              >
                                <div
                                  className="
                            w-8
                            h-8
                            rounded-lg
                            border border-theme-border
                            bg-theme-inset
                            flex items-center justify-center
                          "
                                >
                                  <svg
                                    className="
                              w-3.5
                              h-3.5
                              text-theme-muted
                            "
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
                    </button>
                  );
                })}
              </div>
            </div>

            {/* DESKTOP */}

            <div
              className="
    hidden
    lg:flex
    gap-5
    flex-1
    min-h-0
  "
            >
              {/* LEFT PANEL */}

              <div
                className={`
    flex
    flex-col
    min-h-0
    transition-all
    duration-300
    ${isChatOpen ? "w-[32%]" : "w-full"}
  `}
              >
                <div
                  className="
      flex-1
      min-h-0
      overflow-y-auto
      pr-1
    "
                >
                  <div className="space-y-3">
                    {sortedConversations.map((c) => {
                      const profile = c.otherUser?.profile;

                      const displayName =
                        profile?.displayName || profile?.username || "User";

                      const avatarUrl =
                        profile?.avatarUrl ||
                        profile?.avatar ||
                        profile?.profilePhotos?.[0] ||
                        null;

                      const isOnline = onlineUsers.has(c.otherUser._id);

                      const isSelected =
                        activeBookingId === c.bookingId && isChatOpen;

                      return (
                        <button
                          type="button"
                          key={c.bookingId}
                          onClick={() => openChat(c.bookingId)}
                          aria-label={`Open conversation with ${displayName}`}
                          className={`
    relative
    group
    w-full
    text-left
    cursor-pointer
    rounded-[var(--radius-card)]
    border
    transition-colors
    focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent

   ${
     isSelected
       ? `
      border-theme-accent
      bg-theme-accent-tint
    `
       : `
      border-theme-border
      bg-theme-surface
      hover:border-theme-border-strong
      hover:bg-theme-surface-raised
    `
   }
  `}
                        >
                          <div className="px-5 py-2.5">
                            <div className="flex items-center gap-3">
                              {/* ======================================================
                      AVATAR
                      ====================================================== */}

                              <div className="relative shrink-0">
                                {avatarUrl ? (
                                  <img
                                    src={avatarUrl}
                                    alt="avatar"
                                    onError={(e) => {
                                      e.currentTarget.src =
                                        "/default-avatar.png";
                                    }}
                                    className="
                          w-11
                          h-11
                          rounded-full
                          object-cover
                          border border-theme-border
                        "
                                  />
                                ) : (
                                  <div
                                    className="
                          w-11
                          h-11
                          rounded-full
                          border border-theme-border
                          bg-theme-inset
                          flex items-center justify-center
                          text-[13px]
                          font-semibold
                          text-theme-text
                        "
                                  >
                                    {getInitials(displayName)}
                                  </div>
                                )}

                                {/* ONLINE DOT */}

                                {isOnline && (
                                  <span
                                    className="
        absolute
        bottom-0
        right-0
        w-3
        h-3
        rounded-full
        bg-theme-success
        border-2
        border-theme-surface
      "
                                  />
                                )}

                                {c.unreadCount > 0 && (
                                  <span
                                    className="
                          absolute
                          -top-1
                          -right-1
                          min-w-[18px]
                          h-[18px]
                          px-1
                          rounded-full
                          bg-theme-accent
                          text-theme-primary-text
                          text-[9px]
                          font-semibold
                          flex items-center justify-center
                        "
                                  >
                                    {c.unreadCount > 99 ? "99+" : c.unreadCount}
                                  </span>
                                )}
                              </div>

                              {/* ======================================================
                      CONTENT
                     ====================================================== */}

                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <div>
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <h2
                                          className="
        text-[14px]
        font-semibold
        text-theme-text
        truncate
      "
                                        >
                                          {displayName}
                                        </h2>

                                        {isCreator && (
                                          <span
                                            className="
          px-2
          py-[3px]
          rounded-full
          text-[9px]
          border border-theme-border
          bg-theme-inset
          text-theme-muted
          leading-none
        "
                                          >
                                            Client
                                          </span>
                                        )}
                                      </div>

                                      {isOnline && (
                                        <p
                                          className="
        text-[10px]
        text-theme-success
        leading-none
        mt-[2px]
      "
                                        >
                                          Online
                                        </p>
                                      )}
                                    </div>

                                    {/* ======================================================
                            SERVICE TITLE
                        ====================================================== */}

                                    <div className="mt-[2px]">
                                      <p
                                        className="
                              text-[10px]
                              text-theme-muted
                              truncate
                              leading-none
                            "
                                      >
                                        {c.service?.title || "Service"}
                                      </p>
                                    </div>
                                  </div>

                                  {/* ======================================================
                          TIME
                      ====================================================== */}

                                  <div className="shrink-0 text-right">
                                    <p className="text-[11px] text-theme-muted">
                                      {formatMessageTime(c.lastMessageAt)}
                                    </p>

                                    {isSelected && (
                                      <p
                                        className="
        mt-[2px]
        text-[9px]
        font-semibold
        tracking-[0.12em]
        text-theme-accent
        leading-none
      "
                                      >
                                        • ACTIVE
                                      </p>
                                    )}
                                  </div>
                                </div>

                                {/* ======================================================
                        MESSAGE
                    ====================================================== */}

                                <div className="mt-1.5 flex items-center justify-between gap-3">
                                  <p
                                    className="
    text-[12px]
    text-theme-muted
    truncate
    leading-none
  "
                                  >
                                    {c.lastMessage || "No messages yet"}
                                  </p>

                                  <div
                                    className="
                          hidden md:flex
                          opacity-0
                          group-hover:opacity-100
                          transition-opacity
                          duration-200
                          shrink-0
                        "
                                  >
                                    <div
                                      className="
                            w-8
                            h-8
                            rounded-lg
                            border border-theme-border
                            bg-theme-inset
                            flex items-center justify-center
                          "
                                    >
                                      <svg
                                        className="
                              w-3.5
                              h-3.5
                              text-theme-muted
                            "
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
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* RIGHT PANEL PLACEHOLDER */}

              <div
                className={`
    overflow-hidden
    transition-opacity
    duration-300
    ease-in-out
    ${isChatOpen ? "flex-1 opacity-100" : "w-0 opacity-0"}
  `}
              >
                <div
                  className="
      h-full
      rounded-[var(--radius-card)]
      border border-theme-border
      bg-theme-surface
    "
                >
                  {isChatOpen && activeBookingId && (
                    <ChatWindow
                      bookingId={activeBookingId}
                      embedded
                      onClose={closeChat}
                    />
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ======================================================
         SCROLLBAR
      ====================================================== */}

      <style>
        {`
          ::-webkit-scrollbar {
            width: 8px;
          }

          

          ::-webkit-scrollbar-thumb {
            background: var(--color-border-strong);
            border-radius: 999px;
          }

          ::-webkit-scrollbar-thumb:hover {
            background: var(--color-accent);
          }
        `}
      </style>
    </div>
  );

  return isCreator ? (
    <DashboardLayout>{renderContent()}</DashboardLayout>
  ) : (
    <UserDashboardLayout>{renderContent()}</UserDashboardLayout>
  );
}
