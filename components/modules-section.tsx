"use client"
import { useState } from "react"
import { useApp } from "@/lib/app-context"
import { MODULE_DB, AFFIX_DB, MODULE_THRESHOLDS } from "@/lib/game-data"

const RARITY_COLORS = { Gold: "#e5c229", Purple: "#b400ff", Blue: "#49A8FF" }
const RARITY_SLOTS  = { Gold: 3, Purple: 2, Blue: 1 }

/** Points → module level (1-6), or 0 if below lv1 threshold */
function ptsToLevel(pts: number): number {
  for (let i = MODULE_THRESHOLDS.length - 1; i >= 0; i--) {
    if (pts >= MODULE_THRESHOLDS[i]) return i + 1
  }
  return 0
}

/** Next level threshold, or null if already max */
function nextThreshold(pts: number): number | null {
  for (const t of MODULE_THRESHOLDS) {
    if (pts < t) return t
  }
  return null
}

function ModuleReference({ accentColor }: { accentColor: string }) {
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    Extreme: true,
    Focus: false,
    Speed: false,
    Standard: false,
    Defense: false,
    Healer: false,
  })

  const toggleCategory = (cat: string) => {
    setExpandedCategories(prev => ({ ...prev, [cat]: !prev[cat] }))
  }

  // Group modules by category
  const modulesByCategory = MODULE_DB.reduce((acc, mod) => {
    if (!acc[mod.cat]) acc[mod.cat] = []
    acc[mod.cat].push(mod)
    return acc
  }, {} as Record<string, typeof MODULE_DB>)

  const categoryOrder = ["Extreme", "Focus", "Speed", "Standard", "Defense", "Healer"]

  return (
    <div className="border border-border bg-card">
      <div className="px-4 py-3 border-b border-border">
        <div className="text-xs uppercase tracking-[1.5px] font-bold mb-1" style={{ color: accentColor }}>
          Module Reference
        </div>
        <div className="text-xs text-[var(--text-dim)]">
          Level Thresholds: Lv1=1pt · Lv2=4pt · Lv3=8pt · Lv4=12pt · Lv5=16pt · Lv6=20pt
        </div>
      </div>

      <div className="divide-y divide-[#0d0d0d]">
        {categoryOrder.map(cat => {
          const modules = modulesByCategory[cat]
          if (!modules) return null
          const isExpanded = expandedCategories[cat]

          return (
            <div key={cat}>
              <button
                onClick={() => toggleCategory(cat)}
                className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-[1px]" style={{ color: accentColor }}>
                    {cat}
                  </span>
                  <span className="text-xs text-[var(--text-dim)]">
                    ({modules.length} module{modules.length !== 1 ? 's' : ''})
                  </span>
                </div>
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                  className="transition-transform"
                  style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
                >
                  <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 space-y-3">
                  {modules.map(mod => (
                    <ModuleCard key={mod.name} module={mod} accentColor={accentColor} />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ModuleCard({ module, accentColor }: { module: typeof MODULE_DB[0]; accentColor: string }) {
  return (
    <div className="border border-[#1a1a1a] bg-[#050505] rounded-sm">
      <div className="px-3 py-2 border-b border-[#1a1a1a]">
        <span className="text-sm font-bold text-white">{module.name}</span>
      </div>
      <div className="p-3">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {module.s.map((stats, idx) => {
            const level = idx + 1
            const pts = MODULE_THRESHOLDS[idx] ?? 0
            const isMaxLevel = level === 6
            const isMidLevel = level >= 4

            return (
              <div
                key={idx}
                className="border border-[#1a1a1a] bg-[#0a0a0a] px-2.5 py-2 rounded-sm"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className="text-xs font-bold uppercase tracking-[0.5px]"
                    style={{ color: isMaxLevel ? accentColor : isMidLevel ? 'var(--text-mid)' : 'var(--text-dim)' }}
                  >
                    Level {level}
                  </span>
                  <span className="text-xs text-[var(--text-dim)]">
                    {pts}pt{pts !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="space-y-0.5">
                  {Object.entries(stats).map(([stat, value]) => (
                    <div key={stat} className="flex justify-between items-baseline text-xs">
                      <span className="text-[var(--text-mid)]">{stat}</span>
                      <span
                        className="font-semibold ml-2"
                        style={{ color: isMaxLevel ? accentColor : 'var(--text-mid)' }}
                      >
                        {value > 0 ? '+' : ''}{value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export function ModulesSection() {
  const { modules, updateModule, accentColor } = useApp()

  // Aggregate total pts per affix across all slots
  const totalPts: Record<string, number> = {}
  modules.forEach(mod => {
    ;[{k:mod.a1,lv:mod.a1lv},{k:mod.a2,lv:mod.a2lv},{k:mod.a3,lv:mod.a3lv}]
      .filter(a => a.k)
      .forEach(({k,lv}) => { totalPts[k] = (totalPts[k] ?? 0) + lv })
  })

  return (
    <div>
      <div className="mb-6">
        <div className="text-2xl font-bold tracking-tight text-white mb-1">Power Core Modules</div>
        <div className="text-xs text-[var(--text-dim)] max-w-xl leading-5">
          Configure up to 4 module slots. Gold allows 3 affixes (max 9 pts each), Purple allows 2, Blue allows 1.
          Points from the same affix type stack — lv1=1pt, lv2=4pt, lv3=8pt, lv4=12pt, lv5=16pt, lv6=20pt threshold.
          Overcapping past 20 gives no extra bonus.
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
        {modules.map((mod, i) => {
          const rarity = mod.rarity
          const rarityColor = RARITY_COLORS[rarity]
          const maxAffixes = RARITY_SLOTS[rarity]

          return (
            <div key={i} className="border border-border bg-card">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
                <span className="text-xs font-bold text-white uppercase tracking-[0.5px]">
                  Module Slot {i + 1}
                </span>
                <select
                  value={rarity}
                  onChange={e => updateModule(i, { rarity: e.target.value as typeof mod.rarity })}
                  className="text-xs px-2 py-0.5 font-bold border outline-none bg-card"
                  style={{ color: rarityColor, borderColor: rarityColor }}
                >
                  <option value="Gold">Gold (3 Affixes)</option>
                  <option value="Purple">Purple (2 Affixes)</option>
                  <option value="Blue">Blue (1 Affix)</option>
                </select>
              </div>

              <div className="px-4 py-3 space-y-2">
                <div className="text-xs uppercase tracking-[1px] text-[var(--text-dim)] mb-1 flex justify-between">
                  <span>Sub-Affixes</span>
                  <span className="text-[#2a2a2a]">type · link pts (1–9)</span>
                </div>
                {([
                  { keyProp: "a1" as const, lvProp: "a1lv" as const, idx: 1 },
                  { keyProp: "a2" as const, lvProp: "a2lv" as const, idx: 2 },
                  { keyProp: "a3" as const, lvProp: "a3lv" as const, idx: 3 },
                ] as const).map(({ keyProp, lvProp, idx }) => {
                  if (idx > maxAffixes) return null
                  const affixName = mod[keyProp]
                  const pts = mod[lvProp]
                  const slotTotal = affixName ? (totalPts[affixName] ?? 0) : 0
                  const lvl = ptsToLevel(slotTotal)
                  const next = nextThreshold(slotTotal)

                  return (
                    <div key={idx} className="flex gap-2 items-center">
                      <select
                        value={affixName}
                        onChange={e => updateModule(i, { [keyProp]: e.target.value })}
                        className="flex-1 text-xs px-1.5 py-1 border border-border bg-background text-[#ccc] focus:border-[#444] outline-none min-w-0"
                      >
                        <option value="">— empty —</option>
                        {AFFIX_DB.map(a => <option key={a} value={a}>{a}</option>)}
                      </select>
                      <div className="flex items-center gap-1 shrink-0">
                        <input
                          type="number"
                          min={1} max={10}
                          value={pts}
                          onChange={e => updateModule(i, { [lvProp]: Math.min(10, Math.max(1, parseInt(e.target.value) || 1)) })}
                          className="w-9 text-center text-xs px-1 py-1 border border-border bg-background text-white focus:border-[#444] outline-none"
                          title="Link points contributed from this slot (1–10)"
                        />
                        <span className="text-xs text-[var(--text-dim)] w-5">pts</span>
                      </div>
                      {affixName && (
                        <div
                          className="text-xs font-bold shrink-0 w-8 text-right"
                          style={{ color: lvl >= 6 ? accentColor : lvl >= 3 ? "var(--text-mid)" : "var(--text-dim)" }}
                          title={next ? `${slotTotal}/${next} pts for lv${lvl + 1}` : "Max level"}
                        >
                          {lvl > 0 ? `Lv${lvl}` : "—"}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Aggregated summary */}
      {Object.keys(totalPts).length > 0 && (
        <div className="border border-border bg-[#050505] p-4 mb-6">
          <div className="text-xs uppercase tracking-[1.5px] font-bold mb-3" style={{ color: accentColor }}>
            Active Affix Summary
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(totalPts).map(([name, pts]) => {
              const lvl = ptsToLevel(pts)
              const next = nextThreshold(pts)
              const overcap = pts > 20
              return (
                <div key={name} className="border border-border px-3 py-1.5 text-xs">
                  <span className="text-muted-foreground">{name}</span>
                  <span className="mx-2 text-[var(--text-dim)]">·</span>
                  <span
                    className="font-bold"
                    style={{ color: lvl >= 6 ? accentColor : "var(--text-mid)" }}
                  >
                    Lv{lvl > 0 ? lvl : 0}
                  </span>
                  <span className="ml-1.5 text-[var(--text-dim)]">
                    {pts}pts{overcap ? " ⚠" : next ? ` / ${next}` : ""}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Module reference */}
      <ModuleReference accentColor={accentColor} />
    </div>
  )
}
