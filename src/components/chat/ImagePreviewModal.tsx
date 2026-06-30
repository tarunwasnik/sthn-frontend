//frontend/src/components/chat/ImagePreviewModal.tsx

import { useEffect, useMemo } from "react";
import { createPortal } from "react-dom";

interface ImagePreviewModalProps {
  open: boolean;
  file: File | null;
  sending: boolean;
  onCancel: () => void;
  onSend: () => void;
}

export default function ImagePreviewModal({
  open,
  file,
  sending,
  onCancel,
  onSend,
}: ImagePreviewModalProps) {
  const previewUrl = useMemo(() => {
    if (!file) return "";
    return URL.createObjectURL(file);
  }, [file]);

  useEffect(() => {
    if (!previewUrl) return;

    return () => {
      URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (
      e: KeyboardEvent
    ) => {
      if (e.key === "Escape") {
        onCancel();
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
  }, [open, onCancel]);

  if (!open || !file) {
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
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={previewUrl}
          alt={file.name}
          className="
            max-h-[80vh]
            max-w-[95vw]
            object-contain
            select-none
          "
          draggable={false}
        />

        <div
          className="
            flex
            items-center
            justify-between
            gap-3
            border-t
            border-white/10
            p-4
          "
        >
          <div className="min-w-0">
            <p className="truncate text-sm text-white">
              {file.name}
            </p>

            <p className="text-xs text-white/50">
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>

          <div className="flex gap-2">
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
              onClick={onSend}
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
                : "Send"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}