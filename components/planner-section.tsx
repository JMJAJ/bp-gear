"use client"
import { useState } from "react"
import { useApp } from "@/lib/app-context"
import { GAME_DATA, SIGIL_MAP, getSlotType, getTierData, getDefaultTier, getPurpleValOptions, getArmorPurpleForBuild, findRaidTier, findGoldTier, getUniqueTierLevels, getTierForLevel, levelHasBothVariants } from "@/lib/game-data"
import type { Build, GearSlot } from "@/lib/app-context"
import { useRef } from "react"
import { Tip } from "@/components/TooltipText"

const BUILD_OPTIONS: { id: Build; label: string }[] = [
  { id: "Strength", label: "STR" },
  { id: "Agility", label: "AGI" },
  { id: "Intellect", label: "INT" },
]

function GSelect({
  value, options, onChange, disabled, style
}: {
  value: string
  options: string[]
  onChange: (v: string) => void
  disabled?: boolean
  style?: React.CSSProperties
}) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      disabled={disabled}
      className="w-full text-[11px] px-1.5 py-1 border border-[#1a1a1a] bg-[#0a0a0a] text-white focus:border-[#444] outline-none"
      style={{ opacity: disabled ? 0.3 : 1, cursor: disabled ? "not-allowed" : "default", ...style }}
    >
      <option value="-">—</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  )
}

