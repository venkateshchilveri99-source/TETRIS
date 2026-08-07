import { ACHIEVEMENTS, type GameMode, type Profile, type ScoreEntry, type Settings, type Stats } from "@/lib/tetris/storage";
import { THEMES, type Theme } from "@/lib/tetris/themes";

const AVATARS = ["🎮", "👾", "🚀", "🦊", "🐉", "🧊", "⚡", "🌸", "🤖", "🎧", "🐙", "🔥"];

const MODES: { id: GameMode; name: string; desc: string; icon: string }[] = [
  { id: "classic", name: "Classic", desc: "Endless with rising difficulty", icon: "🎯" },
  { id: "sprint", name: "Sprint", desc: "Clear 40 lines as fast as you can", icon: "⚡" },
  { id: "ultra", name: "Ultra", desc: "Max score in 2 minutes", icon: "⏱️" },
  { id: "zen", name: "Zen", desc: "No pressure, no game over speed", icon: "🌿" },
];

function Panel({ title, children, onBack }: { title: string; children: React.ReactNode; onBack: () => void }) {
  return (
    <div className="fade-up mx-auto w-full max-w-2xl px-4 py-6">
      <header className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 pb-5">
        <button onClick={onBack} className="glass press shrink-0 px-3 py-2 text-sm">‹ Back</button>
        <h1 className="truncate text-xl font-black tracking-wide glow-text">{title}</h1>
      </header>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="glass flex items-center justify-between gap-3 px-4 py-3">
      <span className="min-w-0 truncate text-sm opacity-75">{label}</span>
      <span className="shrink-0 font-bold tabular-nums">{value}</span>
    </div>
  );
}

