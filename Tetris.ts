import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  type ActivePiece, type Board, type PieceType,
  COLS, HIDDEN_ROWS, ROWS,
  clearRows, collides, createBoard, detectTSpin, findFullRows, ghostOf,
  gravityForLevel, isBoardEmpty, lockPiece, makeBag, scoreFor, spawnPiece, tryMove, tryRotate,
} from "@/lib/tetris/engine";
import type { GameMode } from "@/lib/tetris/storage";

export interface RunStats {
  score: number; lines: number; level: number; combo: number; bestCombo: number;
  tetrises: number; tSpins: number; perfectClears: number; pieces: number; elapsedMs: number;
}

export interface Toast { id: number; text: string; tone: "good" | "warn"; }

const LOCK_DELAY_MS = 500;
const SPRINT_LINES = 40;
const ULTRA_MS = 120_000;

function pressureFor(elapsedMs: number) {
  const stages = Math.floor(elapsedMs / 30_000);
  const extreme = elapsedMs >= 600_000;
  const burst = elapsedMs >= 300_000;
  const multiplier = Math.pow(0.9, stages) * (burst ? 0.85 : 1) * (extreme ? 0.7 : 1);
  return {
    gravityMultiplier: Math.max(0.08, multiplier),
    lockDelay: Math.max(120, LOCK_DELAY_MS - Math.floor(elapsedMs / 120_000) * 100),
    scoreMultiplier: 1 + stages * 0.05,
    stage: extreme ? "extreme" : burst ? "burst" : stages > 0 ? "fast" : "normal",
  } as const;
}

