export type TalentTreeNodeSize = "small" | "large" | "hex"

export interface TalentTreeNode {
  id: string
  x: number
  y: number
  icon: string
  size: TalentTreeNodeSize
}

export interface TalentTreeEdge {
  from: string
  to: string
}

export interface TalentTreeData {
  title: string
  nodes: TalentTreeNode[]
  edges: TalentTreeEdge[]
}

function slugFromIconUrl(iconUrl: string): string {
  const clean = iconUrl.split("?")[0]
  const file = clean.split("/").pop() ?? clean
  return file
    .replace(/\.webp$/i, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase()
}

function parsePx(v: string | undefined): number {
  if (!v) return 0
  const m = v.match(/-?\d+(?:\.\d+)?/)
  return m ? parseFloat(m[0]) : 0
}

/**
 * Parses a Maxroll talent tree HTML dump and returns positioned nodes.
 *
 * Notes:
 * - The dump does not contain explicit prerequisite edges.
 * - We derive edges by connecting each node to the closest node above it.
 */
export function parseTalentTreeFromMaxrollHtml(html: string): TalentTreeData {
  const titleMatch = html.match(
    /_TalentTree__title_[^>]*>[\s\S]*?<span[^>]*>([^<\n\r]+)\s*Spec<\/span>/i,
  )
  const title = (titleMatch?.[1] ?? "Talent").trim()

  const nodeBlocks = [...html.matchAll(/<div class="_TalentNode_[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/g)]

  const nodes: TalentTreeNode[] = []
  const seen = new Map<string, number>()

  nodeBlocks.forEach((block) => {
    const b = block[0]
    const styleOuter = b.match(/<div class="_TalentNode_[^\"]*"[\s\S]*?style="([^"]+)"/i)?.[1]
    const styleInner = b.match(/<div class="_TalentNode__inner_[^\"]*"[\s\S]*?style="([^"]+)"/i)?.[1]
    const icon = b.match(/<img[^>]+src="([^"]+)"/i)?.[1]
    if (!styleOuter || !icon) return

    const left = parsePx(styleOuter.match(/left:\s*([^;]+);/i)?.[1])
    const top = parsePx(styleOuter.match(/top:\s*([^;]+);/i)?.[1])

    const innerW = parsePx(styleInner?.match(/width:\s*([^;]+);/i)?.[1])
    const size: TalentTreeNodeSize = innerW >= 68 ? "large" : "small"
    const isHex = /<polygon[\s\S]*?points=/i.test(b)
    const finalSize: TalentTreeNodeSize = isHex ? "hex" : size

    const baseSlug = slugFromIconUrl(icon)
    const used = seen.get(baseSlug) ?? 0
    seen.set(baseSlug, used + 1)
    const id = used === 0 ? baseSlug : `${baseSlug}_${used + 1}`

    nodes.push({ id, x: left, y: top, icon, size: finalSize })
  })

  // Derive edges: for each node, connect to nearest node above it (y smaller) within a distance threshold.
  const edges: TalentTreeEdge[] = []
  const maxYGap = 180
  const maxXGap = 260

  nodes.forEach((n) => {
    const candidates = nodes.filter((p) => p.y < n.y)
    let best: { p: TalentTreeNode; score: number } | null = null

    for (const p of candidates) {
      const dy = n.y - p.y
      const dx = Math.abs(n.x - p.x)
      if (dy <= 0) continue
      if (dy > maxYGap) continue
      if (dx > maxXGap) continue

      // Weighted score prefers closer vertical, then closer horizontal
      const score = dy * 1.2 + dx
      if (!best || score < best.score) best = { p, score }
    }

    if (best) edges.push({ from: best.p.id, to: n.id })
  })

  // Sort for stable rendering
  nodes.sort((a, b) => (a.y - b.y) || (a.x - b.x))

  return { title, nodes, edges }
}
