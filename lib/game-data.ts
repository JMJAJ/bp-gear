// ═══════════════════════════════════════════════════════════
// GAME DATA — Exact Math Engine (S2 Datamined)
// ═══════════════════════════════════════════════════════════

export const GAME_DATA = {
  STATS: ["Versatility", "Mastery", "Haste", "Crit", "Luck"] as const,
  SLOTS: ["Weapon", "Helmet", "Chest", "Gloves", "Boots", "Earrings", "Necklace", "Ring", "Bracelet (L)", "Bracelet (R)", "Charm"] as const,
  RAID_SLOTS: ["Weapon", "Helmet", "Chest", "Gloves", "Boots", "Bracelet (L)", "Bracelet (R)"] as const,

  CONSTANTS: {
    "Versatility": { c: 11200, base: 0 },
    "Mastery": { c: 19975, base: 6 },
    "Haste": { c: 19975, base: 0 },
    "Crit": { c: 19975, base: 5 },
    "Luck": { c: 19975, base: 5 },
  } as Record<string, { c: number; base: number }>,

  IMAGINE: {
    SLOT_IDS: ['1', '2'],
    OPTIONS: {
      "Phantom Arachnocrab (Mastery)": { stat: "Mastery", vals: [3584, 4636, 5688, 6740, 7792, 8960] },
      "Celestial Flier (Haste)": { stat: "Haste", vals: [3584, 4636, 5688, 6740, 7792, 8960] },
      "Goblin King (Versatility)": { stat: "Versatility", vals: [3584, 4636, 5688, 6740, 7792, 8960] },
      "Bluespine Lizard (Versatility)": { stat: "Versatility", vals: [2016, 2615, 3214, 3813, 4412, 5040] },
      "Blackfire Foxen (Mastery)": { stat: "Mastery", vals: [2016, 2615, 3214, 3813, 4412, 5040] },
      "Emerald Caprahorn (Haste)": { stat: "Haste", vals: [2016, 2615, 3214, 3813, 4412, 5040] },
    } as Record<string, { stat: string; vals: number[] }>,
  },

  LEGENDARY: ["-", "Attack Speed (%)", "Cast Speed (%)", "ATK/MATK", "Dmg Bonus", "Shield", "Healing Output", "Res Break", "All Res", "Armor", "Max HP"],

  // Exact discrete purple stat roll values by slot-type and tier
  // "weapon" = Weapon slot, "access" = Earrings/Necklace/Ring/Charm, "armor" = Helmet/Chest/Gloves/Boots/Bracelet
  PURPLE_VALS: {
    // % stats on weapon/access are fixed regardless of tier
    "Attack Speed (%)": { weapon: [2.5, 3, 3.5], access: [1, 1.5, 2], armor: [] },
    "Cast Speed (%)": { weapon: [5, 6, 7], access: [2, 3, 4], armor: [] },
    "Attack (%)": { weapon: [2.5, 3, 3.5], access: [1, 1.5, 2], armor: [] },
    "Magic Attack (%)": { weapon: [2.5, 3, 3.5], access: [1, 1.5, 2], armor: [] },
    "DMG Bonus vs Bosses (%)": { weapon: [2.5, 3, 3.5], access: [1, 1.5, 2], armor: [] },
    "Melee Damage Bonus (%)": { weapon: [2.5, 3, 3.5], access: [1, 1.5, 2], armor: [] },
    "Ranged Damage Bonus (%)": { weapon: [2.5, 3, 3.5], access: [1, 1.5, 2], armor: [] },
    "Shield (%)": { weapon: [2.5, 3, 3.5], access: [1, 1.5, 2], armor: [] },
    "Healing Output (%)": { weapon: [3, 3.5, 4], access: [1.5, 2, 2.5], armor: [] },
    "Resilience Break Efficiency (%)": { weapon: [12, 15, 18], access: [3, 6, 9], armor: [] },
    "Strength (%)": { weapon: [], access: [], armor: [0.5, 1, 1.5] },
    "Agility (%)": { weapon: [], access: [], armor: [0.5, 1, 1.5] },
    "Intellect (%)": { weapon: [], access: [], armor: [0.5, 1, 1.5] },
    // Flat armor stats — tier-keyed: "lv40"|"lv60"|"lv80"|"lv120"|"lv140"|"lv160"
    "All Resistance": {
      weapon: [], access: [],
      armor_by_tier: { lv40: [15, 30, 45], lv60: [20, 40, 60], lv80: [25, 50, 75], lv120: [24, 48, 72], lv140: [36, 72, 108], lv160: [40, 80, 120] },
    },
    "Armor": {
      weapon: [], access: [],
      armor_by_tier: { lv40: [20, 40, 60], lv60: [30, 60, 90], lv80: [40, 80, 120], lv120: [32, 64, 96], lv140: [48, 96, 144], lv160: [64, 128, 192] },
    },
    "Max HP": {
      weapon: [], access: [],
      armor_by_tier: { lv40: [100, 150, 200, 260, 300], lv60: [260, 375, 500, 625, 750], lv80: [600, 900, 1200, 1500, 1800], lv120: [800, 1200, 1600, 2000, 2400], lv140: [1500, 1875, 2250, 2625, 3000], lv160: [2000, 2500, 3000, 3500, 4000] },
    },
  } as Record<string, any>,

  VALUES: {
    W_RAID: { p: 1966, s: 1966, r: 0 },
    A_RAID: { p: 756, s: 756, r: 226 },
    W_STD: { p: 1512, s: 756, r: 453 },
    A_STD: { p: 756, s: 378, r: 226 },
  },

  WEAPON_TIERS: {
    "Lv40 Gold": { p: 200, s: 100, r: 60, raid: false, illu: 0 },
    "Lv60 Gold": { p: 280, s: 140, r: 84, raid: false, illu: 0 },
    "Lv70 Raid": { p: 306, s: 306, r: 0, raid: true, illu: 0 },
    "Lv80 Gold": { p: 400, s: 200, r: 120, raid: false, illu: 0 },
    "Lv90 Raid": { p: 384, s: 384, r: 0, raid: true, illu: 0 },
    "Lv100 Far Sea": { p: 0, s: 0, r: 0, raid: true, illu: 80 },
    "Lv120 Gold": { p: 1080, s: 540, r: 324, raid: false, illu: 80 },
    "Lv140 Gold": { p: 1512, s: 756, r: 453, raid: false, illu: 134 },
    "Lv140 Far Sea": { p: 702, s: 702, r: 0, raid: true, illu: 134 },
    "Lv150 Raid": { p: 1966, s: 1966, r: 0, raid: true, illu: 156 },
    "Lv160 Gold": { p: 1908, s: 954, r: 572, raid: false, illu: 200 },
    "Lv160 Far Sea": { p: 983, s: 983, r: 0, raid: true, illu: 250 },
    "Lv170 Raid": { p: 2480, s: 2480, r: 0, raid: true, illu: 250 },
    "Lv180 Far Sea": { p: 1240, s: 1240, r: 0, raid: true, illu: 300 },
  } as Record<string, { p: number; s: number; r: number; raid: boolean; illu: number }>,

  ARMOR_TIERS: {
    "Lv40 Gold": { p: 100, s: 50, r: 30, raid: false, illu: 0 },
    "Lv60 Gold": { p: 140, s: 70, r: 42, raid: false, illu: 0 },
    "Lv60 Raid": { p: 140, s: 140, r: 42, raid: true, illu: 0 },
    "Lv80 Gold": { p: 200, s: 100, r: 60, raid: false, illu: 0 },
    "Lv80 Raid": { p: 200, s: 200, r: 60, raid: true, illu: 0 },
    "Lv120 Gold": { p: 540, s: 270, r: 162, raid: false, illu: 80 },
    "Lv140 Gold": { p: 756, s: 378, r: 226, raid: false, illu: 134 },
    "Lv140 Raid": { p: 756, s: 756, r: 226, raid: true, illu: 134 },
    "Lv150 Raid": { p: 828, s: 828, r: 226, raid: true, illu: 134 },
    "Lv160 Gold": { p: 954, s: 477, r: 286, raid: false, illu: 200 },
    "Lv160 Raid": { p: 954, s: 954, r: 286, raid: true, illu: 200 },
    "Lv165 Raid": { p: 990, s: 990, r: 286, raid: true, illu: 200 },
    "Lv170 Raid": { p: 1035, s: 1035, r: 286, raid: true, illu: 200 },
  } as Record<string, { p: number; s: number; r: number; raid: boolean; illu: number }>,

  ACCESSORY_TIERS: {
    "Lv40 Gold": { p: 100, s: 50, r: 30, raid: false, illu: 0 },
    "Lv60 Gold": { p: 140, s: 70, r: 42, raid: false, illu: 0 },
    "Lv80 Gold": { p: 200, s: 100, r: 60, raid: false, illu: 0 },
    "Lv120 Gold": { p: 540, s: 270, r: 162, raid: false, illu: 80 },
    "Lv140 Gold": { p: 756, s: 378, r: 226, raid: false, illu: 134 },
    "Lv160 Gold": { p: 954, s: 477, r: 286, raid: false, illu: 200 },
  } as Record<string, { p: number; s: number; r: number; raid: boolean; illu: number }>,

  SPECS: {
    "Earthfort": ["Mastery", "Versatility"],
    "Block": ["Mastery", "Luck"],
    "Iado": ["Crit", "Mastery"],
    "Moonstrike": ["Haste", "Luck"],
    "Vanguard": ["Haste", "Mastery"],
    "Skyward": ["Crit", "Luck"],
    "Wildpack": ["Haste", "Mastery"],
    "Falconry": ["Haste", "Crit"],
    "Icicle": ["Crit", "Luck"],
    "Frostbeam": ["Haste", "Mastery"],
    "Smite": ["Luck", "Mastery"],
    "Lifebind": ["Haste", "Mastery"],
    "Recovery": ["Crit", "Mastery"],
    "Shield": ["Haste", "Mastery"],
    "Dissonance": ["Haste", "Luck"],
    "Concerto": ["Crit", "Haste"],
  } as Record<string, string[]>,

  RAID_BONUS: {
    "Earthfort": { l: "Shield (%)", v: 8.0, t: "f" },
    "Block": { l: "Luck (%)", v: 6.0, t: "f" },
    "Iado": { l: "Crit DMG (%)", v: 15.0, t: "f" },
    "Moonstrike": { l: "Luck (%)", v: 6.0, t: "f" },
    "Vanguard": { l: "Melee Damage Bonus (%)", v: 8.0, t: "f" },
    "Skyward": { l: "Lucky Strike DMG Multiplier (%)", v: 20.0, t: "f" },
    "Wildpack": { l: "Ranged Damage Bonus (%)", v: 8.0, t: "f" },
    "Falconry": { l: "Crit DMG (%)", v: 15.0, t: "f" },
    "Icicle": { l: "Crit DMG (%)", v: 15.0, t: "f" },
    "Frostbeam": { l: "Ranged Damage Bonus (%)", v: 8.0, t: "f" },
    "Smite": { l: "Ranged Damage Bonus (%)", v: 8.0, t: "f" },
    "Lifebind": { l: "Healing Output (%)", v: 5.0, t: "f" },
    "Recovery": { l: "Crit DMG (%)", v: 15.0, t: "f" },
    "Shield": { l: "Melee Damage Bonus (%)", v: 8.0, t: "f" },
    "Dissonance": { l: "Luck Effect Damage (%)", v: 15.0, t: "f" },
    "Concerto": { l: "Crit Healing (%)", v: 8.0, t: "f" },
  } as Record<string, { l: string; v: number; t: string }>,

  WEAPON_BUFFS: {
    "Earthfort": { b1: "Mastery", b1v: 12, b2: null, b2v: 0, other: "Physical DMG +4.5% while enraged" },
    "Block": { b1: "Luck", b1v: 6, b2: "Mastery", b2v: 6, other: "Physical DMG +4.5% while Countercrush active" },
    "Iado": { b1: "Crit", b1v: 6, b2: "Mastery", b2v: 6, other: "Physical DMG +5% on Thunder Sigil skills" },
    "Moonstrike": { b1: "Luck", b1v: 6, b2: "Haste", b2v: 6, other: "ATK +4%" },
    "Vanguard": { b1: "Haste", b1v: 6, b2: "Mastery", b2v: 6, other: "ATK +6% during Galeform" },
    "Skyward": { b1: "Haste", b1v: 6, b2: "Mastery", b2v: 6, other: "ATK +6% during Galeform" },
    "Wildpack": { b1: "Haste", b1v: 6, b2: "Mastery", b2v: 6, other: "Physical DMG +4%" },
    "Falconry": { b1: "Crit", b1v: 6, b2: "Haste", b2v: 6, other: "Physical DMG +4%" },
    "Icicle": { b1: "Crit", b1v: 6, b2: "Luck", b2v: 6, other: "Magical Amp +4%" },
    "Frostbeam": { b1: "Haste", b1v: 6, b2: "Mastery", b2v: 6, other: "Magical Amp +4%" },
    "Smite": { b1: "Mastery", b1v: 6, b2: "Crit", b2v: 6, other: "Expertise skills +8.5% MATK" },
    "Lifebind": { b1: "Haste", b1v: 6, b2: "Mastery", b2v: 6, other: "Expertise Healing +10% MATK" },
    "Recovery": { b1: "Crit", b1v: 6, b2: "Mastery", b2v: 6, other: "Physical DMG +4.5% while Valor Bash active" },
    "Shield": { b1: "Haste", b1v: 6, b2: "Mastery", b2v: 6, other: "Physical DMG +4.5% while Lightforged Barrier active" },
    "Dissonance": { b1: "Haste", b1v: 6, b2: "Luck", b2v: 6, other: "Magical Amp +4%" },
    "Concerto": { b1: "Haste", b1v: 6, b2: "Crit", b2v: 6, other: "MATK +5.5% while Healing Melody active" },
  } as Record<string, { b1: string | null; b1v: number; b2: string | null; b2v: number; other: string }>,

  PURPLE_STATS: {
    "Heavy Guardian": ["Attack (%)", "Attack Speed (%)", "DMG Bonus vs Bosses (%)", "Melee Damage Bonus (%)", "Resilience Break Efficiency (%)"],
    "Stormblade": ["Attack (%)", "Attack Speed (%)", "DMG Bonus vs Bosses (%)", "Melee Damage Bonus (%)", "Resilience Break Efficiency (%)"],
    "Wind Knight": ["Attack (%)", "Attack Speed (%)", "DMG Bonus vs Bosses (%)", "Melee Damage Bonus (%)", "Resilience Break Efficiency (%)"],
    "Marksman": ["Attack (%)", "Attack Speed (%)", "DMG Bonus vs Bosses (%)", "Ranged Damage Bonus (%)", "Resilience Break Efficiency (%)"],
    "Frostmage": ["Cast Speed (%)", "DMG Bonus vs Bosses (%)", "Magic Attack (%)", "Ranged Damage Bonus (%)", "Resilience Break Efficiency (%)"],
    "Verdant Oracle": ["Cast Speed (%)", "Healing Output (%)", "Magic Attack (%)", "Ranged Damage Bonus (%)", "Shield (%)"],
    "Shield Knight": ["Attack (%)", "Attack Speed (%)", "DMG Bonus vs Bosses (%)", "Melee Damage Bonus (%)", "Resilience Break Efficiency (%)"],
    "Beat Performer": ["Attack Speed (%)", "Cast Speed (%)", "Healing Output (%)", "Magic Attack (%)", "Melee Damage Bonus (%)", "Ranged Damage Bonus (%)", "Shield (%)"],
  } as Record<string, string[]>,

  HASTE_RATIOS: {
    "Heavy Guardian": { aspd: 0.6, cspd: 1.0 },
    "Shield Knight": { aspd: 0.6, cspd: 1.0 },
    "Stormblade": { aspd: 0.6, cspd: 1.0 },
    "Wind Knight": { aspd: 0.6, cspd: 1.0 },
    "Marksman": { aspd: 0.6, cspd: 1.0 },
    "Frostmage": { aspd: 0.2, cspd: 2.0 },
    "Verdant Oracle": { aspd: 0.2, cspd: 2.0 },
    "Beat Performer": { aspd: 0.6, cspd: 2.0 },
  } as Record<string, { aspd: number; cspd: number }>,

  ARMOR_PURPLE: ["None", "Armor", "All Resistance", "Max HP", "Strength (%)", "Agility (%)", "Intellect (%)"],

  RESTRICTIONS: {
    "Weapon": { Strength: [], Intellect: [], Agility: [] },
    "Helmet": { Strength: ["Versatility"], Intellect: ["Crit"], Agility: ["Haste"] },
    "Chest": { Strength: ["Luck"], Intellect: ["Crit"], Agility: ["Mastery"] },
    "Gloves": { Strength: ["Haste"], Intellect: ["Versatility"], Agility: ["Crit"] },
    "Boots": { Strength: ["Mastery"], Intellect: ["Luck"], Agility: ["Crit"] },
    "Earrings": { Strength: ["Mastery"], Intellect: ["Versatility"], Agility: ["Haste"] },
    "Necklace": { Strength: ["Haste"], Intellect: ["Luck"], Agility: ["Mastery"] },
    "Ring": { Strength: ["Luck"], Intellect: ["Mastery"], Agility: ["Versatility"] },
    "Bracelet (L)": { Strength: ["Crit"], Intellect: ["Haste"], Agility: ["Versatility"] },
    "Bracelet (R)": { Strength: ["Crit"], Intellect: ["Mastery"], Agility: ["Luck"] },
    "Charm": { Strength: ["Versatility"], Intellect: ["Haste"], Agility: ["Luck"] },
  } as Record<string, Record<string, string[]>>,

  CLASSES: {
    "Heavy Guardian": { parent: "Aegis Fighter", role: "Tank", main: "Strength", atk: "ATK", element: "Rock", specs: ["Earthfort", "Block"] },
    "Shield Knight": { parent: "Aegis Fighter", role: "Tank", main: "Strength", atk: "ATK", element: null, specs: ["Recovery", "Shield"] },
    "Stormblade": { parent: "Twin Striker", role: "DPS", main: "Agility", atk: "ATK", element: "Thunder", specs: ["Iado", "Moonstrike"] },
    "Wind Knight": { parent: "Blade Warden", role: "DPS", main: "Strength", atk: "ATK", element: "Wind", specs: ["Vanguard", "Skyward"] },
    "Marksman": { parent: "Keen Strider", role: "DPS", main: "Agility", atk: "ATK", element: null, specs: ["Wildpack", "Falconry"] },
    "Frostmage": { parent: "Spell Caster", role: "DPS", main: "Intellect", atk: "MATK", element: "Ice", specs: ["Icicle", "Frostbeam"] },
    "Verdant Oracle": { parent: "Spell Caster", role: "Support", main: "Intellect", atk: "MATK", element: "Forest", specs: ["Smite", "Lifebind"] },
    "Beat Performer": { parent: "Keen Strider", role: "Support", main: "Intellect", atk: "MATK", element: null, specs: ["Dissonance", "Concerto"] },
  } as Record<string, { parent: string; role: string; main: string; atk: string; element: string | null; specs: string[] }>,

  // 2-Piece raid set bonuses (auto-adapts by spec).
  // t: "aspd" = adds to Attack Speed %, "cspd" = adds to Cast Speed %, "stat_pct" = multiplies a raw stat,
  //    "text" = non-calculable / conditional / skill-specific effect (displayed only, not applied to stats)
  RAID_2PC: {
    "Earthfort": { l: "2pc: Class skill DMG +35%; 18% chance on hit to grant Sand Crystal", v: 0, t: "text", note: "Sandshroud, Star Shatter and their Enhanced Skill DMG +35%. Class skill dealing damage to the current target has a fixed 18% chance to provide 1 stack of Sand Crystal." },
    "Block": { l: "2pc: Sandshroud active — Granite Fury DMG +50%; 20% chance next Granite Fury costs no Sand Crystal", v: 0, t: "text", note: "When Sandshroud is active, Granite Fury and its respective enhanced skill DMG +50%. Whenever Sandshroud does damage to the current target, there is a 20% chance to cause the next Granite Fury to not consume any Sand Crystal." },
    "Iado": { l: "2pc: On Crit, Crit DMG +2% for 5s (max 5 stacks)", v: 0, t: "text", note: "When Iaido Slash deals Crit DMG to the current target, Crit DMG +2% for 5s, stacking up to 5 times." },
    "Moonstrike": { l: "2pc: If ASPD < 80% → ASPD +6%; If ASPD ≥ 80% → Expertise Thunder DMG +7%", v: 6, t: "aspd_cond", note: "When Attack Speed is below 80%, Attack Speed +6%. If your Attack Speed is above 80%, then Expertise Skill Thunder DMG +7%." },
    "Vanguard": { l: "2pc: Courage skills Ignore Armor +22%", v: 22, t: "armor_ignore", note: "Courage-Consuming Class Skills ignore 22% of the target's Armor." },
    "Skyward": { l: "2pc: Lucky Strike reduces Galeform CD by 0.2s; re-casting Galeform during Galeform recovers previous Courage", v: 0, t: "text", note: "Triggering a Lucky Strike reduces the remaining CD on Galeform by 0.2s (counts only once when multiple Lucky Strikes are triggered at the same time). While Galeform is active, casting Galeform again will immediately grant you the Courage to be recovered from the previous Galeform." },
    "Wildpack": { l: "2pc: Each 1% Mastery → +0.2% Crit DMG", v: 0.2, t: "mastery_crit", note: "Each 1% Mastery grants 0.2% Crit DMG." },
    "Falconry": { l: "2pc: Special Attacks reduce Radiance Barrage CD by 1s; greatly increased Radiance Barrage Cast Speed", v: 0, t: "text", note: "Each use of Special Attacks reduces the remaining CD on Radiance Barrage by 1s. Greatly increase the Casting Speed of Radiance Barrage." },
    "Icicle": { l: "2pc: Frost Lance & Meteor Storm Crit DMG +13%; Crystal Veil recovers 80 Ice Energy for 5s", v: 0, t: "text", note: "Frost Lance and Meteor Storm Crit DMG +13%. Casting Crystal Veil recovers 80 Ice Energy for 5 seconds." },
    "Frostbeam": { l: "2pc: Ice Arrow DMG +15% (counts toward Frost Explosion)", v: 0, t: "text", note: "Ice Arrow DMG +15% and also counts toward the Frost Explosion talent." },
    "Smite": { l: "2pc: Feral Seed CD -25%; Feral Seed elemental DMG +12%", v: 0, t: "text", note: "Feral Seed CD -25%; Feral Seed elemental DMG +12%." },
    "Lifebind": { l: "2pc: Direct-heal Class Skills grant Max HP +2.5% for 10s (max 5 stacks)", v: 0, t: "text", note: "Direct-healing Class Skills grant the target 1 stack of Spring Breeze: Max HP +2.5% for 10s. Stacks up to 5 times." },
    "Recovery": { l: "2pc: Reckoning/Inferno Reckon grants Glimmering: DMG +8%, Armor +12% for 5s", v: 0, t: "text", note: "Casting Reckoning or Inferno Reckon grants Glimmering: Damage +8%, Armor +12% for 5 seconds." },
    "Shield": { l: "2pc: Each Lightforged Barrier stack: DMG taken -0.5%, Strength +1%; Judgement grants 1 stack", v: 0, t: "text", note: "Each stack of Lightforged Barrier reduces damage taken by 0.5% and increases Strength by 1%. Casting Judgement immediately grants 1 stack of Lightforged Barrier." },
    "Dissonance": { l: "2pc: While Heroic Melody active, Fire Bonus +5%", v: 0, t: "text", note: "While Heroic Melody is active, Fire Bonus +5%." },
    "Concerto": { l: "2pc: Healing Melody gains +14% Fire Bonus on healing output", v: 0, t: "text", note: "Healing Melody gains +14% Fire Bonus on healing output." },
  } as Record<string, { l: string; v: number; t: "aspd" | "cspd" | "stat_pct" | "mastery_crit" | "aspd_cond" | "armor_ignore" | "text"; note?: string } | null>,

  // 4-Piece raid set bonuses (auto-adapts by spec).
  // t: same type system as 2pc, plus "crit_dmg" = flat Crit DMG bonus, "haste_pct" = Haste % bonus,
  //    "agility_stacks" = stacking main stat bonus
  RAID_4PC: {
    "Earthfort": { l: "4pc: Shield Bash/Rage Burst DMG +25%; hit debuffs target -5% DMG dealt", v: 0, t: "text", note: "Shield Bash, Rage Burst and their respective Enhanced skill DMG +25%. After hitting the target with Shield Bash, Rage Burst, and the respective Enhanced Skill, debuff affected target to deal 5% less DMG to the player." },
    "Block": { l: "4pc: Summoning Granite reduces Sandshroud CD/extends duration by 0.6s", v: 0, t: "text", note: "Summoning Granite reduces Sandshroud CD by 0.6s. If Sandshroud is active, extend Sandshroud duration by 0.6s instead." },
    "Iado": { l: "4pc: Volt Surge inactive → Overdrive generates extra Thunder Sigil (inc. Piercing Slash)", v: 0, t: "text", note: "While Volt Surge is inactive, Overdrive generates an additional Thunder Sigil, which also applies to the Piercing Slash proc." },
    "Moonstrike": { l: "4pc: Every 3rd Divine Sickle triggers Reversal Blade (2nd hit)", v: 0, t: "text", note: "Every 3rd use of Divine Sickle also triggers Reversal Blade, which is basically a 2nd hit of Divine Sickle." },
    "Vanguard": { l: "4pc: Casting Galeform auto-triggers Drake Cannon; Vortex Strike gains 2 charges", v: 0, t: "text", note: "Casting Galeform automatically triggers 1 shot of Drake Cannon. Vortex Strike now has 2 charges." },
    "Skyward": { l: "4pc: After Galeform, next Skyfall & Instant Edge gain Wind DMG +70%", v: 0, t: "text", note: "After casting Galeform, the next Skyfall and Instant Edge gain Wind DMG +70%." },
    "Wildpack": { l: "4pc: Storm Arrow grants +1.5% Agility on hit (8s, max 5 stacks → +7.5%)", v: 7.5, t: "main_stat_pct", note: "Storm Arrow grants +1.5% Agility on hit. Lasts 8 seconds and stacks up to 5 times." },
    "Falconry": { l: "4pc: While Focus active, Crit DMG +50%", v: 50, t: "crit_dmg", note: "While Focus is active, Crit DMG +50%." },
    "Icicle": { l: "4pc: Frost Lance Crit/Lucky Strike → Phantom Ice stacks; at 25, auto Crystal Veil (15s CD)", v: 0, t: "text", note: "When Frost Lance lands a Crit or Lucky Strike proc, you gain 1 stack of Phantom Ice, or 2 stacks if both proc. At 25 stacks, Crystal Veil is automatically cast, which can happen once every 15 seconds." },
    "Frostbeam": { l: "4pc: Tidepool DMG +28% against current target", v: 0, t: "text", note: "Tidepool DMG +28% against the current targeted enemy." },
    "Smite": { l: "4pc: Nature Ward active → overhealing → shield (max 50% Max HP); duration +5s", v: 0, t: "text", note: "While Nature Ward is active, overhealing is converted into a shield that can't exceed 50% of Max HP. Nature Ward duration +5s." },
    "Lifebind": { l: "4pc: At max stacks, direct-heal converts Spring Breeze → Full Bloom: shield 1200% ATK, Inspiration +20% (10s)", v: 0, t: "text", note: "At max stacks, casting any direct-healing Class Skill converts Spring Breeze into Full Bloom: Gains a shield equal to 1200% of ATK immediately and increases the effectiveness of Inspiration by 20%. Lasts 10s." },
    "Recovery": { l: "4pc: Aegis Ward active → Glimmering doubled + converts 20% DMG dealt to Radiant Shield", v: 0, t: "text", note: "While Aegis Ward is active, Glimmering effects are doubled and additionally convert 20% of damage dealt into a Radiant Shield." },
    "Shield": { l: "4pc: Every 15 Lightforged Barrier consumed → DMG +10%, Haste +6% for 7s", v: 6, t: "haste_pct", note: "For every 15 stacks of Lightforged Barrier consumed, gain damage +10% and Haste +6% for 7 seconds." },
    "Dissonance": { l: "4pc: Amplified Beat has +1 hit count", v: 0, t: "text", note: "Amplified Beat has +1 hit count." },
    "Concerto": { l: "4pc: After Healing Beat +8% heal (5s); after Fivefold Crescendo +16% heal (8s)", v: 0, t: "text", note: "Within 5s after casting Healing Beat, the final healing of Healing Melody is increased by 8%. Within 8s after casting Fivefold Crescendo, the final healing of Healing Melody is increased by 16%." },
  } as Record<string, { l: string; v: number; t: "aspd" | "cspd" | "stat_pct" | "mastery_crit" | "aspd_cond" | "armor_ignore" | "text" | "crit_dmg" | "haste_pct" | "main_stat_pct"; note?: string } | null>,
}

