import { useEffect, useRef, useState } from "react";

/**
 * Cycles an index 0..count-1 every `durationSec`. Pausing (e.g. while the
 * user is in interactive typing mode) freezes the rotation in place rather
 * than resetting it, so it resumes where it left off.
 */
export function useModuleRotation(
  count: number,
  durationSec: number,
  paused: boolean
): number {
  const [index, setIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (count <= 1 || paused) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      setIndex((i) => (i + 1) % count);
    }, Math.max(3, durationSec) * 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [count, durationSec, paused]);

  // keep index in range if the module list shrinks
  useEffect(() => {
    if (index >= count && count > 0) setIndex(0);
  }, [count, index]);

  return count > 0 ? index % count : 0;
}
