// frontend/src/components/StarRating.tsx

import { useState } from "react";

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

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const active = hover || value;

        return (
          <span
            key={star}
            onClick={() => !readonly && onChange?.(star)}
            onMouseEnter={() => !readonly && setHover(star)}
            onMouseLeave={() => !readonly && setHover(0)}
            className={`text-2xl cursor-pointer ${
              star <= active ? "text-yellow-400" : "text-gray-500"
            }`}
          >
            ★
          </span>
        );
      })}
    </div>
  );
}