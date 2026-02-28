"use client"
import { useEffect, useRef, useCallback } from "react"
import { useApp, getStatPercent } from "@/lib/app-context"
import { GAME_DATA } from "@/lib/game-data"

function CurveCanvas({ stat, constant, base, accent }: { stat: string; constant: number; base: number; accent: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)

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
    const pad = { top: 20, bottom: 32, left: 48, right: 16 }
    const gW = W - pad.left - pad.right
    const gH = H - pad.top - pad.bottom
    const maxX = 60000, maxY = 85

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

    // Curve
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

    // Breakpoint dots
    ;[25, 50, 80].forEach(targetY => {
      const rawTarget = (targetY - base) / 100
      if (rawTarget <= 0 || rawTarget >= 1) return
      const raw = (rawTarget * constant) / (1 - rawTarget)
      if (raw > maxX) return
      const px = pad.left + (raw / maxX) * gW
      const py = pad.top + gH - (targetY / maxY) * gH
      ctx.fillStyle = accent
      ctx.beginPath(); ctx.arc(px, py, 3, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle = "#ffffff"
      ctx.font = `8px 'Space Grotesk', system-ui, sans-serif`
      ctx.textAlign = "center"
      ctx.fillText((Math.round(raw / 100) / 10) + "k", px, py - 7)
    })
  }, [stat, constant, base, accent])

  useEffect(() => {
    draw()
    const wrap = wrapRef.current
    if (!wrap) return
    const ro = new ResizeObserver(() => draw())
    ro.observe(wrap)
    return () => ro.disconnect()
  }, [draw])

  return (
    <div ref={wrapRef} style={{ width: "100%", minHeight: 240 }}>
      <canvas ref={canvasRef} style={{ display: "block" }} />
    </div>
  )
}

export function CurvesSection() {
  const { accentColor } = useApp()

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="mb-6">
        <div className="text-2xl font-bold tracking-tight text-white mb-1">Diminishing Returns</div>
        <div className="text-[11px] text-[#555] max-w-xl leading-5">
          Every substat follows a continuous DR formula:{" "}
          <code className="bg-[#111] px-1.5 py-0.5 text-white">% = Base + Raw / (Raw + Constant)</code>.
          The charts show when stacking more of a stat becomes inefficient.<br />
          I put breakpoints at 25%, 50%, and 80% to show how much raw stat is needed to reach those thresholds.
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {Object.entries(GAME_DATA.CONSTANTS).map(([stat, cData]) => (
          <div key={stat} className="border border-[#222] bg-[#0a0a0a] p-4 min-w-0">
            <div
              className="text-[10px] font-bold uppercase tracking-[1.5px] mb-3"
              style={{ color: accentColor }}
            >
              {stat}
            </div>
            <CurveCanvas stat={stat} constant={cData.c} base={cData.base} accent={accentColor} />
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
                {["Stat","Constant","Base %","50% Requires","Formula"].map(h => (
                  <th key={h} className="text-left text-[9px] uppercase tracking-[0.5px] text-[#444] font-semibold px-2 py-2 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { stat:"Crit",        c:19975, base:5,  need50:16343 },
                { stat:"Haste",       c:19975, base:0,  need50:19975 },
                { stat:"Luck",        c:16230, base:5,  need50:13279 },
                { stat:"Mastery",     c:19975, base:6,  need50:15695 },
                { stat:"Versatility", c:11200, base:0,  need50:11200 },
              ].map(row => (
                <tr key={row.stat} className="border-b border-[#0d0d0d] hover:bg-white/[0.01]">
                  <td className="px-2 py-2 font-bold text-white whitespace-nowrap">{row.stat}</td>
                  <td className="px-2 py-2 text-[#888] whitespace-nowrap">{row.c.toLocaleString()}</td>
                  <td className="px-2 py-2 text-[#888]">{row.base}%</td>
                  <td className="px-2 py-2 whitespace-nowrap" style={{ color: accentColor }}>{row.need50.toLocaleString()} raw</td>
                  <td className="px-2 py-2 text-[#555] font-mono text-[9px] whitespace-nowrap">
                    {row.base}% + R/(R+{row.c.toLocaleString()})
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
