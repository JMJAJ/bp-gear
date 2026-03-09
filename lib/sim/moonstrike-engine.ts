import { getStatPercentCombat, type StatsResult } from "@/lib/app-context"
import type {
    MoonstrikeCombatStats,
    MoonstrikeSimPoint,
    MoonstrikeSimulationConfig,
    MoonstrikeSimResult,
    MoonstrikeTimelinePoint,
} from "@/lib/sim/moonstrike-types"

export function deriveMoonstrikeCombatStats(statsResult: StatsResult | null, isMoonstrike: boolean): MoonstrikeCombatStats | null {
    if (!statsResult || !isMoonstrike) return null

    const versPct = getStatPercentCombat("Versatility", statsResult.total.Versatility) / 100
    const mastPct = getStatPercentCombat("Mastery", statsResult.total.Mastery) / 100
    const critRate = Math.min((getStatPercentCombat("Crit", statsResult.total.Crit) + (statsResult.purpleStats?.["Crit (%)"] ?? 0)) / 100, 1)
    const luckRate = Math.min((getStatPercentCombat("Luck", statsResult.total.Luck) + (statsResult.purpleStats?.["Luck (%)"] ?? 0)) / 100, 1)
    const hastePct = getStatPercentCombat("Haste", statsResult.total.Haste)
    const aspd = statsResult.aspd / 100
    const critMult = 1 + 0.50 + ((statsResult.extraStats?.["Crit DMG (%)"] ?? 0) / 100)
    const luckMult = 1 + 0.30 + ((statsResult.extraStats?.["Lucky Strike DMG Multiplier (%)"] ?? 0) / 100)
    const dmgBoss = (statsResult.purpleStats?.["DMG Bonus vs Bosses (%)"] ?? 0) / 100
    const meleeDmg = (statsResult.purpleStats?.["Melee Damage Bonus (%)"] ?? 0) / 100
    const hasRaidWeapon = (statsResult.weaponEffects?.length ?? 0) > 0
    const weaponAtkPct = (isMoonstrike && hasRaidWeapon) ? 0.04 : 0
    const physDmgPct = (statsResult.moduleStats?.["Physical DMG (%)"] ?? 0) / 100
    const dmgPerStack = statsResult.moduleStats?.["DMG (%) / stack"] ?? 0
    const dmgStackPct = dmgPerStack > 0 ? (dmgPerStack * 4) / 100 : 0
    const avgCritLuck =
        (1 - critRate) * (1 - luckRate) * 1.0 +
        critRate * (1 - luckRate) * critMult +
        (1 - critRate) * luckRate * luckMult +
        critRate * luckRate * critMult * luckMult

    return {
        versPct,
        mastPct,
        critRate,
        luckRate,
        hastePct,
        aspd,
        critMult,
        luckMult,
        avgCritLuck,
        dmgBoss,
        meleeDmg,
        weaponAtkPct,
        physDmgPct,
        dmgStackPct,
        raid2pc: statsResult.raid2pcBonus,
        raid4pc: statsResult.raid4pcBonus,
        psyEffects: statsResult.psychoscopeEffects,
    }
}

