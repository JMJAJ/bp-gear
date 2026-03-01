"use client"
import { createContext, useContext, useState, useCallback, useEffect, useRef } from "react"
import {
  GAME_DATA, SIGIL_DB, MODULE_DB, MODULE_THRESHOLDS,
  type GearSlot, type StatsResult, type Build, type GearLibItem,
  getSlotType, getTierData, getDefaultTier, applyPerfection,
} from "@/lib/game-data"
import { TALENT_DATA } from "@/lib/talent-data"
import { type PsychoscopeConfig, DEFAULT_PSYCHOSCOPE_CONFIG, computePsychoscopeEffects } from "@/lib/psychoscope-data"

export type { GearSlot, StatsResult, Build, GearLibItem }

// ── Types ──────────────────────────────────────────────────

export interface ModuleSlot {
  rarity: "Gold" | "Purple" | "Blue"
  a1: string; a1lv: number
  a2: string; a2lv: number
  a3: string; a3lv: number
}

export interface ImagineSlot { key: string; idx: number }

export interface GearSet {
  id: string
  name: string
  gear: GearSlot[]
  legendaryTypes: string[]
  legendaryVals: number[]
  imagines: ImagineSlot[]
  modules: ModuleSlot[]
  selectedTalents: string[]
  talentAspd: number
  createdAt: string
}

export interface BaseStats {
  vers: number; mast: number; haste: number; crit: number; luck: number; agi: number
}

export interface ExtBuffs {
  crit: number; luck: number; haste: number; mast: number
  vers: number; aspd: number; cspd: number; illu: number
}

export type AccentColor = "yellow" | "red" | "blue" | "green"
export type NavSection = "classes" | "planner" | "optimizer" | "modules" | "psychoscope" | "talents" | "profile" | "curves" | "database" | "guide" | "guide_stormblade" | "dps_simulator" | "gear_sets"

const ACCENT_MAP: Record<AccentColor, string> = {
  yellow: "#e5c229",
  red: "#e84545",
  blue: "#49A8FF",
  green: "#4ade80",
}

// ── Default State ─────────────────────────────────────────

const defaultGear = (): GearSlot[] =>
  GAME_DATA.SLOTS.map((_, i) => ({ tier: getDefaultTier(i), raid: false, p: "-", s: "-", r: "-", sigName: "", sigLvl: "1" }))

const defaultModules = (): ModuleSlot[] =>
  Array.from({ length: 4 }, () => ({ rarity: "Gold", a1: "", a1lv: 9, a2: "", a2lv: 9, a3: "", a3lv: 9 }))

const defaultImageSlots = (): ImagineSlot[] => [{ key: "", idx: 0 }, { key: "", idx: 0 }]

const defaultBase = (): BaseStats => ({ vers: 0, mast: 0, haste: 0, crit: 0, luck: 0, agi: 0 })
const defaultBuffs = (): ExtBuffs => ({ crit: 0, luck: 0, haste: 0, mast: 0, vers: 0, aspd: 0, cspd: 0, illu: 0 })

// ── Core Logic ────────────────────────────────────────────

export function getClassForSpec(spec: string): string | null {
  for (const [name, cls] of Object.entries(GAME_DATA.CLASSES)) {
    if (cls.specs.includes(spec)) return name
  }
  return null
}

export function getStatPercent(stat: string, raw: number): number {
  const cData = GAME_DATA.CONSTANTS[stat]
  if (!cData) return 0
  const safeRaw = Math.max(0, raw)
  // Game UI displays without base, but base still applies in combat
  // For display purposes, we match the in-game UI
  return (safeRaw / (safeRaw + cData.c)) * 100
}

/** Combat-accurate stat percent that includes the base value */
export function getStatPercentCombat(stat: string, raw: number): number {
  const cData = GAME_DATA.CONSTANTS[stat]
  if (!cData) return 0
  const safeRaw = Math.max(0, raw)
  return cData.base + (safeRaw / (safeRaw + cData.c)) * 100
}

function getAllowedStats(slot: string, build: Build, excluded: string[] = []): string[] {
  const banned = GAME_DATA.RESTRICTIONS[slot]?.[build] ?? []
  return (GAME_DATA.STATS as readonly string[]).filter(s => !banned.includes(s) && !excluded.includes(s))
}

