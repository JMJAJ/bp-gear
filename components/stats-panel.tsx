"use client"
import { useApp, getStatPercentCombat } from "@/lib/app-context"
import { GAME_DATA, MODULE_THRESHOLDS, LEVEL_COLORS } from "@/lib/game-data"
import { Check, X, Settings } from "lucide-react"
import { MIND_PROJECTIONS } from "@/lib/psychoscope-data"
import { Tip } from "@/components/TooltipText"

const STATS = [
  { key: "crit", stat: "Crit", extKey: "crit" },
  { key: "haste", stat: "Haste", extKey: "haste" },
  { key: "luck", stat: "Luck", extKey: "luck" },
  { key: "mast", stat: "Mastery", extKey: "mast" },
  { key: "vers", stat: "Versatility", extKey: "vers" },
]

function StatBar({ pct, accent, breakpoints }: { pct: number; accent: string; breakpoints?: number[] }) {
  const w = Math.min(100, Math.max(0, (pct / 80) * 100))
  return (
    <div className="relative h-[4px] rounded-full overflow-hidden bg-[var(--stat-bar-bg)] mt-1.5">
      <div
        className="absolute left-0 top-0 h-full transition-all duration-300"
        style={{ width: `${w}%`, background: accent }}
      />
      {breakpoints?.map(bp => (
        <div
          key={bp}
          className="absolute top-0 h-full w-px bg-white/20"
          style={{ left: `${(bp / 80) * 100}%` }}
        />
      ))}
    </div>
  )
}

function NumberInput({ label, value, onChange, step, tip }: {
  label: string; value: number; onChange: (v: number) => void; step?: number; tip?: string
}) {
  return (
    <div>
      <label className="block text-[9px] uppercase tracking-[0.8px] text-[var(--text-dim)] mb-0.5">
        {tip ? <span className="game-tooltip" data-tip={tip}>{label}</span> : label}
      </label>
      <input
        type="number"
        value={value || ""}
        onChange={e => onChange(parseFloat(e.target.value) || 0)}
        placeholder="0"
        step={step}
        className="w-full bg-card border border-border text-foreground px-2 py-1 text-xs focus:border-[var(--ring)] outline-none"
      />
    </div>
  )
}

