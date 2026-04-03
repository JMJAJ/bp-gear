"use client"
import { useState, useEffect, useMemo } from "react"
import { useApp, getStatPercentCombat, getClassForSpec } from "@/lib/app-context"
import { TALENT_DATA, GENERAL_TALENTS, type TalentEntry } from "@/lib/talent-data"
import { buildTalentTreeFromTalents, type GuideTalentTreeData } from "@/lib/talent-tree-parser"
import { TalentTree } from "@/components/talent-tree"
import { MaxrollTalentTree } from "./maxroll-talent-tree"

// ── ASPD keyword detection ─────────────────────────────────────────────────
function isAspdTalent(desc: string | undefined): boolean {
  if (!desc) return false
  const d = desc.toLowerCase()
  return d.includes("attack speed") || d.includes("attack spd")
}

function getAspdNote(name: string, className: string): string {
  if (className === "Stormblade" && name.toLowerCase() === "swift") {
    return "Changes Haste→ASPD ratio to 1:1 — auto-calculated."
  }
  return "Affects Attack Speed — enter the effective ASPD gain in the field above."
}

// ── Maxroll link ───────────────────────────────────────────────────────────
const CLASS_MAXROLL_LINKS: Record<string, string> = {
  "Stormblade":     "https://maxroll.gg/blue-protocol/database/talents-stormblade",
  "Marksman":       "https://maxroll.gg/blue-protocol/database/talents-marksman",
  "Wind Knight":    "https://maxroll.gg/blue-protocol/database/talents-wind-knight",
  "Verdant Oracle": "https://maxroll.gg/blue-protocol/database/talents-verdant-oracle",
  "Shield Knight":  "https://maxroll.gg/blue-protocol/database/talents-shield-knight",
  "Heavy Guardian": "https://maxroll.gg/blue-protocol/database/talents-heavy-guardian",
  "Frostmage":      "https://maxroll.gg/blue-protocol/database/talents-frost-mage",
  "Beat Performer": "https://maxroll.gg/blue-protocol/database/talents-beat-performer",
}

const PLANNER_JSON_PATHS: Record<string, string> = {
  "Stormblade|Moonstrike": "/planner-data/stormblade-moonstrike.json",
}

