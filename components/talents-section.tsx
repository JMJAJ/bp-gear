"use client"
import { useState, useEffect, useCallback, useMemo } from "react"
import { useApp, getStatPercentCombat, getClassForSpec } from "@/lib/app-context"
import type { FetchedTalent } from "@/app/api/talents/route"
import { buildTalentTreeFromTalents, type GuideTalentTreeData } from "@/lib/talent-tree-parser"
import { TalentTree } from "@/components/talent-tree"
import { MaxrollTalentTree } from "./maxroll-talent-tree"

// ── ASPD keyword detection ─────────────────────────────────────────────────
function isAspdTalent(desc: string): boolean {
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
  const { accentColor, selectedTalents, setSelectedTalents, talentAspd, setTalentAspd, stats, spec } =
    useApp()

  const className = getClassForSpec(spec) ?? ""
  const maxrollLink = CLASS_MAXROLL_LINKS[className] ?? "https://maxroll.gg/blue-protocol"

  const [talents, setTalents] = useState<FetchedTalent[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fetchedAt, setFetchedAt] = useState<number | null>(null)
  const [moonstrikeGuideData, setMoonstrikeGuideData] = useState<GuideTalentTreeData | null>(null)

  const fetchTalents = useCallback(async () => {
    if (!className) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/talents?class=${encodeURIComponent(className)}`)
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? `HTTP ${res.status}`)
      }
      const data = await res.json()
      setTalents(data.talents ?? [])
      setFetchedAt(data.fetchedAt ?? null)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [className])

  // Fetch whenever the class changes
  useEffect(() => {
    setTalents([])
    fetchTalents()
  }, [fetchTalents])

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
        const response = await fetch(plannerJsonPath)
        if (!response.ok) {
          setMoonstrikeGuideData(null)
          return
        }

        const parsed = await response.json() as GuideTalentTreeData
        if (!cancelled) {
          setMoonstrikeGuideData(parsed)
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
            ? `${className} talents — sourced live from Maxroll.`
            : "Select a class spec to see its talents."}
        </div>
      </div>

      {/* ASPD stat integration */}
      <div className="border border-border bg-card mb-4 p-4">
        <div
          className="text-xs font-bold uppercase tracking-[1.5px] mb-1"
          style={{ color: accentColor }}
        >
          Attack Speed (ASPD) from Talents
        </div>
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

      {/* No class selected */}
      {!className && (
        <div className="text-xs text-[var(--text-dim)] py-8 text-center border border-border">
          Select a spec from the Classes section to load talents.
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="text-xs text-[var(--text-dim)] py-8 text-center border border-border">
          <div
            className="inline-block w-4 h-4 border-2 border-t-transparent rounded-full animate-spin mr-2 align-middle"
            style={{ borderColor: accentColor, borderTopColor: "transparent" }}
          />
          Fetching {className} talents from Maxroll…
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="border border-red-900 bg-[#0f0505] p-4 mb-4">
          <div className="text-xs text-red-400 mb-2">Failed to fetch talent data: {error}</div>
          <div className="flex gap-2">
            <button
              onClick={fetchTalents}
              className="text-xs uppercase tracking-[1px] px-2 py-1 border border-red-900 text-red-400 hover:text-white transition-colors"
            >
              Retry
            </button>
            <a
              href={maxrollLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs uppercase tracking-[1px] px-2 py-1 border transition-colors"
              style={{ color: accentColor, borderColor: accentColor + "40" }}
            >
              View on Maxroll ↗
            </a>
          </div>
        </div>
      )}

      {/* Toolbar — only when we have data */}
      {className && !loading && talents.length > 0 && (
        <>
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs text-[var(--text-dim)]">
              {selectedCount} / {total} selected
              {fetchedAt && (
                <span className="ml-1 text-[var(--text-dim)]">
                  (last fetch: {new Date(fetchedAt).toLocaleTimeString()})
                </span>
              )}
            </div>
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

          {isMoonstrike ? (
            <MaxrollTalentTree
              className={className}
              spec={spec}
              talents={talents}
              selected={selectedTalents}
              onToggle={toggleTalentById}
              guideData={moonstrikeGuideData}
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
