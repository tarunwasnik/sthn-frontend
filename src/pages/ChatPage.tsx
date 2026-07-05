// frontend/src/pages/ChatPage.tsx
import UserDashboardLayout from "../layouts/UserDashboardLayout";
import DashboardLayout from "../layouts/DashboardLayout";
import MessageActions from "../components/chat/MessageActions";
import ImageViewerModal from "../components/chat/ImageViewerModal";

import MobileMessageList from "../components/chat/MobileMessageList";
import ChatComposer from "../components/chat/ChatComposer";
import { useEffect, useRef, useState } from "react";

import { useParams, useNavigate } from "react-router-dom";

import api from "../api/axios";

import { getConversations } from "../api/chat";

import type { Conversation } from "../api/chat";

import { useAuth } from "../context/AuthContext";

import { socket } from "../lib/socket";
import ChatHeader from "../components/chat/ChatHeader";

import LocationPickerModal from "../components/chat/LocationPickerModal";
import MapPickerModal from "../components/chat/MapPickerModal";
import ImagePreviewModal from "../components/chat/ImagePreviewModal";

interface ChatMessage {
  _id: string;

  bookingId: string;

  senderId: string;

  senderRole: "USER" | "CREATOR";

  type?: "text" | "location" | "document" | "image" | "voice" | "video";

  groupId?: string;

  replyTo?: {
    messageId: string;

    senderId: string;

    senderRole: "USER" | "CREATOR";

    type: "text" | "location" | "document" | "image" | "voice" | "video";

    message: string;

    attachment?: {
      url: string;

      fileName: string;

      mimeType: string;

      resourceType: "raw" | "image" | "video";
    };
  };

  location?: {
    latitude: number;

    longitude: number;

    name: string;

    address: string;

    placeId?: string;
  };

  attachment?: {
    url: string;

    publicId: string;

    fileName: string;

    originalFileName: string;

    mimeType: string;

    fileSize: number;

    resourceType: "raw" | "image" | "video";
  };

  message: string;

  seenBy: string[];

  isDeleted?: boolean;

  deletedAt?: string;

  reactions?: {
    userId: string;

    emoji: string;
  }[];

  /* Optimistic Upload */

  isUploading?: boolean;

  uploadProgress?: number;

  uploadFailed?: boolean;

  tempPreviewUrl?: string;

  createdAt: string;
}

