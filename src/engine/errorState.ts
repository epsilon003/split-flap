import { BOARD_COLS } from "./boardConfig";
import { blankBoard, drawText, CONTENT_TOP, CONTENT_ROWS } from "./iconTextLayout";

/** Sentinel target character. Not a real wheel glyph — SplitFlapTile
 * special-cases this to run the jam animation instead of a normal flip. */
export const JAM_CHAR = "#jam";

/**
 * Composes an error display that reads as a mechanical fault rather than
 * a clean message: the module's name renders normally, but where the
 * unavailable value would have gone, a short row of tiles is set to jam
 * instead of spelling out "UNAVAILABLE."
 */
export function jammedErrorBoard(label: string): string[] {
  const raw = blankBoard();
  const labelRow = CONTENT_TOP + Math.floor(CONTENT_ROWS / 2) - 1;
  const jamRow = labelRow + 1;

  const labelCol = Math.max(0, Math.floor((BOARD_COLS - label.length) / 2));
  drawText(raw, label, labelRow, labelCol);

  const jamCount = 4;
  const startCol = Math.max(0, Math.floor((BOARD_COLS - jamCount) / 2));
  for (let i = 0; i < jamCount; i++) {
    raw[jamRow * BOARD_COLS + startCol + i] = JAM_CHAR;
  }

  return raw;
}