"use client"
import { useEffect, useState, useMemo } from "react"
import { useApp, getClassForSpec, getStatPercentCombat } from "@/lib/app-context"
import { GAME_DATA, SIGIL_DB, SIGIL_ICONS_BASE, getTierData, getSlotType, applyPerfection, getBasicAttrs } from "@/lib/game-data"
import type { GearSlot } from "@/lib/game-data"

const ICON_BASE = "https://assets-ng.maxroll.gg/sr-tools/assets/db/icons"

// ── Slot placeholder icons from Maxroll CDN ────────────────────────────────
const SLOT_ICONS: Record<string, string> = {
  "Weapon": `${ICON_BASE}/items/equipment/ch_wp_olvera_02_01.webp`,
  "Helmet": `${ICON_BASE}/items/equipment/headwear_icon_c_armouragile02.webp`,
  "Chest": `${ICON_BASE}/items/equipment/clothes_icon_m_armouragile02.webp`,
  "Gloves": `${ICON_BASE}/items/equipment/gloves_icon_m_armouragile02.webp`,
  "Boots": `${ICON_BASE}/items/equipment/shoes_icon_m_armouragile02.webp`,
  "Earrings": `${ICON_BASE}/items/equipment/ears_icon_f_fangxing02.webp`,
  "Necklace": `${ICON_BASE}/items/equipment/neck_icon_m_fangxing02.webp`,
  "Ring": `${ICON_BASE}/items/equipment/ring_icon_m_fangxing02.webp`,
  "Bracelet (L)": `${ICON_BASE}/items/equipment/c_equip_icon_wristbandr03.webp`,
  "Bracelet (R)": `${ICON_BASE}/items/equipment/c_equip_icon_wristbandl03.webp`,
  "Charm": `${ICON_BASE}/items/equipment/c_equip_icon_amulet03.webp`,
}

// ── Attribute icons for tooltip ───────────────────────────────────────────
const ATTR_ICONS: Record<string, string> = {
  "Versatility": `${ICON_BASE}/attributes/fight/common_attrversatility.webp`,
  "Mastery": `${ICON_BASE}/attributes/fight/common_attrmastery.webp`,
  "Haste": `${ICON_BASE}/attributes/fight/common_attrhaste.webp`,
  "Crit": `${ICON_BASE}/attributes/fight/common_icon12.webp`,
  "Luck": `${ICON_BASE}/attributes/fight/common_attrluck.webp`,
  "ATK": `${ICON_BASE}/attributes/fight/common_attrattack.webp`,
  "MATK": `${ICON_BASE}/attributes/fight/common_attrattack.webp`,
  "Illusion Strength": `${ICON_BASE}/attributes/fight/common_icon01.webp`,
  "Agility": `${ICON_BASE}/attributes/fight/common_attrdexterity.webp`,
  "Strength": `${ICON_BASE}/attributes/fight/common_attrdexterity.webp`,
  "Intellect": `${ICON_BASE}/attributes/fight/common_attrdexterity.webp`,
  "Endurance": `${ICON_BASE}/attributes/fight/common_icon08.webp`,
}

// ── Rarity colour from tier string ────────────────────────────────────────
function rarityColor(tier: string): string {
  if (tier.includes("Far Sea")) return "#49A8FF"
  if (tier.includes("90") || tier.includes("110") || tier.includes("130") || tier.includes("150") || tier.includes("170")) return "#e84545"
  if (tier.includes("Raid")) return "#e84545"
  return "#c5bb42"
}

const SZ = 100 // slot size px (bigger for profile layout)

// ── Tooltip ───────────────────────────────────────────────────────────────

interface TooltipProps {
  slot: string
  slotIdx: number
  g: GearSlot
  legType?: string
  legVal?: number
  align?: "left" | "center" | "right"
  anchorRect?: DOMRect | null
}

