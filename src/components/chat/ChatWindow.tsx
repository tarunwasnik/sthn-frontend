//frontend/src/components/chat/ChatWindow.tsx


import {
  useEffect,
  useRef,
  useState,
} from "react";


import MessageList from "./MessageList";
import ChatComposer from "./ChatComposer";
import ChatHeader from "./ChatHeader";
import api from "../../api/axios";

import {
  getConversations,
} from "../../api/chat";

import type {
  Conversation,
} from "../../api/chat";

import { useAuth } from "../../context/AuthContext";

import { socket } from "../../lib/socket";
import ImageViewerModal from "./ImageViewerModal";
import MapPickerModal from "./MapPickerModal";
import MessageActions from "./MessageActions";
import LocationPickerModal from "./LocationPickerModal";
import ImagePreviewModal from "./ImagePreviewModal";


import "leaflet/dist/leaflet.css";



interface ChatMessage {
  _id: string;
  bookingId: string;
  senderId: string;
  senderRole: "USER" | "CREATOR";

  type?: string;

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
    resourceType: string;
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
interface ChatWindowProps {
  bookingId: string;
  embedded?: boolean;
  onClose?: () => void;
}

export default function ChatWindow({
  bookingId,
  embedded = false,
  onClose,
}: ChatWindowProps){

  const {
  role,
  userId,
} = useAuth();

  
  const [
    messages,
    setMessages,
  ] = useState<
    ChatMessage[]
  >([]);

const [imageViewerOpen, setImageViewerOpen] =
  useState(false);

const [selectedImageUrl, setSelectedImageUrl] =
  useState("");

const [selectedImageName, setSelectedImageName] =
  useState("");

const [mapPickerOpen, setMapPickerOpen] =
  useState(false);

const [selectedMapLocation, setSelectedMapLocation] =
  useState<{
    latitude: number;
    longitude: number;
  } | null>(null);


const [showLocationPicker, setShowLocationPicker] = useState(false);
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

    const [selectedMessageId, setSelectedMessageId] =
  useState<string | null>(null);

const [actionsOpen, setActionsOpen] =
  useState(false);

    const [isTyping, setIsTyping] =
  useState(false);

  const [
  deliveredMessages,
  setDeliveredMessages,
] = useState<
  Set<string>
>(
  new Set()
);

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

const typingTimeoutRef =
  useRef<
    ReturnType<typeof setTimeout> | null
  >(null);

const hasEmittedTypingRef =
  useRef(false);


const [imagePreviewOpen, setImagePreviewOpen] =
  useState(false);

const [selectedImageFiles, setSelectedImageFiles] =
  useState<File[]>([]);


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

console.log(
  "CHAT HISTORY",
  res.data.chats
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

if (role === "creator") {
  const creatorRes =
    await api.get(
      "/v1/creator/bookings"
    );

  booking =
    creatorRes.data.bookings.find(
      (b: any) =>
        b._id === bookingId
    );
} else {
  const userRes =
    await api.get(
       "/v1/bookings/user"
    );

  booking =
    userRes.data.bookings.find(
      (b: any) =>
        b._id === bookingId
    );
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

  console.log(
    "CHAT WINDOW JOIN",
    bookingId
  );

  socket.emit(
    "join-booking",
    bookingId
  );

 const handleMessage = (
  msg: ChatMessage
) => {

  const addMessage = () => {
    setMessages((prev) => {

      const exists =
        prev.find(
          (m) =>
            m._id ===
            msg._id
        );

      if (exists) {
        return prev;
      }

      const isMine =
        msg.senderId ===
        userId;

      if (isMine) {
        return prev;
      }

      return [
        ...prev,
        msg,
      ];
    });
  };

  if (
    (
      msg.type === "IMAGE" ||
      msg.type === "image"
    ) &&
    msg.attachment?.url
  ) {

    const image =
      new Image();

    image.src =
      msg.attachment.url;

    image.onload = () => {
      addMessage();
    };

    image.onerror = () => {
      // Don't lose the message if preloading fails.
      addMessage();
    };

  } else {

    addMessage();

  }

  api.post(
    `/v1/chat/${bookingId}/seen`
  );

  socket.emit(
    "chat:delivered",
    {
      bookingId,
      messageId: msg._id,
      userId,
    }
  );
};

socket.on(
  "chat:message",
  handleMessage
);
  /* ======================================================
     SEEN
  ====================================================== */

  const handleSeen = (
    data: {
      bookingId: string;
      seenBy: string;
    }
  ) => {

    console.log(
      "CHAT SEEN EVENT",
      data
    );

    setMessages((prev) =>
      prev.map((msg) => {

        const alreadySeen =
          msg.seenBy?.includes(
            data.seenBy
          );

        if (alreadySeen) {
          return msg;
        }

        return {
          ...msg,
          seenBy: [
            ...(msg.seenBy || []),
            data.seenBy,
          ],
        };
      })
    );
  };

  socket.on(
    "chat:seen",
    handleSeen
  );


  /* ======================================================
   DELIVERED
====================================================== */

const handleDelivered = (
  data: {
    bookingId: string;
    messageId: string;
    userId: string;
  }
) => {
  console.log(
    "DELIVERED EVENT",
    data
  );

  if (
    data.bookingId !==
    bookingId
  ) {
    return;
  }

  setDeliveredMessages(
    (prev) => {

      const next =
        new Set(prev);

      next.add(
        data.messageId
      );

      return next;
    }
  );
};

socket.on(
  "chat:delivered",
  handleDelivered
);


 /* ======================================================
     DELETE
  ====================================================== */

const handleDeleted = (
  data: {
    messageId: string;
    bookingId: string;
    deletedAt: string;
  }
) => {

  if (
    data.bookingId !== bookingId
  ) {
    return;
  }

  setMessages((prev) =>
    prev.map((msg) =>
      msg._id === data.messageId
        ? {
            ...msg,
            isDeleted: true,
            deletedAt:
              data.deletedAt,
          }
        : msg
    )
  );
};

socket.on(
  "chat:deleted",
  handleDeleted
);



/* ======================================================
   REACTIONS
====================================================== */

const handleReaction = (
  data: {
    bookingId: string;
    messageId: string;
    reactions: {
      userId: string;
      emoji: string;
    }[];
  }
) => {

  if (
    data.bookingId !== bookingId
  ) {
    return;
  }

  setMessages((prev) =>
    prev.map((msg) =>
      msg._id === data.messageId
        ? {
            ...msg,
            reactions:
              data.reactions,
          }
        : msg
    )
  );
};

socket.on(
  "chat:reaction",
  handleReaction
);


  /* ======================================================
     TYPING
  ====================================================== */

  const handleTyping = (
    data: {
      bookingId: string;
      userId: string;
    }
  ) => {

    if (
      data.bookingId !==
      bookingId
    ) {
      return;
    }

    if (
      data.userId ===
      userId
    ) {
      return;
    }

    setIsTyping(true);

    if (
      typingTimeoutRef.current
    ) {
      clearTimeout(
        typingTimeoutRef.current
      );
    }

    typingTimeoutRef.current =
      setTimeout(() => {

        setIsTyping(false);

      }, 3000);
  };

  const handleStopTyping = (
    data: {
      bookingId: string;
      userId: string;
    }
  ) => {

    if (
      data.bookingId !==
      bookingId
    ) {
      return;
    }

    if (
      data.userId ===
      userId
    ) {
      return;
    }

    setIsTyping(false);

    if (
      typingTimeoutRef.current
    ) {
      clearTimeout(
        typingTimeoutRef.current
      );
    }
  };

  socket.on(
    "chat:typing",
    handleTyping
  );

  socket.on(
    "chat:stop-typing",
    handleStopTyping
  );

  return () => {

    console.log(
      "CHAT WINDOW UNMOUNT",
      bookingId
    );

    socket.off(
      "chat:message",
      handleMessage
    );

    socket.off(
      "chat:seen",
      handleSeen
    );

    socket.off(
      "chat:typing",
      handleTyping
    );

    socket.off(
      "chat:stop-typing",
      handleStopTyping
    );

    socket.off(
  "chat:delivered",
  handleDelivered
);

socket.off(
  "chat:deleted",
  handleDeleted
);

socket.off(
  "chat:reaction",
  handleReaction
);

    if (
      typingTimeoutRef.current
    ) {
      clearTimeout(
        typingTimeoutRef.current
      );
    }
  };

}, [bookingId, userId]);




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



/* ==========================================
   STOP TYPING IMMEDIATELY
========================================== */

if (
  hasEmittedTypingRef.current
) {

  socket.emit(
    "chat:stop-typing",
    {
      bookingId,
      userId,
    }
  );

  hasEmittedTypingRef.current =
    false;
}

if (
  typingTimeoutRef.current
) {
  clearTimeout(
    typingTimeoutRef.current
  );
}

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

  senderId: userId ?? "temp",

  senderRole:
    role ===
    "creator"
      ? "CREATOR"
      : "USER",

  message:
    messageText,

  seenBy: userId
    ? [userId]
    : [],

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
   Location Sending
====================================================== */

const handleSendLocation = async (location: {
  latitude: number;
  longitude: number;
  name: string;
  address: string;
  placeId?: string;
}) => {
  if (!bookingId || sending) return;

  try {
    setSending(true);

    const { data } = await api.post(
      `/v1/chat/${bookingId}/messages`,
      {
        type: "location",
        location,
      }
    );

    setMessages((prev) => [...prev, data.chat]);

    setShowLocationPicker(false);

    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({
        behavior: "smooth",
      });
    }
  } catch (err) {
    console.error("Failed to send location", err);
  } finally {
    setSending(false);
  }
};

/* ======================================================
  Document Sending
====================================================== */
const handleSendDocument = async (
  file: File
) => {
  if (
    !bookingId ||
    sending ||
    chatClosed
  ) {
    return;
  }

  try {
    setSending(true);

    const formData = new FormData();

    formData.append(
      "file",
      file
    );

    const { data } =
      await api.post(
        `/v1/chat/${bookingId}/documents`,
        formData,
        {
          headers: {
            "Content-Type":
              "multipart/form-data",
          },
        }
      );

    setMessages((prev) => [
      ...prev,
      data.chat,
    ]);

    requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({
        behavior: "smooth",
      });
    });
  } catch (err: any) {
    alert(
      err?.response?.data?.message ??
        "Failed to upload document"
    );
  } finally {
    setSending(false);
  }
};


