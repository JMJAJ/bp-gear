"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useApp, getStatPercent, getStatPercentCombat } from "@/lib/app-context"
import { GAME_DATA } from "@/lib/game-data"

type StatName = (typeof GAME_DATA.STATS)[number]

interface HoverPoint {
  stat: StatName
  raw: number
  pct: number
}

interface StatRow {
  stat: StatName
  constant: number
  raw: number
  rawPct: number
  bonusPct: number
  combatPct: number
  targetRaw: number
  nextBreakpoint: number | null
  nextBreakpointRaw: number
}

const STAT_KEYS = [...GAME_DATA.STATS] as StatName[]
const DEFAULT_BREAKPOINTS = [25, 50, 80]
const REFERENCE_BREAKPOINTS = [25, 50, 80]
const STAT_EXT_KEY: Record<StatName, "vers" | "mast" | "haste" | "crit" | "luck"> = {
  Versatility: "vers",
  Mastery: "mast",
  Haste: "haste",
  Crit: "crit",
  Luck: "luck",
}

const STAT_META: Record<StatName, { description: string; note: string; sweetSpot: [number, number] }> = {
  Versatility: {
    description: "Steady multiplier stat with the fastest early scaling.",
    note: "Usually feels good early because the constant is lower than the other substats.",
    sweetSpot: [15, 30],
  },
  Mastery: {
    description: "Large damage stat, but the curve ramps slower and carries a base value in combat.",
    note: "The graph shows raw contribution only. Combat value includes the built-in 6% base.",
    sweetSpot: [25, 40],
  },
  Haste: {
    description: "Feeds the DR curve, then branches into attack speed and cast speed elsewhere.",
    note: "If you care about feel and breakpoints, check raw Haste here and ASPD or CSPD in the stats panel.",
    sweetSpot: [15, 30],
  },
  Crit: {
    description: "Standard DR curve plus the built-in combat base.",
    note: "The graph excludes the free 5% base so you can judge raw investment cleanly.",
    sweetSpot: [25, 35],
  },
  Luck: {
    description: "Lucky Strike chance on the same slow constant as Crit, Haste, and Mastery.",
    note: "The graph excludes the free 5% base for the same reason as Crit.",
    sweetSpot: [25, 35],
  },
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function roundUp(value: number, step: number) {
  return Math.ceil(value / step) * step
}

function formatRaw(value: number) {
  return Math.round(value).toLocaleString()
}

function formatPct(value: number, digits = 2) {
  return `${value.toFixed(digits)}%`
}

function getRawForPct(stat: StatName, rawPct: number | null) {
  const constant = GAME_DATA.CONSTANTS[stat]?.c ?? 0
  if (!constant || rawPct === null || rawPct <= 0 || rawPct >= 100) return 0
  return Math.round((rawPct * constant) / (100 - rawPct))
}

function getRawTickStep(maxRaw: number) {
  if (maxRaw <= 25000) return 5000
  if (maxRaw <= 60000) return 10000
  if (maxRaw <= 120000) return 20000
  return 50000
}

function getStatRows(targetPct: number | null, breakpoints: number[], stats: ReturnType<typeof useApp>["stats"]): StatRow[] {
  return STAT_KEYS.map((stat) => {
    const constant = GAME_DATA.CONSTANTS[stat].c
    const raw = stats?.total[stat] ?? 0
    const rawPct = getStatPercent(stat, raw)
    const extPct = stats?.ext[STAT_EXT_KEY[stat]] ?? 0
    const purplePct = stats?.purpleStats?.[`${stat} (%)`] ?? 0
    const bonusPct = extPct + purplePct
    const combatPct = getStatPercentCombat(stat, raw) + bonusPct
    const nextBreakpoint = [...breakpoints].sort((a, b) => a - b).find((bp) => bp > rawPct) ?? null

    return {
      stat,
      constant,
      raw,
      rawPct,
      bonusPct,
      combatPct,
      targetRaw: getRawForPct(stat, targetPct),
      nextBreakpoint,
      nextBreakpointRaw: nextBreakpoint ? getRawForPct(stat, nextBreakpoint) : 0,
    }
  })
}

function CurveCanvas({
  stat,
  accent,
  currentRaw,
  targetPct,
  breakpoints,
  onHover,
}: {
  stat: StatName
  accent: string
  currentRaw: number
  targetPct: number | null
  breakpoints: number[]
  onHover: (point: HoverPoint |   null) => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const hoverRef = useRef<HoverPoint | null>(null)
  const sizeRef = useRef({ w: 0, h: 0 })

  const maxRaw = useMemo(() => {
    const constant = GAME_DATA.CONSTANTS[stat].c
    const values = [constant * 1.5, currentRaw]

    if (targetPct !== null) values.push(getRawForPct(stat, targetPct))
    breakpoints.forEach((bp) => values.push(getRawForPct(stat, bp)))

    const rawMax = Math.max(15000, ...values) * 1.18
    return roundUp(rawMax, rawMax <= 25000 ? 2500 : 5000)
  }, [breakpoints, currentRaw, stat, targetPct])

  const maxPct = useMemo(() => {
    const values = [40, getStatPercent(stat, currentRaw)]
    if (targetPct !== null) values.push(targetPct)
    values.push(...breakpoints)
    return clamp(roundUp(Math.max(...values) + 8, 10), 40, 95)
  }, [breakpoints, currentRaw, stat, targetPct])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    const parent = canvas.parentElement
    if (!ctx || !parent) return

    const dpr = window.devicePixelRatio || 1
    const cssW = parent.clientWidth
    const cssH = 320
    const pad = { top: 24, right: 22, bottom: 42, left: 54 }

    sizeRef.current = { w: cssW, h: cssH }

    canvas.width = cssW * dpr
    canvas.height = cssH * dpr
    canvas.style.width = `${cssW}px`
    canvas.style.height = `${cssH}px`

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    const width = cssW
    const height = cssH
    const graphWidth = width - pad.left - pad.right
    const graphHeight = height - pad.top - pad.bottom
    const toX = (raw: number) => pad.left + (raw / maxRaw) * graphWidth
    const toY = (pct: number) => pad.top + graphHeight - (pct / maxPct) * graphHeight

    ctx.clearRect(0, 0, width, height)
    ctx.fillStyle = "#080808"
    ctx.fillRect(0, 0, width, height)

    const [sweetLo, sweetHi] = STAT_META[stat].sweetSpot
    ctx.fillStyle = `${accent}14`
    ctx.fillRect(pad.left, toY(sweetHi), graphWidth, toY(sweetLo) - toY(sweetHi))

    const yStep = maxPct <= 50 ? 5 : 10
    ctx.strokeStyle = "#1a1a1a"
    ctx.lineWidth = 1
    for (let pct = 0; pct <= maxPct; pct += yStep) {
      const y = toY(pct)
      ctx.beginPath()
      ctx.moveTo(pad.left, y)
      ctx.lineTo(width - pad.right, y)
      ctx.stroke()

      ctx.fillStyle = "#727272"
      ctx.font = "11px 'Space Grotesk', system-ui, sans-serif"
      ctx.textAlign = "right"
      ctx.textBaseline = "middle"
      ctx.fillText(`${pct}%`, pad.left - 8, y)
    }

    const rawStep = getRawTickStep(maxRaw)
    for (let raw = 0; raw <= maxRaw; raw += rawStep) {
      const x = toX(raw)
      ctx.strokeStyle = raw === 0 ? "#242424" : "#141414"
      ctx.beginPath()
      ctx.moveTo(x, pad.top)
      ctx.lineTo(x, height - pad.bottom)
      ctx.stroke()

      ctx.fillStyle = "#727272"
      ctx.font = "10px 'Space Grotesk', system-ui, sans-serif"
      ctx.textAlign = "center"
      ctx.textBaseline = "top"
      ctx.fillText(raw === 0 ? "0" : `${Math.round(raw / 1000)}k`, x, height - pad.bottom + 8)
    }

    ctx.fillStyle = "#8a8a8a"
    ctx.font = "10px 'Space Grotesk', system-ui, sans-serif"
    ctx.textAlign = "left"
    ctx.textBaseline = "top"
    ctx.fillText(`Sweet spot: ${sweetLo}% - ${sweetHi}% raw`, pad.left + 8, toY(sweetHi) + 6)

    ctx.strokeStyle = accent
    ctx.lineWidth = 2.5
    ctx.lineJoin = "round"
    ctx.lineCap = "round"
    ctx.beginPath()
    for (let i = 0; i <= 360; i += 1) {
      const raw = (i / 360) * maxRaw
      const pct = getStatPercent(stat, raw)
      const x = toX(raw)
      const y = toY(Math.min(pct, maxPct))
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()

    breakpoints.forEach((bp) => {
      const raw = getRawForPct(stat, bp)
      if (raw <= 0 || raw > maxRaw) return

      const x = toX(raw)
      const y = toY(bp)

      ctx.strokeStyle = `${accent}66`
      ctx.lineWidth = 1
      ctx.setLineDash([4, 4])
      ctx.beginPath()
      ctx.moveTo(x, pad.top)
      ctx.lineTo(x, height - pad.bottom)
      ctx.stroke()
      ctx.setLineDash([])

      ctx.fillStyle = accent
      ctx.beginPath()
      ctx.arc(x, y, 4, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = "#f5f5f5"
      ctx.font = "10px 'Space Grotesk', system-ui, sans-serif"
      ctx.textAlign = "center"
      ctx.textBaseline = "bottom"
      ctx.fillText(`${bp}%`, x, y - 8)
    })

    if (targetPct !== null && targetPct > 0 && targetPct < 100) {
      const raw = getRawForPct(stat, targetPct)
      if (raw > 0 && raw <= maxRaw) {
        const x = toX(raw)
        const y = toY(targetPct)

        ctx.strokeStyle = "#4ade80"
        ctx.lineWidth = 1.5
        ctx.setLineDash([6, 5])
        ctx.beginPath()
        ctx.moveTo(pad.left, y)
        ctx.lineTo(width - pad.right, y)
        ctx.stroke()
        ctx.setLineDash([])

        ctx.fillStyle = "#4ade80"
        ctx.beginPath()
        ctx.arc(x, y, 5, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    if (currentRaw > 0) {
      const currentPct = getStatPercent(stat, currentRaw)
      const x = toX(currentRaw)
      const y = toY(currentPct)

      ctx.strokeStyle = "#ffffff55"
      ctx.lineWidth = 1
      ctx.setLineDash([3, 5])
      ctx.beginPath()
      ctx.moveTo(x, pad.top)
      ctx.lineTo(x, height - pad.bottom)
      ctx.stroke()
      ctx.setLineDash([])

      ctx.fillStyle = "#ffffff"
      ctx.beginPath()
      ctx.arc(x, y, 5, 0, Math.PI * 2)
      ctx.fill()
    }

    if (hoverRef.current) {
      const x = toX(hoverRef.current.raw)
      const y = toY(Math.min(hoverRef.current.pct, maxPct))

      ctx.strokeStyle = "#ffffff88"
      ctx.lineWidth = 1
      ctx.setLineDash([3, 3])
      ctx.beginPath()
      ctx.moveTo(x, pad.top)
      ctx.lineTo(x, height - pad.bottom)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(pad.left, y)
      ctx.lineTo(width - pad.right, y)
      ctx.stroke()
      ctx.setLineDash([])

      ctx.fillStyle = "#ffffff"
      ctx.beginPath()
      ctx.arc(x, y, 4, 0, Math.PI * 2)
      ctx.fill()
    }
  }, [accent, breakpoints, currentRaw, maxPct, maxRaw, stat, targetPct])

  useEffect(() => {
    draw()

    const canvas = canvasRef.current
    if (!canvas?.parentElement) return

    const observer = new ResizeObserver(() => draw())
    observer.observe(canvas.parentElement)
    return () => observer.disconnect()
  }, [draw])

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const pad = { top: 24, right: 22, bottom: 42, left: 54 }
    // Use actual canvas CSS dimensions from the rect, not cached values
    const w = rect.width
    const h = rect.height
    const graphWidth = w - pad.left - pad.right
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    if (x < pad.left || x > w - pad.right || y < pad.top || y > h - pad.bottom) {
      hoverRef.current = null
      onHover(null)
      draw()
      return
    }

    const raw = ((x - pad.left) / graphWidth) * maxRaw
    const pct = getStatPercent(stat, raw)
    hoverRef.current = { stat, raw, pct }
    onHover({ stat, raw, pct })
    draw()
  }

  const handleMouseLeave = () => {
    hoverRef.current = null
    onHover(null)
    draw()
  }

  return (
    <canvas
      ref={canvasRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ display: "block", width: "100%", height: 320 }}
    />
  )
}

export function CurvesSection() {
  const { accentColor, stats, spec } = useApp()

  const defaultStat = (GAME_DATA.SPECS[spec]?.[0] as StatName | undefined) ?? "Haste"
  const [selectedStat, setSelectedStat] = useState<StatName>(defaultStat)
  const [targetInput, setTargetInput] = useState("")
  const [breakpoints, setBreakpoints] = useState<number[]>(DEFAULT_BREAKPOINTS)
  const [hoverPoint, setHoverPoint] = useState<HoverPoint | null>(null)

  useEffect(() => {
    if (!STAT_KEYS.includes(selectedStat)) {
      setSelectedStat(defaultStat)
    }
  }, [defaultStat, selectedStat])

  const targetPct = useMemo(() => {
    if (targetInput.trim() === "") return null
    const parsed = Number(targetInput)
    if (!Number.isFinite(parsed)) return null
    return clamp(parsed, 0, 95)
  }, [targetInput])

  const statRows = useMemo(() => getStatRows(targetPct, breakpoints, stats), [breakpoints, stats, targetPct])
  const selectedRow = statRows.find((row) => row.stat === selectedStat) ?? statRows[0]
  const selectedMeta = STAT_META[selectedStat]
  const selectedHover = hoverPoint?.stat === selectedStat ? hoverPoint : null
  const livePoint = selectedHover ?? {
    stat: selectedStat,
    raw: selectedRow.raw,
    pct: selectedRow.rawPct,
  }

  const sweetSpotRawMin = getRawForPct(selectedStat, selectedMeta.sweetSpot[0])
  const sweetSpotRawMax = getRawForPct(selectedStat, selectedMeta.sweetSpot[1])
  const targetRawForSelected = getRawForPct(selectedStat, targetPct)

  const toggleBreakpoint = (value: number) => {
    setBreakpoints((prev) => {
      if (prev.includes(value)) return prev.filter((bp) => bp !== value)
      return [...prev, value].sort((a, b) => a - b)
    })
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      <div className="space-y-2">
        <div className="text-2xl font-bold tracking-tight text-white">Stat Curves</div>
        <div className="max-w-3xl text-sm leading-6 text-[var(--text-mid)]">
          Use this to judge raw substat investment, not just the final in-combat number. The graph shows the raw DR formula
          only, so built-in base values and external bonuses stay separate instead of muddying the curve.
        </div>
        <div className="inline-flex flex-wrap items-center gap-2 border border-border bg-card px-3 py-2 text-xs text-[var(--text-dim)]">
          <span className="uppercase tracking-[1.4px]">Formula</span>
          <code className="bg-[var(--muted)] px-2 py-1 text-white">raw % = raw / (raw + constant)</code>
          <span>Combat % = base + raw % + outside bonuses</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
        {statRows.map((row) => {
          const selected = row.stat === selectedStat
          return (
            <button
              key={row.stat}
              type="button"
              onClick={() => setSelectedStat(row.stat)}
              className="min-w-0 border p-4 text-left transition-colors"
              style={{
                borderColor: selected ? accentColor : "var(--border)",
                background: selected ? `${accentColor}10` : "var(--card)",
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-[1.4px]" style={{ color: selected ? accentColor : "var(--text-dim)" }}>
                    {row.stat}
                  </div>
                  <div className="mt-2 text-xl font-bold text-white tabular-nums">{formatPct(row.combatPct)}</div>
                </div>
                <div className="text-right text-[10px] uppercase tracking-[1px] text-[var(--text-dim)]">
                  <div>Current</div>
                  <div className="mt-1 text-[11px] font-semibold text-[var(--text-mid)]">{formatRaw(row.raw)} raw</div>
                </div>
              </div>

              <div className="mt-3 h-1.5 bg-[var(--stat-bar-bg)]">
                <div
                  className="h-full"
                  style={{ width: `${Math.min(100, (row.rawPct / 80) * 100)}%`, background: selected ? accentColor : "#7b7b7b" }}
                />
              </div>

              <div className="mt-3 flex items-center justify-between gap-3 text-xs text-[var(--text-mid)]">
                <span>{formatPct(row.rawPct, 1)} raw</span>
                <span>
                  {row.nextBreakpoint
                    ? `${row.nextBreakpoint}% at ${formatRaw(row.nextBreakpointRaw)}`
                    : "Above selected refs"}
                </span>
              </div>
            </button>
          )
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
        <div className="border border-border bg-card p-4 sm:p-5">
          <div className="flex flex-col gap-4 border-b border-border pb-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[1.5px]" style={{ color: accentColor }}>
                Selected Curve
              </div>
              <div className="mt-1 text-xl font-semibold text-white">{selectedStat}</div>
              <div className="mt-1 max-w-2xl text-sm text-[var(--text-mid)]">{selectedMeta.description}</div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
              <label className="flex items-center gap-2 text-xs text-[var(--text-mid)]">
                <span className="uppercase tracking-[1.2px] text-[var(--text-dim)]">Target raw %</span>
                <input
                  type="number"
                  min="0"
                  max="95"
                  step="0.5"
                  inputMode="decimal"
                  placeholder="34.5"
                  value={targetInput}
                  onChange={(event) => setTargetInput(event.target.value)}
                  className="w-24 border border-border bg-[var(--muted)] px-2 py-1.5 text-right text-sm text-white outline-none focus:border-[var(--ring)]"
                />
              </label>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                {[25, 50, 80].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setTargetInput(String(preset))}
                    className="border border-border px-2.5 py-1 text-[var(--text-mid)] transition-colors hover:text-white"
                  >
                    {preset}%
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setTargetInput("")}
                  className="border border-border px-2.5 py-1 text-[var(--text-dim)] transition-colors hover:text-white"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
            <span className="uppercase tracking-[1.2px] text-[var(--text-dim)]">Reference markers</span>
            {REFERENCE_BREAKPOINTS.map((bp) => {
              const active = breakpoints.includes(bp)
              return (
                <button
                  key={bp}
                  type="button"
                  onClick={() => toggleBreakpoint(bp)}
                  className="border px-2.5 py-1 transition-colors"
                  style={{
                    borderColor: active ? accentColor : "var(--border)",
                    color: active ? accentColor : "var(--text-mid)",
                    background: active ? `${accentColor}10` : "transparent",
                  }}
                >
                  {bp}%
                </button>
              )
            })}
          </div>

          <div className="mt-5 overflow-hidden border border-border bg-black/30">
            <CurveCanvas
              stat={selectedStat}
              accent={accentColor}
              currentRaw={selectedRow.raw}
              targetPct={targetPct}
              breakpoints={breakpoints}
              onHover={setHoverPoint}
            />
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="border border-border bg-[var(--muted)]/50 p-3">
              <div className="text-[10px] uppercase tracking-[1.3px] text-[var(--text-dim)]">
                {selectedHover ? "Hovered point" : "Current build"}
              </div>
              <div className="mt-2 text-lg font-semibold text-white tabular-nums">{formatPct(livePoint.pct)}</div>
              <div className="mt-1 text-sm text-[var(--text-mid)]">{formatRaw(livePoint.raw)} raw</div>
            </div>

            <div className="border border-border bg-[var(--muted)]/50 p-3">
              <div className="text-[10px] uppercase tracking-[1.3px] text-[var(--text-dim)]">Current combat total</div>
              <div className="mt-2 text-lg font-semibold text-white tabular-nums">{formatPct(selectedRow.combatPct)}</div>
              <div className="mt-1 text-sm text-[var(--text-mid)]">{selectedRow.bonusPct > 0 ? `Includes +${selectedRow.bonusPct.toFixed(2)}% outside bonuses` : "No outside % bonuses on this stat"}</div>
            </div>

            <div className="border border-border bg-[var(--muted)]/50 p-3">
              <div className="text-[10px] uppercase tracking-[1.3px] text-[var(--text-dim)]">Target requirement</div>
              <div className="mt-2 text-lg font-semibold text-white tabular-nums">
                {targetPct !== null ? formatRaw(targetRawForSelected) : "-"}
              </div>
              <div className="mt-1 text-sm text-[var(--text-mid)]">
                {targetPct !== null ? `Raw needed for ${targetPct.toFixed(1)}% on ${selectedStat}` : "Set a target raw % to get the requirement"}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="border border-border bg-card p-4">
            <div className="text-[11px] font-bold uppercase tracking-[1.5px]" style={{ color: accentColor }}>
              {selectedStat} Notes
            </div>
            <div className="mt-3 space-y-3 text-sm leading-6 text-[var(--text-mid)]">
              <p>{selectedMeta.note}</p>
              <p>Sweet spot reference: {selectedMeta.sweetSpot[0]}% to {selectedMeta.sweetSpot[1]}% raw, which is roughly {formatRaw(sweetSpotRawMin)} to {formatRaw(sweetSpotRawMax)} raw.</p>
              <p>Constant: {formatRaw(selectedRow.constant)}. Higher constants mean you need more raw for the same visible gain.</p>
              {selectedRow.nextBreakpoint ? (
                <p>Next selected marker: {selectedRow.nextBreakpoint}% at about {formatRaw(selectedRow.nextBreakpointRaw)} raw.</p>
              ) : (
                <p>Your current build is already past all active reference markers for this stat.</p>
              )}
              {selectedStat === "Haste" && stats && (
                <p>Current Haste feeds into about {formatPct(stats.aspd ?? 0)} attack speed and {formatPct(stats.cspd ?? 0)} cast speed after all other logic.</p>
              )}
            </div>
          </div>

          <div className="border border-border bg-card p-4">
            <div className="text-[11px] font-bold uppercase tracking-[1.5px]" style={{ color: accentColor }}>
              Reference Raw
            </div>
            <div className="mt-3 space-y-2">
              {REFERENCE_BREAKPOINTS.map((bp) => (
                <div key={bp} className="flex items-center justify-between border border-border bg-[var(--muted)]/40 px-3 py-2 text-sm">
                  <span className="text-[var(--text-mid)]">{bp}% raw</span>
                  <span className="font-mono text-white">{formatRaw(getRawForPct(selectedStat, bp))}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="border border-border bg-card p-4">
            <div className="text-[11px] font-bold uppercase tracking-[1.5px]" style={{ color: accentColor }}>
              Reading The Chart
            </div>
            <div className="mt-3 space-y-2 text-sm leading-6 text-[var(--text-mid)]">
              <p>White marker: your current build.</p>
              <p>Green marker: the raw % target you typed in.</p>
              <p>Vertical reference markers: common checkpoints so you can see how expensive each jump gets.</p>
              <p>Hover the graph to inspect any raw value without leaving the page.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="border border-border bg-card p-4 sm:p-5">
        <div className="flex flex-col gap-2 border-b border-border pb-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[1.5px]" style={{ color: accentColor }}>
              Comparison Table
            </div>
            <div className="mt-1 text-sm text-[var(--text-mid)]">Quick reference for all five DR stats in your current build.</div>
          </div>
          {targetPct !== null && (
            <div className="text-xs text-[#4ade80]">Target column shows raw needed for {targetPct.toFixed(1)}%</div>
          )}
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[10px] uppercase tracking-[1px] text-[var(--text-dim)]">
                <th className="px-2 py-2">Stat</th>
                <th className="px-2 py-2">Constant</th>
                <th className="px-2 py-2">Current Raw</th>
                <th className="px-2 py-2">Raw %</th>
                <th className="px-2 py-2">Combat %</th>
                <th className="px-2 py-2">Target Raw</th>
              </tr>
            </thead>
            <tbody>
              {statRows.map((row) => (
                <tr key={row.stat} className="border-b border-[#111] text-[var(--text-mid)] last:border-b-0">
                  <td className="px-2 py-3 font-semibold text-white">{row.stat}</td>
                  <td className="px-2 py-3">{formatRaw(row.constant)}</td>
                  <td className="px-2 py-3">{formatRaw(row.raw)}</td>
                  <td className="px-2 py-3">{formatPct(row.rawPct)}</td>
                  <td className="px-2 py-3">{formatPct(row.combatPct)}</td>
                  <td className="px-2 py-3" style={{ color: targetPct !== null ? "#4ade80" : "var(--text-dim)" }}>
                    {targetPct !== null ? formatRaw(row.targetRaw) : "-"}
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
