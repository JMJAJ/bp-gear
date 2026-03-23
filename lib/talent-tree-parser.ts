import type { TalentEntry } from "@/lib/talent-data"

export type TalentTreeNodeSize = "small" | "large" | "hex"

export interface TalentTreeNode {
  id: string
  x: number
  y: number
  icon: string
  size: TalentTreeNodeSize
  name?: string
  desc?: string
  selectable?: boolean
  tier?: number
}

export interface TalentTreeEdge {
  from: string
  to: string
}

export interface TalentTreeTheme {
  background: string
  border: string
  panel: string
}

export interface GuideTalentTreeNode {
  key: string
  x: number
  y: number
  outerWidth: number
  outerHeight: number
  innerWidth: number
  innerHeight: number
  icon: string
  iconWidth: number
  iconHeight: number
  size: TalentTreeNodeSize
  borderColor: string
  fillColor: string
  glowColor?: string
  opacity: number
  defaultActive: boolean
  selectable: boolean
  talentId?: string
  name?: string
  desc?: string
}

export interface GuideTalentTreeNavigationNode {
  key: string
  icon: string
  active: boolean
  talentId?: string
  name?: string
}

export interface GuideTalentTreeVisual {
  title: string
  points: string
  background: string
  width: number
  height: number
  accentColor: string
  navigationBackground: string
  nodes: GuideTalentTreeNode[]
  edges: TalentTreeEdge[]
  navigationNodes: GuideTalentTreeNavigationNode[]
}

export interface GuideTalentTreeTab {
  label: string
  intro: string
  bullets: string[]
  tree: GuideTalentTreeVisual
}

export interface GeneratedTalentTreeData {
  kind: "generated"
  title: string
  nodes: TalentTreeNode[]
  edges: TalentTreeEdge[]
  theme: TalentTreeTheme
}

export interface GuideTalentTreeData {
  kind: "guide"
  title: string
  tabs: GuideTalentTreeTab[]
}

export type TalentTreeData = GeneratedTalentTreeData | GuideTalentTreeData

const DEFAULT_ROW_PATTERN = [1, 2, 3, 4, 5, 5, 5, 5, 5, 4, 4, 4, 3, 3, 2]

const MOONSTRIKE_PRIORITY_ROWS = [
  ["thunder_seed"],
  ["touch_of_thunder_soul", "thunder_rune_mastery", "moonstrike_delay"],
  ["thunder_scythe", "chaos_breaker", "thousand_thunder_flashes"],
  ["thunder_curse", "moonlight_charge", "phantom_delay", "moonblade_swift"],
  ["blade_intent_rare", "phantom_scythe_realm_i", "divine_sickle", "swift", "raijin_dash_charge"],
  ["breath_of_mark", "phantom_scythe_realm_ii", "lightning_flash", "power_of_thunder", "enhanced_thunderstrike"],
  ["thunder_might_2", "thunder_sigil_charm_4", "thunderstrike_whisper", "moonstrike_sharp_strike"],
] as const

const MOONSTRIKE_PRIORITY_IDS = new Set<string>(MOONSTRIKE_PRIORITY_ROWS.flat())

const MINOR_TALENT_NAMES = new Set([
  "Agility Conversion",
  "Arcane",
  "Advancement",
  "Blade Intent",
  "Combat Expertise",
  "Duel Awareness",
  "Power Conversion",
  "Swift Blade",
  "Valor",
])

const GENERIC_ICON_METADATA: Record<string, { name: string; desc: string }> = {
  common_attrdexterity: {
    name: "Agility",
    desc: "Agility stat node from the Maxroll Moonstrike planner.",
  },
  common_attrendurance: {
    name: "Endurance",
    desc: "Endurance stat node from the Maxroll Moonstrike planner.",
  },
  common_icon03: {
    name: "Boss Damage",
    desc: "Damage bonus passive node from the Maxroll Moonstrike planner.",
  },
  common_icon08: {
    name: "Minor Passive",
    desc: "Minor passive node from the Maxroll Moonstrike planner.",
  },
}

