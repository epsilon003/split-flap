import { useEffect, useState } from "react";

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

function formatClock(d: Date, use24h: boolean): string {
  let hours = d.getHours();
  let suffix = "";
  if (!use24h) {
    suffix = hours >= 12 ? " PM" : " AM";
    hours = hours % 12;
    if (hours === 0) hours = 12;
  }
  return `${hours}:${pad(d.getMinutes())}${suffix}`;
}

function formatDate(d: Date): string {
  // DD-MM-YYYY
  return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`;
}

export interface ClockText {
  time: string;
  date: string;
}

/**
 * A permanent, always-on clock + date (not part of the module rotation).
 * Returns short strings for the board's fixed top-left corner: time on
 * row 0, date on row 1 below it.
 */
export function usePermanentClock(use24h: boolean): ClockText {
  const [value, setValue] = useState<ClockText>(() => {
    const now = new Date();
    return { time: formatClock(now, use24h), date: formatDate(now) };
  });

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setValue({ time: formatClock(now, use24h), date: formatDate(now) });
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [use24h]);

  return value;
}
