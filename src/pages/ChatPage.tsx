//frontend/src/pages/ChatPage.tsx

import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

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

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  const [chatClosed, setChatClosed] = useState(false);

  // 🆕 SLOT + HEADER DATA
  const [slotText, setSlotText] = useState<string>("");
  const [clientName, setClientName] = useState<string>("User");

  const bottomRef = useRef<HTMLDivElement | null>(null);

  /* ================= FETCH CHAT ================= */

  const fetchChats = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await api.get(
        `/v1/chat/${bookingId}/messages`
      );

      setMessages(res.data.chats || []);

      await api.post(`/v1/chat/${bookingId}/seen`);
      socket.emit("chat:seen", { bookingId });

    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Failed to load chat"
      );
    } finally {
      setLoading(false);
    }
  };

  /* ================= FETCH SLOT INFO ================= */

  const fetchBookingDetails = async () => {
    try {
      const res = await api.get("/v1/user/bookings");

      const booking = res.data.bookings.find(
        (b: any) => b._id === bookingId
      );

      if (!booking) return;

      const slots = booking.slots;

      if (slots.length > 0) {
        const start = new Date(slots[0].startTime);
        const end = new Date(
          slots[slots.length - 1].endTime
        );

        const formatted = `${start.toLocaleDateString([], {
          day: "2-digit",
          month: "short",
        })}, ${start.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })} - ${end.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}`;

        setSlotText(formatted);

        // detect expired
        if (Date.now() > end.getTime()) {
          setChatClosed(true);
        }
      }

      // simple name
      if (booking.creator?.profile?.displayName) {
        setClientName(booking.creator.profile.displayName);
      }

    } catch (err) {
      console.error("Failed to fetch booking details");
    }
  };

  useEffect(() => {
    if (bookingId) {
      fetchChats();
      fetchBookingDetails(); // ✅ NEW
    }
  }, [bookingId]);

  /* ================= SOCKET ================= */

  useEffect(() => {
    if (!bookingId) return;

    socket.emit("join-booking", bookingId);

    const handleMessage = (msg: ChatMessage) => {
      setMessages((prev) => {
        if (prev.find((m) => m._id === msg._id)) return prev;

        const isMine =
          (role === "user" && msg.senderRole === "USER") ||
          (role === "creator" && msg.senderRole === "CREATOR");

        if (isMine) return prev;

        return [...prev, msg];
      });
    };

    socket.on("chat:message", handleMessage);

    return () => {
      socket.emit("leave-booking", bookingId);
      socket.off("chat:message", handleMessage);
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
    if (!input.trim() || !bookingId || chatClosed) return;

    const tempMessage: ChatMessage = {
      _id: "temp-" + Date.now(),
      bookingId,
      senderId: "temp",
      senderRole:
        role === "creator" ? "CREATOR" : "USER",
      message: input,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempMessage]);
    setInput("");
    setSending(true);

    try {
      const res = await api.post(
        `/v1/chat/${bookingId}/messages`,
        { message: tempMessage.message }
      );

      const saved = res.data.chat;

      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === tempMessage._id ? saved : msg
        )
      );
    } catch (err: any) {
      setMessages((prev) =>
        prev.filter((m) => m._id !== tempMessage._id)
      );

      const msg =
        err?.response?.data?.message ||
        "Failed to send message";

      if (
        msg.toLowerCase().includes("chat is closed") ||
        msg.toLowerCase().includes("booking time has ended")
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
    if (e.key === "Enter") handleSend();
  };

  /* ================= UI ================= */

  return (
    <Layout>
      <div className="flex flex-col h-[80vh]">

        {/* HEADER */}
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={() => navigate(-1)}
            className="text-sm text-gray-400 hover:text-white"
          >
            ← Back
          </button>

          <div className="text-sm text-gray-300 font-medium">
            {slotText || "Loading..."}
          </div>

          <div className="text-sm font-semibold">
            Chat
          </div>
        </div>

        {/* CLIENT HEADER */}
        <div className="flex items-center gap-3 mb-3 px-2">
          <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-sm">
            {clientName[0]?.toUpperCase()}
          </div>
          <p className="text-sm text-white">
            {clientName}
          </p>
        </div>

        {/* CHAT BOX */}
        <div className="flex-1 overflow-y-auto bg-[#111827] border border-gray-800 rounded-xl p-4 space-y-3">

          {loading && (
            <p className="text-gray-400 text-sm">
              Loading chat...
            </p>
          )}

          {!loading && error && (
            <p className="text-red-400 text-sm">
              {error}
            </p>
          )}

          {!loading && !error && messages.length === 0 && (
            <p className="text-gray-500 text-sm">
              No messages yet.
            </p>
          )}

          {!loading &&
            !error &&
            messages.map((msg) => {
              const isMine =
                (role === "user" &&
                  msg.senderRole === "USER") ||
                (role === "creator" &&
                  msg.senderRole === "CREATOR");

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
                    className={`max-w-xs md:max-w-md px-4 py-2 rounded-xl text-sm ${
                      isMine
                        ? "bg-blue-600 text-white"
                        : "bg-gray-700 text-white"
                    }`}
                  >
                    <p>{msg.message}</p>

                    <p className="text-[10px] text-gray-300 mt-1 text-right">
                      {new Date(
                        msg.createdAt
                      ).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              );
            })}

          <div ref={bottomRef} />
        </div>

        {/* CHAT CLOSED */}
        {chatClosed && (
          <div className="mt-2 text-center text-sm text-red-400">
            Chat closed. Booking time has ended.
          </div>
        )}

        {/* INPUT */}
        <div className="mt-3 flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) =>
              setInput(e.target.value)
            }
            onKeyDown={handleKeyDown}
            placeholder={
              chatClosed
                ? "Chat closed"
                : "Type a message..."
            }
            disabled={chatClosed}
            className="flex-1 bg-[#111827] border border-gray-800 rounded-lg px-4 py-2 text-sm focus:outline-none disabled:opacity-50"
          />

          <button
            onClick={handleSend}
            disabled={
              sending || !input.trim() || chatClosed
            }
            className="px-4 py-2 bg-blue-600 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>
    </Layout>
  );
}