export function calculateStats(
  gear: GearSlot[],
  imagines: ImagineSlot[],
  modules: ModuleSlot[],
  spec: string,
  base: BaseStats,
  ext: ExtBuffs,
  legendaryTypes: string[],
  legendaryVals: number[],
  talentFlags?: { swift?: boolean; aspd?: number; selectedIds?: string[] },
  psychoscopeConfig?: PsychoscopeConfig
): StatsResult {
  const total: Record<string, number> = { Versatility: 0, Mastery: 0, Haste: 0, Crit: 0, Luck: 0 }
  const purpleStats: Record<string, number> = {}
  const extraStats: Record<string, number> = {}

  const raidBonus = GAME_DATA.RAID_BONUS[spec]
  const weaponBuff = GAME_DATA.WEAPON_BUFFS[spec]
  const className = getClassForSpec(spec)
  const ratios = className ? (GAME_DATA.HASTE_RATIOS[className] ?? { aspd: 0.6, cspd: 1.0 }) : { aspd: 0.6, cspd: 1.0 }

  total.Versatility += base.vers
  total.Mastery += base.mast
  total.Haste += base.haste
  total.Crit += base.crit
  total.Luck += base.luck
  const baseAgi = base.agi

  gear.forEach((g, i) => {
    if (!g) return
    // Use tier-based values; fall back to legacy hardcoded VALUES if no tier set
    const slotType = getSlotType(i)
    const tierVals = g.tier ? getTierData(slotType, g.tier) : null
    let vals: { p: number; s: number; r: number }
    if (tierVals) {
      vals = tierVals
    } else {
      const V = GAME_DATA.VALUES
      const isWep = i === 0
      vals = g.raid ? (isWep ? V.W_RAID : V.A_RAID) : (isWep ? V.W_STD : V.A_STD)
    }
    // Apply perfection scaling (0–100). Default 100 = no change.
    if (g.perfection !== undefined && g.perfection < 100) {
      vals = applyPerfection(vals, Math.max(0, Math.min(100, g.perfection)))
    }
    if (g.p && g.p !== "-") total[g.p] = (total[g.p] ?? 0) + vals.p
    if (g.s && g.s !== "-") total[g.s] = (total[g.s] ?? 0) + vals.s
    if (g.r && g.r !== "-" && vals.r > 0) total[g.r] = (total[g.r] ?? 0) + vals.r

    if (g.sigName) {
      const sig = SIGIL_DB.find(s => s.n === g.sigName)
      if (sig) {
        const lvl = parseInt(g.sigLvl) || 1
        const data = sig.d[lvl] ?? sig.d[1]
        for (const [stat, val] of Object.entries(data)) {
          if (total[stat] !== undefined) total[stat] += val
          else extraStats[stat] = (extraStats[stat] ?? 0) + val
        }
      }
    }

    const legType = legendaryTypes[i]
    const legVal = legendaryVals[i] ?? 0
    if (legType && legType !== "-" && legVal > 0) {
      purpleStats[legType] = (purpleStats[legType] ?? 0) + legVal
    }
  })

  imagines.forEach(im => {
    if (im.key) {
      const imgData = GAME_DATA.IMAGINE.OPTIONS[im.key]
      if (imgData) total[imgData.stat] = (total[imgData.stat] ?? 0) + imgData.vals[im.idx]
    }
  })

  // Power Core modules
  const powerCorePoints: Record<string, number> = {}
  modules.forEach(mod => {
    const affixes = [
      { key: mod.a1, lv: mod.a1lv },
      { key: mod.a2, lv: mod.a2lv },
      { key: mod.a3, lv: mod.a3lv },
    ]
    affixes.filter(a => a.key).forEach(({ key, lv }) => {
      powerCorePoints[key] = (powerCorePoints[key] ?? 0) + lv
    })
  })

  const moduleStats: Record<string, number> = {}
  let moduleAspd = 0, moduleCspd = 0, moduleAgility = 0
  for (const [affixName, totalPts] of Object.entries(powerCorePoints)) {
    let level = 0
    for (let li = MODULE_THRESHOLDS.length - 1; li >= 0; li--) {
      if (totalPts >= MODULE_THRESHOLDS[li]) { level = li + 1; break }
    }
    if (level === 0) continue
    const mod = MODULE_DB.find(m => m.name === affixName)
    if (!mod) continue
    const mstats = mod.s[level - 1]
    for (const [stat, val] of Object.entries(mstats)) {
      if (stat === "Attack Speed (%)") { moduleAspd += val; moduleStats[stat] = (moduleStats[stat] ?? 0) + val }
      else if (stat === "Cast Speed (%)") { moduleCspd += val; moduleStats[stat] = (moduleStats[stat] ?? 0) + val }
      else if (stat === "Agility") { moduleAgility += val; moduleStats[stat] = (moduleStats[stat] ?? 0) + val }
      else if ((stat === "Adaptive Main stat" || stat === "Adaptive Main Stat") && className) {
        const mainStat = GAME_DATA.CLASSES[className]?.main
        if (mainStat === "Agility") moduleAgility += val
        moduleStats[mainStat] = (moduleStats[mainStat] ?? 0) + val
      } else if ((stat === "Adaptive Atk" || stat === "Adaptive ATK") && className) {
        const atkType = GAME_DATA.CLASSES[className]?.atk ?? "ATK"
        moduleStats[atkType] = (moduleStats[atkType] ?? 0) + val
      } else {
        moduleStats[stat] = (moduleStats[stat] ?? 0) + val
      }
    }
  }

  // Collect total agility from all sources:
  // baseAgi (user-input character agility), moduleAgility (from power core modules),
  // sigilAgility (from sigil bonuses like Blackfire Foxen, Goblin Axeman, etc.)
  const sigilAgility = extraStats["Agility"] ?? 0

  // Compute psychoscope effects (skip when disabled)
  const psyEffects = (psychoscopeConfig && psychoscopeConfig.enabled !== false)
    ? computePsychoscopeEffects(psychoscopeConfig, className)
    : null

  // Add psychoscope flat Agility (e.g., Polarity X4: Agility +75)
  const psyAgility = psyEffects?.flatStats["Agility"] ?? 0
  const rawAgility = baseAgi + moduleAgility + sigilAgility + psyAgility
  // Apply Agility (%) from purple/legendary stats + psychoscope (e.g., Polarity X4: +2%)
  const agiPctBonus = (purpleStats["Agility (%)"] ?? 0) + (psyEffects?.pctStats["Agility"] ?? 0)
  const totalAgility = rawAgility * (1 + agiPctBonus / 100)
  total.Haste += totalAgility * 0.45

  let extraTalentAspd = 0
  let extraTalentCspd = 0

  if (className && talentFlags?.selectedIds && talentFlags.selectedIds.length > 0) {
    const classTalents = TALENT_DATA[className] || []
    talentFlags.selectedIds.forEach(tId => {
      const t = classTalents.find((x: any) => x.id === tId)
      if (!t) return
      let desc = t.desc

      const condMatch = desc.match(/When (Agility|Strength|Intellect|Endurance) reaches (\d+) points?, (.*)/i)
      if (condMatch) {
        const statReq = condMatch[1]
        const reqVal = parseInt(condMatch[2])
        if ((total[statReq] || 0) >= reqVal) {
          desc = condMatch[3]
        } else {
          desc = ""
        }
      }

      if (!desc) return

      const aspdMatch = desc.match(/Attack Speed \+?(\d+(?:\.\d+)?)%/i)
      if (aspdMatch) extraTalentAspd += parseFloat(aspdMatch[1])

      const cspdMatch = desc.match(/Cast Speed \+?(\d+(?:\.\d+)?)%/i)
      if (cspdMatch) extraTalentCspd += parseFloat(cspdMatch[1])

      const critDmgMatch = desc.match(/Crit DMG \+?(\d+(?:\.\d+)?)%/i)
      if (critDmgMatch) extraStats["Crit DMG (%)"] = (extraStats["Crit DMG (%)"] ?? 0) + parseFloat(critDmgMatch[1])

      const critMatch = desc.match(/(?<!DMG )Crit(?: Rate)? \+?(\d+(?:\.\d+)?)%/i)
      if (critMatch) purpleStats["Crit (%)"] = (purpleStats["Crit (%)"] ?? 0) + parseFloat(critMatch[1])

      const luckMatch = desc.match(/Luck(?: Chance)? \+?(\d+(?:\.\d+)?)%/i)
      if (luckMatch) purpleStats["Luck (%)"] = (purpleStats["Luck (%)"] ?? 0) + parseFloat(luckMatch[1])

      const hpMatch = desc.match(/Max HP \+?(\d+(?:\.\d+)?)%/i)
      if (hpMatch) extraStats["Max HP (%)"] = (extraStats["Max HP (%)"] ?? 0) + parseFloat(hpMatch[1])

      const mastPctMatch = desc.match(/Mastery \+?(\d+(?:\.\d+)?)%/i)
      if (mastPctMatch) purpleStats["Mastery (%)"] = (purpleStats["Mastery (%)"] ?? 0) + parseFloat(mastPctMatch[1])

      const armorPctMatch = desc.match(/Armor \+?(\d+(?:\.\d+)?)%/i)
      if (armorPctMatch) extraStats["Armor (%)"] = (extraStats["Armor (%)"] ?? 0) + parseFloat(armorPctMatch[1])

      const versPctMatch = desc.match(/Versatility \+?(\d+(?:\.\d+)?)%/i)
      if (versPctMatch) purpleStats["Versatility (%)"] = (purpleStats["Versatility (%)"] ?? 0) + parseFloat(versPctMatch[1])

      const mastFlatMatch = desc.match(/Mastery \+?([\d,]+)(?!%)/i)
      if (mastFlatMatch) total["Mastery"] = (total["Mastery"] ?? 0) + parseInt(mastFlatMatch[1].replace(/,/g, ""))

      const armorFlatMatch = desc.match(/Armor ([\d,]+)(?!%)/i)
      if (armorFlatMatch) total["Armor"] = (total["Armor"] ?? 0) + parseInt(armorFlatMatch[1].replace(/,/g, ""))
    })
  }

  let appliedBonus: StatsResult["appliedBonus"] = null
  const weaponEffects: string[] = []
  const hasRaidWeapon = gear[0]?.raid

  // Count raid armor pieces (non-weapon raid-eligible slots: Helmet=1, Chest=2, Gloves=3, Boots=4, Bracelet L=8, Bracelet R=9)
  const RAID_ARMOR_INDICES = [1, 2, 3, 4, 8, 9]
  const raidArmorCount = RAID_ARMOR_INDICES.filter(i => gear[i]?.raid).length

  // Apply 2-piece raid set bonus when 2+ raid armor pieces are equipped
  const raw2pc = GAME_DATA.RAID_2PC[spec] ?? null
  const raid2pcBonus = (raidArmorCount >= 2 && raw2pc) ? raw2pc : null

  // Apply 4-piece raid set bonus when 4+ raid armor pieces are equipped
  const raw4pc = GAME_DATA.RAID_4PC[spec] ?? null
  const raid4pcBonus = (raidArmorCount >= 4 && raw4pc) ? raw4pc : null

  if (raid2pcBonus) {
    if (raid2pcBonus.t === "stat_pct") {
      const statName = raid2pcBonus.l.replace(" (%)", "")
      if (total[statName] !== undefined) total[statName] *= (1 + raid2pcBonus.v / 100)
    }
    // aspd, aspd_cond, cspd, mastery_crit, armor_ignore handled below after weapon buffs
  }

  if (hasRaidWeapon && raidBonus && raidBonus.t === "p") {
    const statName = raidBonus.l.replace(" (%)", "")
    if (total[statName] !== undefined) total[statName] *= (1 + raidBonus.v / 100)
    appliedBonus = raidBonus
  }
  if (hasRaidWeapon && raidBonus && raidBonus.t === "f") {
    // Flat percentage bonus - add to purpleStats for display
    const statName = raidBonus.l
    if (statName.includes("Luck")) purpleStats["Luck (%)"] = (purpleStats["Luck (%)"] ?? 0) + raidBonus.v
    else if (statName.includes("Crit")) purpleStats["Crit (%)"] = (purpleStats["Crit (%)"] ?? 0) + raidBonus.v
    else if (statName.includes("Haste")) purpleStats["Haste (%)"] = (purpleStats["Haste (%)"] ?? 0) + raidBonus.v
    else if (statName.includes("Mastery")) purpleStats["Mastery (%)"] = (purpleStats["Mastery (%)"] ?? 0) + raidBonus.v
    else if (statName.includes("Versatility")) purpleStats["Versatility (%)"] = (purpleStats["Versatility (%)"] ?? 0) + raidBonus.v
    else extraStats[statName] = (extraStats[statName] ?? 0) + raidBonus.v
    appliedBonus = raidBonus
  }
  if (hasRaidWeapon && weaponBuff) {
    if (weaponBuff.b1 && total[weaponBuff.b1] !== undefined) {
      total[weaponBuff.b1] *= (1 + weaponBuff.b1v / 100)
      weaponEffects.push(`${weaponBuff.b1} +${weaponBuff.b1v}%`)
    }
    if (weaponBuff.b2 && total[weaponBuff.b2] !== undefined) {
      total[weaponBuff.b2] *= (1 + weaponBuff.b2v / 100)
      weaponEffects.push(`${weaponBuff.b2} +${weaponBuff.b2v}%`)
    }
    if (weaponBuff.other) weaponEffects.push(weaponBuff.other)
  }

  // Apply 2pc bonuses that depend on final stat totals (after all multipliers)
  if (raid2pcBonus) {
    if (raid2pcBonus.t === "mastery_crit") {
      // Wildpack: each 1% Mastery grants v% Crit DMG
      const mastPct = getStatPercentCombat("Mastery", total.Mastery)
      extraStats["Crit DMG (%)"] = (extraStats["Crit DMG (%)"] ?? 0) + mastPct * raid2pcBonus.v
    }
    if (raid2pcBonus.t === "armor_ignore") {
      // Vanguard: Courage skills ignore v% Armor
      extraStats["Ignore Armor (%)"] = (extraStats["Ignore Armor (%)"] ?? 0) + raid2pcBonus.v
    }
  }

  // Apply 4pc bonuses that depend on final stat totals
  if (raid4pcBonus) {
    if (raid4pcBonus.t === "crit_dmg") {
      // Falconry: Crit DMG +50% while Focus active
      extraStats["Crit DMG (%)"] = (extraStats["Crit DMG (%)"] ?? 0) + raid4pcBonus.v
    }
    if (raid4pcBonus.t === "main_stat_pct") {
      // Wildpack 4pc: +7.5% Agility at max stacks
      const clsData = className ? GAME_DATA.CLASSES[className] : null
      const mainStat = clsData?.main ?? "Agility"
      if (total[mainStat] !== undefined) {
        total[mainStat] *= (1 + raid4pcBonus.v / 100)
      }
    }
  }

  // ══ Apply Psychoscope Effects ══
  if (psyEffects) {
    // Add flat Versatility from Polarity X11 (conditional average: 120 × 5 stacks)
    const psyVers = psyEffects.flatStats["Versatility"] ?? 0
    if (psyVers > 0) total.Versatility += psyVers

    // Apply "gained in any way" multipliers (X5-X8 type effects)
    // These multiply the total raw stat AFTER all other additions
    for (const [stat, pct] of Object.entries(psyEffects.gainMult)) {
      if (total[stat] !== undefined && pct !== 0) {
        total[stat] *= (1 + pct / 100)
      }
    }

    // Bond general: add highest stat bonus (+300 per bond tier at levels 12, 25)
    if (psyEffects.bondHighestStatFlat > 0) {
      const combatStats = ["Crit", "Haste", "Luck", "Mastery", "Versatility"]
      let highestStat = combatStats[0]
      let highestVal = total[combatStats[0]] ?? 0
      for (const s of combatStats) {
        if ((total[s] ?? 0) > highestVal) {
          highestVal = total[s] ?? 0
          highestStat = s
        }
      }
      total[highestStat] += psyEffects.bondHighestStatFlat
    }

    // Bond exclusive: flat Crit% / Luck% bonuses
    if (psyEffects.bondCritPct > 0) {
      purpleStats["Crit (%)"] = (purpleStats["Crit (%)"] ?? 0) + psyEffects.bondCritPct
    }
    if (psyEffects.bondLuckPct > 0) {
      purpleStats["Luck (%)"] = (purpleStats["Luck (%)"] ?? 0) + psyEffects.bondLuckPct
    }

    // Bond exclusive: Endless Mind "Current main stats +100"
    if (psyEffects.bondMainStatFlat > 0 && className) {
      const mainStat = GAME_DATA.CLASSES[className]?.main
      // Main stat affects Agility → Haste conversion (already computed above),
      // so add the Haste equivalent for Agility
      if (mainStat === "Agility") {
        total.Haste += psyEffects.bondMainStatFlat * 0.45
      }
      // For display, track as extra stat
      extraStats[`${mainStat} (Psychoscope)`] = (extraStats[`${mainStat} (Psychoscope)`] ?? 0) + psyEffects.bondMainStatFlat
    }

    // ATK from stat scaling (e.g., Stormblade X6: 1% Crit → 0.5% ATK)
    // Track computed bonus for DPS sim to read
    if (psyEffects.atkFromStat) {
      const { stat, ratio, target } = psyEffects.atkFromStat
      const statPct = getStatPercentCombat(stat, total[stat] ?? 0)
      const bonusPct = statPct * ratio
      if (target === "CritDMG") {
        extraStats["Crit DMG (%)"] = (extraStats["Crit DMG (%)"] ?? 0) + bonusPct
      } else {
        extraStats[`${target} from ${stat} (%)`] = bonusPct
      }
    }

    // Dream DMG % from bond exclusive
    if (psyEffects.dreamDmgPct > 0) {
      extraStats["Dream DMG (%)"] = (extraStats["Dream DMG (%)"] ?? 0) + psyEffects.dreamDmgPct
    }

    // Special/Expertise Dream DMG from offensive factors
    if (psyEffects.specialDmgPct > 0) {
      extraStats["Special Dream DMG (%)"] = (extraStats["Special Dream DMG (%)"] ?? 0) + psyEffects.specialDmgPct
    }
    if (psyEffects.expertiseDmgPct > 0) {
      extraStats["Expertise Dream DMG (%)"] = (extraStats["Expertise Dream DMG (%)"] ?? 0) + psyEffects.expertiseDmgPct
    }

    // Conditional ATK/Element DMG
    if (psyEffects.conditionalAtkPct > 0) {
      extraStats["ATK during buff (%)"] = psyEffects.conditionalAtkPct
    }
    if (psyEffects.conditionalElementDmg > 0) {
      extraStats["Element DMG during buff (%)"] = psyEffects.conditionalElementDmg
    }

    // Illusion Strength from bond
    if (psyEffects.bondIlluStrength > 0) {
      extraStats["Illusion Strength (Bond)"] = psyEffects.bondIlluStrength
    }

    // All Element flat bonus (Polarity X1)
    if (psyEffects.allElementFlat > 0) {
      extraStats["All Element (Psychoscope)"] = Number(psyEffects.allElementFlat.toFixed(1))
    }

    // Endurance from bond generals
    if (psyEffects.bondEndurance > 0) {
      extraStats["Endurance (Bond)"] = psyEffects.bondEndurance
    }
  }

  const hastePct = getStatPercentCombat("Haste", total.Haste) + ext.haste
  const aspdRatio = talentFlags?.swift ? ratios.aspd + 1.0 : ratios.aspd
  const talentAspdVal = talentFlags?.aspd ?? 0
  const set2pcAspd = (raid2pcBonus?.t === "aspd") ? raid2pcBonus.v : 0
  const set2pcCspd = (raid2pcBonus?.t === "cspd") ? raid2pcBonus.v : 0
  // Moonstrike: ASPD +6% only if base ASPD < 80 (compute base first, then conditionally add)
  const aspdBase = hastePct * aspdRatio + (purpleStats["Attack Speed (%)"] ?? 0) + ext.aspd + moduleAspd + talentAspdVal + extraTalentAspd + set2pcAspd
  const set2pcAspdCond = (raid2pcBonus?.t === "aspd_cond" && aspdBase < 80) ? raid2pcBonus.v : 0
  const aspd = aspdBase + set2pcAspdCond
  // Shield 4pc: Haste +6% (additive to final haste percent, affects CSPD/ASPD indirectly via display)
  const set4pcHaste = (raid4pcBonus?.t === "haste_pct") ? raid4pcBonus.v : 0
  const cspd = hastePct * ratios.cspd + (purpleStats["Cast Speed (%)"] ?? 0) + ext.cspd + moduleCspd + extraTalentCspd + set2pcCspd

  return {
    total, purpleStats, extraStats, moduleStats, powerCorePoints, appliedBonus, weaponEffects, aspd, cspd, talentAspd: talentAspdVal, ext: {
      crit: ext.crit, luck: ext.luck, haste: ext.haste, mast: ext.mast, vers: ext.vers, aspd: ext.aspd, cspd: ext.cspd, illu: ext.illu
    }, raidArmorCount, raid2pcBonus, raid4pcBonus, set4pcHaste, psychoscopeEffects: psyEffects
  }
}