export const SIGIL_DB = [
  { n: "Basilisk", s: ["Weapon"], d: { 1: { "All Element Attack": 40 }, 2: { "All Element Attack": 45 }, 3: { "All Element Attack": 50 } } },
  { n: "Bluespine Lizard", s: ["Weapon"], d: { 1: { "All Element Attack": 20 }, 2: { "All Element Attack": 25 }, 3: { "All Element Attack": 30 } } },
  { n: "Emerald Caprahorn", s: ["Weapon", "Earrings", "Necklace", "Ring"], d: { 1: { Endurance: 80, Strength: 25 }, 2: { Endurance: 90, Strength: 30 }, 3: { Endurance: 100, Strength: 35 } } },
  { n: "Blackstone Commander", s: ["Weapon", "Earrings", "Necklace", "Ring"], d: { 1: { Endurance: 80, Intellect: 25 }, 2: { Endurance: 90, Intellect: 30 }, 3: { Endurance: 100, Intellect: 35 } } },
  { n: "Blackfire Foxen", s: ["Weapon", "Earrings", "Necklace", "Ring"], d: { 1: { Endurance: 80, Agility: 25 }, 2: { Endurance: 90, Agility: 30 }, 3: { Endurance: 100, Agility: 35 } } },
  { n: "Erosion Bloom", s: ["Weapon", "Earrings", "Necklace", "Ring"], d: { 1: { Endurance: 80, Agility: 25 }, 2: { Endurance: 90, Agility: 30 }, 3: { Endurance: 100, Agility: 35 } } },
  { n: "Flamehorn", s: ["Helmet", "Chest", "Gloves", "Boots"], d: { 1: { Versatility: 500 }, 2: { Versatility: 560 }, 3: { Versatility: 600 } } },
  { n: "Blackstone Captain", s: ["Helmet", "Chest", "Gloves", "Boots"], d: { 1: { Mastery: 500 }, 2: { Mastery: 560 }, 3: { Mastery: 600 } } },
  { n: "Cabbage Kingpin", s: ["Helmet", "Chest", "Gloves", "Boots"], d: { 1: { Luck: 500 }, 2: { Luck: 560 }, 3: { Luck: 600 } } },
  { n: "Crimson Foxen", s: ["Helmet", "Chest", "Gloves", "Boots"], d: { 1: { Haste: 500 }, 2: { Haste: 560 }, 3: { Haste: 600 } } },
  { n: "Goblin Chief", s: ["Helmet", "Chest", "Gloves", "Boots"], d: { 1: { Crit: 500 }, 2: { Crit: 560 }, 3: { Crit: 600 } } },
  { n: "Cabbage Blaster", s: ["Helmet", "Chest", "Gloves", "Boots"], d: { 1: { Versatility: 200 }, 2: { Versatility: 250 }, 3: { Versatility: 300 } } },
  { n: "Glimmer Caprahorn", s: ["Helmet", "Chest", "Gloves", "Boots"], d: { 1: { Mastery: 200 }, 2: { Mastery: 250 }, 3: { Mastery: 300 } } },
  { n: "Cabbage Tough Guy", s: ["Helmet", "Chest", "Gloves", "Boots"], d: { 1: { Luck: 200 }, 2: { Luck: 250 }, 3: { Luck: 300 } } },
  { n: "Wasteland Foxen", s: ["Helmet", "Chest", "Gloves", "Boots"], d: { 1: { Haste: 200 }, 2: { Haste: 250 }, 3: { Haste: 300 } } },
  { n: "Cabbage Killer", s: ["Helmet", "Chest", "Gloves", "Boots"], d: { 1: { Crit: 200 }, 2: { Crit: 250 }, 3: { Crit: 300 } } },
  { n: "Foxen", s: ["Earrings", "Necklace", "Ring"], d: { 1: { Endurance: 50, Agility: 15 }, 2: { Endurance: 60, Agility: 20 }, 3: { Endurance: 80, Agility: 25 } } },
  { n: "Cabbage Hunter", s: ["Earrings", "Necklace", "Ring"], d: { 1: { Endurance: 50, Intellect: 15 }, 2: { Endurance: 60, Intellect: 20 }, 3: { Endurance: 80, Intellect: 25 } } },
  { n: "Nether Caprahorn", s: ["Earrings", "Necklace", "Ring"], d: { 1: { Endurance: 50, Strength: 15 }, 2: { Endurance: 60, Strength: 20 }, 3: { Endurance: 80, Strength: 25 } } },
  { n: "Blackstone Vanguard", s: ["Bracelet (L)", "Bracelet (R)", "Charm"], d: { 1: { Haste: 300 }, 2: { Haste: 360 }, 3: { Haste: 420 } } },
  { n: "Ruthless Cabbage", s: ["Bracelet (L)", "Bracelet (R)", "Charm"], d: { 1: { Luck: 300 }, 2: { Luck: 360 }, 3: { Luck: 420 } } },
  { n: "Gloomy Cabbage", s: ["Bracelet (L)", "Bracelet (R)", "Charm"], d: { 1: { Crit: 300 }, 2: { Crit: 360 }, 3: { Crit: 420 } } },
  { n: "Goblin Shaman", s: ["Bracelet (L)", "Bracelet (R)", "Charm"], d: { 1: { Versatility: 300 }, 2: { Versatility: 360 }, 3: { Versatility: 420 } } },
  { n: "Goblin Trickster", s: ["Bracelet (L)", "Bracelet (R)", "Charm"], d: { 1: { Mastery: 300 }, 2: { Mastery: 360 }, 3: { Mastery: 420 } } },
  { n: "Frost Lizard", s: ["Bracelet (L)", "Bracelet (R)", "Charm"], d: { 1: { Strength: 12, Crit: 140 }, 2: { Strength: 16, Crit: 175 }, 3: { Strength: 20, Crit: 210 } } },
  { n: "Magma Lizard", s: ["Bracelet (L)", "Bracelet (R)", "Charm"], d: { 1: { Strength: 12, Haste: 140 }, 2: { Strength: 16, Haste: 175 }, 3: { Strength: 20, Haste: 210 } } },
  { n: "Gale Lizard", s: ["Bracelet (L)", "Bracelet (R)", "Charm"], d: { 1: { Strength: 12, Luck: 140 }, 2: { Strength: 16, Luck: 175 }, 3: { Strength: 20, Luck: 210 } } },
  { n: "Lightning Lizard", s: ["Bracelet (L)", "Bracelet (R)", "Charm"], d: { 1: { Strength: 12, Mastery: 140 }, 2: { Strength: 16, Mastery: 175 }, 3: { Strength: 20, Mastery: 210 } } },
  { n: "Blackstone Marksman", s: ["Bracelet (L)", "Bracelet (R)", "Charm"], d: { 1: { Intellect: 12, Crit: 140 }, 2: { Intellect: 16, Crit: 175 }, 3: { Intellect: 20, Crit: 210 } } },
  { n: "Blackstone Guard", s: ["Bracelet (L)", "Bracelet (R)", "Charm"], d: { 1: { Intellect: 12, Haste: 140 }, 2: { Intellect: 16, Haste: 175 }, 3: { Intellect: 20, Haste: 210 } } },
  { n: "Blackstone Warrior", s: ["Bracelet (L)", "Bracelet (R)", "Charm"], d: { 1: { Intellect: 12, Luck: 140 }, 2: { Intellect: 16, Luck: 175 }, 3: { Intellect: 20, Luck: 210 } } },
  { n: "Blackstone Assaulter", s: ["Bracelet (L)", "Bracelet (R)", "Charm"], d: { 1: { Intellect: 12, Mastery: 140 }, 2: { Intellect: 16, Mastery: 175 }, 3: { Intellect: 20, Mastery: 210 } } },
  { n: "Goblin Warrior", s: ["Bracelet (L)", "Bracelet (R)", "Charm"], d: { 1: { Agility: 12, Crit: 140 }, 2: { Agility: 16, Crit: 175 }, 3: { Agility: 20, Crit: 210 } } },
  { n: "Goblin Axeman", s: ["Bracelet (L)", "Bracelet (R)", "Charm"], d: { 1: { Agility: 12, Haste: 140 }, 2: { Agility: 16, Haste: 175 }, 3: { Agility: 20, Haste: 210 } } },
  { n: "Goblin Priest", s: ["Bracelet (L)", "Bracelet (R)", "Charm"], d: { 1: { Agility: 12, Luck: 140 }, 2: { Agility: 16, Luck: 175 }, 3: { Agility: 20, Luck: 210 } } },
  { n: "Goblin Guard", s: ["Bracelet (L)", "Bracelet (R)", "Charm"], d: { 1: { Agility: 12, Mastery: 140 }, 2: { Agility: 16, Mastery: 175 }, 3: { Agility: 20, Mastery: 210 } } },
] as Array<{ n: string; s: string[]; d: Record<number, Record<string, number>> }>