const DEFAULT_THEME: TalentTreeTheme = {
  background: "linear-gradient(180deg, #120d0b 0%, #24130f 38%, #432015 68%, #140c0d 100%)",
  border: "#5b2a1d",
  panel: "rgba(10, 12, 18, 0.88)",
}

const MOONSTRIKE_THEME: TalentTreeTheme = {
  background: "radial-gradient(circle at top, rgba(208, 104, 74, 0.22), transparent 34%), linear-gradient(180deg, #1b110f 0%, #331610 36%, #5a2417 66%, #180d0e 100%)",
  border: "#8a4a36",
  panel: "rgba(8, 10, 16, 0.88)",
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function dedupeOrderedIds(ids: string[]): string[] {
  const seen = new Set<string>()
  return ids.filter((id) => {
    if (!id || seen.has(id)) return false
    seen.add(id)
    return true
  })
}

function takeRows(ids: string[], pattern: number[]): string[][] {
  const rows: string[][] = []
  let offset = 0

  for (const size of pattern) {
    if (offset >= ids.length) break
    rows.push(ids.slice(offset, offset + size))
    offset += size
  }

  while (offset < ids.length) {
    rows.push(ids.slice(offset, offset + 4))
    offset += 4
  }

  return rows.filter((row) => row.length > 0)
}

function getTheme(className: string, spec: string): TalentTreeTheme {
  if (className === "Stormblade" && spec === "Moonstrike") {
    return MOONSTRIKE_THEME
  }
  return DEFAULT_THEME
}

function getNodeSize(talent: TalentEntry, className: string, spec: string): TalentTreeNodeSize {
  if (className === "Stormblade" && spec === "Moonstrike" && MOONSTRIKE_PRIORITY_IDS.has(talent.id)) {
    return "large"
  }

  if (talent.icon.toLowerCase().includes("/common_") || MINOR_TALENT_NAMES.has(talent.name)) {
    return "small"
  }

  return "large"
}

function buildRows(className: string, spec: string, orderedIds: string[]): string[][] {
  if (className === "Stormblade" && spec === "Moonstrike") {
    const explicitRows: string[][] = MOONSTRIKE_PRIORITY_ROWS
      .map((row) => row.filter((id) => orderedIds.includes(id)))
      .filter((row) => row.length > 0)

    const remainingIds = orderedIds.filter(
      (id) => !explicitRows.some((row) => row.includes(id)),
    )

    return [...explicitRows, ...takeRows(remainingIds, [4, 5, 5, 5, 4, 4, 3, 3, 2])]
  }

  return takeRows(orderedIds, DEFAULT_ROW_PATTERN)
}

function buildEdges(rootId: string, rows: string[][]): TalentTreeEdge[] {
  const edges: TalentTreeEdge[] = []

  rows.forEach((row, tierIndex) => {
    if (tierIndex === 0) {
      row.forEach((id) => edges.push({ from: rootId, to: id }))
      return
    }

    const parentRow = rows[tierIndex - 1]
    row.forEach((id, index) => {
      const parentIndex = parentRow.length === 1
        ? 0
        : Math.round((index * (parentRow.length - 1)) / Math.max(1, row.length - 1))
      edges.push({ from: parentRow[parentIndex], to: id })
    })
  })

  return edges
}

export function buildTalentTreeFromTalents({
  className,
  spec,
  talents,
}: {
  className: string
  spec: string
  talents: TalentEntry[]
}): GeneratedTalentTreeData | null {
  if (!talents.length) return null

  const talentsById = new Map(talents.map((talent) => [talent.id, talent]))
  const orderedIds = dedupeOrderedIds([
    ...(className === "Stormblade" && spec === "Moonstrike" ? [...MOONSTRIKE_PRIORITY_IDS] : []),
    ...talents.map((talent) => talent.id),
  ]).filter((id) => talentsById.has(id))

  const rows = buildRows(className, spec, orderedIds)
  const rootTalent = talentsById.get(rows[0]?.[0] ?? orderedIds[0]) ?? talents[0]
  const rootId = `${slugify(className || "talent")}-${slugify(spec || "tree")}-root`
  const horizontalGap = 118
  const verticalGap = 118

  const nodes: TalentTreeNode[] = [
    {
      id: rootId,
      x: 0,
      y: 0,
      icon: rootTalent.icon,
      size: "hex",
      name: `${spec || className} Spec`,
      desc: `${className} talents sourced from Maxroll data and arranged in a stable planner layout.`,
      selectable: false,
      tier: 0,
    },
  ]

  rows.forEach((row, rowIndex) => {
    const startX = -((row.length - 1) * horizontalGap) / 2
    row.forEach((id, columnIndex) => {
      const talent = talentsById.get(id)
      if (!talent) return

      nodes.push({
        id: talent.id,
        x: startX + columnIndex * horizontalGap + (rowIndex % 2 === 0 ? 0 : 14),
        y: 128 + rowIndex * verticalGap,
        icon: talent.icon,
        size: getNodeSize(talent, className, spec),
        name: talent.name,
        desc: talent.desc,
        selectable: true,
        tier: rowIndex + 1,
      })
    })
  })

  return {
    kind: "generated",
    title: spec || className || "Talent Tree",
    nodes,
    edges: buildEdges(rootId, rows),
    theme: getTheme(className, spec),
  }
}

function parsePx(v: string | undefined): number {
  if (!v) return 0
  const match = v.match(/-?\d+(?:\.\d+)?/)
  return match ? parseFloat(match[0]) : 0
}

function parseInlineStyle(styleText: string | null): Record<string, string> {
  if (!styleText) return {}
  const entries = styleText
    .split(";")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const separatorIndex = entry.indexOf(":")
      if (separatorIndex === -1) return null
      return [entry.slice(0, separatorIndex).trim(), entry.slice(separatorIndex + 1).trim()] as const
    })
    .filter((entry): entry is readonly [string, string] => entry !== null)

  return Object.fromEntries(entries)
}

