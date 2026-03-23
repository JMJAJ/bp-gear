"use client"

import { useEffect, useMemo, useState } from "react"
import type { TalentEntry } from "@/lib/talent-data"
import type { GuideTalentTreeData, GuideTalentTreeNode, TalentTreeEdge } from "@/lib/talent-tree-parser"

type NodeSize = "hex" | "large" | "small"

type LayoutNode = {
  key: string
  talentId?: string
  x: number
  y: number
  size: NodeSize
  row: number
  icon?: string
  name?: string
  desc?: string
}

type RenderNode = LayoutNode & {
  icon: string
  name: string
  desc: string
  selectable: boolean
  active: boolean
  frame?: number
  inner?: number
  iconPx?: number
  borderColor?: string
  fillColor?: string
}

interface MaxrollTalentTreeProps {
  className: string
  spec: string
  talents: TalentEntry[]
  selected: string[]
  onToggle: (id: string, next: boolean) => void
  guideData?: GuideTalentTreeData | null
}

const CLASS_ICON = "https://assets-ng.maxroll.gg/sr-tools/assets/db/icons/professions/profession_horizontal_03.webp"
const SPEC_ICON = "https://assets-ng.maxroll.gg/sr-tools/assets/db/icons/talents/talent_passive_icon_general_dps_sickleget.webp"
const ICON_MINOR = "https://assets-ng.maxroll.gg/sr-tools/assets/db/icons/talents/common_icon08.webp"
const ICON_AGI = "https://assets-ng.maxroll.gg/sr-tools/assets/db/icons/talents/common_attrdexterity.webp"
const ICON_BOSS = "https://assets-ng.maxroll.gg/sr-tools/assets/db/icons/talents/common_icon03.webp"

const STORMBLADE_LAYOUT: LayoutNode[] = [
  { key: "sb-root", x: 160, y: 16, size: "hex", row: 0, icon: CLASS_ICON, name: "Stormblade", desc: "Stormblade tree root." },
  { key: "blade_intent", talentId: "blade_intent", x: 106, y: 78, size: "small", row: 1 },
  { key: "agility_conversion", talentId: "agility_conversion", x: 214, y: 78, size: "small", row: 1 },
  { key: "thunder_whirl", talentId: "thunder_whirl", x: 106, y: 136, size: "large", row: 2 },
  { key: "keen_strike", talentId: "keen_strike", x: 214, y: 136, size: "large", row: 2 },
  { key: "agility-1", x: 52, y: 194, size: "small", row: 3, icon: ICON_AGI, name: "Agility", desc: "+10 Agility" },
  { key: "iaido_mastery", talentId: "iaido_mastery", x: 160, y: 194, size: "small", row: 3 },
  { key: "agility-2", x: 268, y: 194, size: "small", row: 3, icon: ICON_AGI, name: "Agility", desc: "+10 Agility" },
  { key: "zen_moment", talentId: "zen_moment", x: 52, y: 252, size: "large", row: 4 },
  { key: "thunder_sigil_charm", talentId: "thunder_sigil_charm", x: 160, y: 252, size: "large", row: 4 },
  { key: "thunder_reversal", talentId: "thunder_reversal", x: 268, y: 252, size: "large", row: 4 },
  { key: "vacuum_slash", talentId: "vacuum_slash", x: 106, y: 312, size: "small", row: 5 },
  { key: "flash_frenzy_blade", talentId: "flash_frenzy_blade", x: 214, y: 312, size: "small", row: 5 },
  { key: "bladewind_domain", talentId: "bladewind_domain", x: 52, y: 370, size: "large", row: 6 },
  { key: "duel_awareness", talentId: "duel_awareness", x: 160, y: 370, size: "small", row: 6 },
  { key: "frenzied_thunder_roar", talentId: "frenzied_thunder_roar", x: 268, y: 370, size: "large", row: 6 },
  { key: "shadow_despise", talentId: "shadow_despise", x: 106, y: 430, size: "small", row: 7 },
  { key: "iai_thunder_dance", talentId: "iai_thunder_dance", x: 214, y: 430, size: "small", row: 7 },
  { key: "flash_sharp_strike", talentId: "flash_sharp_strike", x: 52, y: 490, size: "large", row: 8 },
  { key: "rapid_thunder_assault", talentId: "rapid_thunder_assault", x: 160, y: 490, size: "large", row: 8 },
  { key: "end_of_annihilation", talentId: "end_of_annihilation", x: 268, y: 490, size: "large", row: 8 },
]

