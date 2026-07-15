import { useCallback, useState } from "react";
import { BOARD_COLS, BOARD_ROWS, BOARD_SIZE } from "../engine/boardConfig";
import { normalizeChar } from "../engine/CharacterWheel";
import type { Align } from "../types";

function blankGrid(): string[] {
  return Array(BOARD_SIZE).fill(" ");
}

export type { Align };

const CONTENT_TOP = 2; // rows 0-1 are permanently reserved for the clock/date overlay
const CONTENT_ROWS = BOARD_ROWS - CONTENT_TOP;

export function useBoard() {
  const [grid, setGrid] = useState<string[]>(blankGrid());

  /** Renders an array of lines (each up to BOARD_COLS chars) onto the
   * board, confined to the rows below the permanent clock/date fixture. */
  const setLines = useCallback((lines: string[], align: Align = "center") => {
    const next = blankGrid();
    const rowsToUse = Math.min(lines.length, CONTENT_ROWS);
    const startRow = CONTENT_TOP + Math.floor((CONTENT_ROWS - rowsToUse) / 2);

    lines.slice(0, rowsToUse).forEach((line, i) => {
      const chars = Array.from(line.toUpperCase()).slice(0, BOARD_COLS);
      let startCol = 0;
      if (align === "center") {
        startCol = Math.floor((BOARD_COLS - chars.length) / 2);
      } else if (align === "right") {
        startCol = BOARD_COLS - chars.length;
      }
      chars.forEach((c, j) => {
        const col = startCol + j;
        if (col < 0 || col >= BOARD_COLS) return;
        const row = startRow + i;
        next[row * BOARD_COLS + col] = normalizeChar(c);
      });
    });
    setGrid(next);
  }, []);

  const setRaw = useCallback((arr: string[]) => {
    const next = blankGrid();
    for (let i = 0; i < Math.min(arr.length, BOARD_SIZE); i++) {
      next[i] = normalizeChar(arr[i]);
    }
    setGrid(next);
  }, []);

  const clear = useCallback(() => setGrid(blankGrid()), []);

  return { grid, setLines, setRaw, clear };
}
