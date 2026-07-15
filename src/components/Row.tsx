import SplitFlapTile from "./SplitFlapTile";

interface RowProps {
  chars: string[];
  rowIndex: number;
  cols: number;
  waveOrigin?: { row: number; col: number } | null;
}

export default function Row({ chars, rowIndex, cols, waveOrigin }: RowProps) {
  return (
    <div className="board-row" data-row={rowIndex}>
      {chars.map((char, colIndex) => {
        const tileIndex = rowIndex * cols + colIndex;
        let waveDelayMs = 0;
        if (waveOrigin) {  
          const dr = rowIndex - waveOrigin.row;
          const dc = colIndex - waveOrigin.col;
          waveDelayMs = Math.sqrt(dr * dr + dc * dc) * 18;
        } else {
          // gentle left-to-right diagonal cascade as default wave
          waveDelayMs = colIndex * 6 + rowIndex * 10;
        }
        return (
          <SplitFlapTile
            key={colIndex}
            targetChar={char}
            tileIndex={tileIndex}
            waveDelayMs={waveDelayMs}
          />
        );
      })}
    </div>
  );
}