export const SIGIL_MAP: Record<string, typeof SIGIL_DB> = {}
  ; (GAME_DATA.SLOTS as readonly string[]).forEach(slot => {
    SIGIL_MAP[slot] = SIGIL_DB.filter(s => s.s.includes(slot))
  })

export const MODULE_DB = [
  { name: "Team Luck & Crit", cat: "Extreme", s: [{ "Adaptive ATK": 10 }, { "Adaptive ATK": 20 }, { "Adaptive ATK": 30, "Adaptive Main stat": 35 }, { "Adaptive ATK": 40, "Adaptive Main stat": 50 }, { "Adaptive ATK": 50, "Adaptive Main stat": 60, "Crit DMG (%)": 6.2, "Lucky Strike DMG Multiplier (%)": 4.0 }, { "Adaptive ATK": 60, "Adaptive Main stat": 80, "Crit DMG (%)": 10.4, "Lucky Strike DMG Multiplier (%)": 6.8 }] },
  { name: "Life Steal", cat: "Extreme", s: [{ "ATK": 10 }, { "ATK": 20 }, { "ATK": 30, "Strength": 35 }, { "ATK": 40, "Strength": 50 }, { "ATK": 50, "Strength": 60, "Life Steal (%)": 6.0, "Max HP (%)": 5.0 }, { "ATK": 60, "Strength": 80, "Life Steal (%)": 10.0, "Max HP (%)": 5.0 }] },
  { name: "Life Wave", cat: "Extreme", s: [{ "Max HP": 600 }, { "Max HP": 1200 }, { "Max HP": 1800, "Adaptive Main stat": 20 }, { "Max HP": 2400, "Adaptive Main stat": 40 }, { "Max HP": 3000, "Adaptive Main stat": 60, "Top Stat (%)": 6.0 }, { "Max HP": 3600, "Adaptive Main stat": 80, "Top Stat (%)": 10.0 }] },
  { name: "Luck Focus", cat: "Focus", s: [{ "Max HP": 300 }, { "Max HP": 600 }, { "Max HP": 900, "All Element": 20 }, { "Max HP": 1200, "All Element": 40 }, { "Max HP": 1200, "All Element": 60, "Lucky Strike DMG Multiplier (%)": 4.7, "Lucky Strike Healing (%)": 3.7 }, { "Max HP": 1800, "All Element": 80, "Lucky Strike DMG Multiplier (%)": 7.8, "Lucky Strike Healing (%)": 6.2 }] },
  { name: "Crit Focus", cat: "Focus", s: [{ "Max HP": 300 }, { "Max HP": 600 }, { "Max HP": 900, "All Element": 20 }, { "Max HP": 1200, "All Element": 40 }, { "Max HP": 1200, "All Element": 60, "Crit DMG (%)": 7.1, "Crit Healing (%)": 7.1 }, { "Max HP": 1800, "All Element": 80, "Crit DMG (%)": 12.0, "Crit Healing (%)": 12.0 }] },
  { name: "Attack SPD", cat: "Speed", s: [{ "Adaptive Atk": 5 }, { "Adaptive Atk": 10 }, { "Adaptive Atk": 20 }, { "Adaptive Atk": 30 }, { "Adaptive Atk": 40, "Attack Speed (%)": 3.6 }, { "Adaptive Atk": 50, "Attack Speed (%)": 6.0 }] },
  { name: "Cast Focus", cat: "Speed", s: [{ "Adaptive Atk": 5 }, { "Adaptive Atk": 10 }, { "Adaptive Atk": 20 }, { "Adaptive Atk": 30 }, { "Adaptive Atk": 40, "Cast Speed (%)": 7.2 }, { "Adaptive Atk": 50, "Cast Speed (%)": 12.0 }] },
  { name: "Agile", cat: "Extreme", s: [{ "Adaptive Atk": 10 }, { "Adaptive Atk": 20 }, { "Adaptive Atk": 40, "Adaptive Main stat": 20 }, { "Adaptive Atk": 40, "Adaptive Main stat": 40 }, { "Adaptive Atk": 50, "Adaptive Main stat": 60, "Movement Speed (%)": 18.0 }, { "Adaptive Atk": 60, "Adaptive Main stat": 80, "Movement Speed (%)": 30.0 }] },
  { name: "DMG Stack", cat: "Extreme", s: [{ "Adaptive Atk": 10 }, { "Adaptive Atk": 20 }, { "Adaptive Atk": 40, "Adaptive Main stat": 20 }, { "Adaptive Atk": 40, "Adaptive Main stat": 40 }, { "Adaptive Atk": 50, "Adaptive Main stat": 60, "DMG (%) / stack": 1.65 }, { "Adaptive Atk": 60, "Adaptive Main stat": 80, "DMG (%) / stack": 2.75 }] },
  { name: "Agility Boost", cat: "Standard", s: [{ "ATK": 5 }, { "ATK": 10 }, { "ATK": 15, "Agility": 10 }, { "ATK": 20, "Agility": 20 }, { "ATK": 25, "Agility": 30, "Physical DMG (%)": 3.6 }, { "ATK": 30, "Agility": 40, "Physical DMG (%)": 6.0 }] },
  { name: "Strength Boost", cat: "Standard", s: [{ "ATK": 5 }, { "ATK": 10 }, { "ATK": 15, "Strength": 10 }, { "ATK": 20, "Strength": 20 }, { "ATK": 25, "Strength": 30, "Ignore Armor (%)": 11.5 }, { "ATK": 30, "Strength": 40, "Ignore Armor (%)": 18.8 }] },
  { name: "Intellect Boost", cat: "Standard", s: [{ "MATK": 5 }, { "MATK": 10 }, { "MATK": 15, "Intellect": 10 }, { "MATK": 20, "Intellect": 20 }, { "ATK": 25, "Intellect": 30, "Magical DMG (%)": 3.6 }, { "ATK": 30, "Intellect": 40, "Magical DMG (%)": 6.0 }] },
  { name: "Elite Strike", cat: "Standard", s: [{ "Adaptive Atk": 5 }, { "Adaptive Atk": 10 }, { "Adaptive Atk": 15, "Adaptive Main stat": 10 }, { "Adaptive Atk": 20, "Adaptive Main stat": 20 }, { "Adaptive Atk": 25, "Adaptive Main stat": 30, "DMG Bonus vs Elites (%)": 3.9 }, { "Adaptive Atk": 30, "Adaptive Main stat": 40, "DMG Bonus vs Elites (%)": 6.6 }] },
  { name: "Special Attack", cat: "Standard", s: [{ "Adaptive Atk": 5 }, { "Adaptive Atk": 10 }, { "Adaptive Atk": 15, "Adaptive Main stat": 10 }, { "Adaptive Atk": 20, "Adaptive Main stat": 20 }, { "Adaptive Atk": 25, "Adaptive Main stat": 30, "Special Attack Elemental DMG (%)": 7.2 }, { "Adaptive Atk": 30, "Adaptive Main stat": 40, "Special Attack Elemental DMG (%)": 12.0 }] },
  { name: "Final Protection", cat: "Extreme", s: [{ "Max HP": 600 }, { "Max HP": 1200 }, { "Max HP": 1800, "Strength": 20 }, { "Max HP": 2400, "Strength": 40 }, { "Max HP": 3000, "Strength": 60, "DMG Reduction (%)": 2.0 }, { "Max HP": 3600, "Strength": 80, "DMG Reduction (%)": 2.0 }] },
  { name: "Armor", cat: "Defense", s: [{ "Armor": 80 }, { "Armor": 160 }, { "Armor": 240, "All Element Attack": 5 }, { "Armor": 320, "All Element Attack": 10 }, { "Armor": 400, "All Element Attack": 15, "Physical DMG Reduction (%)": 3.6 }, { "Armor": 480, "All Element Attack": 20, "Physical DMG Reduction (%)": 6.0 }] },
  { name: "Resistance", cat: "Defense", s: [{ "Endurance": 30 }, { "Endurance": 60 }, { "Endurance": 90, "Max HP (%)": 1.0 }, { "Endurance": 120, "Max HP (%)": 2.0 }, { "Endurance": 150, "Max HP (%)": 3.0, "Magical DMG Reduction (%)": 3.6 }, { "Endurance": 180, "Max HP (%)": 4.0, "Magical DMG Reduction (%)": 6.0 }] },
  { name: "First Aid", cat: "Extreme", s: [{ "MATK": 10 }, { "MATK": 20 }, { "MATK": 30, "Intellect": 20 }, { "MATK": 40, "Intellect": 40 }, { "MATK": 50, "Intellect": 60 }, { "MATK": 60, "Intellect": 80 }] },
  { name: "Life Condense", cat: "Extreme", s: [{ "Adaptive Atk": 10 }, { "Adaptive Atk": 20 }, { "Adaptive Atk": 30, "Adaptive Main stat": 20 }, { "Adaptive Atk": 40, "Adaptive Main stat": 40 }, { "Adaptive Atk": 50, "Adaptive Main stat": 60 }, { "Adaptive Atk": 60, "Adaptive Main stat": 80 }] },
  { name: "Healing Enhance", cat: "Healer", s: [{ "MATK": 5 }, { "MATK": 10 }, { "MATK": 15, "Intellect": 10 }, { "MATK": 20, "Intellect": 20 }, { "MATK": 25, "Intellect": 30, "Expertise Skill Healing (%)": 7.2 }, { "MATK": 30, "Intellect": 40, "Expertise Skill Healing (%)": 12.0 }] },
  { name: "Healing Boost", cat: "Healer", s: [{ "MATK": 5 }, { "MATK": 10 }, { "MATK": 15, "Intellect": 10 }, { "MATK": 20, "Intellect": 20 }, { "MATK": 25, "Intellect": 30, "Special Attack Healing (%)": 7.2 }, { "MATK": 30, "Intellect": 40, "Special Attack Healing (%)": 12.0 }] },
] as Array<{ name: string; cat: string; s: Record<string, number>[] }>

