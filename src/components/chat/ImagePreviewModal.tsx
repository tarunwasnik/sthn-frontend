// frontend/src/components/chat/ImageViewerModal.tsx 
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { createPortal } from "react-dom";

interface ImagePreviewModalProps {
  open: boolean;
  files: File[];
  sending: boolean;
  onCancel: () => void;
  onSend: (
    files: File[]
  ) => void | Promise<void>;
}

export default function ImagePreviewModal({
  open,
  files,
  sending,
  onCancel,
  onSend,
}: ImagePreviewModalProps) {
  const [currentIndex, setCurrentIndex] =
    useState(0);

  const previewUrls = useMemo(() => {
    return files.map((file) =>
      URL.createObjectURL(file)
    );
  }, [files]);

  const currentFile =
    files[currentIndex];

  useEffect(() => {
    return () => {
      previewUrls.forEach((url) =>
        URL.revokeObjectURL(url)
      );
    };
  }, [previewUrls]);

  useEffect(() => {
    if (!open) return;

    setCurrentIndex(0);
  }, [open, files]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (
      e: KeyboardEvent
    ) => {
      switch (e.key) {
        case "Escape":
          onCancel();
          break;

        case "ArrowLeft":
          setCurrentIndex((prev) =>
            Math.max(prev - 1, 0)
          );
          break;

        case "ArrowRight":
          setCurrentIndex((prev) =>
            Math.min(
              prev + 1,
              files.length - 1
            )
          );
          break;
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    document.body.style.overflow =
      "hidden";

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );

      document.body.style.overflow =
        "";
    };
  }, [
    open,
    onCancel,
    files.length,
  ]);

  if (
    !open ||
    files.length === 0 ||
    !currentFile
  ) {
    return null;
  }

 return createPortal(
  <div
    className="
      fixed
      inset-0
      z-[999999]
      flex
      items-center
      justify-center
      bg-black/90
      backdrop-blur-sm
      p-4
    "
    onClick={onCancel}
  >
    <div
      className="
        relative
        flex
        max-h-[95vh]
        max-w-[95vw]
        flex-col
        overflow-hidden
        rounded-2xl
        bg-[#111]
      "
      onClick={(e) =>
        e.stopPropagation()
      }
    >
      {/* Preview Image */}
<div className="relative flex items-center justify-center">

  {files.length > 1 && (
    <>
      {/* Previous */}
      <button
        type="button"
        onClick={() =>
          setCurrentIndex((prev) =>
            prev === 0
              ? files.length - 1
              : prev - 1
          )
        }
        className="
          absolute
          left-4
          top-1/2
          z-10
          flex
          h-10
          w-10
          -translate-y-1/2
          items-center
          justify-center
          rounded-full
          bg-black/45
          text-2xl
          text-white
          backdrop-blur-md
          transition-all
          hover:bg-black/70
        "
      >
        ❮
      </button>

      {/* Next */}
      <button
        type="button"
        onClick={() =>
          setCurrentIndex((prev) =>
            prev === files.length - 1
              ? 0
              : prev + 1
          )
        }
        className="
          absolute
          right-4
          top-1/2
          z-10
          flex
          h-10
          w-10
          -translate-y-1/2
          items-center
          justify-center
          rounded-full
          bg-black/45
          text2xl
          text-white
          backdrop-blur-md
          transition-all
          hover:bg-black/70
        "
      >
        ❯
      </button>

      {/* Counter */}
      <div
        className="
          absolute
          bottom-4
          left-1/2
          z-10
          -translate-x-1/2
          rounded-full
          bg-black/55
          px-3
          py-1
          text-xs
          text-white
          backdrop-blur-md
        "
      >
        {currentIndex + 1} / {files.length}
      </div>
    </>
  )}

  <img
    src={previewUrls[currentIndex]}
    alt={currentFile.name}
    draggable={false}
    className="
      max-h-[80vh]
      max-w-[95vw]
      object-contain
      select-none
    "
  />

</div>

      {/* Footer */}
      <div
        className="
          flex
          items-center
          justify-between
          gap-4
          border-t
          border-white/10
          p-4
        "
      >
        {/* Image Details */}
        <div className="min-w-0">
          <p className="truncate text-sm text-white">
            {currentFile.name}
          </p>

          <p className="text-xs text-white/50">
            {(currentFile.size /
              1024 /
              1024).toFixed(2)}{" "}
            MB
          </p>

        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">


          <button
            type="button"
            onClick={onCancel}
            disabled={sending}
            className="
              rounded-lg
              border
              border-white/10
              px-4
              py-2
              text-white
              hover:bg-white/10
            "
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={() =>
              onSend(files)
            }
            disabled={sending}
            className="
              rounded-lg
              bg-white
              px-4
              py-2
              font-medium
              text-black
              disabled:opacity-50
            "
          >
            {sending
              ? "Sending..."
              : files.length === 1
              ? "Send"
              : `Send (${files.length})`}
          </button>
        </div>
      </div>
    </div>
  </div>,
  document.body
);
}