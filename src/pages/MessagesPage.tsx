//frontend/src/pages/MessagesPage.tsx

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
      console.error("Failed to load conversations", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  /* ================= REAL-TIME ================= */

  useEffect(() => {
    const handleMessage = (msg: any) => {
      setConversations((prev) => {
        const index = prev.findIndex(
          (c) => c.bookingId === msg.bookingId
        );

        if (index === -1) return prev;

        let updated = [...prev];

        updated[index] = {
          ...updated[index],
          lastMessage: msg.message,
          lastMessageAt: msg.createdAt,
          unreadCount: updated[index].unreadCount + 1,
        };

        const [moved] = updated.splice(index, 1);
        updated.unshift(moved);

        return updated;
      });
    };

    const handleSeen = (data: any) => {
      if (!data?.bookingId) return;

      setConversations((prev) =>
        prev.map((c) =>
          c.bookingId === data.bookingId
            ? { ...c, unreadCount: 0 }
            : c
        )
      );
    };

    socket.on("chat:message", handleMessage);
    socket.on("chat:seen", handleSeen);

    return () => {
      socket.off("chat:message", handleMessage);
      socket.off("chat:seen", handleSeen);
    };
  }, []);

  const openChat = (bookingId: string) => {
    navigate(`/dashboard/chat/${bookingId}`);
  };

  /* ================= HELPERS ================= */

  const getInitials = (name: string) => {
    if (!name) return "U";
    const parts = name.trim().split(" ");
    return parts.length === 1
      ? parts[0][0].toUpperCase()
      : (parts[0][0] + parts[1][0]).toUpperCase();
  };

  /* ================= UI ================= */

  const renderContent = () => (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">
        Messages
      </h1>

      {loading && (
        <p className="text-gray-400">
          Loading conversations...
        </p>
      )}

      {!loading && conversations.length === 0 && (
        <p className="text-gray-500">
          No conversations yet.
        </p>
      )}

      <div className="space-y-3">
        {conversations.map((c) => (
          <div
            key={c.bookingId}
            onClick={() => openChat(c.bookingId)}
            className="bg-[#111827] border border-gray-800 rounded-xl p-4 cursor-pointer hover:border-gray-600 transition flex items-center gap-3"
          >
            {/* Avatar */}
            {c.otherUser.avatarUrl ? (
              <img
                src={c.otherUser.avatarUrl}
                alt="avatar"
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-sm font-semibold">
                {getInitials(c.otherUser.displayName)}
              </div>
            )}

            <div className="flex-1 min-w-0">
              {/* Top Row */}
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-white font-medium truncate">
                    {c.otherUser.displayName || "User"}
                  </p>

                  {isCreator && (
                    <p className="text-xs text-blue-400">
                      Client
                    </p>
                  )}

                  <p className="text-xs text-gray-500">
                    Booking #{c.bookingId.slice(-6)}
                  </p>
                </div>

                <p className="text-xs text-gray-400">
                  {new Date(
                    c.lastMessageAt
                  ).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>

              {/* Bottom Row */}
              <div className="flex justify-between items-center mt-1">
                <p className="text-sm text-gray-400 truncate">
                  {c.lastMessage}
                </p>

                {c.unreadCount > 0 && (
                  <span className="ml-2 bg-white text-black text-xs px-2 py-0.5 rounded-full">
                    {c.unreadCount}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return isCreator ? (
    <DashboardLayout>{renderContent()}</DashboardLayout>
  ) : (
    <UserDashboardLayout>{renderContent()}</UserDashboardLayout>
  );
} 