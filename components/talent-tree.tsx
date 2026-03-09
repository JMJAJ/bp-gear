"use client"

import { useMemo } from "react"
import type { TalentTreeData, TalentTreeNode } from "@/lib/talent-tree-parser"

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v))
}

function bounds(nodes: TalentTreeNode[]) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const n of nodes) {
    minX = Math.min(minX, n.x)
    minY = Math.min(minY, n.y)
    maxX = Math.max(maxX, n.x)
    maxY = Math.max(maxY, n.y)
  }
  if (!isFinite(minX)) return { minX: 0, minY: 0, maxX: 0, maxY: 0 }
  return { minX, minY, maxX, maxY }
}

export function TalentTree({
  data,
  selected,
  onToggle,
  accentColor,
  maxPoints,
}: {
  data: TalentTreeData
  selected: string[]
  onToggle: (id: string, next: boolean) => void
  accentColor: string
  maxPoints?: number
}) {
  const selectedSet = useMemo(() => new Set(selected), [selected])
  const { minX, minY, maxX, maxY } = useMemo(() => bounds(data.nodes), [data.nodes])

  // Normalise coordinates into a consistent local canvas.
  const pad = 60
  const width = Math.max(600, (maxX - minX) + pad * 2)
  const height = Math.max(500, (maxY - minY) + pad * 2)

  const nodeMap = useMemo(() => {
    const m = new Map<string, TalentTreeNode>()
    for (const n of data.nodes) m.set(n.id, n)
    return m
  }, [data.nodes])

  const prereq = useMemo(() => {
    const p = new Map<string, string[]>()
    for (const e of data.edges) {
      const arr = p.get(e.to) ?? []
      arr.push(e.from)
      p.set(e.to, arr)
    }
    return p
  }, [data.edges])

  function canSelect(id: string): boolean {
    const req = prereq.get(id)
    if (!req || req.length === 0) return true
    return req.every(r => selectedSet.has(r))
  }

  function isLocked(id: string): boolean {
    return !selectedSet.has(id) && !canSelect(id)
  }

  function canDeselect(id: string): boolean {
    // Cannot deselect if it would invalidate any selected child.
    for (const e of data.edges) {
      if (e.from !== id) continue
      if (selectedSet.has(e.to)) return false
    }
    return true
  }

  const pointCapReached = typeof maxPoints === "number" ? selected.length >= maxPoints : false

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <div className="text-lg font-bold text-white">{data.title} Spec</div>
        {typeof maxPoints === "number" && (
          <div className="text-xs" style={{ color: selected.length > maxPoints ? "#e84545" : "#777" }}>
            <b>{selected.length}</b> / {maxPoints}
          </div>
        )}
      </div>

      <div
        className="relative overflow-auto border border-[#1a1a1a] bg-[#050505]"
        style={{
          width: "100%",
          maxHeight: "70vh",
        }}
      >
        <div
          className="relative"
          style={{ width, height }}
        >
          {/* Edges */}
          <svg
            className="absolute inset-0"
            width={width}
            height={height}
            style={{ pointerEvents: "none" }}
          >
            {data.edges.map((e, i) => {
              const a = nodeMap.get(e.from)
              const b = nodeMap.get(e.to)
              if (!a || !b) return null

              const x1 = (a.x - minX) + pad + 37
              const y1 = (a.y - minY) + pad + 37
              const x2 = (b.x - minX) + pad + 37
              const y2 = (b.y - minY) + pad + 37

              const active = selectedSet.has(e.from) && selectedSet.has(e.to)
              return (
                <line
                  key={i}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={active ? accentColor : "#222"}
                  strokeWidth={active ? 2 : 1}
                  opacity={active ? 0.9 : 0.6}
                />
              )
            })}
          </svg>

          {/* Nodes */}
          {data.nodes.map((n) => {
            const x = (n.x - minX) + pad
            const y = (n.y - minY) + pad

            const selectedNow = selectedSet.has(n.id)
            const locked = isLocked(n.id)
            const canClick = selectedNow ? canDeselect(n.id) : (!locked && !pointCapReached)

            const dim = selectedNow ? 1 : locked ? 0.25 : 0.75
            const borderColor = selectedNow ? accentColor : locked ? "#333" : "#666"
            const bg = selectedNow ? accentColor + "18" : "#070707"

            const iconSize = n.size === "small" ? 28 : 43
            const boxSize = n.size === "small" ? 49 : 71
            const outerSize = 75

            return (
              <button
                key={n.id}
                className="absolute"
                style={{
                  left: x,
                  top: y,
                  width: outerSize,
                  height: outerSize,
                  cursor: canClick ? "pointer" : "not-allowed",
                  opacity: dim,
                }}
                onClick={() => {
                  if (!canClick) return
                  onToggle(n.id, !selectedNow)
                }}
                title={n.id}
              >
                <div
                  className="absolute left-1/2 top-1/2"
                  style={{
                    width: boxSize,
                    height: boxSize,
                    transform: "translate(-50%, -50%)",
                    border: `1px solid ${borderColor}`,
                    background: bg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: n.size === "hex" ? 0 : 2,
                  }}
                >
                  <img
                    src={n.icon}
                    width={iconSize}
                    height={iconSize}
                    alt=""
                    style={{ filter: selectedNow ? "none" : "grayscale(0.4)" }}
                    onError={(e) => {
                      ;(e.target as HTMLImageElement).style.display = "none"
                    }}
                  />
                </div>

                {selectedNow && (
                  <div
                    className="absolute right-0 bottom-0 text-xs font-bold px-1"
                    style={{
                      background: accentColor,
                      color: "#000",
                    }}
                  >
                    1
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Hints */}
      <div className="mt-2 text-xs text-[#555]">
        Prerequisites are auto-derived from node layout. Locked nodes are dimmed.
      </div>
    </div>
  )
}
