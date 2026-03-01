// ── Psychoscope / Emblem Data ────────────────────────────────────────
// Source: Maxroll.gg Emblem Guide (Blue Protocol: Star Resonance S2)

const IC = "https://assets-ng.maxroll.gg/sr-tools/assets/db/icons"

// ── Helper: icon shorthand ──

/** Season-talent node icon */
const ni = (f: string) => `${IC}/items/season-talent/effects/ordinary/${f}.webp`
/** Factor item icon (miscellaneous) */
const fi = (f: string) => `${IC}/items/miscellaneous/${f}.webp`
/** Skill icon */
const si = (f: string) => `${IC}/skills/${f}.webp`
/** Attribute icon */
const ai = (f: string) => `${IC}/attributes/fight/${f}.webp`

// ── Types ──

export interface PsychoscopeNode {
  name: string
  icon?: string
  type: "skill" | "phantom_factor"
  /** e.g. "General ATK", "General DEF", "Class-Exclusive", "Class DEF", "Class Rhapsody" */
  factorType?: string
  /** When type=skill and there's a branch (split), mark as "left"|"middle"|"right" */
  branch?: "left" | "middle" | "right"
}

export interface MindProjection {
  id: string
  name: string
  unlock: string
  category: "deep-slumber" | "slumbering-dream"
  nodes: PsychoscopeNode[]
  bondExclusive: string
  bondExclusiveUnlock: number
}

export interface BondGeneral {
  level: number
  effect: string
}

export interface Factor {
  name: string
  icon: string
  description: string
  skillIcons?: string[]
}

export interface ClassFactorSet {
  className: string
  factors: Factor[]
  stasis: Factor[]
}

// ── Bond General Effects ──

export const BOND_GENERALS: BondGeneral[] = [
  { level: 2,  effect: "Illusion Strength +100; Endurance +500" },
  { level: 5,  effect: "Illusion Strength +100; Endurance +500" },
  { level: 12, effect: "Highest stat among Crit/Haste/Luck/Mastery/Versatility +300; Endurance +500" },
  { level: 20, effect: "Illusion Strength +100; Endurance +500" },
  { level: 25, effect: "Highest stat among Crit/Haste/Luck/Mastery/Versatility +300; Endurance +500" },
]

// ── Deep-Slumber Mind Projections ──