export const AFFIX_DB = MODULE_DB.map(m => m.name)

// Cumulative pts needed to reach each level: lv1=1, lv2=4, lv3=8, lv4=12, lv5=16, lv6=20
export const MODULE_THRESHOLDS = [1, 4, 8, 12, 16, 20]

export const LEVEL_COLORS: Record<number, string> = {
  0: "#555555",
  1: "#777777",
  2: "#2ecc71",
  3: "#3498db",
  4: "#9b59b6",
  5: "#e67e22",
  6: "#f1c40f",
}

export type Stat = "Versatility" | "Mastery" | "Haste" | "Crit" | "Luck"
export type Build = "Strength" | "Agility" | "Intellect"

export interface GearSlot {
  tier: string
  raid: boolean
  p: string
  s: string
  r: string
  sigName: string
  sigLvl: string
  locked?: boolean
}

/** Get the slot type for tier lookups: "weapon" | "armor" | "accessory" */
export function getSlotType(slotIdx: number): "weapon" | "armor" | "accessory" {
  if (slotIdx === 0) return "weapon"
  if (slotIdx <= 4 || slotIdx === 8 || slotIdx === 9) return "armor"  // Helmet, Chest, Gloves, Boots, Bracelet (L), Bracelet (R)
  return "accessory"                  // Earrings, Necklace, Ring, Charm
}

