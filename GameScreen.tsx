import { useCallback, useEffect, useRef, useState } from "react";
import { useTetris, type RunStats } from "@/hooks/useTetris";
import { PiecePreview, TetrisBoard } from "./Board";
import type { Theme } from "@/lib/tetris/themes";
import type { GameMode, Settings } from "@/lib/tetris/storage";

const MODE_LABEL: Record<GameMode, string> = {
  classic: "Classic", sprint: "Sprint 40L", ultra: "Ultra 2:00", zen: "Zen",
};

function fmtTime(ms: number) {
  const total = Math.floor(ms / 1000);
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="glass px-2 py-1.5 text-center sm:px-3 sm:py-2">
      <div className="text-[10px] uppercase tracking-[0.18em] opacity-60">{label}</div>
      <div className="text-base font-bold tabular-nums">{value}</div>
    </div>
  );
}

interface Props {
  mode: GameMode;
  theme: Theme;
  settings: Settings;
  bestScore: number;
  onExit: () => void;
  onFinish: (run: RunStats, mode: GameMode) => void;
}

export function GameScreen({ mode, theme, settings, bestScore, onExit, onFinish }: Props) {
  const [finished, setFinished] = useState<RunStats | null>(null);

  const handleOver = useCallback((r: RunStats) => {
    setFinished(r);
    onFinish(r, mode);
  }, [mode, onFinish]);

  const g = useTetris(mode, handleOver);
  const started = useRef(false);
  useEffect(() => {
    if (!started.current) {
      started.current = true;
      g.start();
    }
  }, [g]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const keys = ["ArrowLeft", "ArrowRight", "ArrowDown", "ArrowUp", " ", "Shift", "p", "P", "z", "Z", "c", "C"];
      if (keys.includes(e.key)) e.preventDefault();
      switch (e.key) {
        case "ArrowLeft": g.move(-1); break;
        case "ArrowRight": g.move(1); break;
        case "ArrowDown": g.softDrop(); break;
        case "ArrowUp": case "x": case "X": g.rotate(1); break;
        case "z": case "Z": g.rotate(-1); break;
        case " ": g.hardDrop(); break;
        case "Shift": case "c": case "C": g.holdPiece(); break;
        case "p": case "P": case "Escape": g.togglePause(); break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [g]);

  const touch = useRef({ x: 0, y: 0, t: 0, moved: 0 });
  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0]!;
    touch.current = { x: t.clientX, y: t.clientY, t: Date.now(), moved: 0 };
  };
  const onTouchMove = (e: React.TouchEvent) => {
    const t = e.touches[0]!;
    const dx = t.clientX - touch.current.x;
    const dy = t.clientY - touch.current.y;
    const step = 26;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) >= step) {
      g.move(dx > 0 ? 1 : -1);
      touch.current.x = t.clientX;
      touch.current.moved += 1;
    } else if (dy >= step) {
      g.softDrop();
      touch.current.y = t.clientY;
      touch.current.moved += 1;
    }
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const t = e.changedTouches[0]!;
    const dy = t.clientY - touch.current.y;
    const quick = Date.now() - touch.current.t < 260;
    if (touch.current.moved === 0 && quick) {
      if (dy < -50) g.hardDrop();
      else g.rotate(1);
    }
  };

  const isNewBest = finished ? finished.score > bestScore : false;

  return (
    <div className="mx-auto flex h-[100dvh] w-full max-w-5xl flex-col gap-2 overflow-hidden px-3 pb-3 pt-2 sm:gap-3 sm:px-5 sm:pb-5 sm:pt-3">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <button onClick={onExit} className="glass press shrink-0 px-3 py-2 text-sm">‹ Menu</button>
          <span className="truncate text-sm font-semibold opacity-80">{MODE_LABEL[mode]}</span>
          {g.stage !== "normal" && (
            <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest"
              style={{ background: `color-mix(in oklab, ${theme.accent} 30%, transparent)` }}>
              {g.stage === "extreme" ? "Extreme" : g.stage === "burst" ? "Burst" : "Fast"}
            </span>
          )}
        </div>
        <button onClick={g.togglePause} className="glass press shrink-0 px-4 py-1.5 text-sm font-semibold sm:py-2">
          {g.status === "paused" ? "▶" : "❚❚"}
        </button>
      </header>

      {/* Hold + Next + Score strip */}
      <div className="flex items-center gap-2">
        <div className="glass flex items-center gap-2 px-2 py-1.5">
          <span className="text-[10px] uppercase tracking-[0.18em] opacity-60">Hold</span>
          <PiecePreview type={g.hold} theme={theme} size={10} />
        </div>
        <div className="glass flex items-center gap-2 px-2 py-1.5">
          <span className="text-[10px] uppercase tracking-[0.18em] opacity-60">Next</span>
          <div className="flex gap-1.5">
            {g.queue.slice(0, 3).map((t, i) => <PiecePreview key={`${t}-${i}`} type={t} theme={theme} size={10} />)}
          </div>
        </div>
        <div className="glass ml-auto px-3 py-1.5 text-right">
          <div className="text-lg font-black leading-none tabular-nums glow-text">{g.run.score.toLocaleString()}</div>
          <div className="text-[10px] opacity-60">Best {bestScore.toLocaleString()}</div>
        </div>
      </div>

      {/* Board */}
      <div
        className="relative mx-auto aspect-[10/20] min-h-0 w-auto max-w-full flex-1 touch-none select-none"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <TetrisBoard
          board={g.board}
          piece={g.piece}
          ghost={g.ghost}
          clearing={g.clearing}
          theme={theme}
          showGhost={settings.ghost}
          shake={g.shake}
        />
        <div className="toast-stack">
          {g.toasts.map((t) => (
            <div key={t.id} className="toast text-sm" style={{ color: t.tone === "warn" ? "#fca5a5" : theme.accent }}>
              {t.text}
            </div>
          ))}
        </div>

        {g.status === "paused" && (
          <div className="glass absolute inset-0 flex flex-col items-center justify-center gap-3 text-center">
            <h2 className="text-2xl font-black tracking-widest glow-text">PAUSED</h2>
            <button onClick={g.togglePause} className="glass press px-6 py-2 font-semibold">Resume</button>
            <button onClick={g.start} className="glass press px-6 py-2 font-semibold">Restart</button>
            <button onClick={onExit} className="press text-sm opacity-70 underline">Quit to menu</button>
          </div>
        )}

        {g.status === "over" && finished && (
          <div className="glass fade-up absolute inset-0 flex flex-col items-center justify-center gap-2 px-4 text-center">
            {isNewBest && <div className="text-sm font-bold" style={{ color: theme.accent }}>🏆 NEW HIGH SCORE!</div>}
            <h2 className="text-2xl font-black tracking-wider">GAME OVER</h2>
            <div className="text-3xl font-black tabular-nums glow-text">{finished.score.toLocaleString()}</div>
            <div className="grid w-full grid-cols-2 gap-2 pt-2 text-xs">
              <Stat label="Lines" value={finished.lines} />
              <Stat label="Level" value={finished.level} />
              <Stat label="Time" value={fmtTime(finished.elapsedMs)} />
              <Stat label="Tetrises" value={finished.tetrises} />
              <Stat label="Best combo" value={`${finished.bestCombo}x`} />
              <Stat label="T-Spins" value={finished.tSpins} />
            </div>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => { setFinished(null); g.start(); }}
                className="press rounded-full px-5 py-2 text-sm font-bold"
                style={{ background: theme.accent, color: "#08111f" }}
              >
                Play again
              </button>
              <button onClick={onExit} className="glass press rounded-full px-5 py-2 text-sm font-semibold">Menu</button>
            </div>
          </div>
        )}
      </div>

      {/* Touch controls: hold + hard drop only */}
      <div className="grid shrink-0 grid-cols-2 gap-2 sm:hidden">
        <button onClick={() => g.holdPiece()} className="glass press py-3 text-sm font-bold tracking-widest">HOLD</button>
        <button
          onClick={() => g.hardDrop()}
          className="press rounded-2xl py-3 text-sm font-black tracking-widest"
          style={{ background: `color-mix(in oklab, ${theme.accent} 32%, transparent)` }}
        >
          HARD DROP
        </button>
      </div>

      <p className="hidden text-center text-xs opacity-50 sm:block">
        ← → move · ↓ soft drop · ↑ / X rotate · Z rotate CCW · Space hard drop · Shift/C hold · P pause
      </p>
    </div>
  );
}
