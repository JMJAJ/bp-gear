import marksmanData from "@/public/planner-data/marksman.json"
import shieldKnightData from "@/public/planner-data/shield_knight.json"
import verdantOracleData from "@/public/planner-data/verdant_oracle.json"
import windKnightData from "@/public/planner-data/wind_knight.json"
import beatPerformerData from "@/public/planner-data/beat_performer.json"
import frostMageData from "@/public/planner-data/frost_mage.json"
import heavyGuardianData from "@/public/planner-data/heavy_guardian.json"
import generalTalentsData from "@/public/planner-data/general_talents.json"

export interface TalentEntry {
  id: string
  name: string
  desc: string
  icon: string
}

interface TalentFile {
  kind: "talents"
  class: string
  talents: TalentEntry[]
}

// Build TALENT_DATA from static JSON files
const talentFiles: TalentFile[] = [
  marksmanData as TalentFile,
  shieldKnightData as TalentFile,
  verdantOracleData as TalentFile,
  windKnightData as TalentFile,
  beatPerformerData as TalentFile,
  frostMageData as TalentFile,
  heavyGuardianData as TalentFile,
]

// Map class names from JSON to expected format
const classNameMap: Record<string, string> = {
  "Marksman": "Marksman",
  "Shield Knight": "Shield Knight",
  "Verdant Oracle": "Verdant Oracle",
  "Wind Knight": "Wind Knight",
  "Beat Performer": "Beat Performer",
  "Frost Mage": "Frostmage", // Note: JSON uses "Frost Mage", code expects "Frostmage"
  "Heavy Guardian": "Heavy Guardian",
}

export const TALENT_DATA: Record<string, TalentEntry[]> = {}

// Populate TALENT_DATA from JSON files
for (const file of talentFiles) {
  const className = classNameMap[file.class] ?? file.class
  TALENT_DATA[className] = file.talents
}

// Export general talents separately
export const GENERAL_TALENTS: TalentEntry[] = (generalTalentsData as TalentFile).talents