function GearTooltip({ slot, slotIdx, g, legType = "-", legVal = 0, anchorRect }: TooltipProps) {
  const slotType = getSlotType(slotIdx)
  const rawTierData = g.tier ? getTierData(slotType, g.tier) : null
  const color = rarityColor(g.tier ?? "")

  const sigil = g.sigName ? SIGIL_DB.find(s => s.n === g.sigName) : null
  const sigilLvl = parseInt(g.sigLvl) || 1
  const sigilData = sigil?.d[sigilLvl] ?? sigil?.d[1]

  const perfection = g.perfection ?? 100

  // Apply perfection scaling to get the real in-game values shown in tooltip
  const tierData = rawTierData
    ? (perfection < 100 ? applyPerfection(rawTierData, perfection) : rawTierData)
    : null

  // Basic attribute lookup (user-filled data)
  const basicAttrs = g.tier ? getBasicAttrs(g.tier, slotType) : null

  // ── Tooltip positioning ────────────────────────────────────────────────
  // Compute position synchronously from anchorRect so there's no flash.
  const pos = useMemo(() => {
    if (!anchorRect) return null
    const W = 300
    const MARGIN = 10
    const GAP = 8
    const vw = window.innerWidth
    const vh = window.innerHeight

    // Horizontal: prefer right side of slot, fall back to left
    let left = anchorRect.right + GAP
    if (left + W > vw - MARGIN) left = anchorRect.left - W - GAP
    left = Math.max(MARGIN, Math.min(vw - W - MARGIN, left))

    // Vertical: align top with slot, clamp to viewport
    let top = anchorRect.top
    top = Math.max(MARGIN, Math.min(vh - MARGIN - 100, top)) // 100 = minimum visible

    return { left, top }
  }, [anchorRect])

  if (!pos) return null

  // ── Helpers ────────────────────────────────────────────────────────────
  const sectionTitle = (label: string) => (
    <div style={{
      fontSize: 10, fontWeight: 700, color: "#555", letterSpacing: "0.08em",
      textTransform: "uppercase", padding: "6px 0 3px",
      borderBottom: "1px solid #1e1e1e", marginBottom: 3,
    }}>{label}</div>
  )

  const attrRow = (
    icon: string | undefined,
    label: string,
    value: string | number,
    variant: "normal" | "quality" | "reforge" = "normal"
  ) => (
    <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "2.5px 0" }}>
      {icon
        ? <img src={icon} width={16} height={16} style={{ objectFit: "contain", flexShrink: 0, opacity: variant === "reforge" ? 0.5 : 1 }} />
        : <div style={{ width: 16, flexShrink: 0 }} />
      }
      <span style={{
        flex: 1, fontSize: 12,
        color: variant === "quality" ? "#c4b5fd" : variant === "reforge" ? "#666" : "#aaa",
      }}>{label}</span>
      <span style={{
        fontSize: 12, fontWeight: 600, fontVariantNumeric: "tabular-nums",
        color: variant === "quality" ? "#c4b5fd" : variant === "reforge" ? "#666" : "#fff",
      }}>{value}</span>
    </div>
  )

  const levelMatch = g.tier?.match(/Lv(\d+)/)
  const itemLevel = levelMatch ? parseInt(levelMatch[1]) : 0
  const wearingLevel = itemLevel >= 140 ? 60 : itemLevel >= 120 ? 50 : itemLevel >= 80 ? 40 : itemLevel >= 60 ? 30 : 0
  const isRaid = rawTierData?.raid ?? g.raid
  const perfPct = perfection

  const isCompletelyRed = g.tier && (g.tier.includes("90") || g.tier.includes("110") || g.tier.includes("130") || g.tier.includes("150") || g.tier.includes("170"))
  const headerGrad = isCompletelyRed
    ? `linear-gradient(rgba(180,0,0,0) 0%, rgba(180,0,0,0.35) 100%)`
    : `linear-gradient(rgba(172,153,89,0) 0%, rgba(172,153,89,0.3) 100%)`

  // Determine which icon to use for primary/secondary/reforge stats
  const statIcon = (name: string) =>
    ATTR_ICONS[name] ?? `${ICON_BASE}/attributes/fight/common_attrmastery.webp`

  return (
    <div
      style={{
        position: "fixed", zIndex: 1000,
        width: 300, maxHeight: "calc(100vh - 20px)",
        left: pos.left, top: pos.top,
        background: "#0d0d0d",
        border: `1px solid ${color}55`,
        boxShadow: `0 0 24px ${color}22, 0 8px 32px rgba(0,0,0,0.95)`,
        pointerEvents: "none",
        overflow: "hidden",
      }}
    >
      {/* ── Title bar ──────────────────────────────────────────────────── */}
      <div style={{
        background: headerGrad,
        borderBottom: `1px solid ${color}33`,
        padding: "10px 12px",
        display: "flex", alignItems: "flex-start", gap: 10,
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Slot type + level badges */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
            <span style={{ fontSize: 10, color: "#555", letterSpacing: "0.05em", textTransform: "uppercase" }}>{slot}</span>
            {itemLevel > 0 && (
              <span style={{ fontSize: 10, color: color + "cc", fontWeight: 700 }}>Lv.{itemLevel}</span>
            )}
            {isRaid && (
              <span style={{ fontSize: 9, color: "#e84545", border: "1px solid #e8454533", padding: "0 4px", letterSpacing: "0.08em" }}>RAID</span>
            )}
            {wearingLevel > 0 && (
              <span style={{ fontSize: 10, color: "#555" }}>Req {wearingLevel}</span>
            )}
          </div>
          {/* Tier name */}
          <div style={{ fontSize: 14, fontWeight: 700, color, lineHeight: 1.2, marginBottom: 8 }}>
            {g.tier || "Empty Slot"}
          </div>
          {/* Perfection bar */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ flex: 1, height: 4, background: "#1a1a1a", borderRadius: 2, overflow: "hidden" }}>
              <div style={{
                height: "100%", borderRadius: 2,
                width: `${perfPct}%`,
                background: perfPct >= 100
                  ? `linear-gradient(90deg, ${color}88, ${color})`
                  : `linear-gradient(90deg, #e5c22988, #e5c229)`,
              }} />
            </div>
            <span style={{
              fontSize: 10, fontWeight: 700, fontVariantNumeric: "tabular-nums",
              color: perfPct >= 100 ? color : "#e5c229",
              flexShrink: 0,
            }}>{perfPct}/100</span>
          </div>
        </div>
        <img
          src={SLOT_ICONS[slot]} width={52} height={52}
          style={{ objectFit: "contain", flexShrink: 0, marginTop: 2 }}
        />
      </div>

      {/* ── Body ────────────────────────────────────────────────────────── */}
      <div style={{ padding: "6px 12px 12px" }}>

        {/* Basic Attributes */}
        {basicAttrs && (slotType === "armor"
          ? (basicAttrs as { atk: number; mainStat: number; hp: number; armor: number })
          : (basicAttrs as { atk: number; mainStat: number; endurance?: number })
        ) && (() => {
          const ba = basicAttrs as any
          const hasAny = ba.atk > 0 || ba.mainStat > 0 || (ba.hp ?? 0) > 0 || (ba.armor ?? 0) > 0 || (ba.endurance ?? 0) > 0
          if (!hasAny) return null
          return (
            <div style={{ marginBottom: 4 }}>
              {sectionTitle("Basic Attributes")}
              {tierData && tierData.illu > 0 && attrRow(ATTR_ICONS["Illusion Strength"], "Illusion Strength", tierData.illu)}
              {ba.atk > 0 && attrRow(ATTR_ICONS["ATK"], "ATK / MATK", ba.atk)}
              {ba.mainStat > 0 && attrRow(ATTR_ICONS["Agility"], "Main Stat", ba.mainStat)}
              {(ba.hp ?? 0) > 0 && attrRow(undefined, "Max HP", ba.hp)}
              {(ba.armor ?? 0) > 0 && attrRow(undefined, "Armor", ba.armor)}
              {(ba.endurance ?? 0) > 0 && attrRow(ATTR_ICONS["Endurance"], "Endurance", ba.endurance)}
            </div>
          )
        })()}

        {/* Illusion Strength (no basic attrs but has illu) */}
        {(!basicAttrs || !(() => { const ba = basicAttrs as any; return ba.atk > 0 || ba.mainStat > 0 })()) &&
          tierData && tierData.illu > 0 && (
          <div style={{ marginBottom: 4 }}>
            {sectionTitle("Basic Attributes")}
            {attrRow(ATTR_ICONS["Illusion Strength"], "Illusion Strength", tierData.illu)}
          </div>
        )}

        {/* Advanced Attributes */}
        {tierData && (g.p && g.p !== "-" || g.s && g.s !== "-" || g.r && g.r !== "-" || (legType && legType !== "-" && legVal > 0)) && (
          <div style={{ marginBottom: 4 }}>
            {sectionTitle("Advanced Attributes")}
            {/* Purple stat — quality accent */}
            {legType && legType !== "-" && legVal > 0 && (
              attrRow(
                ATTR_ICONS["ATK"],
                legType,
                legType.includes("%") ? `+${legVal}%` : `+${legVal}`,
                "quality"
              )
            )}
            {/* Primary advanced stat */}
            {g.p && g.p !== "-" && tierData.p > 0 && (
              attrRow(statIcon(g.p), g.p, `+${tierData.p}`)
            )}
            {/* Secondary advanced stat */}
            {g.s && g.s !== "-" && tierData.s > 0 && (
              attrRow(statIcon(g.s), g.s, `+${tierData.s}`)
            )}
            {/* Reforge stat (dimmed) */}
            {g.r && g.r !== "-" && tierData.r > 0 && (
              attrRow(statIcon(g.r), `${g.r} (Reforge)`, `+${tierData.r}`, "reforge")
            )}
          </div>
        )}

        {/* Sigil/Effects */}
        {sigil && sigilData && (
          <div>
            <div style={{ marginTop: 4 }}>
              {sectionTitle("Effects")}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 5 }}>
              <img
                src={sigil.icon ? `${SIGIL_ICONS_BASE}${sigil.icon}` : `${ICON_BASE}/items/gems/item_icons_enchantformula30.webp`}
                alt={sigil.n} width={20} height={20}
                style={{ objectFit: "contain" }}
              />
              <span style={{ fontSize: 12, fontWeight: 700, color: "#e5c229" }}>{sigil.n}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {Object.entries(sigilData).map(([stat, val]) => (
                attrRow(ATTR_ICONS[stat], stat, `+${val}`)
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!tierData && !sigil && (
          <div style={{ fontSize: 11, color: "#444", textAlign: "center", padding: "10px 0" }}>No gear configured</div>
        )}
      </div>
    </div>
  )
}

// ── Slot button ────────────────────────────────────────────────────────────

function SlotButton({ slot, slotIdx, g, legType, legVal, align = "center" }: TooltipProps) {
  const [hovered, setHovered] = useState(false)
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null)
  const color = rarityColor(g.tier ?? "")
  const isEmpty = !g.tier || ((!g.p || g.p === "-") && (!g.s || g.s === "-"))

  const isCompletelyRed = g.tier && (g.tier.includes("90") || g.tier.includes("110") || g.tier.includes("130") || g.tier.includes("150") || g.tier.includes("170"))
  const slotBg = isEmpty
    ? "none"
    : isCompletelyRed
      ? `linear-gradient(rgba(255,0,0,0) 0%, rgba(255,0,0,0.3) 50%, ${color}55 100%)`
      : `linear-gradient(rgba(172,153,89,0) 0%, rgba(176,152,87,0.3) 50%, ${color}55 100%)`

  return (
    <div
      style={{ position: "relative", display: "inline-block" }}
      onMouseEnter={(e) => {
        setHovered(true)
        setAnchorRect((e.currentTarget as HTMLDivElement).getBoundingClientRect())
      }}
      onMouseLeave={() => {
        setHovered(false)
        setAnchorRect(null)
      }}
    >
      <div style={{
        width: SZ, height: SZ,
        backgroundImage: slotBg,
        border: `1px solid ${isEmpty ? "#222" : hovered ? color : color + "55"}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "default", position: "relative",
        transition: "border-color 0.15s",
      }}>
        <img
          src={SLOT_ICONS[slot]} alt={slot} width={Math.round(SZ * 0.72)} height={Math.round(SZ * 0.72)}
          style={{ objectFit: "contain", opacity: isEmpty ? 0.12 : 1 }}
          onError={e => { (e.target as HTMLImageElement).style.opacity = "0.06" }}
        />
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          fontSize: 8, textAlign: "center", lineHeight: "14px",
          color: isEmpty ? "#333" : "#888",
          background: "rgba(0,0,0,0.65)", letterSpacing: 0.4,
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", padding: "0 3px",
        }}>
          {slot}
        </div>
      </div>
      {hovered && <GearTooltip slot={slot} slotIdx={slotIdx} g={g} legType={legType} legVal={legVal} align={align} anchorRect={anchorRect} />}
    </div>
  )
}

// ── Main section ──────────────────────────────────────────────────────────


// ── Main section ──────────────────────────────────────────────────────────

export function ProfileSection() {
  const { gear, legendaryTypes, legendaryVals, spec, stats } = useApp()
  const slots = GAME_DATA.SLOTS as readonly string[]
  const className = getClassForSpec(spec)

  const weaponIdx = slots.indexOf("Weapon")
  const helmetIdx = slots.indexOf("Helmet")
  const chestIdx = slots.indexOf("Chest")
  const glovesIdx = slots.indexOf("Gloves")
  const bootsIdx = slots.indexOf("Boots")
  const accessSlots = ["Earrings", "Necklace", "Ring", "Bracelet (L)", "Bracelet (R)", "Charm"].map(s => ({ name: s, idx: slots.indexOf(s) }))

  function sp(idx: number, align: TooltipProps["align"] = "center"): TooltipProps {
    return {
      slot: slots[idx],
      slotIdx: idx,
      g: gear[idx] ?? { tier: "", raid: false, p: "-", s: "-", r: "-", sigName: "", sigLvl: "1" },
      legType: legendaryTypes[idx] ?? "-",
      legVal: legendaryVals[idx] ?? 0,
      align,
    }
  }

  const gap = 8

  const clsData = className ? GAME_DATA.CLASSES[className] : null
  const mainStat = clsData?.main ?? "dexterity"
  const atkStat = clsData?.atk ?? "ATK"

  const displayStats = [
    { label: "Max HP", icon: `${ICON_BASE}/attributes/fight/common_attrmaxhp.webp` },
    { label: atkStat, icon: `${ICON_BASE}/attributes/fight/common_attrattack.webp` },
    { label: mainStat, icon: `${ICON_BASE}/attributes/fight/common_attrdexterity.webp` }, // ${mainStat.toLowerCase()}
    { label: "Endurance", icon: `${ICON_BASE}/attributes/fight/common_icon14.webp` },
    { label: "Illusion Strength", icon: `${ICON_BASE}/attributes/fight/common_icon01.webp` },
    { label: "Crit", icon: `${ICON_BASE}/attributes/fight/common_icon12.webp` },
    { label: "Haste", icon: `${ICON_BASE}/attributes/fight/common_attrhaste.webp` },
    { label: "Luck", icon: `${ICON_BASE}/attributes/fight/common_attrluck.webp` },
    { label: "Mastery", icon: `${ICON_BASE}/attributes/fight/common_attrmastery.webp` },
    { label: "Versatility", icon: `${ICON_BASE}/attributes/fight/common_attrversatility.webp` },
    { label: "Block", icon: `${ICON_BASE}/attributes/fight/common_attrblock.webp` },
  ]

  function getStatValue(label: string): string {
    if (!stats) return "0"

    const tryGet = (obj: any, keys: string[]) => {
      let sum = 0; for (const k of keys) sum += obj?.[k] || 0; return sum
    }

    if (label === "Max HP") {
      const flat = tryGet(stats.extraStats, ["Max HP"]) + tryGet(stats.purpleStats, ["Max HP"]) + tryGet(stats.moduleStats, ["Max HP"])
      const pct = tryGet(stats.purpleStats, ["Max HP (%)"]) + tryGet(stats.moduleStats, ["Max HP (%)"])
      if (flat > 0 || pct > 0) return `${flat > 0 ? `+${flat}` : ""}${pct > 0 ? (flat > 0 ? ` (+${pct}%)` : `+${pct}%`) : ""}`
      return "0"
    }

    if (label === "ATK" || label === "MATK") {
      const flat = tryGet(stats.extraStats, [label]) + tryGet(stats.moduleStats, [label])
      const pct = tryGet(stats.purpleStats, ["Attack (%)", "Magic Attack (%)"]) + tryGet(stats.moduleStats, ["Attack (%)", "Magic Attack (%)"])
      if (flat > 0 || pct > 0) return `${flat > 0 ? `+${flat}` : ""}${pct > 0 ? (flat > 0 ? ` (+${pct}%)` : `+${pct}%`) : ""}`
      return "0"
    }

    if (label === "Agility" || label === "Strength" || label === "Intellect") {
      const flat = tryGet(stats.extraStats, [label]) + tryGet(stats.moduleStats, [label]) + tryGet(stats.total, [label])
      const pct = tryGet(stats.purpleStats, [`${label} (%)`]) + tryGet(stats.moduleStats, [`${label} (%)`])
      if (flat > 0 || pct > 0) return `${flat > 0 ? `+${flat}` : ""}${pct > 0 ? (flat > 0 ? ` (+${pct}%)` : `+${pct}%`) : ""}`
      return "0"
    }

    if (label === "Endurance") {
      const flat = tryGet(stats.extraStats, ["Endurance"]) + tryGet(stats.moduleStats, ["Endurance"])
      return flat > 0 ? `+${flat}` : "0"
    }

    if (label === "Illusion Strength") {
      return (stats.ext?.illu || 0) > 0 ? stats.ext.illu.toFixed(0) : "0"
    }

    if (["Crit", "Haste", "Luck", "Mastery", "Versatility"].includes(label)) {
      const raw = stats.total[label] || 0
      const extKey = label === "Versatility" ? "vers" : label === "Mastery" ? "mast" : label === "Haste" ? "haste" : label === "Crit" ? "crit" : label === "Luck" ? "luck" : ""
      const extVal = (stats.ext as any)?.[extKey] || 0
      const pct = getStatPercentCombat(label, raw) + extVal
      return `${pct.toFixed(2)}%`
    }

    if (label === "Block") {
      const block = tryGet(stats.extraStats, ["Block"]) + tryGet(stats.purpleStats, ["Block"]) + tryGet(stats.moduleStats, ["Block"])
      return block > 0 ? `+${block}` : "0"
    }

    return "0"
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: "80vh" }}>
      {/* Header with class/spec */}
      <div className="mb-4">
        <div className="text-2xl font-bold tracking-tight text-white mb-1">Profile</div>
        <div className="text-[11px] text-[#555] leading-5">Hover any slot to inspect its gear stats.</div>
        {className && (
          <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#fff", letterSpacing: 1 }}>{className}</span>
            <span style={{ fontSize: 11, color: "#888", letterSpacing: 0.5 }}>·</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#e5c229", letterSpacing: 0.5 }}>{spec}</span>
          </div>
        )}
      </div>

      {/* Main layout: Stats left | Gear right */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ display: "flex", gap: 64, alignItems: "flex-start", marginLeft: 40 }}>

          {/* ── Left: Stats column ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 0, minWidth: 200 }}>
            {displayStats.map(({ label, icon }) => (
              <div key={label} style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "5px 0",
                borderBottom: "1px solid #1a1a1a",
              }}>
                <img
                  src={icon} width={18} height={18}
                  style={{ objectFit: "contain", flexShrink: 0 }}
                  onError={e => { (e.target as HTMLImageElement).style.opacity = "0.15" }}
                />
                <span style={{ flex: 1, fontSize: 12, color: "#aaa" }}>{label}</span>
                <span style={{ fontSize: 12, fontWeight: 700, fontVariantNumeric: "tabular-nums", color: "#fff" }}>
                  {getStatValue(label)}
                </span>
              </div>
            ))}
          </div>

          {/* ── Right: Gear layout ── */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: 32 }}>

            {/* Column 1: Helmet, Chest, Gloves, Weapon (weapon under gloves) + Boots below */}
            <div style={{ display: "flex", flexDirection: "column", gap }}>
              <div style={{ display: "grid", gridTemplateColumns: `repeat(2, ${SZ}px)`, gap }}>
                {/* Row 1: Helmet, Chest */}
                <SlotButton {...sp(helmetIdx, "left")} />
                <SlotButton {...sp(chestIdx, "center")} />
                {/* Row 2: Gloves, Boots */}
                <SlotButton {...sp(glovesIdx, "left")} />
                <SlotButton {...sp(bootsIdx, "center")} />
              </div>
              {/* Weapon centered under the armor grid */}
              <div style={{ display: "flex", justifyContent: "center" }}>
                <SlotButton {...sp(weaponIdx, "left")} />
              </div>
            </div>

            {/* Column 2: Accessories 2×3 */}
            <div style={{ display: "grid", gridTemplateColumns: `repeat(2, ${SZ}px)`, gap }}>
              {accessSlots.map(({ name, idx }) => <SlotButton key={name} {...sp(idx, "right")} />)}
            </div>

          </div>

        </div>
      </div>
    </div>
  )
}
