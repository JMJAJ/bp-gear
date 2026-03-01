"use client"
import { useState } from "react"
import { useApp } from "@/lib/app-context"
import { SIGIL_DB, MODULE_DB, GAME_DATA } from "@/lib/game-data"

function CollapsibleSection({ title, children, accent }: { title: string; children: React.ReactNode; accent?: boolean }) {
  const [open, setOpen] = useState(false)
  const { accentColor } = useApp()
  return (
    <div className="mb-2">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 border border-[#222] bg-[#0a0a0a] text-left transition-all hover:bg-[#111]"
        style={accent ? { borderLeftColor: accentColor, borderLeftWidth: 2 } : undefined}
      >
        <span className="text-[11px] font-bold uppercase tracking-[0.5px]" style={{ color: accent ? accentColor : "#ccc" }}>{title}</span>
        <span className="text-[#555] text-[10px]" style={{ color: open ? accentColor : undefined }}>
          {open ? "▾" : "▸"}
        </span>
      </button>
      {open && (
        <div className="border border-t-0 border-[#222] bg-[#0a0a0a] p-4 overflow-x-auto">
          {children}
        </div>
      )}
    </div>
  )
}

function Table({ headers, rows }: { headers: string[]; rows: (string | number)[][] }) {
  return (
    <table className="w-full border-collapse text-[10px]">
      <thead>
        <tr className="border-b border-[#222]">
          {headers.map(h => (
            <th key={h} className="text-left text-[9px] uppercase tracking-[0.5px] text-[#444] font-semibold px-2 py-2">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i} className="border-b border-[#0d0d0d] hover:bg-white/[0.01]">
            {row.map((cell, j) => (
              <td key={j} className={`px-2 py-1.5 ${j === 0 ? "text-white font-medium" : "text-[#666]"}`}>
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function FormulaBlock({ children }: { children: React.ReactNode }) {
  const { accentColor } = useApp()
  return (
    <pre className="text-[10px] rounded px-4 py-2 my-2 border border-[#1a1a1a] bg-[#060606] font-mono leading-5 whitespace-pre-wrap" style={{ color: accentColor }}>
      {children}
    </pre>
  )
}

function Note({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] text-[#555] mt-2 leading-5">{children}</p>
}

export function DatabaseSection() {
  const { accentColor } = useApp()

  // ── Sigils ───────────────────────────────────────────────────────────────
  const sigilRows = SIGIL_DB.map(s => {
    const fmt = (d: Record<string, number>) => Object.entries(d).map(([k, v]) => `${k}: ${v}`).join(", ")
    return [s.n, s.s.join(", "), fmt(s.d[1]), fmt(s.d[2]), fmt(s.d[3])]
  })

  // ── Modules ──────────────────────────────────────────────────────────────
  const modRows = MODULE_DB.map(m => {
    const fmt = (s: Record<string, number>) => Object.entries(s).map(([k, v]) => `${k}: ${v}`).join(", ")
    return [m.name, m.cat, fmt(m.s[0]), fmt(m.s[3]), fmt(m.s[4]), fmt(m.s[5])]
  })

  // ── Imagines — derived from GAME_DATA.IMAGINE.OPTIONS ────────────────────
  const imagineRows = Object.entries(GAME_DATA.IMAGINE.OPTIONS).map(([name, opt]) => {
    const v = opt.vals
    return [name, opt.stat, v[0], v[1], v[2], v[3], v[4], v[5]]
  })

  // ── Weapon Tiers ─────────────────────────────────────────────────────────
  const weaponTierRows = Object.entries(GAME_DATA.WEAPON_TIERS).map(([tier, d]) => [
    tier, d.p, d.s, d.r || "—", d.raid ? "✓" : "—", d.illu || "—"
  ])

  // ── Armor Tiers ──────────────────────────────────────────────────────────
  const armorTierRows = Object.entries(GAME_DATA.ARMOR_TIERS).map(([tier, d]) => [
    tier, d.p, d.s, d.r || "—", d.raid ? "✓" : "—", d.illu || "—"
  ])

  // ── Accessory Tiers ──────────────────────────────────────────────────────
  const accessoryTierRows = Object.entries(GAME_DATA.ACCESSORY_TIERS).map(([tier, d]) => [
    tier, d.p, d.s, d.r || "—", d.illu || "—"
  ])

  // ── Classes ───────────────────────────────────────────────────────────────
  const classRows = Object.entries(GAME_DATA.CLASSES).map(([cls, d]) => [
    cls, d.parent, d.role, d.main, d.atk, d.element ?? "—", d.specs.join(" / ")
  ])

  // ── Specs: Weapon Buffs + Raid Bonus ──────────────────────────────────────
  const specRows = Object.entries(GAME_DATA.WEAPON_BUFFS).map(([spec, wb]) => {
    const rb = GAME_DATA.RAID_BONUS[spec]
    const b1str = wb.b1 ? `${wb.b1} +${wb.b1v}%` : "—"
    const b2str = wb.b2 ? `${wb.b2} +${wb.b2v}%` : "—"
    const rbStr = rb ? `${rb.l}: ${rb.v}%` : "—"
    return [spec, b1str, b2str, wb.other, rbStr]
  })

  // ── Raid 2pc Bonuses ─────────────────────────────────────────────────────
  const raid2pcRows = Object.entries(GAME_DATA.RAID_2PC).map(([spec, d]) => [
    spec, d ? d.l : "—"
  ])

  // ── Raid 4pc Bonuses ─────────────────────────────────────────────────────
  const raid4pcRows = Object.entries(GAME_DATA.RAID_4PC).map(([spec, d]) => [
    spec, d ? d.l : "—"
  ])

  // ── Stat Restrictions by Slot ────────────────────────────────────────────
  const restrictionRows = Object.entries(GAME_DATA.RESTRICTIONS)
    .filter(([, v]) => v.Strength.length > 0 || v.Intellect.length > 0 || v.Agility.length > 0)
    .map(([slot, v]) => [slot, v.Strength.join(", ") || "Any", v.Intellect.join(", ") || "Any", v.Agility.join(", ") || "Any"])

  // ── Haste Ratios ─────────────────────────────────────────────────────────
  const hasteRows = Object.entries(GAME_DATA.HASTE_RATIOS).map(([cls, r]) => [
    cls, `×${r.aspd}`, `×${r.cspd}`
  ])

  // ── Purple Weapon/Accessory Rolls ────────────────────────────────────────
  const purpleWeaponRows = Object.entries(GAME_DATA.PURPLE_VALS)
    .filter(([, v]) => (v as any).weapon?.length > 0)
    .map(([stat, v]) => [stat, (v as any).weapon.join(" / "), (v as any).access?.join(" / ") || "—"])

  // ── Stat Conversion Constants ────────────────────────────────────────────
  const constantRows = Object.entries(GAME_DATA.CONSTANTS).map(([stat, c]) => [
    stat, c.c.toLocaleString(), c.base
  ])

  return (
    <div>
      <div className="mb-6">
        <div className="text-2xl font-bold tracking-tight text-white mb-1">Database</div>
        <div className="text-[11px] text-[#555] max-w-xl leading-5">
          Complete reference data from the BPSR Gear Calculator datamine. Expand any section to browse.
          The <span style={{ color: accentColor }}>Calculations</span> section explains the exact math engine powering this tool.
        </div>
      </div>

      {/* ── Calculations & Formulas ────────────────────────────────────────── */}
      <CollapsibleSection title="⚙ Calculations & Formulas" accent>
        <div className="space-y-5 text-[10px] leading-5">

          <div>
            <div className="text-[11px] font-bold text-white mb-1">1 · Stat % Conversion</div>
            <Note>Raw stat points (e.g. from gear rolls, sigils, imagines) are converted to a percentage using the square-root formula derived from the datamine. Each stat has its own constant <span className="text-[#aaa]">c</span> and an additive <span className="text-[#aaa]">base</span>:</Note>
            <FormulaBlock>{`stat% = sqrt( raw_points / c ) × 100 + base

Stat         |  c       | base
-------------|----------|------
Versatility  | 11 200   |  0%
Mastery      | 19 975   |  6%
Haste        | 19 975   |  0%
Crit         | 19 975   |  5%
Luck         | 19 975   |  5%`}</FormulaBlock>
            <Note>Example: 3 584 raw Mastery → sqrt(3584 / 19975) × 100 + 6 ≈ 19.4% Mastery.</Note>
          </div>

          <div>
            <div className="text-[11px] font-bold text-white mb-1">2 · Gear Slot Stats (Primary / Secondary / Reforge)</div>
            <Note>Each piece of gear contributes three independent stat rolls:</Note>
            <FormulaBlock>{`Primary   — highest roll; you choose which of the 5 stats it applies to
Secondary — half of Primary for Gold gear; equal to Primary for Raid gear
Reforge   — a third stat roll; only on Gold gear (zero on Raid pieces)

All three add raw points to their chosen stat before conversion to %.`}</FormulaBlock>
          </div>

          <div>
            <div className="text-[11px] font-bold text-white mb-1">3 · Perfection Scaling</div>
            <Note>Item stat values scale with perfection (0 – 100/100). The full-perfection values are the published datamine numbers. At any other perfection the stats are reduced proportionally:</Note>
            <FormulaBlock>{`factor = ( 229 + 149 × perfection / 100 ) / 378

primary   = round( p_max × factor )     ← standard rounding
secondary = floor( s_max × factor )     ← floor  (raid: same as primary)
reforge   = floor( r_max × factor )     ← floor

At perfection = 100 → factor = 1.000 → original values returned unchanged.`}</FormulaBlock>
          </div>

          <div>
            <div className="text-[11px] font-bold text-white mb-1">4 · Imagine (Summon) Tiers</div>
            <Note>Each Imagine has 6 tiers (0 – 5). The raw stat values at each tier are fixed:</Note>
            <FormulaBlock>{`Boss Imagines  (e.g. Phantom Arachnocrab):
  T0: 3 584  T1: 4 636  T2: 5 688  T3: 6 740  T4: 7 792  T5: 8 960

Elite Imagines  (e.g. Bluespine Lizard):
  T0: 2 016  T1: 2 615  T2: 3 214  T3: 3 813  T4: 4 412  T5: 5 040`}</FormulaBlock>
          </div>

          <div>
            <div className="text-[11px] font-bold text-white mb-1">5 · Haste → Attack / Cast Speed</div>
            <Note>Haste% converts to Attack Speed % and Cast Speed % using class-specific multipliers:</Note>
            <FormulaBlock>{`Attack Speed %  = Haste% × aspd_ratio
Cast Speed %    = Haste% × cspd_ratio

Melee classes   (Heavy Guardian, Stormblade, Wind Knight, Marksman,
                 Shield Knight):           aspd ×0.6   cspd ×1.0
Mage classes    (Frostmage, Verdant Oracle): aspd ×0.2   cspd ×2.0
Beat Performer:                            aspd ×0.6   cspd ×2.0`}</FormulaBlock>
          </div>

          <div>
            <div className="text-[11px] font-bold text-white mb-1">6 · Psychoscope Factor Grade Scaling</div>
            <Note>All factor numeric effects scale linearly between G1 and G10. G values between 1 and 10 are interpolated:</Note>
            <FormulaBlock>{`value(G) = G1_val + ( G10_val − G1_val ) × ( G − 1 ) / 9

Example (Polarity X5 Crit gain mult):
  G1 = 3.5%,  G10 = 10.0%
  G5 = 3.5 + (10.0 − 3.5) × 4/9 ≈ 6.4%

If G1 data is missing, a fallback is used: value(G) = G10_val × G / 10`}</FormulaBlock>
          </div>

          <div>
            <div className="text-[11px] font-bold text-white mb-1">7 · Polarity / Gain-Multiplier Factors (X5–X8)</div>
            <Note>Polarity factors apply a multiplicative gain multiplier to a stat — meaning they scale ALL sources of that stat (gear, sigils, imagines, modules, etc.) and also apply a negative multiplier to the opposing stat:</Note>
            <FormulaBlock>{`effective_stat = raw_stat × ( 1 + gainMult% )

Polarity X5  →  Crit ×(1 + gainPct)  +  Mastery ×(1 − lossPct)
Polarity X6  →  Luck ×(1 + gainPct)  +  Haste   ×(1 − lossPct)
Polarity X7  →  Mastery ×(1 + gainPct) + Luck   ×(1 − lossPct)
Polarity X8  →  Haste ×(1 + gainPct)  +  Crit   ×(1 − lossPct)

G1:  +3.5% / −2.1%    G10:  +10.0% / −6.0%`}</FormulaBlock>
          </div>

          <div>
            <div className="text-[11px] font-bold text-white mb-1">8 · Module Thresholds</div>
            <Note>Module levels require cumulative point investment. Unlocking higher levels gates the bonus stats:</Note>
            <FormulaBlock>{`Level  1 → 1  pts total   (basic atk bonus unlocked)
Level  2 → 4  pts total
Level  3 → 8  pts total   (secondary stat unlocked)
Level  4 → 12 pts total
Level  5 → 16 pts total   (% bonus unlocked)
Level  6 → 20 pts total   (max level — strongest % bonus)`}</FormulaBlock>
          </div>

          <div>
            <div className="text-[11px] font-bold text-white mb-1">9 · Slot Primary-Stat Restrictions</div>
            <Note>Each armor/accessory slot restricts one primary stat per build type (Strength / Agility / Intellect). The tool enforces these automatically:</Note>
            <FormulaBlock>{`The "restricted" stat must be assigned to Primary for that slot.
Example: Helmet (Strength build) → primary must be Versatility.
No restrictions on Weapon or if the stat isn't listed for the slot.`}</FormulaBlock>
          </div>

        </div>
      </CollapsibleSection>

      {/* ── Classes ────────────────────────────────────────────────────────── */}
      <CollapsibleSection title="Classes">
        <Table
          headers={["Class", "Parent", "Role", "Main Stat", "ATK Type", "Element", "Specs"]}
          rows={classRows}
        />
      </CollapsibleSection>

      {/* ── Specs & Weapon Buffs ───────────────────────────────────────────── */}
      <CollapsibleSection title="Specs & Weapon Buffs">
        <Table
          headers={["Spec", "Buff 1", "Buff 2", "Other Effect", "Raid Bonus"]}
          rows={specRows}
        />
        <Note>Buff 1 and Buff 2 are % bonuses added directly to that raw stat from the equipped class weapon. Raid Bonus is granted by equipping 5 + pieces of class raid gear.</Note>
      </CollapsibleSection>

      {/* ── Raid Set Bonuses ───────────────────────────────────────────────── */}
      <CollapsibleSection title="Raid Set Bonuses — 2pc">
        <Table headers={["Spec", "2-Piece Bonus"]} rows={raid2pcRows} />
      </CollapsibleSection>

      <CollapsibleSection title="Raid Set Bonuses — 4pc">
        <Table headers={["Spec", "4-Piece Bonus"]} rows={raid4pcRows} />
      </CollapsibleSection>

      {/* ── Gear Tiers ─────────────────────────────────────────────────────── */}
      <CollapsibleSection title="Weapon Tiers">
        <Table headers={["Tier", "Primary", "Secondary", "Reforge", "Raid", "Illu"]} rows={weaponTierRows} />
        <Note>Illu = Illusion stat bonus. Raid = Equal Primary/Secondary (no Reforge). Values are at 100/100 perfection.</Note>
      </CollapsibleSection>

      <CollapsibleSection title="Armor Tiers">
        <Table headers={["Tier", "Primary", "Secondary", "Reforge", "Raid", "Illu"]} rows={armorTierRows} />
      </CollapsibleSection>

      <CollapsibleSection title="Accessory Tiers">
        <Table headers={["Tier", "Primary", "Secondary", "Reforge", "Illu"]} rows={accessoryTierRows} />
        <Note>Bracelets (L/R) use the Armor tier table. Standard accessories only come in Gold quality.</Note>
      </CollapsibleSection>

      {/* ── Imagines ───────────────────────────────────────────────────────── */}
      <CollapsibleSection title="Imagines (Summons)">
        <Table
          headers={["Imagine", "Stat", "T0", "T1", "T2", "T3", "T4", "T5"]}
          rows={imagineRows}
        />
        <Note>Raw stat values shown. Converted to % using the stat formula above. Two imagine slots available.</Note>
      </CollapsibleSection>

      {/* ── Modules ────────────────────────────────────────────────────────── */}
      <CollapsibleSection title="Modules">
        <Table headers={["Module", "Cat", "Lv.1", "Lv.4", "Lv.5", "Lv.6"]} rows={modRows} />
        <Note>Lv.4 is the level at which most main-stat rolls first unlock. Lv.5–6 unlock the key % bonuses.</Note>
      </CollapsibleSection>

      {/* ── Sigils ─────────────────────────────────────────────────────────── */}
      <CollapsibleSection title="Sigils">
        <Table headers={["Name", "Slots", "Lv.1", "Lv.2", "Lv.3"]} rows={sigilRows} />
      </CollapsibleSection>

      {/* ── Polarity Factors ───────────────────────────────────────────────── */}
      <CollapsibleSection title="Polarity Factors (X5-X8)">
        <Table
          headers={["Factor", "Effect", "G1 gain/loss", "G5 gain/loss", "G10 gain/loss"]}
          rows={[
            ["Polarity X5", "+Crit / −Mastery", "+3.5% / −2.1%", "+6.4% / −3.8%", "+10% / −6%"],
            ["Polarity X6", "+Luck / −Haste",   "+3.5% / −2.1%", "+6.4% / −3.8%", "+10% / −6%"],
            ["Polarity X7", "+Mastery / −Luck",  "+3.5% / −2.1%", "+6.4% / −3.8%", "+10% / −6%"],
            ["Polarity X8", "+Haste / −Crit",    "+3.5% / −2.1%", "+6.4% / −3.8%", "+10% / −6%"],
            ["Polarity X9",  "Special Atk Dream DMG", "+1.0%",  "+3.9%",  "+6.5%"],
            ["Polarity X10", "Expertise Skill Dream DMG", "+1.2%", "+4.1%", "+7.0%"],
            ["Polarity X11", "Conditional Versatility (5-stack)", "+300", "~450", "+600"],
            ["Polarity X1",  "All Element Attack", "+50",  "+131",  "+212"],
            ["Polarity X2",  "Strength flat + %",  "+30 / +0.6%", "+51 / +1.2%", "+75 / +2%"],
            ["Polarity X3",  "Intellect flat + %", "+30 / +0.6%", "+51 / +1.2%", "+75 / +2%"],
            ["Polarity X4",  "Agility flat + %",   "+30 / +0.6%", "+51 / +1.2%", "+75 / +2%"],
          ]}
        />
        <Note>Gain/loss multipliers apply to ALL raw stat points from any source before conversion to %. Linear interpolation between G1 and G10 (see Calculations).</Note>
      </CollapsibleSection>

      {/* ── Stat Conversion Constants ──────────────────────────────────────── */}
      <CollapsibleSection title="Stat Conversion Constants">
        <Table headers={["Stat", "Constant c", "Base %"]} rows={constantRows} />
        <Note>Formula: stat% = sqrt(raw / c) × 100 + base. Versatility has a lower c value making it scale faster from raw points.</Note>
      </CollapsibleSection>

      {/* ── Haste Ratios ───────────────────────────────────────────────────── */}
      <CollapsibleSection title="Haste → ASPD / CSPD Ratios">
        <Table headers={["Class", "ASPD Ratio", "CSPD Ratio"]} rows={hasteRows} />
        <Note>Attack Speed % = Haste% × ASPD ratio. Cast Speed % = Haste% × CSPD ratio.</Note>
      </CollapsibleSection>

      {/* ── Purple Stat Rolls ──────────────────────────────────────────────── */}
      <CollapsibleSection title="Purple Stat Roll Values (Weapon / Accessory)">
        <Table headers={["Stat", "Weapon (Low/Mid/High)", "Accessory (Low/Mid/High)"]} rows={purpleWeaponRows} />
        <Note>These are the three possible discrete roll values for purple stats on Weapon and Accessory slots.</Note>
      </CollapsibleSection>

      {/* ── Class Purple Stats ─────────────────────────────────────────────── */}
      <CollapsibleSection title="Available Purple Stats by Class">
        <Table
          headers={["Class", "Available Purple Stats"]}
          rows={Object.entries(GAME_DATA.PURPLE_STATS).map(([cls, stats]) => [cls, stats.join(", ")])}
        />
      </CollapsibleSection>

      {/* ── Slot Restrictions ──────────────────────────────────────────────── */}
      <CollapsibleSection title="Primary Stat Restrictions by Slot & Build">
        <Table
          headers={["Slot", "Strength Build", "Intellect Build", "Agility Build"]}
          rows={restrictionRows}
        />
        <Note>The listed stat must be assigned as the Primary roll for that slot in the given build class. Weapon has no restrictions.</Note>
      </CollapsibleSection>
    </div>
  )
}
