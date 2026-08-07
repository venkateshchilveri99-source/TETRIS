export const COLS = 10;
export const ROWS = 20;
export const HIDDEN_ROWS = 2;

export type PieceType = "I" | "O" | "T" | "S" | "Z" | "J" | "L";
export type Cell = PieceType | null;
export type Point = [number, number];
export type Board = Cell[][];

type Pt = [number, number];

const SHAPES: Record<PieceType, Pt[][]> = {
  I: [
    [[0, 1], [1, 1], [2, 1], [3, 1]],
    [[2, 0], [2, 1], [2, 2], [2, 3]],
    [[0, 2], [1, 2], [2, 2], [3, 2]],
    [[1, 0], [1, 1], [1, 2], [1, 3]],
  ],
  O: [
    [[1, 0], [2, 0], [1, 1], [2, 1]],
    [[1, 0], [2, 0], [1, 1], [2, 1]],
    [[1, 0], [2, 0], [1, 1], [2, 1]],
    [[1, 0], [2, 0], [1, 1], [2, 1]],
  ],
  T: [
    [[1, 0], [0, 1], [1, 1], [2, 1]],
    [[1, 0], [1, 1], [2, 1], [1, 2]],
    [[0, 1], [1, 1], [2, 1], [1, 2]],
    [[1, 0], [0, 1], [1, 1], [1, 2]],
  ],
  S: [
    [[1, 0], [2, 0], [0, 1], [1, 1]],
    [[1, 0], [1, 1], [2, 1], [2, 2]],
    [[1, 1], [2, 1], [0, 2], [1, 2]],
    [[0, 0], [0, 1], [1, 1], [1, 2]],
  ],
  Z: [
    [[0, 0], [1, 0], [1, 1], [2, 1]],
    [[2, 0], [1, 1], [2, 1], [1, 2]],
    [[0, 1], [1, 1], [1, 2], [2, 2]],
    [[1, 0], [0, 1], [1, 1], [0, 2]],
  ],
  J: [
    [[0, 0], [0, 1], [1, 1], [2, 1]],
    [[1, 0], [2, 0], [1, 1], [1, 2]],
    [[0, 1], [1, 1], [2, 1], [2, 2]],
    [[1, 0], [1, 1], [0, 2], [1, 2]],
  ],
  L: [
    [[2, 0], [0, 1], [1, 1], [2, 1]],
    [[1, 0], [1, 1], [1, 2], [2, 2]],
    [[0, 1], [1, 1], [2, 1], [0, 2]],
    [[0, 0], [1, 0], [1, 1], [1, 2]],
  ],
};

