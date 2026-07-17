import { useMemo } from "react";
import Row from "./Row";
import { BOARD_COLS, BOARD_ROWS } from "../engine/boardConfig";

interface BoardProps {
  grid: string[];
  waveOrigin?: { row: number; col: number } | null;
}

export default function Board({ grid, waveOrigin }: BoardProps) {
  // Keeping this memoized on `grid` (rather than re-slicing every render)
  // gives each row array a stable reference across renders where grid
  // hasn't actually changed, which is what lets Row's React.memo below
  // actually skip work instead of always seeing a "new" array prop.
  const rows: string[][] = useMemo(() => {
    const next: string[][] = [];
    for (let r = 0; r < BOARD_ROWS; r++) {
      next.push(grid.slice(r * BOARD_COLS, r * BOARD_COLS + BOARD_COLS));
    }
    return next;
  }, [grid]);

  return (
    <div className="board">
      {rows.map((rowChars, i) => (
        <Row
          key={i}
          chars={rowChars}
          rowIndex={i}
          cols={BOARD_COLS}
          waveOrigin={waveOrigin}
        />
      ))}
    </div>
  );
}