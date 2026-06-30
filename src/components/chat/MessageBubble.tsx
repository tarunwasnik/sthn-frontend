//frontend/src/components/chat/MessageBubble.tsx

import {
  MapContainer,
  Marker,
  TileLayer,
} from "react-leaflet";

import "leaflet/dist/leaflet.css";
import type { MouseEvent } from "react";
import api from "../../api/axios";



interface MessageBubbleProps {
  msg: any;

  index: number;

  messages: any[];

  userId: string | null;

  deliveredMessages: Set<string>;

  handleReactToMessage: (
    messageId: string,
    emoji: string
  ) => void;

  setSelectedMessageId: (
    id: string | null
  ) => void;

  setActionsOpen: (
    open: boolean
  ) => void;

  setMapPickerOpen?: (
    open: boolean
  ) => void;

  setSelectedMapLocation?: (
    location: {
      latitude: number;
      longitude: number;
    }
  ) => void;

  onContextMenu?: (
    e: MouseEvent<HTMLDivElement>
  ) => void;

  onTouchStart?: () => void;

  onTouchEnd?: () => void;

  onTouchCancel?: () => void;


setImageViewerOpen: (
  open: boolean
) => void;

setSelectedImageUrl: (
  url: string
) => void;

setSelectedImageName: (
  name: string
) => void;

  
}

export default function MessageBubble({
  msg,
  index,
  messages,
  userId,
  deliveredMessages,
  handleReactToMessage,
  setSelectedMessageId,
  setActionsOpen,
 
setImageViewerOpen,
setSelectedImageUrl,
setSelectedImageName,
  setMapPickerOpen,
  setSelectedMapLocation,
  onContextMenu,
  onTouchStart,
  onTouchEnd,
  onTouchCancel,
}: MessageBubbleProps) {

  const isMine =
    msg.senderId === userId;




  const formatFileSize = (bytes?: number) => {
  if (!bytes) return "";

  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024)
    return `${(bytes / 1024).toFixed(1)} KB`;

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};


const getDocumentType = (
  fileName?: string
) => {

  const extension =
    fileName
      ?.split(".")
      .pop()
      ?.toLowerCase();

  switch (extension) {

    case "pdf":
      return "PDF Document";

    case "doc":
    case "docx":
      return "Word Document";

    case "xls":
    case "xlsx":
    case "csv":
      return "Excel Spreadsheet";

    case "ppt":
    case "pptx":
      return "PowerPoint Presentation";

    case "txt":
      return "Text Document";

    case "zip":
    case "rar":
    case "7z":
      return "Compressed Archive";

    case "json":
      return "JSON File";

    case "xml":
      return "XML File";

    case "html":
      return "HTML File";

    case "css":
      return "CSS File";

    case "js":
      return "JavaScript File";

    case "ts":
      return "TypeScript File";

    case "py":
      return "Python File";

    case "php":
      return "PHP File";

    default:
      return "Document";
  }

};

const getDocumentIcon = (
  fileName?: string
) => {

  const extension =
    fileName
      ?.split(".")
      .pop()
      ?.toLowerCase();

  switch (extension) {

    case "pdf":
      return "📕";

    case "doc":
    case "docx":
      return "📘";

    case "xls":
    case "xlsx":
    case "csv":
      return "📗";

    case "ppt":
    case "pptx":
      return "📙";

    case "txt":
      return "📝";

    case "zip":
    case "rar":
    case "7z":
      return "🗜️";

    case "json":
      return "{}";

    case "xml":
      return "📰";

    case "html":
      return "🌐";

    case "css":
      return "🎨";

    case "js":
      return "⚡";

    case "ts":
      return "🔷";

    case "py":
      return "🐍";

    case "php":
      return "🐘";

    default:
      return "📄";
  }

};


const downloadDocument = async () => {
  try {
    const response = await api.get(
      `/v1/chat/document/${msg._id}/download`,
      {
        responseType: "blob",
      }
    );

    const blob = new Blob([response.data]);

    const url =
      window.URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;

    link.download =
      msg.attachment.originalFileName ||
      msg.message;

    document.body.appendChild(link);

    link.click();

    link.remove();

    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.error(err);
    alert("Failed to download document");
  }
};

