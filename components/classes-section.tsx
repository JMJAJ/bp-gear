"use client"
import { useState } from "react"
import { useApp } from "@/lib/app-context"
import { GAME_DATA } from "@/lib/game-data"

const ROLE_COLORS: Record<string, string> = {
  DPS: "#e84545",
  Tank: "#49A8FF",
  Support: "#4ade80",
}

const ELEMENT_COLORS: Record<string, string> = {
  Thunder: "#e5c229",
  Wind: "#4ade80",
  Ice: "#49A8FF",
  Rock: "#e88045",
  Forest: "#4ade80",
}

export function ClassesSection() {
  const { selectedClass, setSelectedClass, setSection, switchSpec, spec, accentColor } = useApp()
  const [pendingSpec, setPendingSpec] = useState<string>("")

  // Find which class owns the currently active spec
  const activeClass = Object.entries(GAME_DATA.CLASSES).find(([, cls]) => cls.specs.includes(spec))?.[0] ?? null

  function applyClass(name: string, specToApply: string) {
    const cls = GAME_DATA.CLASSES[name]
    if (!cls) return
    switchSpec(specToApply, cls.main as "Strength" | "Agility" | "Intellect")
    setSection("planner")
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="text-2xl font-bold tracking-tight text-white mb-1">
          Choose Your Class
        </div>
        <div className="text-xs text-[var(--text-dim)] max-w-xl leading-5">
          Select your subclass to auto-configure recommended substats, build type, and stat restrictions.
          Each card shows the optimal substat priority from the spreadsheet data.
        </div>
      </div>

      {/* Class grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6">
        {Object.entries(GAME_DATA.CLASSES).map(([name, cls]) => {
          const isSelected = selectedClass === name
          const specInfo = cls.specs.map(s => {
            const ss = GAME_DATA.SPECS[s]
            return `${s}: ${ss[0]}/${ss[1]}`
          }).join(" · ")

          return (
            <button
              key={name}
              onClick={() => {
                const next = isSelected ? null : name
                setSelectedClass(next)
                if (next) setPendingSpec(GAME_DATA.CLASSES[next]?.specs[0] ?? "")
              }}
              className="text-left p-3 border transition-all relative"
              style={{
                borderColor: isSelected ? accentColor : "var(--border)",
                background: isSelected ? "var(--muted)" : "#0a0a0a",
              }}
            >
              {activeClass === name && (
                <span
                  className="absolute top-2 right-2 text-xs font-black uppercase tracking-[1px] px-1 py-0.5"
                  style={{ background: accentColor + "33", color: accentColor, border: `1px solid ${accentColor}44` }}
                >
                  Active
                </span>
              )}
              <div className="text-xs font-bold text-white mb-1">{name}</div>
              <div className="text-xs uppercase tracking-[1px] mb-1.5">
                <span style={{ color: ROLE_COLORS[cls.role] ?? "var(--text-mid)" }}>{cls.role}</span>
                {cls.element && (
                  <span className="ml-1.5" style={{ color: ELEMENT_COLORS[cls.element] ?? "var(--text-mid)" }}>
                    · {cls.element}
                  </span>
                )}
              </div>
              <div className="text-xs text-[var(--text-dim)]">{specInfo}</div>
            </button>
          )
        })}
      </div>

      {/* Detail panel */}
      {selectedClass && (() => {
        const cls = GAME_DATA.CLASSES[selectedClass]
        if (!cls) return null
        const ratios = GAME_DATA.HASTE_RATIOS[selectedClass] ?? {aspd:0.6,cspd:1.0}
        return (
          <div className="border border-border bg-card">
            {/* Title bar */}
            <div
              className="px-4 py-3 border-b flex items-center justify-between"
              style={{ borderColor: accentColor, borderBottomWidth: 1 }}
            >
              <span className="font-bold text-sm uppercase tracking-wider" style={{ color: accentColor }}>
                {selectedClass}
              </span>
              <span className="text-xs uppercase tracking-[1px] text-[var(--text-dim)]">
                {cls.parent} · {cls.role}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-0 divide-x divide-[#222]">
              {/* Main stat */}
              <div className="p-4">
                <div className="text-xs uppercase tracking-[1px] text-[var(--text-dim)] mb-2">Main Stat</div>
                <div className="text-sm font-bold text-white mb-1">{cls.main}</div>
                <div className="text-xs text-muted-foreground">
                  {cls.atk === "ATK"
                    ? "Physical damage — scales with ATK."
                    : "Magical damage — scales with MATK."}
                </div>
              </div>

              {/* Haste ratios */}
              <div className="p-4">
                <div className="text-xs uppercase tracking-[1px] text-[var(--text-dim)] mb-2">Haste Ratios</div>
                <div className="text-sm font-bold text-white mb-1">{cls.atk}</div>
                <div className="text-xs text-muted-foreground">
                  ASPD ×{ratios.aspd} · CSPD ×{ratios.cspd}
                  {cls.main === "Agility" && " · AGI→Haste ×0.45"}
                </div>
              </div>

              {/* Priority substats */}
              <div className="p-4">
                <div className="text-xs uppercase tracking-[1px] text-[var(--text-dim)] mb-2">Priority Substats</div>
                {cls.specs.map(s => {
                  const ss = GAME_DATA.SPECS[s]
                  const rb = GAME_DATA.RAID_BONUS[s]
                  return (
                    <div key={s} className="mb-1.5">
                      <span className="text-xs font-bold" style={{ color: accentColor }}>{s}</span>
                      <span className="text-xs text-[var(--text-mid)] ml-1.5">{ss[0]} / {ss[1]}</span>
                      {rb && (
                        <div className="text-xs text-[var(--text-dim)]">Raid: {rb.l} +{rb.v}%</div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Weapon buffs */}
              <div className="p-4">
                <div className="text-xs uppercase tracking-[1px] text-[var(--text-dim)] mb-2">Weapon Buffs</div>
                {cls.specs.map(s => {
                  const wb = GAME_DATA.WEAPON_BUFFS[s]
                  if (!wb) return null
                  return (
                    <div key={s} className="mb-1.5 text-xs text-muted-foreground">
                      <span className="text-[var(--text-mid)] font-semibold">{s}:</span>{" "}
                      {[wb.b1 && `${wb.b1} +${wb.b1v}%`, wb.b2 && `${wb.b2} +${wb.b2v}%`, wb.other]
                        .filter(Boolean).join(" · ")}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Spec selector */}
            <div className="px-4 py-3 border-t border-border">
              <div className="text-xs uppercase tracking-[1px] text-[var(--text-dim)] mb-2">Choose Spec</div>
              <div className="flex flex-wrap gap-2">
                {cls.specs.map(s => {
                  const ss = GAME_DATA.SPECS[s]
                  const rb = GAME_DATA.RAID_BONUS[s]
                  const active = (pendingSpec || cls.specs[0]) === s
                  return (
                    <button
                      key={s}
                      onClick={() => setPendingSpec(s)}
                      className="px-3 py-1.5 text-xs font-bold uppercase tracking-[1px] border transition-all"
                      style={{
                        borderColor: active ? accentColor : "var(--text-dim)",
                        background: active ? accentColor + "22" : "transparent",
                        color: active ? accentColor : "var(--text-dim)",
                      }}
                    >
                      {s}
                      {ss && (
                        <span className="ml-1.5 font-normal normal-case tracking-normal text-xs opacity-70">
                          {ss[0]}/{ss[1]}
                        </span>
                      )}
                      {rb && (
                        <span className="ml-1 font-normal normal-case tracking-normal text-xs opacity-50">
                          · {rb.l.replace(" (%)","")} +{rb.v}%
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* CTA */}
            <div className="px-4 py-3 border-t border-border flex items-center gap-3">
              <button
                onClick={() => applyClass(selectedClass, pendingSpec || cls.specs[0])}
                className="px-5 py-2 text-xs font-bold uppercase tracking-[1.5px] transition-all"
                style={{
                  background: accentColor,
                  color: "#000",
                }}
              >
                Apply {pendingSpec || cls.specs[0]} & Go to Planner →
              </button>
              <span className="text-xs text-[var(--text-dim)]">
                {cls.main} · {cls.role}
              </span>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