function GearRow({ index }: { index: number }) {
  const {
    gear, updateGearSlot,
    legendaryTypes, legendaryVals, setLegendaryType, setLegendaryVal,
    build, spec, accentColor, getAllowedForSlot
  } = useApp()

  const slot = GAME_DATA.SLOTS[index]
  const g = gear[index]
  const isRaidable = (GAME_DATA.RAID_SLOTS as readonly string[]).includes(slot)
  const isWep = index === 0
  const sigils = SIGIL_MAP[slot] ?? []

  const slotType = getSlotType(index)
  const tierLevels = getUniqueTierLevels(slotType)
  const currentTierData = g.tier ? getTierData(slotType, g.tier) : null
  const currentLevel = parseInt((g.tier ?? "").match(/Lv(\d+)/i)?.[1] ?? "140")
  const canToggleRaid = isRaidable && levelHasBothVariants(slotType, currentLevel)

  const allowed = getAllowedForSlot(index)
  const allowedSecondary = getAllowedForSlot(index, true)

  function changeTier(newTier: string) {
    const td = getTierData(slotType, newTier)
    if (!td) return
    const isRaid = td.raid
    const specStats = GAME_DATA.SPECS[spec] ?? ["Haste", "Mastery"]
    if (isRaid) {
      updateGearSlot(index, {
        tier: newTier,
        raid: true,
        p: specStats[0],
        s: specStats[1],
        r: isWep ? "-" : g.r,
      })
    } else {
      updateGearSlot(index, { tier: newTier, raid: false })
    }
  }

  function toggleRaid(checked: boolean) {
    const newTier = getTierForLevel(slotType, currentLevel, checked)
      ?? (checked ? findRaidTier(slotType, g.tier || getDefaultTier(index))
        : findGoldTier(slotType, g.tier || getDefaultTier(index)))
    if (checked) {
      const specStats = GAME_DATA.SPECS[spec] ?? ["Haste", "Mastery"]
      updateGearSlot(index, {
        tier: newTier ?? g.tier,
        raid: true,
        p: specStats[0],
        s: specStats[1],
        r: isWep ? "-" : g.r,
      })
    } else {
      updateGearSlot(index, { tier: newTier ?? g.tier, raid: false })
    }
  }

  // Purple stat options
  const pctSlots = [0, 5, 6, 7, 10] // Weapon, Earrings, Necklace, Ring, Charm
  const className = Object.entries(GAME_DATA.CLASSES).find(([, cls]) => cls.specs.includes(spec))?.[0]
  const classInfo = className ? GAME_DATA.CLASSES[className] : null
  const classPurple = className ? GAME_DATA.PURPLE_STATS[className] : null

  const isRaid = currentTierData ? currentTierData.raid : g.raid
  const hasReforge = currentTierData ? currentTierData.r > 0 : !isRaid || !isWep

  // Raid gear cannot have purple stats
  let purpleOpts: string[]
  if (isRaid) {
    purpleOpts = [] // Raid gear has no purple stats
  } else if (pctSlots.includes(index) && classPurple) {
    purpleOpts = classPurple
  } else if (!pctSlots.includes(index)) {
    // Armor purple: filter by class main stat (only Strength gets "Strength (%)")
    purpleOpts = getArmorPurpleForBuild(classInfo?.main ?? build)
  } else {
    purpleOpts = GAME_DATA.LEGENDARY.filter(l => l !== "-")
  }

  // Discrete value options for the selected purple stat
  const selectedPurple = legendaryTypes[index]
  const purpleSlotType = index === 0 ? "weapon" : (pctSlots.includes(index) ? "access" : "armor")
  const purpleValOpts = selectedPurple && selectedPurple !== "-"
    ? getPurpleValOptions(selectedPurple, purpleSlotType, g.tier || getDefaultTier(index))
    : []

  return (
    <tr className="border-b border-[#111] hover:bg-white/[0.01] transition-colors">
      <td className="px-2 py-1.5 w-32">
        <span
          className="text-[11px] font-semibold whitespace-nowrap"
          style={{ color: isRaid ? accentColor : "#888" }}
        >
          {slot}
        </span>
      </td>
      <td className="px-1 py-1.5 w-10 text-center">
        {isRaidable ? (
          <input
            type="checkbox"
            checked={isRaid}
            disabled={!canToggleRaid}
            onChange={e => toggleRaid(e.target.checked)}
            className="cursor-pointer"
            style={{ accentColor, opacity: canToggleRaid ? 1 : 0.4 }}
            title={!canToggleRaid
              ? (isRaid ? "Raid-only at this level" : "Gold-only at this level")
              : (isRaid ? "Raid gear — uncheck for gold" : "Check for raid gear")}
          />
        ) : (
          <span className="text-[10px] text-[#222]">—</span>
        )}
      </td>
      <td className="px-1 py-1.5 w-20">
        <select
          value={currentLevel}
          onChange={e => {
            const lv = parseInt(e.target.value)
            const newTier = getTierForLevel(slotType, lv, isRaid) ?? getTierForLevel(slotType, lv, !isRaid)
            if (newTier) changeTier(newTier)
          }}
          className="w-full text-[10px] px-1 py-1 border border-[#1a1a1a] bg-[#0a0a0a] text-white focus:border-[#444] outline-none"
        >
          {tierLevels.map(lv => <option key={lv} value={lv}>Lv{lv}</option>)}
        </select>
      </td>
      <td className="px-1 py-1.5 w-28">
        {isRaid ? (
          <div className="text-[11px] font-bold px-1.5" style={{ color: accentColor }}>{g.p}</div>
        ) : (
          <GSelect value={g.p} options={allowed} onChange={v => updateGearSlot(index, { p: v })} />
        )}
      </td>
      <td className="px-1 py-1.5 w-28">
        {isRaid ? (
          <div className="text-[11px] font-bold px-1.5" style={{ color: accentColor }}>{g.s}</div>
        ) : (
          <GSelect value={g.s} options={allowedSecondary} onChange={v => updateGearSlot(index, { s: v })} />
        )}
      </td>
      <td className="px-1 py-1.5 w-14">
        <input
          type="number"
          min={0}
          max={100}
          value={g.perfection ?? 100}
          onChange={e => {
            const v = Math.max(0, Math.min(100, parseInt(e.target.value) || 0))
            updateGearSlot(index, { perfection: v })
          }}
          className="w-full text-[11px] px-1.5 py-1 border border-[#1a1a1a] bg-[#0a0a0a] text-white focus:border-[#444] outline-none text-center"
          style={{ color: (g.perfection ?? 100) < 100 ? "#e5c229" : "#666" }}
        />
      </td>
      <td className="px-1 py-1.5 w-28">
        {hasReforge ? (
          <GSelect
            value={g.r}
            options={GAME_DATA.STATS as unknown as string[]}
            onChange={v => updateGearSlot(index, { r: v })}
          />
        ) : (
          <div className="text-[10px] text-[#333] px-1.5">—</div>
        )}
      </td>
      <td className="px-1 py-1.5 w-36">
        <select
          value={g.sigName}
          onChange={e => updateGearSlot(index, { sigName: e.target.value })}
          className="w-full text-[10px] px-1 py-1 border border-[#1a1a1a] bg-[#0a0a0a] text-[#aaa] focus:border-[#444] outline-none"
        >
          <option value="">— none —</option>
          {sigils.map(s => <option key={s.n} value={s.n}>{s.n}</option>)}
        </select>
      </td>
      <td className="px-1 py-1.5 w-12">
        <select
          value={g.sigLvl}
          onChange={e => updateGearSlot(index, { sigLvl: e.target.value })}
          className="w-full text-[10px] px-1 py-1 border border-[#1a1a1a] bg-[#0a0a0a] text-white focus:border-[#444] outline-none"
        >
          {[1, 2, 3].map(l => <option key={l} value={l}>{l}</option>)}
        </select>
      </td>
      <td className="px-1 py-1.5 w-36">
        {isRaid ? (
          <div className="text-[10px] text-[#333] px-1.5">—</div>
        ) : (
          <select
            value={legendaryTypes[index] ?? "-"}
            onChange={e => setLegendaryType(index, e.target.value)}
            className="w-full text-[10px] px-1 py-1 border border-[#1a1a1a] bg-[#0a0a0a] text-[#b888ff] focus:border-[#444] outline-none"
          >
            <option value="-">None</option>
            {purpleOpts.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        )}
      </td>
      <td className="px-1 py-1.5 w-14">
        {isRaid ? (
          <div className="text-[10px] text-[#333] px-1.5">—</div>
        ) : purpleValOpts.length > 0 ? (
          <select
            value={legendaryVals[index] || ""}
            onChange={e => setLegendaryVal(index, parseFloat(e.target.value) || 0)}
            className="w-full text-[11px] px-1 py-1 border border-[#1a1a1a] bg-[#0a0a0a] text-[#b888ff] focus:border-[#444] outline-none"
          >
            <option value="">—</option>
            {purpleValOpts.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        ) : (
          <input
            type="number"
            value={legendaryVals[index] || ""}
            onChange={e => setLegendaryVal(index, parseFloat(e.target.value) || 0)}
            placeholder="—"
            className="w-full text-[11px] px-1.5 py-1 border border-[#1a1a1a] bg-[#0a0a0a] text-[#b888ff] focus:border-[#444] outline-none"
          />
        )}
      </td>
    </tr>
  )
}

// ── Stat name normalisation ──────────────────────────────
// Maps scanner stat names → internal stat names
const STAT_NORM: Record<string, string> = {
  "versatility": "Versatility",
  "mastery": "Mastery",
  "haste": "Haste",
  "crit": "Crit",
  "luck": "Luck",
  "crit rate": "Crit",
  "critical": "Crit",
}
function normStat(raw: string): string {
  if (!raw) return "-"
  const key = raw.toLowerCase().trim()
  return STAT_NORM[key] ?? raw.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ")
}

/** Parse the scanner JSON format into GearSlot[] */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseScannerJSON(items: any[]): { gear: GearSlot[]; legendaryTypes: string[]; legendaryVals: number[] } {
  const gear: GearSlot[] = GAME_DATA.SLOTS.map((_, i) => ({
    tier: getDefaultTier(i), raid: false, p: "-", s: "-", r: "-", sigName: "", sigLvl: "1"
  }))
  const legendaryTypes: string[] = GAME_DATA.SLOTS.map(() => "-")
  const legendaryVals: number[] = GAME_DATA.SLOTS.map(() => 0)

  const slotMap: Record<string, number> = {}
  GAME_DATA.SLOTS.forEach((s, i) => { slotMap[s.toLowerCase()] = i })
  // extra aliases
  slotMap["bracelet"] = 8 // fallback for ambiguous

  items.forEach(item => {
    const slotRaw: string = item.slot ?? ""
    const slotKey = slotRaw.toLowerCase().trim()
    let slotIdx = slotMap[slotKey]
    if (slotIdx === undefined) return // unknown slot

    // Handle "Bracelet (L)"/"Bracelet (R)" ambiguity — scanner may just say "Bracelet"
    if (slotKey === "bracelet") {
      // place in (L) first if empty, else (R)
      slotIdx = (gear[8].p === "-" && !gear[8].sigName) ? 8 : 9
    }

    const isRaid = !!(item.is_raid)
    const pStat = normStat(item.primary_stat ?? "")
    const sStat = normStat(item.secondary_stat ?? "")
    const rStat = normStat(item.reforge_stat ?? "")
    const sigilName = item.sigil ?? ""
    const sigilLvl = String(item.sigil_level ?? 1)

    gear[slotIdx] = {
      tier: getDefaultTier(slotIdx),
      raid: isRaid,
      p: pStat || "-",
      s: sStat || "-",
      r: rStat || "-",
      sigName: sigilName,
      sigLvl: sigilLvl,
    }

    // Advanced attributes: look for % stats → purple
    if (item.advanced_attributes) {
      const adv: Record<string, number> = item.advanced_attributes
      for (const [k, v] of Object.entries(adv)) {
        const kl = k.toLowerCase()
        if (kl.includes("%") || kl.includes("bonus") || kl.includes("speed")) {
          legendaryTypes[slotIdx] = k
          legendaryVals[slotIdx] = typeof v === "number" ? v : 0
          break // take first one
        }
      }
    }
    if (item.legendary_type && item.legendary_type !== "-") {
      legendaryTypes[slotIdx] = item.legendary_type
      legendaryVals[slotIdx] = item.legendary_value ?? 0
    }
  })

  return { gear, legendaryTypes, legendaryVals }
}

export function PlannerSection() {
  const {
    build, setBuild, spec, setSpec,
    gear, setGear, setLegendaryType, setLegendaryVal,
    legendaryTypes, legendaryVals,
    accentColor, imagines, setImagine, setAllImagines,
    modules, gearLib, setModules,
    selectedTalents, setSelectedTalents,
    talentAspd, setTalentAspd,
    gearSets, importGearSets,
  } = useApp()
  const importRef = useRef<HTMLInputElement>(null)
  const [importStatus, setImportStatus] = useState<"" | "ok" | "err" | "scan">("")
  const [confirmClear, setConfirmClear] = useState(false)

  function clearAll() {
    setGear(GAME_DATA.SLOTS.map((_, i) => ({ tier: getDefaultTier(i), raid: false, p: "-", s: "-", r: "-", sigName: "", sigLvl: "1" })))
    GAME_DATA.SLOTS.forEach((_, i) => { setLegendaryType(i, "-"); setLegendaryVal(i, 0) })
    setAllImagines([{ key: "", idx: 0 }, { key: "", idx: 0 }])
    setSelectedTalents([])
    setTalentAspd(0)
    setConfirmClear(false)
  }

  function exportAll() {
    const payload = {
      version: 3,
      build,
      spec,
      gear,
      legendaryTypes,
      legendaryVals,
      imagines,
      modules,
      gearLib,
      selectedTalents,
      talentAspd,
      gearSets,
      exportedAt: new Date().toISOString(),
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `bpsr-${spec.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const r = new FileReader()
    r.onload = ev => {
      try {
        const parsed = JSON.parse(ev.target?.result as string)

        // Detect scanner format (array of items with "slot" field)
        if (Array.isArray(parsed)) {
          const { gear: newGear, legendaryTypes: lt, legendaryVals: lv } = parseScannerJSON(parsed)
          setGear(newGear)
          GAME_DATA.SLOTS.forEach((_, i) => { setLegendaryType(i, lt[i]); setLegendaryVal(i, lv[i]) })
          setImportStatus("scan")
          setTimeout(() => setImportStatus(""), 3000)
          return
        }

        // Detect our own export format (v2/v3 with gear/modules/etc.)
        if (parsed.version >= 2 || parsed.gear) {
          if (parsed.build) setBuild(parsed.build)
          if (parsed.spec) setSpec(parsed.spec)
          if (parsed.gear) setGear(parsed.gear)
          if (parsed.legendaryTypes) parsed.legendaryTypes.forEach((t: string, i: number) => setLegendaryType(i, t))
          if (parsed.legendaryVals) parsed.legendaryVals.forEach((v: number, i: number) => setLegendaryVal(i, v))
          if (parsed.modules && Array.isArray(parsed.modules)) setModules(parsed.modules)
          if (parsed.imagines && Array.isArray(parsed.imagines)) setAllImagines(parsed.imagines)
          if (parsed.selectedTalents && Array.isArray(parsed.selectedTalents)) setSelectedTalents(parsed.selectedTalents)
          if (typeof parsed.talentAspd === "number") setTalentAspd(parsed.talentAspd)
          if (parsed.gearSets && Array.isArray(parsed.gearSets)) importGearSets(parsed.gearSets)
          setImportStatus("ok")
          setTimeout(() => setImportStatus(""), 3000)
        }
      } catch (err) {
        console.error("[v0] Import parse error:", err)
        setImportStatus("err")
        setTimeout(() => setImportStatus(""), 3000)
      }
    }
    r.readAsText(file)
    e.target.value = ""
  }

  return (
    <div>
      <div className="mb-4">
        <div className="text-2xl font-bold tracking-tight text-white mb-1">Gear Planner</div>
        <div className="text-[11px] text-[#555] max-w-xl leading-5">
          Configure each gear slot. Raid gear locks primary/secondary to your spec&apos;s recommended substats.
          Import supports both the scanner JSON format and BPSR export files.
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 flex-wrap mb-4 pb-4 border-b border-[#1a1a1a]">
        {/* Build switch */}
        <div className="flex">
          {BUILD_OPTIONS.map((opt, idx) => (
            <button
              key={opt.id}
              onClick={() => setBuild(opt.id)}
              className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-[1px] border border-[#222] transition-all"
              style={{
                background: build === opt.id ? accentColor : "transparent",
                color: build === opt.id ? "#000" : "#555",
                borderLeft: idx === 0 ? undefined : "none",
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Spec */}
        <div className="flex items-center gap-2">
          <span className="text-[9px] uppercase tracking-[0.5px] text-[#555]">Spec</span>
          <select
            value={spec}
            onChange={e => setSpec(e.target.value)}
            className="text-[11px] px-2 py-1 border border-[#222] bg-[#0a0a0a] text-white focus:border-[#444] outline-none"
            style={{ width: 140 }}
          >
            {Object.keys(GAME_DATA.SPECS).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Global reforge */}
        <div className="flex items-center gap-2">
          <span className="text-[9px] uppercase tracking-[0.5px] text-[#555]">Set Reforge</span>
          <select
            onChange={e => {
              if (!e.target.value) return
              const val = e.target.value
              setGear(gear.map((g, i) => (i === 0 && g.raid) ? g : { ...g, r: val }))
            }}
            className="text-[11px] px-2 py-1 border border-[#222] bg-[#0a0a0a] text-white focus:border-[#444] outline-none"
            style={{ width: 120 }}
          >
            <option value="">—</option>
            {(GAME_DATA.STATS as readonly string[]).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Import/export */}
        <div className="flex items-center gap-1.5 ml-auto">
          {importStatus && (
            <span
              className="text-[9px] uppercase tracking-[0.5px] transition-all"
              style={{
                color: importStatus === "err" ? "#e84545" : importStatus === "scan" ? "#49A8FF" : "#4ade80",
              }}
            >
              {importStatus === "ok" && "✔ Imported"}
              {importStatus === "scan" && "✔ Scanner data imported"}
              {importStatus === "err" && "✖ Import failed"}
            </span>
          )}
          <button
            onClick={exportAll}
            className="text-[9px] uppercase tracking-[0.5px] px-2.5 py-1.5 border border-[#333] text-[#666] hover:text-white hover:border-[#555] transition-all"
            title="Export gear, modules and library to JSON"
          >
            Export All
          </button>
          <button
            onClick={() => importRef.current?.click()}
            className="text-[9px] uppercase tracking-[0.5px] px-2.5 py-1.5 border border-[#333] text-[#666] hover:text-white hover:border-[#555] transition-all"
            title="Import scanner JSON or BPSR export"
          >
            Import
          </button>
          <input ref={importRef} type="file" accept=".json,.txt" className="hidden" onChange={handleImport} />
          <button
            onClick={() => {
              if (confirmClear) { clearAll() }
              else { setConfirmClear(true); setTimeout(() => setConfirmClear(false), 2500) }
            }}
            className="text-[9px] uppercase tracking-[0.5px] px-2.5 py-1.5 border transition-all"
            style={{
              borderColor: confirmClear ? "#e84545" : "#333",
              color: confirmClear ? "#e84545" : "#555",
            }}
          >
            {confirmClear ? "Confirm Clear?" : "Clear"}
          </button>
        </div>
      </div>

      {/* Gear table */}
      <div className="overflow-x-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-[#222]">
              {[
                "Slot", "Raid", "Tier", "Primary", "Secondary",
                <Tip key="perf" text="Perfection (0–100). Scales primary, secondary and reforge stats proportionally. Default 100 = max stats.">Perf</Tip>,
                "Reforge", "Sigil", "Lv",
                <Tip key="purple" text="Purple stat — class-filtered. Weapon/accessories get % stats, armor gets flat stats.">
                  <span style={{ color: "#b888ff" }}>Purple</span>
                </Tip>,
                <Tip key="val" text="% value for percent stats (Attack Speed, Armor %, etc.). Raw number for flat stats (Armor, Max HP, Resistance).">Val</Tip>,
              ].map((h, i) => (
                <th key={i} className="text-left text-[9px] uppercase tracking-[1px] text-[#444] font-semibold px-2 py-2">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {GAME_DATA.SLOTS.map((_, i) => <GearRow key={i} index={i} />)}
          </tbody>
        </table>
      </div>

      {/* Imagine slots */}
      <div className="mt-6">
        <div
          className="text-[9px] uppercase tracking-[1.5px] font-bold mb-3"
          style={{ color: accentColor }}
        >
          Imagine Slots
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[0, 1].map(i => (
            <div key={i} className="border border-[#222] bg-[#0a0a0a] p-3">
              <div className="text-[9px] uppercase tracking-[1px] text-[#444] mb-2">Imagine {i + 1}</div>
              <select
                value={imagines[i]?.key ?? ""}
                onChange={e => setImagine(i, { key: e.target.value })}
                className="w-full mb-2 text-[11px] px-2 py-1.5 border border-[#1a1a1a] bg-[#000] text-white focus:border-[#444] outline-none"
              >
                <option value="">— none —</option>
                {Object.keys(GAME_DATA.IMAGINE.OPTIONS).map(k => <option key={k} value={k}>{k}</option>)}
              </select>
              <select
                value={imagines[i]?.idx ?? 0}
                onChange={e => setImagine(i, { idx: parseInt(e.target.value) })}
                className="w-full text-[11px] px-2 py-1.5 border border-[#1a1a1a] bg-[#000] text-white focus:border-[#444] outline-none"
              >
                {["Tier 0", "Tier 1", "Tier 2", "Tier 3", "Tier 4", "Tier 5"].map((t, j) => (
                  <option key={j} value={j}>{t}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
