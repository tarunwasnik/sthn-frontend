// frontend/src/components/chat/ImageViewerModal.tsx

import { useEffect } from "react";
import { createPortal } from "react-dom";

interface ChatImage {
  attachment?: {
    url: string;
    originalFileName?: string;
  };
}

interface ImageViewerModalProps {
  open: boolean;

  images: ChatImage[];

  currentIndex: number;

  onIndexChange: (index: number) => void;

  onClose: () => void;
}

export default function ImageViewerModal({
  open,
  images,
  currentIndex,
  onIndexChange,
  onClose,
}: ImageViewerModalProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }

      if (e.key === "ArrowLeft" && currentIndex > 0) {
        onIndexChange(currentIndex - 1);
      }

      if (e.key === "ArrowRight" && currentIndex < images.length - 1) {
        onIndexChange(currentIndex + 1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);

      document.body.style.overflow = "";
    };
  }, [open, currentIndex, images.length, onClose, onIndexChange]);

  if (!open || !images.length) {
    return null;
  }

  const image = images[currentIndex];

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
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="
          absolute
          right-5
          top-5
          h-11
          w-11
          rounded-full
          bg-white/10
          text-2xl
          text-white
          hover:bg-white/20
        "
      >
        ✕
      </button>

      {currentIndex > 0 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();

            onIndexChange(currentIndex - 1);
          }}
          className="
            absolute
            left-5
            text-5xl
            text-white/80
            hover:text-white
          "
        >
          ‹
        </button>
      )}

      <img
        src={image.attachment?.url}
        alt={image.attachment?.originalFileName ?? "Image"}
        draggable={false}
        onClick={(e) => e.stopPropagation()}
        className="
          max-w-[95vw]
          max-h-[95vh]
          object-contain
          select-none
        "
      />

      {currentIndex < images.length - 1 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();

            onIndexChange(currentIndex + 1);
          }}
          className="
            absolute
            right-5
            text-5xl
            text-white/80
            hover:text-white
          "
        >
          ›
        </button>
      )}

      <div
        className="
          absolute
          bottom-6
          left-1/2
          -translate-x-1/2
          rounded-full
          bg-black/40
          px-4
          py-2
          text-sm
          text-white
        "
      >
        {currentIndex + 1}
        {" / "}
        {images.length}
      </div>
    </div>,
    document.body,
  );
}
