// frontend/src/components/CreatorCard.tsx

import { useNavigate } from "react-router-dom";
import type { CreatorPublicCardDTO } from "../api/public";

type CreatorCardProps = {
  creator: CreatorPublicCardDTO;
};

function formatSlot(dateStr?: string | null) {
  if (!dateStr) return null;

  const d = new Date(dateStr);

  const date = d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });

  const time = d.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });

  return `${date} • ${time}`;
}

export default function CreatorCard({ creator }: CreatorCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (!creator.slug) {
      console.error("Missing slug");
      return;
    }

    navigate(`/creators/${creator.slug}`);
  };

  const nextSlot = formatSlot(creator.nextAvailableSlot);

  const location =
    creator.city && creator.country
      ? `${creator.city}, ${creator.country}`
      : creator.city || creator.country || null;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => e.key === "Enter" && handleClick()}
      className="cursor-pointer bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 transition hover:bg-white/10 hover:scale-[1.02]"
    >
      {/* Avatar */}
      <div className="flex justify-center mb-4">
        <img
          src={creator.avatarUrl ?? "/avatars/default.png"}
          alt={creator.displayName}
          className="w-20 h-20 rounded-full object-cover border border-white/10"
        />
      </div>

      {/* Name + Age */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">
          {creator.displayName}
          {creator.age && (
            <span className="text-white/50 text-sm ml-1">
              , {creator.age}
            </span>
          )}
        </h3>

        {creator.isAvailable && (
          <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">
            Available
          </span>
        )}
      </div>

      {/* Category */}
      <p className="text-sm text-white/60 mt-1">
        {creator.primaryCategory}
      </p>

      {/* Location */}
      {location && (
        <p className="text-xs text-white/40 mt-1">
          {location}
        </p>
      )}

      {/* Rating */}
      <p className="text-sm text-white/70 mt-3">
        ⭐ {creator.rating ?? 0} ({creator.reviewCount ?? 0} reviews)
      </p>

      {/* Next Slot */}
      {nextSlot && (
        <p className="text-xs text-green-300 mt-2">
          Next slot: {nextSlot}
        </p>
      )}

      {/* Price */}
      <p className="text-sm text-green-400 font-semibold mt-3">
        Starting from {creator.currency} {creator.startingPrice ?? "-"}
      </p>
    </div>
  );
}