/** Check if a slot is a raid-only accessory type */
export function isRaidAccessory(slot: string): boolean {
  return slot === "Bracelet (L)" || slot === "Bracelet (R)"
}

/** Get the tier options available for a given slot type */
export function getTierOptions(slotType: "weapon" | "armor" | "accessory", slotName?: string): string[] {
  if (slotType === "weapon") return Object.keys(GAME_DATA.WEAPON_TIERS)
  if (slotType === "armor") return Object.keys(GAME_DATA.ARMOR_TIERS)

  // accessory
  const base = Object.keys(GAME_DATA.ACCESSORY_TIERS)

  if (slotName && isRaidAccessory(slotName)) {
    // reuse ARMOR raid tiers for bracelets
    const raidArmorTiers = Object.keys(GAME_DATA.ARMOR_TIERS)
      .filter(t => GAME_DATA.ARMOR_TIERS[t].raid)

    return [...new Set([...base, ...raidArmorTiers])]
  }

  return base
}

/** Look up the stat values for a tier. Returns null if tier not found. */
export function getTierData(slotType: "weapon" | "armor" | "accessory", tier: string): { p: number; s: number; r: number; raid: boolean; illu: number } | null {
  if (slotType === "weapon") return GAME_DATA.WEAPON_TIERS[tier] ?? null
  if (slotType === "armor") return GAME_DATA.ARMOR_TIERS[tier] ?? null
  return GAME_DATA.ACCESSORY_TIERS[tier] ?? null
}

