"use client"
import { useState } from "react"
import { useApp, getClassForSpec, getStatPercentCombat } from "@/lib/app-context"
import { GAME_DATA, SIGIL_DB, SIGIL_ICONS_BASE, getTierData, getSlotType } from "@/lib/game-data"
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

  // Horizontal placement - always center the tooltip to keep it in viewport
  const hPos: React.CSSProperties = { left: "50%", transform: "translateX(-50%)" }

  // Attribute row for Basic/Advanced sections
  const attrRow = (icon: string | undefined, label: string, value: string | number, variant: "normal" | "quality" | "recast" = "normal", keySuffix?: string) => {
    const displayValue = typeof value === "number" ? value : value
    
    return (
      <div key={`${label}-${variant}${keySuffix ? `-${keySuffix}` : ''}`} style={{ 
        display: "flex", alignItems: "center", gap: 6, 
        padding: "4px 0",
      }}>
        {icon ? (
          variant === "quality" ? (
            <div style={{ position: "relative", width: 18, height: 18, flexShrink: 0 }}>
              <img src={icon} width={18} height={18} style={{ objectFit: "contain" }} />
              <div style={{
                position: "absolute", inset: 0,
                background: "rgb(138, 109, 193)",
                mixBlendMode: "color",
                maskImage: `url(${icon})`,
                WebkitMaskImage: `url(${icon})`,
                maskSize: "contain",
                WebkitMaskSize: "contain",
              }} />
            </div>
          ) : (
            <img src={icon} width={18} height={18} style={{ objectFit: "contain", flexShrink: 0, opacity: variant === "recast" ? 0.6 : 1 }} />
          )
        ) : (
          <div style={{ width: 18, height: 18, flexShrink: 0 }} />
        )}
        <span style={{ 
          flex: 1, fontSize: 12, 
          color: variant === "quality" ? "#c4b5fd" : variant === "recast" ? "#888" : "#bbb" 
        }}>
          {label}
        </span>
        <span style={{ 
          fontSize: 12, fontWeight: 600, fontVariantNumeric: "tabular-nums", 
          color: variant === "quality" ? "#c4b5fd" : variant === "recast" ? "#888" : "white" 
        }}>
          {displayValue}
        </span>
      </div>
    )
  }

  const hasContent = tierData || (legType && legType !== "-" && legVal > 0) || sigil

  const isCompletelyRed = g.tier && (g.tier.includes("90") || g.tier.includes("110") || g.tier.includes("130") || g.tier.includes("150") || g.tier.includes("170"))
  const headerBg = isCompletelyRed
    ? `linear-gradient(rgba(255,0,0,0) 0%, rgba(255,0,0,0.4) 50%, ${color}99 100%)`
    : `linear-gradient(rgba(172,153,89,0) 0%, rgba(176,152,87,0.4) 50%, ${color}99 100%)`

  // Extract level from tier string (e.g., "Lv140 Gold" -> 140)
  const levelMatch = g.tier?.match(/Lv(\d+)/)
  const itemLevel = levelMatch ? parseInt(levelMatch[1]) : 0
  
  // Determine wearing level based on item level
  const wearingLevel = itemLevel >= 140 ? 60 : itemLevel >= 120 ? 50 : itemLevel >= 80 ? 40 : itemLevel >= 60 ? 30 : 0

  return (
    <div style={{
      position: "absolute",
      bottom: "calc(100% + 8px)",
      zIndex: 100,
      width: 300,
      left: "50%",
      transform: "translateX(-50%)",
      background: "#0d0d0d",
      border: `1px solid ${color}88`,
      boxShadow: `0 0 20px ${color}33, 0 8px 24px rgba(0,0,0,0.9)`,
      pointerEvents: "none",
    }}>
      {/* Header with title background */}
      <div style={{
        backgroundImage: "url('https://assets-ng.maxroll.gg/sr-tools/assets/db/assets/tooltip/title-bkg.webp')",
        backgroundSize: "cover",
        padding: "8px 12px",
      }}>
        <div style={{ fontSize: 13, fontWeight: 700, color, lineHeight: 1.3 }}>{g.tier || "Empty Slot"}</div>
      </div>
      
      {/* Header inner with gradient */}
      <div style={{
        background: headerBg,
        padding: "10px 12px",
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
      }}>
        {/* Left: Stats */}
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 6, fontSize: 11, color: "#888" }}>
            <span style={{ color: "#aaa" }}>{slot}</span>
            {wearingLevel > 0 && <span>Wearing Level: {wearingLevel}</span>}
            {itemLevel > 0 && <span>Lv. {itemLevel}</span>}
          </div>
          {/* Perfection bar */}
          <div style={{ fontSize: 10, color: "#888", marginBottom: 4 }}>Perfection: 100/100</div>
          <div style={{ 
            position: "relative", height: 6, 
            background: "#1a1a1a", borderRadius: 3,
            overflow: "hidden" 
          }}>
            <div style={{ 
              position: "absolute", left: 0, top: 0, bottom: 0, 
              width: "100%", 
              background: `linear-gradient(90deg, ${color}88, ${color})` 
            }} />
            <svg style={{ position: "absolute", right: -2, top: -3, color: "#666" }} width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C9.243 2 7 4.243 7 7v3H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-1V7c0-2.757-2.243-5-5-5zM9 7c0-1.654 1.346-3 3-3s3 1.346 3 3v3H9V7zm4 10.723V20h-2v-2.277a1.993 1.993 0 0 1 .567-3.677A2.001 2.001 0 0 1 14 16a1.99 1.99 0 0 1-1 1.723z"/>
            </svg>
          </div>
        </div>
        {/* Right: Icon */}
        <img src={SLOT_ICONS[slot]} width={48} height={48} style={{ objectFit: "contain", flexShrink: 0 }} />
      </div>

      {/* Content */}
      <div style={{ padding: "8px 12px 12px" }}>
        {/* Basic Attributes */}
        {tierData && (
          <div style={{ marginBottom: 8 }}>
            <div style={{ 
              fontSize: 11, fontWeight: 600, color: "#888", 
              padding: "4px 0", borderBottom: "1px solid #222", marginBottom: 4 
            }}>
              Basic Attributes
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {tierData.illu > 0 && attrRow(ATTR_ICONS["Illusion Strength"], "Illusion Strength", tierData.illu)}
              {attrRow(ATTR_ICONS["ATK"], "ATK", tierData.p)}
              {attrRow(ATTR_ICONS["Agility"], "Agility", tierData.s)}
              {attrRow(ATTR_ICONS["Endurance"], "Endurance", tierData.r > 0 ? tierData.r * 2 : 0)}
            </div>
          </div>
        )}

        {/* Advanced Attributes */}
        {(legType && legType !== "-" && legVal > 0) || (tierData && tierData.r > 0) ? (
          <div style={{ marginBottom: 8 }}>
            <div style={{ 
              fontSize: 11, fontWeight: 600, color: "#888", 
              padding: "4px 0", borderBottom: "1px solid #222", marginBottom: 4 
            }}>
              Advanced Attributes
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {/* Purple stat (quality) */}
              {legType && legType !== "-" && legVal > 0 && (
                attrRow(ATTR_ICONS["ATK"], legType, 
                  legType.includes("%") ? `+${legVal}%` : legVal, "quality", "purple")
              )}
              {/* Secondary stat */}
              {tierData && tierData.s > 0 && g.s && g.s !== "-" && (
                attrRow(ATTR_ICONS[g.s] || ATTR_ICONS["Luck"], g.s, tierData.s, "normal", "secondary")
              )}
              {/* Tertiary stat */}
              {tierData && tierData.r > 0 && g.r && g.r !== "-" && (
                attrRow(ATTR_ICONS[g.r] || ATTR_ICONS["Haste"], g.r, tierData.r, "recast", "tertiary")
              )}
            </div>
          </div>
        ) : null}

        {/* Refining effect */}
        {tierData && tierData.r > 0 && (
          <div style={{ marginBottom: 8 }}>
            <div style={{ 
              fontSize: 11, fontWeight: 600, color: "#888", 
              padding: "4px 0", borderBottom: "1px solid #222", marginBottom: 4 
            }}>
              Refining effect
            </div>
            <div style={{ fontSize: 12, color: "#ddd" }}>
              Refined ATK {Math.floor(tierData.r / 4)}
            </div>
          </div>
        )}

        {/* Bonus effect */}
        {tierData && itemLevel >= 60 && (
          <div style={{ marginBottom: 8 }}>
            <div style={{ 
              fontSize: 11, fontWeight: 600, color: "#888", 
              padding: "4px 0", borderBottom: "1px solid #222", marginBottom: 4 
            }}>
              Bonus effect
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <div style={{ fontSize: 11, color: "#aaa" }}>Refine Lv.5: Refined ATK 12</div>
              <div style={{ fontSize: 11, color: "#aaa" }}>Refine Lv.10: Refined ATK 12</div>
              <div style={{ fontSize: 11, color: "#aaa" }}>Refine Lv.15: Refined ATK 12</div>
              <div style={{ fontSize: 11, color: "#aaa" }}>Refine Lv.20: Refined ATK 12</div>
              <div style={{ fontSize: 11, color: "#aaa" }}>Refine Lv.25: Refined ATK 18</div>
            </div>
          </div>
        )}

        {/* Sigil/Effects */}
        {sigil && sigilData && (
          <div>
            <div style={{ 
              display: "flex", alignItems: "center", gap: 8,
              padding: "4px 0", borderBottom: "1px solid #222", marginBottom: 4 
            }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: "#888" }}>Effects</span>
              <img 
                src={sigil.icon ? `${SIGIL_ICONS_BASE}${sigil.icon}` : `${ICON_BASE}/items/gems/item_icons_enchantformula30.webp`} 
                alt={sigil.n} width={24} height={24} 
                style={{ objectFit: "contain" }} 
              />
              <span style={{ fontSize: 12, fontWeight: 600, color: "#e5c229" }}>{sigil.n}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {Object.entries(sigilData).map(([stat, val]) => (
                <div key={stat} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#bbb" }}>
                  <span>{stat}</span>
                  <span style={{ color: "white", fontWeight: 600 }}>+{val}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {!hasContent && (
          <div style={{ fontSize: 11, color: "#444", textAlign: "center", padding: "12px 0" }}>No gear data</div>
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
