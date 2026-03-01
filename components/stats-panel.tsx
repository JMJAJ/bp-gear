"use client"
import { useApp, getStatPercentCombat } from "@/lib/app-context"
import { GAME_DATA, MODULE_THRESHOLDS, LEVEL_COLORS } from "@/lib/game-data"
import { Check, X, Settings } from "lucide-react"
import { MIND_PROJECTIONS } from "@/lib/psychoscope-data"

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
    <div className="relative h-[3px] bg-[#1a1a1a] mt-1 mb-2.5">
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
      <label className="block text-[9px] uppercase tracking-[0.8px] text-[#555] mb-0.5">
        {tip ? <span className="game-tooltip" data-tip={tip}>{label}</span> : label}
      </label>
      <input
        type="number"
        value={value || ""}
        onChange={e => onChange(parseFloat(e.target.value) || 0)}
        placeholder="0"
        step={step}
        className="w-full bg-[#0a0a0a] border border-[#1a1a1a] text-white px-2 py-1 text-[11px] focus:border-[#444] outline-none"
      />
    </div>
  )
}

export function StatsPanel() {
  const { stats, base, setBase, ext, setExt, accentColor, setSection, spec, psychoscopeConfig, setPsychoscopeConfig } = useApp()
  
  // Get active Deep-Slumber projection
  const activeProjection = MIND_PROJECTIONS.find(p => p.id === psychoscopeConfig?.projectionId)

  return (
    <aside className="flex flex-col border-l border-[#222] bg-[#000] h-full overflow-y-auto">
      {/* Header */}
      <div className="px-4 py-4 border-b border-[#222]">
        <div
          className="text-[10px] font-bold tracking-[2px] uppercase"
          style={{ color: accentColor }}
        >
          Stats Overview
        </div>
      </div>

      {/* Psychoscope toggle */}
      <div className="px-4 py-2 border-b border-[#1a1a1a] flex items-center justify-between">
        <span className="text-[9px] uppercase tracking-[1px] text-[#555]">Psychoscope</span>
        <button
          onClick={() => setPsychoscopeConfig({ ...psychoscopeConfig, enabled: !psychoscopeConfig.enabled })}
          className="flex items-center gap-1.5 px-2 py-0.5 rounded border transition-all text-[9px] font-bold uppercase tracking-[0.5px]"
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
      <div className="px-4 py-3 border-b border-[#1a1a1a]">
        {STATS.map(({ key, stat, extKey }) => {
          const raw = stats?.total[stat] ?? 0
          const extVal = stats?.ext[extKey as keyof typeof stats.ext] ?? 0
          // Include purple stat % bonuses (Crit%, Luck%, Mastery%, etc.)
          const purplePct = stats?.purpleStats?.[`${stat} (%)`] ?? 0
          const pct = getStatPercentCombat(stat, raw) + extVal + purplePct
          return (
            <div key={key}>
              <div className="flex justify-between items-center">
                <span className="text-[11px] text-[#888]">{stat}</span>
                <div className="text-right">
                  <span className="text-[11px] font-bold tabular-nums text-white">{pct.toFixed(2)}%</span>
                  <span className="block text-[9px] text-[#444]">{raw.toFixed(0)} raw</span>
                </div>
              </div>
              <StatBar pct={pct} accent={accentColor} />
            </div>
          )
        })}

        {/* ASPD / CSPD */}
        <div className="mt-1 pt-2 border-t border-[#111]">
          <div className="flex justify-between items-center">
            <span className="text-[11px] text-[#888]">Attack Speed</span>
            <span
              className="text-[11px] font-bold tabular-nums"
              style={{ color: (stats?.aspd ?? 0) >= 80 ? "#4ade80" : (stats?.aspd ?? 0) >= 50 ? accentColor : "#fff" }}
            >
              {(stats?.aspd ?? 0).toFixed(2)}%
            </span>
          </div>
          <div className="relative h-[3px] bg-[#1a1a1a] mt-1 mb-1.5">
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
            <div className="text-[9px] text-[#444] mb-2">
              {[25, 50, 80].filter(bp => (stats?.aspd ?? 0) >= bp).map(bp => (
                <span key={bp} className="mr-1.5 inline-flex items-center gap-0.5" style={{ color: "#4ade80" }}>{bp}% <Check className="w-3 h-3" /></span>
              ))}
              {[25, 50, 80].find(bp => (stats?.aspd ?? 0) < bp) && (
                <span className="text-[#444]">
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
            <span className="text-[11px] text-[#888]">Cast Speed</span>
            <span className="text-[11px] font-bold tabular-nums text-white">{(stats?.cspd ?? 0).toFixed(2)}%</span>
          </div>
          <div className="relative h-[3px] bg-[#1a1a1a] mt-1 mb-2">
            <div
              className="absolute left-0 top-0 h-full transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(0, ((stats?.cspd ?? 0) / 80) * 100))}%`, background: accentColor }}
            />
          </div>

          {/* Illusion Strength */}
          {(stats?.ext?.illu ?? 0) > 0 && (
            <div className="flex justify-between items-center mt-1">
              <span className="text-[11px] text-[#888]">Illusion Strength</span>
              <span className="text-[11px] font-bold tabular-nums" style={{ color: accentColor }}>
                {(stats?.ext?.illu ?? 0).toFixed(0)}
              </span>
            </div>
          )}
        </div>

        {/* Module % bonuses */}
        {stats?.moduleStats && Object.entries(stats.moduleStats).some(([k, v]) =>
          k.includes("(%)") && k !== "Attack Speed (%)" && k !== "Cast Speed (%)" && v > 0
        ) && (
            <div className="mt-2 pt-2 border-t border-[#111]">
              <div className="text-[9px] uppercase tracking-[1px] text-[#444] mb-1">Module Bonuses</div>
              {Object.entries(stats.moduleStats)
                .filter(([k, v]) => k.includes("(%)") && k !== "Attack Speed (%)" && k !== "Cast Speed (%)" && v > 0)
                .map(([k, v]) => (
                  <div key={k} className="flex justify-between text-[10px] py-0.5">
                    <span className="text-[#888]">{k.replace(" (%)", "")}</span>
                    <span style={{ color: accentColor }}>+{v.toFixed(1)}%</span>
                  </div>
                ))}
            </div>
          )}

        {/* Weapon effects */}
        {stats?.weaponEffects && stats.weaponEffects.length > 0 && (
          <div className="mt-2 pt-2 border-t border-[#111]">
            <div className="text-[9px] uppercase tracking-[1px] text-[#444] mb-1">Weapon Buffs</div>
            {stats.weaponEffects.map((e, i) => (
              <div key={i} className="text-[10px] text-[#888] py-0.5">{e}</div>
            ))}
          </div>
        )}

        {/* Raid bonus */}
        {stats?.appliedBonus && (
          <div className="mt-1 text-[10px]" style={{ color: accentColor }}>
            Raid {stats.appliedBonus.l.replace(" (%)", "")} +{stats.appliedBonus.v}%
          </div>
        )}

        {/* Extra bonuses */}
        {stats?.extraStats && Object.keys(stats.extraStats).length > 0 && (
          <div className="mt-2 pt-2 border-t border-[#111]">
            <div className="text-[9px] uppercase tracking-[1px] text-[#444] mb-1">Bonuses</div>
            {Object.entries(stats.extraStats).map(([s, v]) => v > 0 && (
              <div key={s} className="flex justify-between text-[10px] py-0.5">
                <span className="text-[#888]">{s}</span>
                <span className="text-[#aaa]">+{v}</span>
              </div>
            ))}
          </div>
        )}

        {/* Psychoscope Effects */}
        {activeProjection && stats?.psychoscopeEffects && stats.psychoscopeEffects.activeEffects.length > 0 && (
          <div className="mt-2 pt-2 border-t border-[#111]">
            <div className="flex items-center gap-2 mb-1.5 px-2 py-1 rounded bg-[#0d0d0d] border border-[#1a1a1a]">
              {activeProjection.nodes[0]?.icon && (
                <img
                  src={activeProjection.nodes[0].icon}
                  alt=""
                  className="w-5 h-5 rounded-sm"
                />
              )}

              <span className="text-[9px] uppercase tracking-[1px] text-[#666]">
                Psychoscope
              </span>
            
              <span className="text-[#333] text-[9px]">—</span>
            
              <span className="text-[10px] font-semibold text-white leading-none">
                {activeProjection.name}
              </span>
            </div>
            
            {/* Effects */}
            <div className="border-b border-[#1a1a1a]">
              {stats.psychoscopeEffects.activeEffects.map((effect, i) => (
                <div key={i} className="text-[9px] text-[#777] py-0.5 leading-3.5">
                  <span className="mr-1" style={{ color: accentColor }}>•</span>
                  {effect}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Purple stats */}
        {stats?.purpleStats && Object.keys(stats.purpleStats).length > 0 && (
          <div className="mt-2 pt-2 border-t border-[#111]">
            <div className="text-[9px] uppercase tracking-[1px] text-[#444] mb-1">Purple stats</div>
            {Object.entries(stats.purpleStats).map(([s, v]) => v > 0 && (
              <div key={s} className="flex justify-between text-[10px] py-0.5">
                <span className="text-[#888]">{s}</span>
                <span style={{ color: accentColor }}>+{v}{s.includes("(%)") ? "%" : ""}</span>
              </div>
            ))}
          </div>
        )}

        {/* Raid Set Bonuses */}
        {(stats?.raid2pcBonus || stats?.raid4pcBonus) && (
          <div className="mt-2 pt-2 border-t border-[#111]">
            <div className="text-[9px] uppercase tracking-[1px] text-[#444] mb-1">Raid Set Bonuses</div>
            {stats?.raid2pcBonus && (
              <div className="text-[10px] py-0.5" style={{ color: (stats.raidArmorCount ?? 0) >= 2 ? accentColor : "#333" }}>
                <span className="font-bold mr-1">{(stats.raidArmorCount ?? 0) >= 2 ? <Check className="w-3 h-3 inline" /> : <X className="w-3 h-3 inline" />}</span>
                {stats.raid2pcBonus.l}
              </div>
            )}
            {stats?.raid4pcBonus && (
              <div className="text-[10px] py-0.5 mt-0.5" style={{ color: (stats.raidArmorCount ?? 0) >= 4 ? accentColor : "#333" }}>
                <span className="font-bold mr-1">{(stats.raidArmorCount ?? 0) >= 4 ? <Check className="w-3 h-3 inline" /> : <X className="w-3 h-3 inline" />}</span>
                {stats.raid4pcBonus.l}
              </div>
            )}
            <div className="text-[9px] text-[#333] mt-1">
              {stats.raidArmorCount ?? 0}/6 raid armor
            </div>
          </div>
        )}
      </div>

      {/* Module summary */}
      <div className="px-4 py-3 border-b border-[#1a1a1a]">
        <div className="flex justify-between items-center mb-2">
          <div className="text-[9px] uppercase tracking-[1px] text-[#444]">Power Core</div>
          <button
            onClick={() => setSection("modules")}
            className="text-[9px] uppercase tracking-[0.5px] text-[#555] hover:text-[#aaa] transition-colors"
          >
            Config <Settings className="w-3 h-3 inline" />
          </button>
        </div>
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
                  <span className="text-[#ccc]">{name}</span>
                  <span className="text-[#444] ml-1 text-[9px]">· {pts}pts</span>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-[10px] text-[#333]">No modules equipped</div>
        )}
      </div>

      {/* Base raw stats */}
      {/* <div className="px-4 py-3 border-b border-[#1a1a1a]">
        <div className="text-[9px] uppercase tracking-[1px] text-[#444] mb-2">
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
        <div className="text-[9px] uppercase tracking-[1px] text-[#444] mb-2">
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