/* ======================================================
   IMAGE SENDING
====================================================== */

const handleSendImage = async (
  file: File,
  tempId: string
) => {
  if (
    !bookingId ||
    chatClosed
  ) {
    return;
  }

  if (!userId) {
    return;
  }

  try {
    const formData =
      new FormData();

    formData.append(
      "file",
      file
    );

    const { data } =
  await api.post(
    `/v1/chat/${bookingId}/images`,
    formData,
    {
      headers: {
        "Content-Type":
          "multipart/form-data",
      },

      onUploadProgress: (
        progressEvent
      ) => {

        if (!progressEvent.total) {
          return;
        }

        const progress =
          Math.round(
            (progressEvent.loaded * 100) /
              progressEvent.total
          );

        setMessages((prev) =>
          prev.map((msg) =>
            msg._id === tempId
              ? {
                  ...msg,
                  uploadProgress:
                    progress,
                }
              : msg
          )
        );
      },
    }
  );

    setMessages((prev) =>
      prev.map((msg) => {
        if (msg._id !== tempId) {
          return msg;
        }

        return {
          ...msg,

          _id: data.chat._id,

          bookingId:
            data.chat.bookingId,

          senderId:
            data.chat.senderId,

          senderRole:
            data.chat.senderRole,

          type:
            data.chat.type,

          message:
            data.chat.message,

          attachment:
            data.chat.attachment,

          location:
            data.chat.location,

          reactions:
            data.chat.reactions ?? [],

          seenBy:
            data.chat.seenBy ?? [],

          createdAt:
            data.chat.createdAt,

          isUploading: false,

          uploadProgress: 100,

          uploadFailed: false,
        };
      })
    );

    return data.chat;

  } catch (err) {

    setMessages((prev) =>
      prev.map((msg) =>
        msg._id === tempId
          ? {
              ...msg,

              isUploading: false,

              uploadFailed: true,
            }
          : msg
      )
    );

    throw err;
  }
};



