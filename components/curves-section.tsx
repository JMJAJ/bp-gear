"use client"
import { useEffect, useRef, useCallback, useState } from "react"
import { useApp, getStatPercent } from "@/lib/app-context"
import { GAME_DATA } from "@/lib/game-data"

interface TooltipData {
  stat: string
  raw: number
  pct: number // raw portion only
  base: number
  x: number
  y: number
}

function CurveCanvas({ 
  stat, 
  constant, 
  base, 
  accent, 
  targetPct, 
  breakpoints,
  onHover 
}: { 
  stat: string
  constant: number
  base: number
  accent: string
  targetPct: number | null
  breakpoints: number[]
  onHover: (data: TooltipData | null) => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const hoverRef = useRef<{ raw: number; pct: number; px: number; py: number } | null>(null)

  const maxX = 60000
  const maxY = 85
  const pad = { top: 20, bottom: 32, left: 48, right: 16 }

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    if (!canvas || !wrap) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const cssW = wrap.clientWidth
    const cssH = 240
    canvas.width = cssW * dpr
    canvas.height = cssH * dpr
    canvas.style.width = cssW + "px"
    canvas.style.height = cssH + "px"
    ctx.scale(dpr, dpr)

    const W = cssW, H = cssH
    const gW = W - pad.left - pad.right
    const gH = H - pad.top - pad.bottom

    ctx.clearRect(0, 0, W, H)

    // Background
    ctx.fillStyle = "#0a0a0a"
    ctx.fillRect(0, 0, W, H)

    // Grid lines + labels
    ctx.strokeStyle = "#1a1a1a"
    ctx.lineWidth = 1
    for (let y = 0; y <= 80; y += 10) {
      const py = pad.top + gH - (y / maxY) * gH
      ctx.beginPath(); ctx.moveTo(pad.left, py); ctx.lineTo(W - pad.right, py); ctx.stroke()
      ctx.fillStyle = "#444"
      ctx.font = `10px 'Space Grotesk', system-ui, sans-serif`
      ctx.textAlign = "right"
      ctx.fillText(y + "%", pad.left - 5, py + 3.5)
    }
    for (let x = 0; x <= maxX; x += 10000) {
      const px = pad.left + (x / maxX) * gW
      ctx.strokeStyle = "#151515"
      ctx.beginPath(); ctx.moveTo(px, pad.top); ctx.lineTo(px, H - pad.bottom); ctx.stroke()
      ctx.fillStyle = "#333"
      ctx.textAlign = "center"
      ctx.font = `9px 'Space Grotesk', system-ui, sans-serif`
      ctx.fillText(x >= 1000 ? (x / 1000).toFixed(0) + "k" : String(x), px, H - pad.bottom + 16)
    }

    // Sweet spot band
    const sweetLo = stat === "Versatility" || stat === "Haste" ? 15 : 25
    const sweetHi = stat === "Versatility" || stat === "Haste" ? 30 : stat === "Mastery" ? 40 : 35
    const syLo = pad.top + gH - (sweetHi / maxY) * gH
    const syHi = pad.top + gH - (sweetLo / maxY) * gH
    ctx.fillStyle = `${accent}14`
    ctx.fillRect(pad.left, syLo, gW, syHi - syLo)
    ctx.fillStyle = "#cecece"
    ctx.font = `8px 'Space Grotesk', system-ui, sans-serif`
    ctx.textAlign = "left"
    ctx.fillText("sweet spot", pad.left + 179, syLo + 10)

    // Target % line (user input - raw portion, without base)
    if (targetPct !== null && targetPct > 0 && targetPct <= 80) {
      // rawPct = raw / (raw + constant) * 100
      // raw = (rawPct * constant) / (100 - rawPct)
      const raw = (targetPct * constant) / (100 - targetPct)
      if (raw <= maxX) {
        const px = pad.left + (raw / maxX) * gW
        const py = pad.top + gH - (targetPct / maxY) * gH
        // Dashed line
        ctx.strokeStyle = "#4ade80"
        ctx.lineWidth = 1
        ctx.setLineDash([4, 4])
        ctx.beginPath()
        ctx.moveTo(pad.left, py)
        ctx.lineTo(W - pad.right, py)
        ctx.stroke()
        ctx.setLineDash([])
        // Dot
        ctx.fillStyle = "#4ade80"
        ctx.beginPath(); ctx.arc(px, py, 5, 0, Math.PI * 2); ctx.fill()
        ctx.fillStyle = "#ffffff"
        ctx.font = `8px 'Space Grotesk', system-ui, sans-serif`
        ctx.textAlign = "center"
        ctx.fillText((Math.round(raw / 100) / 10) + "k", px, py - 9)
      }
    }

    // Curve (raw portion only, base added separately)
    ctx.strokeStyle = accent
    ctx.lineWidth = 2
    ctx.lineJoin = "round"
    ctx.beginPath()
    for (let i = 0; i <= 300; i++) {
      const raw = (i / 300) * maxX
      const pct = getStatPercent(stat, raw)
      const px = pad.left + (raw / maxX) * gW
      const py = pad.top + gH - Math.min(pct, maxY) / maxY * gH
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py)
    }
    ctx.stroke()

    // Breakpoint dots (raw portion percentage)
    breakpoints.forEach(targetRawPct => {
      if (targetRawPct <= 0 || targetRawPct >= 100) return
      const raw = (targetRawPct * constant) / (100 - targetRawPct)
      if (raw > maxX) return
      const px = pad.left + (raw / maxX) * gW
      const py = pad.top + gH - (targetRawPct / maxY) * gH
      ctx.fillStyle = accent
      ctx.beginPath(); ctx.arc(px, py, 3, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle = "#ffffff"
      ctx.font = `8px 'Space Grotesk', system-ui, sans-serif`
      ctx.textAlign = "center"
      ctx.fillText((Math.round(raw / 100) / 10) + "k", px, py - 7)
    })

    // Hover indicator
    if (hoverRef.current) {
      const { px, py } = hoverRef.current
      ctx.strokeStyle = "#fff"
      ctx.lineWidth = 1
      ctx.setLineDash([2, 2])
      ctx.beginPath()
      ctx.moveTo(px, pad.top)
      ctx.lineTo(px, H - pad.bottom)
      ctx.stroke()
      ctx.moveTo(pad.left, py)
      ctx.lineTo(W - pad.right, py)
      ctx.stroke()
      ctx.setLineDash([])
    }
  }, [stat, constant, base, accent, targetPct, breakpoints])

  useEffect(() => {
    draw()
    const wrap = wrapRef.current
    if (!wrap) return
    const ro = new ResizeObserver(() => draw())
    ro.observe(wrap)
    return () => ro.disconnect()
  }, [draw])

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    if (!canvas || !wrap) return

    const rect = canvas.getBoundingClientRect()
    const cssW = wrap.clientWidth
    const gW = cssW - pad.left - pad.right
    const gH = 240 - pad.top - pad.bottom

    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Check if within graph area
    if (x >= pad.left && x <= cssW - pad.right && y >= pad.top && y <= 240 - pad.bottom) {
      const raw = ((x - pad.left) / gW) * maxX
      const pct = getStatPercent(stat, raw)
      const py = pad.top + gH - (Math.min(pct, maxY) / maxY) * gH

      hoverRef.current = { raw, pct, px: x, py }
      onHover({ stat, raw, pct, base, x: e.clientX, y: e.clientY })
      draw()
    } else {
      hoverRef.current = null
      onHover(null)
      draw()
    }
  }

  const handleMouseLeave = () => {
    hoverRef.current = null
    onHover(null)
    draw()
  }

  return (
    <div ref={wrapRef} style={{ width: "100%", minHeight: 240 }}>
      <canvas 
        ref={canvasRef} 
        style={{ display: "block" }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />
    </div>
  )
}

