"use client"
import { useState, useMemo, useCallback } from "react"
import { useApp, calculateStats, getStatPercentCombat, getClassForSpec } from "@/lib/app-context"
import type { ModuleSlot } from "@/lib/app-context"
import {
  GAME_DATA, getDefaultTier, getSlotType, getTierData,
  getPurpleValOptions, getArmorPurpleForBuild, findRaidTier, findGoldTier,
  getUniqueTierLevels, getTierForLevel, MODULE_DB, AFFIX_DB, MODULE_THRESHOLDS,
} from "@/lib/game-data"
import { MIND_PROJECTIONS } from "@/lib/psychoscope-data"
import { TALENT_DATA } from "@/lib/talent-data"
import type { GearSlot } from "@/lib/app-context"

// ═══════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════

/** Slots that get class-specific % purple stats (weapon + accessories) */
const PCT_SLOTS = [0, 5, 6, 7, 10]

/** Raid-eligible armor indices (excludes weapon index 0) */
const RAID_ARMOR_INDICES = [1, 2, 3, 4, 8, 9]

/** All slot indices */
const ALL_SLOT_INDICES = Array.from({ length: 11 }, (_, i) => i)

// ═══════════════════════════════════════════════════════════
// STAT WEIGHT MODELS PER SPEC
// ═══════════════════════════════════════════════════════════

const SPEC_WEIGHTS: Record<string, Record<string, number>> = {
  "Iado":        { Crit: 1.3, Mastery: 1.1, Luck: 0.9, Haste: 0.8, Versatility: 0.6 },
  "Moonstrike":  { Haste: 1.7, Luck: 1.6, Crit: 0.2, Mastery: 0.8, Versatility: 0 },
  "Earthfort":   { Mastery: 1.3, Versatility: 1.2, Haste: 0.8, Crit: 0.7, Luck: 0.5 },
  "Block":       { Mastery: 1.2, Luck: 1.1, Crit: 0.9, Haste: 0.8, Versatility: 0.7 },
  "Vanguard":    { Haste: 1.3, Mastery: 1.1, Crit: 0.9, Luck: 0.8, Versatility: 0.6 },
  "Skyward":     { Crit: 1.3, Luck: 1.2, Haste: 0.9, Mastery: 0.7, Versatility: 0.5 },
  "Wildpack":    { Haste: 1.2, Mastery: 1.2, Crit: 0.9, Luck: 0.8, Versatility: 0.5 },
  "Falconry":    { Haste: 1.1, Crit: 1.3, Luck: 0.9, Mastery: 0.8, Versatility: 0.5 },
  "Icicle":      { Crit: 1.3, Luck: 1.2, Mastery: 0.8, Haste: 0.8, Versatility: 0.5 },
  "Frostbeam":   { Haste: 1.2, Mastery: 1.1, Crit: 0.9, Luck: 0.8, Versatility: 0.5 },
  "Smite":       { Luck: 1.2, Mastery: 1.1, Crit: 0.9, Haste: 0.9, Versatility: 0.6 },
  "Lifebind":    { Haste: 1.3, Mastery: 1.1, Crit: 0.8, Luck: 0.7, Versatility: 0.6 },
  "Recovery":    { Crit: 1.2, Mastery: 1.1, Haste: 0.9, Luck: 0.8, Versatility: 0.7 },
  "Shield":      { Haste: 1.3, Mastery: 1.1, Crit: 0.8, Luck: 0.7, Versatility: 0.8 },
  "Dissonance":  { Haste: 1.2, Luck: 1.1, Crit: 0.9, Mastery: 0.8, Versatility: 0.6 },
  "Concerto":    { Crit: 1.1, Haste: 1.1, Mastery: 0.9, Luck: 0.8, Versatility: 0.7 },
}

const STAT_KEYS = ["Versatility", "Mastery", "Haste", "Crit", "Luck"] as const
const STAT_SHORT: Record<string, string> = { Versatility: "vers", Mastery: "mast", Haste: "haste", Crit: "crit", Luck: "luck" }

// ═══════════════════════════════════════════════════════════
// OPTIMIZER ENGINE
// ═══════════════════════════════════════════════════════════

interface OptConfig {
  spec: string; build: string; className: string | null; mainStat: string
  targetLevel: number; raidMode: "auto" | "0" | "2" | "4"
  mode: "smart" | "targets"
  targets: { vers: number; mast: number; haste: number; crit: number; luck: number }
  weights: Record<string, number>
  lockedSlots: boolean[]; currentGear: GearSlot[]
  imagines: { key: string; idx: number }[]; modules: ModuleSlot[]
  base: any; ext: any
  legendaryTypes: string[]; legendaryVals: number[]
  selectedTalents: string[]; talentAspd: number
  optPurple: boolean; optImagines: boolean; optModules: boolean
  psychoscopeConfig?: any
}

interface OptResult {
  gear: GearSlot[]; lt: string[]; lv: number[]
  imagines: { key: string; idx: number }[]
  modules: ModuleSlot[]
  score: number; statPcts: Record<string, number>; raidCount: number
}

function getAllowedStats(slotIdx: number, build: string): string[] {
  const slot = GAME_DATA.SLOTS[slotIdx]
  const banned = GAME_DATA.RESTRICTIONS[slot]?.[build] ?? []
  return (GAME_DATA.STATS as readonly string[]).filter(s => !banned.includes(s))
}

function getPurpleOpts(slotIdx: number, className: string | null, mainStat: string): string[] {
  if (PCT_SLOTS.includes(slotIdx) && className) return GAME_DATA.PURPLE_STATS[className] ?? []
  if (!PCT_SLOTS.includes(slotIdx)) return getArmorPurpleForBuild(mainStat)
  return []
}