/** Get the default tier for a slot */
export function getDefaultTier(slotIdx: number): string {
  const type = getSlotType(slotIdx)
  if (type === "weapon") return "Lv150 Raid"
  return "Lv140 Gold"
}

/**
 * Get the discrete value options for a given purple stat on a given slot+tier.
 * slotType: "weapon" | "access" | "armor"
 * tier: the current gear tier string (e.g. "Lv140 Gold"), used for flat armor stats.
 * Returns an array of valid number options, or [] if not applicable.
 */
export function getPurpleValOptions(stat: string, slotType: "weapon" | "access" | "armor", tier: string): number[] {
  const entry = GAME_DATA.PURPLE_VALS[stat]
  if (!entry) return []
  if (slotType === "weapon") return entry.weapon ?? []
  if (slotType === "access") return entry.access ?? []
  // armor — check for tier-keyed flat stats
  if (entry.armor_by_tier) {
    // Determine tier bucket from tier string
    const lvMatch = tier.match(/Lv(\d+)/i)
    const lv = lvMatch ? parseInt(lvMatch[1]) : 0
    let key: string
    if (lv <= 40) key = "lv40"
    else if (lv <= 60) key = "lv60"
    else if (lv <= 80) key = "lv80"
    else if (lv <= 120) key = "lv120"
    else if (lv <= 149) key = "lv140"
    else key = "lv160"
    return entry.armor_by_tier[key] ?? []
  }
  return entry.armor ?? []
}