export function CurvesSection() {
  const { accentColor } = useApp()
  const [targetPct, setTargetPct] = useState<number | null>(null)
  const [breakpoints, setBreakpoints] = useState<number[]>([25, 50, 80])
  const [tooltip, setTooltip] = useState<TooltipData | null>(null)

  const toggleBreakpoint = (bp: number) => {
    setBreakpoints(prev => 
      prev.includes(bp) ? prev.filter(b => b !== bp) : [...prev, bp].sort((a, b) => a - b)
    )
  }

  // Calculate raw needed for target raw % (without base)
  const getRawForPct = (stat: string, rawPct: number) => {
    const cData = GAME_DATA.CONSTANTS[stat]
    if (!cData || rawPct <= 0 || rawPct >= 100) return 0
    // rawPct = raw / (raw + constant) * 100
    // raw = (rawPct * constant) / (100 - rawPct)
    return Math.round((rawPct * cData.c) / (100 - rawPct))
  }

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="mb-6">
        <div className="text-2xl font-bold tracking-tight text-white mb-1">Diminishing Returns</div>
        <div className="text-[11px] text-[#555] max-w-xl leading-5">
          Every substat follows a continuous DR formula:{" "}
          <code className="bg-[#111] px-1.5 py-0.5 text-white">% = Base + Raw / (Raw + Constant)</code>.
          Hover over curves to see exact values. Use the target input to find raw needed for any %.
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-4 mb-6 p-4 border border-[#222] bg-[#0a0a0a]">
        {/* Target % input */}
        <div className="flex items-center gap-2">
          <label className="text-[10px] uppercase tracking-[1px] text-[#555]">Raw %</label>
          <input
            type="number"
            min="0"
            max="80"
            step="0.5"
            placeholder="e.g. 34.5"
            value={targetPct ?? ""}
            onChange={e => {
              const v = parseFloat(e.target.value)
              setTargetPct(isNaN(v) ? null : Math.max(0, Math.min(80, v)))
            }}
            className="w-20 bg-[#111] border border-[#333] text-white px-2 py-1 text-[11px] focus:border-[#555] outline-none"
          />
          {targetPct !== null && (
            <span className="text-[9px] text-[#4ade80]">→ shows on all curves</span>
          )}
        </div>

        {/* Breakpoint checkboxes */}
        <div className="flex items-center gap-3 ml-auto">
          <span className="text-[10px] uppercase tracking-[1px] text-[#555]">Breakpoints</span>
          {[25, 50, 80].map(bp => (
            <label key={bp} className="flex items-center gap-1 cursor-pointer">
              <input
                type="checkbox"
                checked={breakpoints.includes(bp)}
                onChange={() => toggleBreakpoint(bp)}
                className="accent-current"
                style={{ accentColor }}
              />
              <span className="text-[10px] text-[#888]">{bp}%</span>
            </label>
          ))}
        </div>
      </div>

      {/* Target % summary table */}
      {targetPct !== null && (
        <div className="mb-4 p-3 border border-[#1a1a1a] bg-[#0a0a0a]">
          <div className="text-[9px] uppercase tracking-[1px] text-[#4ade80] mb-2">
            Raw needed for {targetPct}% raw portion (total with base shown below)
          </div>
          <div className="grid grid-cols-5 gap-2">
            {Object.entries(GAME_DATA.CONSTANTS).map(([stat, cData]) => {
              const raw = getRawForPct(stat, targetPct)
              const totalPct = targetPct + cData.base
              return (
                <div key={stat} className="text-center">
                  <div className="text-[10px] font-bold text-white">{stat}</div>
                  <div className="text-[11px] font-mono text-[#4ade80]">
                    {raw > 0 ? raw.toLocaleString() : "—"}
                  </div>
                  {cData.base > 0 && (
                    <div className="text-[8px] text-[#888]">→ {totalPct.toFixed(1)}% total</div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Tooltip */}
      {tooltip && (
        <div 
          className="fixed z-50 pointer-events-none px-2 py-1 bg-[#1a1a1a] border border-[#333] text-[10px]"
          style={{ 
            left: tooltip.x + 10, 
            top: tooltip.y - 30,
          }}
        >
          <span className="text-white font-bold">{tooltip.stat}</span>
          <span className="text-[#888]">: </span>
          <span style={{ color: accentColor }}>{(tooltip.pct + tooltip.base).toFixed(2)}%</span>
          {tooltip.base > 0 && <span className="text-[#555]"> ({tooltip.pct.toFixed(2)}% + {tooltip.base}% base)</span>}
          <span className="text-[#444]"> · {Math.round(tooltip.raw).toLocaleString()} raw</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {Object.entries(GAME_DATA.CONSTANTS).map(([stat, cData]) => (
          <div key={stat} className="border border-[#222] bg-[#0a0a0a] p-4 min-w-0">
            <div
              className="text-[10px] font-bold uppercase tracking-[1.5px] mb-3"
              style={{ color: accentColor }}
            >
              {stat}
            </div>
            <CurveCanvas 
              stat={stat} 
              constant={cData.c} 
              base={cData.base} 
              accent={accentColor}
              targetPct={targetPct}
              breakpoints={breakpoints}
              onHover={setTooltip}
            />
          </div>
        ))}
      </div>

      {/* Constants table */}
      <div className="border border-[#222] bg-[#0a0a0a] p-4">
        <div className="text-[9px] uppercase tracking-[1.5px] font-bold mb-3" style={{ color: accentColor }}>
          Constants — Season 2 Datamine
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[11px] border-collapse">
            <thead>
              <tr className="border-b border-[#222]">
                {["Stat","Constant","Base %","50% Raw","Total @ 50%","Formula"].map(h => (
                  <th key={h} className="text-left text-[9px] uppercase tracking-[0.5px] text-[#444] font-semibold px-2 py-2 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(GAME_DATA.CONSTANTS).map(([stat, cData]) => {
                // For 50% raw portion: raw = (50 * c) / (100 - 50) = c
                const need50raw = cData.c
                const total50 = 50 + cData.base
                return (
                  <tr key={stat} className="border-b border-[#0d0d0d] hover:bg-white/[0.01]">
                    <td className="px-2 py-2 font-bold text-white whitespace-nowrap">{stat}</td>
                    <td className="px-2 py-2 text-[#888] whitespace-nowrap">{cData.c.toLocaleString()}</td>
                    <td className="px-2 py-2 text-[#888]">{cData.base}%</td>
                    <td className="px-2 py-2 whitespace-nowrap" style={{ color: accentColor }}>
                      {need50raw.toLocaleString()} raw
                    </td>
                    <td className="px-2 py-2 text-[#888]">{total50}%</td>
                    <td className="px-2 py-2 text-[#555] font-mono text-[9px] whitespace-nowrap">
                      {cData.base}% + R/(R+{cData.c.toLocaleString()})
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
