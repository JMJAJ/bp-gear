"use client"
import { useState } from "react"
import { useApp, getClassForSpec, getStatPercentCombat } from "@/lib/app-context"
import { GAME_DATA, SIGIL_DB, getTierData, getSlotType } from "@/lib/game-data"
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
  legType: string
  legVal: number
  align?: "left" | "center" | "right"  // which way the tooltip opens to avoid clipping
}

function GearTooltip({ slot, slotIdx, g, legType, legVal, align = "center" }: TooltipProps) {
  const slotType = getSlotType(slotIdx)
  const tierData = g.tier ? getTierData(slotType, g.tier) : null
  const color = rarityColor(g.tier ?? "")

  const sigil = g.sigName ? SIGIL_DB.find(s => s.n === g.sigName) : null
  const sigilLvl = parseInt(g.sigLvl) || 1
  const sigilData = sigil?.d[sigilLvl] ?? sigil?.d[1]

  // Horizontal placement to avoid clipping
  const hPos: React.CSSProperties =
    align === "left" ? { left: 0, transform: "none" } :
      align === "right" ? { right: 0, transform: "none" } :
        { left: "50%", transform: "translateX(-50%)" }

  const attrRow = (icon: string | undefined, label: string, value: number, purple = false) => (
    <div key={label} style={{ display: "flex", alignItems: "center", gap: 6, padding: "3px 0", borderBottom: "1px solid #1a1a1a" }}>
      {icon
        ? <img src={icon} width={14} height={14} style={{ objectFit: "contain", flexShrink: 0 }} />
        : <div style={{ width: 14, height: 14, flexShrink: 0 }} />
      }
      <span style={{ flex: 1, fontSize: 11, color: purple ? "#a78bfa" : "#bbb" }}>{label}</span>
      <span style={{ fontSize: 11, fontWeight: 700, fontVariantNumeric: "tabular-nums", color: purple ? "#a78bfa" : "white" }}>
        {purple && label.includes("%") ? `+${value}%` : value}
      </span>
    </div>
  )

  const hasContent = tierData || (legType && legType !== "-" && legVal > 0) || sigil

  const isCompletelyRed = g.tier && (g.tier.includes("90") || g.tier.includes("110") || g.tier.includes("130") || g.tier.includes("150") || g.tier.includes("170"))
  const headerBg = isCompletelyRed
    ? `linear-gradient(rgba(255,0,0,0) 0%, rgba(255,0,0,0.4) 50%, ${color}99 100%)`
    : `linear-gradient(rgba(172,153,89,0) 0%, rgba(176,152,87,0.4) 50%, ${color}99 100%)`

  return (
    <div style={{
      position: "absolute",
      bottom: "calc(100% + 8px)",
      zIndex: 100,
      width: 280,
      background: "#0d0d0d",
      border: `1px solid ${color}88`,
      boxShadow: `0 0 20px ${color}33, 0 8px 24px rgba(0,0,0,0.9)`,
      pointerEvents: "none",
      ...hPos,
    }}>
      {/* Header */}
      <div style={{
        backgroundImage: headerBg,
        padding: "10px 12px 8px",
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
      }}>
        <img src={SLOT_ICONS[slot]} width={44} height={44} style={{ objectFit: "contain", flexShrink: 0 }} />
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color, lineHeight: 1.3 }}>{g.tier || "Empty Slot"}</div>
          <div style={{ fontSize: 10, color: "#aaa", marginTop: 2 }}>{slot}</div>
          {tierData?.illu ? <div style={{ fontSize: 10, color: "#aaa", marginTop: 1 }}>Illusion Strength {tierData.illu}</div> : null}
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: "6px 12px 10px" }}>
        {tierData && (
          <div style={{ marginBottom: 6 }}>
            <div style={{ fontSize: 9, letterSpacing: 1.5, textTransform: "uppercase", color: "#444", marginBottom: 4 }}>Attributes</div>
            {g.p && g.p !== "-" && attrRow(ATTR_ICONS[g.p], g.p, tierData.p)}
            {g.s && g.s !== "-" && attrRow(ATTR_ICONS[g.s], g.s, tierData.s)}
            {g.r && g.r !== "-" && tierData.r > 0 && attrRow(ATTR_ICONS[g.r], `${g.r} (reforge)`, tierData.r)}
          </div>
        )}

        {legType && legType !== "-" && legVal > 0 && (
          <div style={{ marginBottom: 6 }}>
            <div style={{ fontSize: 9, letterSpacing: 1.5, textTransform: "uppercase", color: "#444", marginBottom: 4 }}>Purple Stat</div>
            {attrRow(undefined, legType, legVal, true)}
          </div>
        )}

        {sigil && sigilData && (
          <div>
            <div style={{ fontSize: 9, letterSpacing: 1.5, textTransform: "uppercase", color: "#444", marginBottom: 4 }}>Sigil · Lv.{sigilLvl}</div>
            <div style={{ fontSize: 11, color: "#e5c229", marginBottom: 3 }}>{sigil.n}</div>
            {Object.entries(sigilData).map(([stat, val]) => (
              <div key={stat} style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#aaa", padding: "1.5px 0" }}>
                <span>{stat}</span>
                <span style={{ color: "white", fontWeight: 600 }}>+{val}</span>
              </div>
            ))}
          </div>
        )}

        {!hasContent && (
          <div style={{ fontSize: 10, color: "#333", textAlign: "center", padding: "8px 0" }}>No gear data</div>
        )}
      </div>
    </div>
  )
}

// ── Slot button ────────────────────────────────────────────────────────────

function SlotButton({ slot, slotIdx, g, legType, legVal, align = "center" }: TooltipProps) {
  const [hovered, setHovered] = useState(false)
  const color = rarityColor(g.tier ?? "")
  const isEmpty = !g.tier || ((!g.p || g.p === "-") && (!g.s || g.s === "-"))

  const isCompletelyRed = g.tier && (g.tier.includes("90") || g.tier.includes("110") || g.tier.includes("130") || g.tier.includes("150") || g.tier.includes("170"))
  const slotBg = isEmpty
    ? "none"
    : isCompletelyRed
      ? `linear-gradient(rgba(255,0,0,0) 0%, rgba(255,0,0,0.3) 50%, ${color}55 100%)`
      : `linear-gradient(rgba(172,153,89,0) 0%, rgba(176,152,87,0.3) 50%, ${color}55 100%)`

  return (
    <div style={{ position: "relative", display: "inline-block" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
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
      {hovered && <GearTooltip slot={slot} slotIdx={slotIdx} g={g} legType={legType} legVal={legVal} align={align} />}
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
    { label: "Illusion Strength", icon: `https://www.prydwen.gg/static/b0ce63cf1fadfaccd38f51edff97afc7/72e27/icon_roseb.webp` },
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
