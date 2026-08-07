import { HIDDEN_ROWS, ROWS, COLS, cellsOf, shapeCells, type ActivePiece, type Board, type PieceType } from "@/lib/tetris/engine";
import type { Theme } from "@/lib/tetris/themes";

interface BoardProps {
  board: Board;
  piece: ActivePiece | null;
  ghost: ActivePiece | null;
  clearing: number[];
  theme: Theme;
  showGhost: boolean;
  shake: number;
}

export function TetrisBoard({ board, piece, ghost, clearing, theme, showGhost, shake }: BoardProps) {
  const overlay = new Map<string, { type: PieceType; ghost: boolean }>();
  if (showGhost && ghost) {
    for (const [x, y] of cellsOf(ghost)) overlay.set(`${x}:${y}`, { type: ghost.type, ghost: true });
  }
  if (piece) {
    for (const [x, y] of cellsOf(piece)) overlay.set(`${x}:${y}`, { type: piece.type, ghost: false });
  }

  return (
    <div
      className="tetris-board"
      data-shake={shake > 0 ? shake : undefined}
      style={{
        gridTemplateColumns: `repeat(${COLS}, 1fr)`,
        gridTemplateRows: `repeat(${ROWS}, 1fr)`,
        boxShadow: `0 0 60px -18px ${theme.accent}`,
      }}
    >
      {Array.from({ length: ROWS }).map((_, row) =>
        Array.from({ length: COLS }).map((__, col) => {
          const y = row + HIDDEN_ROWS;
          const settled = board[y]?.[col] ?? null;
          const ov = overlay.get(`${col}:${y}`);
          const type = ov && !ov.ghost ? ov.type : settled;
          const isGhost = !type && ov?.ghost;
          const color = type ? theme.colors[type] : isGhost ? theme.colors[ov!.type] : null;
          return (
            <div
              key={`${row}-${col}`}
              className="tetris-cell"
              data-filled={type ? "" : undefined}
              data-ghost={isGhost ? "" : undefined}
              data-clearing={clearing.includes(y) ? "" : undefined}
              style={color ? { ["--cell" as string]: color } : undefined}
            />
          );
        }),
      )}
    </div>
  );
}

export function PiecePreview({ type, theme, size = 14 }: { type: PieceType | null; theme: Theme; size?: number }) {
  if (!type) return <div className="preview-empty" style={{ height: size * 2 }} />;
  const cells = shapeCells(type);
  const xs = cells.map((c) => c[0]);
  const ys = cells.map((c) => c[1]);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const w = Math.max(...xs) - minX + 1;
  const h = Math.max(...ys) - minY + 1;
  return (
    <div className="preview-grid" style={{ gridTemplateColumns: `repeat(${w}, ${size}px)`, gridTemplateRows: `repeat(${h}, ${size}px)` }}>
      {Array.from({ length: h }).map((_, r) =>
        Array.from({ length: w }).map((__, c) => {
          const on = cells.some(([x, y]) => x - minX === c && y - minY === r);
          return (
            <div
              key={`${r}-${c}`}
              className="tetris-cell"
              data-filled={on ? "" : undefined}
              style={on ? { ["--cell" as string]: theme.colors[type] } : { opacity: 0 }}
            />
          );
        }),
      )}
    </div>
  );
}

