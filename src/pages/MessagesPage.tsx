// frontend/src/pages/MessagesPage.tsx

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import api from "../api/axios";

import DashboardLayout from "../layouts/DashboardLayout";
import UserDashboardLayout from "../layouts/UserDashboardLayout";

import {
  getConversations,
} from "../api/chat";

import type {
  Conversation,
} from "../api/chat";

import { socket } from "../lib/socket";
import ChatPanel from "../components/chat/ChatWindow";
import ChatWindow from "../components/chat/ChatWindow";

export default function MessagesPage() {
  const navigate = useNavigate();

  const location = useLocation();

  const [searchParams] =
  useSearchParams();

  const isCreator =
    location.pathname.includes(
      "/creator"
    );

  const [
    conversations,
    setConversations,
  ] = useState<
    Conversation[]
  >([]);

  const [loading, setLoading] =
    useState(true);

    const [
  selectedBookingId,
  setSelectedBookingId,
] = useState<string | null>(null);

const [
  chatOpen,
  setChatOpen,
] = useState(false);

  /* ======================================================
     FETCH
  ====================================================== */

  const fetchConversations =
    async () => {
      try {
        setLoading(true);

        const data =
          await getConversations();

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


  /* ======================================================
   AUTO OPEN CHAT FROM BOOKING
====================================================== */

useEffect(() => {

  console.log(
    "AUTO OPEN",
    {
      loading,
      conversationsLength:
        conversations.length,
      bookingId:
        searchParams.get(
          "bookingId"
        ),
    }
  );

  if (
    loading
  ) {
    return;
  }

  const bookingId =
  searchParams.get(
    "bookingId"
  );

if (!bookingId) {
  return;
}

console.log(
  "ALL CONVERSATIONS",
  conversations.map(
    (c) => c.bookingId
  )
);

const exists =
  conversations.find(
    (c) =>
      c.bookingId === bookingId
  );

  if (
    window.innerWidth >= 1024
  ) {
    setSelectedBookingId(
      bookingId
    );

    setChatOpen(true);
    if (exists) {
    setConversations((prev) =>
      prev.map((c) =>
        c.bookingId === bookingId
          ? {
              ...c,
              unreadCount: 0,
            }
          : c
      )
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
  }
}

}, [
  loading,
  
  searchParams,
]);

/* ======================================================
   JOIN CONVERSATION ROOMS
====================================================== */

useEffect(() => {
  if (conversations.length === 0) {
    return;
  }

  conversations.forEach((c) => {
    console.log(
      "MESSAGES PAGE JOIN",
      c.bookingId
    );

    socket.emit(
      "join-booking",
      c.bookingId
    );
  });
}, [conversations.length]);



/* ======================================================
   REALTIME
====================================================== */

useEffect(() => {
  const handleMessage = (
    msg: any
  ) => {

    console.log(
    "MESSAGES PAGE RECEIVED",
    msg
  );


    setConversations((prev) => {
      const index =
        prev.findIndex(
          (c) =>
            c.bookingId ===
            msg.bookingId
        );

      if (index === -1) {

        console.log(
    "CONVERSATION NOT FOUND -> REFETCH"
  );


  fetchConversations();
  return prev;
}

      const updated = [...prev];

      const isActiveConversation =
        chatOpen &&
        selectedBookingId ===
          msg.bookingId;

      updated[index] = {
        ...updated[index],

        lastMessage:
          msg.message,

        lastMessageAt:
          msg.createdAt,

        unreadCount:
          isActiveConversation
            ? 0
            : updated[index]
                .unreadCount + 1,
      };

      if (index !== 0) {
        const [moved] =
          updated.splice(
            index,
            1
          );

        updated.unshift(moved);
      }

      return updated;
    });
  };

  /*const handleSeen = (
    data: {
      bookingId: string;
    }
  ) => {
    setConversations((prev) =>
      prev.map((c) =>
        c.bookingId ===
        data.bookingId
          ? {
              ...c,
              unreadCount: 0,
            }
          : c
      )
    );
  };*/

  socket.on(
    "chat:message",
    handleMessage
  );

  //socket.on(
  //  "chat:seen",
   // handleSeen
  //);

  return () => {
    socket.off(
      "chat:message",
      handleMessage
    );

    //socket.off(
     // "chat:seen",
     // handleSeen
    //);
  };
}, [
  chatOpen,
  selectedBookingId,
]);





  /* ======================================================
     HELPERS
  ====================================================== */

  const openChat = (
  bookingId: string
) => {

  if (window.innerWidth < 1024) {
    navigate(
      `/dashboard/chat/${bookingId}`
    );
    return;
  }

  if (
    selectedBookingId === bookingId &&
    chatOpen
  ) {
    setChatOpen(false);
    return;
  }

  setSelectedBookingId(
    bookingId
  );

  setChatOpen(true);

  /* ==========================================
     CLEAR UNREAD IMMEDIATELY
  ========================================== */

  setConversations((prev) =>
    prev.map((c) =>
      c.bookingId === bookingId
        ? {
            ...c,
            unreadCount: 0,
          }
        : c
    )
  );

  /* ==========================================
     MARK AS SEEN
  ========================================== */

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

const closeChat = () => {
  setChatOpen(false);
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

  const formatMessageTime = (
    date: string
  ) => {
    return new Date(
      date
    ).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  /* ======================================================
     SORTED CONVERSATIONS
  ====================================================== */

  const sortedConversations =
    useMemo(() => {
      return [
        ...conversations,
      ].sort(
        (a, b) =>
          new Date(
            b.lastMessageAt
          ).getTime() -
          new Date(
            a.lastMessageAt
          ).getTime()
      );
    }, [conversations]);

  /* ======================================================
     UI
  ====================================================== */

  const renderContent = () => (
    <div className="min-h-screen text-[#F8FAFC]">

      <div
        className="
          max-w-6xl
          mx-auto
          px-3
          md:px-5
          py-4
          pb-24
        "
      >

        {/* ======================================================
           HEADER
        ====================================================== */}

        <div className="mb-6">

          <div
            className="
              rounded-[28px]
              border border-white/10
              bg-gradient-to-br
              from-white/[0.045]
              to-white/[0.015]
              backdrop-blur-xl
              shadow-[0_10px_30px_rgba(0,0,0,0.35)]
              px-5
              md:px-6
              py-4
            "
          >

            <div className="flex items-center justify-between gap-4">

              <div>

                <h1
                  className="
                    text-[22px]
                    md:text-[22px]
                    font-bold
                    tracking-tight
                    text-[#F8FAFC]
                  "
                >
                  Messages
                </h1>

                <p
                  className="
                    mt-2
                    text-sm
                    md:text-base
                    text-white/55
                  "
                >
                  Manage conversations and booking chats
                </p>

              </div>

              <div
                className="
                  hidden md:flex
                  items-center
                  justify-center
                  rounded-[18px]
                  border border-white/10
                  bg-white/[0.03]
                  px-4
                  h-11
                "
              >

                <span
                  className="
                    text-[15px]
                    text-white/75
                  "
                >
                  {
                    sortedConversations.length
                  }{" "}
                  Conversation
                  {sortedConversations.length !==
                  1
                    ? "s"
                    : ""}
                </span>

              </div>

            </div>

          </div>

        </div>

        {/* ======================================================
           LOADING
        ====================================================== */}

        {loading && (

          <div className="space-y-4">

            {[...Array(5)].map(
              (_, index) => (

                <div
                  key={index}
                  className="
                    rounded-[28px]
                    border border-white/10
                    bg-gradient-to-br
                    from-white/[0.045]
                    to-white/[0.015]
                    backdrop-blur-xl
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
                        bg-white/10
                      "
                    />

                    <div className="flex-1">

                      <div
                        className="
                          h-4
                          w-40
                          rounded
                          bg-white/10
                          mb-3
                        "
                      />

                      <div
                        className="
                          h-3
                          w-24
                          rounded
                          bg-white/5
                          mb-2
                        "
                      />

                      <div
                        className="
                          h-3
                          w-56
                          rounded
                          bg-white/5
                        "
                      />

                    </div>

                  </div>

                </div>
              )
            )}

          </div>
        )}

        {/* ======================================================
           EMPTY
        ====================================================== */}

        {!loading &&
          sortedConversations.length ===
            0 && (

            <div
              className="
                rounded-[32px]
                border border-white/10
                bg-gradient-to-br
                from-white/[0.045]
                to-white/[0.015]
                backdrop-blur-xl
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
                  border border-white/10
                  bg-white/[0.04]
                  flex items-center justify-center
                "
              >

                <svg
                  className="
                    w-7
                    h-7
                    text-white/50
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
                  text-[#F8FAFC]
                "
              >
                No conversations yet
              </h2>

              <p
                className="
                  mt-2
                  text-sm
                  text-white/50
                  max-w-md
                  mx-auto
                "
              >
                Your active booking conversations
                will appear here once messaging
                starts.
              </p>

            </div>
          )}

        {/* ======================================================
    CONVERSATIONS
====================================================== */}

{!loading &&
  sortedConversations.length > 0 && (

    <>
      {/* MOBILE */}

      <div className="lg:hidden space-y-3">

        {sortedConversations.map(
          (c) => {

            const profile =
              c.otherUser?.profile;

            const displayName =
              profile?.displayName ||
              profile?.username ||
              "User";

            const avatarUrl =
              profile?.avatarUrl ||
              profile?.avatar ||
              profile?.profilePhotos?.[0] ||
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
                  rounded-[24px]
                  border border-white/10
                  bg-gradient-to-br
                  from-white/[0.045]
                  to-white/[0.015]
                  backdrop-blur-xl
                  shadow-[0_6px_22px_rgba(0,0,0,0.26)]
                  hover:border-white/15
                  hover:bg-white/[0.03]
                  transition-all
                  duration-200
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
                          e.currentTarget.src =
                            "/default-avatar.png";
                        }}
                        className="
                          w-11
                          h-11
                          rounded-full
                          object-cover
                          border border-white/10
                        "
                      />

                    ) : (

                      <div
                        className="
                          w-11
                          h-11
                          rounded-full
                          border border-white/10
                          bg-white/[0.06]
                          flex items-center justify-center
                          text-[13px]
                          font-semibold
                          text-white
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
                          -top-1
                          -right-1
                          min-w-[18px]
                          h-[18px]
                          px-1
                          rounded-full
                          bg-[#22C55E]
                          text-black
                          text-[9px]
                          font-semibold
                          flex items-center justify-center
                        "
                      >

                        {c.unreadCount > 99
                          ? "99+"
                          : c.unreadCount}

                      </span>
                    )}

                  </div>

                  {/* ======================================================
                      CONTENT
                  ====================================================== */}

                  <div className="flex-1 min-w-0">

                    <div className="flex items-start justify-between gap-3">

                      <div className="min-w-0">

                        <div className="flex items-center gap-2 flex-wrap">

                          <h2
                            className="
                              text-[14px]
                              font-semibold
                              text-[#F8FAFC]
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
                                border border-white/10
                                bg-white/[0.04]
                                text-white/60
                                leading-none
                              "
                            >
                              Client
                            </span>
                          )}

                        </div>

                        {/* ======================================================
                            SERVICE TITLE
                        ====================================================== */}

                        <div className="mt-[2px]">

                          <p
                            className="
                              text-[10px]
                              text-white/35
                              truncate
                              leading-none
                            "
                          >
                            {c.service?.title ||
                              "Service"}
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
                            text-white/38
                          "
                        >
                          {formatMessageTime(
                            c.lastMessageAt
                          )}
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
    text-white/55
    truncate
    leading-none
  "
>
                        {c.lastMessage ||
                          "No messages yet"}
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
                            border border-white/10
                            bg-white/[0.04]
                            flex items-center justify-center
                          "
                        >

                          <svg
                            className="
                              w-3.5
                              h-3.5
                              text-white/60
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

              </div>
            );
          }
        )}

      </div>

      {/* DESKTOP */}

      <div
  className="
    hidden
    lg:flex
    gap-5
    h-[calc(100vh-240px)]
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
    ${
      chatOpen
        ? "w-[32%]"
        : "w-full"
    }
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

            {sortedConversations.map(
              (c) => {

                const profile =
                  c.otherUser?.profile;

                const displayName =
                  profile?.displayName ||
                  profile?.username ||
                  "User";

                const avatarUrl =
                  profile?.avatarUrl ||
                  profile?.avatar ||
                  profile?.profilePhotos?.[0] ||
                  null;

                const isSelected =
                  selectedBookingId ===
                  c.bookingId &&
                  chatOpen;

                return (

                  <div
  key={c.bookingId}
  onClick={() =>
    openChat(
      c.bookingId
    )
  }
  className={`
    relative
    group
    cursor-pointer
    rounded-[24px]
    border
    backdrop-blur-xl
    shadow-[0_6px_22px_rgba(0,0,0,0.26)]
    transition-all
    duration-200

   ${
  isSelected
    ? `
      border-white/25
      bg-white/[0.09]
      shadow-[0_0_0_1px_rgba(255,255,255,0.12)]
      scale-[1.01]
    `
    : `
      border-white/10
      bg-gradient-to-br
      from-white/[0.045]
      to-white/[0.015]
      hover:border-white/15
      hover:bg-white/[0.03]
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
                          border border-white/10
                        "
                      />

                    ) : (

                      <div
                        className="
                          w-11
                          h-11
                          rounded-full
                          border border-white/10
                          bg-white/[0.06]
                          flex items-center justify-center
                          text-[13px]
                          font-semibold
                          text-white
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
                          -top-1
                          -right-1
                          min-w-[18px]
                          h-[18px]
                          px-1
                          rounded-full
                          bg-[#22C55E]
                          text-black
                          text-[9px]
                          font-semibold
                          flex items-center justify-center
                        "
                      >

                        {c.unreadCount > 99
                          ? "99+"
                          : c.unreadCount}

                      </span>
                    )}

                    </div>

                    {/* ======================================================
                      CONTENT
                     ====================================================== */}

                   <div className="flex-1 min-w-0">

                    <div className="flex items-start justify-between gap-3">

                      <div className="min-w-0">

                        <div className="flex items-center gap-2 flex-wrap">

                          <h2
                            className="
                              text-[14px]
                              font-semibold
                              text-[#F8FAFC]
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
                                border border-white/10
                                bg-white/[0.04]
                                text-white/60
                                leading-none
                              "
                            >
                              Client
                            </span>
                          )}

                        </div>

                        {/* ======================================================
                            SERVICE TITLE
                        ====================================================== */}

                        <div className="mt-[2px]">

                          <p
                            className="
                              text-[10px]
                              text-white/35
                              truncate
                              leading-none
                            "
                          >
                            {c.service?.title ||
                              "Service"}
                          </p>

                        </div>

                      </div>

                      {/* ======================================================
                          TIME
                      ====================================================== */}

                      <div className="shrink-0 text-right">
  <p className="text-[11px] text-white/38">
    {formatMessageTime(c.lastMessageAt)}
  </p>

  {isSelected && (
    <p
      className="
        mt-[2px]
        text-[9px]
        font-semibold
        tracking-[0.12em]
        text-white/70
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
    text-white/55
    truncate
    leading-none
  "
>
                        {c.lastMessage ||
                          "No messages yet"}
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
                            border border-white/10
                            bg-white/[0.04]
                            flex items-center justify-center
                          "
                        >

                          <svg
                            className="
                              w-3.5
                              h-3.5
                              text-white/60
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

                  </div>
                );
              }
            )}

          </div>
</div>
        </div>

        {/* RIGHT PANEL PLACEHOLDER */}

        <div
  className={`
    overflow-hidden
    transition-all
    duration-300
    ease-in-out
    ${
      chatOpen
        ? "flex-1 opacity-100"
        : "w-0 opacity-0"
    }
  `}
>
  <div
    className="
      h-full
      rounded-[28px]
      border border-white/10
      bg-gradient-to-br
      from-white/[0.045]
      to-white/[0.015]
      backdrop-blur-xl
    "
  >{chatOpen &&
  selectedBookingId && (
    <ChatWindow
      bookingId={selectedBookingId}
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
}