export const MIND_PROJECTIONS: MindProjection[] = [
  {
    id: "dreamforce",
    name: "Dreamforce",
    unlock: "Unlocked by Default",
    category: "deep-slumber",
    nodes: [
      { name: "Dreamforce",            icon: ni("s2talent05_01"), type: "skill" },
      { name: "Dream Massacre",         icon: ni("s2talent05_02"), type: "skill", branch: "left" },
      { name: "Boundary",              icon: ni("s2talent05_03"), type: "skill", branch: "right" },
      { name: "General ATK",           type: "phantom_factor", factorType: "General ATK" },
      { name: "General DEF",           type: "phantom_factor", factorType: "General DEF" },
      { name: "Class-Exclusive",       type: "phantom_factor", factorType: "Class-Exclusive" },
      { name: "Unbreaking Might",      icon: ni("s2talent05_04"), type: "skill", branch: "left" },
      { name: "Godspeed",             icon: ni("s2talent05_05"), type: "skill", branch: "right" },
      { name: "General ATK",           type: "phantom_factor", factorType: "General ATK" },
      { name: "General DEF",           type: "phantom_factor", factorType: "General DEF", branch: "left" },
      { name: "Class DEF",            type: "phantom_factor", factorType: "Class DEF", branch: "right" },
      { name: "Class-Exclusive",       type: "phantom_factor", factorType: "Class-Exclusive" },
      { name: "Conserve",             icon: ni("s2talent05_06"), type: "skill", branch: "left" },
      { name: "Beauty of Refinement",  icon: ni("s2talent03_06"), type: "skill", branch: "right" },
      { name: "General ATK",           type: "phantom_factor", factorType: "General ATK" },
      { name: "Class-Exclusive",       type: "phantom_factor", factorType: "Class-Exclusive" },
      { name: "General DEF",           type: "phantom_factor", factorType: "General DEF" },
      { name: "Chrono Elixir",        icon: ni("s2talent01_08"), type: "skill", branch: "left" },
      { name: "Blink Breath",         icon: ni("s2talent01_09"), type: "skill", branch: "right" },
      { name: "Amplify - Rare",       icon: ni("s2talent05_07"), type: "skill" },
    ],
    bondExclusive: "Dream DMG +2%",
    bondExclusiveUnlock: 35,
  },
  {
    id: "shattered-illusion",
    name: "Shattered Illusion",
    unlock: "Deep-Slumber Lvl 5",
    category: "deep-slumber",
    nodes: [
      { name: "Shattered Illusion",        icon: ni("s2talent07_01"), type: "skill" },
      { name: "Illusory Countershock",     icon: ni("s2talent07_02"), type: "skill", branch: "left" },
      { name: "General ATK",               type: "phantom_factor", factorType: "General ATK" },
      { name: "General DEF",               type: "phantom_factor", factorType: "General DEF" },
      { name: "Class-Exclusive",           type: "phantom_factor", factorType: "Class-Exclusive" },
      { name: "Judgment - Sharp",          icon: ni("s2talent07_03"), type: "skill", branch: "left" },
      { name: "Judgment - Break",          icon: ni("s2talent07_04"), type: "skill", branch: "right" },
      { name: "General ATK",               type: "phantom_factor", factorType: "General ATK" },
      { name: "General DEF",               type: "phantom_factor", factorType: "General DEF", branch: "left" },
      { name: "Class DEF",                 type: "phantom_factor", factorType: "Class DEF", branch: "right" },
      { name: "Class-Exclusive",           type: "phantom_factor", factorType: "Class-Exclusive" },
      { name: "Stasis Recovery",           icon: ni("s2talent07_05"), type: "skill", branch: "left" },
      { name: "Judgment - Heal",           icon: ni("s2talent07_06"), type: "skill", branch: "middle" },
      { name: "Chrono Elixir",             icon: ni("s2talent01_08"), type: "skill", branch: "right" },
      { name: "General ATK",               type: "phantom_factor", factorType: "General ATK" },
      { name: "Class-Exclusive",           type: "phantom_factor", factorType: "Class-Exclusive" },
      { name: "General DEF",               type: "phantom_factor", factorType: "General DEF" },
      { name: "Surge",                     icon: ni("s2talent07_07"), type: "skill", branch: "left" },
      { name: "Resilience",                icon: ni("s2talent07_08"), type: "skill", branch: "right" },
      { name: "Uplift",                    icon: ni("s2talent07_09"), type: "skill" },
    ],
    bondExclusive: "Every 50 Armor grants 1 ATK",
    bondExclusiveUnlock: 35,
  },
  {
    id: "endless-mind",
    name: "Endless Mind",
    unlock: "Deep-Slumber Lvl 9",
    category: "deep-slumber",
    nodes: [
      { name: "Endless Mind",              icon: ni("s2talent08_01"), type: "skill" },
      { name: "Aegis of the Soul",         icon: ni("s2talent08_02"), type: "skill", branch: "left" },
      { name: "Safeguard",                 icon: ni("s2talent08_03"), type: "skill", branch: "right" },
      { name: "General ATK",               type: "phantom_factor", factorType: "General ATK" },
      { name: "General DEF",               type: "phantom_factor", factorType: "General DEF" },
      { name: "Class-Exclusive",           type: "phantom_factor", factorType: "Class-Exclusive" },
      { name: "Swiftflow",                 icon: ni("s2talent08_04"), type: "skill", branch: "left" },
      { name: "Resurge",                   icon: ni("s2talent08_05"), type: "skill", branch: "right" },
      { name: "General ATK",               type: "phantom_factor", factorType: "General ATK" },
      { name: "General DEF",               type: "phantom_factor", factorType: "General DEF", branch: "left" },
      { name: "Class DEF",                 type: "phantom_factor", factorType: "Class DEF", branch: "right" },
      { name: "Class-Exclusive",           type: "phantom_factor", factorType: "Class-Exclusive" },
      { name: "Still-Continuum",           icon: ni("s2talent08_06"), type: "skill", branch: "left" },
      { name: "Split Brilliance",          icon: ni("s2talent08_07"), type: "skill", branch: "right" },
      { name: "Class-Exclusive",           type: "phantom_factor", factorType: "Class-Exclusive" },
      { name: "General ATK",                type: "phantom_factor", factorType: "General ATK" },
      { name: "General DEF",               type: "phantom_factor", factorType: "General DEF" },
      { name: "Chrono Elixir",             icon: ni("s2talent01_08"), type: "skill", branch: "left" },
      { name: "Blink Breath",              icon: ni("s2talent01_09"), type: "skill", branch: "right" },
      { name: "Finale Chant",              icon: ni("s2talent08_08"), type: "skill" },
    ],
    bondExclusive: "Current main stats +100",
    bondExclusiveUnlock: 35,
  },
  {
    id: "oblivion-dream",
    name: "Oblivion Dream",
    unlock: "Deep-Slumber Lvl 15",
    category: "deep-slumber",
    nodes: [
      { name: "Oblivion Dream",             icon: ni("s2talent06_01"), type: "skill" },
      { name: "Bloodbound Surge",           icon: ni("s2talent06_02"), type: "skill", branch: "left" },
      { name: "Dream Obsession",            icon: ni("s2talent06_03"), type: "skill", branch: "right" },
      { name: "General ATK",                type: "phantom_factor", factorType: "General ATK" },
      { name: "General DEF",                type: "phantom_factor", factorType: "General DEF" },
      { name: "Class-Exclusive",            type: "phantom_factor", factorType: "Class-Exclusive" },
      { name: "Chrono Elixir",              icon: ni("s2talent01_08"), type: "skill", branch: "left" },
      { name: "Limit Extension",            icon: ni("s2talent06_04"), type: "skill", branch: "right" },
      { name: "General ATK",                type: "phantom_factor", factorType: "General ATK" },
      { name: "General DEF",                type: "phantom_factor", factorType: "General DEF", branch: "left" },
      { name: "Class DEF",                  type: "phantom_factor", factorType: "Class DEF", branch: "right" },
      { name: "Class-Exclusive",            type: "phantom_factor", factorType: "Class-Exclusive" },
      { name: "Harmony Grace",              icon: ni("s2talent06_05"), type: "skill", branch: "left" },
      { name: "Tuning",                     icon: ni("s2talent06_06"), type: "skill", branch: "right" },
      { name: "Class-Exclusive",            type: "phantom_factor", factorType: "Class-Exclusive" },
      { name: "General ATK",                type: "phantom_factor", factorType: "General ATK" },
      { name: "General DEF",                type: "phantom_factor", factorType: "General DEF" },
      { name: "Domain Suppression",         icon: ni("s2talent06_07"), type: "skill", branch: "left" },
      { name: "Beauty of Refinement",       icon: ni("s2talent03_06"), type: "skill", branch: "right" },
      { name: "Feint Strike",               icon: ni("s2talent06_08"), type: "skill" },
    ],
    bondExclusive: "Attacks vs Oblivion Dream targets: Crit +2%, Luck +2%",
    bondExclusiveUnlock: 35,
  },
  {
    id: "fantasia-impact",
    name: "Fantasia Impact",
    unlock: "Deep-Slumber Lvl 17",
    category: "deep-slumber",
    nodes: [
      { name: "Fantasia Impact",            icon: ni("s2talent01_01"), type: "skill" },
      { name: "Linkage",                    icon: ni("s2talent01_02"), type: "skill", branch: "left" },
      { name: "Reconstruct",                icon: ni("s2talent01_03"), type: "skill", branch: "right" },
      { name: "General ATK",                type: "phantom_factor", factorType: "General ATK" },
      { name: "General DEF",                type: "phantom_factor", factorType: "General DEF" },
      { name: "Class-Exclusive",            type: "phantom_factor", factorType: "Class-Exclusive" },
      { name: "Time-Step",                  icon: ni("s2talent01_04"), type: "skill", branch: "left" },
      { name: "Multi-Phasic Strike",        icon: ni("s2talent01_05"), type: "skill", branch: "right" },
      { name: "General ATK",                type: "phantom_factor", factorType: "General ATK" },
      { name: "General DEF",                type: "phantom_factor", factorType: "General DEF", branch: "left" },
      { name: "Class DEF",                  type: "phantom_factor", factorType: "Class DEF", branch: "right" },
      { name: "Class-Exclusive",            type: "phantom_factor", factorType: "Class-Exclusive" },
      { name: "Ripple of Fate",             icon: ni("s2talent01_06"), type: "skill", branch: "left" },
      { name: "Dual",                       icon: ni("s2talent01_07"), type: "skill", branch: "right" },
      { name: "Class-Exclusive",            type: "phantom_factor", factorType: "Class-Exclusive", branch: "left" },
      { name: "General ATK",                type: "phantom_factor", factorType: "General ATK", branch: "right" },
      { name: "General DEF",                type: "phantom_factor", factorType: "General DEF" },
      { name: "Chrono Elixir",              icon: ni("s2talent01_08"), type: "skill", branch: "left" },
      { name: "Blink Breath",               icon: ni("s2talent01_09"), type: "skill", branch: "right" },
      { name: "Ultimate Fortune",           icon: ni("s2talent01_10"), type: "skill" },
    ],
    bondExclusive: "Luck +1%",
    bondExclusiveUnlock: 35,
  },
  {
    id: "phantom-execution",
    name: "Phantom Execution",
    unlock: "Deep-Slumber Lvl 24",
    category: "deep-slumber",
    nodes: [
      { name: "Phantom Execution",           icon: ni("s2talent02_01"), type: "skill" },
      { name: "Mirage Edge",                 icon: ni("s2talent02_02"), type: "skill", branch: "left" },
      { name: "Execution Force",             icon: ni("s2talent02_03"), type: "skill", branch: "right" },
      { name: "General ATK",                 type: "phantom_factor", factorType: "General ATK" },
      { name: "General DEF",                 type: "phantom_factor", factorType: "General DEF" },
      { name: "Class-Exclusive",             type: "phantom_factor", factorType: "Class-Exclusive" },
      { name: "Time-Slit",                   icon: ni("s2talent02_04"), type: "skill", branch: "left" },
      { name: "Instant",                     icon: ni("s2talent02_05"), type: "skill", branch: "right" },
      { name: "General ATK",                 type: "phantom_factor", factorType: "General ATK" },
      { name: "General DEF",                 type: "phantom_factor", factorType: "General DEF", branch: "left" },
      { name: "Class DEF",                   type: "phantom_factor", factorType: "Class DEF", branch: "right" },
      { name: "Class-Exclusive",             type: "phantom_factor", factorType: "Class-Exclusive" },
      { name: "Nirvana Leap",                icon: ni("s2talent02_06"), type: "skill", branch: "left" },
      { name: "Cinder of Reverie",           icon: ni("s2talent02_07"), type: "skill", branch: "right" },
      { name: "Class-Exclusive",             type: "phantom_factor", factorType: "Class-Exclusive" },
      { name: "General ATK",                 type: "phantom_factor", factorType: "General ATK" },
      { name: "General DEF",                 type: "phantom_factor", factorType: "General DEF" },
      { name: "Chrono Elixir",               icon: ni("s2talent01_08"), type: "skill", branch: "left" },
      { name: "Blink Breath",                icon: ni("s2talent01_09"), type: "skill", branch: "right" },
      { name: "Swift-Calc",                  icon: ni("s2talent02_08"), type: "skill" },
    ],
    bondExclusive: "Crit +1%",
    bondExclusiveUnlock: 35,
  },
  {
    id: "phantom-arrow",
    name: "Phantom Arrow",
    unlock: "Deep-Slumber Lvl 28",
    category: "deep-slumber",
    nodes: [
      { name: "Phantom Arrow",               icon: ni("s2talent03_01"), type: "skill" },
      { name: "Dual Time",                   icon: ni("s2talent03_02"), type: "skill", branch: "left" },
      { name: "Dreamarrow Storm",            icon: ni("s2talent03_03"), type: "skill", branch: "right" },
      { name: "General ATK",                 type: "phantom_factor", factorType: "General ATK" },
      { name: "General DEF",                 type: "phantom_factor", factorType: "General DEF" },
      { name: "Class-Exclusive",             type: "phantom_factor", factorType: "Class-Exclusive" },
      { name: "Mirage Shot",                 icon: ni("s2talent03_04"), type: "skill", branch: "left" },
      { name: "Eightfold Skyflow",            icon: ni("s2talent03_05"), type: "skill", branch: "right" },
      { name: "General ATK",                 type: "phantom_factor", factorType: "General ATK" },
      { name: "General DEF",                 type: "phantom_factor", factorType: "General DEF", branch: "left" },
      { name: "Class DEF",                   type: "phantom_factor", factorType: "Class DEF", branch: "right" },
      { name: "Class-Exclusive",             type: "phantom_factor", factorType: "Class-Exclusive" },
      { name: "Beauty of Refinement",        icon: ni("s2talent03_06"), type: "skill", branch: "left" },
      { name: "Phantom Pierce",              icon: ni("s2talent03_07"), type: "skill", branch: "right" },
      { name: "Class-Exclusive",             type: "phantom_factor", factorType: "Class-Exclusive" },
      { name: "General ATK",                 type: "phantom_factor", factorType: "General ATK" },
      { name: "General DEF",                 type: "phantom_factor", factorType: "General DEF" },
      { name: "Chrono Elixir",               icon: ni("s2talent01_08"), type: "skill", branch: "left" },
      { name: "Blink Breath",                icon: ni("s2talent01_09"), type: "skill", branch: "right" },
      { name: "Expert Technique",            icon: ni("s2talent03_08"), type: "skill" },
    ],
    bondExclusive: "Dream DMG +2%",
    bondExclusiveUnlock: 35,
  },
  {
    id: "mirage-dream",
    name: "Mirage Dream",
    unlock: "Deep-Slumber Lvl 30",
    category: "deep-slumber",
    nodes: [
      { name: "Mirage Dream",                icon: ni("s2talent04_01"), type: "skill" },
      { name: "Dual Ascension Formation",    icon: ni("s2talent04_02"), type: "skill", branch: "left" },
      { name: "Battlestart - Rare",          icon: ni("s2talent04_03"), type: "skill", branch: "right" },
      { name: "General ATK",                 type: "phantom_factor", factorType: "General ATK" },
      { name: "General DEF",                 type: "phantom_factor", factorType: "General DEF" },
      { name: "Class-Exclusive",             type: "phantom_factor", factorType: "Class-Exclusive" },
      { name: "Cross the Mirage",            icon: ni("s2talent04_04"), type: "skill", branch: "left" },
      { name: "Rapid Assault Stacks",        icon: ni("s2talent04_05"), type: "skill", branch: "right" },
      { name: "General ATK",                 type: "phantom_factor", factorType: "General ATK" },
      { name: "General DEF",                 type: "phantom_factor", factorType: "General DEF", branch: "left" },
      { name: "Class DEF",                   type: "phantom_factor", factorType: "Class DEF", branch: "right" },
      { name: "Class-Exclusive",             type: "phantom_factor", factorType: "Class-Exclusive" },
      { name: "Decimate",                    icon: ni("s2talent04_06"), type: "skill", branch: "left" },
      { name: "Beauty of Refinement",        icon: ni("s2talent03_06"), type: "skill", branch: "right" },
      { name: "General ATK",                 type: "phantom_factor", factorType: "General ATK" },
      { name: "Class-Exclusive",             type: "phantom_factor", factorType: "Class-Exclusive" },
      { name: "General DEF",                 type: "phantom_factor", factorType: "General DEF" },
      { name: "Immortal Stance",             icon: ni("s2talent04_07"), type: "skill", branch: "left" },
      { name: "Chrono Elixir",               icon: ni("s2talent01_08"), type: "skill", branch: "right" },
      { name: "Grace",                       icon: ni("s2talent04_08"), type: "skill" },
    ],
    bondExclusive: "Dream DMG +4%",
    bondExclusiveUnlock: 35,
  },
]

