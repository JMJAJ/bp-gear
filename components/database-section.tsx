"use client"
import { useState } from "react"
import { useApp } from "@/lib/app-context"
import { SIGIL_DB, MODULE_DB } from "@/lib/game-data"

function CollapsibleSection({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const { accentColor } = useApp()
  return (
    <div className="mb-2">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 border border-[#222] bg-[#0a0a0a] text-left transition-all hover:bg-[#111]"
      >
        <span className="text-[11px] font-bold uppercase tracking-[0.5px] text-[#ccc]">{title}</span>
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

export function DatabaseSection() {
  const { accentColor } = useApp()

  const sigilRows = SIGIL_DB.map(s => {
    const fmt = (d: Record<string,number>) => Object.entries(d).map(([k,v]) => `${k}: ${v}`).join(", ")
    return [s.n, s.s.join(", "), fmt(s.d[1]), fmt(s.d[2]), fmt(s.d[3])]
  })

  const modRows = MODULE_DB.map(m => {
    const fmt = (s: Record<string,number>) => Object.entries(s).map(([k,v]) => `${k}: ${v}`).join(", ")
    return [m.name, m.cat, fmt(m.s[0]), fmt(m.s[4]), fmt(m.s[5])]
  })

  const imagineRows = [
    ["Phantom Arachnocrab","Boss","800 Mastery + 10% Mastery Active","3,584","8,960"],
    ["Celestial Flier","Boss","800 Haste + 10% Haste Active","3,584","8,960"],
    ["Goblin King","Boss","800 Versatility","3,584","8,960"],
    ["Bluespine Lizard","Elite","450 Versatility","2,016","5,040"],
    ["Blackfire Foxen","Elite","450 Mastery","2,016","5,040"],
    ["Emerald Caprahorn","Elite","450 Haste","2,016","5,040"],
    ["Muku Chief","Boss","10% Crit DMG","500 Crit","500 Crit"],
    ["Storm Goblin King","Boss","—","500 Luck","500 Luck"],
    ["Flamehorn","Boss","500 Luck (flat)","—","—"],
    ["Melancholy Cabbage","Elite","5-7% Crit DMG","300","500"],
    ["Muku Warrior","Elite","—","400 Crit","400 Crit"],
    ["Blue Ridge Giant Lizard","Elite","450 Vers + 6.5% Vers","—","—"],
    ["Black Flame Earth Fox","Elite","450 Mastery + 6.5% Mast","—","—"],
    ["Emerald Horn Ram","Elite","450 Haste + 6.5% Haste","—","—"],
  ]

  const gearTierRows = [
    ["Lv40 Gold Armor",100,50,30,90,102],
    ["Lv60 Gold Armor",140,70,42,126,280],
    ["Lv60 Raid Armor",140,140,42,126,280],
    ["Lv80 Gold Armor",200,100,60,180,720],
    ["Lv80 Raid Armor",200,200,60,180,720],
    ["Lv120 Gold Armor",540,270,162,236,1065],
    ["Lv140 Gold Armor",756,378,226,268,1209],
    ["Lv140 Raid Armor",756,756,226,268,1209],
    ["Lv160 Gold Armor",954,477,286,320,1440],
    ["Lv160 Raid Armor",954,954,286,320,1440],
    ["Lv170 Raid Armor",1035,1035,286,352,1584],
  ]

  return (
    <div>
      <div className="mb-6">
        <div className="text-2xl font-bold tracking-tight text-white mb-1">Database</div>
        <div className="text-[11px] text-[#555] max-w-xl leading-5">
          Complete reference from the BPSR Gear Calculator v1.1.3 spreadsheet. Expand any section to browse.
        </div>
      </div>

      <CollapsibleSection title="Sigils">
        <Table headers={["Name","Slots","Lv.1","Lv.2","Lv.3"]} rows={sigilRows} />
      </CollapsibleSection>

      <CollapsibleSection title="Modules">
        <Table headers={["Module","Cat","Lv.1","Lv.5","Lv.6"]} rows={modRows} />
      </CollapsibleSection>

      <CollapsibleSection title="Imagines (Summons)">
        <Table headers={["Imagine","Type","Passive","Tier 0","Tier 5"]} rows={imagineRows} />
      </CollapsibleSection>

      <CollapsibleSection title="Gear Stat Values by Tier">
        <Table headers={["Tier","Primary","Secondary","Reforge","Main Stat","Endurance"]} rows={gearTierRows} />
      </CollapsibleSection>

      <CollapsibleSection title="Polarity Factors">
        <Table
          headers={["Factor","Effect","G1","G5","G10"]}
          rows={[
            ["Polarity X5","+Crit / −Mastery","+240 / −120","+1200 / −600","+10% Crit / -6% Mastery"],
            ["Polarity X6","+Luck / −Haste","+240 / −120","+1200 / −600","+10% Luck / -6% Haste"],
            ["Polarity X7","+Mastery / −Luck","+240 / −120","+1200 / −600","+10% Mastery / -6% Luck"],
            ["Polarity X8","+Haste / −Crit","+240 / −120","+1200 / −600","+10% Haste / -6% Crit"],
            ["Stasis X5","Overwhelming DMG Reduction","15%","—","35%"],
            ["Stasis X6","Max HP Stacking (No Dmg Taken)","0.5%","1.5%","3.5%"],
          ]}
        />
        <p className="text-[10px] text-[#555] mt-3 leading-5">
          <strong className="text-[#888]">Polarity</strong> factors trade one substat for another.
          At G10, they provide flat % boosts instead of raw values.
          Use the <strong className="text-[#888]">External Buffs %</strong> fields in the Right Panel to manually add G10 bonuses.
        </p>
      </CollapsibleSection>
    </div>
  )
}
