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

const previewSessionKeys = new WeakMap<File[], number>();
let nextPreviewSessionKey = 0;

function getPreviewSessionKey(files: File[]): number {
  const existingKey = previewSessionKeys.get(files);
  if (existingKey !== undefined) return existingKey;

  nextPreviewSessionKey += 1;
  previewSessionKeys.set(files, nextPreviewSessionKey);
  return nextPreviewSessionKey;
}

export default function ImagePreviewModal({
  open,
  files,
  sending,
  onCancel,
  onSend,
}: ImagePreviewModalProps) {
  if (!open || files.length === 0) return null;

  return (
    <ImagePreviewDialog
      key={getPreviewSessionKey(files)}
      files={files}
      sending={sending}
      onCancel={onCancel}
      onSend={onSend}
    />
  );
}

function ImagePreviewDialog({
  files,
  sending,
  onCancel,
  onSend,
}: Omit<ImagePreviewModalProps, "open">) {
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
    onCancel,
    files.length,
  ]);

  if (
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
        rounded-[var(--radius-dialog)]
        border border-theme-border
        bg-theme-surface
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
          focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent
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
          text-2xl
          text-white
          backdrop-blur-md
          transition-all
          hover:bg-black/70
          focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent
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
          border-theme-border
          p-4
        "
      >
        {/* Image Details */}
        <div className="min-w-0">
          <p className="truncate text-sm text-theme-text">
            {currentFile.name}
          </p>

          <p className="text-xs text-theme-muted">
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
              rounded-[var(--radius-control)]
              border
              border-theme-border
              px-4
              py-2
              text-theme-text
              hover:bg-theme-inset
              focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent
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
              rounded-[var(--radius-control)]
              bg-theme-primary
              px-4
              py-2
              font-medium
              text-theme-primary-text
              disabled:opacity-50
              focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent
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
