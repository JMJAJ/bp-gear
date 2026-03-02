"use client"
import { useApp, getStatPercentCombat, getClassForSpec } from "@/lib/app-context"
import { GAME_DATA } from "@/lib/game-data"
import { Tip } from "@/components/TooltipText"

export function DetailsSection() {
  const { stats, base, ext, accentColor, spec, psychoscopeConfig } = useApp()

  if (!stats) {
    return (
      <div className="p-8 text-center text-[#444]">
        <p className="text-sm">No stats calculated yet.</p>
        <p className="text-xs mt-2">Configure your gear to see detailed breakdowns.</p>
      </div>
    )
  }

  const COMBAT_STATS = ["Crit", "Haste", "Luck", "Mastery", "Versatility"]
  const className = spec ? getClassForSpec(spec) : null
  const mainStatName = className ? GAME_DATA.CLASSES[className]?.main ?? null : null
  const isAgilityClass = mainStatName === "Agility"
  const baseAgi = base.agi

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Stat Calculation Details</h1>
        <p className="text-sm text-[#666]">
          Complete breakdown of where your stats come from
        </p>
      </div>

      {/* Quick Comparison */}
      <div className="bg-[#0d0d0d] border-2 border-[#1a1a1a] rounded-lg p-5">
        <h2 className="text-base font-semibold text-white mb-3">Quick Comparison</h2>
        <p className="text-xs text-[#666] mb-4">
          Compare your in-game stats with calculated values to identify discrepancies
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {COMBAT_STATS.map(stat => {
            const rawTotal = stats.total[stat] ?? 0
            const extVal = stats.ext[stat.toLowerCase() as keyof typeof stats.ext] ?? 0
            const purplePct = stats.purpleStats?.[`${stat} (%)`] ?? 0
            const finalPct = getStatPercentCombat(stat, rawTotal) + extVal + purplePct

            return (
              <div key={stat} className="bg-[#0a0a0a] border border-[#1a1a1a] rounded p-3">
                <div className="text-xs text-[#666] mb-1">
                  <Tip
                    text={
                      stat === "Crit" ? "Crit chance." :
                      stat === "Haste" ? "Haste %." :
                      stat === "Luck" ? "Lucky Strike chance. (In-game UI often shows +5% base.)" :
                      stat === "Mastery" ? "Damage scaling stat." :
                      "General multiplier stat."
                    }
                  >
                    <span>{stat}</span>
                  </Tip>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-bold text-white">{finalPct.toFixed(2)}%</span>
                  <Tip text="Raw points before the game converts them into %.">
                    <span className="text-xs text-[#555]">({rawTotal.toFixed(0)} raw)</span>
                  </Tip>
                </div>
              </div>
            )
          })}
          
          <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded p-3">
            <div className="text-xs text-[#666] mb-1">
              <Tip text="ASPD. Some skills care about 25/50/80% breakpoints.">
                <span>Attack Speed</span>
              </Tip>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold text-white">{(stats.aspd ?? 0).toFixed(2)}%</span>
            </div>
          </div>
          
          <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded p-3">
            <div className="text-xs text-[#666] mb-1">
              <Tip text="CSPD. Shorter cast/animation time for skills that scale with it.">
                <span>Cast Speed</span>
              </Tip>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold text-white">{(stats.cspd ?? 0).toFixed(2)}%</span>
            </div>
          </div>
        </div>

        <div className="mt-4 p-3 bg-[#1a1a0a] border border-[#2a2a1a] rounded">
          <div className="text-xs text-[#888]">
            <span className="font-semibold" style={{ color: accentColor }}>Note:</span> If your in-game stats don't match, 
            check the detailed breakdowns below to see where the difference comes from. Common causes include:
            <ul className="mt-2 ml-4 space-y-1 list-disc">
              <li>Missing base stats (character level, account bonuses)</li>
              <li>Psychoscope gain multipliers not being applied correctly</li>
              <li>Agility conversion to Haste (0.45 ratio)</li>
              <li>External buffs from party members or consumables</li>
              <li>Default stat bonuses (e.g., Luck has +5% default in-game)</li>
            </ul>
          </div>
        </div>

        {/* In-Game vs Calculated Comparison */}
        <div className="mt-4 p-4 bg-[#0a0a0a] border border-[#1a1a1a] rounded">
          <h3 className="text-sm font-semibold text-white mb-3">My (Jxint) In-Game Stats (Moonstrike)</h3>
          
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <div className="text-[#666] mb-2 font-semibold">WITHOUT Psychoscope:</div>
              <div className="space-y-1 text-[#aaa]">
                <div>Luck: 39.51% (34.51% + 5% default)</div>
                <div>Haste: 37.71% (12091 raw)</div>
                <div>Attack Speed: 64.58%</div>
              </div>
            </div>
            
            <div>
              <div className="text-[#666] mb-2 font-semibold">WITH Psychoscope:</div>
              <div className="space-y-1 text-[#aaa]">
                <div>Luck: 41.51% (34.51% + 5% default + 2% bond)</div>
                <div>Haste: 40.79% (13759 raw)</div>
                <div>Attack Speed: 73.76%</div>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-[#1a1a1a] text-xs text-[#666]">
            <span className="font-semibold" style={{ color: accentColor }}>Analysis:</span> The in-game UI shows 
            Luck with a +5% default bonus that's always active. Our calculator shows the combat-accurate value 
            which includes this base. Psychoscope should add +1668 raw Haste (13759 - 12091) from the "gained in any way +10%" 
            multiplier (Polarity X8).
          </div>
        </div>
      </div>

      {/* Combat Stats Breakdown */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-white border-b border-[#222] pb-2">
          Combat Stats Breakdown
        </h2>

        {COMBAT_STATS.map(stat => {
          const rawTotal = stats.total[stat] ?? 0
          const extVal = stats.ext[stat.toLowerCase() as keyof typeof stats.ext] ?? 0
          const purplePct = stats.purpleStats?.[`${stat} (%)`] ?? 0
          
          // Calculate base raw (before psychoscope gain multipliers)
          const gainMult = stats.psychoscopeEffects?.gainMult[stat] ?? 0
          const rawBeforeGainMult = gainMult !== 0 ? rawTotal / (1 + gainMult / 100) : rawTotal
          const gainMultBonus = rawTotal - rawBeforeGainMult
          
          const finalPct = getStatPercentCombat(stat, rawTotal) + extVal + purplePct

          // Get the conversion constant
          const cData = GAME_DATA.CONSTANTS[stat]
          const baseVal = cData?.base ?? 0
          const constant = cData?.c ?? 1

          return (
            <div key={stat} className="bg-[#0a0a0a] border border-[#1a1a1a] rounded p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-base font-semibold text-white">{stat}</h3>
                <div className="text-right">
                  <div className="text-lg font-bold" style={{ color: accentColor }}>
                    {finalPct.toFixed(2)}%
                  </div>
                  <div className="text-xs text-[#555]">{rawTotal.toFixed(0)} raw</div>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="text-[#666] text-xs font-semibold mb-2">RAW STAT SOURCES:</div>
                
                {/* Base character stats */}
                {/* {base[stat.toLowerCase() as keyof typeof base] > 0 && (
                  <div className="flex justify-between text-[#aaa]">
                    <span>Base (Character/Talents/Account)</span>
                    <span className="font-mono">+{base[stat.toLowerCase() as keyof typeof base]}</span>
                  </div>
                )} */}

                {/* Base % */}
                {baseVal > 0 && (
                  <div className="flex justify-between text-[#aaa]">
                    <Tip text="Free base % the game gives you.">
                      <span>Base</span>
                    </Tip>
                    <span className="font-mono">+{baseVal.toFixed(2)}%</span>
                  </div>
                )}

                {/* Gear contributions */}
                <div className="flex justify-between text-[#aaa]">
                  <Tip text="Raw points coming from your gear stats.">
                    <span>From Gear (Primary/Secondary/Raid)</span>
                  </Tip>
                  <span className="font-mono">
                    +{(rawBeforeGainMult - (base[stat.toLowerCase() as keyof typeof base] || 0)).toFixed(0)}
                  </span>
                </div>

                {/* Psychoscope gain multiplier */}
                {gainMult !== 0 && (
                  <div className="flex justify-between text-[#9b87f5]">
                    <Tip text="Psychoscope bonus that makes you gain more of this stat from all sources.">
                      <span>Psychoscope Gain Multiplier ({gainMult > 0 ? '+' : ''}{gainMult.toFixed(1)}%)</span>
                    </Tip>
                    <span className="font-mono">{gainMult > 0 ? '+' : ''}{gainMultBonus.toFixed(0)}</span>
                  </div>
                )}

                {/* Subtotal raw */}
                <div className="flex justify-between font-semibold text-white pt-2 border-t border-[#1a1a1a]">
                  <span>Total Raw {stat}</span>
                  <span className="font-mono">{rawTotal.toFixed(0)}</span>
                </div>

                {/* Conversion formula */}
                <div className="mt-3 pt-3 border-t border-[#1a1a1a]">
                  <div className="text-[#666] text-xs font-semibold mb-2">CONVERSION TO %:</div>
                  <div className="font-mono text-xs text-[#888] bg-[#050505] p-2 rounded">
                    {baseVal.toFixed(2)}% + ({rawTotal.toFixed(0)} / ({rawTotal.toFixed(0)} + {constant})) × 100
                    = {getStatPercentCombat(stat, rawTotal).toFixed(2)}%
                  </div>
                </div>

                {/* Additional % bonuses */}
                <div className="mt-3 pt-3 border-t border-[#1a1a1a]">
                  <div className="text-[#666] text-xs font-semibold mb-2">ADDITIONAL % BONUSES:</div>
                  
                  {/* External buffs */}
                  {extVal > 0 && (
                    <div className="flex justify-between" style={{ color: accentColor }}>
                      <Tip text="Extra % from buffs (party, food, etc.).">
                        <span>External Buffs</span>
                      </Tip>
                      <span className="font-mono">+{extVal.toFixed(2)}%</span>
                    </div>
                  )}

                  {/* Purple stat bonuses */}
                  {purplePct > 0 && (
                    <div className="flex justify-between" style={{ color: accentColor }}>
                      <Tip text="Extra % from purple stats / talents.">
                        <span>Purple Stats / Talents</span>
                      </Tip>
                      <span className="font-mono">+{purplePct.toFixed(2)}%</span>
                    </div>
                  )}

                  {/* Psychoscope effects */}
                  {stats.psychoscopeEffects && (
                    <>
                      {stats.psychoscopeEffects.treeStatPct[stat] && (
                        <div className="flex justify-between text-[#9b87f5]">
                          <Tip text="% from your Psychoscope tree.">
                            <span>Psychoscope Tree Bonus</span>
                          </Tip>
                          <span className="font-mono">+{stats.psychoscopeEffects.treeStatPct[stat]}%</span>
                        </div>
                      )}
                      {stat === "Crit" && stats.psychoscopeEffects.bondCritPct > 0 && (
                        <div className="flex justify-between text-[#9b87f5]">
                          <Tip text="Extra % from Psychoscope bond.">
                            <span>Psychoscope Bond Exclusive</span>
                          </Tip>
                          <span className="font-mono">+{stats.psychoscopeEffects.bondCritPct}%</span>
                        </div>
                      )}
                      {stat === "Luck" && stats.psychoscopeEffects.bondLuckPct > 0 && (
                        <div className="flex justify-between text-[#9b87f5]">
                          <Tip text="Extra % from Psychoscope bond.">
                            <span>Psychoscope Bond Exclusive</span>
                          </Tip>
                          <span className="font-mono">+{stats.psychoscopeEffects.bondLuckPct}%</span>
                        </div>
                      )}
                    </>
                  )}

                  {extVal === 0 && purplePct === 0 && !stats.psychoscopeEffects?.treeStatPct[stat] && 
                   !(stat === "Crit" && stats.psychoscopeEffects?.bondCritPct) &&
                   !(stat === "Luck" && stats.psychoscopeEffects?.bondLuckPct) && (
                    <div className="text-[#444] text-xs">None</div>
                  )}
                </div>

                {/* Final total */}
                <div className="flex justify-between font-bold text-white pt-3 border-t border-[#1a1a1a] text-base">
                  <span>FINAL {stat.toUpperCase()} %</span>
                  <span className="font-mono" style={{ color: accentColor }}>{finalPct.toFixed(2)}%</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Main Stat Breakdown (class-aware) */}
      {mainStatName && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white border-b border-[#222] pb-2">
            {mainStatName} Breakdown
          </h2>

          <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-base font-semibold text-white">{mainStatName}</h3>
              <div className="text-right">
                {isAgilityClass && <div className="text-xs text-[#555] mb-1">Converts to Haste</div>}
                {!isAgilityClass && <div className="text-xs text-[#555] mb-1">Primary stat (informational)</div>}
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="text-[#666] text-xs font-semibold mb-2">{mainStatName.toUpperCase()} SOURCES:</div>
              
              {/* Base stat */}
              {baseAgi > 0 && (
                <div className="flex justify-between text-[#aaa]">
                  <Tip text="Not sure where this coming from but I will just manually add this">Base</Tip>
                  <span className="font-mono">+{baseAgi}</span>
                </div>
              )}

              {/* Gear main stat (basic attributes) */}
              {(stats.gearMainStat ?? 0) > 0 && (
                <div className="flex justify-between text-[#aaa]">
                  <span>Gear (Basic Attributes)</span>
                  <span className="font-mono">+{stats.gearMainStat}</span>
                </div>
              )}

              {/* Module main stat */}
              {(stats.moduleStats?.[mainStatName] ?? 0) > 0 && (
                <div className="flex justify-between text-[#aaa]">
                  <span>Power Core Modules</span>
                  <span className="font-mono">+{stats.moduleStats?.[mainStatName]?.toFixed(0)}</span>
                </div>
              )}

              {/* Sigil main stat */}
              {(stats.extraStats?.[mainStatName] ?? 0) > 0 && (
                <div className="flex justify-between text-[#aaa]">
                  <span>Sigils</span>
                  <span className="font-mono">+{stats.extraStats?.[mainStatName]?.toFixed(0)}</span>
                </div>
              )}

              {/* Psychoscope flat main stat */}
              {(stats.psychoscopeEffects?.flatStats[mainStatName] ?? 0) > 0 && (
                <div className="flex justify-between text-[#9b87f5]">
                  <span>Psychoscope (Polarity X4)</span>
                  <span className="font-mono">+{stats.psychoscopeEffects!.flatStats[mainStatName]?.toFixed(0)}</span>
                </div>
              )}

              {/* Raw main stat subtotal */}
              <div className="flex justify-between font-semibold text-white pt-2 border-t border-[#1a1a1a]">
                <span>Raw {mainStatName}</span>
                <span className="font-mono">
                  {(baseAgi + 
                    (stats.gearMainStat ?? 0) +
                    (stats.moduleStats?.[mainStatName] ?? 0) + 
                    (stats.extraStats?.[mainStatName] ?? 0) + 
                    (stats.psychoscopeEffects?.flatStats[mainStatName] ?? 0)).toFixed(0)}
                </span>
              </div>

              {/* Main stat % bonus */}
              {((stats.purpleStats?.[`${mainStatName} (%)`] ?? 0) > 0 || (stats.psychoscopeEffects?.pctStats[mainStatName] ?? 0) > 0) && (
                <div className="mt-3 pt-3 border-t border-[#1a1a1a]">
                  <div className="text-[#666] text-xs font-semibold mb-2">{mainStatName.toUpperCase()} % BONUSES:</div>
                  
                  {(stats.purpleStats?.[`${mainStatName} (%)`] ?? 0) > 0 && (
                    <div className="flex justify-between" style={{ color: accentColor }}>
                      <span>Purple Stats</span>
                      <span className="font-mono">+{stats.purpleStats?.[`${mainStatName} (%)`]?.toFixed(2)}%</span>
                    </div>
                  )}

                  {(stats.psychoscopeEffects?.pctStats[mainStatName] ?? 0) > 0 && (
                    <div className="flex justify-between text-[#9b87f5]">
                      <span>Psychoscope (Polarity X4)</span>
                      <span className="font-mono">+{stats.psychoscopeEffects!.pctStats[mainStatName]?.toFixed(2)}%</span>
                    </div>
                  )}
                </div>
              )}

              {/* Conversion to Haste (Agility only) */}
              {isAgilityClass && (
                <div className="mt-3 pt-3 border-t border-[#1a1a1a]">
                  <div className="text-[#666] text-xs font-semibold mb-2">CONVERSION TO HASTE:</div>
                  <div className="font-mono text-xs text-[#888] bg-[#050505] p-2 rounded">
                    Total Agility × 0.45 = Haste raw
                  </div>
                  <div className="flex justify-between font-semibold text-white mt-2">
                    <span>Haste from Agility</span>
                    <span className="font-mono">
                      +{((baseAgi + 
                        (stats.gearMainStat ?? 0) +
                        (stats.moduleStats?.["Agility"] ?? 0) + 
                        (stats.extraStats?.["Agility"] ?? 0) + 
                        (stats.psychoscopeEffects?.flatStats["Agility"] ?? 0)) * 
                        (1 + ((stats.purpleStats?.["Agility (%)"] ?? 0) + (stats.psychoscopeEffects?.pctStats["Agility"] ?? 0)) / 100) * 
                        0.45).toFixed(0)} raw
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Attack Speed Breakdown */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-white border-b border-[#222] pb-2">
          Attack Speed Breakdown
        </h2>

        <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-base font-semibold text-white">Attack Speed</h3>
            <div className="text-lg font-bold" style={{ color: accentColor }}>
              {(stats.aspd ?? 0).toFixed(2)}%
            </div>
          </div>

          <div className="space-y-2 text-sm">
            {/* Haste contribution */}
            <div className="flex justify-between text-[#aaa]">
              <span>From Haste ({getStatPercentCombat("Haste", stats.total.Haste).toFixed(2)}% × ratio)</span>
              <span className="font-mono">
                +{(getStatPercentCombat("Haste", stats.total.Haste) * 0.6).toFixed(2)}%
              </span>
            </div>

            {/* Purple stats */}
            {(stats.purpleStats?.["Attack Speed (%)"] ?? 0) > 0 && (
              <div className="flex justify-between text-[#aaa]">
                <span>Purple Stats</span>
                <span className="font-mono">+{stats.purpleStats?.["Attack Speed (%)"]?.toFixed(2)}%</span>
              </div>
            )}

            {/* External buffs */}
            {ext.aspd > 0 && (
              <div className="flex justify-between" style={{ color: accentColor }}>
                <span>External Buffs</span>
                <span className="font-mono">+{ext.aspd.toFixed(2)}%</span>
              </div>
            )}

            {/* Module bonuses */}
            {(stats.moduleStats?.["Attack Speed (%)"] ?? 0) > 0 && (
              <div className="flex justify-between text-[#aaa]">
                <span>Power Core Modules</span>
                <span className="font-mono">+{stats.moduleStats?.["Attack Speed (%)"]?.toFixed(2)}%</span>
              </div>
            )}

            {/* Talent ASPD */}
            {stats.talentAspd > 0 && (
              <div className="flex justify-between text-[#aaa]">
                <span>Talents</span>
                <span className="font-mono">+{stats.talentAspd.toFixed(2)}%</span>
              </div>
            )}

            {/* Raid set bonuses */}
            {stats.raid2pcBonus?.t === "aspd" && (
              <div className="flex justify-between text-[#aaa]">
                <span>2pc Raid Set Bonus</span>
                <span className="font-mono">+{stats.raid2pcBonus.v.toFixed(2)}%</span>
              </div>
            )}

            {stats.raid2pcBonus?.t === "aspd_cond" && (stats.aspd ?? 0) < 80 && (
              <div className="flex justify-between text-[#aaa]">
                <span>2pc Raid Set Bonus (conditional)</span>
                <span className="font-mono">+{stats.raid2pcBonus.v.toFixed(2)}%</span>
              </div>
            )}

            {/* Final total */}
            <div className="flex justify-between font-semibold text-white pt-2 border-t border-[#1a1a1a]">
              <span>Final Total</span>
              <span className="font-mono">{(stats.aspd ?? 0).toFixed(2)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Cast Speed Breakdown */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-white border-b border-[#222] pb-2">
          Cast Speed Breakdown
        </h2>

        <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-base font-semibold text-white">Cast Speed</h3>
            <div className="text-lg font-bold" style={{ color: accentColor }}>
              {(stats.cspd ?? 0).toFixed(2)}%
            </div>
          </div>

          <div className="space-y-2 text-sm">
            {/* Haste contribution */}
            <div className="flex justify-between text-[#aaa]">
              <span>From Haste ({getStatPercentCombat("Haste", stats.total.Haste).toFixed(2)}% × 1.0)</span>
              <span className="font-mono">
                +{getStatPercentCombat("Haste", stats.total.Haste).toFixed(2)}%
              </span>
            </div>

            {/* Purple stats */}
            {(stats.purpleStats?.["Cast Speed (%)"] ?? 0) > 0 && (
              <div className="flex justify-between text-[#aaa]">
                <span>Purple Stats</span>
                <span className="font-mono">+{stats.purpleStats?.["Cast Speed (%)"]?.toFixed(2)}%</span>
              </div>
            )}

            {/* External buffs */}
            {ext.cspd > 0 && (
              <div className="flex justify-between" style={{ color: accentColor }}>
                <span>External Buffs</span>
                <span className="font-mono">+{ext.cspd.toFixed(2)}%</span>
              </div>
            )}

            {/* Module bonuses */}
            {(stats.moduleStats?.["Cast Speed (%)"] ?? 0) > 0 && (
              <div className="flex justify-between text-[#aaa]">
                <span>Power Core Modules</span>
                <span className="font-mono">+{stats.moduleStats?.["Cast Speed (%)"]?.toFixed(2)}%</span>
              </div>
            )}

            {/* Raid set bonuses */}
            {stats.raid2pcBonus?.t === "cspd" && (
              <div className="flex justify-between text-[#aaa]">
                <span>2pc Raid Set Bonus</span>
                <span className="font-mono">+{stats.raid2pcBonus.v.toFixed(2)}%</span>
              </div>
            )}

            {/* Final total */}
            <div className="flex justify-between font-semibold text-white pt-2 border-t border-[#1a1a1a]">
              <span>Final Total</span>
              <span className="font-mono">{(stats.cspd ?? 0).toFixed(2)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Psychoscope Effects */}
      {psychoscopeConfig.enabled && stats.psychoscopeEffects && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white border-b border-[#222] pb-2">
            Psychoscope Effects
          </h2>

          <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded p-4 space-y-3">
            {/* Flat stats */}
            {Object.keys(stats.psychoscopeEffects.flatStats).length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-[#9b87f5] mb-2">Flat Stat Bonuses</h4>
                <div className="space-y-1 text-sm">
                  {Object.entries(stats.psychoscopeEffects.flatStats).map(([stat, val]) => (
                    <div key={stat} className="flex justify-between text-[#aaa]">
                      <span>{stat}</span>
                      <span className="font-mono">+{val.toFixed(0)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Percentage stats */}
            {Object.keys(stats.psychoscopeEffects.pctStats).length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-[#9b87f5] mb-2">Percentage Stat Bonuses</h4>
                <div className="space-y-1 text-sm">
                  {Object.entries(stats.psychoscopeEffects.pctStats).map(([stat, val]) => (
                    <div key={stat} className="flex justify-between text-[#aaa]">
                      <span>{stat}</span>
                      <span className="font-mono">+{val.toFixed(2)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Gain multipliers */}
            {Object.keys(stats.psychoscopeEffects.gainMult).length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-[#9b87f5] mb-2">Gain Multipliers</h4>
                <div className="space-y-1 text-sm">
                  {Object.entries(stats.psychoscopeEffects.gainMult).map(([stat, val]) => (
                    <div key={stat} className="flex justify-between text-[#aaa]">
                      <span>{stat} gained in any way</span>
                      <span className="font-mono">{val > 0 ? '+' : ''}{val.toFixed(2)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bond effects */}
            {(stats.psychoscopeEffects.bondHighestStatFlat > 0 || 
              stats.psychoscopeEffects.bondIlluStrength > 0 || 
              stats.psychoscopeEffects.bondEndurance > 0) && (
              <div>
                <h4 className="text-sm font-semibold text-[#9b87f5] mb-2">Bond General Effects</h4>
                <div className="space-y-1 text-sm">
                  {stats.psychoscopeEffects.bondHighestStatFlat > 0 && (
                    <div className="flex justify-between text-[#aaa]">
                      <span>Highest Combat Stat</span>
                      <span className="font-mono">+{stats.psychoscopeEffects.bondHighestStatFlat}</span>
                    </div>
                  )}
                  {stats.psychoscopeEffects.bondIlluStrength > 0 && (
                    <div className="flex justify-between text-[#aaa]">
                      <span>Illusion Strength</span>
                      <span className="font-mono">+{stats.psychoscopeEffects.bondIlluStrength}</span>
                    </div>
                  )}
                  {stats.psychoscopeEffects.bondEndurance > 0 && (
                    <div className="flex justify-between text-[#aaa]">
                      <span>Endurance</span>
                      <span className="font-mono">+{stats.psychoscopeEffects.bondEndurance}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* All active effects */}
            {stats.psychoscopeEffects.activeEffects.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-[#9b87f5] mb-2">Active Effects</h4>
                <div className="space-y-1 text-xs text-[#777]">
                  {stats.psychoscopeEffects.activeEffects.map((effect, i) => (
                    <div key={i}>• {effect}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
