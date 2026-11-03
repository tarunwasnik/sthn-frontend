// frontend/src/components/StarRating.tsx

import { useId, useState } from "react";

interface Props {
  value: number;
  onChange?: (value: number) => void;
  readonly?: boolean;
}

export default function StarRating({
  value,
  onChange,
  readonly = false,
}: Props) {
  const [hover, setHover] = useState(0);
  const name = useId();
  const active = hover || value;

  if (readonly) {
    return (
      <div aria-label={`${value} out of 5 stars`} role="img" className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            aria-hidden="true"
            className={`text-2xl ${star <= value ? "text-theme-warning" : "text-theme-muted"}`}
          >
            ★
          </span>
        ))}
      </div>
    );
  }

  return (
    <div
      aria-label="Rating"
      className="flex gap-1"
      onMouseLeave={() => setHover(0)}
      role="radiogroup"
    >
      {[1, 2, 3, 4, 5].map((star) => {
        return (
          <label key={star} className="cursor-pointer">
            <input
              checked={value === star}
              className="peer sr-only"
              name={name}
              onChange={() => onChange?.(star)}
              type="radio"
              value={star}
            />
            <span
              aria-hidden="true"
              onMouseEnter={() => setHover(star)}
              className={`block rounded text-2xl transition-colors peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-theme-accent ${
                star <= active ? "text-theme-warning" : "text-theme-muted"
              }`}
            >
              ★
            </span>
            <span className="sr-only">{star} star{star === 1 ? "" : "s"}</span>
          </label>
        );
      })}
    </div>
  );
}