// ── Slumbering Dream Mind Projections (Roguelike gamemode) ──

export const SLUMBERING_PROJECTIONS: MindProjection[] = [
  {
    id: "overload-crit",
    name: "Overload Crit",
    unlock: "Slumbering Dream",
    category: "slumbering-dream",
    nodes: [
      { name: "Overload Crit",        icon: ni("s2talent051_01"), type: "skill" },
      { name: "Class Rhapsody",       type: "phantom_factor", factorType: "Class Rhapsody" },
      { name: "Tyrant's Desire",      icon: ni("s2talent051_02"), type: "skill" },
      { name: "Tyrant's Legacy",      icon: ni("s2talent051_03"), type: "skill" },
      { name: "Class-Exclusive",      type: "phantom_factor", factorType: "Class-Exclusive" },
      { name: "Tyrant's Desire",      icon: ni("s2talent051_02"), type: "skill" },
      { name: "General ATK",          type: "phantom_factor", factorType: "General ATK" },
      { name: "General DEF",          type: "phantom_factor", factorType: "General DEF" },
      { name: "Tyrant's Destiny",     icon: ni("s2talent051_04"), type: "skill" },
      { name: "Rare Lucky Star",      icon: ni("s2talent051_05"), type: "skill" },
      { name: "Class-Exclusive",      type: "phantom_factor", factorType: "Class-Exclusive" },
      { name: "Rare Lucky Star",      icon: ni("s2talent051_05"), type: "skill" },
      { name: "Class-Exclusive",      type: "phantom_factor", factorType: "Class-Exclusive" },
      { name: "General ATK",          type: "phantom_factor", factorType: "General ATK" },
      { name: "General DEF",          type: "phantom_factor", factorType: "General DEF" },
      { name: "Epic Boost",           icon: ni("s2talent051_06"), type: "skill" },
      { name: "Class Rhapsody",       type: "phantom_factor", factorType: "Class Rhapsody" },
      { name: "Tyrant's Desire",      icon: ni("s2talent051_02"), type: "skill" },
    ],
    bondExclusive: "",
    bondExclusiveUnlock: 0,
  },
  {
    id: "torrent-of-fate",
    name: "Torrent of Fate",
    unlock: "Slumbering Dream",
    category: "slumbering-dream",
    nodes: [],
    bondExclusive: "",
    bondExclusiveUnlock: 0,
  },
  {
    id: "imagine-acceleration",
    name: "Imagine Acceleration",
    unlock: "Slumbering Dream",
    category: "slumbering-dream",
    nodes: [],
    bondExclusive: "",
    bondExclusiveUnlock: 0,
  },
  {
    id: "coordinated-strike",
    name: "Coordinated Strike",
    unlock: "Slumbering Dream",
    category: "slumbering-dream",
    nodes: [],
    bondExclusive: "",
    bondExclusiveUnlock: 0,
  },
]

// ── Factors: Offensive (Polarity) ──

export const OFFENSIVE_FACTORS: Factor[] = [
  { name: "Polarity X1",  icon: fi("yinzi_s2_common_001"), description: "All Element +212.",                                                   skillIcons: [ai("common_icon03")] },
  { name: "Polarity X2",  icon: fi("yinzi_s2_common_002"), description: "Strength +75; Strength +2%.",                                         skillIcons: [ai("common_icon05")] },
  { name: "Polarity X3",  icon: fi("yinzi_s2_common_003"), description: "Intellect +75; Intellect +2%.",                                       skillIcons: [ai("common_icon06")] },
  { name: "Polarity X4",  icon: fi("yinzi_s2_common_004"), description: "Agility +75; Agility +2%.",                                           skillIcons: [ai("common_attrdexterity")] },
  { name: "Polarity X5",  icon: fi("yinzi_s2_common_005"), description: "Crit gained in any way +10%, but Mastery gained in any way −6%.",     skillIcons: [ai("common_icon12"), ai("common_attrmastery")] },
  { name: "Polarity X6",  icon: fi("yinzi_s2_common_006"), description: "Luck gained in any way +10%, but Haste gained in any way −6%.",       skillIcons: [ai("common_attrluck"), ai("common_attrhaste")] },
  { name: "Polarity X7",  icon: fi("yinzi_s2_common_007"), description: "Mastery gained in any way +10%, but Luck gained in any way −6%.",     skillIcons: [ai("common_attrmastery"), ai("common_attrluck")] },
  { name: "Polarity X8",  icon: fi("yinzi_s2_common_008"), description: "Haste gained in any way +10%, but Crit gained in any way −6%.",       skillIcons: [ai("common_attrhaste"), ai("common_icon12")] },
  { name: "Polarity X9",  icon: fi("yinzi_s2_common_009"), description: "Special attack Dream DMG +6.5%." },
  { name: "Polarity X10", icon: fi("yinzi_s2_common_010"), description: "Expertise Skill Dream DMG +7%." },
  { name: "Polarity X11", icon: fi("yinzi_s2_common_011"), description: "For 6s after casting an Expertise Skill, Versatility +120, stacking up to 5 times.", skillIcons: [ai("common_attrversatility")] },
]

// ── Factors: Defensive (Stasis) ──

export const DEFENSIVE_FACTORS: Factor[] = [
  { name: "Stasis X1", icon: fi("yinzi_s2_common_012"), description: "All Element Resistance +280.",                                                                              skillIcons: [ai("common_icon07")] },
  { name: "Stasis X2", icon: fi("yinzi_s2_common_013"), description: "Endurance +300; Endurance +2.4%.",                                                                          skillIcons: [ai("common_icon08")] },
  { name: "Stasis X3", icon: fi("yinzi_s2_common_014"), description: "Armor +390; Armor +2.5%.",                                                                                  skillIcons: [ai("common_attrdefense")] },
  { name: "Stasis X4", icon: fi("yinzi_s2_common_015"), description: "Max HP +6000; Max HP +1.5%.",                                                                               skillIcons: [ai("common_attrmaxhp")] },
  { name: "Stasis X5", icon: fi("yinzi_s2_common_016"), description: "Max HP +2000; when incoming damage exceeds current HP, that damage is reduced by 35% (up to once every 30s).", skillIcons: [ai("common_attrmaxhp")] },
  { name: "Stasis X6", icon: fi("yinzi_s2_common_017"), description: "If no damage is taken for 8s, Max HP +3.5% for the next 10s, stacking up to 3 times.",                     skillIcons: [ai("common_attrmaxhp")] },
  { name: "Stasis X7", icon: fi("yinzi_s2_common_018"), description: "Within 10s after casting your Ultimate Skill, Dream Resistance +15%.",                                      skillIcons: [ai("common_attrmdefense")] },
  { name: "Stasis X8", icon: fi("yinzi_s2_common_019"), description: "When taking any damage, restores 25% Max HP (up to once every 10s).",                                       skillIcons: [ai("common_attrmaxhp")] },
  { name: "Stasis X9", icon: fi("yinzi_s2_common_020"), description: "Healing Received +3%; Shield +5%.",                                                                         skillIcons: [ai("common_icon19"), ai("common_icon14")] },
]

// ── Factors: Class Exclusive ──

