import type { StatsResult } from "@/lib/app-context"

export interface SkillDef {
    name: string
    cd: number
    castTime: number
    mv: number
    flat: number
    hits: number
    element: "Thunder" | "Physical" | "None"
    type: "Expertise" | "Special" | "Basic" | "Ultimate" | "Imagine" | "Buff"
    scalesWithAspd?: boolean
    grantsBladeIntent?: number
    consumesBladeIntent?: number
    consumesSigils?: number
    grantsSigils?: number
    grantsChargeSeeds?: number
}

export interface RotationItem {
    key: string
    repeat: number
}

export interface MoonstrikeCalibration {
    version: string
    source: string
    confidence: string
    notes: string[]
    coefficients: {
        moonbladeHit: { mv: number; flat: number; interval: number; baseCount: number }
        moonbladeWhirl: { mv: number; flat: number }
        lightningStrike: { mv: number; flat: number }
        thunderstrike: { mv: number; flat: number; procRateFromLucky: number }
        stormScythe: { mv: number; flat: number }
        fantasiaImpact: { mv: number; flat: number; icd: number }
        tachiLuckyStrike: { mv: number; flat: number }
    }
}

export interface MoonstrikeCombatStats {
    versPct: number
    mastPct: number
    critRate: number
    luckRate: number
    hastePct: number
    aspd: number
    critMult: number
    luckMult: number
    avgCritLuck: number
    dmgBoss: number
    meleeDmg: number
    weaponAtkPct: number
    physDmgPct: number
    dmgStackPct: number
    raid2pc: StatsResult["raid2pcBonus"]
    raid4pc: StatsResult["raid4pcBonus"]
    psyEffects: StatsResult["psychoscopeEffects"]
}

export interface MoonstrikeSimPoint {
    time: number
    damage: number
    dps: number
    skill: string
    hit: number
}

export interface MoonstrikeTimelinePoint {
    time: number
    skill: string
    damage: number
    y: number
    type: string
}

export interface MoonstrikeBreakdownRow {
    name: string
    damage: number
    pct: number
    casts: number
    dps: number
    color: string
}

export interface MoonstrikeRotationStats {
    tcCasts: number
    msCasts: number
    lsCasts: number
    cbCasts: number
    dsCasts: number
    swCasts: number
    sfUptime: number
    vsUptime: number
}

export interface MoonstrikeSimResult {
    data: MoonstrikeSimPoint[]
    log: string[]
    breakdown: MoonstrikeBreakdownRow[]
    effAtk: number
    finalDmg: number
    finalDps: number
    actualAspd: number
    timelineData: MoonstrikeTimelinePoint[]
    skillOrder: string[]
    rotStats: MoonstrikeRotationStats
}

export interface MoonstrikeSimulationConfig {
    combat: MoonstrikeCombatStats
    statsResult: StatsResult | null
    manualAtk: number
    manualAspd: number
    fightDuration: number
    selectedTalents: string[]
    useCustomRotation: boolean
    rotation: RotationItem[]
    skills: Record<string, SkillDef>
    skillColors: Record<string, string>
    calibration: MoonstrikeCalibration
}