/** Get the armor purple stat options filtered by class main stat.
 * Only the matching main stat % (Strength/Agility/Intellect) is shown. */
export function getArmorPurpleForBuild(mainStat: string): string[] {
  const allMainStatPercs = ["Strength (%)", "Agility (%)", "Intellect (%)"]
  const validMainStatPerc = `${mainStat} (%)`
  return GAME_DATA.ARMOR_PURPLE.filter(p => p !== "None" && (!allMainStatPercs.includes(p) || p === validMainStatPerc))
}

/** Find the best matching raid tier for a given slot type and current level */
export function findRaidTier(slotType: "weapon" | "armor" | "accessory", currentTier: string): string | null {
  const tiers = slotType === "weapon" ? GAME_DATA.WEAPON_TIERS
    : slotType === "armor" ? GAME_DATA.ARMOR_TIERS
      : GAME_DATA.ACCESSORY_TIERS
  const lvMatch = currentTier.match(/Lv(\d+)/i)
  const lv = lvMatch ? parseInt(lvMatch[1]) : 140
  const candidates = Object.entries(tiers)
    .filter(([, data]) => data.raid)
    .map(([name]) => {
      const m = name.match(/Lv(\d+)/i)
      return { name, lv: m ? parseInt(m[1]) : 0 }
    })
    .sort((a, b) => Math.abs(a.lv - lv) - Math.abs(b.lv - lv))
  return candidates.length > 0 ? candidates[0].name : null
}

