"use client"

import { useMemo, useState } from "react"
import type {
  GeneratedTalentTreeData,
  GuideTalentTreeNode,
  GuideTalentTreeTab,
  TalentTreeData,
  TalentTreeNode,
} from "@/lib/talent-tree-parser"

function bounds(nodes: TalentTreeNode[]) {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  for (const node of nodes) {
    minX = Math.min(minX, node.x)
    minY = Math.min(minY, node.y)
    maxX = Math.max(maxX, node.x)
    maxY = Math.max(maxY, node.y)
  }

  if (!isFinite(minX)) return { minX: 0, minY: 0, maxX: 0, maxY: 0 }
  return { minX, minY, maxX, maxY }
}

function getGeneratedNodeDiameter(node: TalentTreeNode): number {
  if (node.size === "hex") return 86
  if (node.size === "large") return 68
  return 44
}

function getGeneratedIconSize(node: TalentTreeNode): number {
  if (node.size === "hex") return 48
  if (node.size === "large") return 34
  return 20
}

function normalizeColor(value: string): string {
  return value || "rgb(255, 255, 255)"
}

function GeneratedTree({
  data,
  selected,
  onToggle,
  accentColor,
}: {
  data: GeneratedTalentTreeData
  selected: string[]
  onToggle: (id: string, next: boolean) => void
  accentColor: string
}) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const selectedSet = useMemo(() => new Set(selected), [selected])
  const nodeMap = useMemo(() => new Map(data.nodes.map((node) => [node.id, node])), [data.nodes])
  const prereq = useMemo(() => {
    const map = new Map<string, string[]>()
    for (const edge of data.edges) {
      const existing = map.get(edge.to) ?? []
      existing.push(edge.from)
      map.set(edge.to, existing)
    }
    return map
  }, [data.edges])
  const { minX, minY, maxX, maxY } = useMemo(() => bounds(data.nodes), [data.nodes])

  const padX = 108
  const padY = 96
  const width = Math.max(860, maxX - minX + padX * 2)
  const height = Math.max(980, maxY - minY + padY * 2)

  function canSelect(id: string): boolean {
    const parents = prereq.get(id)
    if (!parents || parents.length === 0) return true

    return parents.every((parentId) => {
      const parent = nodeMap.get(parentId)
      if (parent?.selectable === false) return true
      return selectedSet.has(parentId)
    })
  }

  function canDeselect(id: string): boolean {
    for (const edge of data.edges) {
      if (edge.from !== id) continue
      if (selectedSet.has(edge.to)) return false
    }
    return true
  }

  function isLocked(id: string): boolean {
    return !selectedSet.has(id) && !canSelect(id)
  }

  const firstSelectableNode = data.nodes.find((node) => node.selectable !== false)
  const activeNodeId = hoveredId ?? selected[selected.length - 1] ?? firstSelectableNode?.id ?? null
  const activeNode = activeNodeId ? nodeMap.get(activeNodeId) : null

  return (
    <div
      className="overflow-hidden rounded-[24px] border"
      style={{ borderColor: data.theme.border, background: data.theme.panel }}
    >
      <div className="relative">
        <div className="absolute inset-0" style={{ background: data.theme.background }} />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_34%)] opacity-70" />

        <div className="relative grid lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="border-b lg:border-b-0 lg:border-r" style={{ borderColor: `${data.theme.border}80` }}>
            <div className="flex items-center justify-between px-4 py-3 backdrop-blur-sm">
              <div>
                <div className="text-[11px] uppercase tracking-[0.26em] text-[#b7a49f]">Talent Planner</div>
                <div className="text-lg font-semibold text-white">{data.title}</div>
              </div>
              <div className="text-right text-xs text-[#d9c0b8]">
                <div className="font-semibold text-white">{selected.length} selected</div>
                <div>Connected talents unlock downward.</div>
              </div>
            </div>

            <div className="relative overflow-auto px-4 pb-4">
              <div className="relative min-h-[820px]" style={{ width, height }}>
                <svg className="absolute inset-0" width={width} height={height} style={{ pointerEvents: "none" }}>
                  {data.edges.map((edge, index) => {
                    const from = nodeMap.get(edge.from)
                    const to = nodeMap.get(edge.to)
                    if (!from || !to) return null

                    const fromDiameter = getGeneratedNodeDiameter(from)
                    const toDiameter = getGeneratedNodeDiameter(to)
                    const x1 = from.x - minX + padX + fromDiameter / 2
                    const y1 = from.y - minY + padY + fromDiameter / 2
                    const x2 = to.x - minX + padX + toDiameter / 2
                    const y2 = to.y - minY + padY + toDiameter / 2
                    const edgeActive = selectedSet.has(edge.to) && (from.selectable === false || selectedSet.has(edge.from))
                    const edgeReachable = from.selectable === false || selectedSet.has(edge.from)

                    return (
                      <line
                        key={`${edge.from}-${edge.to}-${index}`}
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke={edgeActive ? accentColor : edgeReachable ? "#8d6557" : "#3a2d2a"}
                        strokeWidth={edgeActive ? 3 : edgeReachable ? 2 : 1.5}
                        strokeOpacity={edgeActive ? 0.95 : edgeReachable ? 0.72 : 0.45}
                      />
                    )
                  })}
                </svg>

                {data.nodes.map((node) => {
                  const diameter = getGeneratedNodeDiameter(node)
                  const iconSize = getGeneratedIconSize(node)
                  const x = node.x - minX + padX
                  const y = node.y - minY + padY
                  const selectedNow = selectedSet.has(node.id)
                  const locked = node.selectable !== false && isLocked(node.id)
                  const clickable = node.selectable !== false && (selectedNow ? canDeselect(node.id) : !locked)
                  const highlighted = activeNodeId === node.id
                  const borderColor = node.selectable === false
                    ? "#f1e5df"
                    : selectedNow
                      ? accentColor
                      : locked
                        ? "#5c514f"
                        : "#f1e5df"
                  const fillColor = node.selectable === false
                    ? "rgba(228, 122, 88, 0.32)"
                    : selectedNow
                      ? "rgba(228, 122, 88, 0.26)"
                      : locked
                        ? "rgba(8, 10, 16, 0.92)"
                        : "rgba(20, 18, 24, 0.82)"

                  return (
                    <button
                      key={node.id}
                      type="button"
                      className="absolute transition-transform duration-150"
                      style={{
                        left: x,
                        top: y,
                        width: diameter,
                        height: diameter,
                        cursor: clickable ? "pointer" : "default",
                        transform: highlighted ? "translateY(-2px) scale(1.03)" : "none",
                        opacity: locked ? 0.54 : 1,
                      }}
                      onClick={() => {
                        if (!clickable) return
                        onToggle(node.id, !selectedNow)
                      }}
                      onMouseEnter={() => setHoveredId(node.id)}
                      onMouseLeave={() => setHoveredId((current) => (current === node.id ? null : current))}
                      title={node.name}
                    >
                      {node.size === "hex" ? (
                        <svg width={diameter} height={diameter} viewBox={`0 0 ${diameter} ${diameter}`}>
                          <polygon
                            points={`${diameter * 0.5},2 ${diameter * 0.9},${diameter * 0.25} ${diameter * 0.9},${diameter * 0.75} ${diameter * 0.5},${diameter - 2} ${diameter * 0.1},${diameter * 0.75} ${diameter * 0.1},${diameter * 0.25}`}
                            fill={fillColor}
                            stroke={borderColor}
                            strokeWidth={highlighted ? 2.5 : 1.6}
                          />
                        </svg>
                      ) : (
                        <div
                          className="absolute inset-0"
                          style={{
                            borderRadius: node.size === "small" ? 999 : 18,
                            border: `${highlighted ? 2.5 : 1.6}px solid ${borderColor}`,
                            background: fillColor,
                            boxShadow: highlighted || selectedNow ? `0 0 24px ${accentColor}40` : "none",
                          }}
                        />
                      )}

                      <div className="absolute inset-0 flex items-center justify-center">
                        <img
                          src={node.icon}
                          width={iconSize}
                          height={iconSize}
                          alt={node.name ?? "Talent node"}
                          style={{ filter: locked ? "grayscale(0.8) brightness(0.82)" : "none" }}
                          onError={(event) => {
                            event.currentTarget.style.display = "none"
                          }}
                        />
                      </div>

                      {selectedNow && node.selectable !== false && (
                        <div
                          className="absolute -bottom-1 -right-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold"
                          style={{ background: accentColor, color: "#09080a" }}
                        >
                          ON
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          <aside className="p-4" style={{ background: "rgba(6, 8, 14, 0.78)" }}>
            <div className="mb-3 text-[11px] uppercase tracking-[0.24em] text-[#a69591]">Node Details</div>
            {activeNode ? (
              <>
                <div className="mb-4 flex items-center gap-3">
                  <div
                    className="flex h-14 w-14 items-center justify-center rounded-2xl border"
                    style={{ borderColor: `${accentColor}80`, background: `${accentColor}18` }}
                  >
                    <img src={activeNode.icon} width={32} height={32} alt={activeNode.name ?? "Talent icon"} />
                  </div>
                  <div>
                    <div className="text-base font-semibold text-white">{activeNode.name ?? data.title}</div>
                    <div className="text-xs text-[#b8a6a1]">
                      {activeNode.selectable === false
                        ? "Spec anchor"
                        : selectedSet.has(activeNode.id)
                          ? "Selected"
                          : isLocked(activeNode.id)
                            ? "Locked"
                            : "Available"}
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border p-3 text-sm leading-6 text-[#efe3de]" style={{ borderColor: `${data.theme.border}88`, background: "rgba(18, 12, 14, 0.42)" }}>
                  {activeNode.desc ?? "Select a talent node to inspect it."}
                </div>

                {activeNode.selectable !== false && (
                  <div className="mt-4 space-y-2 text-xs text-[#ccb8b1]">
                    <div>
                      Prerequisite:{" "}
                      <span className="text-white">
                        {(prereq.get(activeNode.id) ?? [])
                          .map((parentId) => nodeMap.get(parentId)?.name ?? "Spec Root")
                          .join(", ") || "None"}
                      </span>
                    </div>
                    <div>
                      Toggle state:{" "}
                      <span className="text-white">
                        {selectedSet.has(activeNode.id)
                          ? canDeselect(activeNode.id)
                            ? "Can be removed"
                            : "Blocked by selected descendants"
                          : canSelect(activeNode.id)
                            ? "Can be selected"
                            : "Select its prerequisite first"}
                      </span>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="rounded-2xl border p-4 text-sm text-[#ccb8b1]" style={{ borderColor: `${data.theme.border}88` }}>
                Hover or select a node to inspect it.
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  )
}

function GuideTreeNode({
  node,
  active,
  onClick,
}: {
  node: GuideTalentTreeNode
  active: boolean
  onClick: (() => void) | undefined
}) {
  const isHex = node.size === "hex"
  const interactive = Boolean(onClick)
  const fillColor = active ? node.fillColor : "rgb(4, 6, 12)"
  const borderColor = active ? "rgb(255, 255, 255)" : normalizeColor(node.borderColor)
  const iconFilter = active ? "none" : "grayscale(0.08) brightness(0.94)"

  return (
    <button
      type="button"
      className="absolute flex items-center justify-center p-0"
      style={{
        left: node.x,
        top: node.y,
        width: node.outerWidth,
        height: node.outerHeight,
        cursor: interactive ? "pointer" : "default",
        opacity: node.opacity,
        background: "transparent",
        border: "none",
        appearance: "none",
      }}
      onClick={onClick}
      title={node.name}
    >
      {isHex ? (
        <svg width={node.innerWidth} height={node.innerHeight} viewBox={`0 0 ${node.innerWidth} ${node.innerHeight}`}>
          <polygon
            points={`${node.innerWidth * 0.91},${node.innerHeight * 0.27} ${node.innerWidth * 0.91},${node.innerHeight * 0.73} ${node.innerWidth * 0.5},${node.innerHeight - 1} ${node.innerWidth * 0.09},${node.innerHeight * 0.73} ${node.innerWidth * 0.09},${node.innerHeight * 0.27} ${node.innerWidth * 0.5},1`}
            fill={fillColor}
            stroke={borderColor}
            strokeWidth={1}
          />
        </svg>
      ) : (
        <div
          className="absolute"
          style={{
            width: node.innerWidth,
            height: node.innerHeight,
            border: `1px solid ${borderColor}`,
            borderRadius: node.size === "small" ? 999 : 0,
            background: fillColor,
            boxShadow: active && node.glowColor ? `0 0 16px ${node.glowColor}` : "none",
          }}
        />
      )}

      <img
        src={node.icon}
        width={node.iconWidth}
        height={node.iconHeight}
        alt={node.name ?? "Talent node"}
        style={{ filter: iconFilter, position: "relative", zIndex: 1 }}
        onError={(event) => {
          event.currentTarget.style.display = "none"
        }}
      />
    </button>
  )
}

function GuideTabView({
  tab,
  selected,
  onToggle,
}: {
  tab: GuideTalentTreeTab
  selected: string[]
  onToggle: (id: string, next: boolean) => void
}) {
  const [focusedKey, setFocusedKey] = useState<string | null>(null)
  const selectedSet = useMemo(() => new Set(selected), [selected])
  const activeNavigationKey = focusedKey
    ?? tab.tree.navigationNodes.find((node) => node.talentId && selectedSet.has(node.talentId))?.key
    ?? tab.tree.navigationNodes.find((node) => node.active)?.key
    ?? null

  return (
    <div className="space-y-5">
      <p className="max-w-3xl text-sm leading-6 text-[#dfd7cf]">{tab.intro}</p>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(365px,365px)] lg:items-start">
        <div>
          <ul className="space-y-3 pl-5 text-sm leading-6 text-[#e7ddd7] marker:text-[#c7b39b] list-disc">
            {tab.bullets.map((bullet, index) => (
              <li key={`${tab.label}-bullet-${index}`}>{bullet}</li>
            ))}
          </ul>
        </div>

        <div className="w-full">
          <div className="overflow-hidden rounded-[12px] border border-[#3c241f] bg-[#09060a] shadow-[0_18px_60px_rgba(0,0,0,0.38)]">
            <div className="relative" style={{ background: tab.tree.background }}>
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),transparent_24%,rgba(0,0,0,0.08))]" />

              <div className="relative px-4 pt-4">
                <div className="flex items-start justify-between">
                  <div className="text-[#f3e3dc]">
                    <div className="text-base font-semibold leading-none">{tab.tree.title}</div>
                    <div className="mt-2 text-sm italic text-[#edd3ca]">{tab.tree.points}</div>
                  </div>

                  <button
                    type="button"
                    className="flex h-8 w-8 items-center justify-center rounded-[8px] border border-[#7d5145] bg-[rgba(12,10,12,0.55)] text-[#e8d5cd]"
                    aria-label="Planner control"
                  >
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
                      <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="px-2 pb-2 pt-3">
                <div
                  className="relative mx-auto w-full"
                  style={{ maxWidth: tab.tree.width, aspectRatio: `${tab.tree.width} / ${tab.tree.height}` }}
                >
                  <svg
                    className="absolute inset-0 h-full w-full"
                    viewBox={`0 0 ${tab.tree.width} ${tab.tree.height}`}
                    preserveAspectRatio="xMidYMid meet"
                    style={{ pointerEvents: "none" }}
                  >
                    {tab.tree.edges.map((edge, index) => {
                      const from = tab.tree.nodes.find((node) => node.key === edge.from)
                      const to = tab.tree.nodes.find((node) => node.key === edge.to)
                      if (!from || !to) return null

                      const fromActive = from.talentId ? selectedSet.has(from.talentId) : from.defaultActive
                      const toActive = to.talentId ? selectedSet.has(to.talentId) : to.defaultActive
                      const stroke = fromActive && toActive ? "rgba(255,255,255,0.92)" : "rgba(88,69,67,0.78)"

                      return (
                        <line
                          key={`${edge.from}-${edge.to}-${index}`}
                          x1={from.x + from.outerWidth / 2}
                          y1={from.y + from.outerHeight / 2}
                          x2={to.x + to.outerWidth / 2}
                          y2={to.y + to.outerHeight / 2}
                          stroke={stroke}
                          strokeWidth={1.8}
                        />
                      )
                    })}
                  </svg>

                  <div className="absolute inset-0">
                    {tab.tree.nodes.map((node) => {
                      const active = node.talentId ? selectedSet.has(node.talentId) : node.defaultActive
                      const clickHandler = node.talentId
                        ? () => {
                            setFocusedKey(node.key)
                            onToggle(node.talentId!, !selectedSet.has(node.talentId!))
                          }
                        : undefined

                      return (
                        <GuideTreeNode
                          key={node.key}
                          node={node}
                          active={active}
                          onClick={clickHandler}
                        />
                      )
                    })}
                  </div>
                </div>
              </div>

              {tab.tree.navigationNodes.length > 0 && (
                <div
                  className="mt-2 flex items-center gap-2 border-t border-[rgba(255,255,255,0.06)] px-2 py-2"
                  style={{ backgroundColor: tab.tree.navigationBackground }}
                >
                  <button type="button" className="flex h-7 w-7 items-center justify-center text-[#b79f97]" aria-label="Previous node">
                    <svg viewBox="0 0 512 512" width="12" height="12" fill="currentColor" aria-hidden="true">
                      <path d="M320 128L192 256l128 128z" />
                    </svg>
                  </button>

                  <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
                    {tab.tree.navigationNodes.map((node) => {
                      const active = node.key === activeNavigationKey
                      return (
                        <div
                          key={node.key}
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[6px] border"
                          style={{
                            borderColor: active ? "rgba(255,255,255,0.7)" : "transparent",
                            background: active ? "rgba(219,135,135,0.22)" : "transparent",
                          }}
                          title={node.name}
                        >
                          <img
                            src={node.icon}
                            width={18}
                            height={18}
                            alt={node.name ?? "Navigation node"}
                            onError={(event) => {
                              event.currentTarget.style.display = "none"
                            }}
                          />
                        </div>
                      )
                    })}
                  </div>

                  <button type="button" className="flex h-7 w-7 items-center justify-center text-[#b79f97]" aria-label="Next node">
                    <svg viewBox="0 0 512 512" width="12" height="12" fill="currentColor" aria-hidden="true">
                      <path d="M192 128l128 128-128 128z" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function GuideTree({
  data,
  selected,
  onToggle,
}: {
  data: Extract<TalentTreeData, { kind: "guide" }>
  selected: string[]
  onToggle: (id: string, next: boolean) => void
}) {
  const [activeTabIndex, setActiveTabIndex] = useState(0)
  const activeTab = data.tabs[activeTabIndex] ?? data.tabs[0]

  return (
    <div className="space-y-5 rounded-[18px] border border-[#302324] bg-[linear-gradient(180deg,#0d0a0d_0%,#140c10_100%)] p-4 md:p-5">
      <div className="flex flex-wrap gap-2">
        {data.tabs.map((tab, index) => {
          const active = index === activeTabIndex
          return (
            <button
              key={tab.label}
              type="button"
              className="rounded-[10px] border px-4 py-2 text-sm font-medium transition-colors"
              style={{
                borderColor: active ? "rgba(255,255,255,0.28)" : "rgba(255,255,255,0.08)",
                background: active ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.02)",
                color: active ? "#ffffff" : "#bcaea8",
              }}
              onClick={() => setActiveTabIndex(index)}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {activeTab ? <GuideTabView tab={activeTab} selected={selected} onToggle={onToggle} /> : null}
    </div>
  )
}

export function TalentTree({
  data,
  selected,
  onToggle,
  accentColor,
}: {
  data: TalentTreeData
  selected: string[]
  onToggle: (id: string, next: boolean) => void
  accentColor: string
}) {
  if (data.kind === "guide") {
    return <GuideTree data={data} selected={selected} onToggle={onToggle} />
  }

  return <GeneratedTree data={data} selected={selected} onToggle={onToggle} accentColor={accentColor} />
}