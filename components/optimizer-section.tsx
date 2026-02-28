"use client"
import { useState } from "react"
import { useApp, calculateStats, getStatPercent } from "@/lib/app-context"
import {
  GAME_DATA, getDefaultTier, getSlotType, getTierData,
  getPurpleValOptions, getArmorPurpleForBuild, findRaidTier, findGoldTier,
} from "@/lib/game-data"
import type { GearSlot } from "@/lib/app-context"

// Slots that get class-specific % purple stats (weapon + accessories)
const PCT_SLOTS = [0, 5, 6, 7, 10] // Weapon, Earrings, Necklace, Ring, Charm

// Module-level: survives tab switches within the session, resets on page refresh
let _savedTargets = { vers: 0, mast: 50, haste: 20, crit: 20, luck: 5 }

export function OptimizerSection() {
  const {
    build, spec, base, ext, gear, imagines, modules,
    legendaryTypes, legendaryVals,
    setGear, setLegendaryType, setLegendaryVal, setSection, accentColor
  } = useApp()
  const [targets, _setTargets] = useState(() => _savedTargets)
  function setTargets(upd: typeof _savedTargets | ((prev: typeof _savedTargets) => typeof _savedTargets)) {
    _setTargets(prev => {
      const next = typeof upd === "function" ? upd(prev) : upd
      _savedTargets = next
      return next
    })
  }
  const [status, setStatus] = useState("")
  const [keepSelected, setKeepSelected] = useState(false)
  const [optImgines, setOptImgines] = useState(false)
  const [optPurple, setOptPurple] = useState(true)
  const [unlimRaid, setUnlimRaid] = useState(false)
  const [running, setRunning] = useState(false)

  const className = Object.entries(GAME_DATA.CLASSES).find(([,c]) => c.specs.includes(spec))?.[0] ?? null
  const mainStat = className ? GAME_DATA.CLASSES[className].main : "Strength"

  function getAllowed(slotIdx: number) {
    const slot = GAME_DATA.SLOTS[slotIdx]
    const banned = GAME_DATA.RESTRICTIONS[slot]?.[build] ?? []
    return (GAME_DATA.STATS as readonly string[]).filter(s => !banned.includes(s))
  }

  /** Get available purple stat options for a slot — class-aware */
  function getPurpleOpts(slotIdx: number): string[] {
    if (PCT_SLOTS.includes(slotIdx) && className) {
      return GAME_DATA.PURPLE_STATS[className] ?? []
    } else if (!PCT_SLOTS.includes(slotIdx)) {
      // Armor purple: filter by class main stat (only Strength gets "Strength (%)")
      return getArmorPurpleForBuild(mainStat)
    }
    return []
  }

  /** Pick the best (highest) purple value for a stat+slot */
  function bestPurpleVal(stat: string, slotIdx: number, tierStr: string): number {
    const st = PCT_SLOTS.includes(slotIdx) ? (slotIdx === 0 ? "weapon" : "access") : "armor"
    const opts = getPurpleValOptions(stat, st, tierStr)
    if (opts.length === 0) return 0
    return opts[opts.length - 1] // highest roll
  }

  /** Pick a random purple value from the exact discrete options */
  function randPurpleVal(stat: string, slotIdx: number, tierStr: string): number {
    const st = PCT_SLOTS.includes(slotIdx) ? (slotIdx === 0 ? "weapon" : "access") : "armor"
    const opts = getPurpleValOptions(stat, st, tierStr)
    if (opts.length === 0) return 0
    return opts[Math.floor(Math.random() * opts.length)]
  }

  /** Count raid pieces in a gear array (excluding weapon) */
  function countRaid(g: GearSlot[]): number {
    return g.filter((slot, i) => i > 0 && slot.raid).length
  }

  /** Check if a slot is eligible for raid gear */
  function isRaidEligible(slotIdx: number): boolean {
    return (GAME_DATA.RAID_SLOTS as readonly string[]).includes(GAME_DATA.SLOTS[slotIdx])
  }

  function genLayout(keep: boolean, optImg: boolean, unlim: boolean) {
    const specStats = GAME_DATA.SPECS[spec] ?? ["Haste","Mastery"]
    const newGear: GearSlot[] = GAME_DATA.SLOTS.map((_, i) => ({tier: gear[i]?.tier || getDefaultTier(i), raid:false,p:"-",s:"-",r:"-",sigName:"",sigLvl:"1"}))
    const lt: string[] = [...legendaryTypes]
    const lv: number[] = [...legendaryVals]
    const locked: number[] = []
    let raidCnt = 0

    if (keep) {
      gear.forEach((g, i) => {
        if (g.p && g.p !== "-") { newGear[i] = {...g, locked:true}; locked.push(i); if(g.raid) raidCnt++ }
      })
    }

    const empty = GAME_DATA.SLOTS.map((_, i) => i).filter(i => !locked.includes(i))
    const maxRaid = unlim ? 6 : 4
    const armorRaidSlots = empty.filter(i => i !== 0 && isRaidEligible(i))
    const raidPicks = armorRaidSlots.sort(() => Math.random()-0.5).slice(0, Math.max(0, maxRaid-raidCnt))
    // Weapon always raid if not locked
    if (!locked.includes(0)) raidPicks.push(0)

    empty.forEach(i => {
      const baseTier = newGear[i].tier || getDefaultTier(i)
      const isRaid = raidPicks.includes(i)
      const isWep = i === 0
      const slotType = getSlotType(i)

      if (isRaid) {
        // Switch to raid tier for correct stat values
        const raidTier = findRaidTier(slotType, baseTier) ?? baseTier
        const tierData = getTierData(slotType, raidTier)
        const hasReforge = tierData ? tierData.r > 0 : false
        const r = (!hasReforge || isWep) ? "-" : (GAME_DATA.STATS[Math.floor(Math.random()*5)] as string)
        newGear[i] = {tier: raidTier, raid:true, p:specStats[0], s:specStats[1], r, sigName:"", sigLvl:"1"}
        // Raid gear CANNOT have purple stats
        lt[i] = "-"
        lv[i] = 0
      } else {
        // Switch to gold tier for correct stat values
        const goldTier = findGoldTier(slotType, baseTier) ?? baseTier
        const av = getAllowed(i)
        const p = av[Math.floor(Math.random()*av.length)]
        const sv = av.filter(x=>x!==p)
        const s = sv[Math.floor(Math.random()*sv.length)] ?? "-"
        const r = GAME_DATA.STATS[Math.floor(Math.random()*5)] as string
        newGear[i] = {tier: goldTier, raid:false, p, s, r, sigName:"", sigLvl:"1"}

        // Generate purple stats only for non-raid slots
        if (optPurple) {
          const opts = getPurpleOpts(i)
          if (opts.length > 0 && Math.random() < 0.7) {
            const pick = opts[Math.floor(Math.random() * opts.length)]
            const tierStr = newGear[i].tier
            lt[i] = pick
            lv[i] = bestPurpleVal(pick, i, tierStr)
          } else {
            lt[i] = "-"
            lv[i] = 0
          }
        }
      }
    })

    const imgSlots = optImg
      ? imagines.map(() => ({ key: Object.keys(GAME_DATA.IMAGINE.OPTIONS)[Math.floor(Math.random()*16)], idx: Math.floor(Math.random()*6) }))
      : [...imagines]

    return { gear: newGear, img: imgSlots, lt, lv }
  }

  function calcDiff(g: GearSlot[], img: typeof imagines, lt: string[], lv: number[]) {
    const res = calculateStats(g, img, modules, spec, base, ext, lt, lv)
    const p = {
      v: getStatPercent("Versatility", res.total.Versatility) + res.ext.vers,
      m: getStatPercent("Mastery", res.total.Mastery) + res.ext.mast,
      h: getStatPercent("Haste", res.total.Haste) + res.ext.haste,
      c: getStatPercent("Crit", res.total.Crit) + res.ext.crit,
      l: getStatPercent("Luck", res.total.Luck) + res.ext.luck,
    }
    return (
      Math.abs(p.v-targets.vers) + Math.abs(p.m-targets.mast) +
      Math.abs(p.h-targets.haste) + Math.abs(p.c-targets.crit) + Math.abs(p.l-targets.luck)
    )
  }

  function mutate(g: GearSlot[], img: typeof imagines, lt: string[], lv: number[], optImg: boolean, unlim: boolean) {
    const idx = Math.floor(Math.random()*g.length)
    const slot = g[idx]
    if (!slot || (slot as any).locked) return

    const specStats = GAME_DATA.SPECS[spec] ?? ["Haste","Mastery"]
    const slotType = getSlotType(idx)
    const isWep = idx === 0
    const maxRaid = unlim ? 6 : 4

    // 15% chance to toggle raid/non-raid on eligible slots (not weapon — weapon stays raid)
    if (!isWep && isRaidEligible(idx) && Math.random() < 0.15) {
      const currentRaidCount = countRaid(g)
      if (slot.raid) {
        // Try switching to gold
        const goldTier = findGoldTier(slotType, slot.tier) ?? slot.tier
        const av = getAllowed(idx)
        const p = av[Math.floor(Math.random()*av.length)]
        const sv = av.filter(x=>x!==p)
        const s = sv[Math.floor(Math.random()*sv.length)] ?? "-"
        const r = GAME_DATA.STATS[Math.floor(Math.random()*5)] as string
        g[idx] = {tier: goldTier, raid:false, p, s, r, sigName:slot.sigName, sigLvl:slot.sigLvl}
        // Gold gear can have purple stats — assign one
        if (optPurple) {
          const opts = getPurpleOpts(idx)
          if (opts.length > 0) {
            const pick = opts[Math.floor(Math.random() * opts.length)]
            lt[idx] = pick
            lv[idx] = bestPurpleVal(pick, idx, goldTier)
          }
        }
      } else if (currentRaidCount < maxRaid) {
        // Try switching to raid
        const raidTier = findRaidTier(slotType, slot.tier) ?? slot.tier
        const tierData = getTierData(slotType, raidTier)
        const hasReforge = tierData ? tierData.r > 0 : false
        const r = hasReforge ? (GAME_DATA.STATS[Math.floor(Math.random()*5)] as string) : "-"
        g[idx] = {tier: raidTier, raid:true, p:specStats[0], s:specStats[1], r, sigName:slot.sigName, sigLvl:slot.sigLvl}
        // Raid gear CANNOT have purple stats
        lt[idx] = "-"
        lv[idx] = 0
      }
      return
    }

    if (slot.raid) {
      // Raid slots: only mutate reforge if tier has reforge
      const tierData = getTierData(slotType, slot.tier)
      if (!isWep && tierData && tierData.r > 0) {
        g[idx] = { ...slot, r: GAME_DATA.STATS[Math.floor(Math.random()*5)] as string }
      }
    } else {
      const av = getAllowed(idx)
      const aspect = Math.floor(Math.random()*3)
      if (aspect === 0) {
        const p = av[Math.floor(Math.random()*av.length)]
        const sv = av.filter(x=>x!==p); const s = sv[Math.floor(Math.random()*sv.length)] ?? "-"
        g[idx] = {...slot, p, s}
      } else if (aspect === 1) {
        const sv = av.filter(x=>x!==slot.p); const s = sv[Math.floor(Math.random()*sv.length)]
        if (s) g[idx] = {...slot, s}
      } else {
        g[idx] = {...slot, r: GAME_DATA.STATS[Math.floor(Math.random()*5)] as string}
      }
    }

    // Mutate purple stats — only for non-raid gear
    if (optPurple && Math.random() < 0.2) {
      const ri = Math.floor(Math.random() * lt.length)
      if (!(g[ri] as any)?.locked && !g[ri]?.raid) {
        const opts = getPurpleOpts(ri)
        if (opts.length > 0) {
          if (Math.random() < 0.3) {
            // Clear purple
            lt[ri] = "-"; lv[ri] = 0
          } else {
            const pick = opts[Math.floor(Math.random() * opts.length)]
            const tierStr = g[ri]?.tier ?? getDefaultTier(ri)
            lt[ri] = pick
            lv[ri] = randPurpleVal(pick, ri, tierStr)
          }
        }
      }
    }

    if (optImg && Math.random() < 0.15) {
      const i = Math.floor(Math.random()*img.length)
      const keys = Object.keys(GAME_DATA.IMAGINE.OPTIONS)
      img[i] = Math.random()<0.5
        ? {...img[i], key: keys[Math.floor(Math.random()*keys.length)]}
        : {...img[i], idx: Math.floor(Math.random()*6)}
    }
  }

  function runOptimizer() {
    setRunning(true)
    setStatus("Running genetic algorithm...")
    setTimeout(() => {
      const POP = 30, GEN = 300
      let best = { gear: gear, img: imagines, lt: [...legendaryTypes], lv: [...legendaryVals], diff: Infinity }
      for (let r = 0; r < POP; r++) {
        const layout = genLayout(keepSelected, optImgines, unlimRaid)
        let g = layout.gear.map(x => ({...x}))
        let img = layout.img.map(x => ({...x}))
        let lt = [...layout.lt]
        let lv = [...layout.lv]
        let diff = calcDiff(g, img, lt, lv)
        for (let i = 0; i < GEN; i++) {
          const mg = g.map(x => ({...x}))
          const mi = img.map(x => ({...x}))
          const mlt = [...lt]
          const mlv = [...lv]
          mutate(mg, mi, mlt, mlv, optImgines, unlimRaid)
          const d = calcDiff(mg, mi, mlt, mlv)
          if (d < diff) { g = mg; img = mi; lt = mlt; lv = mlv; diff = d }
        }
        if (diff < best.diff) best = { gear: g, img, lt, lv, diff }
      }
      setGear(best.gear)
      // Apply optimized purple stats
      best.lt.forEach((t, i) => setLegendaryType(i, t))
      best.lv.forEach((v, i) => setLegendaryVal(i, v))
      setStatus(`Done — Total diff: ${best.diff.toFixed(2)}`)
      setSection("planner")
      setRunning(false)
    }, 50)
  }

  const inputs: { key: keyof typeof targets; label: string }[] = [
    { key:"crit",  label:"Target Crit %" },
    { key:"haste", label:"Target Haste %" },
    { key:"luck",  label:"Target Luck %" },
    { key:"mast",  label:"Target Mast %" },
    { key:"vers",  label:"Target Vers %" },
  ]

  return (
    <div>
      <div className="mb-6">
        <div className="text-2xl font-bold tracking-tight text-white mb-1">Auto-Optimizer</div>
        <div className="text-[11px] text-[#555] max-w-xl leading-5">
          Set target stat percentages. The engine runs a genetic algorithm (30 populations × 300 generations)
          using the exact in-game continuous diminishing-returns curve.
        </div>
      </div>

      <div className="grid grid-cols-3 md:grid-cols-5 gap-3 mb-5">
        {inputs.map(({ key, label }) => (
          <div key={key}>
            <label className="block text-[9px] uppercase tracking-[0.8px] text-[#555] mb-1">{label}</label>
            <input
              type="number"
              value={targets[key] || ""}
              onChange={e => setTargets(prev => ({...prev, [key]: parseFloat(e.target.value)||0}))}
              placeholder="0"
              className="w-full text-[12px] px-2 py-1.5 border border-[#222] bg-[#0a0a0a] text-white focus:border-[#444] outline-none"
            />
          </div>
        ))}
      </div>

      <div className="flex gap-2 flex-wrap mb-4">
        <button
          onClick={runOptimizer}
          disabled={running}
          className="flex-1 py-2.5 text-[11px] font-bold uppercase tracking-[1.5px] transition-all"
          style={{ background: accentColor, color: "#000", opacity: running ? 0.6 : 1 }}
        >
          {running ? "Running..." : "⚡ Theorycraft Best"}
        </button>
      </div>

      {status && (
        <div className="text-center text-[11px] font-semibold mb-4" style={{ color: accentColor }}>
          {status}
        </div>
      )}

      <div className="flex gap-5 flex-wrap mt-2">
        {[
          { val: keepSelected, set: setKeepSelected, label: "Lock Current Gear" },
          { val: optImgines,   set: setOptImgines,   label: "Optimize Imagines" },
          { val: optPurple,    set: setOptPurple,     label: "Optimize Purple Stats" },
          { val: unlimRaid,    set: setUnlimRaid,     label: "Unlimited Raid Armor" },
        ].map(({ val, set, label }) => (
          <label key={label} className="flex items-center gap-2 cursor-pointer text-[11px] text-[#888]">
            <input type="checkbox" checked={val} onChange={e => set(e.target.checked)} style={{ accentColor: accentColor }} />
            {label}
          </label>
        ))}
      </div>
    </div>
  )
}
