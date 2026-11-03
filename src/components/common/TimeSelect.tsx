// frontend/src/components/common/TimeSelect.tsx

interface Props {
  value: string;
  onChange: (time: string) => void;
}

const hours = Array.from(
  { length: 24 },
  (_, i) =>
    i.toString().padStart(2, "0")
);

const minutes = Array.from(
  { length: 60 },
  (_, i) =>
    i.toString().padStart(2, "0")
).filter((_, i) => i % 5 === 0);

export default function TimeSelect({
  value,
  onChange,
}: Props) {

  const [h = "00", m = "00"] =
    value.split(":");

  const updateHour = (
    hour: string
  ) => {
    onChange(`${hour}:${m}`);
  };

  const updateMinute = (
    minute: string
  ) => {
    onChange(`${h}:${minute}`);
  };

  return (
    <div className="flex flex-wrap items-center gap-2 w-full">

      {/* HOURS */}
      <select
        aria-label="Hour"
        value={h}
        onChange={(e) =>
          updateHour(e.target.value)
        }
        className="
          w-[58px]
          h-11
          bg-theme-surface
          border border-theme-border
          rounded-[var(--radius-control)]
          px-2
          text-theme-text
          text-sm
          transition-colors
          hover:border-theme-border-strong
          focus:border-theme-accent
          focus-visible:outline
          focus-visible:outline-2
          focus-visible:outline-offset-2
          focus-visible:outline-theme-accent
        "
      >
        {hours.map((hour) => (
          <option
            key={hour}
            value={hour}
            className="
              bg-theme-surface
              text-theme-text
            "
          >
            {hour}
          </option>
        ))}
      </select>

      {/* COLON */}
      <span className="text-theme-muted text-sm" aria-hidden="true">
        :
      </span>

      {/* MINUTES */}
      <select
        aria-label="Minute"
        value={m}
        onChange={(e) =>
          updateMinute(e.target.value)
        }
        className="
          w-[58px]
          h-11
          bg-theme-surface
          border border-theme-border
          rounded-[var(--radius-control)]
          px-2
          text-theme-text
          text-sm
          transition-colors
          hover:border-theme-border-strong
          focus:border-theme-accent
          focus-visible:outline
          focus-visible:outline-2
          focus-visible:outline-offset-2
          focus-visible:outline-theme-accent
        "
      >
        {minutes.map((minute) => (
          <option
            key={minute}
            value={minute}
            className="
              bg-theme-surface
              text-theme-text
            "
          >
            {minute}
          </option>
        ))}
      </select>

    </div>
  );
}