/** Find the best matching gold (non-raid) tier for a given slot type and current level */
export function findGoldTier(slotType: "weapon" | "armor" | "accessory", currentTier: string): string | null {
  const tiers = slotType === "weapon" ? GAME_DATA.WEAPON_TIERS
    : slotType === "armor" ? GAME_DATA.ARMOR_TIERS
      : GAME_DATA.ACCESSORY_TIERS
  const lvMatch = currentTier.match(/Lv(\d+)/i)
  const lv = lvMatch ? parseInt(lvMatch[1]) : 140
  const candidates = Object.entries(tiers)
    .filter(([, data]) => !data.raid)
    .map(([name]) => {
      const m = name.match(/Lv(\d+)/i)
      return { name, lv: m ? parseInt(m[1]) : 0 }
    })
    .sort((a, b) => Math.abs(a.lv - lv) - Math.abs(b.lv - lv))
  return candidates.length > 0 ? candidates[0].name : null
}

/** Get sorted unique level numbers available for a slot type (for merged-tier dropdown) */
export function getUniqueTierLevels(slotType: "weapon" | "armor" | "accessory"): number[] {
  const tiers = slotType === "weapon" ? GAME_DATA.WEAPON_TIERS
    : slotType === "armor" ? GAME_DATA.ARMOR_TIERS
      : GAME_DATA.ACCESSORY_TIERS
  const levels = new Set<number>()
  for (const key of Object.keys(tiers)) {
    const m = key.match(/Lv(\d+)/i)
    if (m) levels.add(parseInt(m[1]))
  }
  return [...levels].sort((a, b) => a - b)
}

/** Get the actual tier key for a given level + raid preference.
 *  Falls back to whatever variant exists if the preferred one is missing. */
export function getTierForLevel(slotType: "weapon" | "armor" | "accessory", level: number, wantRaid: boolean): string | null {
  const tiers = slotType === "weapon" ? GAME_DATA.WEAPON_TIERS
    : slotType === "armor" ? GAME_DATA.ARMOR_TIERS
      : GAME_DATA.ACCESSORY_TIERS
  const at = Object.entries(tiers).filter(([key]) => {
    const m = key.match(/Lv(\d+)/i)
    return m && parseInt(m[1]) === level
  })
  if (at.length === 0) return null
  const preferred = at.find(([, data]) => data.raid === wantRaid)
  return preferred ? preferred[0] : at[0][0]
}

/** Returns true if a level has BOTH a raid and a non-raid tier variant */
export function levelHasBothVariants(slotType: "weapon" | "armor" | "accessory", level: number): boolean {
  const tiers = slotType === "weapon" ? GAME_DATA.WEAPON_TIERS
    : slotType === "armor" ? GAME_DATA.ARMOR_TIERS
      : GAME_DATA.ACCESSORY_TIERS
  const at = Object.entries(tiers).filter(([key]) => {
    const m = key.match(/Lv(\d+)/i)
    return m && parseInt(m[1]) === level
  })
  return at.some(([, d]) => d.raid) && at.some(([, d]) => !d.raid)
}

export interface GearLibItem {
  slot: string
  name?: string
  level?: number
  perfection?: number
  is_raid?: boolean
  primary_stat?: string
  secondary_stat?: string
  reforge_stat?: string
  sigil?: string
  sigil_level?: number
  legendary_type?: string
  legendary_value?: number
}

export interface StatsResult {
  total: Record<string, number>
  purpleStats: Record<string, number>
  extraStats: Record<string, number>
  moduleStats: Record<string, number>
  powerCorePoints: Record<string, number>
  appliedBonus: { l: string; v: number; t: string } | null
  weaponEffects: string[]
  aspd: number
  cspd: number
  talentAspd: number
  ext: Record<string, number>
  raidArmorCount: number
  raid2pcBonus: { l: string; v: number; t: "aspd" | "cspd" | "stat_pct" | "mastery_crit" | "aspd_cond" | "armor_ignore" | "text"; note?: string } | null
  raid4pcBonus: { l: string; v: number; t: "aspd" | "cspd" | "stat_pct" | "mastery_crit" | "aspd_cond" | "armor_ignore" | "text" | "crit_dmg" | "haste_pct" | "main_stat_pct"; note?: string } | null
  set4pcHaste: number
}