function normalizeText(value: string | null | undefined): string {
  return (value ?? "").replace(/\s+/g, " ").replace(/\u200b/g, "").trim()
}

function getClassName(element: Element): string {
  return element.getAttribute("class") ?? ""
}

function hasClassPart(element: Element, value: string): boolean {
  return getClassName(element).includes(value)
}

function getDirectChildrenByClassPart(parent: Element, value: string): HTMLElement[] {
  return Array.from(parent.children)
    .filter((child): child is HTMLElement => child instanceof HTMLElement)
    .filter((child) => hasClassPart(child, value))
}

function findFirstTreeContainer(root: HTMLElement): HTMLElement | null {
  const visibleNestedTabs = Array.from(root.querySelectorAll<HTMLElement>('div[class*="_tab_"][class*="_visible_"]'))
  for (const tab of visibleNestedTabs) {
    const tree = tab.querySelector<HTMLElement>('div[class*="_TalentTree__container_"]')
    if (tree) return tree
  }

  return root.querySelector<HTMLElement>('div[class*="_TalentTree__container_"]')
}

function getIconSlug(icon: string): string {
  return icon.split("?")[0].split("/").pop()?.replace(/\.webp$/i, "") ?? icon
}

function inferMetadataFromIcon(icon: string): { name?: string; desc?: string } {
  const metadata = GENERIC_ICON_METADATA[getIconSlug(icon)]
  return metadata ?? {}
}

function buildTalentAssignments(talents: TalentEntry[]): Map<string, TalentEntry[]> {
  const assignments = new Map<string, TalentEntry[]>()
  for (const talent of talents) {
    const existing = assignments.get(talent.icon) ?? []
    existing.push(talent)
    assignments.set(talent.icon, existing)
  }
  return assignments
}