const openDocument = async () => {
  try {
    const response = await api.get(
      `/v1/chat/document/${msg._id}/download`,
      {
        responseType: "blob",
      }
    );

    const blob = new Blob([response.data]);

    const url =
      window.URL.createObjectURL(blob);

    window.open(url, "_blank");

    setTimeout(() => {
      window.URL.revokeObjectURL(url);
    }, 10000);
  } catch (err) {
    console.error(err);
    alert("Failed to open document");
  }
};



  return (
    <>

    <div
  
  onContextMenu={onContextMenu}
  onTouchStart={onTouchStart}
  onTouchEnd={onTouchEnd}
  onTouchCancel={onTouchCancel}
  className={`
    flex
    ${
      isMine
        ? "justify-end"
        : "justify-start"
    }
    ${
      index > 0 &&
      messages[index - 1]
        .senderId ===
      msg.senderId
        ? "mt-1"
        : "mt-3"
    }
  `}
>

                      <div
                        className={`
                          relative
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

 {msg.isDeleted ? (

  <p
    className="
      text-[14px]
      italic
      text-white/50
    "
  >
    This message was deleted
  </p>

) : msg.type === "location" && msg.location ? (

  <div className="space-y-3">

    <button
  type="button"
  onClick={() => {
    setSelectedMapLocation?.({
      latitude: msg.location!.latitude,
      longitude: msg.location!.longitude,
    });

    setMapPickerOpen?.(true);
  }}
  className="
    block
    w-full
    overflow-hidden
    rounded-xl
    border
    border-white/10
    transition
    hover:border-blue-400/40
  "
>

      <MapContainer
        center={[
          msg.location.latitude,
          msg.location.longitude,
        ]}
        zoom={15}
        zoomControl={false}
        dragging={false}
        scrollWheelZoom={false}
        doubleClickZoom={false}
        touchZoom={false}
        boxZoom={false}
        keyboard={false}
        attributionControl={false}
        style={{
          height: "180px",
          width: "100%",
        }}
      >

        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <Marker
          position={[
            msg.location.latitude,
            msg.location.longitude,
          ]}
        />

      </MapContainer>

    </button>

    <div>

      <p className="text-[15px] font-semibold">
        📍 {msg.location.name}
      </p>

      <p
        className="
          mt-1
          text-[13px]
          text-white/70
          break-words
        "
      >
        {msg.location.address}
      </p>

    </div>

    <button
  onClick={() => {
    setSelectedMapLocation?.({
      latitude: msg.location!.latitude,
      longitude: msg.location!.longitude,
    });

    setMapPickerOpen?.(true);
  }}
  className="
    inline-flex
    items-center
    text-blue-400
    hover:text-blue-300
    text-sm
    font-medium
  "
>
  Open in Maps →
</button>

  </div>

) : msg.type === "document" && msg.attachment ? (

  <div className="space-y-3">

    <div
      className="
        rounded-xl
        border
        border-white/10
        bg-white/[0.05]
        p-3
      "
    >
      <div className="flex items-start gap-3">

  <div className="text-3xl">
    {getDocumentIcon(
      msg.attachment.originalFileName
    )}
  </div>

  <div className="min-w-0 flex-1">

    <p
      className="
        text-sm
        font-medium
        break-all
      "
    >
      {msg.attachment.originalFileName ??
        msg.message}
    </p>

    <p
      className="
        mt-1
        text-xs
        text-white/60
      "
    >
      {getDocumentType(
        msg.attachment.originalFileName
      )}

      {msg.attachment.fileSize
        ? ` • ${formatFileSize(
            msg.attachment.fileSize
          )}`
        : ""}
    </p>

  </div>

</div>

      <div className="mt-3 flex gap-2">

        <button
  onClick={openDocument}
  className="
    rounded-lg
    bg-white/10
    px-3
    py-1.5
    text-xs
    hover:bg-white/20
    transition
  "
>
  Open
</button>

<button
  onClick={downloadDocument}
  className="
    rounded-lg
    bg-white/10
    px-3
    py-1.5
    text-xs
    hover:bg-white/20
    transition
  "
>
  Download
</button>

      </div>

    </div>

  </div>

  ) : msg.type === "image" && msg.attachment ? (

  <div className="space-y-2">

    <button
      type="button"
    onClick={() => {
  setSelectedImageUrl?.(msg.attachment.url);

  setSelectedImageName?.(
    msg.attachment.originalFileName ?? "Image"
  );

  setImageViewerOpen?.(true);
}}
      className="
        block
        overflow-hidden
        rounded-xl
        border
        border-white/10
        hover:border-white/20
        transition
      "
    >
      <img
        src={msg.attachment.url}
        alt={
          msg.attachment.originalFileName ||
          "Image"
        }
        loading="lazy"
        className="
          max-h-[360px]
          w-full
          object-cover
        "
      />
    </button>

    <div
      className="
        flex
        items-center
        justify-between
        text-xs
        text-white/60
      "
    >
      <span className="truncate">
        {msg.attachment.originalFileName}
      </span>

      {msg.attachment.fileSize && (
        <span className="ml-3 shrink-0">
          {formatFileSize(
            msg.attachment.fileSize
          )}
        </span>
      )}
    </div>

  </div>

) : (

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

)

}

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

  {isMine && (

  <span className="ml-2">

    {msg.seenBy &&
    msg.seenBy.length > 1
      ? "Seen"
      : deliveredMessages.has(
          msg._id
        )
      ? "Delivered"
      : "Sent"}

  </span>

)}

</div>

{!msg.isDeleted &&
  ![
    "location",
    "document",
    "image",
  ].includes(msg.type) && (
    <button
      onClick={() =>
        handleReactToMessage(
          msg._id,
          "👍"
        )
      }
      className="
        mt-1
        text-xs
        text-white/50
        hover:text-white
      "
    >
      👍
    </button>
)}

{msg.reactions &&
  msg.reactions.length > 0 && (
    <div className="mt-1 flex gap-1 flex-wrap">
      {(
        msg.reactions as {
          emoji: string;
        }[]
      ).map(
        (
          reaction: {
            emoji: string;
          },
          index: number
        ) => (
          <span
            key={index}
            className="
              text-xs
              px-2
              py-[2px]
              rounded-full
              bg-white/10
            "
          >
            {reaction.emoji}
          </span>
        )
      )}
    </div>
)}

                      </div>

                    </div>

                    

    </>
  );
}