export const CLASS_FACTORS: ClassFactorSet[] = [
  {
    className: "Shield Knight",
    factors: [
      { name: "Shield Knight X1",  icon: fi("yinzi_s2_12_001"), description: "Valor Bash Dream DMG +40%.",                                                              skillIcons: [si("weapon_jd-01_tg01")] },
      { name: "Shield Knight X2",  icon: fi("yinzi_s2_12_002"), description: "Reckoning Dream DMG +16%.",                                                               skillIcons: [si("weapon_jd-01_kx04")] },
      { name: "Shield Knight X3",  icon: fi("yinzi_s2_12_003"), description: "Judgment, Scorching Judgment from Lightforged Greatsword Dream DMG +25%.",                 skillIcons: [si("weapon_jd-01_kx03")] },
      { name: "Shield Knight X4",  icon: fi("yinzi_s2_12_004"), description: "When in the Divine Circle, All Element DMG +8%.",                                         skillIcons: [si("weapon_jd-01_kx02")] },
      { name: "Shield Knight X5",  icon: fi("yinzi_s2_12_005"), description: "Aegis Ward duration +5s; Basic Attack, Condemn Dream DMG +37.5%.",                        skillIcons: [si("weapon_jd-01_kx06"), si("weapon_jd-01_atk")] },
      { name: "Shield Knight X6",  icon: fi("yinzi_s2_12_006"), description: "Each 1% Mastery grants 0.5% ATK.",                                                        skillIcons: [ai("common_attrmastery")] },
      { name: "Shield Knight X7",  icon: fi("yinzi_s2_12_007"), description: "Vanguard Strike, Vanguard Hunt from Bold Fearless Dream DMG +60%.",                       skillIcons: [si("weapon_jd-01_tg02")] },
      { name: "Shield Knight X8",  icon: fi("yinzi_s2_12_008"), description: "Sacred Blade Dream DMG +24%.",                                                            skillIcons: [si("weapon_jd-01_kx09")] },
      { name: "Shield Knight X9",  icon: fi("yinzi_s2_12_009"), description: "Zeal Crusade Dream DMG +30% (does not affect Zeal Rupture).",                              skillIcons: [si("weapon_jd-01_kx07")] },
      { name: "Shield Knight X10", icon: fi("yinzi_s2_12_010"), description: "Radiance charge count +1; Radiance Dream DMG +20%.",                                      skillIcons: [si("weapon_jd-01_kx08")] },
      { name: "Shield Knight X11", icon: fi("yinzi_s2_12_011"), description: "In the Divine Circle, ATK +12%.",                                                         skillIcons: [si("weapon_jd-01_kx02")] },
    ],
    stasis: [
      { name: "Shield Knight Stasis X1", icon: fi("yinzi_s2_common_029"), description: "Aegis Ward and Radiance CD −8s; After casting Aegis Ward or Radiance, the next Judgment costs no Holy Energy.", skillIcons: [si("weapon_jd-01_kx06"), si("weapon_jd-01_kx08"), si("weapon_jd-01_kx03")] },
      { name: "Shield Knight Stasis X2", icon: fi("yinzi_s2_common_030"), description: "After casting the Ultimate Skill, the next 5 hits restore 8.5% Max HP each.",                                   skillIcons: [ai("common_attrmaxhp")] },
    ],
  },
  {
    className: "Heavy Guardian",
    factors: [
      { name: "Heavy Guardian X1",  icon: fi("yinzi_s2_09_001"), description: "Shield Bash Dream DMG +40%." },
      { name: "Heavy Guardian X2",  icon: fi("yinzi_s2_09_002"), description: "Rage Burst Dream DMG +16%." },
      { name: "Heavy Guardian X3",  icon: fi("yinzi_s2_09_003"), description: "Sandshroud, Star Shatter Dream DMG +25%." },
      { name: "Heavy Guardian X4",  icon: fi("yinzi_s2_09_004"), description: "When Sandshroud is active, Rock Element DMG +8%." },
      { name: "Heavy Guardian X5",  icon: fi("yinzi_s2_09_005"), description: "Granite Fury duration +5s; Basic Attack Dream DMG +37.5%." },
      { name: "Heavy Guardian X6",  icon: fi("yinzi_s2_09_006"), description: "Each 1% Mastery grants 0.5% ATK." },
      { name: "Heavy Guardian X7",  icon: fi("yinzi_s2_09_007"), description: "Rock Guard, Earth Tremor Dream DMG +60%." },
      { name: "Heavy Guardian X8",  icon: fi("yinzi_s2_09_008"), description: "Rockfall Dream DMG +24%." },
      { name: "Heavy Guardian X9",  icon: fi("yinzi_s2_09_009"), description: "Rock Counter Dream DMG +30%." },
      { name: "Heavy Guardian X10", icon: fi("yinzi_s2_09_010"), description: "Sand Crystal max count +1; Sand Crystal Dream DMG +20%." },
      { name: "Heavy Guardian X11", icon: fi("yinzi_s2_09_011"), description: "When Sandshroud is active, ATK +12%." },
    ],
    stasis: [
      { name: "Heavy Guardian Stasis X1", icon: fi("yinzi_s2_common_031"), description: "Sandshroud and Granite Fury CD −8s; After casting Sandshroud or Granite Fury, the next Shield Bash costs no Sand Crystal." },
      { name: "Heavy Guardian Stasis X2", icon: fi("yinzi_s2_common_032"), description: "After casting the Ultimate Skill, the next 5 hits restore 8.5% Max HP each." },
    ],
  },
  {
    className: "Stormblade",
    factors: [
      { name: "Stormblade X1",  icon: fi("yinzi_s2_01_001"), description: "Overdrive Dream DMG +40%." },
      { name: "Stormblade X2",  icon: fi("yinzi_s2_01_002"), description: "Volt Surge Dream DMG +16%." },
      { name: "Stormblade X3",  icon: fi("yinzi_s2_01_003"), description: "Iaido Slash, Piercing Slash Dream DMG +25%." },
      { name: "Stormblade X4",  icon: fi("yinzi_s2_01_004"), description: "When Volt Surge is active, Thunder Element DMG +8%." },
      { name: "Stormblade X5",  icon: fi("yinzi_s2_01_005"), description: "Thunder Sigil max count +1; Basic Attack Dream DMG +37.5%." },
      { name: "Stormblade X6",  icon: fi("yinzi_s2_01_006"), description: "Each 1% Crit grants 0.5% ATK." },
      { name: "Stormblade X7",  icon: fi("yinzi_s2_01_007"), description: "Divine Sickle, Reversal Blade Dream DMG +60%." },
      { name: "Stormblade X8",  icon: fi("yinzi_s2_01_008"), description: "Shadow Blade Dream DMG +24%." },
      { name: "Stormblade X9",  icon: fi("yinzi_s2_01_009"), description: "Flash Strike Dream DMG +30%." },
      { name: "Stormblade X10", icon: fi("yinzi_s2_01_010"), description: "Thunder Sigil conversion bonus +20%." },
      { name: "Stormblade X11", icon: fi("yinzi_s2_01_011"), description: "When Volt Surge is active, ATK +12%." },
    ],
    stasis: [
      { name: "Stormblade Stasis X1", icon: fi("yinzi_s2_common_021"), description: "Volt Surge and Iaido Slash CD −8s; After casting Volt Surge, the next Overdrive costs no Thunder Sigil." },
      { name: "Stormblade Stasis X2", icon: fi("yinzi_s2_common_022"), description: "After casting the Ultimate Skill, the next 5 hits restore 8.5% Max HP each." },
    ],
  },
  {
    className: "Wind Knight",
    factors: [
      { name: "Wind Knight X1",  icon: fi("yinzi_s2_04_001"), description: "Vortex Strike Dream DMG +40%." },
      { name: "Wind Knight X2",  icon: fi("yinzi_s2_04_002"), description: "Galeform Dream DMG +16%." },
      { name: "Wind Knight X3",  icon: fi("yinzi_s2_04_003"), description: "Skyfall, Instant Edge Dream DMG +25%." },
      { name: "Wind Knight X4",  icon: fi("yinzi_s2_04_004"), description: "During Galeform, Wind Element DMG +8%." },
      { name: "Wind Knight X5",  icon: fi("yinzi_s2_04_005"), description: "Drake Cannon count +1; Basic Attack Dream DMG +37.5%." },
      { name: "Wind Knight X6",  icon: fi("yinzi_s2_04_006"), description: "Each 1% Haste grants 0.5% ATK." },
      { name: "Wind Knight X7",  icon: fi("yinzi_s2_04_007"), description: "Courage skill Dream DMG +60%." },
      { name: "Wind Knight X8",  icon: fi("yinzi_s2_04_008"), description: "Tempest Slash Dream DMG +24%." },
      { name: "Wind Knight X9",  icon: fi("yinzi_s2_04_009"), description: "Wind Lance Dream DMG +30%." },
      { name: "Wind Knight X10", icon: fi("yinzi_s2_04_010"), description: "Courage recovery rate +20%." },
      { name: "Wind Knight X11", icon: fi("yinzi_s2_04_011"), description: "During Galeform, ATK +12%." },
    ],
    stasis: [
      { name: "Wind Knight Stasis X1", icon: fi("yinzi_s2_common_023"), description: "Galeform and Drake Cannon CD −8s; After casting Galeform, the next Vortex Strike costs no Courage." },
      { name: "Wind Knight Stasis X2", icon: fi("yinzi_s2_common_024"), description: "After casting the Ultimate Skill, the next 5 hits restore 8.5% Max HP each." },
    ],
  },
  {
    className: "Marksman",
    factors: [
      { name: "Marksman X1",  icon: fi("yinzi_s2_11_001"), description: "Storm Arrow Dream DMG +40%." },
      { name: "Marksman X2",  icon: fi("yinzi_s2_11_002"), description: "Focus Dream DMG +16%." },
      { name: "Marksman X3",  icon: fi("yinzi_s2_11_003"), description: "Radiance Barrage, Piercing Arrow Dream DMG +25%." },
      { name: "Marksman X4",  icon: fi("yinzi_s2_11_004"), description: "During Focus, All Element DMG +8%." },
      { name: "Marksman X5",  icon: fi("yinzi_s2_11_005"), description: "Wildpack companion count +1; Basic Attack Dream DMG +37.5%." },
      { name: "Marksman X6",  icon: fi("yinzi_s2_11_006"), description: "Each 1% Mastery grants 0.3% Crit DMG." },
      { name: "Marksman X7",  icon: fi("yinzi_s2_11_007"), description: "Barrage, Multi-Shot Dream DMG +60%." },
      { name: "Marksman X8",  icon: fi("yinzi_s2_11_008"), description: "Explosive Arrow Dream DMG +24%." },
      { name: "Marksman X9",  icon: fi("yinzi_s2_11_009"), description: "Rapid Fire Dream DMG +30%." },
      { name: "Marksman X10", icon: fi("yinzi_s2_11_010"), description: "Arrow charges max +1; Arrow Dream DMG +20%." },
      { name: "Marksman X11", icon: fi("yinzi_s2_11_011"), description: "During Focus, ATK +12%." },
    ],
    stasis: [
      { name: "Marksman Stasis X1", icon: fi("yinzi_s2_common_027"), description: "Focus and Radiance Barrage CD −8s; After casting Focus, the next Storm Arrow costs no special resources." },
      { name: "Marksman Stasis X2", icon: fi("yinzi_s2_common_028"), description: "After casting the Ultimate Skill, the next 5 hits restore 8.5% Max HP each." },
    ],
  },
  {
    className: "Frost Mage",
    factors: [
      { name: "Frost Mage X1",  icon: fi("yinzi_s2_02_001"), description: "Frost Lance Dream DMG +40%." },
      { name: "Frost Mage X2",  icon: fi("yinzi_s2_02_002"), description: "Crystal Veil Dream DMG +16%." },
      { name: "Frost Mage X3",  icon: fi("yinzi_s2_02_003"), description: "Meteor Storm, Ice Arrow Dream DMG +25%." },
      { name: "Frost Mage X4",  icon: fi("yinzi_s2_02_004"), description: "When Crystal Veil is active, Ice Element DMG +8%." },
      { name: "Frost Mage X5",  icon: fi("yinzi_s2_02_005"), description: "Ice Energy recovery +1; Basic Attack Dream DMG +37.5%." },
      { name: "Frost Mage X6",  icon: fi("yinzi_s2_02_006"), description: "Each 1% Crit grants 0.5% MATK." },
      { name: "Frost Mage X7",  icon: fi("yinzi_s2_02_007"), description: "Tidepool, Frost Explosion Dream DMG +60%." },
      { name: "Frost Mage X8",  icon: fi("yinzi_s2_02_008"), description: "Blizzard Dream DMG +24%." },
      { name: "Frost Mage X9",  icon: fi("yinzi_s2_02_009"), description: "Frost Nova Dream DMG +30%." },
      { name: "Frost Mage X10", icon: fi("yinzi_s2_02_010"), description: "Phantom Ice max stacks +5; Crystal Veil Dream DMG +20%." },
      { name: "Frost Mage X11", icon: fi("yinzi_s2_02_011"), description: "When Crystal Veil is active, MATK +12%." },
    ],
    stasis: [
      { name: "Frost Mage Stasis X1", icon: fi("yinzi_s2_common_025"), description: "Crystal Veil and Meteor Storm CD −8s; After casting Crystal Veil, the next Frost Lance costs no Ice Energy." },
      { name: "Frost Mage Stasis X2", icon: fi("yinzi_s2_common_026"), description: "After casting the Ultimate Skill, the next 5 hits restore 8.5% Max HP each." },
    ],
  },
  {
    className: "Verdant Oracle",
    factors: [
      { name: "Verdant Oracle X1",  icon: fi("yinzi_s2_05_001"), description: "Feral Seed Dream DMG +40%." },
      { name: "Verdant Oracle X2",  icon: fi("yinzi_s2_05_002"), description: "Nature Ward Dream DMG +16%." },
      { name: "Verdant Oracle X3",  icon: fi("yinzi_s2_05_003"), description: "Healing Light, Rejuvenation Dream Healing +25%." },
      { name: "Verdant Oracle X4",  icon: fi("yinzi_s2_05_004"), description: "When Nature Ward is active, Forest Element DMG +8%." },
      { name: "Verdant Oracle X5",  icon: fi("yinzi_s2_05_005"), description: "Seed regeneration +1; Basic Attack Dream DMG +37.5%." },
      { name: "Verdant Oracle X6",  icon: fi("yinzi_s2_05_006"), description: "Each 1% Luck grants 0.5% MATK." },
      { name: "Verdant Oracle X7",  icon: fi("yinzi_s2_05_007"), description: "Vine Lash, Earth Pulse Dream DMG +60%." },
      { name: "Verdant Oracle X8",  icon: fi("yinzi_s2_05_008"), description: "Thornstrike Dream DMG +24%." },
      { name: "Verdant Oracle X9",  icon: fi("yinzi_s2_05_009"), description: "Nature's Wrath Dream DMG +30%." },
      { name: "Verdant Oracle X10", icon: fi("yinzi_s2_05_010"), description: "Spring Breeze max stacks +1; Nature Ward Dream Healing +20%." },
      { name: "Verdant Oracle X11", icon: fi("yinzi_s2_05_011"), description: "When Nature Ward is active, MATK +12%." },
    ],
    stasis: [
      { name: "Verdant Oracle Stasis X1", icon: fi("yinzi_s2_common_033"), description: "Nature Ward and Feral Seed CD −8s; After casting Nature Ward, the next Healing Light costs no Seeds." },
      { name: "Verdant Oracle Stasis X2", icon: fi("yinzi_s2_common_034"), description: "After casting the Ultimate Skill, the next 5 hits restore 8.5% Max HP each." },
    ],
  },
  {
    className: "Beat Performer",
    factors: [
      { name: "Beat Performer X1",  icon: fi("yinzi_s2_13_001"), description: "Amplified Beat Dream DMG +40%." },
      { name: "Beat Performer X2",  icon: fi("yinzi_s2_13_002"), description: "Heroic Melody Dream DMG +16%." },
      { name: "Beat Performer X3",  icon: fi("yinzi_s2_13_003"), description: "Healing Melody, Healing Beat Dream Healing +25%." },
      { name: "Beat Performer X4",  icon: fi("yinzi_s2_13_004"), description: "During Heroic Melody, Fire Element DMG +8%." },
      { name: "Beat Performer X5",  icon: fi("yinzi_s2_13_005"), description: "Beat gauge charge +1; Basic Attack Dream DMG +37.5%." },
      { name: "Beat Performer X6",  icon: fi("yinzi_s2_13_006"), description: "Each 1% Haste grants 0.5% MATK." },
      { name: "Beat Performer X7",  icon: fi("yinzi_s2_13_007"), description: "Fivefold Crescendo, Power Chord Dream DMG +60%." },
      { name: "Beat Performer X8",  icon: fi("yinzi_s2_13_008"), description: "Sonic Boom Dream DMG +24%." },
      { name: "Beat Performer X9",  icon: fi("yinzi_s2_13_009"), description: "Rhythm Burst Dream DMG +30%." },
      { name: "Beat Performer X10", icon: fi("yinzi_s2_13_010"), description: "Melody notes max +1; Heroic Melody Dream DMG +20%." },
      { name: "Beat Performer X11", icon: fi("yinzi_s2_13_011"), description: "During Heroic Melody, MATK +12%." },
    ],
    stasis: [
      { name: "Beat Performer Stasis X1", icon: fi("yinzi_s2_common_035"), description: "Heroic Melody and Healing Melody CD −8s; After casting Heroic Melody, the next Amplified Beat costs no Beat gauge." },
      { name: "Beat Performer Stasis X2", icon: fi("yinzi_s2_common_036"), description: "After casting the Ultimate Skill, the next 5 hits restore 8.5% Max HP each." },
    ],
  },
]