const MOONSTRIKE_LAYOUT: LayoutNode[] = [
  { key: "ms-root", x: 160, y: 16, size: "hex", row: 0, icon: SPEC_ICON, name: "Moonstrike Spec", desc: "Moonstrike specialization root." },
  { key: "thunder_seed", talentId: "thunder_seed", x: 106, y: 74, size: "small", row: 1 },
  { key: "thunder_rune_mastery", talentId: "thunder_rune_mastery", x: 214, y: 74, size: "small", row: 1 },
  { key: "touch_of_thunder_soul", talentId: "touch_of_thunder_soul", x: 52, y: 132, size: "large", row: 2 },
  { key: "moonstrike_delay", talentId: "moonstrike_delay", x: 160, y: 132, size: "large", row: 2 },
  { key: "thunder_scythe", talentId: "thunder_scythe", x: 268, y: 132, size: "large", row: 2 },
  { key: "agi-1", x: 106, y: 190, size: "small", row: 3, icon: ICON_AGI, name: "Agility", desc: "+10 Agility" },
  { key: "thunder_curse", talentId: "thunder_curse", x: 0, y: 190, size: "small", row: 3 },
  { key: "enhanced_thunderstrike", talentId: "enhanced_thunderstrike", x: 160, y: 190, size: "large", row: 3 },
  { key: "agi-2", x: 214, y: 190, size: "small", row: 3, icon: ICON_AGI, name: "Agility", desc: "+10 Agility" },
  { key: "minor-1", x: 322, y: 190, size: "small", row: 3, icon: ICON_MINOR, name: "Minor Passive", desc: "Minor passive node." },
  { key: "moonlight_charge", talentId: "moonlight_charge", x: 52, y: 248, size: "large", row: 4 },
  { key: "phantom_delay", talentId: "phantom_delay", x: 160, y: 248, size: "large", row: 4 },
  { key: "thousand_thunder_flashes", talentId: "thousand_thunder_flashes", x: 268, y: 248, size: "large", row: 4 },
  { key: "minor-2", x: 0, y: 306, size: "small", row: 5, icon: ICON_MINOR, name: "Minor Passive", desc: "Minor passive node." },
  { key: "chaos_breaker", talentId: "chaos_breaker", x: 106, y: 306, size: "large", row: 5 },
  { key: "minor-3", x: 160, y: 306, size: "small", row: 5, icon: ICON_AGI, name: "Agility", desc: "+10 Agility" },
  { key: "minor-4", x: 214, y: 306, size: "small", row: 5, icon: ICON_MINOR, name: "Minor Passive", desc: "Minor passive node." },
  { key: "minor-5", x: 322, y: 306, size: "small", row: 5, icon: ICON_BOSS, name: "Boss Damage", desc: "+3% Boss Damage" },
  { key: "blade_intent_rare", talentId: "blade_intent_rare", x: 52, y: 364, size: "large", row: 6 },
  { key: "phantom_scythe_realm_i", talentId: "phantom_scythe_realm_i", x: 160, y: 364, size: "large", row: 6 },
  { key: "divine_sickle", talentId: "divine_sickle", x: 268, y: 364, size: "large", row: 6 },
  { key: "breath_of_mark", talentId: "breath_of_mark", x: 52, y: 422, size: "large", row: 7 },
  { key: "phantom_scythe_realm_ii", talentId: "phantom_scythe_realm_ii", x: 160, y: 422, size: "large", row: 7 },
  { key: "lightning_flash", talentId: "lightning_flash", x: 268, y: 422, size: "large", row: 7 },
  { key: "minor-6", x: 0, y: 482, size: "small", row: 8, icon: ICON_MINOR, name: "Minor Passive", desc: "Minor passive node." },
  { key: "power_of_thunder", talentId: "power_of_thunder", x: 106, y: 482, size: "large", row: 8 },
  { key: "minor-7", x: 160, y: 482, size: "small", row: 8, icon: ICON_AGI, name: "Agility", desc: "+10 Agility" },
  { key: "minor-8", x: 214, y: 482, size: "small", row: 8, icon: ICON_MINOR, name: "Minor Passive", desc: "Minor passive node." },
  { key: "minor-9", x: 322, y: 482, size: "small", row: 8, icon: ICON_MINOR, name: "Minor Passive", desc: "Minor passive node." },
  { key: "thunder_might_2", talentId: "thunder_might_2", x: 52, y: 542, size: "large", row: 9 },
  { key: "thunder_sigil_charm_4", talentId: "thunder_sigil_charm_4", x: 160, y: 542, size: "large", row: 9 },
  { key: "thunderstrike_whisper", talentId: "thunderstrike_whisper", x: 268, y: 542, size: "large", row: 9 },
  { key: "moonstrike_sharp_strike", talentId: "moonstrike_sharp_strike", x: 106, y: 600, size: "large", row: 10 },
  { key: "minor-10", x: 160, y: 600, size: "small", row: 10, icon: ICON_MINOR, name: "Minor Passive", desc: "Minor passive node." },
  { key: "minor-11", x: 214, y: 600, size: "small", row: 10, icon: ICON_AGI, name: "Agility", desc: "+10 Agility" },
  { key: "swift", talentId: "swift", x: 52, y: 660, size: "large", row: 11 },
  { key: "minor-12", x: 160, y: 660, size: "small", row: 11, icon: ICON_MINOR, name: "Minor Passive", desc: "Minor passive node." },
  { key: "raijin_dash_charge", talentId: "raijin_dash_charge", x: 268, y: 660, size: "large", row: 11 },
  { key: "moonblade_swift", talentId: "moonblade_swift", x: 160, y: 718, size: "large", row: 12 },
]

