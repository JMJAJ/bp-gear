"use client"
import { useState, useEffect, useCallback } from "react"
import { useApp, getStatPercentCombat, getClassForSpec } from "@/lib/app-context"
import type { FetchedTalent } from "@/app/api/talents/route"
import { ArrowUpRight } from "lucide-react"

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

export function TalentsSection() {
  const { accentColor, selectedTalents, setSelectedTalents, talentAspd, setTalentAspd, stats, spec } =
    useApp()

  const className = getClassForSpec(spec) ?? ""
  const maxrollLink = CLASS_MAXROLL_LINKS[className] ?? "https://maxroll.gg/blue-protocol"

  const [talents, setTalents] = useState<FetchedTalent[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fetchedAt, setFetchedAt] = useState<number | null>(null)
  const [search, setSearch] = useState("")

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

  const q = search.toLowerCase().trim()
  const displayList = q
    ? talents.filter(t => t.name.toLowerCase().includes(q) || t.desc.toLowerCase().includes(q))
    : talents

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

  function toggleTalent(id: string) {
    setSelectedTalents(
      selectedTalents.includes(id)
        ? selectedTalents.filter(t => t !== id)
        : [...selectedTalents, id],
    )
  }

  function selectAll() {
    setSelectedTalents(talents.map(t => t.id))
  }
  function clearAll() {
    setSelectedTalents([])
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="text-2xl font-bold tracking-tight text-white mb-1">Talent Tree</div>
        <div className="text-[11px] text-[#555] max-w-xl leading-5">
          {className
            ? `${className} talents — sourced live from Maxroll.`
            : "Select a class spec to see its talents."}
        </div>
      </div>

      {/* ASPD stat integration */}
      <div className="border border-[#222] bg-[#0a0a0a] mb-4 p-4">
        <div
          className="text-[10px] font-bold uppercase tracking-[1.5px] mb-3"
          style={{ color: accentColor }}
        >
          Talent ASPD Contribution (fed into stat calculations)
        </div>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="text-[10px] text-[#666] mb-1">
              Extra ASPD beyond what the{" "}
              <span className="text-[#49A8FF]">Swift</span> talent auto-computes (if applicable).
              Use for conditional bonuses like Lightning Flash during Stormflash.
            </div>
            {swiftActive && stats && (
              <div className="text-[10px] mb-1" style={{ color: accentColor }}>
                Swift auto-contribution:{" "}
                <span className="font-bold">+{swiftAspdContrib.toFixed(2)}%</span> ASPD (
                {(getStatPercentCombat("Haste", stats.total.Haste) + stats.ext.haste).toFixed(1)}% Haste
                × 1.0 ratio, base was ×0.6)
              </div>
            )}
            {aspdTalentsSelected.length > 0 && (
              <div className="text-[10px] text-[#888] mb-2 space-y-0.5">
                {aspdTalentsSelected.map(t => (
                  <div key={t.id} className="flex items-center gap-1.5">
                    {t.icon && (
                      <img src={t.icon} width={12} height={12} alt="" />
                    )}
                    <span style={{ color: accentColor }}>{t.name}</span>
                    <span className="text-[#555]">
                      — {getAspdNote(t.name, className)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] text-[#555]">ASPD%</span>
            <input
              type="number"
              value={talentAspd}
              onChange={e => setTalentAspd(parseFloat(e.target.value) || 0)}
              className="w-20 bg-[#111] border border-[#333] text-white text-[11px] px-2 py-1 text-right"
              step={0.1}
            />
          </div>
        </div>
        {stats && (
          <div className="mt-2 text-[10px] text-[#555] space-y-0.5">
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
        <div className="text-[11px] text-[#444] py-8 text-center border border-[#1a1a1a]">
          Select a spec from the Classes section to load talents.
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="text-[11px] text-[#444] py-8 text-center border border-[#1a1a1a]">
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
          <div className="text-[10px] text-red-400 mb-2">Failed to fetch talent data: {error}</div>
          <div className="flex gap-2">
            <button
              onClick={fetchTalents}
              className="text-[9px] uppercase tracking-[1px] px-2 py-1 border border-red-900 text-red-400 hover:text-white transition-colors"
            >
              Retry
            </button>
            <a
              href={maxrollLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[9px] uppercase tracking-[1px] px-2 py-1 border transition-colors"
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
          <div className="flex items-center gap-3 mb-3 flex-wrap">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search talents…"
              className="bg-[#0a0a0a] border border-[#222] text-white text-[10px] px-2 py-1 w-48 placeholder-[#444] outline-none focus:border-[#444]"
            />
            <div className="text-[10px] text-[#444]">
              {selectedCount} / {total} selected{q ? ` · ${displayList.length} shown` : ""}
            </div>
            <div className="ml-auto flex gap-2 items-center">
              <button
                onClick={selectAll}
                className="text-[9px] uppercase tracking-[1px] px-2 py-1 border border-[#2a2a2a] text-[#555] hover:text-white transition-colors"
              >
                Select All
              </button>
              <button
                onClick={clearAll}
                className="text-[9px] uppercase tracking-[1px] px-2 py-1 border border-[#2a2a2a] text-[#555] hover:text-white transition-colors"
              >
                Clear
              </button>
              <a
                href={maxrollLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[9px] uppercase tracking-[1px] px-2 py-1 border transition-colors"
                style={{ color: accentColor, borderColor: accentColor + "40" }}
              >
                Maxroll ↗
              </a>
              <button
                onClick={fetchTalents}
                title="Re-fetch latest from Maxroll"
                className="text-[9px] uppercase tracking-[1px] px-2 py-1 border border-[#2a2a2a] text-[#555] hover:text-white transition-colors"
              >
                ↻
              </button>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mb-4">
            <div className="h-1 bg-[#111] w-full">
              <div
                className="h-1 transition-all"
                style={{
                  width: `${Math.min(100, total > 0 ? (selectedCount / total) * 100 : 0)}%`,
                  background: accentColor,
                }}
              />
            </div>
          </div>

          {/* Talent grid */}
          <div
            className="grid gap-1"
            style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}
          >
            {displayList.map(talent => {
              const selected = selectedTalents.includes(talent.id)
              const isAspd = isAspdTalent(talent.desc)
              return (
                <button
                  key={talent.id}
                  onClick={() => toggleTalent(talent.id)}
                  className="flex items-start gap-3 px-3 py-2.5 border text-left transition-all"
                  style={{
                    background: selected ? "#0d0d0d" : "#050505",
                    borderColor: selected ? accentColor + "80" : "#1a1a1a",
                  }}
                >
                  {/* Icon */}
                  <div
                    className="shrink-0 flex items-center justify-center mt-0.5"
                    style={{
                      width: 32,
                      height: 32,
                      border: `1px solid ${selected ? accentColor + "60" : "#222"}`,
                      background: selected ? accentColor + "15" : "#080808",
                    }}
                  >
                    {talent.icon ? (
                      <img
                        src={talent.icon}
                        width={22}
                        height={22}
                        alt={talent.name}
                        onError={e => {
                          ;(e.target as HTMLImageElement).style.display = "none"
                        }}
                      />
                    ) : (
                      <span className="text-[10px] text-[#444]">?</span>
                    )}
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className="text-[11px] font-bold leading-tight"
                        style={{ color: selected ? "#fff" : "#666" }}
                      >
                        {talent.name}
                      </span>
                      {isAspd && (
                        <span
                          className="text-[8px] px-1 py-0.5 uppercase tracking-[0.5px] shrink-0"
                          style={{ background: "#49A8FF20", color: "#49A8FF" }}
                        >
                          ASPD
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-[#555] mt-0.5 leading-[1.5]">
                      {talent.desc}
                    </div>
                    {isAspd && selected && (
                      <div className="text-[9px] mt-1 inline-flex items-center gap-1" style={{ color: accentColor + "cc" }}>
                        <ArrowUpRight className="w-3 h-3" /> {getAspdNote(talent.name, className)}
                      </div>
                    )}
                  </div>

                  {/* Checkbox */}
                  <div
                    className="shrink-0 mt-0.5 w-4 h-4 border flex items-center justify-center"
                    style={{
                      borderColor: selected ? accentColor : "#333",
                      background: selected ? accentColor : "transparent",
                    }}
                  >
                    {selected && (
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path
                          d="M1.5 5L4 7.5L8.5 2.5"
                          stroke="#000"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </div>
                </button>
              )
            })}
          </div>

          {/* Footer */}
          <div className="mt-6 border border-[#1a1a1a] bg-[#050505] p-4">
            <div className="text-[9px] font-bold uppercase tracking-[1.5px] text-[#333] mb-2">
              Notes
            </div>
            <ul className="text-[10px] text-[#555] space-y-1 list-disc list-inside leading-[1.6]">
              <li>
                Talent data is fetched live from Maxroll and cached for 1 hour.
                {fetchedAt && (
                  <span className="ml-1 text-[#333]">
                    (last fetch: {new Date(fetchedAt).toLocaleTimeString()})
                  </span>
                )}
              </li>
              <li>
                Talents marked <span style={{ color: "#49A8FF" }}>ASPD</span> affect attack speed.{" "}
                {className === "Stormblade"
                  ? "Swift is auto-calculated; enter other bonuses (e.g. Lightning Flash) in the field above."
                  : "Enter the effective ASPD gain in the field above."}
              </li>
              <li>
                All other effects (damage %, cooldowns, mechanics) are not tracked by the stat
                calculator.
              </li>
            </ul>
          </div>
        </>
      )}
    </div>
  )
}