// ── Structured Node Tree ──

export interface TreeRow {
  type: "root" | "branch" | "factors" | "final"
  nodes: PsychoscopeNode[]
}

/** Parse flat node array into structured rows for the interactive tree builder */
export function parseNodeTree(nodes: PsychoscopeNode[]): TreeRow[] {
  if (nodes.length === 0) return []
  const rows: TreeRow[] = []
  let i = 0
  if (nodes[i]?.type === "skill" && !nodes[i]?.branch) {
    rows.push({ type: "root", nodes: [nodes[i]] })
    i++
  }
  while (i < nodes.length) {
    const n = nodes[i]
    if (n.type === "skill" && n.branch) {
      const branchNodes: PsychoscopeNode[] = [n]
      i++
      // Collect all consecutive branched skills (up to 3: left/middle/right)
      while (i < nodes.length && nodes[i].type === "skill" && nodes[i].branch) {
        branchNodes.push(nodes[i])
        i++
      }
      rows.push({ type: "branch", nodes: branchNodes })
    } else if (n.type === "skill" && !n.branch) {
      // Single skill without branch - could be a solo branch row or final
      // Check if there are more nodes after this one
      if (i < nodes.length - 1) {
        // It's a solo branch row (like Illusory Countershock in Shattered Illusion)
        rows.push({ type: "branch", nodes: [n] })
        i++
      } else {
        // It's the final skill
        rows.push({ type: "final", nodes: [n] })
        i++
      }
    } else if (n.type === "phantom_factor") {
      if (n.branch) {
        // Branched factor pair: collect all consecutive branched phantom_factors into one row
        const branchedNodes: PsychoscopeNode[] = [n]
        i++
        while (i < nodes.length && nodes[i]?.type === "phantom_factor" && nodes[i]?.branch) {
          branchedNodes.push(nodes[i])
          i++
        }
        rows.push({ type: "factors", nodes: branchedNodes })
      } else {
        rows.push({ type: "factors", nodes: [n] })
        i++
      }
    } else {
      i++
    }
  }
  return rows
}