function bestPurpleVal(stat: string, slotIdx: number, tierStr: string): number {
  const st = PCT_SLOTS.includes(slotIdx) ? (slotIdx === 0 ? "weapon" : "access") : "armor"
  const opts = getPurpleValOptions(stat, st, tierStr)
  return opts.length > 0 ? opts[opts.length - 1] : 0
}

function isRaidEligible(slotIdx: number): boolean {
  return (GAME_DATA.RAID_SLOTS as readonly string[]).includes(GAME_DATA.SLOTS[slotIdx])
}

/** Compute optimization score for a given gear configuration */
function scoreAllocation(
  gear: GearSlot[], imagines: { key: string; idx: number }[], modules: any[],
  config: OptConfig, lt: string[], lv: number[],
): { score: number; pcts: Record<string, number> } {
  const res = calculateStats(
    gear, imagines, modules, config.spec, config.base, config.ext, lt, lv,
    { swift: config.className === "Stormblade" && config.selectedTalents.includes("swift"), aspd: config.talentAspd, selectedIds: config.selectedTalents },
    config.psychoscopeConfig
  )
  const pcts: Record<string, number> = {}
  for (const stat of STAT_KEYS) {
    const raw = res.total[stat] ?? 0
    const extKey = STAT_SHORT[stat]
    const extVal = (res.ext as Record<string, number>)[extKey] ?? 0
    pcts[stat] = getStatPercentCombat(stat, raw) + extVal
  }
  if (config.mode === "targets") {
    const t = config.targets
    const diff =
      Math.abs(pcts.Versatility - t.vers) * 1.5 + Math.pow(Math.max(0, Math.abs(pcts.Versatility - t.vers) - 1), 2) * 0.5 +
      Math.abs(pcts.Mastery - t.mast) * 1.5 + Math.pow(Math.max(0, Math.abs(pcts.Mastery - t.mast) - 1), 2) * 0.5 +
      Math.abs(pcts.Haste - t.haste) * 1.5 + Math.pow(Math.max(0, Math.abs(pcts.Haste - t.haste) - 1), 2) * 0.5 +
      Math.abs(pcts.Crit - t.crit) * 1.5 + Math.pow(Math.max(0, Math.abs(pcts.Crit - t.crit) - 1), 2) * 0.5 +
      Math.abs(pcts.Luck - t.luck) * 1.5 + Math.pow(Math.max(0, Math.abs(pcts.Luck - t.luck) - 1), 2) * 0.5
    return { score: -diff, pcts }
  }
  // Smart mode: weighted multiplicative score
  const w = config.weights
  let score = 1
  for (const stat of STAT_KEYS) score *= (1 + (w[stat] ?? 1.0) * pcts[stat] / 100)
  // Raid set bonus value
  const raidArmorCount = RAID_ARMOR_INDICES.filter(i => gear[i]?.raid).length
  if (gear[0]?.raid && raidArmorCount >= 2) score *= 1.02
  if (gear[0]?.raid && raidArmorCount >= 4) score *= 1.04
  return { score, pcts }
}

/** Greedy initial gear generation for a specific raid count */
function generateGreedyGear(config: OptConfig, raidArmorCount: number) {
  const specStats = GAME_DATA.SPECS[config.spec] ?? ["Haste", "Mastery"]
  const gear: GearSlot[] = GAME_DATA.SLOTS.map((_, i) => ({
    tier: config.currentGear[i]?.tier || getDefaultTier(i),
    raid: false, p: "-", s: "-", r: "-", sigName: "", sigLvl: "1"
  }))
  const lt = [...config.legendaryTypes]
  const lv = [...config.legendaryVals]

  // Copy locked slots
  config.lockedSlots.forEach((locked, i) => {
    if (locked) gear[i] = { ...config.currentGear[i] }
  })

  // Set tiers from target level
  ALL_SLOT_INDICES.forEach(i => {
    if (config.lockedSlots[i]) return
    const slotType = getSlotType(i)
    const tier = getTierForLevel(slotType, config.targetLevel, false)
    if (tier) gear[i] = { ...gear[i], tier }
  })

  // Weapon always raid if not locked
  if (!config.lockedSlots[0]) {
    const slotType = getSlotType(0)
    const raidTier = getTierForLevel(slotType, config.targetLevel, true)
    if (raidTier) {
      gear[0] = { ...gear[0], tier: raidTier, raid: true, p: specStats[0], s: specStats[1], r: "-",
        sigName: config.currentGear[0]?.sigName ?? "", sigLvl: config.currentGear[0]?.sigLvl ?? "1" }
    }
  }

  // Pick raid armor slots
  const unlockedRaidEligible = RAID_ARMOR_INDICES.filter(i => !config.lockedSlots[i])
  const lockedRaidCount = RAID_ARMOR_INDICES.filter(i => config.lockedSlots[i] && config.currentGear[i]?.raid).length
  const targetRaid = Math.max(0, raidArmorCount - lockedRaidCount)
  const raidPicks = unlockedRaidEligible.slice(0, targetRaid)

  raidPicks.forEach(i => {
    const slotType = getSlotType(i)
    const raidTier = getTierForLevel(slotType, config.targetLevel, true)
      ?? findRaidTier(slotType, gear[i].tier) ?? gear[i].tier
    const tierData = getTierData(slotType, raidTier)
    const hasReforge = tierData ? tierData.r > 0 : false
    gear[i] = {
      tier: raidTier, raid: true, p: specStats[0], s: specStats[1],
      r: hasReforge ? specStats[0] : "-",
      sigName: config.currentGear[i]?.sigName ?? "", sigLvl: config.currentGear[i]?.sigLvl ?? "1"
    }
    lt[i] = "-"; lv[i] = 0
  })

  // Gold slots: greedy by stat weight
  ALL_SLOT_INDICES.filter(i => !config.lockedSlots[i] && !gear[i].raid).forEach(i => {
    if (i === 0 && gear[0].raid) return
    const slotType = getSlotType(i)
    const goldTier = getTierForLevel(slotType, config.targetLevel, false)
      ?? findGoldTier(slotType, gear[i].tier) ?? gear[i].tier
    const allowed = getAllowedStats(i, config.build)
    const sorted = [...allowed].sort((a, b) => (config.weights[b] ?? 0) - (config.weights[a] ?? 0))
    gear[i] = {
      tier: goldTier, raid: false, p: sorted[0] ?? "-", s: sorted[1] ?? "-", r: sorted[0] ?? "-",
      sigName: config.currentGear[i]?.sigName ?? "", sigLvl: config.currentGear[i]?.sigLvl ?? "1"
    }
  })

  // Purple stats
  if (config.optPurple) {
    ALL_SLOT_INDICES.forEach(i => {
      if (config.lockedSlots[i] || gear[i].raid) return
      const opts = getPurpleOpts(i, config.className, config.mainStat)
      if (opts.length === 0) return
      const dpsRelevant = opts.filter(o =>
        o.includes("Attack") || o.includes("Cast Speed") || o.includes("DMG Bonus") ||
        o.includes("Melee") || o.includes("Ranged") || o.includes("Resilience") ||
        o === `${config.mainStat} (%)`
      )
      const pick = dpsRelevant[0] ?? opts[0]
      lt[i] = pick; lv[i] = bestPurpleVal(pick, i, gear[i].tier)
    })
  }

  return { gear, lt, lv }
}