const handleSendImages = (
  files: File[]
) => {

  if (
    !bookingId ||
    !userId ||
    chatClosed
  ) {
    return;
  }

  const uploadQueue = files.map((file) => {
  const tempId =
    `temp-${crypto.randomUUID()}`;

  const previewUrl =
    URL.createObjectURL(file);

  return {
    file,
    tempId,
    previewUrl,
    message: {
      _id: tempId,

      bookingId,

      senderId: userId,

      senderRole:
        role === "creator"
          ? "CREATOR"
          : "USER",

      type: "image",

      message: "",

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

      tempPreviewUrl:
        previewUrl,

      isUploading: true,

      uploadProgress: 0,

      createdAt:
        new Date().toISOString(),
    } satisfies ChatMessage,
  };
});

      

 setMessages((prev) => [
  ...prev,
  ...uploadQueue.map(
    (item) => item.message
  ),
]);

  requestAnimationFrame(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  });

 uploadQueue.forEach(
  ({ file, tempId }) => {
    handleSendImage(
      file,
      tempId
    ).catch(console.error);
  }
);
};



/* ======================================================
   DELETE MESSAGE
====================================================== */

const handleDeleteMessage = async (
  messageId: string
) => {
  try {

    await api.delete(
      `/v1/chat/message/${messageId}`
    );

    setActionsOpen(false);

    setSelectedMessageId(null);

  } catch (err: any) {

    alert(
      err?.response?.data?.message ||
      "Failed to delete message"
    );

  }
};