export function TalentsSection() {
  const { accentColor, selectedTalents, setSelectedTalents, talentNodeSelections, setTalentNodeSelections, talentAspd, setTalentAspd, stats, spec } =
    useApp()

  const className = getClassForSpec(spec) ?? ""
  const maxrollLink = CLASS_MAXROLL_LINKS[className] ?? "https://maxroll.gg/blue-protocol"

  const [moonstrikeGuideData, setMoonstrikeGuideData] = useState<GuideTalentTreeData | null>(null)
  const [editMode, setEditMode] = useState(false)

  // Get talents directly from static data (class talents + general talents)
  const talents = useMemo<TalentEntry[]>(() => {
    if (!className) return []
    const classTalents = TALENT_DATA[className] ?? []
    return [...classTalents, ...GENERAL_TALENTS]
  }, [className])

  const total = talents.length
  const selectedCount = talents.filter(t => selectedTalents.includes(t.id)).length

  // Swift auto-contribution (Stormblade only)
  const swiftActive = className === "Stormblade" && selectedTalents.includes("swift")
  const swiftAspdContrib =
    swiftActive && stats
      ? (getStatPercentCombat("Haste", stats.total.Haste) + stats.ext.haste) * 0.4
      : 0

  const aspdTalentsSelected = talents.filter(
    t => isAspdTalent(t.desc) && selectedTalents.includes(t.id),
  )

  const treeData = useMemo(
    () => buildTalentTreeFromTalents({ className, spec, talents }),
    [className, spec, talents],
  )

  const isMoonstrike = className === "Stormblade" && spec === "Moonstrike"
  const plannerJsonPath = PLANNER_JSON_PATHS[`${className}|${spec}`]

  useEffect(() => {
    let cancelled = false

    const loadPlannerData = async () => {
      if (!plannerJsonPath) {
        setMoonstrikeGuideData(null)
        return
      }

      try {
        const cacheBustedPath = `${plannerJsonPath}${plannerJsonPath.includes("?") ? "&" : "?"}t=${Date.now()}`
        const response = await fetch(cacheBustedPath, { cache: "no-store" })
        if (!response.ok) {
          setMoonstrikeGuideData(null)
          return
        }

        const parsed = await response.json()
        // Validate that the parsed data has the expected structure
        if (
          parsed &&
          typeof parsed === "object" &&
          parsed.kind === "guide" &&
          Array.isArray(parsed.tabs) &&
          parsed.tabs.length > 0
        ) {
          if (!cancelled) {
            setMoonstrikeGuideData(parsed as GuideTalentTreeData)
          }
        } else {
          console.warn("Invalid planner data format:", parsed)
          if (!cancelled) {
            setMoonstrikeGuideData(null)
          }
        }
      } catch {
        if (!cancelled) {
          setMoonstrikeGuideData(null)
        }
      }
    }

    loadPlannerData()

    return () => {
      cancelled = true
    }
  }, [plannerJsonPath])

  function toggleTalentById(id: string, next: boolean) {
    setSelectedTalents(
      next
        ? (selectedTalents.includes(id) ? selectedTalents : [...selectedTalents, id])
        : selectedTalents.filter(t => t !== id),
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="text-2xl font-bold tracking-tight text-white mb-1">Talent Tree</div>
        <div className="text-xs text-[var(--text-dim)] max-w-xl leading-5">
          {className
            ? `${className} talents — loaded from local data.`
            : "Select a class spec to see its talents."}
        </div>
      </div>

      {/* ASPD stat integration - collapsible */}
      <details className="border border-border bg-card mb-4 group">
        <summary className="p-4 cursor-pointer hover:bg-[rgba(255,255,255,0.02)] transition-colors flex items-center gap-2 list-none">
          <svg className="w-4 h-4 transition-transform group-open:rotate-90" viewBox="0 0 24 24" fill="currentColor" style={{ color: accentColor }}>
            <path d="M8 5v14l11-7z"/>
          </svg>
          <span
            className="text-xs font-bold uppercase tracking-[1.5px]"
            style={{ color: accentColor }}
          >
            Attack Speed (ASPD) from Talents
          </span>
        </summary>
        <div className="px-4 pb-4">
          <div className="text-xs text-muted-foreground mb-3 leading-5">
            Some talents grant Attack Speed bonuses. This box lets you manually enter any extra ASPD% 
            from talent effects so it gets included in your total stat calculations. 
            If you don&apos;t have ASPD talents, leave this at 0.
          </div>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              {swiftActive && stats && (
                <div className="text-xs mb-1" style={{ color: accentColor }}>
                  Swift auto-contribution:{" "}
                  <span className="font-bold">+{swiftAspdContrib.toFixed(2)}%</span> ASPD (
                  {(getStatPercentCombat("Haste", stats.total.Haste) + stats.ext.haste).toFixed(1)}% Haste
                  × 1.0 ratio, base was ×0.6)
                </div>
              )}
              {aspdTalentsSelected.length > 0 && (
                <div className="text-xs text-[var(--text-mid)] mb-2 space-y-0.5">
                  {aspdTalentsSelected.map(t => (
                    <div key={t.id} className="flex items-center gap-1.5">
                      {t.icon && (
                        <img src={t.icon} width={12} height={12} alt="" />
                      )}
                      <span style={{ color: accentColor }}>{t.name}</span>
                      <span className="text-[var(--text-dim)]">
                        — {getAspdNote(t.name, className)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-[var(--text-dim)]">ASPD%</span>
              <input
                type="number"
                value={talentAspd}
                onChange={e => setTalentAspd(parseFloat(e.target.value) || 0)}
                className="w-20 bg-muted border border-[#333] text-white text-xs px-2 py-1 text-right"
                step={0.1}
              />
            </div>
          </div>
          {stats && (
            <div className="mt-2 text-xs text-[var(--text-dim)] space-y-0.5">
              {swiftActive && (
                <div>
                  Swift:{" "}
                  <span style={{ color: accentColor }}>+{swiftAspdContrib.toFixed(2)}%</span> ASPD
                  (auto)
                </div>
              )}
              {talentAspd > 0 && (
                <div>
                  Manual bonus:{" "}
                  <span style={{ color: accentColor }}>+{talentAspd.toFixed(1)}%</span> ASPD
                </div>
              )}
              <div>
                Total ASPD:{" "}
                <span className="text-white font-bold">{stats.aspd.toFixed(2)}%</span>
              </div>
            </div>
          )}
        </div>
      </details>

      {/* No class selected */}
      {!className && (
        <div className="text-xs text-[var(--text-dim)] py-8 text-center border border-border">
          Select a spec from the Classes section to load talents.
        </div>
      )}

      {/* Toolbar — only when we have data */}
      {className && talents.length > 0 && (
        <>
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs text-[var(--text-dim)]">
              {selectedCount} / {total} selected
            </div>
            <div className="flex items-center gap-2">
              {isMoonstrike && process.env.NODE_ENV === 'development' && (
                <button
                  onClick={() => setEditMode(!editMode)}
                  className="text-xs uppercase tracking-[1px] px-2.5 py-1 border transition-colors"
                  style={{ 
                    color: editMode ? '#22c55e' : accentColor, 
                    borderColor: editMode ? '#22c55e' : accentColor + '40',
                    backgroundColor: editMode ? 'rgba(34, 197, 94, 0.1)' : 'transparent'
                  }}
                >
                  {editMode ? 'Editing ON' : 'Edit'}
                </button>
              )}
              <a
                href={maxrollLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs uppercase tracking-[1px] px-2.5 py-1 border transition-colors"
                style={{ color: accentColor, borderColor: accentColor + "40" }}
              >
                Maxroll ↗
              </a>
            </div>
          </div>

          {isMoonstrike ? (
            <MaxrollTalentTree
              className={className}
              spec={spec}
              talents={talents}
              selected={selectedTalents}
              nodeSelections={talentNodeSelections}
              setNodeSelections={setTalentNodeSelections}
              onToggle={toggleTalentById}
              guideData={moonstrikeGuideData}
              editMode={editMode}
              onGuideDataSaved={setMoonstrikeGuideData}
            />
          ) : treeData ? (
            <TalentTree
              data={treeData}
              selected={selectedTalents}
              onToggle={toggleTalentById}
              accentColor={accentColor}
            />
          ) : (
            <div className="text-xs text-[var(--text-dim)] py-8 text-center border border-border">
              No talent tree layout available for this class/spec yet.
            </div>
          )}
        </>
      )}
    </div>
  )
}