// ── Psychoscope Builder Config ──

export interface FactorSlotConfig {
  factorName: string   // "" = unassigned
  grade: number        // 1-10
}

export interface PsychoscopeConfig {
  enabled: boolean    // master toggle — when false, all psychoscope effects are disabled
  projectionId: string
  branches: ("left" | "right" | "none")[]
  factorSlots: FactorSlotConfig[]
  bondLevel: number  // 0-35
}

export const DEFAULT_PSYCHOSCOPE_CONFIG: PsychoscopeConfig = {
  enabled: true,
  projectionId: "fantasia-impact",
  branches: ["none", "none", "none", "none"],
  factorSlots: Array.from({ length: 10 }, () => ({ factorName: "", grade: 1 })),
  bondLevel: 35,
}

// ── Spec-Recommended Builds ──

export interface SpecPriority {
  projectionId: string
  branches: ("left" | "right" | "none")[]
  factors: FactorSlotConfig[]
  note?: string
}

export const SPEC_PRIORITIES: Record<string, SpecPriority> = {
  // ─── Real data ───
  "Moonstrike": {
    projectionId: "fantasia-impact",
    branches: ["left", "right", "right", "right"],
    factors: [
      // Slot 0: General ATK (non-branched)
      { factorName: "Polarity X1", grade: 7 },
      // Slot 1: General DEF (non-branched)
      { factorName: "Stasis X5", grade: 7 },
      // Slot 2: Class-Exclusive (non-branched)
      { factorName: "Stormblade X10", grade: 5 },
      // Slot 3: General ATK (non-branched)
      { factorName: "Polarity X4", grade: 5 },
      // Slot 4: General DEF — left side of branched pair (chosen)
      { factorName: "Stasis X6", grade: 7 },
      // Slot 5: Class DEF — right side of branched pair (not chosen)
      { factorName: "", grade: 1 },
      // Slot 6: Class-Exclusive (non-branched)
      { factorName: "Stormblade X7", grade: 10 },
      // Slot 7: Class-Exclusive — left side of branched pair (chosen)
      { factorName: "", grade: 5 },
      // Slot 8: General ATK — right side of branched pair (not chosen)
      { factorName: "Polarity X8", grade: 1 },
      // Slot 9: General DEF (non-branched)
      { factorName: "Stasis X4", grade: 1 },
    ],
    note: "Crit-focused DPS. Polarity X5 for +10% Crit, Stormblade X6 for 1% Crit → 0.5% ATK.",
  },
  // ─── Placeholders (projection only, no factor recommendations yet) ───
  "Iado":       { projectionId: "dreamforce", branches: ["left", "left", "left", "left"], factors: Array.from({ length: 10 }, () => ({ factorName: "", grade: 1 })) },
  "Earthfort":  { projectionId: "dreamforce", branches: ["left", "left", "left", "left"], factors: Array.from({ length: 10 }, () => ({ factorName: "", grade: 1 })), note: "Placeholder — recommendations pending." },
  "Block":      { projectionId: "dreamforce", branches: ["left", "left", "left", "left"], factors: Array.from({ length: 10 }, () => ({ factorName: "", grade: 1 })), note: "Placeholder — recommendations pending." },
  "Recovery":   { projectionId: "dreamforce", branches: ["left", "left", "left", "left"], factors: Array.from({ length: 10 }, () => ({ factorName: "", grade: 1 })), note: "Placeholder — recommendations pending." },
  "Shield":     { projectionId: "dreamforce", branches: ["left", "left", "left", "left"], factors: Array.from({ length: 10 }, () => ({ factorName: "", grade: 1 })), note: "Placeholder — recommendations pending." },
  "Vanguard":   { projectionId: "dreamforce", branches: ["left", "left", "left", "left"], factors: Array.from({ length: 10 }, () => ({ factorName: "", grade: 1 })), note: "Placeholder — recommendations pending." },
  "Skyward":    { projectionId: "dreamforce", branches: ["left", "left", "left", "left"], factors: Array.from({ length: 10 }, () => ({ factorName: "", grade: 1 })), note: "Placeholder — recommendations pending." },
  "Wildpack":   { projectionId: "dreamforce", branches: ["left", "left", "left", "left"], factors: Array.from({ length: 10 }, () => ({ factorName: "", grade: 1 })), note: "Placeholder — recommendations pending." },
  "Falconry":   { projectionId: "dreamforce", branches: ["left", "left", "left", "left"], factors: Array.from({ length: 10 }, () => ({ factorName: "", grade: 1 })), note: "Placeholder — recommendations pending." },
  "Icicle":     { projectionId: "dreamforce", branches: ["left", "left", "left", "left"], factors: Array.from({ length: 10 }, () => ({ factorName: "", grade: 1 })), note: "Placeholder — recommendations pending." },
  "Frostbeam":  { projectionId: "dreamforce", branches: ["left", "left", "left", "left"], factors: Array.from({ length: 10 }, () => ({ factorName: "", grade: 1 })), note: "Placeholder — recommendations pending." },
  "Smite":      { projectionId: "dreamforce", branches: ["left", "left", "left", "left"], factors: Array.from({ length: 10 }, () => ({ factorName: "", grade: 1 })), note: "Placeholder — recommendations pending." },
  "Lifebind":   { projectionId: "dreamforce", branches: ["left", "left", "left", "left"], factors: Array.from({ length: 10 }, () => ({ factorName: "", grade: 1 })), note: "Placeholder — recommendations pending." },
  "Dissonance": { projectionId: "dreamforce", branches: ["left", "left", "left", "left"], factors: Array.from({ length: 10 }, () => ({ factorName: "", grade: 1 })), note: "Placeholder — recommendations pending." },
  "Concerto":   { projectionId: "dreamforce", branches: ["left", "left", "left", "left"], factors: Array.from({ length: 10 }, () => ({ factorName: "", grade: 1 })), note: "Placeholder — recommendations pending." },
}

// ── Class Name Normalization ──
// game-data.ts uses "Frostmage" but psychoscope data uses "Frost Mage"
const CLASS_NAME_ALIASES: Record<string, string> = { "Frostmage": "Frost Mage" }
export function normalizeClassName(name: string | null): string {
  if (!name) return ""
  return CLASS_NAME_ALIASES[name] ?? name
}

// ── Factor Lookup Helpers ──

/** Get all factors available for a given slot type and class */
export function getFactorsForType(factorType: string, className: string): Factor[] {
  const cn = normalizeClassName(className)
  switch (factorType) {
    case "General ATK": return OFFENSIVE_FACTORS
    case "General DEF": return DEFENSIVE_FACTORS
    case "Class-Exclusive": return CLASS_FACTORS.find(c => c.className === cn)?.factors ?? []
    case "Class DEF": return CLASS_FACTORS.find(c => c.className === cn)?.stasis ?? []
    case "Class Rhapsody": return []
    default: return []
  }
}

/** Find a factor by name across all factor pools for a class */
export function findFactor(name: string, className: string): Factor | undefined {
  if (!name) return undefined
  const cn = normalizeClassName(className)
  const cls = CLASS_FACTORS.find(c => c.className === cn)
  const all: Factor[] = [
    ...OFFENSIVE_FACTORS,
    ...DEFENSIVE_FACTORS,
    ...(cls?.factors ?? []),
    ...(cls?.stasis ?? []),
  ]
  return all.find(f => f.name === name)
}

// ── All class names (for tab rendering) ──
export const PSYCHOSCOPE_CLASSES = CLASS_FACTORS.map(c => c.className)

// ══════════════════════════════════════════════════════════════════════
// PSYCHOSCOPE EFFECTS ENGINE — computes stat & DPS bonuses from config
// ══════════════════════════════════════════════════════════════════════

export interface PsychoscopeEffects {
  // Flat raw stat additions
  flatStats: Record<string, number>     // e.g. { Agility: 75, Versatility: 600 }
  // Percentage bonuses on main stats (e.g., Agility +2%)
  pctStats: Record<string, number>      // e.g. { "Agility": 2 } meaning +2%
  // Gain multipliers on total raw combat stats (additive %)
  // e.g. { Crit: 10, Mastery: -6 } → Crit *= 1.10, Mastery *= 0.94
  gainMult: Record<string, number>
  // DPS bonuses
  allElementFlat: number               // Polarity X1: All Element +212
  specialDmgPct: number                // Polarity X9: Special attack Dream DMG %
  expertiseDmgPct: number              // Polarity X10: Expertise Skill Dream DMG %
  dreamDmgPct: number                  // General Dream DMG % (bond exclusive)
  // Class-specific DPS
  atkFromStat: { stat: string; ratio: number; target: "ATK" | "MATK" | "CritDMG" } | null
  conditionalAtkPct: number            // ATK% during class buff (e.g. Volt Surge)
  conditionalElementDmg: number        // Element DMG% during class buff
  skillDmg: Record<string, number>     // Skill-specific Dream DMG bonuses (percent)
  // Bond exclusive extras
  bondCritPct: number                  // flat Crit% from bond exclusive
  bondLuckPct: number                  // flat Luck% from bond exclusive
  bondMainStatFlat: number             // e.g. Endless Mind: +100 to current main stats
  // Bond general highest stat bonus (total flat)
  bondHighestStatFlat: number          // +300 per applicable bond tier (levels 12, 25)
  bondIlluStrength: number
  bondEndurance: number                // Total Endurance from bond generals
  // Active effect descriptions for display
  activeEffects: string[]
}