/* ======================================================
   REACT TO MESSAGE
====================================================== */

const handleReactToMessage = async (
  messageId: string,
  emoji: string
) => {
  try {

    await api.post(
      `/v1/chat/message/${messageId}/react`,
      {
        emoji,
      }
    );

  } catch (err: any) {

    alert(
      err?.response?.data?.message ||
      "Failed to react"
    );

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








const handleInputChange = (
  value: string
) => {
  setInput(value);

  if (
    chatClosed ||
    !bookingId ||
    !userId
  ) {
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
    

      <div
  className={
    embedded
      ? `
        h-full
        w-full
        flex
        flex-col
        overflow-hidden
        text-[#F8FAFC]
        p-4
      `
      : `
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
      `
  }
>

        {/* HEADER */}

        <ChatHeader
  displayName={displayName}
  avatarUrl={avatarUrl}
  serviceTitle={serviceTitle}
  slotText={slotText}
  chatClosed={chatClosed}
  onClose={onClose}
  getInitials={getInitials}
/>

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
  flex-1
  min-h-0
  overflow-y-auto
  overflow-x-hidden
  overscroll-contain
  rounded-[22px]
  pr-1
  
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

            <MessageList
  loading={loading}
  error={error}
  messages={messages}
  userId={userId}
  deliveredMessages={deliveredMessages}
  handleReactToMessage={
    handleReactToMessage
  }
  setSelectedMessageId={
    setSelectedMessageId
  }
  setActionsOpen={
    setActionsOpen
  }
  isTyping={isTyping}
  bottomRef={bottomRef}
  setMapPickerOpen={
    setMapPickerOpen
  }
  setSelectedMapLocation={
    setSelectedMapLocation
  }

  setImageViewerOpen={
  setImageViewerOpen
}

setSelectedImageUrl={
  setSelectedImageUrl
}

setSelectedImageName={
  setSelectedImageName
}
/>

          </div>

        </div>

        {/* INPUT */}

        <ChatComposer
  input={input}
  handleInputChange={handleInputChange}
  handleKeyDown={handleKeyDown}
  handleSend={handleSend}
  sending={sending}
  chatClosed={chatClosed}
  showLocationButton={true}
  onLocationClick={() =>
  setShowLocationPicker(true)
}
onDocumentSelect={
  handleSendDocument
}
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

<MessageActions
  isOpen={actionsOpen}
  canDelete={
    !!selectedMessageId
  }
  onDelete={() => {
    if (selectedMessageId) {
      handleDeleteMessage(
        selectedMessageId
      );
    }
  }}
  onClose={() => {
    setActionsOpen(false);
    setSelectedMessageId(null);
  }}
/>

<LocationPickerModal
  open={showLocationPicker}
  onClose={() =>
    setShowLocationPicker(false)
  }
  onConfirm={handleSendLocation}
/>

<MapPickerModal
  open={mapPickerOpen}
  onClose={() => setMapPickerOpen(false)}
  latitude={
    selectedMapLocation?.latitude ?? 0
  }
  longitude={
    selectedMapLocation?.longitude ?? 0
  }
/>
<ImageViewerModal
  open={imageViewerOpen}
  imageUrl={selectedImageUrl}
  fileName={selectedImageName}
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
  onSend={(files) => {
  if (!files.length) return;

  // Close preview immediately
  setImagePreviewOpen(false);
  setSelectedImageFiles([]);

  // Start uploads in background
  handleSendImages(files);
}}
/>

</div>

);
}