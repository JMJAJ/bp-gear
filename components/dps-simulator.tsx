"use client"
import { useState, useMemo, useRef, useCallback, DragEvent } from "react"
import { useApp, getStatPercent, getStatPercentCombat, getClassForSpec, calculateStatsFromGearSet, type GearSet, type StatsResult } from "@/lib/app-context"
import { XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, Line, LineChart, BarChart, Bar, Cell, ScatterChart, Scatter, ZAxis } from "recharts"
import { Check } from "lucide-react"

// ═══════════════════════════════════════════════════════════
// SKILL DATA — Real motion values from Lv.30/30 in-game tooltips
// Stormblade Moonstrike spec
// Damage formula: ATK × (mv / 100) + flat
// ═══════════════════════════════════════════════════════════

interface SkillDef {
    name: string
    cd: number           // cooldown in seconds (0 = no CD)
    castTime: number     // base animation time in seconds
    mv: number           // motion value as total % of ATK
    flat: number         // flat damage added on top
    hits: number         // number of individual hits per cast
    element: "Thunder" | "Physical" | "None"
    type: "Expertise" | "Special" | "Basic" | "Ultimate" | "Imagine" | "Buff"
    scalesWithAspd?: boolean
    grantsBladeIntent?: number
    consumesBladeIntent?: number
    consumesSigils?: number
    grantsSigils?: number
    grantsChargeSeeds?: number
}

const MS_SKILLS: Record<string, SkillDef> = {
    // ── Ultimate ──
    // 904.4% ATK +2600, CD 60s. Grants max Thunder Sigils.
    OblivionCombo: {
        name: "Oblivion Combo", cd: 60, castTime: 3.5, mv: 904.4, flat: 2600, hits: 7,
        element: "Thunder", type: "Ultimate", grantsSigils: 4,
    },

    // ── Volt Surge: BUFF, not a damage skill ──
    // ATK bonus: 10% +80, Duration: 12s, CD: 45s
    // While active, any action granting Thunder Sigils instantly maxes them.
    VoltSurge: {
        name: "Volt Surge", cd: 45, castTime: 0.3, mv: 0, flat: 0, hits: 0,
        element: "None", type: "Buff",
    },

    // ── Stormflash ──
    // Activates a state: 20 Blade Intent per second for 10s.
    // During Stormflash, Expertise Skills consuming Blade Intent trigger Lightning Strike.
    // Lightning Strike: 224% ATK +640. CD: 45s
    Stormflash: {
        name: "Stormflash", cd: 45, castTime: 0.5, mv: 0, flat: 0, hits: 0,
        element: "Thunder", type: "Expertise",
    },

    // ── Scythe Wheel ──
    // Skill Damage: 420% ATK +1200. Summons Moonblades for 35s.
    // Moonblade Direct Damage: 70% ATK +200
    // Trigger Whirl Damage: 210% ATK +600 (triggered per moonblade when Moonstrike is cast)
    // CD: 30s
    ScytheWheel: {
        name: "Scythe Wheel", cd: 30, castTime: 1.2, mv: 420, flat: 1200, hits: 3,
        element: "Thunder", type: "Expertise", grantsBladeIntent: 3,
    },

    // ── Imagine 1: Blackfire Foxen — Stunt! Kinetic Strike ──
    // 1312.4% ATK/MATK +74, Mastery +13% for 20s, CD: 80s, Passive: Mastery +5040
    Imagine1: {
        name: "Blackfire Foxen", cd: 80, castTime: 1.0, mv: 1312.4, flat: 74, hits: 3,
        element: "Physical", type: "Imagine",
    },

    // ── Imagine 2: Emerald Caprahorn — Stunt! Twin Fangs ──
    // 1143.74% ATK/MATK +74, Haste +13% for 20s, CD: 80s, Passive: Haste +5040
    Imagine2: {
        name: "Emerald Caprahorn", cd: 80, castTime: 1.0, mv: 1143.74, flat: 74, hits: 2,
        element: "Physical", type: "Imagine",
    },

    // ── Thundercut (Expertise) ──
    // 210% ATK +600. Consumes 50 Blade Intent.
    // At ASPD ≥25%/50%/80% gains 1/2/3 additional attacks.
    // Can be recast if Blade Intent remains.
    Thundercut: {
        name: "Thundercut", cd: 0, castTime: 0.55, mv: 210, flat: 600, hits: 2,
        element: "Thunder", type: "Expertise", consumesBladeIntent: 50, scalesWithAspd: true,
    },

    // ── Thundercleave (enhanced Thundercut after 5 consecutive casts — talent) ──
    // Deals higher DMG (estimated ~1.8× Thundercut)
    Thundercleave: {
        name: "Thundercleave", cd: 0, castTime: 0.7, mv: 380, flat: 1080, hits: 3,
        element: "Thunder", type: "Expertise", consumesBladeIntent: 50, scalesWithAspd: true,
    },

    // ── Moonstrike (Special Attack) ──
    // 140% ATK +400. Consumes 3 Thunder Sigils.
    // Commands Moonblades to perform whirling attacks.
    Moonstrike: {
        name: "Moonstrike", cd: 0, castTime: 0.65, mv: 140, flat: 400, hits: 1,
        element: "Thunder", type: "Special", consumesSigils: 3, scalesWithAspd: true,
    },

    // ── Chaos Breaker (enhanced Moonstrike during Stormflash — talent) ──
    ChaosBreaker: {
        name: "Chaos Breaker", cd: 10, castTime: 0.8, mv: 350, flat: 1000, hits: 2,
        element: "Thunder", type: "Expertise", grantsBladeIntent: 40, consumesSigils: 3, grantsChargeSeeds: 2,
    },

    // ── Divine Sickle (proc from Storm Scythe count — talent) ──
    // Guaranteed crit. Talent multiplier at Luck ≥28% = 2.0×, ≥45% = 3.0×
    DivineSickle: {
        name: "Divine Sickle", cd: 0, castTime: 0.8, mv: 2200, flat: 3000, hits: 1,
        element: "Thunder", type: "Expertise",
    },

    // ── Overdrive ──
    // Grants 1 Thunder Sigil. CD: 40s
    Overdrive: {
        name: "Overdrive", cd: 40, castTime: 0.3, mv: 0, flat: 0, hits: 0,
        element: "None", type: "Expertise", grantsSigils: 1,
    },

    // ── Piercing Slash (proc from talent: 10% on basic attack hit, 1s ICD) ──
    PiercingSlash: {
        name: "Piercing Slash", cd: 1.0, castTime: 0.3, mv: 140, flat: 400, hits: 2,
        element: "Thunder", type: "Special", grantsSigils: 1,
    },

    // ── Basic Attack: Judgment Cut / Swift Justice ──
    // 4-strike chain: 44.8% +126, 72.78% +208, 79.8% +226, 96.6% +277
    // Total: ~294% ATK +837
    BasicAttack: {
        name: "Basic Attack", cd: 0, castTime: 1.8, mv: 294, flat: 837, hits: 4,
        element: "Thunder", type: "Basic", scalesWithAspd: true, grantsBladeIntent: 4,
    },
}

// ── Moonblade constants (from Scythe Wheel tooltip) ──
// Moonblades spin for 35s, dealing Attack Damage every 2s
// Moonblade Direct Damage: 70% ATK +200 per moonblade
const MB_MV = 70            // % ATK per moonblade hit
const MB_FLAT = 200         // flat per moonblade hit
const MB_INTERVAL = 2.0     // seconds between moonblade auto-hits (from tooltip)
const MB_BASE_COUNT = 3     // default active moonblades

// Moonstrike Whirl Damage per moonblade: 210% ATK +600
const MW_MV = 210
const MW_FLAT = 600

// Lightning Strike (triggered during Stormflash when Thundercut consumes BI)
// 224% ATK +640
const LS_MV = 224
const LS_FLAT = 640

// Thunderstrike proc stats (talent: Touch of Thunder Soul)
// Reverse-engineered: 86 hits × 8.65K avg in parse → ~150% ATK +400 base
const TS_MV = 150
const TS_FLAT = 400

// Storm Scythe proc (talent: triggered on Thundercut/Thundercleave casts)
// Reverse-engineered from parse: ~450% ATK +1400 per proc, ~26K per hit at 3279 ATK
const SS_MV = 450
const SS_FLAT = 1400

// Fantasia Impact (periodic proc — module/imagine/set bonus)
// Reverse-engineered: 11 hits × 121K avg in parse, ~8s ICD, can't crit/luck
// Base ≈ 2800% ATK +1000 (93.6K at 3279 ATK × mastery = ~121K)
const FI_MV = 2800
const FI_FLAT = 1000
const FI_ICD = 8.0 // seconds between procs

// Lucky Strike (Tachi) — weapon type bonus on every lucky strike
// Reverse-engineered: 422 procs × 3.72K avg → ~100% ATK +440
const TACHI_MV = 100
const TACHI_FLAT = 440

const SKILL_COLORS: Record<string, string> = {
    "Oblivion Combo": "#f59e0b", "Volt Surge": "#8b5cf6", "Stormflash": "#06b6d4",
    "Scythe Wheel": "#ef4444", "Lightning Strike": "#38bdf8",
    "Piercing Slash": "#a855f7", "Blackfire Foxen": "#f97316", "Emerald Caprahorn": "#fb923c",
    "Thundercut": "#22c55e", "Thundercleave": "#16a34a", "Moonstrike": "#eab308",
    "Chaos Breaker": "#ec4899", "Divine Sickle": "#e11d48", "Moonblades": "#a78bfa",
    "Moonblade Whirl": "#c084fc", "Thunderstrike": "#fbbf24", "Overdrive": "#94a3b8",
    "Basic Attack": "#6b7280", "Storm Scythe": "#dc2626",
    "Fantasia Impact": "#d946ef", "Lucky Strike (Tachi)": "#fcd34d",
}

// Skill type badges (text-based, no emojis)
const SKILL_TYPE_BADGE: Record<string, string> = {
    OblivionCombo: "ULT", VoltSurge: "BUF", Stormflash: "BUF",
    ScytheWheel: "EXP", Imagine1: "IMG", Imagine2: "IMG",
    Thundercut: "EXP", Thundercleave: "EXP", Moonstrike: "SPC",
    ChaosBreaker: "EXP", Overdrive: "EXP", DivineSickle: "PRC",
}

// Skills available for drag-and-drop rotation building
const ROTATION_SKILLS = [
    "OblivionCombo", "VoltSurge", "Stormflash", "ScytheWheel",
    "Imagine1", "Imagine2", "Overdrive",
    "Thundercut", "Moonstrike", "ChaosBreaker", "DivineSickle", "BasicAttack"
] as const

// Rotation item: skill key + repeat count
interface RotationItem { key: string; repeat: number }

// Default optimal rotation (priority order) - based on 90s recording
const DEFAULT_ROTATION: RotationItem[] = [
    // Opening buffs
    { key: "Imagine1", repeat: 1 },      // Blackfire Foxen (t=0.00s)
    { key: "Imagine2", repeat: 1 },      // Emerald Caprahorn (t=0.58s)
    { key: "Stormflash", repeat: 1 },    // Blade Intent buff (t=1.26s)
    { key: "VoltSurge", repeat: 1 },     // ATK buff (t=1.86s)
    { key: "ScytheWheel", repeat: 1 },   // (t=2.61s)
    // Phase 1: Thundercut spam with Moonstrike
    { key: "Thundercut", repeat: 17 },   // (t=3.66s - 6.32s)
    { key: "DivineSickle", repeat: 1 },   // (t=6.35s)
    { key: "Thundercut", repeat: 43 },   // (t=7.29s - 14.10s)
    { key: "DivineSickle", repeat: 1 },   // (t=14.15s)
    { key: "Thundercut", repeat: 25 },   // (t=15.31s - 19.53s)
    { key: "Moonstrike", repeat: 1 },    // (t=19.53s)
    { key: "Thundercut", repeat: 4 },    // (t=20.02s - 20.60s)
    { key: "Moonstrike", repeat: 1 },    // (t=20.88s)
    { key: "Thundercut", repeat: 15 },   // (t=21.30s - 24.13s)
    { key: "Moonstrike", repeat: 3 },    // (t=24.13s - 24.73s)
    { key: "Thundercut", repeat: 22 },   // (t=24.90s - 28.78s)
    { key: "Moonstrike", repeat: 1 },    // (t=28.78s)
    { key: "DivineSickle", repeat: 1 },  // (t=29.39s)
    { key: "Thundercut", repeat: 19 },   // (t=30.56s - 34.12s)
    // Refresh ScytheWheel
    { key: "ScytheWheel", repeat: 1 },   // (t=34.12s)
    { key: "Thundercut", repeat: 1 },    // (t=36.02s)
    // Refresh Stormflash
    { key: "Stormflash", repeat: 1 },    // (t=36.54s)
    { key: "Moonstrike", repeat: 1 },    // (t=37.38s)
    { key: "Thundercut", repeat: 8 },    // (t=37.82s - 39.15s)
    { key: "Moonstrike", repeat: 1 },    // (t=39.15s)
    { key: "Thundercut", repeat: 19 },   // (t=39.57s - 43.05s)
    { key: "DivineSickle", repeat: 1 },   // (t=43.05s)
    { key: "Thundercut", repeat: 32 },   // (t=44.07s - 50.29s)
    { key: "DivineSickle", repeat: 1 },   // (t=50.29s)
    // Refresh VoltSurge
    { key: "VoltSurge", repeat: 1 },     // (t=51.48s)
    { key: "Moonstrike", repeat: 4 },    // (t=52.20s - 52.65s)
    { key: "Thundercut", repeat: 34 },   // (t=52.85s - 59.40s)
    { key: "Moonstrike", repeat: 16 },   // (t=59.40s - 62.18s) - heavy moonstrike phase
    { key: "Thundercut", repeat: 13 },   // (t=62.60s - 65.22s)
    // Refresh ScytheWheel
    { key: "ScytheWheel", repeat: 1 },   // (t=65.22s)
    { key: "Thundercut", repeat: 7 },    // (t=65.85s - 67.70s)
    // Oblivion Combo (ultimate)
    { key: "OblivionCombo", repeat: 1 }, // (t=67.70s)
    { key: "Moonstrike", repeat: 3 },    // (t=70.50s - 71.63s)
    { key: "Thundercut", repeat: 6 },    // (t=72.45s - 73.54s)
    // Refresh Stormflash
    { key: "Stormflash", repeat: 1 },    // (t=73.63s)
    { key: "Moonstrike", repeat: 3 },    // (t=74.62s - 74.98s)
    { key: "Thundercut", repeat: 20 },   // (t=75.10s - 78.43s)
    { key: "DivineSickle", repeat: 1 },   // (t=78.43s)
    { key: "Thundercut", repeat: 37 },   // (t=79.37s - 86.04s)
    { key: "DivineSickle", repeat: 1 },   // (t=86.04s)
    { key: "Thundercut", repeat: 17 },   // (t=86.87s - 89.94s)
]

