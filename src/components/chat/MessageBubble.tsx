//frontend/src/components/chat/MessageBubble.tsx

import {
  MapContainer,
  Marker,
  TileLayer,
} from "react-leaflet";

import "leaflet/dist/leaflet.css";
import type { MouseEvent } from "react";

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
  setMapPickerOpen,
  setSelectedMapLocation,
  onContextMenu,
  onTouchStart,
  onTouchEnd,
  onTouchCancel,
}: MessageBubbleProps) {

  const isMine =
    msg.senderId === userId;



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

)}

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
 msg.type !== "location" && (
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