/** Hill climbing optimizer: iteratively improve by swapping one slot's stats */
function hillClimb(
  startGear: GearSlot[], startLt: string[], startLv: number[],
  config: OptConfig, iterations: number = 800
) {
  let gear = startGear.map(g => ({ ...g }))
  let lt = [...startLt]; let lv = [...startLv]
  let { score: bestScore, pcts: bestPcts } = scoreAllocation(gear, config.imagines, config.modules, config, lt, lv)
  const specStats = GAME_DATA.SPECS[config.spec] ?? ["Haste", "Mastery"]

  for (let iter = 0; iter < iterations; iter++) {
    const candidates = ALL_SLOT_INDICES.filter(i => !config.lockedSlots[i])
    if (candidates.length === 0) break
    const idx = candidates[Math.floor(Math.random() * candidates.length)]

    const newGear = gear.map(g => ({ ...g }))
    const newLt = [...lt]; const newLv = [...lv]
    const slot = newGear[idx]

    if (slot.raid) {
      const slotType = getSlotType(idx)
      const tierData = getTierData(slotType, slot.tier)
      if (tierData && tierData.r > 0 && idx !== 0) {
        newGear[idx] = { ...slot, r: GAME_DATA.STATS[Math.floor(Math.random() * 5)] as string }
      } else continue
    } else {
      const allowed = getAllowedStats(idx, config.build)
      const action = Math.random()
      if (action < 0.35) {
        const p = allowed[Math.floor(Math.random() * allowed.length)]
        const sOpts = allowed.filter(x => x !== p)
        newGear[idx] = { ...slot, p, s: sOpts.includes(slot.s) ? slot.s : (sOpts[0] ?? "-") }
      } else if (action < 0.6) {
        const sOpts = allowed.filter(x => x !== slot.p)
        newGear[idx] = { ...slot, s: sOpts[Math.floor(Math.random() * sOpts.length)] ?? "-" }
      } else if (action < 0.8) {
        newGear[idx] = { ...slot, r: GAME_DATA.STATS[Math.floor(Math.random() * 5)] as string }
      } else if (action < 0.95 && config.optPurple) {
        const opts = getPurpleOpts(idx, config.className, config.mainStat)
        if (opts.length > 0) {
          if (Math.random() < 0.2) { newLt[idx] = "-"; newLv[idx] = 0 }
          else { const pick = opts[Math.floor(Math.random() * opts.length)]; newLt[idx] = pick; newLv[idx] = bestPurpleVal(pick, idx, slot.tier) }
        }
      } else if (isRaidEligible(idx) && idx !== 0) {
        if (!slot.raid) {
          const currentRaid = RAID_ARMOR_INDICES.filter(i => newGear[i].raid).length
          if (currentRaid < 6) {
            const slotType = getSlotType(idx)
            const raidTier = findRaidTier(slotType, slot.tier) ?? slot.tier
            const tierData = getTierData(slotType, raidTier)
            const hasReforge = tierData ? tierData.r > 0 : false
            newGear[idx] = { tier: raidTier, raid: true, p: specStats[0], s: specStats[1],
              r: hasReforge ? (GAME_DATA.STATS[Math.floor(Math.random() * 5)] as string) : "-",
              sigName: slot.sigName, sigLvl: slot.sigLvl }
            newLt[idx] = "-"; newLv[idx] = 0
          }
        } else {
          const slotType = getSlotType(idx)
          const goldTier = findGoldTier(slotType, slot.tier) ?? slot.tier
          const av = getAllowedStats(idx, config.build)
          const sorted = [...av].sort((a, b) => (config.weights[b] ?? 0) - (config.weights[a] ?? 0))
          newGear[idx] = { tier: goldTier, raid: false, p: sorted[0] ?? "-", s: sorted[1] ?? "-",
            r: sorted[0] ?? "-", sigName: slot.sigName, sigLvl: slot.sigLvl }
          if (config.optPurple) {
            const opts = getPurpleOpts(idx, config.className, config.mainStat)
            if (opts.length > 0) { newLt[idx] = opts[0]; newLv[idx] = bestPurpleVal(opts[0], idx, goldTier) }
          }
        }
      } else continue
    }

    const { score: newScore, pcts: newPcts } = scoreAllocation(newGear, config.imagines, config.modules, config, newLt, newLv)
    if (newScore > bestScore) { gear = newGear; lt = newLt; lv = newLv; bestScore = newScore; bestPcts = newPcts }
  }
  return { gear, lt, lv, score: bestScore, pcts: bestPcts }
}

