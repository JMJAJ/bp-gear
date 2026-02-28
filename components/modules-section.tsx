"use client"
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
        <div className="text-[11px] text-[#555] max-w-xl leading-5">
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
            <div key={i} className="border border-[#222] bg-[#0a0a0a]">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#1a1a1a]">
                <span className="text-[11px] font-bold text-white uppercase tracking-[0.5px]">
                  Module Slot {i + 1}
                </span>
                <select
                  value={rarity}
                  onChange={e => updateModule(i, { rarity: e.target.value as typeof mod.rarity })}
                  className="text-[10px] px-2 py-0.5 font-bold border outline-none bg-[#0a0a0a]"
                  style={{ color: rarityColor, borderColor: rarityColor }}
                >
                  <option value="Gold">Gold (3 Affixes)</option>
                  <option value="Purple">Purple (2 Affixes)</option>
                  <option value="Blue">Blue (1 Affix)</option>
                </select>
              </div>

              <div className="px-4 py-3 space-y-2">
                <div className="text-[9px] uppercase tracking-[1px] text-[#444] mb-1 flex justify-between">
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
                        className="flex-1 text-[10px] px-1.5 py-1 border border-[#1a1a1a] bg-[#000] text-[#ccc] focus:border-[#444] outline-none min-w-0"
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
                          className="w-9 text-center text-[11px] px-1 py-1 border border-[#1a1a1a] bg-[#000] text-white focus:border-[#444] outline-none"
                          title="Link points contributed from this slot (1–10)"
                        />
                        <span className="text-[9px] text-[#333] w-5">pts</span>
                      </div>
                      {affixName && (
                        <div
                          className="text-[9px] font-bold shrink-0 w-8 text-right"
                          style={{ color: lvl >= 6 ? accentColor : lvl >= 3 ? "#888" : "#444" }}
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
        <div className="border border-[#1a1a1a] bg-[#050505] p-4 mb-6">
          <div className="text-[9px] uppercase tracking-[1.5px] font-bold mb-3" style={{ color: accentColor }}>
            Active Affix Summary
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(totalPts).map(([name, pts]) => {
              const lvl = ptsToLevel(pts)
              const next = nextThreshold(pts)
              const overcap = pts > 20
              return (
                <div key={name} className="border border-[#1a1a1a] px-3 py-1.5 text-[10px]">
                  <span className="text-[#666]">{name}</span>
                  <span className="mx-2 text-[#333]">·</span>
                  <span
                    className="font-bold"
                    style={{ color: lvl >= 6 ? accentColor : "#888" }}
                  >
                    Lv{lvl > 0 ? lvl : 0}
                  </span>
                  <span className="ml-1.5 text-[#444]">
                    {pts}pts{overcap ? " ⚠" : next ? ` / ${next}` : ""}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Module reference table */}
      <div className="border border-[#222] bg-[#0a0a0a] p-4">
        <div className="text-[9px] uppercase tracking-[1.5px] font-bold mb-3" style={{ color: accentColor }}>
          Module Reference · Lv Thresholds: 1=1pt · 2=4pt · 3=8pt · 4=12pt · 5=16pt · 6=20pt
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[10px]">
            <thead>
              <tr className="border-b border-[#222]">
                {["Module","Cat","Lv.1 (1pt)","Lv.3 (8pt)","Lv.6 (20pt)"].map(h => (
                  <th key={h} className="text-left text-[9px] uppercase tracking-[0.5px] text-[#444] font-semibold px-2 py-2 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MODULE_DB.map(m => (
                <tr key={m.name} className="border-b border-[#0d0d0d] hover:bg-white/[0.01]">
                  <td className="px-2 py-1.5 text-white font-medium whitespace-nowrap">{m.name}</td>
                  <td className="px-2 py-1.5 text-[#555] whitespace-nowrap">{m.cat}</td>
                  <td className="px-2 py-1.5 text-[#555] text-[9px]">
                    {Object.entries(m.s[0]).map(([k,v]) => `${k}: ${v}`).join(", ")}
                  </td>
                  <td className="px-2 py-1.5 text-[#666] text-[9px]">
                    {Object.entries(m.s[2]).map(([k,v]) => `${k}: ${v}`).join(", ")}
                  </td>
                  <td className="px-2 py-1.5 text-[9px]" style={{ color: accentColor }}>
                    {Object.entries(m.s[5]).map(([k,v]) => `${k}: ${v}`).join(", ")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