// ═══════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════

export function DpsSimulator() {
    const { accentColor, stats, spec, selectedTalents, imagines } = useApp()

    // Dynamic Imagine names from planner
    const im1Name = imagines[0]?.key ? imagines[0].key.replace(/ \(.*\)$/, "") : "Blackfire Foxen"
    const im2Name = imagines[1]?.key ? imagines[1].key.replace(/ \(.*\)$/, "") : "Emerald Caprahorn"

    // Build a version of MS_SKILLS with dynamic imagine names
    const skills = useMemo(() => {
        const s = { ...MS_SKILLS }
        s.Imagine1 = { ...s.Imagine1, name: im1Name }
        s.Imagine2 = { ...s.Imagine2, name: im2Name }
        return s
    }, [im1Name, im2Name])

    // User-configurable inputs
    const [manualAtk, setManualAtk] = useState(3738)
    const [manualAspd, setManualAspd] = useState(0) // 0 = use planner value, >0 = override (e.g. 89 for 89%)
    const [fightDuration, setFightDuration] = useState(90)
    const [activeTab, setActiveTab] = useState<"chart" | "breakdown" | "log" | "timeline">("chart")

    // Rotation builder state
    const [rotation, setRotation] = useState<RotationItem[]>(DEFAULT_ROTATION.map(r => ({ ...r })))
    const [useCustomRotation, setUseCustomRotation] = useState(true)
    const [dragOverIdx, setDragOverIdx] = useState<number | null>(null)
    const dragItemRef = useRef<{ key: string; fromIdx?: number } | null>(null)

    // Comparison mode state
    const [compareMode, setCompareMode] = useState(false)
    const [selectedSetIds, setSelectedSetIds] = useState<string[]>([])
    const { gearSets, base, ext, psychoscopeConfig } = useApp()

    // Drag handlers
    const onDragStartPalette = useCallback((e: DragEvent<HTMLDivElement>, key: string) => {
        dragItemRef.current = { key }
        e.dataTransfer.effectAllowed = "copy"
        e.dataTransfer.setData("text/plain", key)
    }, [])

    const onDragStartRotation = useCallback((e: DragEvent<HTMLDivElement>, idx: number) => {
        dragItemRef.current = { key: rotation[idx].key, fromIdx: idx }
        e.dataTransfer.effectAllowed = "move"
        e.dataTransfer.setData("text/plain", rotation[idx].key)
    }, [rotation])

    const onDragOver = useCallback((e: DragEvent<HTMLDivElement>, idx: number) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = dragItemRef.current?.fromIdx !== undefined ? "move" : "copy"
        setDragOverIdx(idx)
    }, [])

    const onDrop = useCallback((e: DragEvent<HTMLDivElement>, idx: number) => {
        e.preventDefault()
        setDragOverIdx(null)
        const item = dragItemRef.current
        if (!item) return
        setRotation(prev => {
            const next = [...prev]
            if (item.fromIdx !== undefined) {
                // Reorder within rotation
                const moved = next.splice(item.fromIdx, 1)[0]
                const insertAt = item.fromIdx < idx ? idx - 1 : idx
                next.splice(insertAt, 0, moved)
            } else {
                // Insert from palette
                next.splice(idx, 0, { key: item.key, repeat: 1 })
            }
            return next
        })
        dragItemRef.current = null
    }, [])

    const onDropEnd = useCallback((e: DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        setDragOverIdx(null)
        const item = dragItemRef.current
        if (!item) return
        if (item.fromIdx !== undefined) return // reorder handled by onDrop
        setRotation(prev => [...prev, { key: item.key, repeat: 1 }])
        dragItemRef.current = null
    }, [])

    const removeFromRotation = useCallback((idx: number) => {
        setRotation(prev => prev.filter((_, i) => i !== idx))
    }, [])

    const setRepeat = useCallback((idx: number, repeat: number) => {
        setRotation(prev => prev.map((r, i) => i === idx ? { ...r, repeat: Math.max(1, Math.min(99, repeat)) } : r))
    }, [])

    const isMoonstrike = spec === "Moonstrike"
    const className = getClassForSpec(spec)

    // ── Derived combat stats from the gear planner ──
    const combat = useMemo(() => {
        if (!stats) return null
        // Use combat-accurate percentages that include base values
        // (Mastery +6% base, Crit +5% base, Luck +5% base)
        const versPct = getStatPercentCombat("Versatility", stats.total.Versatility) / 100
        const mastPct = getStatPercentCombat("Mastery", stats.total.Mastery) / 100
        // Include purple stat % bonuses (Crit%, Luck% from gear legendaries, talents, psychoscope bond)
        const critRate = Math.min((getStatPercentCombat("Crit", stats.total.Crit) + (stats.purpleStats?.["Crit (%)"] ?? 0)) / 100, 1)
        const luckRate = Math.min((getStatPercentCombat("Luck", stats.total.Luck) + (stats.purpleStats?.["Luck (%)"] ?? 0)) / 100, 1)
        const hastePct = getStatPercentCombat("Haste", stats.total.Haste)
        const aspd = stats.aspd / 100

        const baseCritDmg = 0.50
        const bonusCritDmg = (stats.extraStats?.["Crit DMG (%)"] ?? 0) / 100
        const critMult = 1 + baseCritDmg + bonusCritDmg

        const baseLuckDmg = 0.30
        const bonusLuckDmg = (stats.extraStats?.["Lucky Strike DMG Multiplier (%)"] ?? 0) / 100
        const luckMult = 1 + baseLuckDmg + bonusLuckDmg

        const dmgBoss = (stats.purpleStats?.["DMG Bonus vs Bosses (%)"] ?? 0) / 100
        const meleeDmg = (stats.purpleStats?.["Melee Damage Bonus (%)"] ?? 0) / 100
        const weaponAtkPct = isMoonstrike ? 0.04 : 0 // Moonstrike raid weapon combat buff: ATK +4%

        // Module damage bonuses (tracked in moduleStats but need to be applied in sim)
        // Physical DMG = ATK-based damage type, applies to ALL Stormblade skills (they are melee ATK-based)
        const physDmgPct = (stats.moduleStats?.["Physical DMG (%)"] ?? 0) / 100
        const dmgPerStack = stats.moduleStats?.["DMG (%) / stack"] ?? 0
        // DMG Stack: estimate ~4 stacks average in sustained combat
        const dmgStackPct = dmgPerStack > 0 ? (dmgPerStack * 4) / 100 : 0

        // Average crit/luck multiplier (independent procs):
        // avg = (1-c)(1-l) + c(1-l)*Cm + (1-c)*l*Lm + c*l*Cm*Lm
        const avgCritLuck =
            (1 - critRate) * (1 - luckRate) * 1.0 +
            critRate * (1 - luckRate) * critMult +
            (1 - critRate) * luckRate * luckMult +
            critRate * luckRate * critMult * luckMult

        return {
            versPct, mastPct, critRate, luckRate, hastePct, aspd,
            critMult, luckMult, avgCritLuck,
            dmgBoss, meleeDmg, weaponAtkPct,
            physDmgPct, dmgStackPct,
            raid2pc: stats.raid2pcBonus, raid4pc: stats.raid4pcBonus,
            // Psychoscope effects
            psyEffects: stats.psychoscopeEffects,
        }
    }, [stats, isMoonstrike])

    // ── Simulation ──
    const sim = useMemo(() => {
        if (!combat || !isMoonstrike) return null
        const {
            versPct, mastPct, critRate, luckRate, hastePct, aspd, avgCritLuck,
            dmgBoss, meleeDmg, weaponAtkPct,
            critMult, luckMult, physDmgPct, dmgStackPct,
            raid2pc, raid4pc, psyEffects,
        } = combat

        // ── Attack Speed: use manual override if provided, else planner value ──
        const actualAspd = manualAspd > 0 ? manualAspd / 100 : aspd

        // Effective ATK: user enters their in-game character sheet ATK which already includes
        // module ATK, agility conversion, and purple ATK% bonuses.
        // Only apply weapon combat buff ATK% (not shown on character sheet).
        let effAtk = manualAtk * (1 + weaponAtkPct)

        // Psychoscope: ATK from stat scaling (e.g., Stormblade X6: Each 1% Crit → 0.5% ATK)
        // This is a persistent passive, applied as additional ATK multiplier
        const psyAtkFromStatPct = psyEffects?.atkFromStat && psyEffects.atkFromStat.target !== "CritDMG"
            ? getStatPercentCombat(psyEffects.atkFromStat.stat, stats?.total[psyEffects.atkFromStat.stat] ?? 0) * psyEffects.atkFromStat.ratio / 100
            : 0
        effAtk *= (1 + psyAtkFromStatPct)

        // Psychoscope DPS bonuses (as decimals for multiplicative application)
        const psyDreamDmg = (psyEffects?.dreamDmgPct ?? 0) / 100
        const psySpecialDmg = (psyEffects?.specialDmgPct ?? 0) / 100
        const psyExpertiseDmg = (psyEffects?.expertiseDmgPct ?? 0) / 100
        const psyConditionalAtkPct = (psyEffects?.conditionalAtkPct ?? 0) / 100
        const psyConditionalElementDmg = (psyEffects?.conditionalElementDmg ?? 0) / 100
        const psySkillDmg = psyEffects?.skillDmg ?? {}
        const psyAllElementFlat = psyEffects?.allElementFlat ?? 0

        // Talent flags
        const t = {
            thunderCurse: selectedTalents?.includes("thunder_curse"),
            chaosBreaker: selectedTalents?.includes("chaos_breaker"),
            moonstrikDelay: selectedTalents?.includes("moonstrike_delay"),
            divineSickle: selectedTalents?.includes("divine_sickle"),
            phantomScytheI: selectedTalents?.includes("phantom_scythe_realm_i"),
            phantomScytheII: selectedTalents?.includes("phantom_scythe_realm_ii"),
            bladeIntentRare: selectedTalents?.includes("blade_intent_rare"),
            thunderRuneMastery: selectedTalents?.includes("thunder_rune_mastery"),
            thunderMight2: selectedTalents?.includes("thunder_might_2"),
            touchOfThunderSoul: selectedTalents?.includes("touch_of_thunder_soul"),
            enhancedThunderstrike: selectedTalents?.includes("enhanced_thunderstrike"),
            overdriveRefinement: selectedTalents?.includes("overdrive_refinement"),
            thunderSeed: selectedTalents?.includes("thunder_seed"),
            vacuumSlash: selectedTalents?.includes("vacuum_slash"),
            iaiThunderDance: selectedTalents?.includes("iai_thunder_dance"),
            bladeIntent: selectedTalents?.includes("blade_intent"),
            bladeIntentRecovery: selectedTalents?.includes("blade_intent_recovery"),
        }

        // Resource caps
        let maxBi = 100
        if (t.bladeIntentRare) maxBi += 75
        if (t.moonstrikDelay) maxBi += 25
        if (t.thunderRuneMastery) maxBi *= 2
        let maxSigils = 4 // base, +1 per Thunder Sigil Charm talent
        let moonbladeCount = MB_BASE_COUNT
        if (t.phantomScytheI) moonbladeCount += 1

        // Thundercut extra attacks from Attack Speed breakpoints
        // At ASPD ≥25%/50%/80% → 1/2/3 additional full attack repetitions
        // Each "additional attack" repeats the full skill (210%+600 per attack)
        // Note: computed dynamically since Imagine 2 buff adds 13% haste
        const getTcBonusAttacks = () => {
            const effAspd = actualAspd + (im2Timer > 0 ? 0.13 : 0)
            if (effAspd >= 0.80) return 3
            if (effAspd >= 0.50) return 2
            if (effAspd >= 0.25) return 1
            return 0
        }

        // Divine Sickle trigger count based on Luck
        let dsTrigger = 7
        let dsDmgMult = 1.0
        if (t.divineSickle) {
            const lPct = luckRate * 100
            if (lPct >= 45) { dsTrigger = 21; dsDmgMult = 3.0 }
            else if (lPct >= 28) { dsTrigger = 14; dsDmgMult = 2.0 }
        }

        // ── Damage Helpers ──
        // Formula: (ATK × mv% + flat) × multipliers
        const calcHit = (mv: number, flat: number, type: string, tcStacks: number, sfActive: boolean, vsActive: boolean, element?: string, skillName?: string): number => {
            // Volt Surge ATK buff: +10% ATK +80; Psychoscope conditionalAtkPct stacks additively
            const vsAtkMult = vsActive ? 0.10 + psyConditionalAtkPct : 0
            const atkNow = vsActive ? effAtk * (1 + vsAtkMult) + 80 : effAtk
            const base = atkNow * (mv / 100) + flat + psyAllElementFlat
            if (base <= 0) return 0
            let mult = 1 + versPct     // Versatility = general amp
            // Mastery: full benefit for expertise/special/ult, reduced for basic
            // Imagine 1 buff: Mastery +13% for 20s
            const mastNow = mastPct + (im1Timer > 0 ? 0.13 : 0)
            const mastScale = (type === "Expertise" || type === "Special" || type === "Ultimate" || type === "Imagine") ? 1 : 0.5
            mult *= (1 + mastNow * mastScale)
            // Additive damage bonuses
            let bonus = dmgBoss
            bonus += meleeDmg  // All Stormblade skills are melee
            if (t.thunderCurse) bonus += tcStacks * 0.02
            // Module Physical DMG bonus — "Physical DMG" = ATK-based damage type, all Stormblade melee skills qualify
            bonus += physDmgPct
            // Module DMG Stack average bonus (applies to all damage)
            bonus += dmgStackPct
            // Psychoscope Dream DMG bonuses
            bonus += psyDreamDmg
            if (type === "Special") bonus += psySpecialDmg
            if (type === "Expertise") bonus += psyExpertiseDmg
            // Psychoscope: Element DMG during class buff (e.g., Thunder Element DMG +8% during Volt Surge)
            if (vsActive && element === "Thunder") bonus += psyConditionalElementDmg
            // Psychoscope: Skill-specific Dream DMG bonuses
            if (skillName && psySkillDmg[skillName]) bonus += psySkillDmg[skillName] / 100
            mult *= (1 + bonus)
            mult *= avgCritLuck
            return base * mult
        }

        // Imagine 2 buff: Haste +13% for 20s → increases effective ASPD
        const getEffAspd = () => actualAspd + (im2Timer > 0 ? 0.13 : 0)
        const castTime = (skill: SkillDef) => {
            const effAspd = getEffAspd()
            return skill.scalesWithAspd && effAspd > 0 ? skill.castTime / (1 + effAspd) : skill.castTime
        }

        // ── State ──
        let time = 0, totalDmg = 0
        let bi = maxBi, sigils = 0, chargeSeeds = 0
        let tcStacks = 0, tcTimer = 0
        let sfActive = false, sfTimer = 0
        const sfDuration = 10  // Stormflash lasts 10s from tooltip
        let vsActive = false, vsTimer = 0
        const vsDuration = 12  // Volt Surge buff lasts 12s from tooltip
        let consecutiveTc = 0, ssCount = 0
        let mbTimer = 0, mbActive = false, mbLifeTimer = 0
        const mbLifetime = 35  // Moonblades last 35s from tooltip
        // Blade Intent passive regen: 2 per second (from Judgment Cut tooltip)
        // Stormflash: 20 per second during active
        // Piercing Slash internal CD tracker
        let psCd = 0
        // Imagine buff timers
        let im1Timer = 0, im2Timer = 0
        // Fantasia Impact timer
        let fiTimer = FI_ICD * 0.5 // first proc after ~4s

        const cds: Record<string, number> = {
            OblivionCombo: 0, VoltSurge: 0, Stormflash: 0,
            Imagine1: 0, Imagine2: 0, ChaosBreaker: 0,
            Overdrive: 0, ScytheWheel: 0,
        }

        const skillDmg: Record<string, number> = {}
        const skillCasts: Record<string, number> = {}
        const data: { time: number; damage: number; dps: number; skill: string; hit: number }[] = []
        const log: string[] = []
        const timelineData: { time: number; skill: string; damage: number; y: number; type: string }[] = []
        // Uptime tracking for rotStats
        let sfUptime = 0, vsUptime = 0

        const addDmg = (name: string, d: number) => {
            skillDmg[name] = (skillDmg[name] ?? 0) + d
            skillCasts[name] = (skillCasts[name] ?? 0) + 1
        }

        const tickTimers = (dt: number) => {
            // Tick all cooldowns
            for (const k in cds) { if (cds[k] > 0) cds[k] = Math.max(0, cds[k] - dt) }
            if (psCd > 0) psCd = Math.max(0, psCd - dt)
            // Thunder Curse timer
            if (tcTimer > 0) { tcTimer -= dt; if (tcTimer <= 0) tcStacks = 0 }
            // Stormflash timer and uptime tracking
            if (sfTimer > 0) { sfTimer -= dt; sfUptime += dt; if (sfTimer <= 0) sfActive = false }
            // Volt Surge timer and uptime tracking
            if (vsTimer > 0) { vsTimer -= dt; vsUptime += dt; if (vsTimer <= 0) vsActive = false }
            // Moonblade lifetime
            if (mbActive && mbLifeTimer > 0) { mbLifeTimer -= dt; if (mbLifeTimer <= 0) mbActive = false }
            // Imagine buff timers
            if (im1Timer > 0) im1Timer -= dt
            if (im2Timer > 0) im2Timer -= dt
            // Fantasia Impact timer
            fiTimer += dt
            // Passive Blade Intent regen: 2 BI/sec base
            // Blade Intent Recovery talent: each 1% Haste increases regen speed by 1%
            const biRegenRate = t.bladeIntentRecovery ? 2 * (1 + hastePct / 100) : 2
            bi = Math.min(maxBi, bi + biRegenRate * dt)
            // Stormflash: 20 BI/sec during active (also scaled by Blade Intent Recovery)
            if (sfActive) {
                const sfRegenRate = t.bladeIntentRecovery ? 20 * (1 + hastePct / 100) : 20
                bi = Math.min(maxBi, bi + sfRegenRate * dt)
            }
        }

        const cast = (key: string) => {
            const skill = skills[key]
            if (!skill) return
            const ct = castTime(skill)

            // Set cooldown
            let cd = skill.cd
            if (key === "Overdrive" && t.overdriveRefinement) cd *= 0.7
            if (cds[key] !== undefined) cds[key] = cd

            // ── Calculate Damage ──
            let mv = skill.mv
            let flat = skill.flat

            // Thundercut: "additional attacks" = full attack repetitions at ASPD breakpoints
            // Base: 1 attack (210% +600). At ≥50%: 3 attacks = 630% +1800.
            if (key === "Thundercut") {
                const tcBonusAttacks = getTcBonusAttacks()
                const numAttacks = 1 + tcBonusAttacks
                mv = 210 * numAttacks
                flat = 600 * numAttacks
            }

            let dmg = calcHit(mv, flat, skill.type, tcStacks, sfActive, vsActive, skill.element, skill.name)

            // Divine Sickle: guaranteed crit + talent damage multiplier
            if (key === "DivineSickle") {
                // DS always crits (100% crit rate in parse data)
                // Remove avgCritLuck, apply guaranteed crit + normal lucky chance
                const dsBase = dmg / avgCritLuck
                // Guaranteed crit × (chance of also being lucky)
                const dsAvg = dsBase * critMult * (1 + luckRate * (luckMult - 1))
                dmg = dsAvg
                if (t.divineSickle) dmg *= dsDmgMult
            }

            // Iai Thunder Dance: Special Attacks double-hit when ≥3 sigils
            if (t.iaiThunderDance && skill.type === "Special" && sigils >= 3) dmg *= 2

            if (dmg > 0) {
                totalDmg += dmg
                addDmg(skill.name, dmg)
            }

            // ── Resources ──
            if (skill.grantsBladeIntent) bi = Math.min(maxBi, bi + skill.grantsBladeIntent)
            // Blade Intent talent: +3 BI when any Expertise Skill is cast
            if (t.bladeIntent && skill.type === "Expertise") bi = Math.min(maxBi, bi + 3)
            if (skill.consumesBladeIntent) bi = Math.max(0, bi - skill.consumesBladeIntent)
            if (skill.consumesSigils) sigils = Math.max(0, sigils - skill.consumesSigils)
            if (skill.grantsSigils) {
                // Volt Surge: any sigil-granting action maxes out sigils
                if (vsActive) sigils = maxSigils
                else sigils = Math.min(maxSigils, sigils + skill.grantsSigils)
            }
            if (skill.grantsChargeSeeds) chargeSeeds += skill.grantsChargeSeeds

            // ── Skill-specific effects ──

            // Thunder Curse stacking (talent)
            if (t.thunderCurse && (skill.type === "Expertise" || skill.type === "Special" || skill.type === "Ultimate")) {
                tcStacks = Math.min(4, tcStacks + 1); tcTimer = 10
            }

            // Volt Surge activation
            if (key === "VoltSurge") { vsActive = true; vsTimer = vsDuration }

            // Stormflash activation
            if (key === "Stormflash") { sfActive = true; sfTimer = sfDuration }

            // Oblivion Combo grants max sigils
            if (key === "OblivionCombo") sigils = maxSigils

            // Scythe Wheel: summons moonblades
            if (key === "ScytheWheel") { mbActive = true; mbLifeTimer = mbLifetime }

            // Imagine buffs
            if (key === "Imagine1") im1Timer = 20  // Mastery +13% for 20s
            if (key === "Imagine2") im2Timer = 20  // Haste +13% for 20s

            // Storm Scythe count → Divine Sickle procs (now tracked via TC/Thundercleave Storm Scythe procs above)

            // Lightning Strike proc during Stormflash — triggered by Thundercut consuming BI
            if ((key === "Thundercut" || key === "Thundercleave") && sfActive) {
                const lsDmg = calcHit(LS_MV, LS_FLAT, "Expertise", tcStacks, sfActive, vsActive, "Thunder", "Lightning Strike")
                totalDmg += lsDmg
                addDmg("Lightning Strike", lsDmg)
            }

            // Storm Scythe talent proc — triggered on every Thundercut/Thundercleave cast while moonblades active
            // From parse: ~70 procs across 90s matching ~107 TC + ~7 Thundercleave casts
            if ((key === "Thundercut" || key === "Thundercleave") && mbActive) {
                const ssDmg = calcHit(SS_MV, SS_FLAT, "Expertise", tcStacks, sfActive, vsActive, "Thunder", "Storm Scythe")
                totalDmg += ssDmg
                addDmg("Storm Scythe", ssDmg)
                ssCount++
                // Thunder Might 2: double proc during Stormflash
                if (t.thunderMight2 && sfActive) {
                    totalDmg += ssDmg; addDmg("Storm Scythe", ssDmg); ssCount++
                }
            }

            // Thundercut tracking
            if (key === "Thundercut") {
                consecutiveTc++
                if (t.phantomScytheII) {
                    // Talent: "grants 12 + Luck% × 10 points of Blade Intent"
                    // In-game "Luck%" = displayed luck percentage (e.g. 40.53)
                    // "× 10" means multiply by 10: 12 + 40.53×10 = 417 BI per TC
                    // This makes TC self-sustaining (net +367 BI per TC at 40% Luck)
                    const luckPctDisplay = luckRate * 100 // convert 0.4053 → 40.53
                    bi = Math.min(maxBi, bi + 12 + Math.floor(luckPctDisplay * 10))
                }
                if (t.thunderSeed) chargeSeeds += 2
            } else if (key !== "Thundercleave") {
                consecutiveTc = 0
            }

            // Moonstrike: triggers Moonblade Whirl damage (210% +600 per active moonblade)
            if (key === "Moonstrike" && mbActive) {
                const whirlDmg = calcHit(MW_MV * moonbladeCount, MW_FLAT * moonbladeCount, "Special", tcStacks, sfActive, vsActive, "Thunder", "Moonblade Whirl")
                totalDmg += whirlDmg
                addDmg("Moonblade Whirl", whirlDmg)
            }
            if (key === "ChaosBreaker" && mbActive) {
                const whirlDmg = calcHit(MW_MV * moonbladeCount, MW_FLAT * moonbladeCount, "Special", tcStacks, sfActive, vsActive, "Thunder", "Moonblade Whirl")
                totalDmg += whirlDmg
                addDmg("Moonblade Whirl", whirlDmg)
            }

            // Advance time
            const prev = time; time += ct
            tickTimers(ct)

            // ── Moonblade passive damage tick ──
            if (mbActive) {
                mbTimer += ct
                while (mbTimer >= MB_INTERVAL) {
                    const mbDmg = calcHit(MB_MV * moonbladeCount, MB_FLAT * moonbladeCount, "Basic", tcStacks, sfActive, vsActive, "Thunder", "Moonblades")
                    totalDmg += mbDmg
                    addDmg("Moonblades", mbDmg)
                    mbTimer -= MB_INTERVAL

                    // Thunderstrike procs from moonblade lucky strikes (talent)
                    if (t.touchOfThunderSoul && luckRate > 0) {
                        const tsChance = 0.6 * luckRate
                const tsDmgBase = calcHit(TS_MV, TS_FLAT, "Special", tcStacks, sfActive, vsActive, "Thunder", "Thunderstrike")
                        let tsScale = 1.0
                        if (t.enhancedThunderstrike) tsScale = 1.2 + luckRate
                        const tsDmg = tsDmgBase * tsChance * tsScale
                        totalDmg += tsDmg
                        addDmg("Thunderstrike", tsDmg)
                    }
                }
            }

            // Piercing Slash proc from basic attacks / Thundercut (10% per hit, 1s ICD)
            if ((key === "Thundercut" || key === "Thundercleave" || key === "BasicAttack") && psCd <= 0) {
                // Each hit has 10% chance. TC at ≥50%: 3 attacks × 2 hits = 6 total hits
                const tcTotalHits = key === "Thundercut" ? 2 * (1 + getTcBonusAttacks()) : skill.hits
                const procChance = 0.10 * tcTotalHits
                const pSkill = MS_SKILLS.PiercingSlash
                const pDmg = calcHit(pSkill.mv, pSkill.flat, pSkill.type, tcStacks, sfActive, vsActive, "Thunder", "Piercing Slash") * procChance
                totalDmg += pDmg
                addDmg("Piercing Slash", pDmg)
                if (procChance > 0 && vsActive) sigils = maxSigils
                else if (procChance > 0) sigils = Math.min(maxSigils, sigils + (pSkill.grantsSigils ?? 0) * procChance)
                psCd = 1.0
            }

            // Lucky Strike (Tachi) — weapon type bonus on every lucky strike
            // Each hit has luckRate chance to proc, dealing ~100% ATK +440 extra damage
            if (dmg > 0 && luckRate > 0) {
                const vsAtkMult = vsActive ? 0.10 + psyConditionalAtkPct : 0
                const atkNow = vsActive ? effAtk * (1 + vsAtkMult) + 80 : effAtk
                const tachiPerProc = atkNow * (TACHI_MV / 100) + TACHI_FLAT
                // TC at ≥50%: 3 attacks × 2 hits = 6 total hits for proc chances
                const skillHits = (key === "Thundercut") ? 2 * (1 + getTcBonusAttacks()) : skill.hits
                // Each individual hit can proc tachi independently
                const tachiDmg = tachiPerProc * luckRate * skillHits
                totalDmg += tachiDmg
                addDmg("Lucky Strike (Tachi)", tachiDmg)
            }

            // Fantasia Impact — periodic high-damage proc (~8s ICD)
            // Doesn't crit/luck, only scales with mastery  
            while (fiTimer >= FI_ICD) {
                const vsAtkMult = vsActive ? 0.10 + psyConditionalAtkPct : 0
                const atkNow = vsActive ? effAtk * (1 + vsAtkMult) + 80 : effAtk
                const fiBase = atkNow * (FI_MV / 100) + FI_FLAT
                const mastNow = mastPct + (im1Timer > 0 ? 0.13 : 0)
                const fiDmg = fiBase * (1 + versPct) * (1 + mastNow) * (1 + dmgBoss + meleeDmg + psyDreamDmg)
                totalDmg += fiDmg
                addDmg("Fantasia Impact", fiDmg)
                fiTimer -= FI_ICD
            }

            data.push({
                time: parseFloat(time.toFixed(1)), damage: Math.round(totalDmg),
                dps: time > 0 ? Math.round(totalDmg / time) : 0,
                skill: skill.name, hit: Math.round(dmg),
            })
            log.push(`[${prev.toFixed(1)}s] ${skill.name} — ${dmg > 0 ? Math.round(dmg).toLocaleString() : "BUFF"}${tcStacks > 0 ? ` (TC×${tcStacks})` : ""}${sfActive ? " [SF]" : ""}${vsActive ? " [VS]" : ""}`)
            // Track for timeline visualization
            if (dmg > 0) {
                const skillIdx = Object.keys(skillDmg).indexOf(skill.name)
                timelineData.push({
                    time: parseFloat(prev.toFixed(2)),
                    skill: skill.name,
                    damage: Math.round(dmg),
                    y: skillIdx >= 0 ? skillIdx : Object.keys(skillDmg).length,
                    type: skill.type,
                })
            }
        }

        // ── Rotation Execution ──
        if (useCustomRotation && rotation.length > 0) {
            // Expand rotation items with repeat counts into flat key list
            const flatRot: string[] = []
            for (const item of rotation) {
                for (let r = 0; r < item.repeat; r++) flatRot.push(item.key)
            }
            let rotIdx = 0
            while (time < fightDuration) {
                if (ssCount >= dsTrigger && t.divineSickle) { cast("DivineSickle"); ssCount = 0; continue }
                if (consecutiveTc >= 5 && t.moonstrikDelay && bi >= 50) { cast("Thundercleave"); consecutiveTc = 0; continue }

                const key = flatRot[rotIdx % flatRot.length]
                const skill = skills[key]
                const canCast = skill && (
                    (cds[key] === undefined || cds[key] <= 0) &&
                    (!skill.consumesBladeIntent || bi >= skill.consumesBladeIntent) &&
                    (!skill.consumesSigils || sigils >= skill.consumesSigils)
                )
                if (canCast) {
                    cast(key)
                    rotIdx++
                } else {
                    // Skill can't be cast - use intelligent filler instead of skipping
                    // Priority: rebuild BI > use available spenders > BasicAttack
                    if (bi < 50 && sigils >= 3) {
                        // Have sigils but no BI - use Moonstrike to dump sigils
                        cast("Moonstrike")
                    } else if (bi < 50) {
                        // Need BI - BasicAttack to rebuild
                        cast("BasicAttack")
                    } else if (skill?.consumesSigils && sigils < skill.consumesSigils) {
                        // Need sigils - Overdrive or wait
                        if (cds.Overdrive <= 0 && sigils < maxSigils) cast("Overdrive")
                        else cast("BasicAttack")
                    } else if (cds[key] > 0) {
                        // Skill on CD - use filler
                        if (bi >= 50) cast("Thundercut")
                        else if (sigils >= 3) cast("Moonstrike")
                        else cast("BasicAttack")
                    } else {
                        cast("BasicAttack")
                    }
                    // Don't advance rotation index - try the same skill next time
                }
            }
        } else {
            // ── Default priority rotation ──
            // Pre-fight: Scythe Wheel (summon moonblades) → Ultimate
            cast("ScytheWheel")
            cast("OblivionCombo")
            cds.OblivionCombo = 60

            while (time < fightDuration) {
                if (ssCount >= dsTrigger && t.divineSickle) { cast("DivineSickle"); ssCount = 0; continue }
                if (consecutiveTc >= 5 && t.moonstrikDelay && bi >= 50) { cast("Thundercleave"); consecutiveTc = 0; continue }

                if (cds.VoltSurge <= 0) cast("VoltSurge")
                else if (cds.Stormflash <= 0 && !sfActive) cast("Stormflash")
                else if (cds.ScytheWheel <= 0 && !mbActive) cast("ScytheWheel")
                else if (cds.Imagine1 <= 0) cast("Imagine1")
                else if (cds.Imagine2 <= 0) cast("Imagine2")
                else if (cds.Overdrive <= 0 && sigils < maxSigils) cast("Overdrive")
                else if (sigils >= 3 && bi < 50) {
                    if (sfActive && t.chaosBreaker && cds.ChaosBreaker <= 0) cast("ChaosBreaker")
                    else cast("Moonstrike")
                } else if (sfActive && t.chaosBreaker && cds.ChaosBreaker <= 0 && sigils >= 3) cast("ChaosBreaker")
                else if (bi >= 50) cast("Thundercut")
                else if (sigils >= 3) cast("Moonstrike")
                else cast("BasicAttack")
            }
        }

        // Build breakdown
        const breakdown = Object.entries(skillDmg)
            .map(([name, d]) => ({
                name, damage: Math.round(d), pct: +(d / totalDmg * 100).toFixed(1),
                casts: skillCasts[name] ?? 0, dps: Math.round(d / fightDuration),
                color: SKILL_COLORS[name] ?? "#888",
            }))
            .sort((a, b) => b.damage - a.damage)

        // Build skill order for Y-axis
        const skillOrder = [...new Set(timelineData.map(t => t.skill))]
        const timelineYMax = skillOrder.length
        const timelineNormalized = timelineData.map(t => ({
            ...t,
            y: skillOrder.indexOf(t.skill),
        }))

        return {
            data, log, breakdown, effAtk: Math.round(effAtk),
            finalDmg: totalDmg, finalDps: totalDmg / fightDuration,
            actualAspd, timelineData: timelineNormalized, skillOrder,
            rotStats: {
                tcCasts: skillCasts["Thundercut"] ?? 0,
                msCasts: skillCasts["Moonstrike"] ?? 0,
                lsCasts: skillCasts["Lightning Strike"] ?? 0,
                cbCasts: skillCasts["Chaos Breaker"] ?? 0,
                dsCasts: skillCasts["Divine Sickle"] ?? 0,
                swCasts: skillCasts["Scythe Wheel"] ?? 0,
                sfUptime,
                vsUptime,
            },
        }
    }, [combat, manualAtk, manualAspd, fightDuration, spec, selectedTalents, isMoonstrike, useCustomRotation, rotation, skills])

    // ── Helper: derive combat stats from StatsResult (for comparison mode) ──
    const deriveCombatFromStats = (statsResult: StatsResult | null) => {
        if (!statsResult) return null
        const versPct = getStatPercentCombat("Versatility", statsResult.total.Versatility) / 100
        const mastPct = getStatPercentCombat("Mastery", statsResult.total.Mastery) / 100
        // Include purple stat % bonuses
        const critRate = Math.min((getStatPercentCombat("Crit", statsResult.total.Crit) + (statsResult.purpleStats?.["Crit (%)"] ?? 0)) / 100, 1)
        const luckRate = Math.min((getStatPercentCombat("Luck", statsResult.total.Luck) + (statsResult.purpleStats?.["Luck (%)"] ?? 0)) / 100, 1)
        const hastePct = getStatPercentCombat("Haste", statsResult.total.Haste)
        const aspd = statsResult.aspd / 100
        const baseCritDmg = 0.50
        const bonusCritDmg = (statsResult.extraStats?.["Crit DMG (%)"] ?? 0) / 100
        const critMult = 1 + baseCritDmg + bonusCritDmg
        const baseLuckDmg = 0.30
        const bonusLuckDmg = (statsResult.extraStats?.["Lucky Strike DMG Multiplier (%)"] ?? 0) / 100
        const luckMult = 1 + baseLuckDmg + bonusLuckDmg
        const dmgBoss = (statsResult.purpleStats?.["DMG Bonus vs Bosses (%)"] ?? 0) / 100
        const meleeDmg = (statsResult.purpleStats?.["Melee Damage Bonus (%)"] ?? 0) / 100
        const weaponAtkPct = isMoonstrike ? 0.04 : 0
        const physDmgPct = (statsResult.moduleStats?.["Physical DMG (%)"] ?? 0) / 100
        const dmgPerStack = statsResult.moduleStats?.["DMG (%) / stack"] ?? 0
        const dmgStackPct = dmgPerStack > 0 ? (dmgPerStack * 4) / 100 : 0
        const avgCritLuck =
            (1 - critRate) * (1 - luckRate) * 1.0 +
            critRate * (1 - luckRate) * critMult +
            (1 - critRate) * luckRate * luckMult +
            critRate * luckRate * critMult * luckMult
        return {
            versPct, mastPct, critRate, luckRate, hastePct, aspd,
            critMult, luckMult, avgCritLuck,
            dmgBoss, meleeDmg, weaponAtkPct,
            physDmgPct, dmgStackPct,
            raid2pc: statsResult.raid2pcBonus, raid4pc: statsResult.raid4pcBonus,
            psyEffects: statsResult.psychoscopeEffects,
        }
    }

    // ── Comparison mode: run simulation for each selected gear set ──
    const SET_COLORS = ["#f59e0b", "#ef4444", "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"]
    const comparisonResults = useMemo(() => {
        if (!compareMode || selectedSetIds.length === 0) return []
        return selectedSetIds.map((id, idx) => {
            const gearSet = gearSets.find(s => s.id === id)
            if (!gearSet) return null
            const statsResult = calculateStatsFromGearSet(gearSet, spec, base, ext, psychoscopeConfig)
            const combatStats = deriveCombatFromStats(statsResult)
            if (!combatStats) return null
            // Run a simplified simulation using the same logic but with gearSet's talents
            const simResult = runSimulation(combatStats, gearSet.selectedTalents, gearSet.talentAspd, statsResult.aspd)
            return {
                id: gearSet.id,
                name: gearSet.name,
                color: SET_COLORS[idx % SET_COLORS.length],
                data: simResult.data,
                finalDps: simResult.finalDps,
                finalDmg: simResult.finalDmg,
                effAtk: simResult.effAtk,
            }
        }).filter(Boolean) as { id: string; name: string; color: string; data: { time: number; damage: number; dps: number }[]; finalDps: number; finalDmg: number; effAtk: number }[]
    }, [compareMode, selectedSetIds, gearSets, spec, base, ext, manualAtk, fightDuration, useCustomRotation, rotation, skills])

    // Merge comparison data for LineChart (needs single dataset with multiple keys)
    // Resample all sets to common time intervals for proper alignment
    const mergedComparisonData = useMemo(() => {
        if (comparisonResults.length < 2) return []
        // Create uniform time intervals (every 1 second)
        const intervals: number[] = []
        for (let t = 0; t <= fightDuration; t++) {
            intervals.push(t)
        }
        // For each interval, find the closest DPS value from each set's data
        return intervals.map(time => {
            const merged: Record<string, number> = { time }
            comparisonResults.forEach((result, idx) => {
                // Find the data point with the closest time
                const closest = result.data.reduce((prev, curr) => 
                    Math.abs(curr.time - time) < Math.abs(prev.time - time) ? curr : prev
                )
                merged[`dps_${idx}`] = closest?.dps ?? 0
            })
            return merged
        })
    }, [comparisonResults, fightDuration])

    // ── Simulation runner (extracted for reuse) ──
    function runSimulation(combatStats: NonNullable<ReturnType<typeof deriveCombatFromStats>>, talents: string[], talentAspdVal: number, plannerAspd: number) {
        const {
            versPct, mastPct, critRate, luckRate, hastePct, aspd, avgCritLuck,
            dmgBoss, meleeDmg, weaponAtkPct,
            critMult, luckMult, physDmgPct, dmgStackPct,
            raid2pc, raid4pc, psyEffects,
        } = combatStats

        const actualAspd = manualAspd > 0 ? manualAspd / 100 : aspd
        let effAtk = manualAtk * (1 + weaponAtkPct)

        // Psychoscope: ATK from stat scaling (same as main sim)
        const psyAtkFromStatPct = psyEffects?.atkFromStat && psyEffects.atkFromStat.target !== "CritDMG"
            ? getStatPercentCombat(psyEffects.atkFromStat.stat, stats?.total[psyEffects.atkFromStat.stat] ?? 0) * psyEffects.atkFromStat.ratio / 100
            : 0
        effAtk *= (1 + psyAtkFromStatPct)

        // Psychoscope DPS bonuses (as decimals)
        const psyDreamDmg = (psyEffects?.dreamDmgPct ?? 0) / 100
        const psySpecialDmg = (psyEffects?.specialDmgPct ?? 0) / 100
        const psyExpertiseDmg = (psyEffects?.expertiseDmgPct ?? 0) / 100
        const psyConditionalAtkPct = (psyEffects?.conditionalAtkPct ?? 0) / 100
        const psyConditionalElementDmg = (psyEffects?.conditionalElementDmg ?? 0) / 100
        const psySkillDmg = psyEffects?.skillDmg ?? {}
        const psyAllElementFlat = psyEffects?.allElementFlat ?? 0

        const t = {
            thunderCurse: talents?.includes("thunder_curse"),
            chaosBreaker: talents?.includes("chaos_breaker"),
            moonstrikDelay: talents?.includes("moonstrike_delay"),
            divineSickle: talents?.includes("divine_sickle"),
            phantomScytheI: talents?.includes("phantom_scythe_realm_i"),
            phantomScytheII: talents?.includes("phantom_scythe_realm_ii"),
            bladeIntentRare: talents?.includes("blade_intent_rare"),
            thunderRuneMastery: talents?.includes("thunder_rune_mastery"),
            thunderMight2: talents?.includes("thunder_might_2"),
            touchOfThunderSoul: talents?.includes("touch_of_thunder_soul"),
            enhancedThunderstrike: talents?.includes("enhanced_thunderstrike"),
            overdriveRefinement: talents?.includes("overdrive_refinement"),
            thunderSeed: talents?.includes("thunder_seed"),
            vacuumSlash: talents?.includes("vacuum_slash"),
            iaiThunderDance: talents?.includes("iai_thunder_dance"),
            bladeIntent: talents?.includes("blade_intent"),
            bladeIntentRecovery: talents?.includes("blade_intent_recovery"),
        }

        let maxBi = 100
        if (t.bladeIntentRare) maxBi += 75
        if (t.moonstrikDelay) maxBi += 25
        if (t.thunderRuneMastery) maxBi *= 2
        let maxSigils = 4
        let moonbladeCount = MB_BASE_COUNT
        if (t.phantomScytheI) moonbladeCount += 1

        const getTcBonusAttacks = (im2Timer: number) => {
            const effAspd = actualAspd + (im2Timer > 0 ? 0.13 : 0)
            if (effAspd >= 0.80) return 3
            if (effAspd >= 0.50) return 2
            if (effAspd >= 0.25) return 1
            return 0
        }

        let dsTrigger = 7, dsDmgMult = 1.0
        if (t.divineSickle) {
            const lPct = luckRate * 100
            if (lPct >= 45) { dsTrigger = 21; dsDmgMult = 3.0 }
            else if (lPct >= 28) { dsTrigger = 14; dsDmgMult = 2.0 }
        }

        const calcHit = (mv: number, flat: number, type: string, tcStacks: number, sfActive: boolean, vsActive: boolean, im1Timer: number, im2Timer: number, element?: string, skillName?: string): number => {
            // Volt Surge ATK buff: +10% ATK +80; Psychoscope conditionalAtkPct stacks additively
            const vsAtkMult = vsActive ? 0.10 + psyConditionalAtkPct : 0
            const atkNow = vsActive ? effAtk * (1 + vsAtkMult) + 80 : effAtk
            const base = atkNow * (mv / 100) + flat + psyAllElementFlat
            if (base <= 0) return 0
            let mult = 1 + versPct
            const mastNow = mastPct + (im1Timer > 0 ? 0.13 : 0)
            const mastScale = (type === "Expertise" || type === "Special" || type === "Ultimate" || type === "Imagine") ? 1 : 0.5
            mult *= (1 + mastNow * mastScale)
            let bonus = dmgBoss + meleeDmg
            if (t.thunderCurse) bonus += tcStacks * 0.02
            bonus += physDmgPct + dmgStackPct
            // Psychoscope Dream DMG bonuses
            bonus += psyDreamDmg
            if (type === "Special") bonus += psySpecialDmg
            if (type === "Expertise") bonus += psyExpertiseDmg
            // Psychoscope: Element DMG during class buff
            if (vsActive && element === "Thunder") bonus += psyConditionalElementDmg
            // Psychoscope: Skill-specific Dream DMG bonuses
            if (skillName && psySkillDmg[skillName]) bonus += psySkillDmg[skillName] / 100
            mult *= (1 + bonus)
            mult *= avgCritLuck
            return base * mult
        }

        const castTime = (skill: SkillDef, im2Timer: number) => {
            const effAspd = actualAspd + (im2Timer > 0 ? 0.13 : 0)
            return skill.scalesWithAspd && effAspd > 0 ? skill.castTime / (1 + effAspd) : skill.castTime
        }

        let time = 0, totalDmg = 0
        let bi = maxBi, sigils = 0, chargeSeeds = 0
        let tcStacks = 0, tcTimer = 0
        let sfActive = false, sfTimer = 0
        let vsActive = false, vsTimer = 0
        let consecutiveTc = 0, ssCount = 0
        let mbTimer = 0, mbActive = false, mbLifeTimer = 0
        let psCd = 0
        let im1Timer = 0, im2Timer = 0
        let fiTimer = FI_ICD * 0.5

        const cds: Record<string, number> = {
            OblivionCombo: 0, VoltSurge: 0, Stormflash: 0,
            Imagine1: 0, Imagine2: 0, ChaosBreaker: 0,
            Overdrive: 0, ScytheWheel: 0,
        }

        const data: { time: number; damage: number; dps: number }[] = []

        const tickTimers = (dt: number) => {
            for (const k in cds) { if (cds[k] > 0) cds[k] = Math.max(0, cds[k] - dt) }
            if (psCd > 0) psCd = Math.max(0, psCd - dt)
            if (tcTimer > 0) { tcTimer -= dt; if (tcTimer <= 0) tcStacks = 0 }
            if (sfTimer > 0) { sfTimer -= dt; if (sfTimer <= 0) sfActive = false }
            if (vsTimer > 0) { vsTimer -= dt; if (vsTimer <= 0) vsActive = false }
            if (mbActive && mbLifeTimer > 0) { mbLifeTimer -= dt; if (mbLifeTimer <= 0) mbActive = false }
            if (im1Timer > 0) im1Timer -= dt
            if (im2Timer > 0) im2Timer -= dt
            fiTimer += dt
            const biRegenRate = t.bladeIntentRecovery ? 2 * (1 + hastePct / 100) : 2
            bi = Math.min(maxBi, bi + biRegenRate * dt)
            if (sfActive) {
                const sfRegenRate = t.bladeIntentRecovery ? 20 * (1 + hastePct / 100) : 20
                bi = Math.min(maxBi, bi + sfRegenRate * dt)
            }
        }

        const cast = (key: string) => {
            const skill = skills[key]
            if (!skill) return
            const ct = castTime(skill, im2Timer)
            let cd = skill.cd
            if (key === "Overdrive" && t.overdriveRefinement) cd *= 0.7
            if (cds[key] !== undefined) cds[key] = cd

            let mv = skill.mv, flat = skill.flat
            if (key === "Thundercut") {
                const tcBonusAttacks = getTcBonusAttacks(im2Timer)
                const numAttacks = 1 + tcBonusAttacks
                mv = 210 * numAttacks
                flat = 600 * numAttacks
            }

            let dmg = calcHit(mv, flat, skill.type, tcStacks, sfActive, vsActive, im1Timer, im2Timer, skill.element, skill.name)

            if (key === "DivineSickle") {
                const dsBase = dmg / avgCritLuck
                const dsAvg = dsBase * critMult * (1 + luckRate * (luckMult - 1))
                dmg = dsAvg
                if (t.divineSickle) dmg *= dsDmgMult
            }

            if (t.iaiThunderDance && skill.type === "Special" && sigils >= 3) dmg *= 2

            if (dmg > 0) totalDmg += dmg

            if (skill.grantsBladeIntent) bi = Math.min(maxBi, bi + skill.grantsBladeIntent)
            if (t.bladeIntent && skill.type === "Expertise") bi = Math.min(maxBi, bi + 3)
            if (skill.consumesBladeIntent) bi = Math.max(0, bi - skill.consumesBladeIntent)
            if (skill.consumesSigils) sigils = Math.max(0, sigils - skill.consumesSigils)
            if (skill.grantsSigils) {
                if (vsActive) sigils = maxSigils
                else sigils = Math.min(maxSigils, sigils + skill.grantsSigils)
            }
            if (skill.grantsChargeSeeds) chargeSeeds += skill.grantsChargeSeeds

            if (t.thunderCurse && (skill.type === "Expertise" || skill.type === "Special" || skill.type === "Ultimate")) {
                tcStacks = Math.min(4, tcStacks + 1); tcTimer = 10
            }
            if (key === "VoltSurge") { vsActive = true; vsTimer = 12 }
            if (key === "Stormflash") { sfActive = true; sfTimer = 10 }
            if (key === "OblivionCombo") sigils = maxSigils
            if (key === "ScytheWheel") { mbActive = true; mbLifeTimer = 35 }
            if (key === "Imagine1") im1Timer = 20
            if (key === "Imagine2") im2Timer = 20

            if ((key === "Thundercut" || key === "Thundercleave") && sfActive) {
                totalDmg += calcHit(LS_MV, LS_FLAT, "Expertise", tcStacks, sfActive, vsActive, im1Timer, im2Timer, "Thunder", "Lightning Strike")
            }
            if ((key === "Thundercut" || key === "Thundercleave") && mbActive) {
                const ssDmg = calcHit(SS_MV, SS_FLAT, "Expertise", tcStacks, sfActive, vsActive, im1Timer, im2Timer, "Thunder", "Storm Scythe")
                totalDmg += ssDmg
                ssCount++
                if (t.thunderMight2 && sfActive) { totalDmg += ssDmg; ssCount++ }
            }

            if (key === "Thundercut") {
                consecutiveTc++
                if (t.phantomScytheII) {
                    const luckPctDisplay = luckRate * 100
                    bi = Math.min(maxBi, bi + 12 + Math.floor(luckPctDisplay * 10))
                }
                if (t.thunderSeed) chargeSeeds += 2
            } else if (key !== "Thundercleave") {
                consecutiveTc = 0
            }

            if (key === "Moonstrike" && mbActive) {
                totalDmg += calcHit(MW_MV * moonbladeCount, MW_FLAT * moonbladeCount, "Special", tcStacks, sfActive, vsActive, im1Timer, im2Timer, "Thunder", "Moonblade Whirl")
            }
            if (key === "ChaosBreaker" && mbActive) {
                totalDmg += calcHit(MW_MV * moonbladeCount, MW_FLAT * moonbladeCount, "Special", tcStacks, sfActive, vsActive, im1Timer, im2Timer, "Thunder", "Moonblade Whirl")
            }

            const prev = time; time += ct
            tickTimers(ct)

            if (mbActive) {
                mbTimer += ct
                while (mbTimer >= MB_INTERVAL) {
                    totalDmg += calcHit(MB_MV * moonbladeCount, MB_FLAT * moonbladeCount, "Basic", tcStacks, sfActive, vsActive, im1Timer, im2Timer, "Thunder", "Moonblades")
                    mbTimer -= MB_INTERVAL
                    if (t.touchOfThunderSoul && luckRate > 0) {
                        const tsChance = 0.6 * luckRate
                        const tsDmgBase = calcHit(TS_MV, TS_FLAT, "Special", tcStacks, sfActive, vsActive, im1Timer, im2Timer, "Thunder", "Thunderstrike")
                        let tsScale = 1.0
                        if (t.enhancedThunderstrike) tsScale = 1.2 + luckRate
                        totalDmg += tsDmgBase * tsChance * tsScale
                    }
                }
            }

            if ((key === "Thundercut" || key === "Thundercleave" || key === "BasicAttack") && psCd <= 0) {
                const tcTotalHits = key === "Thundercut" ? 2 * (1 + getTcBonusAttacks(im2Timer)) : skill.hits
                const procChance = 0.10 * tcTotalHits
                const pSkill = MS_SKILLS.PiercingSlash
                totalDmg += calcHit(pSkill.mv, pSkill.flat, pSkill.type, tcStacks, sfActive, vsActive, im1Timer, im2Timer, "Thunder", "Piercing Slash") * procChance
                psCd = 1.0
            }

            if (dmg > 0 && luckRate > 0) {
                const vsAtkMult = vsActive ? 0.10 + psyConditionalAtkPct : 0
                const atkNow = vsActive ? effAtk * (1 + vsAtkMult) + 80 : effAtk
                const tachiPerProc = atkNow * (TACHI_MV / 100) + TACHI_FLAT
                const skillHits = (key === "Thundercut") ? 2 * (1 + getTcBonusAttacks(im2Timer)) : skill.hits
                totalDmg += tachiPerProc * luckRate * skillHits
            }

            while (fiTimer >= FI_ICD) {
                const vsAtkMult = vsActive ? 0.10 + psyConditionalAtkPct : 0
                const atkNow = vsActive ? effAtk * (1 + vsAtkMult) + 80 : effAtk
                const fiBase = atkNow * (FI_MV / 100) + FI_FLAT
                const mastNow = mastPct + (im1Timer > 0 ? 0.13 : 0)
                totalDmg += fiBase * (1 + versPct) * (1 + mastNow) * (1 + dmgBoss + meleeDmg + psyDreamDmg)
                fiTimer -= FI_ICD
            }

            data.push({
                time: parseFloat(time.toFixed(1)),
                damage: Math.round(totalDmg),
                dps: time > 0 ? Math.round(totalDmg / time) : 0,
            })
        }

        // Execute rotation
        if (useCustomRotation && rotation.length > 0) {
            const flatRot: string[] = []
            for (const item of rotation) {
                for (let r = 0; r < item.repeat; r++) flatRot.push(item.key)
            }
            let rotIdx = 0
            while (time < fightDuration) {
                if (ssCount >= dsTrigger && t.divineSickle) { cast("DivineSickle"); ssCount = 0; continue }
                if (consecutiveTc >= 5 && t.moonstrikDelay && bi >= 50) { cast("Thundercleave"); consecutiveTc = 0; continue }
                const key = flatRot[rotIdx % flatRot.length]
                const skill = skills[key]
                const canCast = skill && (
                    (cds[key] === undefined || cds[key] <= 0) &&
                    (!skill.consumesBladeIntent || bi >= skill.consumesBladeIntent) &&
                    (!skill.consumesSigils || sigils >= skill.consumesSigils)
                )
                if (canCast) {
                    cast(key)
                    rotIdx++
                } else {
                    if (bi < 50 && sigils >= 3) cast("Moonstrike")
                    else if (bi < 50) cast("BasicAttack")
                    else if (skill?.consumesSigils && sigils < skill.consumesSigils) {
                        if (cds.Overdrive <= 0 && sigils < maxSigils) cast("Overdrive")
                        else cast("BasicAttack")
                    } else if (cds[key] > 0) {
                        if (bi >= 50) cast("Thundercut")
                        else if (sigils >= 3) cast("Moonstrike")
                        else cast("BasicAttack")
                    } else {
                        cast("BasicAttack")
                    }
                }
            }
        } else {
            cast("ScytheWheel")
            cast("OblivionCombo")
            cds.OblivionCombo = 60
            while (time < fightDuration) {
                if (ssCount >= dsTrigger && t.divineSickle) { cast("DivineSickle"); ssCount = 0; continue }
                if (consecutiveTc >= 5 && t.moonstrikDelay && bi >= 50) { cast("Thundercleave"); consecutiveTc = 0; continue }
                if (cds.VoltSurge <= 0) cast("VoltSurge")
                else if (cds.Stormflash <= 0 && !sfActive) cast("Stormflash")
                else if (cds.ScytheWheel <= 0 && !mbActive) cast("ScytheWheel")
                else if (cds.Imagine1 <= 0) cast("Imagine1")
                else if (cds.Imagine2 <= 0) cast("Imagine2")
                else if (cds.Overdrive <= 0 && sigils < maxSigils) cast("Overdrive")
                else if (sigils >= 3 && bi < 50) {
                    if (sfActive && t.chaosBreaker && cds.ChaosBreaker <= 0) cast("ChaosBreaker")
                    else cast("Moonstrike")
                } else if (sfActive && t.chaosBreaker && cds.ChaosBreaker <= 0 && sigils >= 3) cast("ChaosBreaker")
                else if (bi >= 50) cast("Thundercut")
                else if (sigils >= 3) cast("Moonstrike")
                else cast("BasicAttack")
            }
        }

        return { data, finalDmg: totalDmg, finalDps: totalDmg / fightDuration, effAtk: Math.round(effAtk), actualAspd }
    }

    // ── Not Moonstrike ──
    if (!isMoonstrike) {
        return (
            <div className="flex flex-col gap-6 text-white pb-10">
                <h2 className="text-2xl font-bold uppercase tracking-widest border-b border-[#333] pb-2" style={{ color: accentColor }}>
                    DPS Parse Simulator
                </h2>
                <div className="bg-[#111] border border-[#333] p-8 rounded-md text-center">
                    <p className="text-[#888] text-sm">The DPS Simulator currently supports <span className="text-white font-bold">Stormblade — Moonstrike</span> spec only.</p>
                    <p className="text-[#666] text-xs mt-2">Switch your spec to Moonstrike in the Planner to use this tool. More specs will be added in future updates.</p>
                </div>
            </div>
        )
    }

    if (!sim || !combat) return null

    const fmtK = (n: number) => n >= 1_000_000 ? (n / 1_000_000).toFixed(2) + "M" : n >= 1000 ? Math.round(n / 1000) + "k" : String(Math.round(n))

    return (
        <div className="flex flex-col gap-6 text-white pb-10">
            {/* Header */}
            <div className="flex flex-col gap-2">
                <h2 className="text-2xl font-bold uppercase tracking-widest border-b border-[#333] pb-2" style={{ color: accentColor }}>
                    DPS Parse Simulator
                </h2>
                <p className="text-[#888] text-sm leading-relaxed">
                    Simulates Stormblade Moonstrike rotation using your planner stats. Enter your in-game ATK and Attack Speed (from Entity Inspector)
                    for accurate numbers. Accounts for Versatility, Mastery, Crit, Luck, ASPD breakpoints, Tachi procs, Storm Scythe, and all talent modifiers.
                </p>
            </div>

            {/* Config + Combat Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Config */}
                <div className="bg-[#111] border border-[#333] p-4 rounded-md">
                    <h3 className="text-[10px] text-[#666] uppercase tracking-wider font-bold mb-3">Simulation Config</h3>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] text-[#888] uppercase tracking-wider font-bold">ATK (character sheet)</label>
                            <input
                                type="number" value={manualAtk}
                                onChange={e => setManualAtk(Math.max(0, parseInt(e.target.value) || 0))}
                                className="bg-[#0a0a0a] border border-[#333] px-3 py-2 text-sm rounded text-white font-mono focus:border-[#555] outline-none"
                            />
                            <span className="text-[9px] text-[#555]">Effective ATK: <span className="text-white font-bold">{sim.effAtk.toLocaleString()}</span></span>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] text-[#888] uppercase tracking-wider font-bold">Attack Speed %</label>
                            <input
                                type="number" value={manualAspd} min={0} max={200}
                                onChange={e => setManualAspd(Math.max(0, Math.min(200, parseInt(e.target.value) || 0)))}
                                className="bg-[#0a0a0a] border border-[#333] px-3 py-2 text-sm rounded text-white font-mono focus:border-[#555] outline-none"
                                placeholder={`${(combat.aspd * 100).toFixed(0)}% (planner)`}
                            />
                            <span className="text-[9px] text-[#555]">
                                {manualAspd > 0
                                    ? <><span className="text-amber-400 font-bold">Override: {manualAspd}%</span> (planner: {(combat.aspd * 100).toFixed(0)}%)</>
                                    : <>0 = use planner ({(combat.aspd * 100).toFixed(0)}%). Enter AttrAttackSpeedPct \u00f7 100</>
                                }
                            </span>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] text-[#888] uppercase tracking-wider font-bold">Fight Duration (s)</label>
                            <input
                                type="number" value={fightDuration} min={10} max={300}
                                onChange={e => setFightDuration(Math.max(10, Math.min(300, parseInt(e.target.value) || 90)))}
                                className="bg-[#0a0a0a] border border-[#333] px-3 py-2 text-sm rounded text-white font-mono focus:border-[#555] outline-none"
                            />
                            <span className="text-[9px] text-[#555]">Min 10s, Max 300s</span>
                        </div>
                    </div>
                </div>
                {/* Combat Stats */}
                <div className="bg-[#111] border border-[#333] p-4 rounded-md">
                    <h3 className="text-[10px] text-[#666] uppercase tracking-wider font-bold mb-3">Combat Stats (from Planner)</h3>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs font-mono">
                        <StatRow label="Versatility" value={`${(combat.versPct * 100).toFixed(1)}%`} desc="General DMG amp" />
                        <StatRow label="Mastery" value={`${(combat.mastPct * 100).toFixed(1)}%`} desc="Skill DMG amp" />
                        <StatRow label="Crit Rate" value={`${(combat.critRate * 100).toFixed(1)}%`} />
                        <StatRow label="Luck Rate" value={`${(combat.luckRate * 100).toFixed(1)}%`} />
                        <StatRow label="Crit DMG" value={`×${combat.critMult.toFixed(2)}`} />
                        <StatRow label="Lucky Strike DMG" value={`×${combat.luckMult.toFixed(2)}`} />
                        <StatRow label="Attack Speed" value={`${(sim.actualAspd * 100).toFixed(1)}%`} accent={manualAspd > 0 ? "#fbbf24" : undefined} />
                        <StatRow label="TC Bonus Attacks" value={`+${sim.actualAspd >= 0.80 ? 3 : sim.actualAspd >= 0.50 ? 2 : sim.actualAspd >= 0.25 ? 1 : 0}`} accent={accentColor} />
                        <StatRow label="Avg Hit Multiplier" value={`×${combat.avgCritLuck.toFixed(3)}`} />
                        <StatRow label="DMG Bonus (Boss)" value={`+${((combat.dmgBoss) * 100).toFixed(1)}%`} />
                        <StatRow label="Melee DMG Bonus" value={`+${((combat.meleeDmg) * 100).toFixed(1)}%`} />
                    </div>
                </div>
            </div>

            {/* ══════════════ Comparison Mode Toggle ══════════════ */}
            <div className="bg-[#111] border border-[#333] p-4 rounded-md">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                        <h3 className="text-[10px] text-[#666] uppercase tracking-wider font-bold">Gear Set Comparison</h3>
                        <button
                            onClick={() => { setCompareMode(!compareMode); if (compareMode) setSelectedSetIds([]) }}
                            className={`px-3 py-1 text-[9px] font-bold uppercase tracking-[1px] border rounded transition-all duration-200 ${compareMode
                                ? "border-emerald-500/60 text-emerald-400 bg-emerald-500/10 shadow-[0_0_8px_rgba(16,185,129,0.15)]"
                                : "border-[#444] text-[#666] hover:border-[#555] hover:text-[#888]"
                                }`}
                        >
                            {compareMode ? <><Check className="w-3 h-3 inline" /> Comparison Mode Active</> : "Enable Comparison"}
                        </button>
                    </div>
                    {compareMode && gearSets.length > 0 && (
                        <span className="text-[9px] text-[#555]">Select 2+ sets to compare DPS curves</span>
                    )}
                </div>

                {compareMode && (
                    <div className="flex flex-col gap-3">
                        {gearSets.length === 0 ? (
                            <div className="text-center py-4">
                                <p className="text-[#555] text-sm">No gear sets saved.</p>
                                <p className="text-[#444] text-xs mt-1">Save gear sets in the Gear Sets section to compare them here.</p>
                            </div>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {gearSets.map((set, idx) => {
                                    const isSelected = selectedSetIds.includes(set.id)
                                    const color = SET_COLORS[idx % SET_COLORS.length]
                                    return (
                                        <button
                                            key={set.id}
                                            onClick={() => {
                                                if (isSelected) {
                                                    setSelectedSetIds(prev => prev.filter(id => id !== set.id))
                                                } else {
                                                    setSelectedSetIds(prev => [...prev, set.id])
                                                }
                                            }}
                                            className={`flex items-center gap-2 px-3 py-2 rounded border transition-all duration-200 ${isSelected
                                                ? "border-[#555] bg-[#1a1a1a]"
                                                : "border-[#333] bg-[#0a0a0a] hover:border-[#444]"
                                                }`}
                                            style={isSelected ? { borderColor: color } : {}}
                                        >
                                            <div
                                                className="w-2.5 h-2.5 rounded-full"
                                                style={{ backgroundColor: isSelected ? color : "#444" }}
                                            />
                                            <span className={`text-[11px] font-semibold ${isSelected ? "text-white" : "text-[#888]"}`}>
                                                {set.name}
                                            </span>
                                            {isSelected && (
                                                <Check className="w-3 h-3 text-[#555]" />
                                            )}
                                        </button>
                                    )
                                })}
                            </div>
                        )}
                        {selectedSetIds.length > 0 && (
                            <div className="text-[9px] text-[#555]">
                                {selectedSetIds.length} set{selectedSetIds.length > 1 ? "s" : ""} selected
                                {selectedSetIds.length < 2 && " — select at least 2 for comparison"}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* ══════════════ Rotation Builder ══════════════ */}
            <div className="bg-[#111] border border-[#333] p-4 rounded-md">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                        <h3 className="text-[10px] text-[#666] uppercase tracking-wider font-bold">Rotation Builder</h3>
                        <button
                            onClick={() => setUseCustomRotation(!useCustomRotation)}
                            className={`px-3 py-1 text-[9px] font-bold uppercase tracking-[1px] border rounded transition-all duration-200 ${useCustomRotation
                                ? "border-emerald-500/60 text-emerald-400 bg-emerald-500/10 shadow-[0_0_8px_rgba(16,185,129,0.15)]"
                                : "border-[#444] text-[#666] hover:border-[#555] hover:text-[#888]"
                                }`}
                        >
                            {useCustomRotation ? "✓ Custom Rotation Active" : "Using Default Priority"}
                        </button>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setRotation(DEFAULT_ROTATION.map(r => ({ ...r })))}
                            className="px-2.5 py-1 text-[9px] font-bold uppercase tracking-[1px] border border-[#333] text-[#666] hover:text-[#aaa] hover:border-[#555] transition-colors rounded"
                        >
                            Reset
                        </button>
                        <button
                            onClick={() => setRotation([])}
                            className="px-2.5 py-1 text-[9px] font-bold uppercase tracking-[1px] border border-[#333] text-[#666] hover:text-red-400 hover:border-red-500/40 transition-colors rounded"
                        >
                            Clear
                        </button>
                    </div>
                </div>

                {/* Skill Palette */}
                <div className="mb-3">
                    <span className="text-[9px] text-[#555] uppercase tracking-wider font-bold block mb-2">Drag skills into the rotation below</span>
                    <div className="flex flex-wrap gap-1.5">
                        {ROTATION_SKILLS.map(key => {
                            const skill = skills[key]
                            if (!skill) return null
                            const color = SKILL_COLORS[skill.name] ?? "#888"
                            const badge = SKILL_TYPE_BADGE[key] || ""
                            return (
                                <div
                                    key={key}
                                    draggable
                                    onDragStart={e => onDragStartPalette(e, key)}
                                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded cursor-grab active:cursor-grabbing border border-[#333] hover:border-[#555] bg-[#0a0a0a] hover:bg-[#1a1a1a] transition-all duration-150 select-none group"
                                    style={{ borderLeftColor: color, borderLeftWidth: "3px" }}
                                    title={`${skill.name} — ${skill.type} | CD: ${skill.cd}s | MV: ${skill.mv}%`}
                                >
                                    <span className="text-[8px] font-bold px-1 py-0.5 rounded bg-[#222] text-[#666]">{badge}</span>
                                    <span className="text-[10px] font-bold text-[#ccc] group-hover:text-white transition-colors">{skill.name}</span>
                                    {skill.cd > 0 && <span className="text-[8px] text-[#555]">{skill.cd}s</span>}
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Rotation Timeline */}
                <div className="relative">
                    <span className="text-[9px] text-[#555] uppercase tracking-wider font-bold block mb-2">
                        Rotation Sequence {rotation.length > 0 && <span className="text-[#444]">({rotation.length} skills • loops)</span>}
                    </span>
                    <div
                        className={`min-h-[56px] rounded border-2 border-dashed p-2 flex flex-wrap gap-1 items-center transition-colors duration-200 ${rotation.length === 0 ? "border-[#333] bg-[#0a0a0a]" : "border-[#222] bg-[#080808]"
                            }`}
                        onDragOver={e => { e.preventDefault(); setDragOverIdx(rotation.length) }}
                        onDrop={onDropEnd}
                        onDragLeave={() => setDragOverIdx(null)}
                    >
                        {rotation.length === 0 && (
                            <span className="text-[#444] text-xs m-auto italic">Drag skills here to build your rotation...</span>
                        )}
                        {rotation.map((item, idx) => {
                            const skill = skills[item.key]
                            if (!skill) return null
                            const color = SKILL_COLORS[skill.name] ?? "#888"
                            const badge = SKILL_TYPE_BADGE[item.key] || ""
                            const isDropTarget = dragOverIdx === idx
                            // Event annotations
                            const cdInfo = skill.cd > 0 ? `CD: ${skill.cd}s` : null
                            const resInfo = skill.consumesBladeIntent ? `BI: ${skill.consumesBladeIntent}` : skill.consumesSigils ? `Sigils: ${skill.consumesSigils}` : null
                            const buffInfo = item.key === "VoltSurge" ? "ATK +10%" : item.key === "Stormflash" ? "BI +20/s" : item.key === "Imagine1" ? "Mast +13%" : item.key === "Imagine2" ? "Haste +13%" : null
                            return (
                                <div key={`${item.key}-${idx}`} className="flex items-center">
                                    {isDropTarget && (
                                        <div className="w-1 h-8 rounded-full mx-0.5 animate-pulse" style={{ backgroundColor: accentColor }} />
                                    )}
                                    <div
                                        draggable
                                        onDragStart={e => onDragStartRotation(e, idx)}
                                        onDragOver={e => onDragOver(e, idx)}
                                        onDrop={e => onDrop(e, idx)}
                                        className="relative flex flex-col items-center rounded cursor-grab active:cursor-grabbing border border-[#333] bg-[#111] hover:bg-[#1a1a1a] transition-all duration-150 select-none group"
                                        style={{ borderBottomColor: color, borderBottomWidth: "2px" }}
                                    >
                                        {/* Main skill row */}
                                        <div className="flex items-center gap-1 px-2 py-1">
                                            <span className="text-[7px] font-bold px-1 py-0.5 rounded bg-[#222] text-[#555]">{badge}</span>
                                            <span className="text-[9px] font-bold text-[#bbb]">{skill.name}</span>
                                            {/* Repeat badge */}
                                            {item.repeat > 1 && (
                                                <span className="text-[8px] font-black px-1 rounded bg-[#222] border border-[#444]" style={{ color: accentColor }}>×{item.repeat}</span>
                                            )}
                                            <button
                                                onClick={e => { e.stopPropagation(); removeFromRotation(idx) }}
                                                className="text-[#444] hover:text-red-400 text-[10px] ml-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                        {/* Event annotations */}
                                        <div className="flex gap-1 px-1.5 pb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {cdInfo && <span className="text-[7px] px-1 rounded-sm bg-[#1a1a1a] text-[#888] border border-[#292929]">{cdInfo}</span>}
                                            {resInfo && <span className="text-[7px] px-1 rounded-sm bg-amber-900/20 text-amber-500/80 border border-amber-800/30">{resInfo}</span>}
                                            {buffInfo && <span className="text-[7px] px-1 rounded-sm bg-emerald-900/20 text-emerald-400/80 border border-emerald-800/30">{buffInfo}</span>}
                                        </div>
                                        {/* Repeat count controls (on hover) */}
                                        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                            <button
                                                onClick={e => { e.stopPropagation(); setRepeat(idx, item.repeat - 1) }}
                                                className="text-[8px] w-3.5 h-3.5 flex items-center justify-center rounded bg-[#222] text-[#888] hover:text-white border border-[#333] hover:border-[#555]"
                                            >−</button>
                                            <span className="text-[7px] text-[#666] font-mono min-w-[14px] text-center">×{item.repeat}</span>
                                            <button
                                                onClick={e => { e.stopPropagation(); setRepeat(idx, item.repeat + 1) }}
                                                className="text-[8px] w-3.5 h-3.5 flex items-center justify-center rounded bg-[#222] text-[#888] hover:text-white border border-[#333] hover:border-[#555]"
                                            >+</button>
                                        </div>
                                        {/* Index badge */}
                                        <span className="absolute -top-1 -left-1 text-[7px] bg-[#222] text-[#555] rounded-full w-3 h-3 flex items-center justify-center font-mono">
                                            {idx + 1}
                                        </span>
                                    </div>
                                    {idx < rotation.length - 1 && (
                                        <span className="text-[#333] text-[8px] mx-0.5">→</span>
                                    )}
                                </div>
                            )
                        })}
                        {dragOverIdx === rotation.length && rotation.length > 0 && (
                            <div className="w-1 h-8 rounded-full mx-0.5 animate-pulse" style={{ backgroundColor: accentColor }} />
                        )}
                    </div>
                    {rotation.length > 0 && (
                        <div className="flex items-center gap-2 mt-2">
                            <span className="text-[8px] text-[#444] italic">↻ Rotation loops from start when reaching the end</span>
                            {!useCustomRotation && (
                                <span className="text-[8px] text-amber-500/70 font-bold">⚠ Enable "Custom Rotation" to simulate this sequence</span>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Results Banner */}
            <div className="bg-[#111] border border-[#333] p-4 rounded-md shadow-lg">
                <div className="flex flex-wrap justify-between items-center mb-4 border-b border-[#222] pb-4 gap-4">
                    <div className="flex gap-8">
                        <div className="flex flex-col">
                            <span className="text-[10px] text-[#666] uppercase tracking-wider font-bold">Total Damage ({Math.floor(fightDuration / 60)}:{String(fightDuration % 60).padStart(2, "0")})</span>
                            <span className="text-2xl font-black">{Math.round(sim.finalDmg).toLocaleString()}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] text-[#666] uppercase tracking-wider font-bold">Average DPS</span>
                            <span className="text-2xl font-black" style={{ color: accentColor }}>{Math.round(sim.finalDps).toLocaleString()}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] text-[#666] uppercase tracking-wider font-bold">Effective ATK</span>
                            <span className="text-2xl font-black text-[#888]">{sim.effAtk.toLocaleString()}</span>
                        </div>
                    </div>
                    <div className="flex gap-1">
                        {(["chart", "timeline", "breakdown", "log"] as const).map(tab => (
                            <button key={tab} onClick={() => setActiveTab(tab)}
                                className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-[1px] border transition-colors ${activeTab === tab ? "bg-[#222] text-white border-[#555]" : "border-[#333] text-[#666] hover:bg-[#1a1a1a]"}`}
                                style={activeTab === tab ? { borderColor: accentColor, color: accentColor } : {}}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Rotation Stats Strip */}
                <div className="flex flex-wrap gap-x-6 gap-y-1.5 pb-3 mb-3 border-b border-[#1a1a1a] text-[11px] font-mono">
                    <RotStat label="Thundercut" value={sim.rotStats.tcCasts} color="#22c55e" />
                    <RotStat label="Moonstrike" value={sim.rotStats.msCasts} color="#eab308" />
                    {sim.rotStats.lsCasts > 0 && <RotStat label="Lightning Strike" value={sim.rotStats.lsCasts} color="#38bdf8" />}
                    {sim.rotStats.cbCasts > 0 && <RotStat label="Chaos Breaker" value={sim.rotStats.cbCasts} color="#ec4899" />}
                    {sim.rotStats.dsCasts > 0 && <RotStat label="Divine Sickle" value={sim.rotStats.dsCasts} color="#e11d48" />}
                    <RotStat label="Scythe Wheel" value={sim.rotStats.swCasts} color="#ef4444" />
                    <RotStat
                        label="Stormflash uptime"
                        value={`${((sim.rotStats.sfUptime / fightDuration) * 100).toFixed(0)}%`}
                        color="#06b6d4"
                    />
                    <RotStat
                        label="Volt Surge uptime"
                        value={`${((sim.rotStats.vsUptime / fightDuration) * 100).toFixed(0)}%`}
                        color="#8b5cf6"
                    />
                    <span className="text-[#444] ml-auto text-[9px] self-center italic">
                        {useCustomRotation ? "Custom Rotation" : "Priority AI"}
                    </span>
                </div>

                {/* Timeline Tab - Comparison Mode */}
                {activeTab === "timeline" && compareMode && comparisonResults.length >= 2 && (
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="text-xs font-bold text-white">DPS Timeline Comparison</h4>
                                <p className="text-[10px] text-[#555]">
                                    Clean line comparison — easier to see differences
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {comparisonResults.map(result => (
                                    <div key={result.id} className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#0a0a0a] border border-[#222]">
                                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: result.color }} />
                                        <span className="text-[10px] text-[#aaa]">{result.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="h-[400px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={mergedComparisonData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                                    <XAxis dataKey="time" stroke="#666" tick={{ fill: "#666", fontSize: 12 }} tickFormatter={v => `${v}s`} />
                                    <YAxis stroke="#666" tick={{ fill: "#666", fontSize: 12 }} tickFormatter={v => fmtK(v)} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: "#000", border: "1px solid #333", borderRadius: "4px" }}
                                        itemStyle={{ color: "#fff" }}
                                        labelFormatter={l => `Time: ${l}s`}
                                        formatter={(value: any, name: string) => [`${Math.round(value).toLocaleString()} DPS`, name]}
                                    />
                                    <Legend wrapperStyle={{ paddingTop: "20px" }} />
                                    {comparisonResults.map((result, idx) => (
                                        <Line
                                            key={result.id}
                                            type="monotone"
                                            dataKey={`dps_${idx}`}
                                            stroke={result.color}
                                            strokeWidth={2.5}
                                            dot={false}
                                            name={result.name}
                                        />
                                    ))}
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {/* Timeline Tab - Normal Mode */}
                {activeTab === "timeline" && !(compareMode && comparisonResults.length >= 2) && (
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="text-xs font-bold text-white">Skill Timeline</h4>
                                <p className="text-[10px] text-[#555]">
                                    {useCustomRotation ? "Custom Rotation" : "Priority Rotation"} — 
                                    Each point = skill hit (size = damage)
                                </p>
                            </div>
                            <div className="text-[10px] text-[#666]">
                                {sim.timelineData.length} skill casts recorded
                            </div>
                        </div>
                        <div className="h-[400px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 120 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#222" horizontal={true} vertical={true} />
                                    <XAxis 
                                        type="number" 
                                        dataKey="time" 
                                        name="Time" 
                                        domain={[0, fightDuration]}
                                        stroke="#666" 
                                        tick={{ fill: "#888", fontSize: 11 }}
                                        tickFormatter={v => `${v}s`}
                                        label={{ value: "Time (s)", position: "bottomBottom", fill: "#555", fontSize: 10 }}
                                    />
                                    <YAxis 
                                        type="number" 
                                        dataKey="y" 
                                        name="Skill"
                                        domain={[-0.5, sim.skillOrder.length - 0.5]}
                                        stroke="#666" 
                                        tick={{ fill: "#aaa", fontSize: 10 }}
                                        tickFormatter={v => sim.skillOrder[v] || ""}
                                        ticks={sim.skillOrder.map((_, i) => i)}
                                        width={110}
                                    />
                                    <ZAxis type="number" dataKey="damage" range={[40, 400]} name="Damage" />
                                    <Tooltip 
                                        cursor={{ strokeDasharray: "3 3" }}
                                        contentStyle={{ backgroundColor: "#0a0a0a", border: "1px solid #333", borderRadius: "4px", padding: "8px 12px" }}
                                        itemStyle={{ color: "#fff" }}
                                        formatter={(value: any, name: string) => {
                                            if (name === "Time") return [`${value.toFixed(2)}s`, name]
                                            if (name === "Damage") return [`${value.toLocaleString()} DMG`, name]
                                            return [value, name]
                                        }}
                                        labelFormatter={(label: any) => `Time: ${label.toFixed(2)}s`}
                                    />
                                    {sim.skillOrder.map((skillName, idx) => {
                                        const skillPoints = sim.timelineData.filter(d => d.skill === skillName)
                                        const color = SKILL_COLORS[skillName] || "#888"
                                        return (
                                            <Scatter
                                                key={skillName}
                                                name={skillName}
                                                data={skillPoints}
                                                fill={color}
                                                fillOpacity={0.7}
                                                stroke={color}
                                                strokeWidth={1}
                                            />
                                        )
                                    })}
                                </ScatterChart>
                            </ResponsiveContainer>
                        </div>
                        {/* Skill Legend */}
                        <div className="flex flex-wrap gap-2 pt-2 border-t border-[#222]">
                            {sim.skillOrder.map((skillName, idx) => (
                                <div key={skillName} className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#0a0a0a] border border-[#222]">
                                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: SKILL_COLORS[skillName] || "#888" }} />
                                    <span className="text-[10px] text-[#aaa]">{skillName}</span>
                                    <span className="text-[9px] text-[#555]">({sim.timelineData.filter(d => d.skill === skillName).length})</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Comparison Chart Tab - shown when comparison mode is active with 2+ sets */}
                {activeTab === "chart" && compareMode && comparisonResults.length >= 2 && (
                    <div className="flex flex-col gap-4">
                        {/* Comparison Summary - compact inline strip */}
                        <div className="flex flex-wrap gap-2 pb-3 border-b border-[#222]">
                            {comparisonResults.map((result, idx) => (
                                <div key={result.id} className="flex items-center gap-2 px-2.5 py-1.5 rounded bg-[#0a0a0a] border border-[#333]">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: result.color }} />
                                    <span className="text-[10px] font-bold text-white">{result.name}</span>
                                    <span className="text-[11px] font-black" style={{ color: result.color }}>{Math.round(result.finalDps).toLocaleString()}</span>
                                    <span className="text-[9px] text-[#555]">DPS</span>
                                    {idx > 0 && (
                                        <span className="text-[9px] font-bold" style={{ color: result.finalDps > comparisonResults[0].finalDps ? "#22c55e" : "#ef4444" }}>
                                            {result.finalDps > comparisonResults[0].finalDps ? "+" : ""}{((result.finalDps - comparisonResults[0].finalDps) / comparisonResults[0].finalDps * 100).toFixed(1)}%
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                        {/* Multi-line DPS Chart */}
                        <div className="h-[400px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={mergedComparisonData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                    <defs>
                                        {comparisonResults.map((result, idx) => (
                                            <linearGradient key={`grad-${idx}`} id={`colorComp-${idx}`} x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={result.color} stopOpacity={0.4} />
                                                <stop offset="95%" stopColor={result.color} stopOpacity={0.05} />
                                            </linearGradient>
                                        ))}
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                                    <XAxis dataKey="time" stroke="#666" tick={{ fill: "#666", fontSize: 12 }} tickFormatter={v => `${v}s`} />
                                    <YAxis stroke="#666" tick={{ fill: "#666", fontSize: 12 }} tickFormatter={v => fmtK(v)} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: "#000", border: "1px solid #333", borderRadius: "4px" }}
                                        itemStyle={{ color: "#fff" }}
                                        labelFormatter={l => `Time: ${l}s`}
                                        formatter={(value: any, name: string) => [`${Math.round(value).toLocaleString()} DPS`, name]}
                                    />
                                    <Legend wrapperStyle={{ paddingTop: "20px" }} />
                                    {comparisonResults.map((result, idx) => (
                                        <Area
                                            key={result.id}
                                            type="monotone"
                                            dataKey={`dps_${idx}`}
                                            stroke={result.color}
                                            strokeWidth={2}
                                            fill={`url(#colorComp-${idx})`}
                                            name={result.name}
                                        />
                                    ))}
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {/* Normal Chart Tab - shown when not in comparison mode */}
                {activeTab === "chart" && !(compareMode && comparisonResults.length >= 2) && (
                    <div className="h-[400px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={sim.data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorDps" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={accentColor} stopOpacity={0.3} />
                                        <stop offset="95%" stopColor={accentColor} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                                <XAxis dataKey="time" stroke="#666" tick={{ fill: "#666", fontSize: 12 }} tickFormatter={v => `${v}s`} />
                                <YAxis yAxisId="left" stroke="#666" tick={{ fill: "#666", fontSize: 12 }} tickFormatter={v => fmtK(v)} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: "#000", border: "1px solid #333", borderRadius: "4px" }}
                                    itemStyle={{ color: "#fff" }}
                                    labelFormatter={l => `Time: ${l}s`}
                                    formatter={(value: any, name: string) => {
                                        if (name === "Current DPS") return [`${Math.round(value).toLocaleString()} DPS`, name]
                                        if (name === "Cumulative Damage") return [`${Math.round(value).toLocaleString()} DMG`, name]
                                        return [value, name]
                                    }}
                                />
                                <Legend wrapperStyle={{ paddingTop: "20px" }} />
                                <Area yAxisId="left" type="monotone" dataKey="damage" stroke={accentColor} fillOpacity={1} fill="url(#colorDps)" name="Cumulative Damage" />
                                <Line yAxisId="left" type="stepAfter" dataKey="dps" stroke="#fff" strokeWidth={2} dot={false} name="Current DPS" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {/* Breakdown Tab */}
                {activeTab === "breakdown" && (
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between border-b border-[#222] pb-2">
                            <div>
                                <h4 className="text-xs font-bold text-white">Damage Breakdown</h4>
                                <p className="text-[10px] text-[#555]">
                                    {useCustomRotation ? "Custom Rotation" : "Priority Rotation"} — 
                                    {sim.breakdown.length} skill types dealt damage
                                </p>
                            </div>
                            <div className="text-[10px] text-[#666]">
                                Top: {sim.breakdown[0]?.name || "-"} ({sim.breakdown[0]?.pct || 0}%)
                            </div>
                        </div>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={sim.breakdown.slice(0, 12)} margin={{ top: 10, right: 30, left: 0, bottom: 40 }} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" stroke="#222" horizontal={false} />
                                    <XAxis type="number" stroke="#666" tick={{ fill: "#666", fontSize: 11 }} tickFormatter={v => fmtK(v)} />
                                    <YAxis type="category" dataKey="name" stroke="#666" tick={{ fill: "#aaa", fontSize: 11 }} width={110} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: "#000", border: "1px solid #333", borderRadius: "4px" }}
                                        formatter={(value: any) => [Math.round(value).toLocaleString() + " DMG", "Total Damage"]}
                                    />
                                    <Bar dataKey="damage" radius={[0, 4, 4, 0]}>
                                        {sim.breakdown.slice(0, 12).map((s, i) => (
                                            <Cell key={i} fill={s.color} fillOpacity={0.85} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs font-mono">
                                <thead>
                                    <tr className="border-b border-[#333] text-[#666]">
                                        <th className="text-left py-2 pr-4">Skill</th>
                                        <th className="text-right py-2 px-3">Damage</th>
                                        <th className="text-right py-2 px-3">%</th>
                                        <th className="text-right py-2 px-3">DPS</th>
                                        <th className="text-right py-2 pl-3">Casts</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sim.breakdown.map((s, i) => (
                                        <tr key={i} className="border-b border-[#1a1a1a] hover:bg-[#0d0d0d]">
                                            <td className="py-1.5 pr-4 flex items-center gap-2">
                                                <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: s.color }} />
                                                {s.name}
                                            </td>
                                            <td className="text-right py-1.5 px-3 text-white">{s.damage.toLocaleString()}</td>
                                            <td className="text-right py-1.5 px-3" style={{ color: accentColor }}>{s.pct.toFixed(1)}%</td>
                                            <td className="text-right py-1.5 px-3 text-[#4ade80]">{s.dps.toLocaleString()}</td>
                                            <td className="text-right py-1.5 pl-3 text-[#888]">{s.casts}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Log Tab */}
                {activeTab === "log" && (
                    <div className="flex flex-col gap-1 h-[400px] overflow-y-auto pr-4 custom-scrollbar bg-[#0a0a0a] p-3 border border-[#222] rounded-md font-mono text-xs">
                        {sim.log.map((entry, idx) => {
                            const bracket = entry.indexOf("]")
                            const timeStr = entry.slice(0, bracket + 1)
                            const rest = entry.slice(bracket + 1)
                            return (
                                <div key={idx} className="flex gap-4 border-b border-[#1a1a1a] py-1.5">
                                    <span className="text-[#555] w-14 shrink-0 text-right">{timeStr}</span>
                                    <span className="text-[#bbb]">{rest}</span>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}

// Small helper component for the combat stats grid
function StatRow({ label, value, desc, accent }: { label: string; value: string; desc?: string; accent?: string }) {
    return (
        <div className="flex justify-between items-baseline py-0.5">
            <span className="text-[#888]">{label}</span>
            <span className={accent ? "font-bold" : "text-white"} style={accent ? { color: accent } : undefined}>
                {value}
            </span>
        </div>
    )
}

// Helper component for rotation stats strip
function RotStat({ label, value, color }: { label: string; value: number | string; color: string }) {
    return (
        <div className="flex items-baseline gap-1.5">
            <span className="text-[#666]">{label}</span>
            <span className="font-bold" style={{ color }}>{value}</span>
        </div>
    )
}
