"use client";

import { useEffect, useState } from "react";

type CountdownValues = { days: number; hours: number; minutes: number; seconds: number };

function getCountdown(targetDate: string): CountdownValues {
  const totalSeconds = Math.max(0, Math.floor((Date.parse(targetDate) - Date.now()) / 1000));

  return {
    days: Math.floor(totalSeconds / 86_400),
    hours: Math.floor((totalSeconds % 86_400) / 3_600),
    minutes: Math.floor((totalSeconds % 3_600) / 60),
    seconds: totalSeconds % 60,
  };
}

export function WeddingCountdown({
  targetDate,
  label = "Countdown to the wedding ceremony",
}: {
  targetDate: string;
  label?: string;
}) {
  const [remaining, setRemaining] = useState<CountdownValues | null>(null);

  useEffect(() => {
    const updateCountdown = () => setRemaining(getCountdown(targetDate));
    updateCountdown();

    const intervalId = window.setInterval(updateCountdown, 1_000);
    return () => window.clearInterval(intervalId);
  }, [targetDate]);

  const units: (keyof CountdownValues)[] = ["days", "hours", "minutes", "seconds"];

  if (remaining && units.every((unit) => remaining[unit] === 0)) {
    return <p className="countdown-complete">The wedding day has arrived.</p>;
  }

  return (
    <div className="wedding-countdown" aria-label={label}>
      {units.map((unit) => (
        <div className="countdown-unit" key={unit}>
          <strong>{remaining ? String(remaining[unit]).padStart(2, "0") : "--"}</strong>
          <span>{unit}</span>
        </div>
      ))}
    </div>
  );
}
