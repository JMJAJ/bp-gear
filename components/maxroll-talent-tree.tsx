"use client"

import { useCallback, useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from "react"
import type { TalentNodeSelections } from "@/lib/app-context"
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
  nodeSelections: TalentNodeSelections
  setNodeSelections: Dispatch<SetStateAction<TalentNodeSelections>>
  onToggle: (id: string, next: boolean) => void
  guideData?: GuideTalentTreeData | null
  editMode?: boolean
  onGuideDataSaved?: (next: GuideTalentTreeData) => void
}

const CLASS_ICON = "https://assets-ng.maxroll.gg/sr-tools/assets/db/icons/professions/profession_horizontal_03.webp"
const SPEC_ICON = "https://assets-ng.maxroll.gg/sr-tools/assets/db/icons/talents/talent_passive_icon_general_dps_sickleget.webp"
const ICON_MINOR = "https://assets-ng.maxroll.gg/sr-tools/assets/db/icons/talents/common_icon08.webp"

function getGenericNodeMeta(icon: string, size: NodeSize) {
  const lower = icon.toLowerCase()
  if (lower.includes("common_attrdexterity")) {
    return { name: "Agility", desc: "General agility stat node." }
  }
  if (lower.includes("common_attrendurance")) {
    return { name: "Endurance", desc: "General endurance stat node." }
  }
  if (lower.includes("common_icon03")) {
    return { name: "Boss Damage", desc: "General boss-damage passive node." }
  }
  if (lower.includes("common_icon08")) {
    return { name: "Minor Passive", desc: "General passive node." }
  }
  if (size === "hex") {
    return { name: "Spec Root", desc: "Specialization root node." }
  }
  return { name: "Talent", desc: "Talent node" }
}

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

