export type Appearance = "dark" | "light" | "system";
export type GameMode = "classic" | "sprint" | "ultra" | "zen";

export interface Settings {
  appearance: Appearance; theme: string; ghost: boolean;
  sound: boolean; vibration: boolean; particles: boolean;
}

export interface Stats {
  gamesPlayed: number; bestScore: number; bestLevel: number; totalLines: number;
  totalTetrises: number; perfectClears: number; tSpins: number; longestCombo: number;
  totalTimeMs: number; longestSurvivalMs: number; totalScore: number;
}

export interface Profile { name: string; avatar: string; }

export interface ScoreEntry { score: number; lines: number; level: number; mode: GameMode; date: number; }

const KEY = "tetris.v1";

export const DEFAULT_SETTINGS: Settings = {
  appearance: "dark", theme: "neon", ghost: true, sound: true, vibration: true, particles: true,
};

export const DEFAULT_STATS: Stats = {
  gamesPlayed: 0, bestScore: 0, bestLevel: 1, totalLines: 0, totalTetrises: 0,
  perfectClears: 0, tSpins: 0, longestCombo: 0, totalTimeMs: 0, longestSurvivalMs: 0, totalScore: 0,
};

export const DEFAULT_PROFILE: Profile = { name: "Player", avatar: "🎮" };

export interface SaveData {
  settings: Settings; stats: Stats; profile: Profile;
  leaderboard: ScoreEntry[]; achievements: string[];
}

const DEFAULT_SAVE: SaveData = {
  settings: DEFAULT_SETTINGS, stats: DEFAULT_STATS, profile: DEFAULT_PROFILE,
  leaderboard: [], achievements: [],
};

export function loadSave(): SaveData {
  if (typeof window === "undefined") return DEFAULT_SAVE;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEFAULT_SAVE;
    const parsed = JSON.parse(raw) as Partial<SaveData>;
    return {
      settings: { ...DEFAULT_SETTINGS, ...parsed.settings },
      stats: { ...DEFAULT_STATS, ...parsed.stats },
      profile: { ...DEFAULT_PROFILE, ...parsed.profile },
      leaderboard: parsed.leaderboard ?? [],
      achievements: parsed.achievements ?? [],
    };
  } catch {
    return DEFAULT_SAVE;
  }
}

export function persistSave(data: SaveData) {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(KEY, JSON.stringify(data)); } catch { /* storage blocked */ }
}

export function clearSave() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
}

export interface Achievement {
  id: string; name: string; description: string; icon: string; check: (s: Stats) => boolean;
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: "first", name: "First Drop", description: "Play your first game", icon: "🎯", check: (s) => s.gamesPlayed >= 1 },
  { id: "lines100", name: "Century", description: "Clear 100 lines", icon: "💯", check: (s) => s.totalLines >= 100 },
  { id: "lines500", name: "Line Hunter", description: "Clear 500 lines", icon: "🏹", check: (s) => s.totalLines >= 500 },
  { id: "lines1000", name: "Line Legend", description: "Clear 1000 lines", icon: "👑", check: (s) => s.totalLines >= 1000 },
  { id: "tetris10", name: "Quad Squad", description: "Score 10 Tetrises", icon: "🧱", check: (s) => s.totalTetrises >= 10 },
  { id: "tetris100", name: "Quad Master", description: "Score 100 Tetrises", icon: "🏆", check: (s) => s.totalTetrises >= 100 },
  { id: "perfect", name: "Spotless", description: "Land a Perfect Clear", icon: "✨", check: (s) => s.perfectClears >= 1 },
  { id: "tspin", name: "Spin Doctor", description: "Land a T-Spin", icon: "🌀", check: (s) => s.tSpins >= 1 },
  { id: "combo", name: "Combo Master", description: "Reach a 8x combo", icon: "🔥", check: (s) => s.longestCombo >= 8 },
  { id: "score100k", name: "High Roller", description: "Score 100,000 in one run", icon: "💎", check: (s) => s.bestScore >= 100000 },
  { id: "level15", name: "Extreme Survivor", description: "Reach level 15", icon: "⚡", check: (s) => s.bestLevel >= 15 },
  { id: "marathon", name: "Marathoner", description: "Survive 10 minutes in a run", icon: "⏱️", check: (s) => s.longestSurvivalMs >= 600000 },
];

