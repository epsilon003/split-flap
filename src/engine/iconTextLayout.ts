import { BOARD_COLS, BOARD_ROWS, BOARD_SIZE } from "./boardConfig";
import { stampIcon } from "../modules/weatherIcons";

// Rows 0-1 are permanently reserved for the clock/date overlay, so all
// module content (text + icon) lives in rows 2-7.
export const CONTENT_TOP = 2;
export const CONTENT_ROWS = BOARD_ROWS - CONTENT_TOP;

export function blankBoard(): string[] {
  return Array(BOARD_SIZE).fill(" ");
}

export function drawText(raw: string[], text: string, row: number, col: number) {
  Array.from(text.toUpperCase()).forEach((ch, i) => {
    const c = col + i;
    if (c < 0 || c >= BOARD_COLS || row < 0 || row >= BOARD_ROWS) return;
    raw[row * BOARD_COLS + c] = ch;
  });
}

/**
 * Composes a compact, vertically-centered text block to the left of an
 * icon that's vertically centered in the same content area, right-aligned
 * with a small margin. Used by every module that pairs a small pixel icon
 * with a few lines of text (weather, and now the stat modules).
 */
export function composeIconTextBoard(
  lines: string[],
  icon: string[] | null,
  iconWidth: number,
  iconHeight: number
): string[] {
  const raw = blankBoard();
  const iconLeft = icon ? BOARD_COLS - iconWidth - 2 : BOARD_COLS;
  const textRegionWidth = icon ? iconLeft - 1 : BOARD_COLS;

  const startRow =
    CONTENT_TOP + Math.max(0, Math.floor((CONTENT_ROWS - lines.length) / 2));
  lines.forEach((line, i) => {
    const col = Math.max(0, Math.floor((textRegionWidth - line.length) / 2));
    drawText(raw, line, startRow + i, col);
  });

  if (icon) {
    const iconTop =
      CONTENT_TOP + Math.max(0, Math.floor((CONTENT_ROWS - iconHeight) / 2));
    stampIcon(raw, icon, iconTop, iconLeft, BOARD_COLS);
  }

  return raw;
}