export function StatsPanel() {
  const { stats, ext, setExt, accentColor, setSection, spec, psychoscopeConfig, setPsychoscopeConfig } = useApp()
  const seasonLevel = ext.illu > 100 ? Math.round(ext.illu / 7) : Math.round(ext.illu || 0)
  const clampedSeasonLevel = Math.max(0, Math.min(100, seasonLevel))
  const seasonBaseIllu = clampedSeasonLevel * 7

  const updateSeasonLevel = (next: number) => {
    const lv = Math.max(0, Math.min(100, Math.round(next || 0)))
    setExt({ illu: lv })
  }
  
  // Get active Deep-Slumber projection
  const activeProjection = MIND_PROJECTIONS.find(p => p.id === psychoscopeConfig?.projectionId)

  return (
    <aside className="flex flex-col border-l border-border bg-background h-full overflow-y-auto">
      {/* Header */}
      <div className="px-4 py-4 border-b border-border">
        <div
          className="text-[10px] font-bold tracking-[2px] uppercase"
          style={{ color: accentColor }}
        >
          Stats Overview
        </div>
      </div>

      {/* Psychoscope toggle */}
      <div className="px-4 py-2 border-b border-border flex items-center justify-between">
        <Tip text="Turns Psychoscope bonuses on/off (projection + branches + bond stuff).">
          <span className="text-[10px] uppercase tracking-[1px] text-[var(--text-dim)]">Psychoscope</span>
        </Tip>
        <button
          onClick={() => setPsychoscopeConfig({ ...psychoscopeConfig, enabled: !psychoscopeConfig.enabled })}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded border transition-all text-[10px] font-bold uppercase tracking-[0.5px]"
          style={{
            borderColor: psychoscopeConfig.enabled ? accentColor : '#333',
            background: psychoscopeConfig.enabled ? `${accentColor}18` : 'transparent',
            color: psychoscopeConfig.enabled ? accentColor : '#555',
          }}
        >
          {psychoscopeConfig.enabled ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
          {psychoscopeConfig.enabled ? 'On' : 'Off'}
        </button>
      </div>

      {/* Main stats */}
      <div className="px-4 py-3 border-b border-border space-y-2">
        <div className="rounded-md border border-border bg-card/30 p-2">
        {STATS.map(({ key, stat, extKey }, idx) => {
          const raw = stats?.total[stat] ?? 0
          const extVal = stats?.ext[extKey as keyof typeof stats.ext] ?? 0
          // Include purple stat % bonuses (Crit%, Luck%, Mastery%, etc.)
          const purplePct = stats?.purpleStats?.[`${stat} (%)`] ?? 0
          const pct = getStatPercentCombat(stat, raw) + extVal + purplePct
          return (
            <div
              key={key}
              className={idx < STATS.length - 1 ? "pb-1.5 mb-1.5 border-b border-[var(--muted)]" : ""}
            >
              <div className="flex justify-between items-center">
                <Tip
                  text={
                    stat === "Crit" ? "Your crit chance (after base + gear + bonuses)." :
                    stat === "Haste" ? "Speed stat. Used in a bunch of formulas (and helps Attack/Cast Speed)." :
                    stat === "Luck" ? "Lucky Strike chance." :
                    stat === "Mastery" ? "Damage scaling stat." :
                    "General multiplier stat."
                  }
                >
                  <span className="text-[11px] text-[var(--text-mid)]">{stat}</span>
                </Tip>
                <div className="text-right leading-4">
                  <span className="text-[11px] font-bold tabular-nums text-white">{pct.toFixed(2)}%</span>
                  <span className="block text-[9px] text-[var(--text-dim)]">{raw.toFixed(0)} raw</span>
                </div>
              </div>
              <StatBar pct={pct} accent={accentColor} />
            </div>
          )
        })}
        </div>

        {/* ASPD / CSPD */}
        <details className="rounded-md border border-border bg-card/30 p-2 group" open>
          <summary className="flex items-center justify-between cursor-pointer list-none [&::-webkit-details-marker]:hidden">
            <span className="text-[10px] uppercase tracking-[1px] text-[var(--text-dim)]">Speed & Illusion</span>
            <span className="text-[10px] text-[var(--text-dim)] group-open:rotate-180 transition-transform">▾</span>
          </summary>
          <div className="pt-2 space-y-2">
          <div className="flex justify-between items-center">
            <Tip text="ASPD. Some skills care about 25/50/80% breakpoints.">
              <span className="text-[11px] text-[var(--text-mid)]">Attack Speed</span>
            </Tip>
            <span
              className="text-[12px] font-bold tabular-nums"
              style={{ color: (stats?.aspd ?? 0) >= 80 ? "#4ade80" : (stats?.aspd ?? 0) >= 50 ? accentColor : "#fff" }}
            >
              {(stats?.aspd ?? 0).toFixed(2)}%
            </span>
          </div>
          <div className="relative h-[4px] rounded-full overflow-hidden bg-[var(--stat-bar-bg)] mt-1 mb-1.5">
            <div
              className="absolute left-0 top-0 h-full transition-all duration-300"
              style={{
                width: `${Math.min(100, stats?.aspd ?? 0)}%`,
                background: (stats?.aspd ?? 0) >= 80 ? "#4ade80" : (stats?.aspd ?? 0) >= 50 ? accentColor : "#e5c229",
              }}
            />
            {[25, 50, 80].map(bp => (
              <div key={bp} className="absolute top-0 h-full w-px bg-white/25" style={{ left: `${bp}%` }} />
            ))}
          </div>
          {(stats?.aspd ?? 0) > 0 && (
            <div className="text-[9px] text-[var(--text-dim)] mb-1 leading-4">
              {[25, 50, 80].filter(bp => (stats?.aspd ?? 0) >= bp).map(bp => (
                <span key={bp} className="mr-1.5 inline-flex items-center gap-0.5" style={{ color: "#4ade80" }}>{bp}% <Check className="w-3 h-3" /></span>
              ))}
              {[25, 50, 80].find(bp => (stats?.aspd ?? 0) < bp) && (
                <span className="text-[var(--text-dim)]">
                  next: {[25, 50, 80].find(bp => (stats?.aspd ?? 0) < bp)}% (need {([25, 50, 80].find(bp => (stats?.aspd ?? 0) < bp)! - (stats?.aspd ?? 0)).toFixed(1)}% more)
                </span>
              )}
            </div>
          )}
          {(stats?.talentAspd ?? 0) > 0 && (
            <div className="text-[9px] mb-1" style={{ color: accentColor }}>
              Talent: +{(stats?.talentAspd ?? 0).toFixed(1)}% ASPD
            </div>
          )}

          <div className="flex justify-between items-center">
            <Tip text="CSPD. Shorter cast/animation time for skills that scale with it.">
              <span className="text-[11px] text-[var(--text-mid)]">Cast Speed</span>
            </Tip>
            <span className="text-[12px] font-bold tabular-nums text-white">{(stats?.cspd ?? 0).toFixed(2)}%</span>
          </div>
          <div className="relative h-[4px] rounded-full overflow-hidden bg-[var(--stat-bar-bg)] mt-1 mb-2">
            <div
              className="absolute left-0 top-0 h-full transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(0, ((stats?.cspd ?? 0) / 80) * 100))}%`, background: accentColor }}
            />
          </div>

          {/* Illusion Strength */}
          {(stats?.illuTotal ?? stats?.ext?.illu ?? 0) > 0 && (
            <div className="flex justify-between items-center mt-1">
              <Tip text="Total Illusion Strength = season-level base + gear + psychoscope.">
                <span className="text-[11px] text-[var(--text-mid)]">Illusion Strength</span>
              </Tip>
              <div className="text-right">
                <span className="text-[12px] font-bold tabular-nums" style={{ color: accentColor }}>
                  {(stats?.illuTotal ?? stats?.ext?.illu ?? 0).toFixed(0)}
                </span>
                {stats && (
                  <span className="block text-[9px] text-[var(--text-dim)]">
                    base {(stats.illuBase ?? 0).toFixed(0)} + gear {(stats.illuGear ?? 0).toFixed(0)} + psy {(stats.illuPsychoscope ?? 0).toFixed(0)}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Season level source for Illusion base */}
          <div className="mt-1 rounded-md border border-border/70 bg-background/40 p-2">
            <div className="flex items-center justify-between mb-1.5">
              <Tip text="Season level bonus for Illusion base. Formula: season level × 7.">
                <span className="text-[10px] uppercase tracking-[1px] text-[var(--text-dim)]">Season Level</span>
              </Tip>
              <span className="text-[10px] font-bold tabular-nums" style={{ color: accentColor }}>
                Lv60 +{clampedSeasonLevel}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={clampedSeasonLevel}
                onChange={e => updateSeasonLevel(parseInt(e.target.value) || 0)}
                className="w-full h-1.5 bg-[var(--stat-bar-bg)] rounded-lg appearance-none cursor-pointer"
                style={{ accentColor }}
              />
              <input
                type="number"
                min={0}
                max={100}
                step={1}
                value={clampedSeasonLevel}
                onChange={e => updateSeasonLevel(parseInt(e.target.value) || 0)}
                className="w-14 bg-card border border-border text-foreground px-1.5 py-1 text-[10px] focus:border-[var(--ring)] outline-none text-right"
              />
            </div>

            <div className="mt-1 text-[9px] text-[var(--text-dim)]">
              Base Illusion: <span className="tabular-nums">{seasonBaseIllu}</span> (7 per level)
            </div>
          </div>
          </div>
        </details>

        {/* Module % bonuses */}
        {stats?.moduleStats && Object.entries(stats.moduleStats).some(([k, v]) =>
          k.includes("(%)") && k !== "Attack Speed (%)" && k !== "Cast Speed (%)" && v > 0
        ) && (
            <details className="rounded-md border border-border bg-card/30 p-2 group">
              <summary className="flex items-center justify-between cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                <span className="text-[10px] uppercase tracking-[1px] text-[var(--text-dim)]">Module Bonuses</span>
                <span className="text-[10px] text-[var(--text-dim)] group-open:rotate-180 transition-transform">▾</span>
              </summary>
              <div className="pt-2">
              {Object.entries(stats.moduleStats)
                .filter(([k, v]) => k.includes("(%)") && k !== "Attack Speed (%)" && k !== "Cast Speed (%)" && v > 0)
                .map(([k, v]) => (
                  <div key={k} className="flex justify-between text-[10px] py-0.5">
                    <span className="text-[var(--text-mid)]">{k.replace(" (%)", "")}</span>
                    <span style={{ color: accentColor }}>+{v.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </details>
          )}

        {/* Weapon effects */}
        {stats?.weaponEffects && stats.weaponEffects.length > 0 && (
          <details className="rounded-md border border-border bg-card/30 p-2 group">
            <summary className="flex items-center justify-between cursor-pointer list-none [&::-webkit-details-marker]:hidden">
              <span className="text-[10px] uppercase tracking-[1px] text-[var(--text-dim)]">Weapon Buffs</span>
              <span className="text-[10px] text-[var(--text-dim)] group-open:rotate-180 transition-transform">▾</span>
            </summary>
            <div className="pt-2">
            {stats.weaponEffects.map((e, i) => (
              <div key={i} className="text-[10px] text-[var(--text-mid)] py-0.5">{e}</div>
            ))}
            </div>
          </details>
        )}

        {/* Raid bonus */}
        {stats?.appliedBonus && (
          <div className="rounded-md border border-border bg-card/30 px-2.5 py-2 text-[11px]" style={{ color: accentColor }}>
            <Tip text="Extra % you get from raid gear bonuses.">
              <span>Raid {stats.appliedBonus.l.replace(" (%)", "")} +{stats.appliedBonus.v}%</span>
            </Tip>
          </div>
        )}

        {/* Extra bonuses */}
        {stats?.extraStats && Object.keys(stats.extraStats).length > 0 && (
          <details className="rounded-md border border-border bg-card/30 p-2 group">
            <summary className="flex items-center justify-between cursor-pointer list-none [&::-webkit-details-marker]:hidden">
              <span className="text-[10px] uppercase tracking-[1px] text-[var(--text-dim)]">Bonuses</span>
              <span className="text-[10px] text-[var(--text-dim)] group-open:rotate-180 transition-transform">▾</span>
            </summary>
            <div className="pt-2">
            {Object.entries(stats.extraStats).map(([s, v]) => v > 0 && (
              <div key={s} className="flex justify-between text-[10px] py-0.5">
                <span className="text-[var(--text-mid)]">{s}</span>
                <span className="text-[var(--text-mid)]">+{v}</span>
              </div>
            ))}
            </div>
          </details>
        )}

        {/* Psychoscope Effects */}
        {activeProjection && stats?.psychoscopeEffects && stats.psychoscopeEffects.activeEffects.length > 0 && (
          <details className="rounded-md border border-border bg-card/30 p-2 group">
            <summary className="flex items-center justify-between cursor-pointer list-none [&::-webkit-details-marker]:hidden">
              <span className="text-[10px] uppercase tracking-[1px] text-[var(--text-dim)]">Psychoscope Effects</span>
              <span className="text-[10px] text-[var(--text-dim)] group-open:rotate-180 transition-transform">▾</span>
            </summary>
            <div className="pt-2">
            <div className="flex items-center gap-2 mb-1.5 px-2 py-1 rounded bg-card border border-border">
              {activeProjection.nodes[0]?.icon && (
                <img
                  src={activeProjection.nodes[0].icon}
                  alt=""
                  className="w-5 h-5 rounded-sm"
                />
              )}

              <span className="text-[9px] uppercase tracking-[1px] text-muted-foreground">
                Psychoscope
              </span>
            
              <span className="text-[var(--text-dim)] text-[9px]">—</span>
            
              <span className="text-[10px] font-semibold text-white leading-none">
                {activeProjection.name}
              </span>
            </div>
            
            {/* Effects */}
            <div className="border-b border-border">
              {stats.psychoscopeEffects.activeEffects.map((effect, i) => (
                <div key={i} className="text-[9px] text-[var(--text-mid)] py-0.5 leading-4">
                  <span className="mr-1" style={{ color: accentColor }}>•</span>
                  {effect}
                </div>
              ))}
            </div>
            </div>
          </details>
        )}

        {/* Purple stats */}
        {stats?.purpleStats && Object.keys(stats.purpleStats).length > 0 && (
          <details className="rounded-md border border-border bg-card/30 p-2 group">
            <summary className="flex items-center justify-between cursor-pointer list-none [&::-webkit-details-marker]:hidden">
              <span className="text-[10px] uppercase tracking-[1px] text-[var(--text-dim)]">Purple stats</span>
              <span className="text-[10px] text-[var(--text-dim)] group-open:rotate-180 transition-transform">▾</span>
            </summary>
            <div className="pt-2">
            {Object.entries(stats.purpleStats).map(([s, v]) => v > 0 && (
              <div key={s} className="flex justify-between text-[10px] py-0.5">
                <span className="text-[var(--text-mid)]">{s}</span>
                <span style={{ color: accentColor }}>+{v}{s.includes("(%)") ? "%" : ""}</span>
              </div>
            ))}
            </div>
          </details>
        )}

        {/* Raid Set Bonuses */}
        {(stats?.raid2pcBonus || stats?.raid4pcBonus) && (
          <details className="rounded-md border border-border bg-card/30 p-2 group">
            <summary className="flex items-center justify-between cursor-pointer list-none [&::-webkit-details-marker]:hidden">
              <span className="text-[10px] uppercase tracking-[1px] text-[var(--text-dim)]">Raid Set Bonuses</span>
              <span className="text-[10px] text-[var(--text-dim)] group-open:rotate-180 transition-transform">▾</span>
            </summary>
            <div className="pt-2">
            {stats?.raid2pcBonus && (
              <div className="text-[10px] py-0.5" style={{ color: (stats.raidArmorCount ?? 0) >= 2 ? accentColor : "var(--text-dim)" }}>
                <span className="font-bold mr-1">{(stats.raidArmorCount ?? 0) >= 2 ? <Check className="w-3 h-3 inline" /> : <X className="w-3 h-3 inline" />}</span>
                {stats.raid2pcBonus.l}
              </div>
            )}
            {stats?.raid4pcBonus && (
              <div className="text-[10px] py-0.5 mt-0.5" style={{ color: (stats.raidArmorCount ?? 0) >= 4 ? accentColor : "var(--text-dim)" }}>
                <span className="font-bold mr-1">{(stats.raidArmorCount ?? 0) >= 4 ? <Check className="w-3 h-3 inline" /> : <X className="w-3 h-3 inline" />}</span>
                {stats.raid4pcBonus.l}
              </div>
            )}
            <div className="text-[9px] text-[var(--text-dim)] mt-1">
              {stats.raidArmorCount ?? 0}/6 raid armor
            </div>
            </div>
          </details>
        )}

        <details className="rounded-md border border-border bg-card/30 p-2 group">
          <summary className="flex items-center justify-between cursor-pointer list-none [&::-webkit-details-marker]:hidden">
            <span className="text-[10px] uppercase tracking-[1px] text-[var(--text-dim)]">Modules</span>
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSection("modules") }}
                className="text-[10px] uppercase tracking-[0.5px] text-[var(--text-dim)] hover:text-[var(--text-mid)] transition-colors"
              >
                Config <Settings className="w-3 h-3 inline" />
              </button>
              <span className="text-[10px] text-[var(--text-dim)] group-open:rotate-180 transition-transform">▾</span>
            </div>
          </summary>
          <div className="pt-2">
            {stats?.powerCorePoints && Object.keys(stats.powerCorePoints).length > 0 ? (
              <div className="space-y-1.5">
                {Object.entries(stats.powerCorePoints).map(([name, pts]) => {
                  let level = 0
                  for (let li = MODULE_THRESHOLDS.length - 1; li >= 0; li--) {
                    if (pts >= MODULE_THRESHOLDS[li]) { level = li + 1; break }
                  }
                  const col = LEVEL_COLORS[level] ?? accentColor
                  return (
                    <div key={name} className="text-[10px]">
                      <span className="font-bold mr-1.5" style={{ color: col, textShadow: level === 6 ? "0 0 6px rgba(241,196,15,0.8)" : "none", }}>Lv.{level}</span>
                      <span className="text-[var(--text-mid)]">{name}</span>
                      <span className="text-[var(--text-dim)] ml-1 text-[9px]">· {pts}pts</span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-[10px] text-[var(--text-dim)]">No modules equipped</div>
            )}
          </div>
        </details>
      </div>

      {/* Base raw stats */}
      {/* <div className="px-4 py-3 border-b border-border">
        <div className="text-[9px] uppercase tracking-[1px] text-[var(--text-dim)] mb-2">
          <span
            className="game-tooltip"
            data-tip="Add raw stats from talents, planetarium, account levels, etc. Check your in-game character stats panel for values."
          >
            Base Raw Stats
          </span>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <NumberInput label="Crit"    value={base.crit}  onChange={v => setBase({crit:v})} />
          <NumberInput label="Haste"   value={base.haste} onChange={v => setBase({haste:v})} />
          <NumberInput label="Luck"    value={base.luck}  onChange={v => setBase({luck:v})} />
          <NumberInput label="Mast"    value={base.mast}  onChange={v => setBase({mast:v})} />
          <NumberInput label="Vers"    value={base.vers}  onChange={v => setBase({vers:v})} />
          <NumberInput label="Agility*" value={base.agi}  onChange={v => setBase({agi:v})} tip="Your character's base Agility (from class/level). Converts to raw Haste at 0.45 ratio. Check in-game character panel." />
        </div>
      </div> */}

      {/* External buffs */}
      {/* <div className="px-4 py-3">
        <div className="text-[9px] uppercase tracking-[1px] text-[var(--text-dim)] mb-2">
          <span
            className="game-tooltip"
            data-tip="Add direct % bonuses from party members, Psychoscope (Polarity/Stasis), etc."
          >
            External Buffs %
          </span>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <NumberInput label="Crit %"    value={ext.crit}  onChange={v => setExt({crit:v})}  step={0.1} />
          <NumberInput label="Luck %"    value={ext.luck}  onChange={v => setExt({luck:v})}  step={0.1} />
          <NumberInput label="Haste %"   value={ext.haste} onChange={v => setExt({haste:v})} step={0.1} />
          <NumberInput label="Mastery %" value={ext.mast}  onChange={v => setExt({mast:v})}  step={0.1} />
          <NumberInput label="Vers %"    value={ext.vers}  onChange={v => setExt({vers:v})}  step={0.1} />
          <NumberInput label="ASPD %"    value={ext.aspd}  onChange={v => setExt({aspd:v})}  step={0.1} />
          <NumberInput label="CSPD %"    value={ext.cspd}  onChange={v => setExt({cspd:v})}  step={0.1} />
          <NumberInput label="Illusion" value={ext.illu}  onChange={v => setExt({illu:v})}  tip="Sum of Illusion Strength from all gear pieces." />
        </div>
      </div> */}
    </aside>
  )
}
