import { BOARD_COLS } from "./boardConfig";

/**
 * Merges the permanent clock + date fixture into a content grid without
 * mutating it. Placed at render time so rotating modules don't need to
 * know this region exists.
 */
export function applyOverlay(base: string[], time: string, date: string): string[] {
  const next = base.slice();

  const timeChars = Array.from(time.toUpperCase()).slice(0, BOARD_COLS);
  timeChars.forEach((c, i) => {
    next[0 * BOARD_COLS + i] = c;
  });

  const dateChars = Array.from(date).slice(0, BOARD_COLS);
  dateChars.forEach((c, i) => {
    next[1 * BOARD_COLS + i] = c;
  });

  return next;
}
