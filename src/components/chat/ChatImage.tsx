//frontend/src/components/chat/ChatImage.tsx

import {
  useEffect,
  useRef,
  useState,
} from "react";

interface ChatImageProps {
  msg: any;

  onOpen: () => void;
}

export default function ChatImage({
  msg,
  onOpen,
}: ChatImageProps) {
  const imageRef =
    useRef<HTMLImageElement | null>(
      null
    );

  const [displaySrc, setDisplaySrc] =
  useState(
    msg.tempPreviewUrl ??
      msg.attachment.url
  );

const [loaded, setLoaded] =
  useState(
    !!msg.tempPreviewUrl
  );

  useEffect(() => {
  const nextSrc =
    msg.attachment?.url;

  if (!nextSrc) {
    return;
  }

  // Already displaying the final image
  if (displaySrc === nextSrc) {
    return;
  }

  // If we're still showing the blob preview,
  // don't switch until the network image
  // has completely loaded.
  const image = new Image();

  image.src = nextSrc;

  image.onload = () => {
    setDisplaySrc(nextSrc);

    if (msg.tempPreviewUrl) {
      URL.revokeObjectURL(
        msg.tempPreviewUrl
      );
    }
  };

  return () => {
    image.onload = null;
  };

}, [
  msg.attachment?.url,
  msg.tempPreviewUrl,
  displaySrc,
]);useEffect(() => {
  const nextSrc =
    msg.attachment?.url;

  if (!nextSrc) {
    return;
  }

  // Already displaying the final image
  if (displaySrc === nextSrc) {
    return;
  }

  // If we're still showing the blob preview,
  // don't switch until the network image
  // has completely loaded.
  const image = new Image();

  image.src = nextSrc;

  image.onload = () => {
    setDisplaySrc(nextSrc);

    if (msg.tempPreviewUrl) {
      URL.revokeObjectURL(
        msg.tempPreviewUrl
      );
    }
  };

  return () => {
    image.onload = null;
  };

}, [
  msg.attachment?.url,
  msg.tempPreviewUrl,
  displaySrc,
]);

 return (
  <div className="space-y-2">

    <button
      type="button"
      onClick={onOpen}
      className="
        relative
        block
        overflow-hidden
        rounded-xl
        border
        border-white/10
        hover:border-white/20
        transition
      "
    >

      {/* Receiver Placeholder */}
      {!loaded && (
        <div
          className="
            absolute
            inset-0
            animate-pulse
            bg-gradient-to-br
            from-white/10
            via-white/5
            to-white/10
          "
        />
      )}

      <img
        ref={imageRef}
        src={displaySrc}
        alt={
          msg.attachment
            ?.originalFileName ??
          "Image"
        }
        draggable={false}
        loading="lazy"
        onLoad={() =>
          setLoaded(true)
        }
        className={`
          max-h-[360px]
          w-full
          object-cover
          transition-opacity
          duration-300
          ${
            loaded
              ? "opacity-100"
              : "opacity-0"
          }
        `}
      />

      {/* Upload Progress */}
      {msg.isUploading && (
        <div
          className="
            absolute
            inset-0
            flex
            flex-col
            items-center
            justify-center
            bg-black/45
            backdrop-blur-[2px]
            px-6
          "
        >
          <div
            className="
              mb-3
              text-sm
              font-medium
              text-white
            "
          >
            Uploading {msg.uploadProgress ?? 0}%
          </div>

          <div
            className="
              h-2
              w-full
              max-w-[180px]
              overflow-hidden
              rounded-full
              bg-white/20
            "
          >
            <div
              className="
                h-full
                rounded-full
                bg-white
                transition-all
                duration-150
              "
              style={{
                width: `${
                  msg.uploadProgress ?? 0
                }%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Upload Failed */}
      {msg.uploadFailed && (
        <div
          className="
            absolute
            inset-0
            flex
            items-center
            justify-center
            bg-red-700/60
          "
        >
          <div
            className="
              rounded-xl
              bg-red-600
              px-4
              py-2
              text-sm
              text-white
            "
          >
            Upload Failed
          </div>
        </div>
      )}

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
        {
          msg.attachment
            ?.originalFileName
        }
      </span>

      {msg.attachment?.fileSize && (
        <span>
          {(
            msg.attachment.fileSize /
            1024 /
            1024
          ).toFixed(1)}{" "}
          MB
        </span>
      )}
    </div>

  </div>
);
}