function sizeToInner(size: NodeSize) {
  if (size === "hex") return { inner: 36, icon: 22 }
  if (size === "large") return { inner: 36, icon: 22 }
  return { inner: 25, icon: 15 }
}

function getNodeMetrics(size: NodeSize, treeType: "class" | "spec") {
  if (treeType === "class") {
    if (size === "hex") return { frame: 45, inner: 36, icon: 22 }
    if (size === "large") return { frame: 45, inner: 43, icon: 26 }
    return { frame: 45, inner: 29, icon: 17 }
  }

  if (size === "hex") return { frame: 42, inner: 36, icon: 22 }
  if (size === "large") return { frame: 42, inner: 36, icon: 22 }
  return { frame: 42, inner: 25, icon: 15 }
}

function buildRenderNodes(layout: LayoutNode[], talentsById: Map<string, TalentEntry>, selectedSet: Set<string>): RenderNode[] {
  return layout.map((node) => {
    const talent = node.talentId ? talentsById.get(node.talentId) : undefined
    return {
      ...node,
      icon: talent?.icon ?? node.icon ?? ICON_MINOR,
      name: talent?.name ?? node.name ?? "Talent",
      desc: talent?.desc ?? node.desc ?? "Talent node",
      selectable: Boolean(node.talentId && talent),
      active: node.talentId ? selectedSet.has(node.talentId) : node.size === "hex",
    }
  })
}

function pickGuideTab(
  guideData: GuideTalentTreeData | null | undefined,
  treeType: "class" | "spec",
  className: string,
  spec: string,
) {
  if (!guideData?.tabs?.length) return null
  const label = treeType === "class" ? className.toLowerCase() : spec.toLowerCase()
  return guideData.tabs.find((tab) => tab.label.toLowerCase().includes(label))
    ?? guideData.tabs[treeType === "class" ? 0 : Math.min(1, guideData.tabs.length - 1)]
}