// Legacy Stormblade data - kept until stormblade.json is created
// Stormblade talents are hardcoded since we don't have the HTML source yet
TALENT_DATA["Stormblade"] = [
  { id: "blade_intent", name: "Blade Intent", desc: "3 points of Blade Intent are gained when an Expertise Skill is cast.", icon: "https://assets-ng.maxroll.gg/sr-tools/assets/db/icons/talents/talent_passive_icon_general_tank_shieldbash.webp" },
  { id: "agility_conversion", name: "Agility Conversion", desc: "Every 8 Agility grants 1 ATK.", icon: "https://assets-ng.maxroll.gg/sr-tools/assets/db/icons/talents/talent_passive_icon_general_dps_strtran.webp" },
  { id: "thunder_whirl", name: "Thunder Whirl", desc: "Piercing Slash grants Overdrive 1 charge.", icon: "https://assets-ng.maxroll.gg/sr-tools/assets/db/icons/talents/talent_passive_icon_general_dps_injured.webp" },
  { id: "keen_strike", name: "Keen Strike", desc: "When Basic Attacks deal DMG, 10% chance to trigger Piercing Slash, once per second.", icon: "https://assets-ng.maxroll.gg/sr-tools/assets/db/icons/talents/talent_passive_icon_general_dps_fullattack.webp" },
  { id: "keen_enhancement", name: "Keen Enhancement", desc: "Increases the fixed chance to trigger Piercing Slash by 10%.", icon: "https://assets-ng.maxroll.gg/sr-tools/assets/db/icons/talents/talent_passive_icon_general_dps_fullattack.webp" },
  { id: "iaido_mastery", name: "Iaido Mastery", desc: "Iaido Slash Crit +10%. Each 1% Crit chance grants 0.15% Crit DMG for skills that consume Thunder Sigils. When Crit chance exceeds 60%, every extra 1% grants an additional 0.32% Crit DMG for skills that consume Thunder Sigils.", icon: "https://assets-ng.maxroll.gg/sr-tools/assets/db/icons/talents/talent_passive_icon_general_dps_draw.webp" },
  { id: "wind_assault_i", name: "Wind Assault I", desc: "Crit Rate obtained in any way is increased by 12%, but Luck chance obtained in any way are reduced by 10%.", icon: "https://assets-ng.maxroll.gg/sr-tools/assets/db/icons/talents/taidao144.webp" },
  { id: "zen_moment", name: "Zen Moment", desc: "Crit hits of Special Attacks grant 100 Blade Intent.", icon: "https://assets-ng.maxroll.gg/sr-tools/assets/db/icons/talents/talent_passive_icon_general_dps_instant.webp" },
  { id: "thunder_sigil_charm", name: "Thunder Sigil Charm", desc: "Increases Max Thunder Sigil by 1.", icon: "https://assets-ng.maxroll.gg/sr-tools/assets/db/icons/talents/taidao136.webp" },
  { id: "thunder_reversal", name: "Thunder Reversal", desc: "Consumes 100 Blade Intent to gain stacks of Thunder Reversal Mark. When Thunder Reversal Mark reaches 5 stacks, casting Iaido Slash grants the Thunder Reversal effect and removes all Thunder Reversal Mark stacks. Thunder Reversal: Gain a 10% Thunder DMG bonus for 15s. During Thunder Reversal, Thunder Reversal Mark cannot be gained.", icon: "https://assets-ng.maxroll.gg/sr-tools/assets/db/icons/talents/talent_passive_icon_general_dps_pursue.webp" },
  { id: "vacuum_slash", name: "Vacuum Slash", desc: "Each cast of Flash Strike, Raijin Dash, or its enhanced skills grants 1 stack of Thundrage. When Thundrage reaches 5 stacks, Iaido Slash evolves into Thunder Cut. After casting Thunder Cut, 5 stacks of Thundrage are consumed. Thundrage stacks up to 8 times.", icon: "https://assets-ng.maxroll.gg/sr-tools/assets/db/icons/talents/talent_passive_icon_general_dps_swordbullet.webp" },
  { id: "flash_frenzy_blade", name: "Flash Frenzy Blade", desc: "When Iaido Slash and its enhanced skill (Thunder Cut) deal DMG, there is a fixed 10% chance to reset the remaining CD of Flash Strike and Raijin Dash. For each Thunder Sigil consumed, the chance increases by 10%.", icon: "https://assets-ng.maxroll.gg/sr-tools/assets/db/icons/talents/talent_passive_icon_general_dps_thundermastery.webp" },
  { id: "bladewind_domain", name: "Bladewind Domain", desc: "Every 3 casts of Overdrive allows the next Iaido Slash to generate a Bladewind Domain in front. Each time Bladewind Domain deals DMG, reduces the CD of Oblivion Combo by 1.5s.", icon: "https://assets-ng.maxroll.gg/sr-tools/assets/db/icons/talents/talent_skill_360105.webp" },
  { id: "touch_of_thunder_soul", name: "Touch of Thunder Soul", desc: "Moonblades have a fixed 60% chance to cast Thunderstrike on a Lucky Strike. Thunderstrike deals double DMG.", icon: "https://assets-ng.maxroll.gg/sr-tools/assets/db/icons/talents/talent_passive_icon_general_dps_thunderstrike.webp" },
  { id: "breath_of_mark", name: "Breath of Mark", desc: "Lucky Strikes of Moonblades grant a fixed 30% chance to restore 1 Thunder Sigil, once per 2 seconds.", icon: "https://assets-ng.maxroll.gg/sr-tools/assets/db/icons/talents/talent_passive_icon_general_dps_thunderrepro.webp" },
  { id: "phantom_delay", name: "Phantom Delay", desc: "For 12 seconds after casting Chaos Breaker, whenever the Talents Raijin Dash Charge, Moonlight Charge, and Charge Catcher obtain a Charge Seed, 1 additional Charge Seed is granted.", icon: "https://assets-ng.maxroll.gg/sr-tools/assets/db/icons/talents/talent_passive_icon_general_dps_thunderseed.webp" },
  { id: "phantom_scythe_realm_i", name: "Phantom Scythe Realm I", desc: "Increases Max Moonblades by 1.", icon: "https://assets-ng.maxroll.gg/sr-tools/assets/db/icons/talents/talent_passive_icon_general_dps_sickleairun.webp" },
  { id: "phantom_scythe_realm_ii", name: "Phantom Scythe Realm II", desc: "Casting Thundercut grants 12 + Luck% x 10 points of Blade Intent.", icon: "https://assets-ng.maxroll.gg/sr-tools/assets/db/icons/talents/talent_passive_icon_general_dps_sickleairun.webp" },
  { id: "power_of_thunder", name: "Power of Thunder", desc: "For every 10 instances of damage dealt, triggers Thunder Power. Thunder Power: Thunder DMG +15 for 10s, up to 10 stacks.", icon: "https://assets-ng.maxroll.gg/sr-tools/assets/db/icons/talents/talent_passive_icon_general_dps_sickletime.webp" },
  { id: "moonstrike_delay", name: "Moonstrike Delay", desc: "Blade Intent cap +25. After 5 consecutive Thundercuts in one go, it evolves into the more powerful Thundercleave, which deals higher DMG.", icon: "https://assets-ng.maxroll.gg/sr-tools/assets/db/icons/talents/taidao150.webp" },
  { id: "lightning_flash", name: "Lightning Flash", desc: "During Stormflash, doubles Moonblades' Attack SPD.", icon: "https://assets-ng.maxroll.gg/sr-tools/assets/db/icons/talents/talent_passive_icon_general_dps_sicklespeed.webp" },
  { id: "thunder_curse", name: "Thunder Curse", desc: "Special Attacks inflict Thunder Curse on the target upon dealing DMG. Thunder Curse: Each stack of Thunder Curse increases the target's DMG taken from you by 2% for 10s, stacking up to 4 times.", icon: "https://assets-ng.maxroll.gg/sr-tools/assets/db/icons/talents/talent_passive_icon_general_dps_thundercurse.webp" },
  { id: "duel_awareness", name: "Duel Awareness", desc: "Deals 20% more DMG to enemies with 80% HP or above.", icon: "https://assets-ng.maxroll.gg/sr-tools/assets/db/icons/talents/talent_passive_icon_dps_combo02.webp" },
  { id: "frenzied_thunder_roar", name: "Frenzied Thunder Roar", desc: "Defeating an enemy triggers Thunderburst, once every 3s.", icon: "https://assets-ng.maxroll.gg/sr-tools/assets/db/icons/talents/talent_passive_icon_general_dps_thunderkill.webp" },
  { id: "shadow_despise", name: "Shadow Despise", desc: "For each enemy within 3m, you gain 3% Armor Penetration, up to 15%. This effect is doubled against Elite or stronger enemies.", icon: "https://assets-ng.maxroll.gg/sr-tools/assets/db/icons/talents/talent_passive_icon_general_dps_ignoredef.webp" },
  { id: "iai_thunder_dance", name: "Iai Thunder Dance", desc: "When Thunder Sigils are at 3 or higher, Special Attack hits twice times consecutively.", icon: "https://assets-ng.maxroll.gg/sr-tools/assets/db/icons/talents/talent_passive_icon_general_dps_doublehit.webp" },
  { id: "thunder_seed", name: "Thunder Seed", desc: "Casting Thundercut guarantees 2 Charge Seed.", icon: "https://assets-ng.maxroll.gg/sr-tools/assets/db/icons/talents/taidao157.webp" },
  { id: "flash_sharp_strike", name: "Flash Sharp Strike", desc: "Triggers Sharp Strike when casting Iaido Slash and its enhanced skill (Thunder Cut). Sharp Strike: Increases Crit Rate of Flash Strike and its enhanced skill (Dracoflash) by 10%. If Flash Strike and its enhanced skill (Dracoflash) deals Crit DMG 1 time, gains 1 Thunder Sigil. This effect is removed after the use of Flash Strike and its enhanced skill (Dracoflash) or after 10s.", icon: "https://assets-ng.maxroll.gg/sr-tools/assets/db/icons/talents/talent_passive_icon_dps_crit04.webp" },
  { id: "rapid_thunder_assault", name: "Rapid Thunder Assault", desc: "Each additional Thunder Sigil consumed by a skill increases its DMG by 3%.", icon: "https://assets-ng.maxroll.gg/sr-tools/assets/db/icons/talents/talent_passive_icon_general_dps_thundercost.webp" },
  { id: "end_of_annihilation", name: "End of Annihilation", desc: "The final strike of Oblivion Combo is empowered into Ultimate Slash.", icon: "https://assets-ng.maxroll.gg/sr-tools/assets/db/icons/talents/talent_passive_icon_dps_comboconversion.webp" },
  { id: "swift", name: "Swift", desc: "Each 1% Haste provides 1% Attack Speed.", icon: "https://assets-ng.maxroll.gg/sr-tools/assets/db/icons/talents/taidao135.webp" },
  { id: "thunder_sigil_charm_2", name: "Thunder Sigil Charm", desc: "Increases Max Thunder Sigil by 1.", icon: "https://assets-ng.maxroll.gg/sr-tools/assets/db/icons/talents/taidao136.webp" },
  { id: "swift_blade", name: "Swift Blade", desc: "When Agility reaches 500 points, Crit DMG and Luck Damage +5%.", icon: "https://assets-ng.maxroll.gg/sr-tools/assets/db/icons/talents/taidao137.webp" },
  { id: "thunder_charm_blade", name: "Thunder Charm Blade", desc: "For each 1 Thunder Sigil consumed by Expertise Skill, gain an additional 3 points of Blade Intent. For every consumption of Blade Intent, grants 20% Resistance for 5s.", icon: "https://assets-ng.maxroll.gg/sr-tools/assets/db/icons/talents/taidao138.webp" },
  { id: "infinite_thunder", name: "Infinite Thunder", desc: "For every 5 Thunder Sigils consumed, the remaining CD of Volt Surge -0.5s.", icon: "https://assets-ng.maxroll.gg/sr-tools/assets/db/icons/talents/taidao139.webp" },
  { id: "thunder_sigil_rewind", name: "Thunder Sigil Rewind", desc: "When consuming Thunder Sigils, there is a chance to return 1 Thunder Sigil, and for each additional 1 Thunder Sigil consumed, the return chance +9%.", icon: "https://assets-ng.maxroll.gg/sr-tools/assets/db/icons/talents/taidao140.webp" },
  { id: "thunder_might", name: "Thunder Might", desc: "Activate Volt Surge. Flash Strike and Raijin Dash evolve into Dracoflash and Phantom Slash.", icon: "https://assets-ng.maxroll.gg/sr-tools/assets/db/icons/talents/taidao141.webp" },
  { id: "unmatched_raijin_dash", name: "Unmatched Raijin Dash", desc: "Raijin Dash and its enhanced skill (Phantom Slash) ignore the target's Armor. Raijin Dash and its enhanced skill (Phantom Slash) deal 10% more damage per additional 1 enemy hit.", icon: "https://assets-ng.maxroll.gg/sr-tools/assets/db/icons/talents/taidao142.webp" },
  { id: "violent_slash", name: "Violent Slash", desc: "Increases the critical rate of Iaido Slash and Thunder Cut by 12%.", icon: "https://assets-ng.maxroll.gg/sr-tools/assets/db/icons/talents/taidao143.webp" },
  { id: "wind_assault_ii", name: "Wind Assault II", desc: "Crit Rate obtained in any way is increased by 12%, but Luck chance obtained in any way are reduced by 10%.", icon: "https://assets-ng.maxroll.gg/sr-tools/assets/db/icons/talents/taidao144.webp" },
  { id: "dual_blade_intent", name: "Dual Blade Intent", desc: "When Blade Intent is at least 100, Flash Strike, Raijin Dash, and their enhanced skills (Dracoflash, Phantom Slash) gain Crit Rate by 10%. When Blade Intent is at least 100, greatly increases Flash Strike's and Raijin Dash's casting speed.", icon: "https://assets-ng.maxroll.gg/sr-tools/assets/db/icons/talents/taidao145.webp" },
  { id: "thunder_sigil_affinity", name: "Thunder Sigil Affinity", desc: "Each additional Thunder Sigil consumed by Expertise Skill or Special Attacks increases your Thunder DMG dealt by 1.5% when they deal DMG.", icon: "https://assets-ng.maxroll.gg/sr-tools/assets/db/icons/talents/taidao146.webp" },
  { id: "thundrage", name: "Thundrage", desc: "Each use of Dracoflash or Phantom Slash grants 4 stacks of Thundrage, up to 8 stacks.", icon: "https://assets-ng.maxroll.gg/sr-tools/assets/db/icons/talents/taidao147.webp" },
  { id: "overdrive_refinement", name: "Overdrive Refinement", desc: "Reduces the CD of Overdrive by 30%.", icon: "https://assets-ng.maxroll.gg/sr-tools/assets/db/icons/talents/taidao148.webp" },
  { id: "blade_intent_thundestrike", name: "Blade Intent Thundestrike", desc: "When Iaido Slash deals Crit DMG, if the Blade Intent exceeds 20, launches Thunderstrike (which can only be triggered once per use of Iaido Slash).", icon: "https://assets-ng.maxroll.gg/sr-tools/assets/db/icons/talents/taidao149.webp" },
  { id: "thunder_sigil_charm_3", name: "Thunder Sigil Charm", desc: "Increases Max Thunder Sigil by 1.", icon: "https://assets-ng.maxroll.gg/sr-tools/assets/db/icons/talents/taidao136.webp" },
  { id: "break_slash", name: "Break Slash", desc: "When dealing Crit DMG, Iaido Slash and its enhanced skill (Thunder Cut) nullifies 30% of the targets' Armor.", icon: "https://assets-ng.maxroll.gg/sr-tools/assets/db/icons/talents/taidao151.webp" },
  { id: "arcane", name: "Arcane", desc: "Crit DMG +10%", icon: "https://assets-ng.maxroll.gg/sr-tools/assets/db/icons/talents/taidao152.webp" },
  { id: "instant_slash", name: "Instant Slash", desc: "Iaido Slash reduces the Armor of the target hit by 6%. The effect lasts 5s and stacks up to 5 times.", icon: "https://assets-ng.maxroll.gg/sr-tools/assets/db/icons/talents/taidao153.webp" },
  { id: "advancement", name: "Advancement", desc: "Mastery +6%", icon: "https://assets-ng.maxroll.gg/sr-tools/assets/db/icons/talents/taidao154.webp" },
  { id: "thunder_scythe", name: "Thunder Scythe", desc: "Reduces the Charge Seeds that Storm Scythe consumes by 5.", icon: "https://assets-ng.maxroll.gg/sr-tools/assets/db/icons/talents/taidao155.webp" },
  { id: "blade_intent_recovery", name: "Blade Intent Recovery", desc: "Each 1% Haste increases the REG SPD of Blade Intent by 1%.", icon: "https://assets-ng.maxroll.gg/sr-tools/assets/db/icons/talents/taidao156.webp" },
  { id: "divine_sickle", name: "Divine Sickle", desc: "Casting Storm Scythe 7 times triggers Divine Sickle. Divine Sickle is guaranteed to Crit. When Luck is between 28% and 45%, Divine Sickle's final damage increases by 100%, but requires 14 casts of Storm Scythe to trigger. When Luck chance is above 45%, final damage increases by 200%, but requires 21 casts of Storm Scythe to trigger.", icon: "https://assets-ng.maxroll.gg/sr-tools/assets/db/icons/talents/taidao158.webp" },
  { id: "moonlight_charge", name: "Moonlight Charge", desc: "If Luck chance exceeds 25%, Moonblades trigger a Lucky Strike to gain Charge Seed. Otherwise, when Moonblades deal DMG, it has a fixed 25% chance to gain Charge Seed.", icon: "https://assets-ng.maxroll.gg/sr-tools/assets/db/icons/talents/taidao159.webp" },
  { id: "blade_intent_rare", name: "Blade Intent - Rare", desc: "Increases Max Blade Intent by 75.", icon: "https://assets-ng.maxroll.gg/sr-tools/assets/db/icons/talents/taidao160.webp" },
  { id: "thousand_thunder_flashes", name: "Thousand Thunder Flashes", desc: "Each 2 Thunderstrike triggered reduces the CD of Stormflash by 0.5s.", icon: "https://assets-ng.maxroll.gg/sr-tools/assets/db/icons/talents/taidao161.webp" },
  { id: "chaos_breaker", name: "Chaos Breaker", desc: "When Stormflash is activated, Moonstrike evolves into Chaos Breaker.", icon: "https://assets-ng.maxroll.gg/sr-tools/assets/db/icons/talents/taidao162.webp" },
  { id: "enhanced_thunderstrike", name: "Enhanced Thunderstrike", desc: "Increases the DMG dealt by Thunderstrike by 20%. Each 1% Luck grants Thunderstrike 1% more DMG dealt.", icon: "https://assets-ng.maxroll.gg/sr-tools/assets/db/icons/talents/taidao163.webp" },
  { id: "charge_catcher", name: "Charge Catcher", desc: "Each enemy defeated grants 1 Charge Seed (effective within a team).", icon: "https://assets-ng.maxroll.gg/sr-tools/assets/db/icons/talents/taidao164.webp" },
  { id: "thunderstrike_whisper", name: "Thunderstrike Whisper", desc: "Increases the Thunder DMG Thunderstrike deals by 50%, yet Thunderstrike never deals Crit DMG.", icon: "https://assets-ng.maxroll.gg/sr-tools/assets/db/icons/talents/taidao165.webp" },
  { id: "moonstrike_sharp_strike", name: "Moonstrike Sharp Strike", desc: "When Blade Intent is at least 50, Moonstrike and its enhanced skill (Chaos Breaker) are guaranteed to land a Crit.", icon: "https://assets-ng.maxroll.gg/sr-tools/assets/db/icons/talents/taidao166.webp" },
  { id: "thunder_sigil_charm_4", name: "Thunder Sigil Charm", desc: "Increases Max Thunder Sigil by 1. During Stormflash, each trigger of Storm Scythe extends its duration by 0.5s, up to 5s.", icon: "https://assets-ng.maxroll.gg/sr-tools/assets/db/icons/talents/taidao167.webp" },
  { id: "thunder_rune_mastery", name: "Thunder Rune Mastery", desc: "Doubles Max Blade Intent.", icon: "https://assets-ng.maxroll.gg/sr-tools/assets/db/icons/talents/taidao168.webp" },
  { id: "raijin_dash_charge", name: "Raijin Dash Charge", desc: "When Thundercut triggers a Lucky Strike, grants 1 Charge Seed.", icon: "https://assets-ng.maxroll.gg/sr-tools/assets/db/icons/talents/taidao169.webp" },
  { id: "moonblade_swift", name: "Moonblade Swift", desc: "Moonblades additionally deal 1 instance of Whirling DMG every 6s. Each 2% Haste reduces its CD by 1%.", icon: "https://assets-ng.maxroll.gg/sr-tools/assets/db/icons/talents/taidao170.webp" },
  { id: "thunder_might_2", name: "Thunder Might", desc: "During Stormflash, Storm Scythe will activate twice in succession.", icon: "https://assets-ng.maxroll.gg/sr-tools/assets/db/icons/talents/taidao170.webp" },
  { id: "thunder_sigil_rewind_2", name: "Thunder Sigil Rewind", desc: "During Volt Surge, the return chance of Thunder Sigil Rewind doubles, but the damage bonus of non-derivative skills that consume Thunder Sigil is reduced from 25% to 20%.", icon: "https://assets-ng.maxroll.gg/sr-tools/assets/db/icons/talents/talent_passive_icon_general_dps_sicklespeed.webp" },
]