export function HomeScreen({ profile, stats, theme, onPlay, onNav }: {
  profile: Profile; stats: Stats; theme: Theme;
  onPlay: (mode: GameMode) => void; onNav: (screen: string) => void;
}) {
  return (
    <div className="fade-up mx-auto w-full max-w-2xl px-4 py-6">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 pb-6">
        <div className="flex min-w-0 items-center gap-3">
          <div className="glass grid h-12 w-12 shrink-0 place-items-center text-2xl">{profile.avatar}</div>
          <div className="min-w-0">
            <div className="truncate text-lg font-black">{profile.name}</div>
            <div className="truncate text-xs opacity-60">Best {stats.bestScore.toLocaleString()} · Lv {stats.bestLevel}</div>
          </div>
        </div>
        <button onClick={() => onNav("profile")} className="glass press shrink-0 px-3 py-2 text-sm">Edit</button>
      </header>

      <div className="pb-6 text-center">
        <h1 className="text-5xl font-black tracking-[0.22em] glow-text sm:text-6xl" style={{ color: theme.accent }}>TETRA</h1>
        <p className="pt-1 text-xs uppercase tracking-[0.4em] opacity-55">Premium block puzzle</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {MODES.map((m) => (
          <button key={m.id} onClick={() => onPlay(m.id)} className="glass press grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 p-4 text-left">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-xl"
              style={{ background: `color-mix(in oklab, ${theme.accent} 22%, transparent)` }}>{m.icon}</span>
            <span className="min-w-0">
              <span className="block truncate font-bold">{m.name}</span>
              <span className="block truncate text-xs opacity-60">{m.desc}</span>
            </span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 pt-3 sm:grid-cols-4">
        {[
          { id: "stats", label: "Statistics", icon: "📊" },
          { id: "achievements", label: "Achievements", icon: "🏅" },
          { id: "leaderboard", label: "Leaderboard", icon: "🏆" },
          { id: "settings", label: "Settings", icon: "⚙️" },
        ].map((i) => (
          <button key={i.id} onClick={() => onNav(i.id)} className="glass press flex flex-col items-center gap-1 py-4">
            <span className="text-xl">{i.icon}</span>
            <span className="text-xs font-semibold">{i.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function StatsScreen({ stats, onBack }: { stats: Stats; onBack: () => void }) {
  const avg = stats.gamesPlayed ? Math.round(stats.totalScore / stats.gamesPlayed) : 0;
  const mins = (ms: number) => `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
  return (
    <Panel title="Statistics" onBack={onBack}>
      <div className="grid gap-2">
        <Row label="Games played" value={stats.gamesPlayed} />
        <Row label="Best score" value={stats.bestScore.toLocaleString()} />
        <Row label="Average score" value={avg.toLocaleString()} />
        <Row label="Highest level" value={stats.bestLevel} />
        <Row label="Total lines cleared" value={stats.totalLines} />
        <Row label="Total Tetrises" value={stats.totalTetrises} />
        <Row label="Perfect clears" value={stats.perfectClears} />
        <Row label="T-Spins" value={stats.tSpins} />
        <Row label="Longest combo" value={`${stats.longestCombo}x`} />
        <Row label="Longest survival" value={mins(stats.longestSurvivalMs)} />
        <Row label="Total play time" value={mins(stats.totalTimeMs)} />
      </div>
    </Panel>
  );
}

export function AchievementsScreen({ stats, unlocked, onBack }: { stats: Stats; unlocked: string[]; onBack: () => void }) {
  return (
    <Panel title="Achievements" onBack={onBack}>
      <div className="grid gap-2 sm:grid-cols-2">
        {ACHIEVEMENTS.map((a) => {
          const done = unlocked.includes(a.id) || a.check(stats);
          return (
            <div key={a.id} className="glass grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 p-3" style={{ opacity: done ? 1 : 0.45 }}>
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-xl">{done ? a.icon : "🔒"}</span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-bold">{a.name}</span>
                <span className="block truncate text-xs opacity-60">{a.description}</span>
              </span>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

export function LeaderboardScreen({ entries, onBack }: { entries: ScoreEntry[]; onBack: () => void }) {
  return (
    <Panel title="Leaderboard" onBack={onBack}>
      {entries.length === 0 ? (
        <p className="glass p-6 text-center text-sm opacity-70">No runs yet — play a game to set your first record.</p>
      ) : (
        <div className="grid gap-2">
          {entries.slice(0, 20).map((e, i) => (
            <div key={`${e.date}-${i}`} className="glass grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3">
              <span className="w-6 shrink-0 text-sm font-black opacity-60">#{i + 1}</span>
              <span className="min-w-0 truncate text-xs opacity-70">
                {e.mode} · {e.lines} lines · Lv {e.level} · {new Date(e.date).toLocaleDateString()}
              </span>
              <span className="shrink-0 font-black tabular-nums">{e.score.toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}

export function SettingsScreen({ settings, onChange, onReset, onBack }: {
  settings: Settings;
  onChange: (patch: Partial<Settings>) => void;
  onReset: () => void;
  onBack: () => void;
}) {
  const Toggle = ({ label, on, set }: { label: string; on: boolean; set: (v: boolean) => void }) => (
    <button onClick={() => set(!on)} className="glass press flex items-center justify-between gap-3 px-4 py-3">
      <span className="text-sm">{label}</span>
      <span className="h-6 w-11 shrink-0 rounded-full p-0.5 transition-colors"
        style={{ background: on ? "color-mix(in oklab, currentColor 45%, transparent)" : "color-mix(in oklab, currentColor 15%, transparent)" }}>
        <span className="block h-5 w-5 rounded-full bg-current transition-transform" style={{ transform: on ? "translateX(20px)" : "translateX(0)" }} />
      </span>
    </button>
  );

  return (
    <Panel title="Settings" onBack={onBack}>
      <h2 className="pb-2 text-xs uppercase tracking-[0.2em] opacity-55">Appearance</h2>
      <div className="grid grid-cols-3 gap-2 pb-5">
        {(["dark", "light", "system"] as const).map((a) => (
          <button key={a} onClick={() => onChange({ appearance: a })}
            className="glass press py-3 text-sm font-semibold capitalize"
            style={{ outline: settings.appearance === a ? "2px solid currentColor" : "none" }}>
            {a === "dark" ? "🌙 Dark" : a === "light" ? "☀️ Light" : "📱 System"}
          </button>
        ))}
      </div>

      <h2 className="pb-2 text-xs uppercase tracking-[0.2em] opacity-55">Theme</h2>
      <div className="grid grid-cols-2 gap-2 pb-5 sm:grid-cols-3">
        {THEMES.map((t) => (
          <button key={t.id} onClick={() => onChange({ theme: t.id })}
            className="glass press flex items-center gap-2 px-3 py-3 text-sm font-semibold"
            style={{ outline: settings.theme === t.id ? `2px solid ${t.accent}` : "none" }}>
            <span className="h-4 w-4 shrink-0 rounded-full" style={{ background: t.accent, boxShadow: `0 0 10px ${t.accent}` }} />
            <span className="truncate">{t.name}</span>
          </button>
        ))}
      </div>

      <h2 className="pb-2 text-xs uppercase tracking-[0.2em] opacity-55">Gameplay</h2>
      <div className="grid gap-2 pb-5">
        <Toggle label="Ghost piece" on={settings.ghost} set={(v) => onChange({ ghost: v })} />
        <Toggle label="Sound effects" on={settings.sound} set={(v) => onChange({ sound: v })} />
        <Toggle label="Vibration" on={settings.vibration} set={(v) => onChange({ vibration: v })} />
        <Toggle label="Particle effects" on={settings.particles} set={(v) => onChange({ particles: v })} />
      </div>

      <button onClick={onReset} className="glass press w-full py-3 text-sm font-semibold text-red-400">Reset all progress</button>
      <p className="pt-4 text-center text-xs opacity-45">Tetra · offline-first · progress saved on this device</p>
    </Panel>
  );
}

export function ProfileScreen({ profile, onChange, onBack }: {
  profile: Profile; onChange: (p: Profile) => void; onBack: () => void;
}) {
  return (
    <Panel title="Profile" onBack={onBack}>
      <label className="block pb-2 text-xs uppercase tracking-[0.2em] opacity-55">Name</label>
      <input
        value={profile.name}
        maxLength={16}
        onChange={(e) => onChange({ ...profile, name: e.target.value })}
        className="glass mb-5 w-full px-4 py-3 text-base outline-none"
      />
      <label className="block pb-2 text-xs uppercase tracking-[0.2em] opacity-55">Avatar</label>
      <div className="grid grid-cols-6 gap-2">
        {AVATARS.map((a) => (
          <button key={a} onClick={() => onChange({ ...profile, avatar: a })}
            className="glass press grid aspect-square place-items-center text-xl"
            style={{ outline: profile.avatar === a ? "2px solid currentColor" : "none" }}>
            {a}
          </button>
        ))}
      </div>
    </Panel>
  );
}