/** Optimize imagines by testing all meaningful stat combinations */
function optimizeImagines(gear: GearSlot[], lt: string[], lv: number[], config: OptConfig) {
  const imgKeys = Object.keys(GAME_DATA.IMAGINE.OPTIONS)
  let bestImg = config.imagines.map(x => ({ ...x }))
  let { score: bestScore, pcts: bestPcts } = scoreAllocation(gear, bestImg, config.modules, config, lt, lv)

  const statImgs: Record<string, string[]> = {}
  for (const key of imgKeys) {
    const stat = GAME_DATA.IMAGINE.OPTIONS[key].stat
    if (!statImgs[stat]) statImgs[stat] = []
    statImgs[stat].push(key)
  }
  const bestPerStat: { key: string; stat: string }[] = []
  for (const [stat, keys] of Object.entries(statImgs)) {
    let bestKey = keys[0]; let bestVal = 0
    for (const k of keys) { const v = GAME_DATA.IMAGINE.OPTIONS[k].vals[5] ?? 0; if (v > bestVal) { bestVal = v; bestKey = k } }
    bestPerStat.push({ key: bestKey, stat })
  }
  for (let a = 0; a < bestPerStat.length; a++) {
    for (let b = a; b < bestPerStat.length; b++) {
      const testImg = [{ key: bestPerStat[a].key, idx: 5 }, { key: bestPerStat[b].key, idx: 5 }]
      const { score } = scoreAllocation(gear, testImg, config.modules, config, lt, lv)
      if (score > bestScore) {
        bestScore = score; bestImg = testImg.map(x => ({ ...x }))
        bestPcts = scoreAllocation(gear, bestImg, config.modules, config, lt, lv).pcts
      }
    }
  }
  return { imagines: bestImg, score: bestScore, pcts: bestPcts }
}

/** DPS-relevant module affix names (filtered per class at call site) */
function getDpsAffixes(className: string | null): string[] {
  const mainStat = className ? GAME_DATA.CLASSES[className]?.main : null
  return AFFIX_DB.filter(name => {
    const mod = MODULE_DB.find(m => m.name === name)
    if (!mod || !mod.s[5]) return false
    const topStats = Object.keys(mod.s[5])
    // Include if the affix grants any offensive stat at max level
    const isDps = topStats.some(k =>
      k.includes("ATK") || k.includes("Atk") || k.includes("DMG") || k.includes("Crit") ||
      k.includes("Lucky") || k.includes("Speed") || k.includes("Adaptive Main") ||
      k.includes("Element") || k.includes("Top Stat") ||
      (mainStat === "Agility" && k === "Agility") ||
      (mainStat === "Strength" && k === "Strength") ||
      (mainStat === "Intellect" && k === "Intellect")
    )
    // Exclude pure tank/healer affixes
    const isTankHealer = topStats.some(k =>
      k.includes("Healing") || k.includes("Reduction") || k.includes("Life Steal") ||
      k.includes("Armor") || k.includes("Endurance") || k.includes("Resistance")
    )
    return isDps && !isTankHealer
  })
}

/** Build a module layout from a set of affix names, evenly distributed at max level */
function buildModuleLayout(affixes: string[]): ModuleSlot[] {
  const n = affixes.length
  // 12 total affix positions (4 modules × 3 each), max level 9 per position
  const slotsPerAffix = Math.floor(12 / n)
  const extra = 12 - slotsPerAffix * n
  const assignment: string[] = []
  for (let i = 0; i < n; i++) {
    const count = slotsPerAffix + (i < extra ? 1 : 0)
    for (let j = 0; j < count; j++) assignment.push(affixes[i])
  }
  return Array.from({ length: 4 }, (_, mi): ModuleSlot => ({
    rarity: "Gold",
    a1: assignment[mi * 3] ?? "", a1lv: 9,
    a2: assignment[mi * 3 + 1] ?? "", a2lv: 9,
    a3: assignment[mi * 3 + 2] ?? "", a3lv: 9,
  }))
}

/** Generate combinations of size k from an array */
function combinations<T>(arr: T[], k: number): T[][] {
  if (k === 0) return [[]]
  if (arr.length < k) return []
  const [first, ...rest] = arr
  const withFirst = combinations(rest, k - 1).map(c => [first, ...c])
  const withoutFirst = combinations(rest, k)
  return [...withFirst, ...withoutFirst]
}

/** Optimize module affix selections by testing top DPS-relevant combinations */
function optimizeModules(
  gear: GearSlot[], lt: string[], lv: number[],
  imagines: { key: string; idx: number }[], config: OptConfig
) {
  let bestModules = config.modules.map(m => ({ ...m }))
  let { score: bestScore, pcts: bestPcts } = scoreAllocation(gear, imagines, bestModules, config, lt, lv)

  const dpsAffixes = getDpsAffixes(config.className)

  for (let n = 2; n <= Math.min(4, dpsAffixes.length); n++) {
    const combos = combinations(dpsAffixes, n)
    for (const combo of combos) {
      const testModules = buildModuleLayout(combo)
      const { score, pcts } = scoreAllocation(gear, imagines, testModules, config, lt, lv)
      if (score > bestScore) {
        bestScore = score
        bestModules = testModules.map(m => ({ ...m }))
        bestPcts = pcts
      }
    }
  }
  return { modules: bestModules, score: bestScore, pcts: bestPcts }
}

