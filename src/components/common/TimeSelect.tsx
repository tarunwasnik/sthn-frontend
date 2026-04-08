//frontend/src/components/common/TimeSelect.tsx


interface Props {
  value: string;
  onChange: (time: string) => void;
}

const hours = Array.from({ length: 24 }, (_, i) =>
  i.toString().padStart(2, "0")
);

const minutes = Array.from({ length: 60 }, (_, i) =>
  i.toString().padStart(2, "0")
).filter((_, i) => i % 5 === 0);

export default function TimeSelect({ value, onChange }: Props) {

  const [h = "00", m = "00"] = value.split(":");

  const updateHour = (hour: string) => {
    onChange(`${hour}:${m}`);
  };

  const updateMinute = (minute: string) => {
    onChange(`${h}:${minute}`);
  };

  return (
    <div className="flex gap-2">

      <select
        value={h}
        onChange={(e) => updateHour(e.target.value)}
        className="bg-[#0F172A] border border-gray-700 rounded-lg p-3 text-white"
      >
        {hours.map((hour) => (
          <option key={hour} value={hour}>
            {hour}
          </option>
        ))}
      </select>

      <span className="text-white flex items-center">:</span>

      <select
        value={m}
        onChange={(e) => updateMinute(e.target.value)}
        className="bg-[#0F172A] border border-gray-700 rounded-lg p-3 text-white"
      >
        {minutes.map((minute) => (
          <option key={minute} value={minute}>
            {minute}
          </option>
        ))}
      </select>

    </div>
  );
}