function buildRenderNodesFromGuide(
  nodes: GuideTalentTreeNode[],
  talentsById: Map<string, TalentEntry>,
  talentsByIcon: Map<string, TalentEntry[]>,
  selectedSet: Set<string>,
): RenderNode[] {
  const iconUsage = new Map<string, number>()

  return nodes.map((node) => {
    const iconMatches = talentsByIcon.get(node.icon) ?? []
    const usedCount = iconUsage.get(node.icon) ?? 0
    const iconMatchedTalent = iconMatches.length > 0 ? iconMatches[Math.min(usedCount, iconMatches.length - 1)] : undefined

    if (iconMatchedTalent) {
      iconUsage.set(node.icon, usedCount + 1)
    }

    const talent = node.talentId
      ? (talentsById.get(node.talentId) ?? iconMatchedTalent)
      : iconMatchedTalent

    const row = Math.round(node.y / 58)
    return {
      key: node.key,
      talentId: talent?.id ?? node.talentId,
      x: node.x,
      y: node.y,
      size: node.size,
      row,
      icon: talent?.icon ?? node.icon ?? ICON_MINOR,
      name: talent?.name ?? node.name ?? "Talent",
      desc: talent?.desc ?? node.desc ?? "Talent node",
      selectable: Boolean(node.talentId && talent),
      active: node.talentId ? selectedSet.has(node.talentId) : node.defaultActive || node.size === "hex",
      frame: node.outerWidth,
      inner: node.innerWidth,
      iconPx: node.iconWidth,
      borderColor: node.borderColor,
      fillColor: node.fillColor,
    }
  })
}

function buildEdges(nodes: LayoutNode[]): Array<{ from: string; to: string }> {
  const rows = new Map<number, LayoutNode[]>()
  for (const node of nodes) {
    const existing = rows.get(node.row) ?? []
    existing.push(node)
    rows.set(node.row, existing)
  }

  const edges: Array<{ from: string; to: string }> = []
  const orderedRows = [...rows.entries()].sort((a, b) => a[0] - b[0])

  for (let index = 1; index < orderedRows.length; index += 1) {
    const current = orderedRows[index][1]
    const previous = orderedRows[index - 1][1]

    for (const node of current) {
      const from = previous
        .map((candidate) => ({
          candidate,
          dist: Math.abs((candidate.x + 18) - (node.x + 18)),
        }))
        .sort((a, b) => a.dist - b.dist)[0]?.candidate

      if (from) edges.push({ from: from.key, to: node.key })
    }
  }

  return edges
}

function buildPrereqs(nodes: RenderNode[], edges: Array<{ from: string; to: string }>): Map<string, string[]> {
  const byKey = new Map(nodes.map((node) => [node.key, node]))
  const result = new Map<string, string[]>()

  for (const edge of edges) {
    const from = byKey.get(edge.from)
    const to = byKey.get(edge.to)
    if (!from?.talentId || !to?.talentId) continue

    const existing = result.get(to.talentId) ?? []
    if (!existing.includes(from.talentId)) {
      existing.push(from.talentId)
      result.set(to.talentId, existing)
    }
  }

  return result
}