// Helper to calculate stats from a saved GearSet (for comparison mode)
export function calculateStatsFromGearSet(
  gearSet: GearSet,
  spec: string,
  base: BaseStats,
  ext: ExtBuffs,
  psychoscopeConfig?: PsychoscopeConfig
): StatsResult {
  const className = getClassForSpec(spec)
  const talentFlags = { swift: className === "Stormblade" && gearSet.selectedTalents.includes("swift"), aspd: gearSet.talentAspd, selectedIds: gearSet.selectedTalents }
  return calculateStats(gearSet.gear, gearSet.imagines, gearSet.modules, spec, base, ext, gearSet.legendaryTypes, gearSet.legendaryVals, talentFlags, psychoscopeConfig)
}

// ── Context ───────────────────────────────────────────────

interface AppState {
  section: NavSection
  setSection: (s: NavSection) => void

  accent: AccentColor
  setAccent: (a: AccentColor) => void
  accentColor: string

  build: Build
  setBuild: (b: Build) => void

  spec: string
  setSpec: (s: string) => void

  gear: GearSlot[]
  setGear: (g: GearSlot[]) => void
  updateGearSlot: (i: number, patch: Partial<GearSlot>) => void

  legendaryTypes: string[]
  legendaryVals: number[]
  setLegendaryType: (i: number, v: string) => void
  setLegendaryVal: (i: number, v: number) => void