function assignTalentByIcon(
  icon: string,
  iconAssignments: Map<string, TalentEntry[]>,
  iconUsage: Map<string, number>,
): TalentEntry | undefined {
  const matches = iconAssignments.get(icon)
  if (!matches || matches.length === 0) return undefined
  const currentUsage = iconUsage.get(icon) ?? 0
  const resolved = matches[Math.min(currentUsage, matches.length - 1)]
  iconUsage.set(icon, currentUsage + 1)
  return resolved
}

function groupNodesByRows(nodes: GuideTalentTreeNode[]): GuideTalentTreeNode[][] {
  const sorted = [...nodes].sort((left, right) => left.y - right.y || left.x - right.x)
  const rows: GuideTalentTreeNode[][] = []
  const tolerance = 18

  for (const node of sorted) {
    const currentRow = rows.at(-1)
    if (!currentRow) {
      rows.push([node])
      continue
    }

    if (Math.abs(currentRow[0].y - node.y) <= tolerance) {
      currentRow.push(node)
      continue
    }

    rows.push([node])
  }

  rows.forEach((row) => row.sort((left, right) => left.x - right.x))
  return rows
}

function inferGuideEdges(nodes: GuideTalentTreeNode[]): TalentTreeEdge[] {
  const rows = groupNodesByRows(nodes)
  const edges: TalentTreeEdge[] = []

  for (let rowIndex = 1; rowIndex < rows.length; rowIndex += 1) {
    const row = rows[rowIndex]
    const previousRows = rows.slice(Math.max(0, rowIndex - 2), rowIndex).flat()

    for (const node of row) {
      const candidates = previousRows
        .map((candidate) => {
          const dx = Math.abs((candidate.x + candidate.outerWidth / 2) - (node.x + node.outerWidth / 2))
          const dy = node.y - candidate.y
          const score = dy * 1.3 + dx
          return { candidate, dx, dy, score }
        })
        .filter(({ dy, dx }) => dy > 0 && dy <= 110 && dx <= 132)
        .sort((left, right) => left.score - right.score)

      const best = candidates[0]
      if (!best) continue
      edges.push({ from: best.candidate.key, to: node.key })

      const alternate = candidates[1]
      if (
        alternate &&
        alternate.score <= best.score + 22 &&
        Math.abs((alternate.candidate.x + alternate.candidate.outerWidth / 2) - (best.candidate.x + best.candidate.outerWidth / 2)) > 26
      ) {
        edges.push({ from: alternate.candidate.key, to: node.key })
      }
    }
  }

  return dedupeEdges(edges)
}