/** Main optimizer: runs multiple strategies across raid configs and picks the best */
function runOptimize(config: OptConfig): OptResult {
  const raidCounts = config.raidMode === "auto" ? [0, 2, 4] : [parseInt(config.raidMode)]
  let globalBest: OptResult | null = null

  for (const raidCount of raidCounts) {
    const { gear: greedyGear, lt: greedyLt, lv: greedyLv } = generateGreedyGear(config, raidCount)
    const RESTARTS = 5; const ITERS = 800
    let localBest: ReturnType<typeof hillClimb> | null = null

    for (let r = 0; r < RESTARTS; r++) {
      let startGear = greedyGear.map(g => ({ ...g }))
      let startLt = [...greedyLt]; let startLv = [...greedyLv]
      if (r > 0) {
        const unlocked = ALL_SLOT_INDICES.filter(i => !config.lockedSlots[i] && !startGear[i].raid)
        for (let s = 0; s < Math.min(3, unlocked.length); s++) {
          const idx = unlocked[Math.floor(Math.random() * unlocked.length)]
          const allowed = getAllowedStats(idx, config.build)
          const p = allowed[Math.floor(Math.random() * allowed.length)]
          const sOpts = allowed.filter(x => x !== p)
          startGear[idx] = { ...startGear[idx], p, s: sOpts[Math.floor(Math.random() * sOpts.length)] ?? "-", r: GAME_DATA.STATS[Math.floor(Math.random() * 5)] as string }
        }
      }
      const result = hillClimb(startGear, startLt, startLv, config, ITERS)
      if (!localBest || result.score > localBest.score) localBest = result
    }
    if (!localBest) continue

    let finalImg = config.imagines.map(x => ({ ...x }))
    let finalModules = config.modules.map(m => ({ ...m }))
    let finalPcts = localBest.pcts; let finalScore = localBest.score
    if (config.optImagines) {
      const imgResult = optimizeImagines(localBest.gear, localBest.lt, localBest.lv, config)
      finalImg = imgResult.imagines; finalPcts = imgResult.pcts; finalScore = imgResult.score
    }
    if (config.optModules) {
      const modResult = optimizeModules(localBest.gear, localBest.lt, localBest.lv, finalImg, { ...config, modules: finalModules, imagines: finalImg })
      finalModules = modResult.modules; finalPcts = modResult.pcts; finalScore = modResult.score
    }
    const raidArmorCount = RAID_ARMOR_INDICES.filter(i => localBest!.gear[i]?.raid).length
    const candidate: OptResult = { gear: localBest.gear, lt: localBest.lt, lv: localBest.lv,
      imagines: finalImg, modules: finalModules, score: finalScore, statPcts: finalPcts, raidCount: raidArmorCount }
    if (!globalBest || candidate.score > globalBest.score) globalBest = candidate
  }
  return globalBest!
}

// ═══════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════

let _savedState = {
  mode: "smart" as "smart" | "targets",
  targetLevel: 160,
  raidMode: "auto" as "auto" | "0" | "2" | "4",
  targets: { vers: 0, mast: 50, haste: 20, crit: 20, luck: 5 },
  lockedSlots: Array(11).fill(false) as boolean[],
  optPurple: true,
  optImagines: false,
  optModules: false,
  customWeights: null as Record<string, number> | null,
}