  imagines: ImagineSlot[]
  setImagine: (i: number, patch: Partial<ImagineSlot>) => void

  modules: ModuleSlot[]
  updateModule: (i: number, patch: Partial<ModuleSlot>) => void
  setModules: (m: ModuleSlot[]) => void
  setAllImagines: (im: ImagineSlot[]) => void

  base: BaseStats
  setBase: (patch: Partial<BaseStats>) => void

  ext: ExtBuffs
  setExt: (patch: Partial<ExtBuffs>) => void

  stats: StatsResult | null
  recalculate: () => void

  gearLib: GearLibItem[]
  setGearLib: (items: GearLibItem[]) => void

  selectedClass: string | null
  setSelectedClass: (c: string | null) => void

  getAllowedForSlot: (slotIdx: number, excludePrimary?: boolean) => string[]

  selectedTalents: string[]
  setSelectedTalents: (t: string[]) => void
  talentAspd: number
  setTalentAspd: (v: number) => void

  gearSets: GearSet[]
  saveGearSet: (name: string) => void
  deleteGearSet: (id: string) => void
  loadGearSet: (id: string) => void
  renameGearSet: (id: string, name: string) => void
  importGearSets: (sets: GearSet[]) => void

  psychoscopeConfig: PsychoscopeConfig
  setPsychoscopeConfig: (config: PsychoscopeConfig) => void
}

