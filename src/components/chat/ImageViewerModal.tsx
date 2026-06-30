// frontend/src/components/chat/ImageViewerModal.tsx

import { useEffect } from "react";
import { createPortal } from "react-dom";

interface ImageViewerModalProps {
  open: boolean;
  imageUrl: string;
  fileName?: string;
  onClose: () => void;
}

export default function ImageViewerModal({
  open,
  imageUrl,
  fileName,
  onClose,
}: ImageViewerModalProps) {
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (
      e: KeyboardEvent
    ) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );

      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) {
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

      <img
        src={imageUrl}
        alt={fileName ?? "Image"}
        onClick={(e) =>
          e.stopPropagation()
        }
        draggable={false}
        className="
          max-w-[95vw]
          max-h-[95vh]
          object-contain
          select-none
        "
      />
    </div>,
    document.body
  );
}