"use client"
import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { useApp, getClassForSpec } from "@/lib/app-context"
import {
  MIND_PROJECTIONS,
  SLUMBERING_PROJECTIONS,
  BOND_GENERALS,
  OFFENSIVE_FACTORS,
  DEFENSIVE_FACTORS,
  CLASS_FACTORS,
  parseNodeTree,
  getFactorsForType,
  findFactor,
  normalizeClassName,
  SPEC_PRIORITIES,
  type MindProjection,
  type Factor,
  type PsychoscopeNode,
  type PsychoscopeConfig,
  type FactorSlotConfig,
} from "@/lib/psychoscope-data"

// ── Tab types ──
type MainTab = "mind_projections" | "factors"
type ProjectionCategory = "deep-slumber" | "slumbering-dream"
type FactorTab = "class" | "offensive" | "defensive"

// ── Shared tiny icon ──
function Icon({ src, size = 20, className = "" }: { src: string; size?: number; className?: string }) {
  return (
    <img
      src={src}
      alt=""
      width={size}
      height={size}
      className={`inline-block shrink-0 ${className}`}
      style={{ imageRendering: "auto" }}
      loading="lazy"
    />
  )
}

// ── Pill tab bar ──
function TabBar<T extends string>({
  tabs,
  active,
  onChange,
  accent,
  small,
}: {
  tabs: { id: T; label: string }[]
  active: T
  onChange: (id: T) => void
  accent: string
  small?: boolean
}) {
  return (
    <div className="flex flex-wrap gap-1.5 mb-4">
      {tabs.map(t => {
        const isActive = active === t.id
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            className="transition-all"
            style={{
              fontSize: small ? 9 : 10,
              fontWeight: 700,
              letterSpacing: "0.5px",
              textTransform: "uppercase",
              padding: small ? "3px 8px" : "4px 12px",
              border: `1px solid ${isActive ? accent : "#2a2a2a"}`,
              background: isActive ? `${accent}18` : "transparent",
              color: isActive ? "#fff" : "#666",
              opacity: isActive ? 1 : 0.5,
            }}
          >
            {t.label}
          </button>
        )
      })}
    </div>
  )
}

// ── Factor reference row (for Factors tab) ──
function FactorRow({ f, accent }: { f: Factor; accent: string }) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-[#1a1a1a] last:border-0">
      <Icon src={f.icon} size={28} className="mt-0.5 rounded" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-bold text-white">{f.name}</span>
          {f.skillIcons?.map((si, i) => (
            <Icon key={i} src={si} size={16} className="opacity-80" />
          ))}
        </div>
        <p className="text-[10px] text-[#999] leading-4 mt-0.5">{f.description}</p>
      </div>
    </div>
  )
}

// ── Factor type color helper ──
function getFactorTypeColors(factorType?: string) {
  let bg = "#1a1a1a", fg = "#888"
  if (factorType === "General ATK") { bg = "#2a1515"; fg = "#e84545" }
  if (factorType === "General DEF") { bg = "#152a15"; fg = "#4ade80" }
  if (factorType === "Class-Exclusive") { bg = "#1a1a2a"; fg = "#8b5cf6" }
  if (factorType === "Class DEF") { bg = "#152020"; fg = "#22d3ee" }
  if (factorType === "Class Rhapsody") { bg = "#2a2a15"; fg = "#eab308" }
  return { bg, fg }
}