export function OptimizerSection() {
  const {
    build, spec, base, ext, gear, imagines, modules,
    legendaryTypes, legendaryVals,
    setGear, setLegendaryType, setLegendaryVal, setAllImagines, setModules,
    setSection, accentColor,
    selectedTalents, talentAspd, psychoscopeConfig,
  } = useApp()

  const [mode, _setMode] = useState<"smart" | "targets">(() => _savedState.mode)
  const [targetLevel, _setTargetLevel] = useState(() => _savedState.targetLevel)
  const [raidMode, _setRaidMode] = useState<"auto" | "0" | "2" | "4">(() => _savedState.raidMode)
  const [targets, _setTargets] = useState(() => _savedState.targets)
  const [lockedSlots, _setLockedSlots] = useState<boolean[]>(() => _savedState.lockedSlots)
  const [optPurple, _setOptPurple] = useState(() => _savedState.optPurple)
  const [optImagines, _setOptImagines] = useState(() => _savedState.optImagines)
  const [optModules, _setOptModules] = useState(() => _savedState.optModules)
  const [customWeights, _setCustomWeights] = useState<Record<string, number> | null>(() => _savedState.customWeights)
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<OptResult | null>(null)
  const [status, setStatus] = useState("")

  const setMode = (v: "smart" | "targets") => { _setMode(v); _savedState.mode = v }
  const setTargetLevel = (v: number) => { _setTargetLevel(v); _savedState.targetLevel = v }
  const setRaidMode = (v: "auto" | "0" | "2" | "4") => { _setRaidMode(v); _savedState.raidMode = v }
  const setTargets = (upd: typeof targets | ((prev: typeof targets) => typeof targets)) => {
    _setTargets(prev => { const next = typeof upd === "function" ? upd(prev) : upd; _savedState.targets = next; return next })
  }
  const setLockedSlots = (upd: boolean[] | ((prev: boolean[]) => boolean[])) => {
    _setLockedSlots(prev => { const next = typeof upd === "function" ? upd(prev) : upd; _savedState.lockedSlots = next; return next })
  }
  const setOptPurple = (v: boolean) => { _setOptPurple(v); _savedState.optPurple = v }
  const setOptImagines = (v: boolean) => { _setOptImagines(v); _savedState.optImagines = v }
  const setOptModules = (v: boolean) => { _setOptModules(v); _savedState.optModules = v }
  const setCustomWeights = (v: Record<string, number> | null) => { _setCustomWeights(v); _savedState.customWeights = v }

  const className = getClassForSpec(spec)
  const mainStat = className ? GAME_DATA.CLASSES[className].main : "Strength"
  const weights = customWeights ?? SPEC_WEIGHTS[spec] ?? { Versatility: 0.6, Mastery: 1.0, Haste: 1.0, Crit: 1.0, Luck: 1.0 }

  const availableLevels = useMemo(() => {
    const wLevels = getUniqueTierLevels("weapon")
    const aLevels = getUniqueTierLevels("armor")
    return [...new Set([...wLevels, ...aLevels])].sort((a, b) => a - b)
  }, [])

  const currentPcts = useMemo(() => {
    const res = calculateStats(gear, imagines, modules, spec, base, ext, legendaryTypes, legendaryVals,
      { swift: className === "Stormblade" && selectedTalents.includes("swift"), aspd: talentAspd, selectedIds: selectedTalents },
      psychoscopeConfig)
    const pcts: Record<string, number> = {}
    for (const stat of STAT_KEYS) {
      const raw = res.total[stat] ?? 0
      pcts[stat] = getStatPercentCombat(stat, raw) + ((res.ext as Record<string, number>)[STAT_SHORT[stat]] ?? 0)
    }
    return pcts
  }, [gear, imagines, modules, spec, base, ext, legendaryTypes, legendaryVals, selectedTalents, talentAspd, className, psychoscopeConfig])

  const handleOptimize = useCallback(() => {
    setRunning(true); setStatus("Optimizing…"); setResult(null)
    setTimeout(() => {
      try {
        const res = runOptimize({
          spec, build, className, mainStat, targetLevel, raidMode, mode,
          targets, weights, lockedSlots, currentGear: gear, imagines, modules,
          base, ext, legendaryTypes, legendaryVals, selectedTalents, talentAspd,
          optPurple, optImagines, optModules, psychoscopeConfig,
        })
        setResult(res); setStatus("Optimization complete!")
      } catch (e: any) { setStatus(`Error: ${e.message}`) }
      setRunning(false)
    }, 50)
  }, [spec, build, className, mainStat, targetLevel, raidMode, mode, targets, weights, lockedSlots, gear, imagines, modules, base, ext, legendaryTypes, legendaryVals, selectedTalents, talentAspd, optPurple, optImagines, optModules, psychoscopeConfig])

  const applyResult = useCallback(() => {
    if (!result) return
    setGear(result.gear)
    result.lt.forEach((t, i) => setLegendaryType(i, t))
    result.lv.forEach((v, i) => setLegendaryVal(i, v))
    if (optImagines) setAllImagines(result.imagines)
    if (optModules) setModules(result.modules)
    setStatus("Applied to planner!")
    setSection("planner")
  }, [result, setGear, setLegendaryType, setLegendaryVal, setAllImagines, setModules, optImagines, optModules, setSection])

  const toggleLock = useCallback((idx: number) => {
    setLockedSlots(prev => { const next = [...prev]; next[idx] = !next[idx]; return next })
  }, [])

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="text-2xl font-bold tracking-tight text-white mb-1">Gear Optimizer</div>
        <div className="text-[11px] text-[#555] max-w-xl leading-5">
          Smart gear allocation using hill-climbing with multiple restarts against real DR curves.
          Supports per-slot locking, configurable raid sets, and auto stat weights per spec.
        </div>
      </div>

      {/* Mode Toggle */}
      <div className="flex gap-1 mb-5 p-0.5 bg-[#111] border border-[#222] inline-flex">
        {(["smart", "targets"] as const).map(m => (
          <button key={m} onClick={() => setMode(m)}
            className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-[1.5px] transition-all"
            style={{ background: mode === m ? accentColor : "transparent", color: mode === m ? "#000" : "#666" }}>
            {m === "smart" ? "Smart Auto" : "Target %"}
          </button>
        ))}
      </div>

      {/* Settings Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-5">
        <div>
          <label className="block text-[9px] uppercase tracking-[0.8px] text-[#555] mb-1">Target Gear Level</label>
          <select value={targetLevel} onChange={e => setTargetLevel(parseInt(e.target.value))}
            className="w-full text-[12px] px-2 py-1.5 border border-[#222] bg-[#0a0a0a] text-white focus:border-[#444] outline-none">
            {availableLevels.filter(l => l >= 60).map(l => <option key={l} value={l}>Lv{l}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[9px] uppercase tracking-[0.8px] text-[#555] mb-1">Raid Armor Pieces</label>
          <select value={raidMode} onChange={e => setRaidMode(e.target.value as any)}
            className="w-full text-[12px] px-2 py-1.5 border border-[#222] bg-[#0a0a0a] text-white focus:border-[#444] outline-none">
            <option value="auto">Auto (test 0/2/4)</option>
            <option value="0">0 (no raid armor)</option>
            <option value="2">2pc set bonus</option>
            <option value="4">4pc set bonus</option>
          </select>
        </div>
        <div>
          <label className="block text-[9px] uppercase tracking-[0.8px] text-[#555] mb-1">Current Spec</label>
          <div className="text-[12px] px-2 py-1.5 border border-[#222] bg-[#0a0a0a] text-[#888]">
            {spec} ({className ?? "?"}) • {build}
          </div>
        </div>
      </div>

      {/* Mode-specific settings */}
      {mode === "targets" ? (
        <div className="mb-5">
          <div className="text-[10px] uppercase tracking-[0.8px] text-[#555] mb-2">Target Stat Percentages</div>
          <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
            {(["crit", "haste", "luck", "mast", "vers"] as const).map(key => {
              const labels: Record<string, string> = { crit: "Crit %", haste: "Haste %", luck: "Luck %", mast: "Mastery %", vers: "Vers %" }
              return (
                <div key={key}>
                  <label className="block text-[9px] uppercase tracking-[0.8px] text-[#555] mb-1">{labels[key]}</label>
                  <input type="number" value={targets[key] || ""} placeholder="0"
                    onChange={e => setTargets(prev => ({ ...prev, [key]: parseFloat(e.target.value) || 0 }))}
                    className="w-full text-[12px] px-2 py-1.5 border border-[#222] bg-[#0a0a0a] text-white focus:border-[#444] outline-none" />
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="mb-5">
          <div className="text-[10px] uppercase tracking-[0.8px] text-[#555] mb-2">
            Stat Weights for {spec}
            <span className="text-[#444] ml-2">(higher = optimizer values that stat more)</span>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {STAT_KEYS.map(stat => (
              <div key={stat}>
                <label className="block text-[9px] uppercase tracking-[0.8px] text-[#555] mb-1">{stat.slice(0, 4)}</label>
                <input type="number" step="0.1" value={weights[stat] ?? 1.0}
                  onChange={e => setCustomWeights({ ...weights, [stat]: parseFloat(e.target.value) || 0 })}
                  className="w-full text-[12px] px-2 py-1.5 border border-[#222] bg-[#0a0a0a] text-white focus:border-[#444] outline-none text-center" />
              </div>
            ))}
          </div>
          <button onClick={() => setCustomWeights(null)}
            className="mt-1 text-[9px] text-[#555] hover:text-white transition-colors">Reset to defaults</button>
        </div>
      )}

      {/* Slot Locks */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <div className="text-[10px] uppercase tracking-[0.8px] text-[#555]">Slot Locks</div>
          <div className="flex gap-2">
            <button onClick={() => setLockedSlots(Array(11).fill(true))} className="text-[9px] text-[#555] hover:text-white transition-colors">Lock All</button>
            <span className="text-[#333]">|</span>
            <button onClick={() => setLockedSlots(Array(11).fill(false))} className="text-[9px] text-[#555] hover:text-white transition-colors">Unlock All</button>
          </div>
        </div>
        <div className="grid grid-cols-6 md:grid-cols-11 gap-1">
          {GAME_DATA.SLOTS.map((slotName, i) => {
            const locked = lockedSlots[i]
            const short = slotName.replace("Bracelet ", "Br").replace("Earrings", "Ear").replace("Necklace", "Neck")
            return (
              <button key={i} onClick={() => toggleLock(i)}
                className="text-center py-1.5 px-1 text-[8px] uppercase tracking-[0.5px] border transition-all"
                style={{ borderColor: locked ? accentColor : "#222", background: locked ? `${accentColor}15` : "#0a0a0a", color: locked ? accentColor : "#555" }}
                title={`${slotName}${locked ? " (locked)" : ""}`}>
                {locked ? "🔒" : ""} {short}
              </button>
            )
          })}
        </div>
        <div className="text-[9px] text-[#444] mt-1">Locked slots keep their current gear. Click to toggle.</div>
      </div>

      {/* Options */}
      <div className="flex gap-5 flex-wrap mb-5">
        {[
          { val: optPurple, set: setOptPurple, label: "Optimize Purple Stats" },
          { val: optImagines, set: setOptImagines, label: "Optimize Imagines" },
          { val: optModules, set: setOptModules, label: "Optimize Modules" },
        ].map(({ val, set, label }) => (
          <label key={label} className="flex items-center gap-2 cursor-pointer text-[11px] text-[#888]">
            <input type="checkbox" checked={val} onChange={e => set(e.target.checked)} style={{ accentColor }} />
            {label}
          </label>
        ))}
      </div>

      {/* Active Configuration Summary */}
      <div className="mb-5 border border-[#1a1a1a] bg-[#080808] p-3">
        <div className="text-[10px] uppercase tracking-[0.8px] text-[#555] mb-2">Active Configuration</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Psychoscope */}
          <div>
            <div className="text-[9px] uppercase tracking-[0.5px] text-[#444] mb-1">Psychoscope</div>
            {psychoscopeConfig.enabled && psychoscopeConfig.projectionId ? (
              <div className="text-[10px] text-[#888]">
                <span className="text-[#aaa]">{MIND_PROJECTIONS.find(p => p.id === psychoscopeConfig.projectionId)?.name ?? psychoscopeConfig.projectionId}</span>
                {psychoscopeConfig.bondLevel > 0 && <span className="text-[#666]"> · Bond Lv{psychoscopeConfig.bondLevel}</span>}
              </div>
            ) : (
              <div className="text-[10px] text-[#444] italic">None configured</div>
            )}
          </div>

          {/* Modules */}
          <div>
            <div className="text-[9px] uppercase tracking-[0.5px] text-[#444] mb-1">Modules</div>
            {(() => {
              const activeAffixes = new Set<string>()
              modules.forEach(m => { if (m.a1) activeAffixes.add(m.a1); if (m.a2) activeAffixes.add(m.a2); if (m.a3) activeAffixes.add(m.a3) })
              if (activeAffixes.size === 0) return <div className="text-[10px] text-[#444] italic">None configured</div>
              return <div className="text-[10px] text-[#888]">{[...activeAffixes].join(", ")}</div>
            })()}
          </div>

          {/* Talents */}
          <div>
            <div className="text-[9px] uppercase tracking-[0.5px] text-[#444] mb-1">Talents</div>
            {selectedTalents.length > 0 && className ? (
              <div className="text-[10px] text-[#888]">
                {selectedTalents.length} selected
                {talentAspd > 0 && <span className="text-[#666]"> · ASPD +{talentAspd}%</span>}
              </div>
            ) : (
              <div className="text-[10px] text-[#444] italic">None selected</div>
            )}
          </div>
        </div>
        <div className="text-[8px] text-[#333] mt-2">
          These are factored into the optimizer scoring. Configure them in their respective sections.
        </div>
      </div>

      {/* Run Button */}
      <button onClick={handleOptimize} disabled={running}
        className="w-full py-3 text-[12px] font-bold uppercase tracking-[1.5px] transition-all mb-4"
        style={{ background: accentColor, color: "#000", opacity: running ? 0.6 : 1 }}>
        {running ? "⏳ Optimizing…" : "⚡ Optimize Gear"}
      </button>

      {status && <div className="text-center text-[11px] font-semibold mb-4" style={{ color: accentColor }}>{status}</div>}

      {/* Results Preview */}
      {result && !running && (
        <div className="border border-[#222] bg-[#0a0a0a] p-4 mb-4">
          <div className="text-[11px] font-bold uppercase tracking-[1px] text-white mb-3">
            Result Preview
            {result.raidCount > 0 && <span className="text-[#888] font-normal ml-2">• Raid weapon + {result.raidCount}pc armor</span>}
          </div>

          {/* Stat comparison */}
          <div className="grid grid-cols-5 gap-x-3 gap-y-1 mb-4">
            {STAT_KEYS.map(stat => {
              const before = currentPcts[stat] ?? 0
              const after = result.statPcts[stat] ?? 0
              const diff = after - before
              const diffColor = diff > 0.1 ? "#4ade80" : diff < -0.1 ? "#ef4444" : "#666"
              return (
                <div key={stat} className="text-center">
                  <div className="text-[8px] uppercase tracking-[0.5px] text-[#555] mb-0.5">{stat}</div>
                  <div className="text-[13px] font-bold text-white">{after.toFixed(1)}%</div>
                  {Math.abs(diff) >= 0.01 && (
                    <div className="text-[9px] font-semibold" style={{ color: diffColor }}>
                      {diff > 0 ? "+" : ""}{diff.toFixed(1)}%
                    </div>
                  )}
                  <div className="text-[8px] text-[#444]">was {before.toFixed(1)}%</div>
                </div>
              )
            })}
          </div>

          {/* Gear layout */}
          <div className="mb-4">
            <div className="text-[9px] uppercase tracking-[0.5px] text-[#555] mb-1">Gear Layout</div>
            <div className="grid grid-cols-1 gap-0.5">
              {result.gear.map((g, i) => {
                const locked = lockedSlots[i]
                const slotName = GAME_DATA.SLOTS[i]
                const purpleStr = result.lt[i] && result.lt[i] !== "-" ? ` ▫ ${result.lt[i]} ${result.lv[i]}` : ""
                return (
                  <div key={i} className="flex items-center gap-2 text-[10px] py-0.5 px-2"
                    style={{ color: locked ? "#555" : g.raid ? "#c084fc" : "#888" }}>
                    <span className="w-[80px] text-[#555] truncate">{slotName}</span>
                    <span className="text-[9px] text-[#444] w-[70px]">{g.tier}</span>
                    {locked ? <span className="text-[#444]">🔒 kept</span> : (
                      <>
                        <span className={g.raid ? "text-purple-400" : "text-amber-500"}>{g.raid ? "Raid" : "Gold"}</span>
                        <span className="text-white">{g.p}</span>
                        <span className="text-[#666]">/</span>
                        <span className="text-[#aaa]">{g.s}</span>
                        {g.r && g.r !== "-" && <><span className="text-[#666]">/</span><span className="text-[#777]">{g.r}</span></>}
                        {purpleStr && <span className="text-purple-300 text-[9px]">{purpleStr}</span>}
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Module layout (when module optimization is enabled) */}
          {optModules && (() => {
            const affixSet = new Set<string>()
            result.modules.forEach(m => { if (m.a1) affixSet.add(m.a1); if (m.a2) affixSet.add(m.a2); if (m.a3) affixSet.add(m.a3) })
            if (affixSet.size === 0) return null
            return (
              <div className="mb-4">
                <div className="text-[9px] uppercase tracking-[0.5px] text-[#555] mb-1">Optimized Modules</div>
                <div className="flex flex-wrap gap-1.5">
                  {[...affixSet].map(affix => {
                    const mod = MODULE_DB.find(m => m.name === affix)
                    return (
                      <span key={affix} className="text-[10px] px-2 py-0.5 border border-[#333] bg-[#111] text-[#aaa]">
                        {affix}{mod ? ` (${mod.cat})` : ""}
                      </span>
                    )
                  })}
                </div>
                <div className="text-[8px] text-[#444] mt-1">4 modules × 3 affixes, all at max level (10)</div>
              </div>
            )
          })()}

          {/* Actions */}
          <div className="flex gap-2">
            <button onClick={applyResult} className="flex-1 py-2.5 text-[11px] font-bold uppercase tracking-[1.5px]"
              style={{ background: accentColor, color: "#000" }}>✓ Apply to Planner</button>
            <button onClick={() => { setResult(null); setStatus("") }}
              className="px-6 py-2.5 text-[11px] font-bold uppercase tracking-[1.5px] border border-[#333] text-[#888] hover:text-white transition-colors">
              Discard</button>
          </div>
        </div>
      )}

      {/* Info */}
      <div className="text-[9px] text-[#444] leading-4 mt-4">
        <strong className="text-[#555]">How it works:</strong>{" "}
        {mode === "smart" ? (
          <>Smart mode uses a weighted multiplicative scoring function that naturally accounts for diminishing returns.
            Higher weights prioritize that stat. Tests {raidMode === "auto" ? "0/2/4pc raid configurations" : `${raidMode}pc raid`} with
            5 restarts × 800 hill-climbing iterations each.</>
        ) : (
          <>Target mode minimizes distance to your percentages using quadratic penalties.
            Tests {raidMode === "auto" ? "all raid configurations" : `${raidMode}pc raid`} with the real DR curves.</>
        )}
      </div>
    </div>
  )
}