export function MaxrollTalentTree({ className, spec, talents, selected, onToggle, guideData }: MaxrollTalentTreeProps) {
  const [activeTree, setActiveTree] = useState<"class" | "spec">("spec")
  const [focusedNodeKey, setFocusedNodeKey] = useState<string | null>(null)
  const selectedSet = useMemo(() => new Set(selected), [selected])
  const talentsById = useMemo(() => new Map(talents.map((talent) => [talent.id, talent])), [talents])
  const talentsByIcon = useMemo(() => {
    const map = new Map<string, TalentEntry[]>()
    for (const talent of talents) {
      const existing = map.get(talent.icon) ?? []
      existing.push(talent)
      map.set(talent.icon, existing)
    }
    return map
  }, [talents])

  const classNodes = useMemo(() => buildRenderNodes(STORMBLADE_LAYOUT, talentsById, selectedSet), [talentsById, selectedSet])
  const specNodes = useMemo(() => buildRenderNodes(MOONSTRIKE_LAYOUT, talentsById, selectedSet), [talentsById, selectedSet])

  const classGuideTab = useMemo(() => pickGuideTab(guideData, "class", className, spec), [guideData, className, spec])
  const specGuideTab = useMemo(() => pickGuideTab(guideData, "spec", className, spec), [guideData, className, spec])

  const classNodesFromGuide = useMemo(
    () => (classGuideTab ? buildRenderNodesFromGuide(classGuideTab.tree.nodes, talentsById, talentsByIcon, selectedSet) : null),
    [classGuideTab, talentsById, talentsByIcon, selectedSet],
  )
  const specNodesFromGuide = useMemo(
    () => (specGuideTab ? buildRenderNodesFromGuide(specGuideTab.tree.nodes, talentsById, talentsByIcon, selectedSet) : null),
    [specGuideTab, talentsById, talentsByIcon, selectedSet],
  )

  const classEdges = useMemo(() => buildEdges(classNodes), [classNodes])
  const specEdges = useMemo(() => buildEdges(specNodes), [specNodes])

  const classGuideEdges = useMemo<TalentTreeEdge[] | null>(() => classGuideTab?.tree.edges ?? null, [classGuideTab])
  const specGuideEdges = useMemo<TalentTreeEdge[] | null>(() => specGuideTab?.tree.edges ?? null, [specGuideTab])

  const tree = activeTree === "class"
    ? {
        label: className || "Stormblade",
        nodes: classNodesFromGuide ?? classNodes,
        edges: classGuideEdges ?? classEdges,
        cap: 30,
        width: classGuideTab?.tree.width ?? 365,
        height: classGuideTab?.tree.height ?? 560,
      }
    : {
        label: `${spec} Spec`,
        nodes: specNodesFromGuide ?? specNodes,
        edges: specGuideEdges ?? specEdges,
        cap: 40,
        width: specGuideTab?.tree.width ?? 365,
        height: specGuideTab?.tree.height ?? 760,
      }

  const prereqs = useMemo(() => buildPrereqs(tree.nodes, tree.edges), [tree.nodes, tree.edges])
  const nodeByKey = useMemo(() => new Map(tree.nodes.map((node) => [node.key, node])), [tree.nodes])

  const selectedInTree = tree.nodes.filter((node) => node.talentId && selectedSet.has(node.talentId)).length

  const canSelect = (talentId: string): boolean => {
    const required = prereqs.get(talentId) ?? []
    return required.every((id) => selectedSet.has(id))
  }

  const canDeselect = (talentId: string): boolean => {
    for (const [childId, required] of prereqs) {
      if (!selectedSet.has(childId)) continue
      if (required.includes(talentId)) return false
    }
    return true
  }

  const defaultFocusedNode = useMemo(
    () => tree.nodes.find((node) => node.talentId && selectedSet.has(node.talentId)) ?? tree.nodes[0] ?? null,
    [tree.nodes, selectedSet],
  )

  const focusedNode = useMemo(
    () => tree.nodes.find((node) => node.key === focusedNodeKey) ?? defaultFocusedNode,
    [tree.nodes, focusedNodeKey, defaultFocusedNode],
  )

  useEffect(() => {
    setFocusedNodeKey(null)
  }, [activeTree])

  const focusedStatus = focusedNode?.talentId
    ? selectedSet.has(focusedNode.talentId)
      ? "Selected"
      : canSelect(focusedNode.talentId)
        ? "Available"
        : "Locked"
    : "Root"

  const focusedPrereqs = focusedNode?.talentId
    ? (prereqs.get(focusedNode.talentId) ?? []).map((id) => talentsById.get(id)?.name ?? id)
    : []

  const treeType = activeTree

  return (
    <div className="overflow-hidden rounded-[18px] border border-[#302324] bg-[#09060a]">
      <div className="flex border-b border-[#302324] bg-[#0b090c]">
        <button
          type="button"
          className="flex items-center gap-2 px-4 py-2.5 text-sm transition-colors"
          style={{
            color: activeTree === "class" ? "rgb(78, 187, 218)" : "#8a8d98",
            borderBottom: activeTree === "class" ? "2px solid #db8787" : "2px solid transparent",
          }}
          onClick={() => setActiveTree("class")}
        >
          <img src={CLASS_ICON} width={18} height={18} alt="Stormblade" />
          <span>{className || "Stormblade"}</span>
        </button>

        <button
          type="button"
          className="flex items-center gap-2 px-4 py-2.5 text-sm transition-colors"
          style={{
            color: activeTree === "spec" ? "rgb(78, 187, 218)" : "#8a8d98",
            borderBottom: activeTree === "spec" ? "2px solid #db8787" : "2px solid transparent",
          }}
          onClick={() => setActiveTree("spec")}
        >
          <img src={SPEC_ICON} width={18} height={18} alt="Moonstrike Spec" />
          <span>{spec} Spec</span>
        </button>
      </div>

      <div className="relative" style={{ background: "linear-gradient(rgb(29, 17, 15) 0%, rgb(75, 23, 10) 48.08%, rgb(132, 69, 70) 100%)" }}>
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),transparent_24%,rgba(0,0,0,0.14))]" />

        <div className="relative grid gap-3 p-3 lg:grid-cols-[minmax(0,1fr)_290px]">
          <div>
            <div className="mb-2 flex items-center justify-between px-1 text-white">
              <div className="text-sm italic text-[#edd3ca]">
                <i><b>{selectedInTree}</b> / {tree.cap}</i>
              </div>
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-[8px] border border-[#7d5145] bg-[rgba(12,10,12,0.55)] text-[#e8d5cd]"
                title="Tree view"
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
                  <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
                </svg>
              </button>
            </div>

            <div className="px-1 pb-1">
              <div className="relative mx-auto w-full max-w-[365px]" style={{ height: `${Math.round((tree.height / tree.width) * 365)}px` }}>
                <svg className="absolute inset-0 h-full w-full" viewBox={`0 0 ${tree.width} ${tree.height}`} preserveAspectRatio="xMidYMid meet" style={{ pointerEvents: "none" }}>
                  {tree.edges.map((edge, index) => {
                    const from = nodeByKey.get(edge.from)
                    const to = nodeByKey.get(edge.to)
                    if (!from || !to) return null
                    const fromMetrics = from.frame
                      ? { frame: from.frame, inner: from.inner ?? from.frame, icon: from.iconPx ?? 15 }
                      : getNodeMetrics(from.size, treeType)
                    const toMetrics = to.frame
                      ? { frame: to.frame, inner: to.inner ?? to.frame, icon: to.iconPx ?? 15 }
                      : getNodeMetrics(to.size, treeType)
                    const active = (from.talentId ? selectedSet.has(from.talentId) : from.size === "hex") && (to.talentId ? selectedSet.has(to.talentId) : to.size === "hex")

                    return (
                      <line
                        key={`${edge.from}-${edge.to}-${index}`}
                        x1={from.x + (fromMetrics.frame / 2)}
                        y1={from.y + (fromMetrics.frame / 2)}
                        x2={to.x + (toMetrics.frame / 2)}
                        y2={to.y + (toMetrics.frame / 2)}
                        stroke={active ? "rgba(255,255,255,0.92)" : "rgba(88,69,67,0.78)"}
                        strokeWidth={1.8}
                      />
                    )
                  })}
                </svg>

                <div className="absolute inset-0">
                  {tree.nodes.map((node) => {
                    const { frame, inner, icon } = node.frame
                      ? {
                          frame: node.frame,
                          inner: node.inner ?? node.frame,
                          icon: node.iconPx ?? 15,
                        }
                      : getNodeMetrics(node.size, treeType)
                    const selectedNow = node.talentId ? selectedSet.has(node.talentId) : node.active
                    const locked = node.talentId ? !selectedNow && !canSelect(node.talentId) : false
                    const clickable = node.talentId ? (selectedNow ? canDeselect(node.talentId) : canSelect(node.talentId)) : false

                    const fill = selectedNow ? "#db8787" : (node.fillColor ?? "rgb(4, 6, 12)")
                    const border = selectedNow
                      ? "rgb(255,255,255)"
                      : locked
                        ? "rgb(85, 90, 106)"
                        : (node.borderColor ?? "rgb(255,255,255)")

                    return (
                      <button
                        key={node.key}
                        type="button"
                        className="absolute flex items-center justify-center"
                        style={{
                          left: node.x,
                          top: node.y,
                          width: frame,
                          height: frame,
                          background: "transparent",
                          border: "none",
                          opacity: locked ? 0.58 : 1,
                          cursor: clickable ? "pointer" : "default",
                          padding: 0,
                        }}
                        onMouseEnter={() => setFocusedNodeKey(node.key)}
                        onFocus={() => setFocusedNodeKey(node.key)}
                        onClick={() => {
                          setFocusedNodeKey(node.key)
                          if (!node.talentId || !clickable) return
                          onToggle(node.talentId, !selectedNow)
                        }}
                        title={node.name}
                      >
                        {node.size === "hex" ? (
                          <svg width={inner} height={inner} viewBox={`0 0 ${inner} ${inner}`}>
                            <polygon
                              points={`${inner * 0.91},${inner * 0.27} ${inner * 0.91},${inner * 0.73} ${inner * 0.5},${inner - 1} ${inner * 0.09},${inner * 0.73} ${inner * 0.09},${inner * 0.27} ${inner * 0.5},1`}
                              fill={fill}
                              stroke={border}
                              strokeWidth={1}
                            />
                          </svg>
                        ) : (
                          <div
                            className="absolute"
                            style={{
                              width: inner,
                              height: inner,
                              border: `1px solid ${border}`,
                              borderRadius: node.size === "small" ? 999 : 0,
                              background: fill,
                            }}
                          />
                        )}

                        <img
                          src={node.icon}
                          width={icon}
                          height={icon}
                          alt={node.name}
                          className="relative z-[1] object-contain"
                          style={{ filter: locked ? "grayscale(0.3) brightness(0.72)" : "none" }}
                          onError={(event) => {
                            event.currentTarget.style.display = "none"
                          }}
                        />
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
          <aside className="rounded-[12px] border border-[#3a2d2d] bg-[rgba(8,8,12,0.72)] p-3 text-[#ded9e0]">
            {focusedNode ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md border border-[#665451] bg-[#120f14]">
                    <img src={focusedNode.icon} width={24} height={24} alt={focusedNode.name} className="object-contain" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white leading-tight">{focusedNode.name}</div>
                    <div className="text-[11px] uppercase tracking-[1px] text-[#b2a1a1]">{tree.label}</div>
                  </div>
                </div>

                <div className="rounded border border-[#4a3b3a] bg-[#0c0a10] px-2 py-1 text-[11px] uppercase tracking-[1px]">
                  <span className="text-[#9d8f8f]">Status:</span>{" "}
                  <span className={focusedStatus === "Selected" ? "text-[#98f1be]" : focusedStatus === "Locked" ? "text-[#f0a6a6]" : "text-[#f1ddb9]"}>
                    {focusedStatus}
                  </span>
                </div>

                <p className="text-xs leading-5 text-[#d7d0dc]">{focusedNode.desc || "No description available."}</p>

                {focusedPrereqs.length > 0 && (
                  <div>
                    <div className="mb-1 text-[11px] uppercase tracking-[1px] text-[#9d8f8f]">Prerequisites</div>
                    <div className="space-y-1">
                      {focusedPrereqs.map((req) => (
                        <div key={req} className="rounded border border-[#3f3334] bg-[#0a0810] px-2 py-1 text-xs text-[#d8c9c3]">
                          {req}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="text-[11px] text-[#92878f]">
                  Hover or click a node to inspect it here.
                </div>
              </div>
            ) : (
              <div className="text-xs text-[#a596a5]">Select a node to view details.</div>
            )}
          </aside>
        </div>
      </div>
    </div>
  )
}