const KICKS_JLSTZ: Record<string, Pt[]> = {
  "0>1": [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  "1>0": [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  "1>2": [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  "2>1": [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  "2>3": [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  "3>2": [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  "3>0": [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  "0>3": [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
};

const KICKS_I: Record<string, Pt[]> = {
  "0>1": [[0, 0], [-2, 0], [1, 0], [-2, 1], [1, -2]],
  "1>0": [[0, 0], [2, 0], [-1, 0], [2, -1], [-1, 2]],
  "1>2": [[0, 0], [-1, 0], [2, 0], [-1, -2], [2, 1]],
  "2>1": [[0, 0], [1, 0], [-2, 0], [1, 2], [-2, -1]],
  "2>3": [[0, 0], [2, 0], [-1, 0], [2, -1], [-1, 2]],
  "3>2": [[0, 0], [-2, 0], [1, 0], [-2, 1], [1, -2]],
  "3>0": [[0, 0], [1, 0], [-2, 0], [1, 2], [-2, -1]],
  "0>3": [[0, 0], [-1, 0], [2, 0], [-1, -2], [2, 1]],
};

export interface ActivePiece { type: PieceType; rotation: number; x: number; y: number; }

export const PIECE_TYPES: PieceType[] = ["I", "O", "T", "S", "Z", "J", "L"];

export function createBoard(): Board {
  return Array.from({ length: ROWS + HIDDEN_ROWS }, () => Array<Cell>(COLS).fill(null));
}

export function makeBag(): PieceType[] {
  const bag = [...PIECE_TYPES];
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [bag[i], bag[j]] = [bag[j]!, bag[i]!];
  }
  return bag;
}

export function spawnPiece(type: PieceType): ActivePiece {
  return { type, rotation: 0, x: 3, y: 0 };
}

export function cellsOf(piece: ActivePiece): Pt[] {
  return SHAPES[piece.type][piece.rotation]!.map(([x, y]): Pt => [piece.x + x, piece.y + y]);
}

export function shapeCells(type: PieceType, rotation = 0): Pt[] {
  return SHAPES[type][rotation]!;
}

export function collides(board: Board, piece: ActivePiece): boolean {
  return cellsOf(piece).some(
    ([x, y]) => x < 0 || x >= COLS || y >= ROWS + HIDDEN_ROWS || (y >= 0 && board[y]![x] !== null),
  );
}

export function tryMove(board: Board, piece: ActivePiece, dx: number, dy: number) {
  const next = { ...piece, x: piece.x + dx, y: piece.y + dy };
  return collides(board, next) ? null : next;
}

export function tryRotate(board: Board, piece: ActivePiece, dir: 1 | -1) {
  const from = piece.rotation;
  const to = (from + dir + 4) % 4;
  const table = piece.type === "I" ? KICKS_I : KICKS_JLSTZ;
  const fallback: Pt[] = [[0, 0]];
  const kicks: Pt[] = piece.type === "O" ? fallback : (table[`${from}>${to}`] ?? fallback);
  for (const [kx, ky] of kicks) {
    const next = { ...piece, rotation: to, x: piece.x + kx, y: piece.y - ky };
    if (!collides(board, next)) return { piece: next, kicked: kx !== 0 || ky !== 0 };
  }
  return null;
}

export function ghostOf(board: Board, piece: ActivePiece): ActivePiece {
  let ghost = piece;
  for (;;) {
    const next = tryMove(board, ghost, 0, 1);
    if (!next) return ghost;
    ghost = next;
  }
}

export function lockPiece(board: Board, piece: ActivePiece): Board {
  const next = board.map((row) => [...row]);
  for (const [x, y] of cellsOf(piece)) {
    if (y >= 0 && y < next.length && x >= 0 && x < COLS) next[y]![x] = piece.type;
  }
  return next;
}

export function findFullRows(board: Board): number[] {
  const rows: number[] = [];
  board.forEach((row, y) => { if (row.every((c) => c !== null)) rows.push(y); });
  return rows;
}

export function clearRows(board: Board, rows: number[]): Board {
  const kept = board.filter((_, y) => !rows.includes(y));
  const fresh = Array.from({ length: rows.length }, () => Array<Cell>(COLS).fill(null));
  return [...fresh, ...kept];
}

export function isBoardEmpty(board: Board): boolean {
  return board.every((row) => row.every((c) => c === null));
}

export function detectTSpin(board: Board, piece: ActivePiece, lastActionWasRotation: boolean): boolean {
  if (piece.type !== "T" || !lastActionWasRotation) return false;
  const cx = piece.x + 1;
  const cy = piece.y + 1;
  const corners: Pt[] = [
    [cx - 1, cy - 1], [cx + 1, cy - 1],
    [cx - 1, cy + 1], [cx + 1, cy + 1],
  ];
  const filled = corners.filter(
    ([x, y]) => x < 0 || x >= COLS || y >= ROWS + HIDDEN_ROWS || (y >= 0 && board[y]![x] !== null),
  ).length;
  return filled >= 3;
}

export interface ScoreEvent {
  lines: number; level: number; tSpin: boolean; perfectClear: boolean;
  backToBack: boolean; combo: number; softDropCells?: number; hardDropCells?: number;
}

const LINE_SCORES = [0, 100, 300, 500, 800];
const TSPIN_SCORES = [400, 800, 1200, 1600];

export function scoreFor(e: ScoreEvent): number {
  let base = (e.tSpin ? TSPIN_SCORES[Math.min(e.lines, 3)] : LINE_SCORES[e.lines]) ?? 0;
  if (e.backToBack && (e.lines === 4 || (e.tSpin && e.lines > 0))) base = Math.floor(base * 1.5);
  if (e.perfectClear && e.lines > 0) base += [0, 800, 1200, 1800, 2000][e.lines] ?? 0;
  const combo = e.combo > 0 ? 50 * e.combo : 0;
  const drops = (e.softDropCells ?? 0) + (e.hardDropCells ?? 0) * 2;
  return (base + combo) * Math.max(1, e.level) + drops;
}

export function gravityForLevel(level: number): number {
  const l = Math.max(1, level);
  return Math.max(40, Math.round(1000 * Math.pow(0.8 - (l - 1) * 0.007, l - 1)));
}
