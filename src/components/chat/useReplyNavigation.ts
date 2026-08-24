import { useCallback, useEffect, useRef, useState } from "react";

export function useReplyNavigation(
  containerRef: React.RefObject<HTMLDivElement | null>,
) {
  const messageElements = useRef(new Map<string, HTMLDivElement>());
  const highlightTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(
    null,
  );

  const registerMessageElement = useCallback(
    (messageId: string, element: HTMLDivElement | null) => {
      if (element) messageElements.current.set(messageId, element);
      else messageElements.current.delete(messageId);
    },
    [],
  );

  const navigateToMessage = useCallback(
    (messageId: string) => {
      const container = containerRef.current;
      const target = messageElements.current.get(messageId);

      if (!container || !target) return false;

      const containerRect = container.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      const targetOffset =
        container.scrollTop +
        targetRect.top -
        containerRect.top -
        (container.clientHeight - targetRect.height) / 2;

      container.scrollTo({ top: Math.max(0, targetOffset), behavior: "smooth" });
      setHighlightedMessageId(messageId);

      if (highlightTimer.current) clearTimeout(highlightTimer.current);
      highlightTimer.current = setTimeout(() => {
        setHighlightedMessageId((current) =>
          current === messageId ? null : current,
        );
      }, 1800);

      return true;
    },
    [containerRef],
  );

  useEffect(
    () => () => {
      if (highlightTimer.current) clearTimeout(highlightTimer.current);
    },
    [],
  );

  return { highlightedMessageId, navigateToMessage, registerMessageElement };
}
