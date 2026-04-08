// frontend/src/components/DisputeTimer.tsx

import { useEffect, useState } from "react";

interface Props {
  completedAt?: string;
  status: string;
}

export default function DisputeTimer({
  completedAt,
  status,
}: Props) {
  const [remaining, setRemaining] = useState<number>(0);

  useEffect(() => {
    if (!completedAt || status !== "COMPLETED") return;

    const update = () => {
      const end =
        new Date(completedAt).getTime() +
        24 * 60 * 60 * 1000;

      const diff = end - Date.now();
      setRemaining(diff);
    };

    update();
    const interval = setInterval(update, 60000);

    return () => clearInterval(interval);
  }, [completedAt, status]);

  if (status !== "COMPLETED") return null;

  if (remaining <= 0) {
    return (
      <p className="text-red-400 text-sm">
        Dispute window expired
      </p>
    );
  }

  const hours = Math.floor(
    remaining / (1000 * 60 * 60)
  );
  const minutes = Math.floor(
    (remaining % (1000 * 60 * 60)) /
      (1000 * 60)
  );

  return (
    <p className="text-yellow-400 text-sm">
      Dispute available for {hours}h {minutes}m
    </p>
  );
}