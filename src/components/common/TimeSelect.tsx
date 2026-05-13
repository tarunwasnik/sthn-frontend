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
        value={h}
        onChange={(e) =>
          updateHour(e.target.value)
        }
        className="
          w-[58px]
          bg-white/[0.04]
          border border-white/10
          rounded-xl
          px-2
          py-3
          text-white
          text-sm
          outline-none
          focus:outline-none
          focus:ring-0
          focus:border-white/10
          hover:border-white/20
          transition
        "
      >
        {hours.map((hour) => (
          <option
            key={hour}
            value={hour}
            className="
              bg-[#111111]
              text-white
            "
          >
            {hour}
          </option>
        ))}
      </select>

      {/* COLON */}
      <span className="text-white/50 text-sm">
        :
      </span>

      {/* MINUTES */}
      <select
        value={m}
        onChange={(e) =>
          updateMinute(e.target.value)
        }
        className="
          w-[58px]
          bg-white/[0.04]
          border border-white/10
          rounded-xl
          px-2
          py-3
          text-white
          text-sm
          outline-none
          focus:outline-none
          focus:ring-0
          focus:border-white/10
          hover:border-white/20
          transition
        "
      >
        {minutes.map((minute) => (
          <option
            key={minute}
            value={minute}
            className="
              bg-[#111111]
              text-white
            "
          >
            {minute}
          </option>
        ))}
      </select>

    </div>
  );
}