export default function ChatPage() {
  const { bookingId } = useParams();

  const navigate = useNavigate();

  const { role, userId } = useAuth();

  const Layout = role === "creator" ? DashboardLayout : UserDashboardLayout;

  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const [conversation, setConversation] = useState<Conversation | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const [input, setInput] = useState("");

  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);

  const [sending, setSending] = useState(false);

  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(
    null,
  );

  const [showLocationPicker, setShowLocationPicker] = useState(false);

  const [mapPickerOpen, setMapPickerOpen] = useState(false);

  const [selectedMapLocation, setSelectedMapLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const [imageViewerOpen, setImageViewerOpen] = useState(false);

  const [selectedImages, setSelectedImages] = useState<ChatMessage[]>([]);

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const [imagePreviewOpen, setImagePreviewOpen] = useState(false);

  const [selectedImageFiles, setSelectedImageFiles] = useState<File[]>([]);

  const [actionsOpen, setActionsOpen] = useState(false);

  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isTyping, setIsTyping] = useState(false);

  const [deliveredMessages, setDeliveredMessages] = useState<Set<string>>(
    new Set(),
  );

  const [chatClosed, setChatClosed] = useState(false);

  const [slotText, setSlotText] = useState("");

  const bottomRef = useRef<HTMLDivElement | null>(null);

  const messagesContainerRef = useRef<HTMLDivElement | null>(null);

  const shouldAutoScrollRef = useRef(true);

  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hasEmittedTypingRef = useRef(false);

  /* ======================================================
     FETCH CHAT
  ====================================================== */

  const fetchChats = async () => {
    try {
      setLoading(true);

      setError(null);

      const res = await api.get(`/v1/chat/${bookingId}/messages`);

      setMessages(
        (res.data.chats || []).map((chat: ChatMessage) => ({
          ...chat,

          replyTo: chat.replyTo
            ? {
                ...chat.replyTo,
              }
            : undefined,
        })),
      );

      await api.post(`/v1/chat/${bookingId}/seen`);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load chat");
    } finally {
      setLoading(false);
    }
  };

  /* ======================================================
     FETCH CONVERSATION
  ====================================================== */

  const fetchConversation = async () => {
    try {
      const conversations = await getConversations();

      const matched =
        conversations.find((c) => c.bookingId === bookingId) || null;

      setConversation(matched);
    } catch (err) {
      console.error("Failed to fetch conversation");
    }
  };

  /* ======================================================
     FETCH BOOKING DETAILS
  ====================================================== */

  const fetchBookingDetails = async () => {
    try {
      let booking = null;

      if (role === "user") {
        const res = await api.get("/v1/bookings/user");

        booking = res.data.bookings.find((b: any) => b._id === bookingId);
      } else {
        const res = await api.get("/v1/creator/bookings");

        booking = res.data.bookings.find((b: any) => b._id === bookingId);
      }

      if (!booking) return;

      const slots = booking.slots || [];

      if (slots.length > 0) {
        const start = new Date(slots[0].startTime);

        const end = new Date(slots[slots.length - 1].endTime);

        const formatted = `${start.toLocaleDateString([], {
          day: "2-digit",
          month: "short",
        })} • ${start.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })} - ${end.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}`;

        setSlotText(formatted);

        if (Date.now() > end.getTime()) {
          setChatClosed(true);
        }
      }
    } catch (err) {
      console.error("Failed to fetch booking details", err);
    }
  };

  /* ======================================================
     INITIAL LOAD
  ====================================================== */

  useEffect(() => {
    if (!bookingId) return;

    const init = async () => {
      await Promise.all([
        fetchChats(),
        fetchBookingDetails(),
        fetchConversation(),
      ]);
    };

    init();
  }, [bookingId, userId]);

  /* ======================================================
     SOCKET
  ====================================================== */

  useEffect(() => {
    if (!bookingId) return;

    socket.emit("join-booking", bookingId);

    const handleMessage = (msg: ChatMessage) => {
      const incoming: ChatMessage = {
        ...msg,

        replyTo: msg.replyTo
          ? {
              ...msg.replyTo,
            }
          : undefined,
      };

      const addMessage = () => {
        setMessages((prev) => {
          const exists = prev.find((m) => m._id === incoming._id);

          if (exists) {
            return prev;
          }

          const isMine = incoming.senderId === userId;

          if (isMine) {
            return prev;
          }

          return [...prev, incoming];
        });
      };

      if (incoming.type === "image" && incoming.attachment?.url) {
        const image = new Image();

        image.src = incoming.attachment.url;

        image.onload = () => {
          addMessage();
        };

        image.onerror = () => {
          addMessage();
        };
      } else {
        addMessage();
      }

      api.post(`/v1/chat/${bookingId}/seen`);

      socket.emit("chat:delivered", {
        bookingId,
        messageId: incoming._id,
        userId,
      });
    };

    socket.on("chat:message", handleMessage);

    const handleSeen = (data: { bookingId: string; seenBy: string }) => {
      setMessages((prev) =>
        prev.map((msg) => {
          const alreadySeen = msg.seenBy?.includes(data.seenBy);

          if (alreadySeen) {
            return msg;
          }

          return {
            ...msg,
            seenBy: [...(msg.seenBy || []), data.seenBy],
          };
        }),
      );
    };

    socket.on("chat:seen", handleSeen);

    /* ======================================================
   DELIVERED
====================================================== */

    const handleDelivered = (data: {
      bookingId: string;
      messageId: string;
      userId: string;
    }) => {
      console.log("DELIVERED EVENT", data);

      if (data.bookingId !== bookingId) {
        return;
      }

      setDeliveredMessages((prev) => {
        const next = new Set(prev);

        next.add(data.messageId);

        return next;
      });
    };

    socket.on("chat:delivered", handleDelivered);

    /* ======================================================
   DELETE
====================================================== */

    const handleDeleted = (data: {
      messageId: string;
      bookingId: string;
      deletedAt: string;
    }) => {
      if (data.bookingId !== bookingId) {
        return;
      }

      setMessages((prev) =>
        prev.map((msg) => {
          // Original deleted message
          if (msg._id === data.messageId) {
            return {
              ...msg,
              isDeleted: true,
              deletedAt: data.deletedAt,
            };
          }

          // Any reply pointing to the deleted message
          if (msg.replyTo?.messageId === data.messageId) {
            return {
              ...msg,
              replyTo: {
                ...msg.replyTo,
                isDeleted: true,
              },
            };
          }

          return msg;
        }),
      );
    };

    socket.on("chat:deleted", handleDeleted);

    /* ======================================================
   REACTIONS
====================================================== */

    const handleReaction = (data: {
      bookingId: string;
      messageId: string;
      reactions: {
        userId: string;
        emoji: string;
      }[];
    }) => {
      if (data.bookingId !== bookingId) {
        return;
      }

      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === data.messageId
            ? {
                ...msg,
                reactions: data.reactions,
              }
            : msg,
        ),
      );
    };

    socket.on("chat:reaction", handleReaction);

    /* ======================================================
   TYPING
====================================================== */

    const handleTyping = (data: { bookingId: string; userId: string }) => {
      if (data.bookingId !== bookingId) {
        return;
      }

      if (data.userId === userId) {
        return;
      }

      setIsTyping(true);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
      }, 3000);
    };

    const handleStopTyping = (data: { bookingId: string; userId: string }) => {
      if (data.bookingId !== bookingId) {
        return;
      }

      if (data.userId === userId) {
        return;
      }

      setIsTyping(false);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };

    socket.on("chat:typing", handleTyping);

    socket.on("chat:stop-typing", handleStopTyping);

    return () => {
      socket.emit("leave-booking", bookingId);

      socket.off("chat:message", handleMessage);

      socket.off("chat:seen", handleSeen);

      socket.off("chat:delivered", handleDelivered);

      socket.off("chat:deleted", handleDeleted);

      socket.off("chat:reaction", handleReaction);

      socket.off("chat:typing", handleTyping);

      socket.off("chat:stop-typing", handleStopTyping);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [bookingId, userId]);

  /* ======================================================
     SCROLL LOGIC
  ====================================================== */

  const scrollToBottom = (behavior: ScrollBehavior | undefined = "smooth") => {
    bottomRef.current?.scrollIntoView({
      behavior,
    });
  };

  const handleScroll = () => {
    const container = messagesContainerRef.current;

    if (!container) return;

    const threshold = 120;

    const isNearBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight <
      threshold;

    shouldAutoScrollRef.current = isNearBottom;
  };

  useEffect(() => {
    if (shouldAutoScrollRef.current) {
      requestAnimationFrame(() => {
        scrollToBottom("smooth");
      });
    }
  }, [messages]);

  useEffect(() => {
    requestAnimationFrame(() => {
      scrollToBottom("auto");
    });
  }, []);

  /* ======================================================
   Location Sending
====================================================== */

  const handleSendLocation = async (location: {
    latitude: number;
    longitude: number;
    name: string;
    address: string;
    placeId?: string;
  }) => {
    if (!bookingId || sending || chatClosed) {
      return;
    }

    try {
      setSending(true);

      const { data } = await api.post(`/v1/chat/${bookingId}/messages`, {
        type: "location",
        location,
        replyTo: replyingTo?._id,
      });

      setMessages((prev) => [...prev, data.chat]);
      setReplyingTo(null);

      setShowLocationPicker(false);

      bottomRef.current?.scrollIntoView({
        behavior: "smooth",
      });
    } catch (err: any) {
      console.error("Failed to send location", err);

      alert(err?.response?.data?.message || "Failed to send location");
    } finally {
      setSending(false);
    }
  };

  /* ======================================================
   DOCUMENT SENDING
====================================================== */

  const handleSendDocument = async (file: File) => {
    if (!bookingId || sending || chatClosed) {
      return;
    }

    try {
      setSending(true);

      const formData = new FormData();

      formData.append("file", file);
      formData.append("replyTo", replyingTo?._id ?? "");

      const { data } = await api.post(
        `/v1/chat/${bookingId}/documents`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      setMessages((prev) => [...prev, data.chat]);
      setReplyingTo(null);

      requestAnimationFrame(() => {
        bottomRef.current?.scrollIntoView({
          behavior: "smooth",
        });
      });
    } catch (err: any) {
      alert(err?.response?.data?.message ?? "Failed to upload document");
    } finally {
      setSending(false);
    }
  };

  /* ======================================================
                  IMAGE SENDING
 ====================================================== */
  const handleSendImages = async (files: File[]) => {
    if (!bookingId || !userId || chatClosed) {
      return;
    }

    const uploadQueue = files.map((file) => {
      const tempId = `temp-${crypto.randomUUID()}`;

      const previewUrl = URL.createObjectURL(file);

      return {
        file,

        tempId,

        previewUrl,

        message: {
          _id: tempId,

          bookingId,

          senderId: userId,

          senderRole: role === "creator" ? "CREATOR" : "USER",

          type: "image",

          message: "",

          replyTo: replyingTo
            ? {
                messageId: replyingTo._id,

                senderId: replyingTo.senderId,

                senderRole: replyingTo.senderRole,

                type: replyingTo.type ?? "text",

                message: replyingTo.message,

                attachment: replyingTo.attachment,
              }
            : undefined,

          groupId: undefined,

          seenBy: [],

          attachment: {
            url: previewUrl,

            publicId: "",

            fileName: file.name,

            originalFileName: file.name,

            mimeType: file.type,

            fileSize: file.size,

            resourceType: "image",
          },

          tempPreviewUrl: previewUrl,

          isUploading: true,

          uploadProgress: 0,

          createdAt: new Date().toISOString(),
        } satisfies ChatMessage,
      };
    });

    setMessages((prev) => [
      ...prev,
      ...uploadQueue.map((item) => item.message),
    ]);

    requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({
        behavior: "smooth",
      });
    });

    const formData = new FormData();

    uploadQueue.forEach(({ file }) => {
      formData.append("files", file);
    });

    formData.append("replyTo", replyingTo?._id ?? "");

    try {
      const { data } = await api.post(
        `/v1/chat/${bookingId}/images`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },

          onUploadProgress: (progressEvent) => {
            if (!progressEvent.total) {
              return;
            }

            const progress = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total,
            );

            setMessages((prev) =>
              prev.map((msg) => {
                const uploading = uploadQueue.find(
                  (item) => item.tempId === msg._id,
                );

                if (!uploading) {
                  return msg;
                }

                return {
                  ...msg,
                  uploadProgress: progress,
                };
              }),
            );
          },
        },
      );

      const chats = data.messages as ChatMessage[];

      setMessages((prev) => {
        const next = [...prev];

        uploadQueue.forEach((upload, index) => {
          const chat = chats[index];

          if (!chat) {
            return;
          }

          const messageIndex = next.findIndex((m) => m._id === upload.tempId);

          if (messageIndex === -1) {
            return;
          }

          next[messageIndex] = {
            ...next[messageIndex],

            _id: chat._id,

            bookingId: chat.bookingId,

            senderId: chat.senderId,

            senderRole: chat.senderRole,

            type: chat.type,

            message: chat.message,

            groupId: chat.groupId,

            attachment: chat.attachment,

            location: chat.location,

            replyTo: chat.replyTo,

            reactions: chat.reactions ?? [],

            seenBy: chat.seenBy ?? [],

            createdAt: chat.createdAt,

            isUploading: false,

            uploadProgress: 100,

            uploadFailed: false,
          };
        });

        return next;
      });

      setReplyingTo(null);
    } catch (err) {
      setMessages((prev) =>
        prev.map((msg) => {
          const uploading = uploadQueue.find((item) => item.tempId === msg._id);

          if (!uploading) {
            return msg;
          }

          return {
            ...msg,

            isUploading: false,

            uploadFailed: true,
          };
        }),
      );

      console.error(err);
    }
  };
  /* ======================================================
     SEND
  ====================================================== */

  const handleSend = async () => {
    if (!input.trim() || !bookingId || sending || chatClosed) {
      return;
    }

    const messageText = input.trim();

    /* ==========================================
   STOP TYPING IMMEDIATELY
========================================== */

    if (hasEmittedTypingRef.current) {
      socket.emit("chat:stop-typing", {
        bookingId,
        userId,
      });

      hasEmittedTypingRef.current = false;
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    setInput("");

    setSending(true);

    shouldAutoScrollRef.current = true;

    const tempMessage: ChatMessage = {
      _id: "temp-" + Date.now(),

      bookingId,

      senderId: userId ?? "temp",

      senderRole: role === "creator" ? "CREATOR" : "USER",

      message: messageText,

      replyTo: replyingTo
        ? {
            messageId: replyingTo._id,

            senderId: replyingTo.senderId,
            senderRole: replyingTo.senderRole,

            type: replyingTo.type ?? "text",

            message: replyingTo.message,

            isDeleted: replyingTo.isDeleted,

            attachment: replyingTo.attachment,
          }
        : undefined,

      seenBy: userId ? [userId] : [],

      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempMessage]);

    try {
      const res = await api.post(`/v1/chat/${bookingId}/messages`, {
        message: messageText,
        replyTo: replyingTo?._id,
      });

      const saved = res.data.chat;

      setMessages((prev) =>
        prev.map((msg) => (msg._id === tempMessage._id ? saved : msg)),
      );
      setReplyingTo(null);
    } catch (err: any) {
      setMessages((prev) => prev.filter((m) => m._id !== tempMessage._id));

      const msg = err?.response?.data?.message || "Failed to send message";

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

  /* ======================================================
   DELETE MESSAGE
====================================================== */

  const handleDeleteMessage = async (messageId: string) => {
    try {
      await api.delete(`/v1/chat/message/${messageId}`);

      setActionsOpen(false);

      setSelectedMessageId(null);
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to delete message");
    }
  };

  /* ======================================================
   REACT TO MESSAGE
====================================================== */

  const handleReactToMessage = async (messageId: string, emoji: string) => {
    try {
      await api.post(`/v1/chat/message/${messageId}/react`, {
        emoji,
      });
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to react");
    }
  };

  /* ======================================================
   LONG PRESS
====================================================== */

  const startLongPress = (messageId: string, canDelete: boolean) => {
    if (!canDelete) {
      return;
    }

    longPressTimerRef.current = setTimeout(() => {
      setSelectedMessageId(messageId);

      setActionsOpen(true);
    }, 500);
  };

  /* ======================================================
   END LONG PRESS
====================================================== */

  const endLongPress = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);

      longPressTimerRef.current = null;
    }
  };

  /* ======================================================
     ENTER SEND
  ====================================================== */

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !sending) {
      handleSend();
    }
  };

  /* ======================================================
     HELPERS
  ====================================================== */

  const getInitials = (name: string) => {
    if (!name) return "U";

    const parts = name.trim().split(" ");

    return parts.length === 1
      ? parts[0][0].toUpperCase()
      : (parts[0][0] + parts[1][0]).toUpperCase();
  };

  const profile = conversation?.otherUser?.profile;

  const displayName = profile?.displayName || profile?.username || "User";

  const avatarUrl =
    profile?.avatarUrl ||
    profile?.avatar ||
    profile?.profilePhotos?.[0] ||
    null;

  const serviceTitle = conversation?.service?.title || "Service";

  const handleInputChange = (value: string) => {
    setInput(value);

    if (chatClosed || !bookingId || !userId) {
      return;
    }

    if (!hasEmittedTypingRef.current) {
      socket.emit("chat:typing", {
        bookingId,
        userId,
      });

      hasEmittedTypingRef.current = true;
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("chat:stop-typing", {
        bookingId,
        userId,
      });

      hasEmittedTypingRef.current = false;
    }, 1500);
  };

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
        <ChatHeader
          displayName={displayName}
          avatarUrl={avatarUrl}
          serviceTitle={serviceTitle}
          slotText={slotText}
          chatClosed={chatClosed}
          onClose={() => navigate(-1)}
          getInitials={getInitials}
        />

        {/* CHAT BODY */}

        <div
          ref={messagesContainerRef}
          onScroll={handleScroll}
          className="
    chat-scrollbar
    scroll-smooth
    
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
            <MobileMessageList
              loading={loading}
              error={error}
              messages={messages}
              userId={userId}
              deliveredMessages={deliveredMessages}
              handleReactToMessage={handleReactToMessage}
              setSelectedMessageId={setSelectedMessageId}
              setActionsOpen={setActionsOpen}
              startLongPress={startLongPress}
              endLongPress={endLongPress}
              isTyping={isTyping}
              bottomRef={bottomRef}
              setMapPickerOpen={setMapPickerOpen}
              setSelectedMapLocation={setSelectedMapLocation}
              setImageViewerOpen={setImageViewerOpen}
              setSelectedImages={setSelectedImages}
              setSelectedImageIndex={setSelectedImageIndex}
            />
          </div>
        </div>

        <ChatComposer
          input={input}
          handleInputChange={handleInputChange}
          handleKeyDown={handleKeyDown}
          handleSend={handleSend}
          replyingTo={replyingTo}
          onCancelReply={() => setReplyingTo(null)}
          sending={sending}
          chatClosed={chatClosed}
          showLocationButton={true}
          onLocationClick={() => setShowLocationPicker(true)}
          onDocumentSelect={handleSendDocument}
          onImageSelect={(files) => {
            setSelectedImageFiles(files);
            setImagePreviewOpen(true);
          }}
        />

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

      <MessageActions
        isOpen={actionsOpen}
        canDelete={!!selectedMessageId}
        onReply={() => {
          if (!selectedMessageId) {
            return;
          }

          const message = messages.find((m) => m._id === selectedMessageId);

          if (!message) {
            return;
          }

          setReplyingTo(message);
        }}
        onDelete={() => {
          if (selectedMessageId) {
            handleDeleteMessage(selectedMessageId);
          }
        }}
        onClose={() => {
          setActionsOpen(false);
          setSelectedMessageId(null);
        }}
      />

      <LocationPickerModal
        open={showLocationPicker}
        onClose={() => setShowLocationPicker(false)}
        onConfirm={handleSendLocation}
      />

      <MapPickerModal
        open={mapPickerOpen && selectedMapLocation !== null}
        latitude={selectedMapLocation?.latitude ?? 0}
        longitude={selectedMapLocation?.longitude ?? 0}
        onClose={() => setMapPickerOpen(false)}
      />

      <ImageViewerModal
        open={imageViewerOpen}
        images={selectedImages}
        currentIndex={selectedImageIndex}
        onIndexChange={setSelectedImageIndex}
        onClose={() => setImageViewerOpen(false)}
      />

      <ImagePreviewModal
        open={imagePreviewOpen}
        files={selectedImageFiles}
        sending={sending}
        onCancel={() => {
          setImagePreviewOpen(false);
          setSelectedImageFiles([]);
        }}
        onSend={async (files) => {
          if (!files.length) {
            return;
          }

          handleSendImages(files);

          setImagePreviewOpen(false);
          setSelectedImageFiles([]);
        }}
      />
    </Layout>
  );
}