// ── Factor Grade Scaling ──
// All factor effects scale LINEARLY between G1 and G10 values:
//   value(G) = G1 + (G10 - G1) × (G - 1) / 9
// Source: datamine DATA-Factors sheet (verified against G1, G4, G10 data).

interface FactorEffectDef {
  flat?: Record<string, number>           // Flat stat additions
  pct?: Record<string, number>            // Percentage multipliers on stats
  gainMult?: Record<string, number>       // "Gained in any way" multipliers
  allElement?: number                     // All Element flat
  specialDmg?: number                     // Special attack Dream DMG %
  expertiseDmg?: number                   // Expertise Skill Dream DMG %
  conditionalVers?: number                // Average conditional Versatility
  atkFromStat?: { stat: string; ratio: number; target: "ATK" | "MATK" | "CritDMG" }
  conditionalAtkPct?: number              // ATK% during class buff
  conditionalElementDmg?: number          // Element DMG% during class buff
  skillDmg?: Record<string, number>       // Skill-specific Dream DMG %
}

/** Linear interpolation between G1 and G10 values.
 *  When g1 is undefined (no datamine G1 data), falls back to g10 × grade/10. */
function gradeScale(g10: number, grade: number, g1?: number): number {
  if (grade >= 10) return g10
  if (g1 !== undefined) {
    return g1 + (g10 - g1) * (grade - 1) / 9
  }
  // Fallback for factors without G1 data (class-specific skill DMG)
  return g10 * grade / 10
}

// G1 (Grade 1) values — from datamine DATA-Factors sheet.
// Only factors that affect stat calculations need G1 data.
// Class-specific skill DMG factors use fallback (grade/10) since datamine
// G10 values don't match our displayed values.
const FACTOR_EFFECTS_G1: Record<string, FactorEffectDef> = {
  // ── Polarity (datamine verified: G1, G4, G10 all match linear formula) ──
  "Polarity X1":  { allElement: 50 },
  "Polarity X2":  { flat: { Strength: 30 }, pct: { Strength: 0.6 } },
  "Polarity X3":  { flat: { Intellect: 30 }, pct: { Intellect: 0.6 } },
  "Polarity X4":  { flat: { Agility: 30 }, pct: { Agility: 0.6 } },
  "Polarity X5":  { gainMult: { Crit: 3.5, Mastery: -2.1 } },
  "Polarity X6":  { gainMult: { Luck: 3.5, Haste: -2.1 } },
  "Polarity X7":  { gainMult: { Mastery: 3.5, Luck: -2.1 } },
  "Polarity X8":  { gainMult: { Haste: 3.5, Crit: -2.1 } },
  "Polarity X9":  { specialDmg: 1.0 },
  "Polarity X10": { expertiseDmg: 1.2 },
  "Polarity X11": { conditionalVers: 300 },  // 60 per stack × 5 stacks
}

const FACTOR_EFFECTS_G10: Record<string, FactorEffectDef> = {
  // ── Offensive (Polarity) ──
  "Polarity X1":  { allElement: 212 },
  "Polarity X2":  { flat: { Strength: 75 }, pct: { Strength: 2 } },
  "Polarity X3":  { flat: { Intellect: 75 }, pct: { Intellect: 2 } },
  "Polarity X4":  { flat: { Agility: 75 }, pct: { Agility: 2 } },
  "Polarity X5":  { gainMult: { Crit: 10, Mastery: -6 } },
  "Polarity X6":  { gainMult: { Luck: 10, Haste: -6 } },
  "Polarity X7":  { gainMult: { Mastery: 10, Luck: -6 } },
  "Polarity X8":  { gainMult: { Haste: 10, Crit: -6 } },
  "Polarity X9":  { specialDmg: 6.5 },
  "Polarity X10": { expertiseDmg: 7 },
  "Polarity X11": { conditionalVers: 600 },  // 120 × 5 stacks average in combat

  // ── Stormblade ──
  "Stormblade X1":  { skillDmg: { "Overdrive": 40 } },
  "Stormblade X2":  { skillDmg: { "Volt Surge": 16 } },
  "Stormblade X3":  { skillDmg: { "Piercing Slash": 25 } },
  "Stormblade X4":  { conditionalElementDmg: 8 },
  "Stormblade X5":  { skillDmg: { "Basic Attack": 37.5 } },
  "Stormblade X6":  { atkFromStat: { stat: "Crit", ratio: 0.5, target: "ATK" } },
  "Stormblade X7":  { skillDmg: { "Divine Sickle": 60 } },
  "Stormblade X8":  { skillDmg: { "Shadow Blade": 24 } },
  // Stormblade X10: Thunder Sigil conversion bonus +20% — mechanical (extra sigil value), not a simple DMG% factor
  "Stormblade X9":  { skillDmg: { "Flash Strike": 30 } },
  "Stormblade X11": { conditionalAtkPct: 12 },

  // ── Shield Knight ──
  "Shield Knight X1":  { skillDmg: { "Valor Bash": 40 } },
  "Shield Knight X3":  { skillDmg: { "Judgment": 25 } },
  "Shield Knight X4":  { conditionalElementDmg: 8 },
  "Shield Knight X5":  { skillDmg: { "Basic Attack": 37.5 } },
  "Shield Knight X6":  { atkFromStat: { stat: "Mastery", ratio: 0.5, target: "ATK" } },
  "Shield Knight X7":  { skillDmg: { "Vanguard Strike": 60 } },
  "Shield Knight X9":  { skillDmg: { "Zeal Crusade": 30 } },
  "Shield Knight X11": { conditionalAtkPct: 12 },

  // ── Heavy Guardian ──
  "Heavy Guardian X1":  { skillDmg: { "Shield Bash": 40 } },
  "Heavy Guardian X3":  { skillDmg: { "Sandshroud": 25 } },
  "Heavy Guardian X4":  { conditionalElementDmg: 8 },
  "Heavy Guardian X5":  { skillDmg: { "Basic Attack": 37.5 } },
  "Heavy Guardian X6":  { atkFromStat: { stat: "Mastery", ratio: 0.5, target: "ATK" } },
  "Heavy Guardian X7":  { skillDmg: { "Rock Guard": 60 } },
  "Heavy Guardian X9":  { skillDmg: { "Rock Counter": 30 } },
  "Heavy Guardian X11": { conditionalAtkPct: 12 },

  // ── Wind Knight ──
  "Wind Knight X1":  { skillDmg: { "Vortex Strike": 40 } },
  "Wind Knight X3":  { skillDmg: { "Skyfall": 25 } },
  "Wind Knight X4":  { conditionalElementDmg: 8 },
  "Wind Knight X5":  { skillDmg: { "Basic Attack": 37.5 } },
  "Wind Knight X6":  { atkFromStat: { stat: "Haste", ratio: 0.5, target: "ATK" } },
  "Wind Knight X7":  { skillDmg: { "Courage": 60 } },
  "Wind Knight X9":  { skillDmg: { "Wind Lance": 30 } },
  "Wind Knight X11": { conditionalAtkPct: 12 },

  // ── Marksman ──
  "Marksman X1":  { skillDmg: { "Storm Arrow": 40 } },
  "Marksman X3":  { skillDmg: { "Radiance Barrage": 25, "Piercing Arrow": 25 } },
  "Marksman X4":  { conditionalElementDmg: 8 },
  "Marksman X5":  { skillDmg: { "Basic Attack": 37.5 } },
  "Marksman X6":  { atkFromStat: { stat: "Mastery", ratio: 0.3, target: "CritDMG" } },
  "Marksman X7":  { skillDmg: { "Barrage": 60, "Multi-Shot": 60 } },
  "Marksman X9":  { skillDmg: { "Rapid Fire": 30 } },
  "Marksman X11": { conditionalAtkPct: 12 },

  // ── Frost Mage ──
  "Frost Mage X1":  { skillDmg: { "Frost Lance": 40 } },
  "Frost Mage X3":  { skillDmg: { "Meteor Storm": 25, "Ice Arrow": 25 } },
  "Frost Mage X4":  { conditionalElementDmg: 8 },
  "Frost Mage X5":  { skillDmg: { "Basic Attack": 37.5 } },
  "Frost Mage X6":  { atkFromStat: { stat: "Crit", ratio: 0.5, target: "MATK" } },
  "Frost Mage X7":  { skillDmg: { "Tidepool": 60, "Frost Explosion": 60 } },
  "Frost Mage X9":  { skillDmg: { "Frost Nova": 30 } },
  "Frost Mage X11": { conditionalAtkPct: 12 },

  // ── Verdant Oracle ──
  "Verdant Oracle X1":  { skillDmg: { "Feral Seed": 40 } },
  "Verdant Oracle X3":  { skillDmg: { "Healing Light": 25, "Rejuvenation": 25 } },
  "Verdant Oracle X4":  { conditionalElementDmg: 8 },
  "Verdant Oracle X5":  { skillDmg: { "Basic Attack": 37.5 } },
  "Verdant Oracle X6":  { atkFromStat: { stat: "Luck", ratio: 0.5, target: "MATK" } },
  "Verdant Oracle X7":  { skillDmg: { "Vine Lash": 60, "Earth Pulse": 60 } },
  "Verdant Oracle X9":  { skillDmg: { "Nature's Wrath": 30 } },
  "Verdant Oracle X11": { conditionalAtkPct: 12 },

  // ── Beat Performer ──
  "Beat Performer X1":  { skillDmg: { "Amplified Beat": 40 } },
  "Beat Performer X3":  { skillDmg: { "Healing Melody": 25, "Healing Beat": 25 } },
  "Beat Performer X4":  { conditionalElementDmg: 8 },
  "Beat Performer X5":  { skillDmg: { "Basic Attack": 37.5 } },
  "Beat Performer X6":  { atkFromStat: { stat: "Haste", ratio: 0.5, target: "MATK" } },
  "Beat Performer X7":  { skillDmg: { "Fivefold Crescendo": 60, "Power Chord": 60 } },
  "Beat Performer X9":  { skillDmg: { "Rhythm Burst": 30 } },
  "Beat Performer X11": { conditionalAtkPct: 12 },
}