// Removed - no longer using hardcoded layouts

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
  rootLabel: string,
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
    const generic = getGenericNodeMeta(node.icon, node.size)
    const isRoot = node.size === "hex"

    const row = Math.round(node.y / 58)
    return {
      key: node.key,
      talentId: talent?.id ?? node.talentId,
      x: node.x,
      y: node.y,
      size: node.size,
      row,
      icon: talent?.icon ?? node.icon ?? ICON_MINOR,
      name: talent?.name ?? node.name ?? (isRoot ? rootLabel : generic.name),
      desc: talent?.desc ?? node.desc ?? generic.desc,
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

// buildEdges removed - edges are now loaded from guide data

export function MaxrollTalentTree({ className, spec, talents, selected, nodeSelections, setNodeSelections, onToggle, guideData, editMode, onGuideDataSaved }: MaxrollTalentTreeProps) {
  const [activeTree, setActiveTree] = useState<"class" | "spec">("spec")
  const [focusedNodeKey, setFocusedNodeKey] = useState<string | null>(null)
  const [editingEdges, setEditingEdges] = useState<TalentTreeEdge[]>([])
  const [selectedNodeForEdge, setSelectedNodeForEdge] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [editingClassNodes, setEditingClassNodes] = useState<GuideTalentTreeNode[] | null>(null)
  const [editingSpecNodes, setEditingSpecNodes] = useState<GuideTalentTreeNode[] | null>(null)
  const [talentSearchQuery, setTalentSearchQuery] = useState("")
  const treeViewportRef = useRef<HTMLDivElement | null>(null)
  const edgeCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const [treeViewportSize, setTreeViewportSize] = useState({ width: 0, height: 0 })
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

  const classGuideTab = useMemo(() => pickGuideTab(guideData, "class", className, spec), [guideData, className, spec])
  const specGuideTab = useMemo(() => pickGuideTab(guideData, "spec", className, spec), [guideData, className, spec])

  // Initialize editing nodes when entering edit mode
  // Reset editing state when editMode is disabled or guide data changes
  const editSessionKey = useMemo(() => `${guideData?.tabs?.map((tab) => tab.label).join("|") ?? "unknown"}-${guideData?.tabs?.length ?? 0}`, [guideData])
  
  useEffect(() => {
    if (!editMode) {
      // Clear editing state when exiting edit mode
      setEditingClassNodes(null)
      setEditingSpecNodes(null)
      return
    }
    // Initialize editing nodes from guide data
    if (classGuideTab?.tree.nodes) {
      setEditingClassNodes((prev) => prev ?? classGuideTab.tree.nodes.map((node) => ({ ...node })))
    }
    if (specGuideTab?.tree.nodes) {
      setEditingSpecNodes((prev) => prev ?? specGuideTab.tree.nodes.map((node) => ({ ...node })))
    }
  }, [editMode, classGuideTab, specGuideTab, editSessionKey])

  const classGuideNodesSource = useMemo(() => {
    if (!classGuideTab?.tree.nodes) return []
    if (!editMode) return classGuideTab.tree.nodes
    return editingClassNodes ?? classGuideTab.tree.nodes
  }, [classGuideTab, editMode, editingClassNodes])

  const specGuideNodesSource = useMemo(() => {
    if (!specGuideTab?.tree.nodes) return []
    if (!editMode) return specGuideTab.tree.nodes
    return editingSpecNodes ?? specGuideTab.tree.nodes
  }, [specGuideTab, editMode, editingSpecNodes])

  const classNodes = useMemo(
    () => buildRenderNodesFromGuide(classGuideNodesSource, talentsById, talentsByIcon, selectedSet, className || "Stormblade"),
    [classGuideNodesSource, talentsById, talentsByIcon, selectedSet, className],
  )
  const specNodes = useMemo(
    () => buildRenderNodesFromGuide(specGuideNodesSource, talentsById, talentsByIcon, selectedSet, `${spec} Spec`),
    [specGuideNodesSource, talentsById, talentsByIcon, selectedSet, spec],
  )

  const classEdges = useMemo<TalentTreeEdge[]>(() => classGuideTab?.tree.edges ?? [], [classGuideTab])
  const specEdges = useMemo<TalentTreeEdge[]>(() => specGuideTab?.tree.edges ?? [], [specGuideTab])

  // In edit mode, use editingEdges state; otherwise use guide edges
  const activeEdges = editMode
    ? editingEdges
    : (activeTree === "class" ? classEdges : specEdges)

  const activeNodes = activeTree === "class" ? classNodes : specNodes

  // Calculate tree bounds from actual nodes
  const treeBounds = useMemo(() => {
    if (activeNodes.length === 0) return { minX: 0, minY: 0, maxX: 365, maxY: 600 }
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    for (const node of activeNodes) {
      const nodeWidth = node.frame ?? 45
      const nodeHeight = node.frame ?? 45
      minX = Math.min(minX, node.x)
      minY = Math.min(minY, node.y)
      maxX = Math.max(maxX, node.x + nodeWidth)
      maxY = Math.max(maxY, node.y + nodeHeight)
    }
    const padding = 20
    return {
      minX: minX - padding,
      minY: minY - padding,
      maxX: maxX + padding,
      maxY: maxY + padding,
    }
  }, [activeNodes])

  const treeWidth = treeBounds.maxX - treeBounds.minX
  const treeHeight = treeBounds.maxY - treeBounds.minY

  const tree = activeTree === "class"
    ? {
        label: className || "Stormblade",
        nodes: activeNodes,
        edges: activeEdges,
        cap: 30,
        width: treeWidth,
        height: treeHeight,
        offsetX: -treeBounds.minX,
        offsetY: -treeBounds.minY,
      }
    : {
        label: `${spec} Spec`,
        nodes: activeNodes,
        edges: activeEdges,
        cap: 40,
        width: treeWidth,
        height: treeHeight,
        offsetX: -treeBounds.minX,
        offsetY: -treeBounds.minY,
      }

  const nodeByKey = useMemo(() => new Map(tree.nodes.map((node) => [node.key, node])), [tree.nodes])
  const selectedNodeKeysByTalentId = useMemo(() => nodeSelections[activeTree] ?? {}, [nodeSelections, activeTree])
  const updateSelectedNodeKeysForActiveTree = useCallback((updater: (prev: Record<string, string[]>) => Record<string, string[]>) => {
    setNodeSelections((prev) => {
      const prevTree = prev[activeTree] ?? {}
      const nextTree = updater(prevTree)
      if (nextTree === prevTree) return prev
      return {
        ...prev,
        [activeTree]: nextTree,
      }
    })
  }, [activeTree, setNodeSelections])
  const duplicateNodeKeysByTalentId = useMemo(() => {
    const map = new Map<string, string[]>()
    for (const node of tree.nodes) {
      if (!node.talentId) continue
      const existing = map.get(node.talentId) ?? []
      existing.push(node.key)
      map.set(node.talentId, existing)
    }
    for (const [id, keys] of map.entries()) {
      if (keys.length <= 1) map.delete(id)
    }
    return map
  }, [tree.nodes])
  // Memoized isNodeSelected check - inline to avoid stale closures
  const isNodeSelectedCheck = useCallback((
    node: RenderNode,
    selSet: Set<string>,
    dupKeys: Map<string, string[]>,
    selNodeKeys: Record<string, string[]>
  ): boolean => {
    if (!node.talentId) return node.size === "hex"
    if (!selSet.has(node.talentId)) return false
    const duplicateKeys = dupKeys.get(node.talentId)
    if (!duplicateKeys) return true
    const selectedKeys = selNodeKeys[node.talentId]
    if (!selectedKeys || selectedKeys.length === 0) {
      return node.key === duplicateKeys[0]
    }
    return selectedKeys.includes(node.key)
  }, [])
  const incomingByKey = useMemo(() => {
    const map = new Map<string, string[]>()
    for (const edge of tree.edges) {
      const existing = map.get(edge.to) ?? []
      existing.push(edge.from)
      map.set(edge.to, existing)
    }
    return map
  }, [tree.edges])
  const outgoingByKey = useMemo(() => {
    const map = new Map<string, string[]>()
    for (const edge of tree.edges) {
      const existing = map.get(edge.from) ?? []
      existing.push(edge.to)
      map.set(edge.from, existing)
    }
    return map
  }, [tree.edges])

  const activeNodeKeys = useMemo(() => {
    const active = new Set<string>()

    for (const node of tree.nodes) {
      if (node.size === "hex") active.add(node.key)
      if (isNodeSelectedCheck(node, selectedSet, duplicateNodeKeysByTalentId, selectedNodeKeysByTalentId)) {
        active.add(node.key)
      }
    }

    let changed = true
    while (changed) {
      changed = false
      for (const node of tree.nodes) {
        if (active.has(node.key) || node.talentId) continue
        const parents = incomingByKey.get(node.key) ?? []
        if (parents.length > 0 && parents.some((key) => active.has(key))) {
          active.add(node.key)
          changed = true
        }
      }
    }

    return active
  }, [tree.nodes, incomingByKey, selectedSet, duplicateNodeKeysByTalentId, selectedNodeKeysByTalentId, isNodeSelectedCheck])

  const nodeByTalentId = useMemo(() => {
    const map = new Map<string, RenderNode>()
    for (const node of tree.nodes) {
      if (!node.talentId || map.has(node.talentId)) continue
      const duplicateKeys = duplicateNodeKeysByTalentId.get(node.talentId)
      if (!duplicateKeys) {
        map.set(node.talentId, node)
        continue
      }
      const selectedKeys = selectedNodeKeysByTalentId[node.talentId]
      const resolved = selectedKeys && selectedKeys.length > 0 ? selectedKeys[0] : duplicateKeys[0]
      const resolvedNode = nodeByKey.get(resolved)
      map.set(node.talentId, resolvedNode ?? node)
    }
    return map
  }, [tree.nodes, duplicateNodeKeysByTalentId, selectedNodeKeysByTalentId, nodeByKey])

  useEffect(() => {
    updateSelectedNodeKeysForActiveTree((prev) => {
      if (Object.keys(prev).length === 0) return prev
      let changed = false
      const next: Record<string, string[]> = {}
      for (const [talentId, selectedKeys] of Object.entries(prev)) {
        if (!selectedSet.has(talentId)) {
          changed = true
          continue
        }
        const duplicateKeys = duplicateNodeKeysByTalentId.get(talentId)
        if (duplicateKeys) {
          const filtered = selectedKeys.filter((key) => duplicateKeys.includes(key))
          if (filtered.length > 0) {
            next[talentId] = filtered
          } else {
            changed = true
          }
        } else {
          changed = true
        }
      }
      return changed ? next : prev
    })
  }, [duplicateNodeKeysByTalentId, selectedSet, updateSelectedNodeKeysForActiveTree])

  const selectedInTree = useMemo(() => 
    tree.nodes.filter((node) => node.talentId && isNodeSelectedCheck(node, selectedSet, duplicateNodeKeysByTalentId, selectedNodeKeysByTalentId)).length,
    [tree.nodes, selectedSet, duplicateNodeKeysByTalentId, selectedNodeKeysByTalentId, isNodeSelectedCheck]
  )

  const canSelectNode = useCallback((node: RenderNode): boolean => {
    if (!node.talentId || isNodeSelectedCheck(node, selectedSet, duplicateNodeKeysByTalentId, selectedNodeKeysByTalentId)) return false
    if (selectedInTree >= tree.cap) return false
    return true
  }, [selectedSet, duplicateNodeKeysByTalentId, selectedNodeKeysByTalentId, selectedInTree, tree.cap])

  const canDeselectNode = useCallback((node: RenderNode): boolean => {
    return Boolean(node.talentId && isNodeSelectedCheck(node, selectedSet, duplicateNodeKeysByTalentId, selectedNodeKeysByTalentId))
  }, [selectedSet, duplicateNodeKeysByTalentId, selectedNodeKeysByTalentId])

  const canSelect = (talentId: string): boolean => {
    const node = nodeByTalentId.get(talentId)
    return node ? canSelectNode(node) : false
  }

  const canDeselect = (talentId: string): boolean => {
    const node = nodeByTalentId.get(talentId)
    return node ? canDeselectNode(node) : false
  }

  const defaultFocusedNode = useMemo(
    () => tree.nodes.find((node) => node.talentId && isNodeSelectedCheck(node, selectedSet, duplicateNodeKeysByTalentId, selectedNodeKeysByTalentId)) ?? tree.nodes[0] ?? null,
    [tree.nodes, selectedSet, duplicateNodeKeysByTalentId, selectedNodeKeysByTalentId, isNodeSelectedCheck],
  )

  const focusedNode = useMemo(
    () => tree.nodes.find((node) => node.key === focusedNodeKey) ?? defaultFocusedNode,
    [tree.nodes, focusedNodeKey, defaultFocusedNode],
  )

  useEffect(() => {
    setFocusedNodeKey(null)
  }, [activeTree])

  useEffect(() => {
    const el = treeViewportRef.current
    if (!el) return

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return
      setTreeViewportSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      })
    })

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Initialize editingEdges when switching trees in edit mode
  useEffect(() => {
    if (editMode) {
      const initialEdges = activeTree === "class" ? classEdges : specEdges
      setEditingEdges(initialEdges)
    }
  }, [editMode, activeTree, classEdges, specEdges])

  // Toggle edge between two nodes (directed edges only)
  const toggleEdge = (fromKey: string, toKey: string) => {
    setEditingEdges(prev => {
      const existing = prev.findIndex(e => e.from === fromKey && e.to === toKey)
      if (existing >= 0) {
        // Remove edge
        return prev.filter((_, i) => i !== existing)
      } else {
        // Add edge (directed)
        return [...prev, { from: fromKey, to: toKey }]
      }
    })
  }

  // Handle node click in edit mode
  const handleNodeClickInEditMode = (nodeKey: string) => {
    if (!selectedNodeForEdge) {
      // First node selected
      setSelectedNodeForEdge(nodeKey)
    } else if (selectedNodeForEdge === nodeKey) {
      // Same node clicked, deselect
      setSelectedNodeForEdge(null)
    } else {
      // Second node selected, create/remove edge
      toggleEdge(selectedNodeForEdge, nodeKey)
      setSelectedNodeForEdge(null)
    }
  }

  const setNodePositionInEditMode = (nodeKey: string, nextX: number, nextY: number) => {
    const applyUpdate = (nodes: GuideTalentTreeNode[]) => nodes.map((node) => {
      if (node.key !== nodeKey) return node
      return {
        ...node,
        x: Math.round(nextX * 1000) / 1000,
        y: Math.round(nextY * 1000) / 1000,
      }
    })

    if (activeTree === "class") {
      const base = editingClassNodes ?? classGuideTab?.tree.nodes ?? []
      setEditingClassNodes(applyUpdate(base))
    } else {
      const base = editingSpecNodes ?? specGuideTab?.tree.nodes ?? []
      setEditingSpecNodes(applyUpdate(base))
    }
  }

  const nudgeNodeInEditMode = (nodeKey: string, dx: number, dy: number) => {
    const applyUpdate = (nodes: GuideTalentTreeNode[]) => nodes.map((node) => {
      if (node.key !== nodeKey) return node
      return {
        ...node,
        x: Math.round((node.x + dx) * 1000) / 1000,
        y: Math.round((node.y + dy) * 1000) / 1000,
      }
    })

    if (activeTree === "class") {
      const base = editingClassNodes ?? classGuideTab?.tree.nodes ?? []
      setEditingClassNodes(applyUpdate(base))
    } else {
      const base = editingSpecNodes ?? specGuideTab?.tree.nodes ?? []
      setEditingSpecNodes(applyUpdate(base))
    }
  }

  const setNodeTalentInEditMode = (nodeKey: string, talentId: string | undefined) => {
    const talent = talentId ? talentsById.get(talentId) : undefined
    const applyUpdate = (nodes: GuideTalentTreeNode[]) => nodes.map((node) => {
      if (node.key !== nodeKey) return node
      if (!talent) {
        const { talentId: _talentId, name: _name, desc: _desc, ...rest } = node
        return { ...rest }
      }
      return {
        ...node,
        talentId: talent.id,
        icon: talent.icon,
        name: talent.name,
        desc: talent.desc,
      }
    })

    if (activeTree === "class") {
      const base = editingClassNodes ?? classGuideTab?.tree.nodes ?? []
      setEditingClassNodes(applyUpdate(base))
    } else {
      const base = editingSpecNodes ?? specGuideTab?.tree.nodes ?? []
      setEditingSpecNodes(applyUpdate(base))
    }
  }

  // Save edge and node edits to JSON file
  const saveEdges = async () => {
    if (!guideData) return
    setSaving(true)
    try {
      const editedNodesForClass = editingClassNodes ?? classGuideTab?.tree.nodes ?? []
      const editedNodesForSpec = editingSpecNodes ?? specGuideTab?.tree.nodes ?? []
      const classTabIndex = classGuideTab ? guideData.tabs.findIndex((tab) => tab === classGuideTab) : -1
      const specTabIndex = specGuideTab ? guideData.tabs.findIndex((tab) => tab === specGuideTab) : -1
      const updatedData = {
        ...guideData,
        tabs: guideData.tabs.map((tab, i) => {
          if (i === classTabIndex) {
            return {
              ...tab,
              tree: {
                ...tab.tree,
                edges: activeTree === "class" ? editingEdges : tab.tree.edges,
                nodes: editedNodesForClass,
              },
            }
          }
          if (i === specTabIndex) {
            return {
              ...tab,
              tree: {
                ...tab.tree,
                edges: activeTree === "spec" ? editingEdges : tab.tree.edges,
                nodes: editedNodesForSpec,
              },
            }
          }
          return tab
        })
      }
      const response = await fetch("/api/talent-tree/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData)
      })
      if (response.ok) {
        onGuideDataSaved?.(updatedData)
        alert("Edges saved successfully!")
      } else {
        alert("Failed to save edges")
      }
    } catch (err) {
      console.error(err)
      alert("Error saving edges")
    } finally {
      setSaving(false)
    }
  }

  const focusedStatus = focusedNode?.talentId
    ? isNodeSelectedCheck(focusedNode, selectedSet, duplicateNodeKeysByTalentId, selectedNodeKeysByTalentId)
      ? "Selected"
      : canSelect(focusedNode.talentId)
        ? "Available"
        : "Locked"
    : focusedNode?.size === "hex"
      ? "Root"
      : "Passive"

  const focusedPrereqs = useMemo(() => {
    if (!focusedNode?.talentId) return []
    const parentKeys = incomingByKey.get(focusedNode.key) ?? []
    const labels = parentKeys.map((key) => {
      const node = nodeByKey.get(key)
      if (!node) return key
      if (node.talentId) return talentsById.get(node.talentId)?.name ?? node.name
      return node.name && node.name !== "Talent" ? node.name : "Path Node"
    })
    return Array.from(new Set(labels))
  }, [focusedNode, incomingByKey, nodeByKey, talentsById])

  const treeType = activeTree
  const treeScale = useMemo(() => {
    if (treeViewportSize.width <= 0 || treeViewportSize.height <= 0) return 1
    return Math.min(treeViewportSize.width / tree.width, treeViewportSize.height / tree.height)
  }, [treeViewportSize.width, treeViewportSize.height, tree.width, tree.height])

  useEffect(() => {
    const canvas = edgeCanvasRef.current
    if (!canvas) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = Math.max(1, Math.round(tree.width * dpr))
    canvas.height = Math.max(1, Math.round(tree.height * dpr))
    canvas.style.width = `${tree.width}px`
    canvas.style.height = `${tree.height}px`

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, tree.width, tree.height)
    ctx.lineWidth = 1.8
    ctx.lineJoin = "round"
    ctx.lineCap = "round"

    for (const edge of tree.edges) {
      const from = nodeByKey.get(edge.from)
      const to = nodeByKey.get(edge.to)
      if (!from || !to) continue

      const fromMetrics = from.frame
        ? { frame: from.frame, inner: from.inner ?? from.frame, icon: from.iconPx ?? 15 }
        : getNodeMetrics(from.size, treeType)
      const toMetrics = to.frame
        ? { frame: to.frame, inner: to.inner ?? to.frame, icon: to.iconPx ?? 15 }
        : getNodeMetrics(to.size, treeType)

      const active = (from.talentId ? isNodeSelectedCheck(from, selectedSet, duplicateNodeKeysByTalentId, selectedNodeKeysByTalentId) : from.size === "hex")
        && (to.talentId ? isNodeSelectedCheck(to, selectedSet, duplicateNodeKeysByTalentId, selectedNodeKeysByTalentId) : to.size === "hex")

      const x1 = from.x + tree.offsetX + (fromMetrics.frame / 2)
      const y1 = from.y + tree.offsetY + (fromMetrics.frame / 2)
      const x2 = to.x + tree.offsetX + (toMetrics.frame / 2)
      const y2 = to.y + tree.offsetY + (toMetrics.frame / 2)

      const dx = x2 - x1
      const dy = y2 - y1
      const absDx = Math.abs(dx)
      const absDy = Math.abs(dy)
      const signX = dx === 0 ? 1 : Math.sign(dx)
      const signY = dy === 0 ? 1 : Math.sign(dy)

      ctx.strokeStyle = active ? "rgba(255,255,255,0.92)" : "rgba(88,69,67,0.78)"
      ctx.beginPath()

      // Keep connector geometry consistent: only horizontal/vertical/45deg segments.
      if (absDx < 0.01 || absDy < 0.01 || Math.abs(absDx - absDy) < 0.01) {
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
      } else if (absDx > absDy) {
        const pivotX = x1 + (signX * absDy)
        const pivotY = y2
        ctx.moveTo(x1, y1)
        ctx.lineTo(pivotX, pivotY)
        ctx.lineTo(x2, y2)
      } else {
        const pivotX = x2
        const pivotY = y1 + (signY * absDx)
        ctx.moveTo(x1, y1)
        ctx.lineTo(pivotX, pivotY)
        ctx.lineTo(x2, y2)
      }

      ctx.stroke()
    }
  }, [tree.width, tree.height, tree.edges, tree.offsetX, tree.offsetY, nodeByKey, selectedSet, treeType, duplicateNodeKeysByTalentId, selectedNodeKeysByTalentId, isNodeSelectedCheck])

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

        {editMode && (
          <button
            type="button"
            className="ml-auto flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg mr-2 my-1 disabled:opacity-50"
            onClick={saveEdges}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Edges"}
          </button>
        )}
      </div>

      <div className="relative" style={{ background: "linear-gradient(rgb(29, 17, 15) 0%, rgb(75, 23, 10) 48.08%, rgb(132, 69, 70) 100%)" }}>
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),transparent_24%,rgba(0,0,0,0.14))" />

        <div className="relative grid gap-3 p-3 lg:grid-cols-[1fr_290px]">
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
              <div
                ref={treeViewportRef}
                className="relative w-full overflow-hidden rounded-[10px] border border-[#3a2d2d] bg-[rgba(9,6,10,0.35)]"
                style={{
                  height: activeTree === "spec" ? "clamp(500px, 72vh, 780px)" : "clamp(430px, 62vh, 620px)",
                }}
              >
                <div className="absolute left-1/2 top-1/2" style={{ transform: `translate(-50%, -50%) scale(${treeScale})`, transformOrigin: "center center" }}>
                  <div className="relative" style={{ width: tree.width, height: tree.height }}>
                    <canvas ref={edgeCanvasRef} className="absolute inset-0" style={{ pointerEvents: "none" }} />

                    <div className="absolute inset-0">
                      {tree.nodes.map((node) => {
                        const metrics = node.frame
                          ? { frame: node.frame, inner: node.inner ?? node.frame, icon: node.iconPx ?? 15 }
                          : getNodeMetrics(node.size, treeType)
                        const { frame, inner, icon } = metrics
                        const selectedNow = isNodeSelectedCheck(node, selectedSet, duplicateNodeKeysByTalentId, selectedNodeKeysByTalentId)
                        const unlocked = editMode || (node.talentId
                          ? (selectedNow || canSelectNode(node))
                          : (node.size === "hex" || activeNodeKeys.has(node.key)))
                        const locked = !unlocked
                        const clickable = editMode || unlocked
                        const isSelectedForEdge = selectedNodeForEdge === node.key

                        const fill = isSelectedForEdge ? "#22c55e" : (selectedNow ? "#db8787" : "rgb(4, 6, 12)")
                        const border = isSelectedForEdge
                          ? "#22c55e"
                          : selectedNow
                            ? "rgb(255,255,255)"
                            : locked
                              ? "rgb(85, 90, 106)"
                              : "rgb(255,255,255)"

                        return (
                          <button
                            key={node.key}
                            type="button"
                            className="absolute flex items-center justify-center"
                            style={{
                              left: node.x + tree.offsetX,
                              top: node.y + tree.offsetY,
                              width: frame,
                              height: frame,
                              background: "transparent",
                              border: "none",
                              opacity: editMode ? 1 : (locked ? 0.58 : 1),
                              cursor: clickable ? "pointer" : "default",
                              padding: 0,
                              outline: isSelectedForEdge ? "2px solid #22c55e" : "none",
                              outlineOffset: "2px",
                            }}
                            onMouseEnter={() => setFocusedNodeKey(node.key)}
                            onFocus={() => setFocusedNodeKey(node.key)}
                            onClick={() => {
                              setFocusedNodeKey(node.key)
                              if (editMode) {
                                handleNodeClickInEditMode(node.key)
                              } else {
                                const talentId = node.talentId
                                if (!talentId || !clickable) return

                                const duplicateKeys = duplicateNodeKeysByTalentId.get(talentId)
                                if (duplicateKeys) {
                                  if (selectedNow) {
                                    const current = selectedNodeKeysByTalentId[talentId] && selectedNodeKeysByTalentId[talentId].length > 0
                                      ? selectedNodeKeysByTalentId[talentId]
                                      : duplicateKeys
                                    const nextKeys = current.filter((key) => key !== node.key)
                                    if (nextKeys.length === 0) {
                                      onToggle(talentId, false)
                                    }
                                    updateSelectedNodeKeysForActiveTree((prev) => {
                                      const prevCurrent = prev[talentId] && prev[talentId].length > 0
                                        ? prev[talentId]
                                        : duplicateKeys
                                      const prevNextKeys = prevCurrent.filter((key) => key !== node.key)
                                      if (prevNextKeys.length === prevCurrent.length) return prev
                                      const next = { ...prev }
                                      if (prevNextKeys.length === 0) {
                                        delete next[talentId]
                                      } else {
                                        next[talentId] = prevNextKeys
                                      }
                                      return next
                                    })
                                  } else {
                                    if (selectedInTree >= tree.cap) return
                                    if (!selectedSet.has(talentId)) {
                                      onToggle(talentId, true)
                                    }
                                    updateSelectedNodeKeysForActiveTree((prev) => {
                                      const current = prev[talentId] ?? []
                                      if (current.includes(node.key)) return prev
                                      return {
                                        ...prev,
                                        [talentId]: [...current, node.key],
                                      }
                                    })
                                  }
                                  return
                                }

                                onToggle(talentId, !selectedNow)
                              }
                            }}
                            title={editMode ? `${node.name} (click to ${isSelectedForEdge ? 'deselect' : 'connect'})` : node.name}
                          >
                            {node.size === "hex" ? (
                              <svg className="absolute" width={inner} height={inner} viewBox={`0 0 ${inner} ${inner}`}>
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
            </div>
          </div>
          <aside className="rounded-[12px] border border-[#3a2d2d] bg-[rgba(8,8,12,0.72)] p-3 text-[#ded9e0] lg:w-[290px] shrink-0">
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

                {editMode && (
                  <div>
                    <div className="mb-1 text-[11px] uppercase tracking-[1px] text-[#9d8f8f]">Edit Talent Mapping</div>
                    <input
                      type="text"
                      placeholder="Search talents..."
                      className="w-full rounded border border-[#4a3b3a] bg-[#0c0a10] px-2 py-1.5 text-xs text-[#e6d8d3] mb-1"
                      value={talentSearchQuery}
                      onChange={(e) => setTalentSearchQuery(e.target.value)}
                    />
                    <select
                      className="w-full rounded border border-[#4a3b3a] bg-[#0c0a10] px-2 py-1.5 text-xs text-[#e6d8d3]"
                      value={focusedNode.talentId ?? ""}
                      onChange={(event) => {
                        const value = event.target.value
                        setNodeTalentInEditMode(focusedNode.key, value ? value : undefined)
                        setTalentSearchQuery("")
                      }}
                      size={8}
                    >
                      <option value="">No Talent (Generic/Path Node)</option>
                      {talents
                        .slice()
                        .filter((t) => t.name.toLowerCase().includes(talentSearchQuery.toLowerCase()))
                        .sort((a, b) => a.name.localeCompare(b.name))
                        .map((talent) => (
                          <option key={talent.id} value={talent.id}>{talent.name}</option>
                        ))}
                    </select>
                  </div>
                )}

                {editMode && (
                  <div>
                    <div className="mb-1 text-[11px] uppercase tracking-[1px] text-[#9d8f8f]">Edit Position</div>
                    <div className="grid grid-cols-2 gap-2">
                      <label className="text-[11px] text-[#b7aab0]">
                        X
                        <input
                          type="number"
                          step={0.1}
                          className="mt-1 w-full rounded border border-[#4a3b3a] bg-[#0c0a10] px-2 py-1 text-xs text-[#e6d8d3]"
                          value={Number.isFinite(focusedNode.x) ? Number(focusedNode.x.toFixed(3)) : 0}
                          onChange={(event) => {
                            const value = Number.parseFloat(event.target.value)
                            if (!Number.isFinite(value)) return
                            setNodePositionInEditMode(focusedNode.key, value, focusedNode.y)
                          }}
                        />
                      </label>
                      <label className="text-[11px] text-[#b7aab0]">
                        Y
                        <input
                          type="number"
                          step={0.1}
                          className="mt-1 w-full rounded border border-[#4a3b3a] bg-[#0c0a10] px-2 py-1 text-xs text-[#e6d8d3]"
                          value={Number.isFinite(focusedNode.y) ? Number(focusedNode.y.toFixed(3)) : 0}
                          onChange={(event) => {
                            const value = Number.parseFloat(event.target.value)
                            if (!Number.isFinite(value)) return
                            setNodePositionInEditMode(focusedNode.key, focusedNode.x, value)
                          }}
                        />
                      </label>
                    </div>

                    <div className="mt-2 grid grid-cols-3 gap-1">
                      <span />
                      <button
                        type="button"
                        className="rounded border border-[#4a3b3a] bg-[#0c0a10] px-2 py-1 text-xs text-[#e6d8d3]"
                        onClick={() => nudgeNodeInEditMode(focusedNode.key, 0, -5)}
                        title="Move up"
                      >
                        Up
                      </button>
                      <span />
                      <button
                        type="button"
                        className="rounded border border-[#4a3b3a] bg-[#0c0a10] px-2 py-1 text-xs text-[#e6d8d3]"
                        onClick={() => nudgeNodeInEditMode(focusedNode.key, -5, 0)}
                        title="Move left"
                      >
                        Left
                      </button>
                      <button
                        type="button"
                        className="rounded border border-[#4a3b3a] bg-[#0c0a10] px-2 py-1 text-xs text-[#e6d8d3]"
                        onClick={() => nudgeNodeInEditMode(focusedNode.key, 0, 5)}
                        title="Move down"
                      >
                        Down
                      </button>
                      <button
                        type="button"
                        className="rounded border border-[#4a3b3a] bg-[#0c0a10] px-2 py-1 text-xs text-[#e6d8d3]"
                        onClick={() => nudgeNodeInEditMode(focusedNode.key, 5, 0)}
                        title="Move right"
                      >
                        Right
                      </button>
                    </div>
                  </div>
                )}

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
                  {editMode
                    ? "Click nodes to connect/disconnect edges. You can also remap this node to any talent above."
                    : "Hover or click a node to inspect it here."}
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
