import type { PieceType } from "./engine";

export interface Theme {
  id: string;
  name: string;
  backdrop: string;
  accent: string;
  colors: Record<PieceType, string>;
}

const neonBase: Record<PieceType, string> = {
  I: "#22d3ee", O: "#facc15", T: "#c084fc", S: "#4ade80",
  Z: "#fb7185", J: "#60a5fa", L: "#fb923c",
};

export const THEMES: Theme[] = [
  { id: "classic", name: "Classic", backdrop: "radial-gradient(circle at 20% 10%, #1e293b, #0b1120 70%)", accent: "#38bdf8", colors: neonBase },
  { id: "neon", name: "Neon", backdrop: "radial-gradient(circle at 80% 0%, #2b1055, #090318 70%)", accent: "#f0abfc", colors: { ...neonBase, T: "#f472b6", I: "#67e8f9", S: "#a3e635" } },
  { id: "cyberpunk", name: "Cyberpunk", backdrop: "linear-gradient(160deg, #240b36, #0f0524 55%, #05010f)", accent: "#fde047", colors: { ...neonBase, I: "#00fff0", O: "#fde047", T: "#ff2ea6", J: "#7c5cff" } },
  { id: "space", name: "Space", backdrop: "radial-gradient(circle at 50% 100%, #1b2b5b, #030616 70%)", accent: "#a5b4fc", colors: { ...neonBase, S: "#5eead4", Z: "#f9a8d4" } },
  { id: "ocean", name: "Ocean", backdrop: "linear-gradient(180deg, #063045, #041b2b 60%, #010a12)", accent: "#2dd4bf", colors: { ...neonBase, O: "#7dd3fc", L: "#fcd34d", T: "#5eead4" } },
  { id: "forest", name: "Forest", backdrop: "linear-gradient(170deg, #10291b, #071510 60%, #030a07)", accent: "#86efac", colors: { ...neonBase, T: "#a3e635", J: "#34d399", Z: "#f97316" } },
  { id: "lava", name: "Lava", backdrop: "radial-gradient(circle at 50% 110%, #6b1206, #1c0603 65%, #0b0201)", accent: "#fb923c", colors: { ...neonBase, I: "#fdba74", T: "#f87171", S: "#fbbf24", J: "#f97316" } },
  { id: "ice", name: "Ice", backdrop: "linear-gradient(180deg, #16354d, #0a1a28 60%, #050d15)", accent: "#bae6fd", colors: { ...neonBase, T: "#93c5fd", S: "#a5f3fc", Z: "#c4b5fd" } },
  { id: "retro", name: "Retro", backdrop: "linear-gradient(180deg, #2a1a12, #150c08 60%, #080403)", accent: "#fbbf24", colors: { ...neonBase, I: "#fcd34d", O: "#fde68a", T: "#fb923c", S: "#84cc16" } },
  { id: "minimal", name: "Minimal", backdrop: "linear-gradient(180deg, #1c1c1f, #0d0d0f)", accent: "#e5e7eb",
    colors: { I: "#e5e7eb", O: "#d1d5db", T: "#9ca3af", S: "#f3f4f6", Z: "#6b7280", J: "#cbd5e1", L: "#94a3b8" } },
];

export function themeById(id: string): Theme {
  return THEMES.find((t) => t.id === id) ?? THEMES[0]!;
}