/** Compute all stat and DPS bonuses from the current psychoscope configuration */
export function computePsychoscopeEffects(
  config: PsychoscopeConfig,
  className: string | null,
): PsychoscopeEffects {
  const effects: PsychoscopeEffects = {
    flatStats: {},
    pctStats: {},
    gainMult: {},
    allElementFlat: 0,
    specialDmgPct: 0,
    expertiseDmgPct: 0,
    dreamDmgPct: 0,
    atkFromStat: null,
    conditionalAtkPct: 0,
    conditionalElementDmg: 0,
    skillDmg: {},
    bondCritPct: 0,
    bondLuckPct: 0,
    bondMainStatFlat: 0,
    bondHighestStatFlat: 0,
    bondIlluStrength: 0,
    bondEndurance: 0,
    activeEffects: [],
  }

  if (!config.projectionId || config.enabled === false) return effects

  // ── Process equipped factors (branch-aware) ──
  const projection = [...MIND_PROJECTIONS, ...SLUMBERING_PROJECTIONS].find(p => p.id === config.projectionId)
  if (!projection) return effects

  // Use parseNodeTree to correctly handle branched factor pairs
  const rows = parseNodeTree(projection.nodes)

  // Pre-compute slot starts for each factor row (no branch indices needed)
  let si = 0
  const factorRowMeta: { slotStart: number }[] = []
  for (const row of rows) {
    if (row.type === "factors") {
      factorRowMeta.push({ slotStart: si })
      si += row.nodes.length
    }
  }

  // Apply each factor row, skipping the inactive side of branched pairs
  let factorRowIdx = 0
  for (const row of rows) {
    if (row.type !== "factors") continue
    const { slotStart } = factorRowMeta[factorRowIdx++]
    const isPair = row.nodes.length > 1

    row.nodes.forEach((node, ni) => {
      const slotI = slotStart + ni
      const slot = config.factorSlots[slotI]
      if (!slot || !slot.factorName) return

      // For a branched factor pair, active side = whichever slot has a factor (left wins if both)
      if (isPair) {
        const leftSlot = config.factorSlots[slotStart]
        const rightSlot = config.factorSlots[slotStart + 1]
        const pairChoice = leftSlot?.factorName ? "left" : rightSlot?.factorName ? "right" : "none"
        const side = node.branch as "left" | "right"
        if (pairChoice !== side) return  // skip inactive branch side
      }

      const grade = slot.grade
      const def = FACTOR_EFFECTS_G10[slot.factorName]
      if (!def) return
      const g1 = FACTOR_EFFECTS_G1[slot.factorName]  // may be undefined

      // Helper: scale a value using linear interpolation G1↔G10
      const sv = (g10Val: number, g1Val?: number) => gradeScale(g10Val, grade, g1Val)

      // Flat stat additions
      if (def.flat) {
        for (const [stat, val] of Object.entries(def.flat)) {
          effects.flatStats[stat] = (effects.flatStats[stat] ?? 0) + sv(val, g1?.flat?.[stat])
        }
      }

      // Percentage stat bonuses
      if (def.pct) {
        for (const [stat, val] of Object.entries(def.pct)) {
          effects.pctStats[stat] = (effects.pctStats[stat] ?? 0) + sv(val, g1?.pct?.[stat])
        }
      }

      // Gain multipliers — "gained in any way" effects (Polarity X5-X8)
      // These DO scale with grade (G1=3.5%/−2.1%, G10=10%/−6%) via linear interpolation.
      // Datamine verified: value(G) = G1 + (G10−G1) × (G−1)/9
      if (def.gainMult) {
        for (const [stat, val] of Object.entries(def.gainMult)) {
          effects.gainMult[stat] = (effects.gainMult[stat] ?? 0) + sv(val, g1?.gainMult?.[stat])
        }
      }

      // DPS bonuses
      if (def.allElement) effects.allElementFlat += sv(def.allElement, g1?.allElement)
      if (def.specialDmg) effects.specialDmgPct += sv(def.specialDmg, g1?.specialDmg)
      if (def.expertiseDmg) effects.expertiseDmgPct += sv(def.expertiseDmg, g1?.expertiseDmg)
      if (def.conditionalVers) {
        effects.flatStats["Versatility"] = (effects.flatStats["Versatility"] ?? 0) + sv(def.conditionalVers, g1?.conditionalVers)
      }

      // Class-specific
      if (def.atkFromStat) {
        effects.atkFromStat = {
          stat: def.atkFromStat.stat,
          ratio: sv(def.atkFromStat.ratio, g1?.atkFromStat?.ratio),
          target: def.atkFromStat.target,
        }
      }
      if (def.conditionalAtkPct) effects.conditionalAtkPct += sv(def.conditionalAtkPct, g1?.conditionalAtkPct)
      if (def.conditionalElementDmg) effects.conditionalElementDmg += sv(def.conditionalElementDmg, g1?.conditionalElementDmg)
      if (def.skillDmg) {
        for (const [skill, val] of Object.entries(def.skillDmg)) {
          effects.skillDmg[skill] = (effects.skillDmg[skill] ?? 0) + sv(val, g1?.skillDmg?.[skill])
        }
      }

      // Track for display
      const factor = findFactor(slot.factorName, className ?? "")
      if (factor) {
        effects.activeEffects.push(`${factor.name} (G${slot.grade}): ${factor.description}`)
      }
    })
  }

  // ── Process Bond General Effects ──
  const bl = config.bondLevel
  // General 1 (bond level 2): Illusion Strength +100, Endurance +500
  if (bl >= 2) { effects.bondIlluStrength += 100; effects.bondEndurance += 500 }
  // General 2 (bond level 5): Illusion Strength +100, Endurance +500
  if (bl >= 5) { effects.bondIlluStrength += 100; effects.bondEndurance += 500 }
  // General 3 (bond level 12): Highest stat +300, Endurance +500
  if (bl >= 12) { effects.bondHighestStatFlat += 300; effects.bondEndurance += 500 }
  // General 4 (bond level 20): Illusion Strength +100, Endurance +500
  if (bl >= 20) { effects.bondIlluStrength += 100; effects.bondEndurance += 500 }
  // General 5 (bond level 25): Highest stat +500, Endurance +500
  if (bl >= 25) { effects.bondHighestStatFlat += 500; effects.bondEndurance += 500 }

  // ── Process Bond Exclusive (unlocks at 35) ──
  if (bl >= (projection.bondExclusiveUnlock || 35) && projection.bondExclusive) {
    const excl = projection.bondExclusive
    effects.activeEffects.push(`Bond Exclusive: ${excl}`)

    // Parse known bond exclusive effects
    const dreamDmgMatch = excl.match(/Dream DMG \+(\d+(?:\.\d+)?)%/i)
    if (dreamDmgMatch) effects.dreamDmgPct += parseFloat(dreamDmgMatch[1])

    const critMatch = excl.match(/(?<!DMG )Crit \+(\d+(?:\.\d+)?)%/i)
    if (critMatch) effects.bondCritPct += parseFloat(critMatch[1])

    const luckMatch = excl.match(/Luck \+(\d+(?:\.\d+)?)%/i)
    if (luckMatch) effects.bondLuckPct += parseFloat(luckMatch[1])

    // "Current main stats +100" (Endless Mind)
    const mainStatMatch = excl.match(/Current main stats? \+(\d+)/i)
    if (mainStatMatch) effects.bondMainStatFlat += parseInt(mainStatMatch[1])

    // "Attacks vs Oblivion Dream targets: Crit +2%, Luck +2%"
    const oblivionMatch = excl.match(/Crit \+(\d+(?:\.\d+)?)%, Luck \+(\d+(?:\.\d+)?)%/i)
    if (oblivionMatch) {
      effects.bondCritPct += parseFloat(oblivionMatch[1])
      effects.bondLuckPct += parseFloat(oblivionMatch[2])
    }
  }

  return effects
}
