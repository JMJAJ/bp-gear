import type { RotationItem, SkillDef } from "@/lib/sim/moonstrike-types"

export const BASE_MS_SKILLS: Record<string, SkillDef> = {
    OblivionCombo: {
        name: "Oblivion Combo", cd: 60, castTime: 3.5, mv: 904.4, flat: 2600, hits: 7,
        element: "Thunder", type: "Ultimate", grantsSigils: 4,
    },
    VoltSurge: {
        name: "Volt Surge", cd: 45, castTime: 0.3, mv: 0, flat: 0, hits: 0,
        element: "None", type: "Buff",
    },
    Stormflash: {
        name: "Stormflash", cd: 45, castTime: 0.5, mv: 0, flat: 0, hits: 0,
        element: "Thunder", type: "Expertise",
    },
    ScytheWheel: {
        name: "Scythe Wheel", cd: 30, castTime: 1.2, mv: 420, flat: 1200, hits: 7,
        element: "Thunder", type: "Expertise", grantsBladeIntent: 3,
    },
    Imagine1: {
        name: "Blackfire Foxen", cd: 80, castTime: 1.0, mv: 1312.4, flat: 74, hits: 3,
        element: "Physical", type: "Imagine",
    },
    Imagine2: {
        name: "Emerald Caprahorn", cd: 80, castTime: 1.0, mv: 1143.74, flat: 74, hits: 2,
        element: "Physical", type: "Imagine",
    },
    Thundercut: {
        name: "Thundercut", cd: 0, castTime: 0.55, mv: 210, flat: 600, hits: 2,
        element: "Thunder", type: "Expertise", consumesBladeIntent: 50, scalesWithAspd: true,
    },
    Thundercleave: {
        name: "Thundercleave", cd: 0, castTime: 0.7, mv: 1260, flat: 3600, hits: 3,
        element: "Thunder", type: "Expertise", consumesBladeIntent: 50, scalesWithAspd: true,
    },
    Moonstrike: {
        name: "Moonstrike", cd: 0, castTime: 0.65, mv: 140, flat: 400, hits: 1,
        element: "Thunder", type: "Special", consumesSigils: 3, scalesWithAspd: true,
    },
    ChaosBreaker: {
        name: "Chaos Breaker", cd: 10, castTime: 0.8, mv: 350, flat: 1000, hits: 2,
        element: "Thunder", type: "Expertise", grantsBladeIntent: 40, consumesSigils: 3, grantsChargeSeeds: 2,
    },
    DivineSickle: {
        name: "Divine Sickle", cd: 0, castTime: 0.8, mv: 2200, flat: 3000, hits: 1,
        element: "Thunder", type: "Expertise",
    },
    Overdrive: {
        name: "Overdrive", cd: 40, castTime: 0.3, mv: 0, flat: 0, hits: 0,
        element: "None", type: "Expertise", grantsSigils: 1,
    },
    PiercingSlash: {
        name: "Piercing Slash", cd: 1.0, castTime: 0.3, mv: 140, flat: 400, hits: 2,
        element: "Thunder", type: "Special", grantsSigils: 1,
    },
    BasicAttack: {
        name: "Basic Attack", cd: 0, castTime: 1.8, mv: 294, flat: 837, hits: 4,
        element: "Thunder", type: "Basic", scalesWithAspd: true, grantsBladeIntent: 4,
    },
}

export function buildMoonstrikeSkills(im1Name: string, im2Name: string): Record<string, SkillDef> {
    return {
        ...BASE_MS_SKILLS,
        Imagine1: { ...BASE_MS_SKILLS.Imagine1, name: im1Name },
        Imagine2: { ...BASE_MS_SKILLS.Imagine2, name: im2Name },
    }
}

export const SKILL_COLORS: Record<string, string> = {
    "Oblivion Combo": "#f59e0b", "Volt Surge": "#8b5cf6", "Stormflash": "#06b6d4",
    "Scythe Wheel": "#ef4444", "Lightning Strike": "#38bdf8",
    "Piercing Slash": "#a855f7", "Blackfire Foxen": "#f97316", "Emerald Caprahorn": "#fb923c",
    "Thundercut": "#22c55e", "Thundercleave": "#16a34a", "Moonstrike": "#eab308",
    "Chaos Breaker": "#ec4899", "Divine Sickle": "#e11d48", "Moonblades": "#a78bfa",
    "Moonblade Whirl": "#c084fc", "Thunderstrike": "#fbbf24", "Overdrive": "#94a3b8",
    "Basic Attack": "#6b7280", "Storm Scythe": "#dc2626",
    "Fantasia Impact": "#d946ef", "Lucky Strike (Tachi)": "#fcd34d",
}

export const SKILL_TYPE_BADGE: Record<string, string> = {
    OblivionCombo: "ULT", VoltSurge: "BUF", Stormflash: "BUF",
    ScytheWheel: "EXP", Imagine1: "IMG", Imagine2: "IMG",
    Thundercut: "EXP", Thundercleave: "EXP", Moonstrike: "SPC",
    ChaosBreaker: "EXP", Overdrive: "EXP", DivineSickle: "PRC",
}

export const ROTATION_SKILLS = [
    "OblivionCombo", "VoltSurge", "Stormflash", "ScytheWheel",
    "Imagine1", "Imagine2", "Overdrive",
    "Thundercut", "Moonstrike", "ChaosBreaker", "DivineSickle", "BasicAttack",
] as const

export const DEFAULT_ROTATION: RotationItem[] = [
    { key: "Imagine1", repeat: 1 },
    { key: "Imagine2", repeat: 1 },
    { key: "Stormflash", repeat: 1 },
    { key: "VoltSurge", repeat: 1 },
    { key: "ScytheWheel", repeat: 1 },
    { key: "Thundercut", repeat: 21 },
    { key: "ChaosBreaker", repeat: 1 },
    { key: "Thundercut", repeat: 14 },
    { key: "Moonstrike", repeat: 2 },
    { key: "Thundercut", repeat: 17 },
    { key: "Moonstrike", repeat: 4 },
    { key: "Thundercut", repeat: 8 },
    { key: "Moonstrike", repeat: 10 },
    { key: "Thundercut", repeat: 2 },
    { key: "ScytheWheel", repeat: 1 },
    { key: "Moonstrike", repeat: 2 },
    { key: "Thundercut", repeat: 8 },
    { key: "Stormflash", repeat: 1 },
    { key: "Thundercut", repeat: 24 },
    { key: "VoltSurge", repeat: 1 },
    { key: "Thundercut", repeat: 5 },
    { key: "ChaosBreaker", repeat: 1 },
    { key: "Thundercut", repeat: 7 },
    { key: "Moonstrike", repeat: 2 },
    { key: "Thundercut", repeat: 6 },
    { key: "Moonstrike", repeat: 2 },
    { key: "Thundercut", repeat: 2 },
    { key: "ScytheWheel", repeat: 1 },
    { key: "Thundercut", repeat: 9 },
    { key: "Moonstrike", repeat: 4 },
    { key: "Thundercut", repeat: 2 },
    { key: "Moonstrike", repeat: 6 },
    { key: "Thundercut", repeat: 4 },
    { key: "Moonstrike", repeat: 14 },
    { key: "Stormflash", repeat: 1 },
    { key: "Imagine1", repeat: 1 },
    { key: "Thundercut", repeat: 9 },
    { key: "Imagine2", repeat: 1 },
    { key: "Thundercut", repeat: 15 },
]