export function useTetris(mode: GameMode, onGameOver: (r: RunStats) => void) {
  const [board, setBoard] = useState<Board>(createBoard);
  const [piece, setPiece] = useState<ActivePiece | null>(null);
  const [queue, setQueue] = useState<PieceType[]>([]);
  const [hold, setHold] = useState<PieceType | null>(null);
  const [canHold, setCanHold] = useState(true);
  const [status, setStatus] = useState<"idle" | "playing" | "paused" | "over">("idle");
  const [clearing, setClearing] = useState<number[]>([]);
  const [shake, setShake] = useState(0);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [run, setRun] = useState<RunStats>({
    score: 0, lines: 0, level: 1, combo: 0, bestCombo: 0,
    tetrises: 0, tSpins: 0, perfectClears: 0, pieces: 0, elapsedMs: 0,
  });

  const backToBack = useRef(false);
  const lastRotate = useRef(false);
  const lockTimer = useRef(0);
  const dropAcc = useRef(0);
  const lastStage = useRef("normal");
  const toastId = useRef(0);
  const pieceRef = useRef<ActivePiece | null>(null);
  const queueRef = useRef<PieceType[]>([]);

  useEffect(() => { pieceRef.current = piece; }, [piece]);
  useEffect(() => { queueRef.current = queue; }, [queue]);

  const takeNext = useCallback((): PieceType => {
    const next = [...queueRef.current];
    while (next.length < 7) next.push(...makeBag());
    const type = next.shift()!;
    queueRef.current = next;
    setQueue(next);
    return type;
  }, []);

  const pushToast = useCallback((text: string, tone: Toast["tone"] = "good") => {
    const id = ++toastId.current;
    setToasts((t) => [...t.slice(-3), { id, text, tone }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 1400);
  }, []);

  const refill = useCallback((q: PieceType[]) => {
    const next = [...q];
    while (next.length < 7) next.push(...makeBag());
    return next;
  }, []);

  const start = useCallback(() => {
    const q = refill([]);
    const first = q.shift()!;
    setBoard(createBoard());
    queueRef.current = q;
    setQueue(q);
    setHold(null);
    setCanHold(true);
    pieceRef.current = spawnPiece(first);
    setPiece(spawnPiece(first));
    setClearing([]);
    setToasts([]);
    setRun({ score: 0, lines: 0, level: 1, combo: 0, bestCombo: 0, tetrises: 0, tSpins: 0, perfectClears: 0, pieces: 0, elapsedMs: 0 });
    backToBack.current = false;
    lockTimer.current = 0;
    dropAcc.current = 0;
    lastStage.current = "normal";
    setStatus("playing");
  }, [refill]);

  const pressure = useMemo(() => pressureFor(run.elapsedMs), [run.elapsedMs]);

  const nextPiece = useCallback((b: Board) => {
    const spawned = spawnPiece(takeNext());
    if (collides(b, spawned)) {
      pieceRef.current = null;
      setPiece(null);
      setStatus("over");
    } else {
      pieceRef.current = spawned;
      setPiece(spawned);
    }
    setCanHold(true);
  }, [takeNext]);

  const lockDown = useCallback((p: ActivePiece, hardCells = 0) => {
    const tSpin = detectTSpin(board, p, lastRotate.current);
    const locked = lockPiece(board, p);
    const full = findFullRows(locked);
    const cleared = full.length;
    const after = cleared ? clearRows(locked, full) : locked;
    const perfect = cleared > 0 && isBoardEmpty(after);
    const combo = cleared > 0 ? run.combo + 1 : 0;
    const isDifficult = cleared === 4 || (tSpin && cleared > 0);

    const gained = Math.round(
      scoreFor({
        lines: cleared, level: run.level, tSpin, perfectClear: perfect,
        backToBack: backToBack.current && isDifficult,
        combo: Math.max(0, combo - 1), hardDropCells: hardCells,
      }) * pressure.scoreMultiplier,
    );

    if (cleared > 0) backToBack.current = isDifficult;

    if (perfect) pushToast("PERFECT CLEAR!");
    else if (cleared === 4) pushToast("TETRIS!");
    else if (tSpin && cleared > 0) pushToast("T-SPIN!");
    if (combo >= 3) pushToast(`${combo}x COMBO`);

    if (cleared) {
      setClearing(full);
      setShake(cleared);
      window.setTimeout(() => { setClearing([]); setShake(0); }, 180);
    }

    const totalLines = run.lines + cleared;
    const level = mode === "zen" ? 1 : Math.floor(totalLines / 10) + 1;
    if (level > run.level) pushToast(`LEVEL ${level}`);

    setRun((r) => ({
      ...r,
      score: r.score + gained,
      lines: totalLines,
      level,
      combo,
      bestCombo: Math.max(r.bestCombo, combo),
      tetrises: r.tetrises + (cleared === 4 ? 1 : 0),
      tSpins: r.tSpins + (tSpin ? 1 : 0),
      perfectClears: r.perfectClears + (perfect ? 1 : 0),
      pieces: r.pieces + 1,
    }));

    setBoard(after);
    lockTimer.current = 0;
    dropAcc.current = 0;
    lastRotate.current = false;
    nextPiece(after);
  }, [board, mode, nextPiece, pressure.scoreMultiplier, pushToast, run.combo, run.level, run.lines]);

  const move = useCallback((dx: number) => {
    if (status !== "playing" || !piece) return;
    const next = tryMove(board, piece, dx, 0);
    if (next) {
      pieceRef.current = next;
      setPiece(next);
      lastRotate.current = false;
      if (!tryMove(board, next, 0, 1)) lockTimer.current = 0;
    }
  }, [board, piece, status]);

  const rotate = useCallback((dir: 1 | -1) => {
    if (status !== "playing" || !piece) return;
    const res = tryRotate(board, piece, dir);
    if (res) {
      pieceRef.current = res.piece;
      setPiece(res.piece);
      lastRotate.current = true;
      if (!tryMove(board, res.piece, 0, 1)) lockTimer.current = 0;
    }
  }, [board, piece, status]);

  const softDrop = useCallback(() => {
    if (status !== "playing" || !piece) return;
    const next = tryMove(board, piece, 0, 1);
    if (next) {
      pieceRef.current = next;
      setPiece(next);
      lastRotate.current = false;
      setRun((r) => ({ ...r, score: r.score + 1 }));
      dropAcc.current = 0;
    }
  }, [board, piece, status]);

  const hardDrop = useCallback(() => {
    if (status !== "playing" || !piece) return;
    const landed = ghostOf(board, piece);
    lockDown(landed, landed.y - piece.y);
  }, [board, lockDown, piece, status]);

  const holdPiece = useCallback(() => {
    if (status !== "playing" || !piece || !canHold) return;
    const current = piece.type;
    if (hold) {
      const swapped = spawnPiece(hold);
      if (collides(board, swapped)) return;
      pieceRef.current = swapped;
      setPiece(swapped);
    } else {
      const spawned = spawnPiece(takeNext());
      pieceRef.current = spawned;
      setPiece(spawned);
    }
    setHold(current);
    setCanHold(false);
  }, [board, canHold, hold, piece, status, takeNext]);

  const togglePause = useCallback(() => {
    setStatus((s) => (s === "playing" ? "paused" : s === "paused" ? "playing" : s));
  }, []);

  useEffect(() => {
    if (status !== "playing") return;
    let raf = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(100, now - last);
      last = now;
      dropAcc.current += dt;
      setRun((r) => ({ ...r, elapsedMs: r.elapsedMs + dt }));

      const speed =
        mode === "zen" ? 800
          : gravityForLevel(run.level) * (mode === "sprint" ? 1 : pressure.gravityMultiplier);

      const p = pieceRef.current;
      if (p) {
        let current = p;
        if (dropAcc.current >= speed) {
          dropAcc.current = 0;
          const next = tryMove(board, current, 0, 1);
          if (next) {
            lockTimer.current = 0;
            current = next;
            pieceRef.current = next;
            setPiece(next);
          }
        }
        if (!tryMove(board, current, 0, 1)) {
          lockTimer.current += dt;
          if (lockTimer.current >= pressure.lockDelay) {
            lockTimer.current = 0;
            lockDown(current);
          }
        }
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [board, lockDown, mode, pressure.gravityMultiplier, pressure.lockDelay, run.level, status]);

  useEffect(() => {
    if (status !== "playing") return;
    if (pressure.stage !== lastStage.current) {
      lastStage.current = pressure.stage;
      if (pressure.stage === "fast") pushToast("SPEED UP!", "warn");
      if (pressure.stage === "burst") pushToast("🔥 SPEED BURST", "warn");
      if (pressure.stage === "extreme") pushToast("⚠️ EXTREME MODE", "warn");
    }
  }, [pressure.stage, pushToast, status]);

  useEffect(() => {
    if (status !== "playing") return;
    if (mode === "sprint" && run.lines >= SPRINT_LINES) setStatus("over");
    if (mode === "ultra" && run.elapsedMs >= ULTRA_MS) setStatus("over");
  }, [mode, run.elapsedMs, run.lines, status]);

  const overReported = useRef(false);
  useEffect(() => {
    if (status === "over" && !overReported.current) {
      overReported.current = true;
      onGameOver(run);
    }
    if (status === "playing") overReported.current = false;
  }, [onGameOver, run, status]);

  const ghost = useMemo(
    () => (piece && status === "playing" ? ghostOf(board, piece) : null),
    [board, piece, status],
  );

  return {
    board, piece, ghost, queue: queue.slice(0, 5), hold, status, run, clearing, shake, toasts,
    stage: pressure.stage,
    start, move, rotate, softDrop, hardDrop, holdPiece, togglePause, setStatus,
    dims: { COLS, ROWS, HIDDEN_ROWS },
  };
      }
    