// ── Interactive Factor Slot ──
function FactorSlot({
  node,
  slot,
  assigned,
  available,
  isOpen,
  onToggle,
  onSelect,
  onGradeChange,
  accent,
}: {
  node: PsychoscopeNode
  slot: FactorSlotConfig
  assigned: Factor | undefined
  available: Factor[]
  isOpen: boolean
  onToggle: () => void
  onSelect: (name: string) => void
  onGradeChange: (g: number) => void
  accent: string
}) {
  const { bg, fg } = getFactorTypeColors(node.factorType)

  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className="flex items-center gap-1.5 px-2 py-1.5 rounded border transition-all hover:brightness-125"
        style={{
          background: bg,
          borderColor: assigned ? fg : `${fg}44`,
          minWidth: assigned ? 150 : 120,
        }}
      >
        {assigned ? (
          <>
            <Icon src={assigned.icon} size={18} className="rounded shrink-0" />
            <span className="text-[9px] font-bold text-white truncate max-w-[90px]">
              {assigned.name}
            </span>
            <span
              className="text-[8px] font-bold ml-auto shrink-0 px-1 py-0.5 rounded"
              style={{ background: `${accent}22`, color: accent }}
            >
              G{slot.grade}
            </span>
          </>
        ) : (
          <span
            className="text-[9px] font-bold uppercase tracking-[0.5px]"
            style={{ color: fg }}
          >
            + {node.factorType}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          className="absolute z-50 mt-1 left-0 w-72 max-h-64 overflow-y-auto bg-[#111] border border-[#2a2a2a] rounded shadow-2xl"
          style={{ minWidth: 240 }}
        >
          {/* Grade selector (when assigned) */}
          {assigned && (
            <div className="flex items-center gap-1.5 px-2 py-2 border-b border-[#1a1a1a]">
              <span className="text-[9px] text-[#666] uppercase">Grade:</span>
              <div className="flex gap-0.5">
                {Array.from({ length: 10 }, (_, i) => i + 1).map(g => (
                  <button
                    key={g}
                    onClick={(e) => { e.stopPropagation(); onGradeChange(g) }}
                    className="w-5 h-5 text-[8px] font-bold rounded transition-all"
                    style={{
                      background: slot.grade === g ? accent : "#1a1a1a",
                      color: slot.grade === g ? "#000" : "#666",
                      border: `1px solid ${slot.grade === g ? accent : "#333"}`,
                    }}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Unassign option */}
          <button
            className="w-full text-left px-2 py-1.5 text-[9px] text-[#666] hover:bg-[#1a1a1a] border-b border-[#0a0a0a]"
            onClick={() => onSelect("")}
          >
            — Remove —
          </button>

          {/* Factor list */}
          {available.map(f => (
            <button
              key={f.name}
              className="w-full text-left flex items-center gap-2 px-2 py-1.5 hover:bg-[#1a1a1a] border-b border-[#0a0a0a] last:border-0"
              onClick={() => onSelect(f.name)}
            >
              <Icon src={f.icon} size={20} className="rounded shrink-0" />
              <div className="min-w-0">
                <div className="text-[9px] font-bold text-white">{f.name}</div>
                <div className="text-[8px] text-[#555] truncate">{f.description}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Arrow connector component ──
function ArrowDown({ color = "#333" }: { color?: string }) {
  return (
    <svg width="20" height="24" viewBox="0 0 20 24" className="mx-auto block">
      <path
        d="M10 0 L10 24"
        stroke={color}
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  )
}

function ArrowSplit({ leftColor = "#333", rightColor = "#333", middleColor = "#333", hasMiddle = false }: { leftColor?: string; rightColor?: string; middleColor?: string; hasMiddle?: boolean }) {
  return (
    <svg width="300" height="40" viewBox="0 0 300 40" className="mx-auto">
      {/* Left branch line */}
      <path d="M150 0 L150 12 L50 12 L50 32" stroke={leftColor} strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* Right branch line */}
      <path d="M150 0 L150 12 L250 12 L250 32" stroke={rightColor} strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* Middle branch line (optional) */}
      {hasMiddle && <path d="M150 0 L150 32" stroke={middleColor} strokeWidth="2" fill="none" strokeLinecap="round" />}
      {/* Left arrowhead */}
      <path d="M44 26 L50 32 L56 26" stroke={leftColor} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {/* Middle arrowhead (optional) */}
      {hasMiddle && <path d="M144 26 L150 32 L156 26" stroke={middleColor} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />}
      {/* Right arrowhead */}
      <path d="M244 26 L250 32 L256 26" stroke={rightColor} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}


function ArrowMerge({ leftColor = "#333", rightColor = "#333", middleColor = "#333", hasMiddle = false }: { leftColor?: string; rightColor?: string; middleColor?: string; hasMiddle?: boolean }) {
  return (
    <svg width="300" height="32" viewBox="0 0 300 32" className="mx-auto block">
      {/* Left branch line */}
      <path d="M50 0 L50 16 L150 16 L150 32" stroke={leftColor} strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* Right branch line */}
      <path d="M250 0 L250 16 L150 16 L150 32" stroke={rightColor} strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* Middle branch line (optional) */}
      {hasMiddle && <path d="M150 0 L150 32" stroke={middleColor} strokeWidth="2" fill="none" strokeLinecap="round" />}
      {/* Center arrowhead */}
      <path d="M144 26 L150 32 L156 26" stroke={hasMiddle ? middleColor : leftColor} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ── Interactive Node Tree (Deep-Slumber builder) ──
function InteractiveTree({
  projection,
  config,
  className,
  accent,
  onBranchChange,
  onFactorChange,
}: {
  projection: MindProjection
  config: PsychoscopeConfig
  className: string
  accent: string
  onBranchChange: (idx: number, choice: "left" | "right" | "none") => void
  onFactorChange: (slotIdx: number, factorName: string, grade: number) => void
}) {
  const rows = useMemo(() => parseNodeTree(projection.nodes), [projection.nodes])
  const [openSlot, setOpenSlot] = useState<number | null>(null)
  const treeRef = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (treeRef.current && !treeRef.current.contains(e.target as Node)) {
        setOpenSlot(null)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  let branchIdx = 0
  let slotIdx = 0

  // Determine branch colors based on selection
  const getBranchColor = (idx: number, side: "left" | "right") => {
    const choice = config.branches[idx] ?? "none"
    if (choice === "none" || choice !== side) return "#333"
    return side === "left" ? "#e5c229" : "#49A8FF"
  }

  // Get color for middle branch (always show as accent color for now)
  const getMiddleColor = (idx: number) => {
    return "#d054e3" // Purple for middle branch
  }

  return (
    <div ref={treeRef} className="flex flex-col items-center">
      {rows.map((row, ri) => {
        const isLast = ri === rows.length - 1
        const nextRow = rows[ri + 1]

        // ── Root / Final skill node ──
        if (row.type === "root" || row.type === "final") {
          const n = row.nodes[0]
          const isFinal = row.type === "final"
          return (
            <div key={ri} className="flex flex-col items-center">
              <div
                className="flex items-center gap-3 px-6 py-3 border-2 rounded-lg"
                style={{ borderColor: accent, background: `${accent}15`, minWidth: 200 }}
              >
                {n.icon && <Icon src={n.icon} size={32} className="rounded" />}
                <span className="text-[12px] font-bold text-white">{n.name}</span>
              </div>
              {/* Arrow to next row */}
              {!isLast && nextRow?.type === "branch" && (
                <ArrowSplit
                  leftColor={getBranchColor(branchIdx, "left")}
                  rightColor={getBranchColor(branchIdx, "right")}
                  middleColor={getMiddleColor(branchIdx)}
                  hasMiddle={nextRow.nodes.length === 3}
                />
              )}
              {/* Arrow to final node */}
              {!isLast && nextRow?.type === "final" && <ArrowDown color={accent} />}
              {/* Final node indicator */}
              {isFinal && (
                <div className="mt-1 text-[8px] uppercase tracking-[1px] text-[#444]">End</div>
              )}
            </div>
          )
        }

        // ── Branch (clickable left / middle / right) ──
        if (row.type === "branch") {
          const idx = branchIdx
          const choice = config.branches[idx] ?? "none"
          const currentBranchIdx = branchIdx++
          const hasMiddle = row.nodes.length === 3
          const isSolo = row.nodes.length === 1
          
          return (
            <div key={ri} className="flex flex-col items-center w-full">
              <div className="flex items-start justify-center gap-8 w-full px-4">
                {row.nodes.map((n, ni) => {
                  const side = n.branch as "left" | "middle" | "right"
                  const isLeftOrRight = side === "left" || side === "right"
                  const sel = isLeftOrRight && choice === side
                  
                  // Determine colors based on branch position
                  let borderColor = "#333"
                  let bgColor = "#0a0a0a"
                  let opacity = 0.4
                  
                  if (side === "middle") {
                    // Middle branch - always purple, not selectable
                    borderColor = "#d054e3"
                    bgColor = "#d054e315"
                    opacity = 1
                  } else if (sel) {
                    borderColor = side === "left" ? "#e5c229" : "#49A8FF"
                    bgColor = side === "left" ? "#e5c22915" : "#49A8FF15"
                    opacity = 1
                  }
                  
                  // Handle click: toggle off if already selected, otherwise select
                  const handleClick = () => {
                    if (!isLeftOrRight) return
                    if (choice === side) {
                      onBranchChange(currentBranchIdx, "none")
                    } else {
                      onBranchChange(currentBranchIdx, side as "left" | "right")
                    }
                  }
                  
                  return (
                    <button
                      key={ni}
                      onClick={handleClick}
                      className="flex items-center gap-3 px-5 py-3 border-2 rounded-lg transition-all"
                      style={{
                        borderColor,
                        background: bgColor,
                        opacity,
                        minWidth: 180,
                        cursor: isLeftOrRight ? "pointer" : "default",
                      }}
                    >
                      {n.icon && <Icon src={n.icon} size={28} className="rounded" />}
                      <span className="text-[11px] font-bold text-white">{n.name}</span>
                    </button>
                  )
                })}
              </div>
              {/* Arrow to next row - positioned under each branch node */}
              {!isLast && nextRow?.type === "factors" && (
                <div className="flex justify-center gap-5 w-full px-4">
                  {row.nodes.map((n, ni) => {
                    const side = n.branch as "left" | "middle" | "right"
                    const color = side === "middle" 
                      ? getMiddleColor(currentBranchIdx) 
                      : getBranchColor(currentBranchIdx, side as "left" | "right")
                    return (
                      <div key={ni} style={{ minWidth: 180 }} className="flex justify-center">
                        <ArrowDown color={color} />
                      </div>
                    )
                  })}
                </div>
              )}
              {/* Arrow from branch to final node */}
              {!isLast && nextRow?.type === "final" && (
                <ArrowMerge
                  leftColor={getBranchColor(currentBranchIdx, "left")}
                  rightColor={getBranchColor(currentBranchIdx, "right")}
                  middleColor={getMiddleColor(currentBranchIdx)}
                  hasMiddle={hasMiddle}
                />
              )}
            </div>
          )
        }

        // ── Factor slots (clickable assignment) ──
        if (row.type === "factors") {
          const startSlot = slotIdx
          slotIdx += row.nodes.length
          const prevRow = rows[ri - 1]
          const prevWasBranch = prevRow?.type === "branch"
          const prevBranchIdx = branchIdx > 0 ? branchIdx - 1 : 0
          const prevHasMiddle = prevWasBranch && prevRow.nodes.length === 3

          return (
            <div key={ri} className="flex flex-col items-center w-full">
              {/* Merge arrow from previous branch */}
              {prevWasBranch && (
                <ArrowMerge
                  leftColor={getBranchColor(prevBranchIdx, "left")}
                  rightColor={getBranchColor(prevBranchIdx, "right")}
                  middleColor={getMiddleColor(prevBranchIdx)}
                  hasMiddle={prevHasMiddle}
                />
              )}
              <div
                className="flex flex-wrap items-start justify-center gap-3 py-2 px-4"
              >
                {row.nodes.map((n, ni) => {
                  const si = startSlot + ni
                  const slot = config.factorSlots[si] ?? { factorName: "", grade: 1 }
                  const assigned = slot.factorName
                    ? findFactor(slot.factorName, className)
                    : undefined
                  const available = getFactorsForType(n.factorType ?? "", className)
                  return (
                    <FactorSlot
                      key={ni}
                      node={n}
                      slot={slot}
                      assigned={assigned}
                      available={available}
                      isOpen={openSlot === si}
                      onToggle={() => setOpenSlot(openSlot === si ? null : si)}
                      onSelect={(name) => {
                        onFactorChange(si, name, slot.grade)
                        setOpenSlot(null)
                      }}
                      onGradeChange={(g) => onFactorChange(si, slot.factorName, g)}
                      accent={accent}
                    />
                  )
                })}
              </div>
              {/* Arrow to next row */}
              {!isLast && nextRow?.type === "branch" && (
                <ArrowSplit
                  leftColor={getBranchColor(branchIdx, "left")}
                  rightColor={getBranchColor(branchIdx, "right")}
                  middleColor={getMiddleColor(branchIdx)}
                  hasMiddle={nextRow.nodes.length === 3}
                />
              )}
              {/* Arrow to final node */}
              {!isLast && nextRow?.type === "final" && <ArrowDown color={accent} />}
            </div>
          )
        }

        return null
      })}
    </div>
  )
}

// ── Read-Only Node Tree (Slumbering Dream) ──
function ReadOnlyTree({ nodes, accent }: { nodes: PsychoscopeNode[]; accent: string }) {
  if (nodes.length === 0) {
    return (
      <p className="text-[10px] text-[#555] italic py-4">
        Node tree data not yet available for this projection.
      </p>
    )
  }
  const rows = parseNodeTree(nodes)
  return (
    <div className="flex flex-col items-center">
      {rows.map((row, ri) => {
        const isLast = ri === rows.length - 1
        const nextRow = rows[ri + 1]

        if (row.type === "root" || row.type === "final") {
          const n = row.nodes[0]
          const isFinal = row.type === "final"
          return (
            <div key={ri} className="flex flex-col items-center">
              <div
                className="flex items-center gap-3 px-6 py-3 border-2 rounded-lg"
                style={{ borderColor: accent, background: `${accent}15`, minWidth: 200 }}
              >
                {n.icon && <Icon src={n.icon} size={32} className="rounded" />}
                <span className="text-[12px] font-bold text-white">{n.name}</span>
              </div>
              {!isLast && nextRow?.type === "branch" && (
                <ArrowSplit hasMiddle={nextRow.nodes.length === 3} />
              )}
              {!isLast && nextRow?.type !== "branch" && <ArrowDown color={accent} />}
              {/* Final node indicator */}
              {isFinal && (
                <div className="mt-1 text-[8px] uppercase tracking-[1px] text-[#444]">End</div>
              )}
            </div>
          )
        }
        if (row.type === "branch") {
          const hasMiddle = row.nodes.length === 3
          return (
            <div key={ri} className="flex flex-col items-center w-full">
              <div className="flex items-start justify-center gap-8 w-full px-4">
                {row.nodes.map((n, ni) => {
                  const side = n.branch
                  let borderColor = accent
                  let bgColor = "#0a0a0a"
                  
                  if (side === "left") {
                    borderColor = "#e5c229"
                    bgColor = "#e5c22915"
                  } else if (side === "right") {
                    borderColor = "#49A8FF"
                    bgColor = "#49A8FF15"
                  } else if (side === "middle") {
                    borderColor = "#d054e3"
                    bgColor = "#d054e315"
                  }
                  
                  return (
                    <div
                      key={ni}
                      className="flex items-center gap-3 px-5 py-3 border-2 rounded-lg"
                      style={{
                        borderColor,
                        background: bgColor,
                        minWidth: 180,
                      }}
                    >
                      {n.icon && <Icon src={n.icon} size={28} className="rounded" />}
                      <span className="text-[11px] font-bold text-white">{n.name}</span>
                    </div>
                  )
                })}
              </div>
              {/* Arrow to next row - positioned under each branch node */}
              {!isLast && nextRow?.type === "factors" && (
                <div className="flex justify-center gap-8 w-full px-4">
                  {row.nodes.map((n, ni) => {
                    const side = n.branch
                    let color = "#333"
                    if (side === "left") color = "#e5c229"
                    else if (side === "right") color = "#49A8FF"
                    else if (side === "middle") color = "#d054e3"
                    return (
                      <div key={ni} style={{ minWidth: 180 }} className="flex justify-center">
                        <ArrowDown color={color} />
                      </div>
                    )
                  })}
                </div>
              )}
              {/* Arrow from branch to final node */}
              {!isLast && nextRow?.type === "final" && (
                <ArrowMerge hasMiddle={hasMiddle} />
              )}
            </div>
          )
        }
        if (row.type === "factors") {
          const prevRow = rows[ri - 1]
          const prevWasBranch = prevRow?.type === "branch"
          const prevHasMiddle = prevWasBranch && prevRow.nodes.length === 3
          return (
            <div key={ri} className="flex flex-col items-center w-full">
              {prevWasBranch && <ArrowMerge hasMiddle={prevHasMiddle} />}
              <div
                className="flex flex-wrap items-center justify-center gap-2 py-2 px-4"
              >
                {row.nodes.map((n, ni) => {
                  const { bg, fg } = getFactorTypeColors(n.factorType)
                  return (
                    <span
                      key={ni}
                      className="text-[9px] font-bold uppercase tracking-[0.5px] px-3 py-1.5 rounded border"
                      style={{ background: bg, color: fg, borderColor: `${fg}44` }}
                    >
                      {n.factorType}
                    </span>
                  )
                })}
              </div>
              {!isLast && nextRow?.type === "branch" && (
                <ArrowSplit hasMiddle={nextRow.nodes.length === 3} />
              )}
              {/* Arrow to final node */}
              {!isLast && nextRow?.type === "final" && <ArrowDown color={accent} />}
            </div>
          )
        }
        return null
      })}
    </div>
  )
}

// ── Projection Card ──
function ProjectionCard({
  proj,
  accent,
  config,
  className,
  onBranchChange,
  onFactorChange,
  interactive,
}: {
  proj: MindProjection
  accent: string
  config?: PsychoscopeConfig
  className?: string
  onBranchChange?: (idx: number, choice: "left" | "right" | "none") => void
  onFactorChange?: (slotIdx: number, factorName: string, grade: number) => void
  interactive: boolean
}) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-[12px] font-bold text-white tracking-[1px] uppercase">
          {proj.name}
        </h3>
        <span className="text-[9px] text-[#666]">{proj.unlock}</span>
      </div>

      <div className="border border-[#1a1a1a] bg-[#060606] rounded-lg p-6 overflow-x-auto">
        <div className="text-[10px] uppercase tracking-[1px] text-[#444] mb-4 text-center">
          {interactive ? "Node Tree Builder" : "Node Tree"}
        </div>
        {interactive && config && className && onBranchChange && onFactorChange ? (
          <InteractiveTree
            projection={proj}
            config={config}
            className={className}
            accent={accent}
            onBranchChange={onBranchChange}
            onFactorChange={onFactorChange}
          />
        ) : (
          <ReadOnlyTree nodes={proj.nodes} accent={accent} />
        )}
      </div>

      {proj.bondExclusive && (
        <div className="border border-[#1a1a1a] bg-[#060606] rounded p-3">
          <div className="text-[9px] uppercase tracking-[1px] text-[#444] mb-2">
            Exclusive Bond Effect
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold" style={{ color: accent }}>
              {proj.bondExclusive}
            </span>
            <span className="text-[9px] text-[#555]">
              (at {proj.bondExclusiveUnlock} Bond Points)
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Bond Level Summary ──
function BondSummary({ accent, activeProjection }: { accent: string; activeProjection?: MindProjection }) {
  return (
    <div className="border border-[#1a1a1a] bg-[#060606] rounded p-3 mb-4">
      {/* Active Deep-Slumber indicator */}
      {activeProjection && (
        <div className="mb-3 pb-3 border-b border-[#1a1a1a]">
          <div className="flex items-center gap-2">
            <div 
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ background: accent }}
            />
            <span className="text-[9px] uppercase tracking-[1px] text-[#444]">
              Active Deep-Slumber
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            {activeProjection.nodes[0]?.icon && (
              <Icon src={activeProjection.nodes[0].icon} size={20} className="rounded" />
            )}
            <span className="text-[11px] font-bold text-white">{activeProjection.name}</span>
          </div>
        </div>
      )}
      <div className="text-[9px] uppercase tracking-[1px] text-[#444] mb-2">
        General Bond Effects
      </div>
      <div className="space-y-1.5">
        {BOND_GENERALS.map((b, i) => (
          <div key={i} className="flex items-start gap-2">
            <span
              className="text-[9px] font-bold shrink-0 px-1.5 py-0.5 rounded"
              style={{ background: `${accent}22`, color: accent }}
            >
              Lvl {b.level}
            </span>
            <span className="text-[10px] text-[#999] leading-4">{b.effect}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main Psychoscope Component ──
export function PsychoscopeSection() {
  const { accentColor, spec, psychoscopeConfig, setPsychoscopeConfig } = useApp()
  const className = normalizeClassName(getClassForSpec(spec))

  const [mainTab, setMainTab] = useState<MainTab>("mind_projections")
  const [projCat, setProjCat] = useState<ProjectionCategory>("deep-slumber")
  const [factorTab, setFactorTab] = useState<FactorTab>("class")
  const [classIdx, setClassIdx] = useState(0)
  const [slumberIdx, setSlumberIdx] = useState(0)

  const deepSlumber = MIND_PROJECTIONS.filter(p => p.category === "deep-slumber")
  const slumbering = SLUMBERING_PROJECTIONS

  // Active projection from config
  const activeProj =
    deepSlumber.find(p => p.id === psychoscopeConfig.projectionId) ?? deepSlumber[0]
  const activeSlumber = slumbering[slumberIdx] ?? slumbering[0]

  // Spec priority / recommended build
  const priority = SPEC_PRIORITIES[spec]

  const handleSelectProjection = useCallback(
    (id: string) => {
      setPsychoscopeConfig({ ...psychoscopeConfig, projectionId: id })
    },
    [psychoscopeConfig, setPsychoscopeConfig],
  )

  const handleBranchChange = useCallback(
    (idx: number, choice: "left" | "right" | "none") => {
      const next = { ...psychoscopeConfig, branches: [...psychoscopeConfig.branches] }
      next.branches[idx] = choice
      setPsychoscopeConfig(next)
    },
    [psychoscopeConfig, setPsychoscopeConfig],
  )

  const handleFactorChange = useCallback(
    (slotIdx: number, factorName: string, grade: number) => {
      const next = {
        ...psychoscopeConfig,
        factorSlots: [...psychoscopeConfig.factorSlots],
      }
      next.factorSlots[slotIdx] = { factorName, grade }
      setPsychoscopeConfig(next)
    },
    [psychoscopeConfig, setPsychoscopeConfig],
  )

  const handleLoadRecommended = useCallback(() => {
    if (!priority) return
    setPsychoscopeConfig({
      projectionId: priority.projectionId,
      branches: [...priority.branches],
      factorSlots: priority.factors.map(f => ({ ...f })),
    })
  }, [priority, setPsychoscopeConfig])

  const handleClearAll = useCallback(() => {
    setPsychoscopeConfig({
      ...psychoscopeConfig,
      branches: ["left", "left", "left", "left"],
      factorSlots: Array.from({ length: 10 }, () => ({ factorName: "", grade: 1 })),
    })
  }, [psychoscopeConfig, setPsychoscopeConfig])

  const activeCls = CLASS_FACTORS[classIdx] ?? CLASS_FACTORS[0]

  return (
    <div className="space-y-4">
      {/* Main tabs */}
      <TabBar
        tabs={[
          { id: "mind_projections" as MainTab, label: "Mind Projections" },
          { id: "factors" as MainTab, label: "Factors" },
        ]}
        active={mainTab}
        onChange={setMainTab}
        accent={accentColor}
      />

      {/* ── MIND PROJECTIONS ── */}
      {mainTab === "mind_projections" && (
        <div className="space-y-4">
          {/* Category tabs */}
          <TabBar
            tabs={[
              { id: "deep-slumber" as ProjectionCategory, label: "Deep-Slumber" },
              { id: "slumbering-dream" as ProjectionCategory, label: "Slumbering Dream" },
            ]}
            active={projCat}
            onChange={setProjCat}
            accent={accentColor}
            small
          />

          {/* ── Deep-Slumber (Interactive Builder) ── */}
          {projCat === "deep-slumber" && (
            <div className="space-y-4">
              <BondSummary accent={accentColor} activeProjection={activeProj} />

              {/* Spec info + action buttons */}
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-[9px] text-[#666] uppercase tracking-[1px]">
                  Spec: <span className="text-white font-bold">{spec}</span>
                  {className && <> ({className})</>}
                </span>
                {priority && (
                  <button
                    onClick={handleLoadRecommended}
                    className="text-[9px] font-bold uppercase tracking-[0.5px] px-3 py-1 rounded border transition-all hover:brightness-125"
                    style={{
                      borderColor: accentColor,
                      color: accentColor,
                      background: `${accentColor}15`,
                    }}
                  >
                    Load Recommended
                  </button>
                )}
                <button
                  onClick={handleClearAll}
                  className="text-[9px] font-bold uppercase tracking-[0.5px] px-3 py-1 rounded border border-[#333] text-[#666] hover:text-[#999] transition-all"
                >
                  Clear All
                </button>
              </div>

              {priority?.note && (
                <div className="text-[9px] text-[#555] italic leading-4 px-1">
                  {priority.note}
                </div>
              )}

              {/* Projection selector */}
              <TabBar
                tabs={deepSlumber.map(p => ({ id: p.id, label: p.name }))}
                active={psychoscopeConfig.projectionId}
                onChange={handleSelectProjection}
                accent={accentColor}
                small
              />

              {/* Interactive tree */}
              <ProjectionCard
                proj={activeProj}
                accent={accentColor}
                config={psychoscopeConfig}
                className={className}
                onBranchChange={handleBranchChange}
                onFactorChange={handleFactorChange}
                interactive
              />
            </div>
          )}

          {/* ── Slumbering Dream (Read-Only) ── */}
          {projCat === "slumbering-dream" && (
            <div className="space-y-4">
              <TabBar
                tabs={slumbering.map((p, i) => ({ id: String(i), label: p.name }))}
                active={String(slumberIdx)}
                onChange={(id) => setSlumberIdx(Number(id))}
                accent={accentColor}
                small
              />
              <ProjectionCard
                proj={activeSlumber}
                accent={accentColor}
                interactive={false}
              />
            </div>
          )}
        </div>
      )}

      {/* ── FACTORS (Reference) ── */}
      {mainTab === "factors" && (
        <div className="space-y-4">
          <TabBar
            tabs={[
              { id: "class" as FactorTab, label: "Class Exclusive" },
              { id: "offensive" as FactorTab, label: "Offensive (Polarity)" },
              { id: "defensive" as FactorTab, label: "Defensive (Stasis)" },
            ]}
            active={factorTab}
            onChange={setFactorTab}
            accent={accentColor}
          />

          {/* ── Class Exclusive Factors ── */}
          {factorTab === "class" && (
            <div className="space-y-3">
              <TabBar
                tabs={CLASS_FACTORS.map((c, i) => ({ id: String(i), label: c.className }))}
                active={String(classIdx)}
                onChange={(id) => setClassIdx(Number(id))}
                accent={accentColor}
                small
              />
              <div className="border border-[#1a1a1a] bg-[#060606] rounded p-3">
                <div className="text-[9px] uppercase tracking-[1px] text-[#444] mb-2">
                  {activeCls.className} — Class Exclusive (X1–X11)
                </div>
                {activeCls.factors.map((f, i) => (
                  <FactorRow key={i} f={f} accent={accentColor} />
                ))}
              </div>
              {activeCls.stasis.length > 0 && (
                <div className="border border-[#1a1a1a] bg-[#060606] rounded p-3">
                  <div className="text-[9px] uppercase tracking-[1px] text-[#444] mb-2">
                    {activeCls.className} — Class Stasis
                  </div>
                  {activeCls.stasis.map((f, i) => (
                    <FactorRow key={i} f={f} accent={accentColor} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Offensive Factors ── */}
          {factorTab === "offensive" && (
            <div className="border border-[#1a1a1a] bg-[#060606] rounded p-3">
              <div className="text-[9px] uppercase tracking-[1px] text-[#444] mb-2">
                Offensive — Polarity (X1–X11)
              </div>
              <p className="text-[9px] text-[#555] mb-3 leading-4">
                Polarity factors trade one substat for another. At G10, they provide
                flat % boosts instead of raw values. All values shown are at G10.
              </p>
              {OFFENSIVE_FACTORS.map((f, i) => (
                <FactorRow key={i} f={f} accent={accentColor} />
              ))}
            </div>
          )}

          {/* ── Defensive Factors ── */}
          {factorTab === "defensive" && (
            <div className="border border-[#1a1a1a] bg-[#060606] rounded p-3">
              <div className="text-[9px] uppercase tracking-[1px] text-[#444] mb-2">
                Defensive — Stasis (X1–X9)
              </div>
              <p className="text-[9px] text-[#555] mb-3 leading-4">
                Stasis factors provide defensive bonuses including HP, Armor,
                Resistance, and survival mechanics. All values shown are at G10.
              </p>
              {DEFENSIVE_FACTORS.map((f, i) => (
                <FactorRow key={i} f={f} accent={accentColor} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
