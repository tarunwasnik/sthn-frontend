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

export default function CreatorCard({
  creator,
}: CreatorCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (!creator.slug) {
      console.error("Missing slug");
      return;
    }

    navigate(`/creators/${creator.slug}`);
  };

  const nextSlot = formatSlot(
    creator.nextAvailableSlot
  );

  const location =
    creator.city && creator.country
      ? `${creator.city}, ${creator.country}`
      : creator.city ||
        creator.country ||
        null;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) =>
        e.key === "Enter" &&
        handleClick()
      }
      className="
        group
        relative
        w-full
        max-w-[280px]
        min-w-0
        overflow-hidden
        rounded-[26px]
        border border-white/10
        bg-gradient-to-br
        from-white/[0.045]
        to-white/[0.015]
        backdrop-blur-xl
        transition-all duration-300
        hover:border-white/15
        hover:-translate-y-[2px]
        hover:bg-white/[0.05]
        cursor-pointer
        mx-auto
      "
    >
      {/* Card Wrapper */}
      <div className="aspect-[3/4] max-h-[420px] flex flex-col">
        {/* ================= MEDIA ================= */}

        <div
          className="
            relative
            h-[78%]
            overflow-hidden
            bg-[#0D0D0D]
            flex items-center justify-center
          "
        >
          {/* Background Fill */}
          <img
            src={
              creator.avatarUrl ??
              "/avatars/default.png"
            }
            alt={creator.displayName}
            className="
              absolute
              inset-0
              h-full
              w-full
              object-cover
              scale-110
              blur-xl
              opacity-25
            "
          />

          {/* Dark Layer */}
          <div
            className="
              absolute inset-0
              bg-black/35
            "
          />

          {/* Main Portrait */}
          <img
            src={
              creator.avatarUrl ??
              "/avatars/default.png"
            }
            alt={creator.displayName}
            className="
              relative
              z-10
              h-full
              w-full
              object-cover
              object-top
              transition-transform duration-700
              group-hover:scale-[1.04]
            "
          />

          {/* Gradient */}
          <div
            className="
              absolute inset-0
              bg-gradient-to-t
              from-black/45
              via-transparent
              to-transparent
              pointer-events-none
            "
          />

          {/* Availability Badge */}
          {creator.isAvailable && (
            <div
              className="
                absolute
                top-3
                right-3
                z-20
                rounded-full
                border border-emerald-400/20
                bg-black/50
                backdrop-blur-md
                px-2.5
                py-1
                text-[10px]
                font-medium
                text-emerald-300
              "
            >
              ● Available
            </div>
          )}
        </div>

        {/* ================= DETAILS ================= */}

        <div
          className="
            flex-1
            p-3.5
            bg-gradient-to-b
            from-[#0B0B0B]
            to-[#090909]
            flex
            flex-col
            justify-between
          "
        >
          {/* Top */}
          <div>
            {/* Name + Price */}
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3
                  className="
                    truncate
                    text-[16px]
                    font-semibold
                    tracking-tight
                    text-white
                  "
                >
                  {creator.displayName}

                  {creator.age && (
                    <span className="ml-1 text-xs font-medium text-white/50">
                      {creator.age}
                    </span>
                  )}
                </h3>

                {location && (
                  <p
                    className="
                      mt-1
                      truncate
                      text-[11px]
                      text-white/50
                    "
                  >
                    {location}
                  </p>
                )}
              </div>

              {/* Price */}
              <div className="shrink-0 text-right">
                <p
                  className="
                    text-[15px]
                    font-bold
                    text-emerald-300
                    leading-none
                  "
                >
                  {creator.currency}
                  {creator.startingPrice ??
                    "-"}
                </p>

                <p
                  className="
                    mt-[2px]
                    text-[10px]
                    text-white/35
                  "
                >
                  Starting price
                </p>
              </div>
            </div>

            {/* Category */}
            {creator.primaryCategory && (
              <div className="mt-3 flex flex-wrap gap-2">
                <span
                  className="
                    rounded-full
                    border border-white/10
                    bg-white/[0.06]
                    px-2.5
                    py-1
                    text-[10px]
                    font-medium
                    uppercase tracking-wide
                    text-white/65
                  "
                >
                  {creator.primaryCategory}
                </span>
              </div>
            )}
          </div>

          {/* Bottom Meta */}
          <div
            className="
              mt-3
              flex
              items-center
              justify-between
              gap-2
            "
          >
            {/* Rating */}
            <div
              className="
                flex
                items-center
                gap-1
                text-[13px]
                text-white/65
              "
            >
              <span className="text-yellow-300">
                ★
              </span>

              <span>
                {creator.rating ?? 0}
              </span>

              <span className="text-white/35">
                (
                {creator.reviewCount ??
                  0}
                )
              </span>
            </div>

            {/* Next Slot */}
            {nextSlot && (
              <div
                className="
                  rounded-full
                  border border-white/10
                  bg-black/30
                  px-2.5
                  py-1
                  text-[10px]
                  text-white/65
                  backdrop-blur-md
                  whitespace-nowrap
                "
              >
                Next slot:
                <span className="ml-1 text-white/85">
                  {nextSlot}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}