function dedupeEdges(edges: TalentTreeEdge[]): TalentTreeEdge[] {
  const seen = new Set<string>()
  return edges.filter((edge) => {
    const key = `${edge.from}->${edge.to}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function parseGuideTreeContainer(
  treeContainer: HTMLElement,
  talents: TalentEntry[],
): GuideTalentTreeVisual | null {
  const background = treeContainer.querySelector<HTMLElement>('div[class*="_TalentTree__bkg_"]')?.style.background
    ?? DEFAULT_THEME.background
  const title = normalizeText(
    treeContainer.querySelector<HTMLElement>('div[class*="_TalentTree__title_"] span span:last-child')?.textContent,
  ) || "Moonstrike Spec"
  const points = normalizeText(
    treeContainer.querySelector<HTMLElement>('div[class*="_TalentTree__leftContainer_"] i')?.textContent,
  ) || "0 / 0"

  const canvas = treeContainer.querySelector<HTMLElement>('canvas[class*="_TalentTree__canvas_"]')
  const width = parsePx(canvas?.style.width) || parsePx(canvas?.getAttribute("width") ?? undefined) || 365
  const height = parsePx(canvas?.style.height) || parsePx(canvas?.getAttribute("height") ?? undefined) || 600
  const accentColor = treeContainer.querySelector<SVGPolygonElement>("polygon")?.getAttribute("fill") ?? "#db8787"
  const navigation = treeContainer.querySelector<HTMLElement>('div[class*="_TalentTreeNavigation_"]')
  const navigationBackground = parseInlineStyle(navigation?.getAttribute("style") ?? null)["background-color"] ?? "rgb(4, 6, 12)"

  const iconAssignments = buildTalentAssignments(talents)
  const iconUsage = new Map<string, number>()

  const nodes = getDirectChildrenByClassPart(treeContainer, "_TalentNode_").map((nodeElement, index) => {
    const outerStyle = parseInlineStyle(nodeElement.getAttribute("style"))
    const innerElement = nodeElement.querySelector<HTMLElement>('div[class*="_TalentNode__inner_"]')
    const innerStyle = parseInlineStyle(innerElement?.getAttribute("style") ?? null)
    const iconElement = nodeElement.querySelector<HTMLImageElement>("img")
    const icon = iconElement?.getAttribute("src") ?? ""
    const iconAssignment = assignTalentByIcon(icon, iconAssignments, iconUsage)
    const defaultActive = (innerStyle["border"] ?? "").includes("255, 255, 255")
      && (innerStyle["--node-bg-color"] ?? accentColor).toLowerCase() !== "rgb(4, 6, 12)"
    const inferredMetadata = inferMetadataFromIcon(icon)

    return {
      key: iconAssignment?.id ?? `guide-node-${index + 1}`,
      x: parsePx(outerStyle.left),
      y: parsePx(outerStyle.top),
      outerWidth: parsePx(outerStyle.width) || 38,
      outerHeight: parsePx(outerStyle.height) || 38,
      innerWidth: parsePx(innerStyle.width) || 25,
      innerHeight: parsePx(innerStyle.height) || 25,
      icon,
      iconWidth: parsePx(iconElement?.getAttribute("width") ?? undefined) || 15,
      iconHeight: parsePx(iconElement?.getAttribute("height") ?? undefined) || 15,
      size: nodeElement.querySelector("polygon")
        ? "hex"
        : parsePx(innerStyle.width) >= 36
          ? "large"
          : "small",
      borderColor: (innerStyle.border?.match(/rgb\([^)]*\)|#[0-9a-fA-F]+/)?.[0])
        ?? (defaultActive ? "rgb(255, 255, 255)" : "rgb(85, 90, 106)"),
      fillColor: innerStyle["--node-bg-color"] ?? accentColor,
      glowColor: innerStyle["--glow-color"],
      opacity: parsePx(outerStyle.opacity) || 1,
      defaultActive,
      selectable: Boolean(iconAssignment),
      talentId: iconAssignment?.id,
      name: iconAssignment?.name ?? inferredMetadata.name,
      desc: iconAssignment?.desc ?? inferredMetadata.desc,
    } satisfies GuideTalentTreeNode
  })

  const navigationNodes = navigation
    ? Array.from(navigation.querySelectorAll<HTMLElement>('div[class*="_TalentTreeNavigation__node_"]')).map((nodeElement, index) => {
        const iconElement = nodeElement.querySelector<HTMLImageElement>("img")
        const icon = iconElement?.getAttribute("src") ?? ""
        const iconAssignment = assignTalentByIcon(icon, iconAssignments, iconUsage)
        const inferredMetadata = inferMetadataFromIcon(icon)

        return {
          key: iconAssignment?.id ?? `guide-nav-${index + 1}`,
          icon,
          active: hasClassPart(nodeElement, "_active_"),
          talentId: iconAssignment?.id,
          name: iconAssignment?.name ?? inferredMetadata.name,
        } satisfies GuideTalentTreeNavigationNode
      })
    : []

  if (nodes.length === 0) return null

  return {
    title,
    points,
    background,
    width,
    height,
    accentColor,
    navigationBackground,
    nodes,
    edges: inferGuideEdges(nodes),
    navigationNodes,
  }
}

export function parseTalentPlannerFromMaxrollHtml(
  html: string,
  talents: TalentEntry[],
): GuideTalentTreeData | null {
  if (!html.trim()) return null

  const parser = new DOMParser()
  const document = parser.parseFromString(html, "text/html")
  const root = document.body

  const scrollBox = root.querySelector<HTMLElement>('div[class*="_scrollBox_"]')
  const container = root.querySelector<HTMLElement>('div[class*="_container_"]')

  const labels = scrollBox
    ? Array.from(scrollBox.querySelectorAll<HTMLElement>('div[class*="_headerText_"]'))
        .map((element) => normalizeText(element.textContent))
        .filter(Boolean)
    : []

  const tabs = container ? getDirectChildrenByClassPart(container, "_tab_") : []

  const parsedTabs = tabs.length > 0
    ? tabs.map((tab, index) => {
        const intro = normalizeText(tab.querySelector("p")?.textContent)
        const bullets = Array.from(tab.querySelectorAll("li")).map((element) => normalizeText(element.textContent)).filter(Boolean)
        const treeContainer = findFirstTreeContainer(tab)
        if (!treeContainer) return null

        const tree = parseGuideTreeContainer(treeContainer, talents)
        if (!tree) return null

        return {
          label: labels[index] ?? `Build ${index + 1}`,
          intro,
          bullets,
          tree,
        } satisfies GuideTalentTreeTab
      }).filter((tab): tab is GuideTalentTreeTab => tab !== null)
    : (() => {
        const treeContainer = root.querySelector<HTMLElement>('div[class*="_TalentTree__container_"]')
        if (!treeContainer) return []

        const tree = parseGuideTreeContainer(treeContainer, talents)
        if (!tree) return []

        return [{
          label: labels[0] ?? tree.title ?? "Build 1",
          intro: "",
          bullets: [],
          tree,
        } satisfies GuideTalentTreeTab]
      })()

  if (parsedTabs.length === 0) return null

  return {
    kind: "guide",
    title: parsedTabs[0]?.tree.title ?? "Talent Planner",
    tabs: parsedTabs,
  }
}

/**
 * Legacy parser retained for ad-hoc tree imports.
 */
export function parseTalentTreeFromMaxrollHtml(html: string): GeneratedTalentTreeData | null {
  const parser = new DOMParser()
  const document = parser.parseFromString(html, "text/html")
  const treeContainer = document.querySelector<HTMLElement>('div[class*="_TalentTree__container_"]')
  if (!treeContainer) return null

  const nodes = getDirectChildrenByClassPart(treeContainer, "_TalentNode_").map((nodeElement, index) => {
    const outerStyle = parseInlineStyle(nodeElement.getAttribute("style"))
    const innerElement = nodeElement.querySelector<HTMLElement>('div[class*="_TalentNode__inner_"]')
    const innerStyle = parseInlineStyle(innerElement?.getAttribute("style") ?? null)
    const icon = nodeElement.querySelector<HTMLImageElement>("img")?.getAttribute("src") ?? ""

    return {
      id: `parsed-node-${index + 1}`,
      x: parsePx(outerStyle.left),
      y: parsePx(outerStyle.top),
      icon,
      size: nodeElement.querySelector("polygon")
        ? "hex"
        : parsePx(innerStyle.width) >= 36
          ? "large"
          : "small",
      selectable: true,
    } satisfies TalentTreeNode
  })

  if (nodes.length === 0) return null

  return {
    kind: "generated",
    title: normalizeText(treeContainer.querySelector<HTMLElement>('div[class*="_TalentTree__title_"]')?.textContent) || "Talent Tree",
    nodes,
    edges: nodes.slice(1).map((node, index) => ({ from: nodes[Math.max(0, index)].id, to: node.id })),
    theme: DEFAULT_THEME,
  }
}