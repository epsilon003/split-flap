import Row from "./Row";
import { BOARD_COLS, BOARD_ROWS } from "../engine/boardConfig";

interface BoardProps {
  grid: string[];
  waveOrigin?: { row: number; col: number } | null;
}

export default function Board({ grid, waveOrigin }: BoardProps) {
  const rows: string[][] = [];
  for (let r = 0; r < BOARD_ROWS; r++) {
    rows.push(grid.slice(r * BOARD_COLS, r * BOARD_COLS + BOARD_COLS));
  }

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
