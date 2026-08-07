import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { GameScreen } from "@/components/tetris/GameScreen";
import {
  AchievementsScreen, HomeScreen, LeaderboardScreen, ProfileScreen, SettingsScreen, StatsScreen,
} from "@/components/tetris/Screens";
import type { RunStats } from "@/hooks/useTetris";
import {
  ACHIEVEMENTS, type GameMode, type Profile, type SaveData, type Settings,
  clearSave, loadSave, persistSave,
} from "@/lib/tetris/storage";
import { themeById } from "@/lib/tetris/themes";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Tetra — Premium Tetris Puzzle Game" },
      { name: "description", content: "Play Tetra, a polished block puzzle with Classic, Sprint, Ultra and Zen modes, T-spins, combos, themes, stats and achievements. Free and offline." },
      { property: "og:title", content: "Tetra — Premium Tetris Puzzle Game" },
      { property: "og:description", content: "A premium block puzzle: 4 game modes, neon themes, achievements and saved high scores." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: App,
});

type Screen = "home" | "game" | "stats" | "achievements" | "leaderboard" | "settings" | "profile";

function App() {
  const [save, setSave] = useState<SaveData | null>(null);
  const [screen, setScreen] = useState<Screen>("home");
  const [mode, setMode] = useState<GameMode>("classic");
  const [prefersDark, setPrefersDark] = useState(true);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    setSave(loadSave());
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setPrefersDark(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setPrefersDark(e.matches);
    mq.addEventListener("change", onChange);
    const t = window.setTimeout(() => setBooting(false), 900);
    return () => {
      mq.removeEventListener("change", onChange);
      window.clearTimeout(t);
    };
  }, []);

  const update = useCallback((patch: Partial<SaveData>) => {
    setSave((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      persistSave(next);
      return next;
    });
  }, []);

  const settings = save?.settings;
  const theme = useMemo(() => themeById(settings?.theme ?? "neon"), [settings?.theme]);
  const isLight = settings ? settings.appearance === "light" || (settings.appearance === "system" && !prefersDark) : false;

  const handleFinish = useCallback((run: RunStats, runMode: GameMode) => {
    setSave((prev) => {
      if (!prev) return prev;
      const stats = {
        ...prev.stats,
        gamesPlayed: prev.stats.gamesPlayed + 1,
        bestScore: Math.max(prev.stats.bestScore, run.score),
        bestLevel: Math.max(prev.stats.bestLevel, run.level),
        totalLines: prev.stats.totalLines + run.lines,
        totalTetrises: prev.stats.totalTetrises + run.tetrises,
        perfectClears: prev.stats.perfectClears + run.perfectClears,
        tSpins: prev.stats.tSpins + run.tSpins,
        longestCombo: Math.max(prev.stats.longestCombo, run.bestCombo),
        totalTimeMs: prev.stats.totalTimeMs + run.elapsedMs,
        longestSurvivalMs: Math.max(prev.stats.longestSurvivalMs, run.elapsedMs),
        totalScore: prev.stats.totalScore + run.score,
      };
      const leaderboard = [
        ...prev.leaderboard,
        { score: run.score, lines: run.lines, level: run.level, mode: runMode, date: Date.now() },
      ].sort((a, b) => b.score - a.score).slice(0, 50);
      const achievements = Array.from(
        new Set([...prev.achievements, ...ACHIEVEMENTS.filter((a) => a.check(stats)).map((a) => a.id)]),
      );
      const next = { ...prev, stats, leaderboard, achievements };
      persistSave(next);
      return next;
    });
  }, []);

  const shellStyle = { background: theme.backdrop, ["--accent" as string]: theme.accent };

  if (!save || booting || !settings) {
    return (
      <main className="tetris-app grid min-h-dvh place-items-center" style={shellStyle}>
        <div className="fade-up text-center">
          <div className="text-4xl font-black tracking-[0.3em] glow-text" style={{ color: theme.accent }}>TETRA</div>
          <div className="mx-auto mt-4 h-1 w-40 overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-1/3 animate-[float-blob_1.2s_ease-in-out_infinite] rounded-full" style={{ background: theme.accent }} />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={`tetris-app relative ${isLight ? "light-mode" : ""}`} style={shellStyle}>
      <div className="aurora" aria-hidden>
        <span style={{ background: theme.accent, left: "-10%", top: "-10%" }} />
        <span style={{ background: theme.colors.T, right: "-15%", top: "20%" }} />
        <span style={{ background: theme.colors.I, left: "20%", bottom: "-20%" }} />
      </div>

      <div className="relative z-10">
        {screen === "home" && (
          <HomeScreen
            profile={save.profile}
            stats={save.stats}
            theme={theme}
            onPlay={(m) => { setMode(m); setScreen("game"); }}
            onNav={(s) => setScreen(s as Screen)}
          />
        )}
        {screen === "game" && (
          <GameScreen
            mode={mode}
            theme={theme}
            settings={settings}
            bestScore={save.stats.bestScore}
            onExit={() => setScreen("home")}
            onFinish={handleFinish}
          />
        )}
        {screen === "stats" && <StatsScreen stats={save.stats} onBack={() => setScreen("home")} />}
        {screen === "achievements" && (
          <AchievementsScreen stats={save.stats} unlocked={save.achievements} onBack={() => setScreen("home")} />
        )}
        {screen === "leaderboard" && <LeaderboardScreen entries={save.leaderboard} onBack={() => setScreen("home")} />}
        {screen === "settings" && (
          <SettingsScreen
            settings={settings}
            onChange={(patch: Partial<Settings>) => update({ settings: { ...settings, ...patch } })}
            onReset={() => {
              if (window.confirm("Erase all progress, scores and achievements?")) {
                clearSave();
                setSave(loadSave());
              }
            }}
            onBack={() => setScreen("home")}
          />
        )}
        {screen === "profile" && (
          <ProfileScreen profile={save.profile} onChange={(p: Profile) => update({ profile: p })} onBack={() => setScreen("home")} />
        )}
      </div>
    </main>
  );
}