const AppContext = createContext<AppState | null>(null)

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error("useApp must be used within AppProvider")
  return ctx
}

const SAVE_KEY = "bpsr_v2_state"

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [section, setSection] = useState<NavSection>("classes")
  const [accent, setAccentState] = useState<AccentColor>("yellow")
  const [build, setBuildState] = useState<Build>("Strength")
  const [spec, setSpec] = useState<string>("Moonstrike")
  const [gear, setGearState] = useState<GearSlot[]>(defaultGear)
  const [legendaryTypes, setLegendaryTypes] = useState<string[]>(GAME_DATA.SLOTS.map(() => "-"))
  const [legendaryVals, setLegendaryVals] = useState<number[]>(GAME_DATA.SLOTS.map(() => 0))
  const [imagines, setImagines] = useState<ImagineSlot[]>(defaultImageSlots)
  const [modules, setModules] = useState<ModuleSlot[]>(defaultModules)
  const [base, setBaseState] = useState<BaseStats>(defaultBase)
  const [ext, setExtState] = useState<ExtBuffs>(defaultBuffs)
  const [stats, setStats] = useState<StatsResult | null>(null)
  const [gearLib, setGearLib] = useState<GearLibItem[]>([])
  const [selectedClass, setSelectedClass] = useState<string | null>(null)
  const [selectedTalents, setSelectedTalents] = useState<string[]>([])
  const [talentAspd, setTalentAspd] = useState<number>(0)
  const [gearSets, setGearSets] = useState<GearSet[]>([])
  const [psychoscopeConfig, setPsychoscopeConfig] = useState<PsychoscopeConfig>(DEFAULT_PSYCHOSCOPE_CONFIG)
  const canSave = useRef(false)

  const accentColor = ACCENT_MAP[accent]

  const setAccent = useCallback((a: AccentColor) => {
    setAccentState(a)
    document.documentElement.style.setProperty("--accent", ACCENT_MAP[a])
    document.documentElement.style.setProperty("--accent-foreground", a === "blue" ? "#ffffff" : "#000000")
  }, [])

  // Sync accent color to CSS on mount
  useEffect(() => {
    document.documentElement.style.setProperty("--accent", ACCENT_MAP[accent])
  }, [accent])

  const getAllowedForSlot = useCallback((slotIdx: number, excludePrimary = false): string[] => {
    const slot = GAME_DATA.SLOTS[slotIdx]
    const primary = excludePrimary ? gear[slotIdx]?.p : undefined
    return getAllowedStats(slot, build, primary ? [primary] : [])
  }, [gear, build])

  const updateGearSlot = useCallback((i: number, patch: Partial<GearSlot>) => {
    setGearState(prev => {
      const next = [...prev]
      next[i] = { ...next[i], ...patch }
      return next
    })
  }, [])

  const setLegendaryType = useCallback((i: number, v: string) => {
    setLegendaryTypes(prev => { const n = [...prev]; n[i] = v; return n })
  }, [])

  const setLegendaryVal = useCallback((i: number, v: number) => {
    setLegendaryVals(prev => { const n = [...prev]; n[i] = v; return n })
  }, [])

  const setImagine = useCallback((i: number, patch: Partial<ImagineSlot>) => {
    setImagines(prev => { const n = [...prev]; n[i] = { ...n[i], ...patch }; return n })
  }, [])

  const updateModule = useCallback((i: number, patch: Partial<ModuleSlot>) => {
    setModules(prev => { const n = [...prev]; n[i] = { ...n[i], ...patch }; return n })
  }, [])

  const setBase = useCallback((patch: Partial<BaseStats>) => {
    setBaseState(prev => ({ ...prev, ...patch }))
  }, [])

  const setExt = useCallback((patch: Partial<ExtBuffs>) => {
    setExtState(prev => ({ ...prev, ...patch }))
  }, [])

  const setBuild = useCallback((b: Build) => {
    setBuildState(b)
    // Reset slot values when build changes
    setGearState(prev => prev.map((g, i) => {
      if (g.raid) return g
      const slot = GAME_DATA.SLOTS[i]
      const allowed = getAllowedStats(slot, b)
      return {
        ...g,
        p: allowed.includes(g.p) ? g.p : "-",
        s: allowed.includes(g.s) ? g.s : "-",
      }
    }))
  }, [])

  const saveGearSet = useCallback((name: string) => {
    const newSet: GearSet = {
      id: `set_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      name,
      gear: gear.map(g => ({ ...g })),
      legendaryTypes: [...legendaryTypes],
      legendaryVals: [...legendaryVals],
      imagines: imagines.map(im => ({ ...im })),
      modules: modules.map(m => ({ ...m })),
      selectedTalents: [...selectedTalents],
      talentAspd,
      createdAt: new Date().toISOString(),
    }
    setGearSets(prev => [...prev, newSet])
  }, [gear, legendaryTypes, legendaryVals, imagines, modules, selectedTalents, talentAspd])

  const deleteGearSet = useCallback((id: string) => {
    setGearSets(prev => prev.filter(s => s.id !== id))
  }, [])

  const loadGearSet = useCallback((id: string) => {
    const set = gearSets.find(s => s.id === id)
    if (!set) return
    setGearState(set.gear.map(g => ({ ...g })))
    setLegendaryTypes([...set.legendaryTypes])
    setLegendaryVals([...set.legendaryVals])
    setImagines(set.imagines.map(im => ({ ...im })))
    setModules(set.modules.map(m => ({ ...m })))
    setSelectedTalents([...set.selectedTalents])
    setTalentAspd(set.talentAspd)
  }, [gearSets])

  const renameGearSet = useCallback((id: string, name: string) => {
    setGearSets(prev => prev.map(s => s.id === id ? { ...s, name } : s))
  }, [])

  const importGearSets = useCallback((sets: GearSet[]) => {
    setGearSets(prev => {
      // Merge: keep existing sets, add new ones (skip duplicates by id)
      const existingIds = new Set(prev.map(s => s.id))
      const newSets = sets.filter(s => !existingIds.has(s.id))
      return [...prev, ...newSets]
    })
  }, [])

  const recalculate = useCallback(() => {
    const className = getClassForSpec(spec)
    const talentFlags = { swift: className === "Stormblade" && selectedTalents.includes("swift"), aspd: talentAspd, selectedIds: selectedTalents }
    const result = calculateStats(gear, imagines, modules, spec, base, ext, legendaryTypes, legendaryVals, talentFlags, psychoscopeConfig)
    setStats(result)
  }, [gear, imagines, modules, spec, base, ext, talentAspd, legendaryTypes, legendaryVals, selectedTalents, psychoscopeConfig])

  // Auto-recalculate when any dependency changes
  useEffect(() => {
    recalculate()
  }, [recalculate])

  // Persist state
  useEffect(() => {
    if (!canSave.current) return
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify({ build, spec, gear, legendaryTypes, legendaryVals, imagines, modules, base, ext, accent, gearLib, selectedTalents, talentAspd, gearSets, psychoscopeConfig }))
    } catch (e) {
      console.error('[BPSR] Save failed:', e)
    }
  }, [build, spec, gear, legendaryTypes, legendaryVals, imagines, modules, base, ext, accent, gearLib, selectedTalents, talentAspd, gearSets, psychoscopeConfig])

  // Load persisted state on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SAVE_KEY)
      if (!raw) { canSave.current = true; return }
      const saved = JSON.parse(raw)
      if (saved.build) setBuildState(saved.build)
      if (saved.spec) setSpec(saved.spec)
      if (saved.gear && Array.isArray(saved.gear)) {
        // Migrate old saves: add tier field if missing
        const migratedGear = saved.gear.map((g: any, i: number) => {
          if (g && !g.tier) {
            const st = getSlotType(i)
            let tier: string
            if (st === "weapon") tier = g.raid ? "Lv150 Raid" : "Lv140 Gold"
            else if (st === "armor") tier = g.raid ? "Lv140 Raid" : "Lv140 Gold"
            else tier = "Lv140 Gold"
            return { ...g, tier }
          }
          return g
        })
        setGearState(migratedGear)
      }
      if (saved.legendaryTypes && Array.isArray(saved.legendaryTypes)) {
        const lt = GAME_DATA.SLOTS.map((_, i) => saved.legendaryTypes[i] ?? "-")
        setLegendaryTypes(lt)
      }
      if (saved.legendaryVals && Array.isArray(saved.legendaryVals)) {
        const lv = GAME_DATA.SLOTS.map((_, i) => saved.legendaryVals[i] ?? 0)
        setLegendaryVals(lv)
      }
      if (saved.imagines && Array.isArray(saved.imagines)) setImagines(saved.imagines)
      if (saved.modules && Array.isArray(saved.modules)) setModules(saved.modules)
      if (saved.base) setBaseState({ ...defaultBase(), ...saved.base })
      if (saved.ext) setExtState({ ...defaultBuffs(), ...saved.ext })
      if (saved.accent) { setAccentState(saved.accent); document.documentElement.style.setProperty("--accent", ACCENT_MAP[saved.accent as AccentColor]) }
      if (saved.gearLib && Array.isArray(saved.gearLib)) setGearLib(saved.gearLib)
      if (saved.selectedTalents && Array.isArray(saved.selectedTalents)) setSelectedTalents(saved.selectedTalents)
      if (typeof saved.talentAspd === "number") setTalentAspd(saved.talentAspd)
      if (saved.gearSets && Array.isArray(saved.gearSets)) setGearSets(saved.gearSets)
      if (saved.psychoscopeConfig?.projectionId) {
        // Migrate: add bondLevel and enabled if missing from old saves
        const cfg = { ...DEFAULT_PSYCHOSCOPE_CONFIG, ...saved.psychoscopeConfig }
        if (typeof cfg.bondLevel !== "number") cfg.bondLevel = 0
        if (typeof cfg.enabled !== "boolean") cfg.enabled = true
        setPsychoscopeConfig(cfg)
      }
    } catch (e) {
      console.error('[BPSR] Load failed:', e)
    }
    // Enable saving after React flushes the restored state
    const timer = setTimeout(() => { canSave.current = true }, 100)
    return () => clearTimeout(timer)
  }, [])

  const value: AppState = {
    section, setSection,
    accent, setAccent, accentColor,
    build, setBuild,
    spec, setSpec,
    gear, setGear: setGearState, updateGearSlot,
    legendaryTypes, legendaryVals, setLegendaryType, setLegendaryVal,
    imagines, setImagine,
    modules, updateModule, setModules: setModules, setAllImagines: setImagines,
    base, setBase,
    ext, setExt,
    stats, recalculate,
    gearLib, setGearLib,
    selectedClass, setSelectedClass,
    getAllowedForSlot,
    selectedTalents, setSelectedTalents,
    talentAspd, setTalentAspd,
    gearSets, saveGearSet, deleteGearSet, loadGearSet, renameGearSet, importGearSets,
    psychoscopeConfig, setPsychoscopeConfig,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