export function simulateMoonstrike(config: MoonstrikeSimulationConfig): MoonstrikeSimResult {
    const {
        combat,
        statsResult,
        manualAtk,
        manualAspd,
        fightDuration,
        selectedTalents,
        useCustomRotation,
        rotation,
        skills,
        skillColors,
        calibration,
    } = config

    const {
        versPct, mastPct, critRate, luckRate, hastePct, aspd, avgCritLuck,
        dmgBoss, meleeDmg, weaponAtkPct,
        critMult, luckMult, physDmgPct, dmgStackPct,
        psyEffects,
    } = combat

    const actualAspd = manualAspd > 0 ? manualAspd / 100 : aspd
    let effAtk = manualAtk * (1 + weaponAtkPct)

    const psyAtkFromStatPct = psyEffects?.atkFromStat && psyEffects.atkFromStat.target !== "CritDMG"
        ? getStatPercentCombat(psyEffects.atkFromStat.stat, statsResult?.total[psyEffects.atkFromStat.stat] ?? 0) * psyEffects.atkFromStat.ratio / 100
        : 0
    effAtk *= (1 + psyAtkFromStatPct)

    const psyDreamDmg = (psyEffects?.dreamDmgPct ?? 0) / 100
    const psySpecialDmg = (psyEffects?.specialDmgPct ?? 0) / 100
    const psyExpertiseDmg = (psyEffects?.expertiseDmgPct ?? 0) / 100
    const psyConditionalAtkPct = (psyEffects?.conditionalAtkPct ?? 0) / 100
    const psyConditionalElementDmg = (psyEffects?.conditionalElementDmg ?? 0) / 100
    const psySkillDmg = psyEffects?.skillDmg ?? {}
    const psyAllElementFlat = psyEffects?.allElementFlat ?? 0
    const hasFI = psyEffects?.projectionId === "fantasia-impact"

    const MB_MV = calibration.coefficients.moonbladeHit.mv
    const MB_FLAT = calibration.coefficients.moonbladeHit.flat
    const MB_INTERVAL = calibration.coefficients.moonbladeHit.interval
    const MB_BASE_COUNT = calibration.coefficients.moonbladeHit.baseCount
    const MW_MV = calibration.coefficients.moonbladeWhirl.mv
    const MW_FLAT = calibration.coefficients.moonbladeWhirl.flat
    const LS_MV = calibration.coefficients.lightningStrike.mv
    const LS_FLAT = calibration.coefficients.lightningStrike.flat
    const TS_MV = calibration.coefficients.thunderstrike.mv
    const TS_FLAT = calibration.coefficients.thunderstrike.flat
    const TS_PROC_RATE_FROM_LUCKY = calibration.coefficients.thunderstrike.procRateFromLucky
    const SS_MV = calibration.coefficients.stormScythe.mv
    const SS_FLAT = calibration.coefficients.stormScythe.flat
    const FI_MV = calibration.coefficients.fantasiaImpact.mv
    const FI_FLAT = calibration.coefficients.fantasiaImpact.flat
    const FI_ICD = calibration.coefficients.fantasiaImpact.icd
    const TACHI_MV = calibration.coefficients.tachiLuckyStrike.mv
    const TACHI_FLAT = calibration.coefficients.tachiLuckyStrike.flat

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
        iaiThunderDance: selectedTalents?.includes("iai_thunder_dance"),
        bladeIntent: selectedTalents?.includes("blade_intent"),
        bladeIntentRecovery: selectedTalents?.includes("blade_intent_recovery"),
    }

    let maxBi = 100
    if (t.bladeIntentRare) maxBi += 75
    if (t.moonstrikDelay) maxBi += 25
    if (t.thunderRuneMastery) maxBi *= 2
    const maxSigils = 4
    let moonbladeCount = MB_BASE_COUNT
    if (t.phantomScytheI) moonbladeCount += 1

    let dsTrigger = 7
    let dsDmgMult = 1.0
    if (t.divineSickle) {
        const lPct = luckRate * 100
        if (lPct >= 45) {
            dsTrigger = 21
            dsDmgMult = 3.0
        } else if (lPct >= 28) {
            dsTrigger = 14
            dsDmgMult = 2.0
        }
    }

    let time = 0
    let totalDmg = 0
    let bi = maxBi
    let sigils = 0
    let chargeSeeds = 0
    let tcStacks = 0
    let tcTimer = 0
    let sfActive = false
    let sfTimer = 0
    let vsActive = false
    let vsTimer = 0
    let consecutiveTc = 0
    let ssCount = 0
    let mbTimer = 0
    let mbActive = false
    let mbLifeTimer = 0
    let psCd = 0
    let im1Timer = 0
    let im2Timer = 0
    let fiTimer = FI_ICD * 0.5
    let sfUptime = 0
    let vsUptime = 0

    const cds: Record<string, number> = {
        OblivionCombo: 0,
        VoltSurge: 0,
        Stormflash: 0,
        Imagine1: 0,
        Imagine2: 0,
        ChaosBreaker: 0,
        Overdrive: 0,
        ScytheWheel: 0,
    }

    const skillDmg: Record<string, number> = {}
    const skillCasts: Record<string, number> = {}
    const data: MoonstrikeSimPoint[] = []
    const log: string[] = []
    const timelineData: MoonstrikeTimelinePoint[] = []

    const getTcBonusAttacks = () => {
        const effAspd = actualAspd + (im2Timer > 0 ? 0.13 : 0)
        if (effAspd >= 0.8) return 3
        if (effAspd >= 0.5) return 2
        if (effAspd >= 0.25) return 1
        return 0
    }

    const getEffAspd = () => actualAspd + (im2Timer > 0 ? 0.13 : 0)

    const addDmg = (name: string, dmg: number) => {
        skillDmg[name] = (skillDmg[name] ?? 0) + dmg
        skillCasts[name] = (skillCasts[name] ?? 0) + 1
    }

    const calcHit = (mv: number, flat: number, type: string, element?: string, skillName?: string) => {
        const vsAtkMult = vsActive ? 0.10 + psyConditionalAtkPct : 0
        const atkNow = vsActive ? effAtk * (1 + vsAtkMult) + 80 : effAtk
        const base = atkNow * (mv / 100) + flat + psyAllElementFlat
        if (base <= 0) return 0
        let mult = 1 + versPct
        const mastNow = mastPct + (im1Timer > 0 ? 0.13 : 0)
        const mastScale = (type === "Expertise" || type === "Special" || type === "Ultimate" || type === "Imagine") ? 1 : 0.5
        mult *= (1 + mastNow * mastScale)
        let bonus = dmgBoss + meleeDmg + physDmgPct + dmgStackPct + psyDreamDmg
        if (t.thunderCurse) bonus += tcStacks * 0.02
        if (type === "Special") bonus += psySpecialDmg
        if (type === "Expertise") bonus += psyExpertiseDmg
        if (vsActive && element === "Thunder") bonus += psyConditionalElementDmg
        if (skillName && psySkillDmg[skillName]) bonus += psySkillDmg[skillName] / 100
        mult *= (1 + bonus)
        mult *= avgCritLuck
        return base * mult
    }

    const castTime = (key: string) => {
        const skill = skills[key]
        if (!skill) return 0
        const effAspd = getEffAspd()
        return skill.scalesWithAspd && effAspd > 0 ? skill.castTime / (1 + effAspd) : skill.castTime
    }

    const tickTimers = (dt: number) => {
        for (const key in cds) {
            if (cds[key] > 0) cds[key] = Math.max(0, cds[key] - dt)
        }
        if (psCd > 0) psCd = Math.max(0, psCd - dt)
        if (tcTimer > 0) {
            tcTimer -= dt
            if (tcTimer <= 0) tcStacks = 0
        }
        if (sfTimer > 0) {
            sfTimer -= dt
            sfUptime += dt
            if (sfTimer <= 0) sfActive = false
        }
        if (vsTimer > 0) {
            vsTimer -= dt
            vsUptime += dt
            if (vsTimer <= 0) vsActive = false
        }
        if (mbActive && mbLifeTimer > 0) {
            mbLifeTimer -= dt
            if (mbLifeTimer <= 0) mbActive = false
        }
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

        const ct = castTime(key)
        let cd = skill.cd
        if (key === "Overdrive" && t.overdriveRefinement) cd *= 0.7
        if (cds[key] !== undefined) cds[key] = cd

        let mv = skill.mv
        let flat = skill.flat
        if (key === "Thundercut") {
            const numAttacks = 1 + getTcBonusAttacks()
            mv = 210 * numAttacks
            flat = 600 * numAttacks
        }

        let dmg = calcHit(mv, flat, skill.type, skill.element, skill.name)

        if (key === "DivineSickle") {
            const dsBase = dmg / avgCritLuck
            const dsAvg = dsBase * critMult * (1 + luckRate * (luckMult - 1))
            dmg = dsAvg * dsDmgMult
        }

        if (t.iaiThunderDance && skill.type === "Special" && sigils >= 3) dmg *= 2

        if (dmg > 0) {
            totalDmg += dmg
            addDmg(skill.name, dmg)
        }

        if (skill.grantsBladeIntent) bi = Math.min(maxBi, bi + skill.grantsBladeIntent)
        if (t.bladeIntent && skill.type === "Expertise") bi = Math.min(maxBi, bi + 3)
        if (skill.consumesBladeIntent) bi = Math.max(0, bi - skill.consumesBladeIntent)
        if (skill.consumesSigils) sigils = Math.max(0, sigils - skill.consumesSigils)
        if (skill.grantsSigils) {
            sigils = vsActive ? maxSigils : Math.min(maxSigils, sigils + skill.grantsSigils)
        }
        if (skill.grantsChargeSeeds) chargeSeeds += skill.grantsChargeSeeds

        if (t.thunderCurse && (skill.type === "Expertise" || skill.type === "Special" || skill.type === "Ultimate")) {
            tcStacks = Math.min(4, tcStacks + 1)
            tcTimer = 10
        }
        if (key === "VoltSurge") {
            vsActive = true
            vsTimer = 12
        }
        if (key === "Stormflash") {
            sfActive = true
            sfTimer = 10
        }
        if (key === "OblivionCombo") sigils = maxSigils
        if (key === "ScytheWheel") {
            mbActive = true
            mbLifeTimer = 35
        }
        if (key === "Imagine1") im1Timer = 20
        if (key === "Imagine2") im2Timer = 20

        if ((key === "Thundercut" || key === "Thundercleave") && sfActive) {
            const lsDmg = calcHit(LS_MV, LS_FLAT, "Expertise", "Thunder", "Lightning Strike")
            totalDmg += lsDmg
            addDmg("Lightning Strike", lsDmg)
        }

        if ((key === "Thundercut" || key === "Thundercleave") && mbActive) {
            const ssDmg = calcHit(SS_MV, SS_FLAT, "Expertise", "Thunder", "Storm Scythe")
            totalDmg += ssDmg
            addDmg("Storm Scythe", ssDmg)
            ssCount++
            if (t.thunderMight2 && sfActive) {
                totalDmg += ssDmg
                addDmg("Storm Scythe", ssDmg)
                ssCount++
            }
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

        if ((key === "Moonstrike" || key === "ChaosBreaker") && mbActive) {
            const whirlDmg = calcHit(MW_MV, MW_FLAT, "Special", "Thunder", "Moonblade Whirl")
            totalDmg += whirlDmg
            addDmg("Moonblade Whirl", whirlDmg)
        }

        const prev = time
        time += ct
        tickTimers(ct)

        if (mbActive) {
            mbTimer += ct
            while (mbTimer >= MB_INTERVAL) {
                const mbDmg = calcHit(MB_MV * moonbladeCount, MB_FLAT * moonbladeCount, "Basic", "Thunder", "Moonblades")
                totalDmg += mbDmg
                addDmg("Moonblades", mbDmg)
                mbTimer -= MB_INTERVAL

                if (luckRate > 0) {
                    const vsAtkMult = vsActive ? 0.10 + psyConditionalAtkPct : 0
                    const atkNow = vsActive ? effAtk * (1 + vsAtkMult) + 80 : effAtk
                    const tachiPerProc = (atkNow * (TACHI_MV / 100) + TACHI_FLAT) * (1 + versPct)
                    const tachiDmg = tachiPerProc * luckRate * moonbladeCount
                    totalDmg += tachiDmg
                    addDmg("Lucky Strike (Tachi)", tachiDmg)
                }

                if (t.touchOfThunderSoul && luckRate > 0) {
                    const tsChance = TS_PROC_RATE_FROM_LUCKY * luckRate
                    const tsDmgBase = calcHit(TS_MV, TS_FLAT, "Special", "Thunder", "Thunderstrike")
                    const tsScale = t.enhancedThunderstrike ? 1.2 + luckRate : 1.0
                    const tsDmg = tsDmgBase * tsChance * tsScale
                    totalDmg += tsDmg
                    addDmg("Thunderstrike", tsDmg)
                }
            }
        }

        if ((key === "Thundercut" || key === "Thundercleave" || key === "BasicAttack") && psCd <= 0) {
            const tcTotalHits = key === "Thundercut" ? 2 * (1 + getTcBonusAttacks()) : skill.hits
            const procChance = 0.10 * tcTotalHits
            const pSkill = skills.PiercingSlash
            const pDmg = calcHit(pSkill.mv, pSkill.flat, pSkill.type, "Thunder", "Piercing Slash") * procChance
            totalDmg += pDmg
            addDmg("Piercing Slash", pDmg)
            if (procChance > 0) {
                sigils = vsActive ? maxSigils : Math.min(maxSigils, sigils + ((pSkill.grantsSigils ?? 0) * procChance))
            }
            psCd = 1.0
        }

        if (dmg > 0 && luckRate > 0) {
            const vsAtkMult = vsActive ? 0.10 + psyConditionalAtkPct : 0
            const atkNow = vsActive ? effAtk * (1 + vsAtkMult) + 80 : effAtk
            const tachiPerProc = (atkNow * (TACHI_MV / 100) + TACHI_FLAT) * (1 + versPct)
            const skillHits = key === "Thundercut" ? 2 * (1 + getTcBonusAttacks()) : skill.hits
            const tachiDmg = tachiPerProc * luckRate * skillHits
            totalDmg += tachiDmg
            addDmg("Lucky Strike (Tachi)", tachiDmg)
        }

        while (hasFI && fiTimer >= FI_ICD) {
            const vsAtkMult = vsActive ? 0.10 + psyConditionalAtkPct : 0
            const atkNow = vsActive ? effAtk * (1 + vsAtkMult) + 80 : effAtk
            const fiBase = atkNow * (FI_MV / 100) + FI_FLAT
            const mastNow = mastPct + (im1Timer > 0 ? 0.13 : 0)
            const fiDmg = fiBase * (1 + versPct) * (1 + mastNow) * (1 + dmgBoss + psyDreamDmg)
            totalDmg += fiDmg
            addDmg("Fantasia Impact", fiDmg)
            fiTimer -= FI_ICD
        }

        data.push({
            time: parseFloat(time.toFixed(1)),
            damage: Math.round(totalDmg),
            dps: time > 0 ? Math.round(totalDmg / time) : 0,
            skill: skill.name,
            hit: Math.round(dmg),
        })
        log.push(`[${prev.toFixed(1)}s] ${skill.name} — ${dmg > 0 ? Math.round(dmg).toLocaleString() : "BUFF"}${tcStacks > 0 ? ` (TC×${tcStacks})` : ""}${sfActive ? " [SF]" : ""}${vsActive ? " [VS]" : ""}`)

        if (dmg > 0) {
            timelineData.push({
                time: parseFloat(prev.toFixed(2)),
                skill: skill.name,
                damage: Math.round(dmg),
                y: 0,
                type: skill.type,
            })
        }
    }

    if (useCustomRotation && rotation.length > 0) {
        const flatRot: string[] = []
        for (const item of rotation) {
            for (let repeat = 0; repeat < item.repeat; repeat++) flatRot.push(item.key)
        }
        let rotIdx = 0
        while (time < fightDuration) {
            if (ssCount >= dsTrigger && t.divineSickle) {
                cast("DivineSickle")
                ssCount = 0
                continue
            }
            if (consecutiveTc >= 5 && t.moonstrikDelay && bi >= 50) {
                cast("Thundercleave")
                consecutiveTc = 0
                continue
            }

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
            } else if (bi < 50 && sigils >= 3) {
                cast("Moonstrike")
            } else if (bi < 50) {
                cast("BasicAttack")
            } else if (skill?.consumesSigils && sigils < skill.consumesSigils) {
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
    } else {
        cast("ScytheWheel")
        cast("OblivionCombo")
        cds.OblivionCombo = 60
        while (time < fightDuration) {
            if (ssCount >= dsTrigger && t.divineSickle) {
                cast("DivineSickle")
                ssCount = 0
                continue
            }
            if (consecutiveTc >= 5 && t.moonstrikDelay && bi >= 50) {
                cast("Thundercleave")
                consecutiveTc = 0
                continue
            }

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

    const breakdown = Object.entries(skillDmg)
        .map(([name, damage]) => ({
            name,
            damage: Math.round(damage),
            pct: +(damage / totalDmg * 100).toFixed(1),
            casts: skillCasts[name] ?? 0,
            dps: Math.round(damage / fightDuration),
            color: skillColors[name] ?? "var(--text-mid)",
        }))
        .sort((left, right) => right.damage - left.damage)

    const skillOrder = [...new Set(timelineData.map(item => item.skill))]
    const normalizedTimelineData = timelineData.map(item => ({
        ...item,
        y: skillOrder.indexOf(item.skill),
    }))

    return {
        data,
        log,
        breakdown,
        effAtk: Math.round(effAtk),
        finalDmg: totalDmg,
        finalDps: totalDmg / fightDuration,
        actualAspd,
        timelineData: normalizedTimelineData,
        skillOrder,
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
}