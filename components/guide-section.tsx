"use client"
import { useApp } from "@/lib/app-context"

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  const { accentColor } = useApp()
  return (
    <div className="border border-[#222] bg-[#0a0a0a] mb-3">
      <div
        className="px-4 py-2.5 border-b border-[#1a1a1a] text-[10px] font-bold uppercase tracking-[1.5px]"
        style={{ color: accentColor }}
      >
        {title}
      </div>
      <div className="px-4 py-3 text-[11px] text-[#999] leading-[1.7]">
        {children}
      </div>
    </div>
  )
}

function KV({ k, v, accent }: { k: string; v: string; accent?: boolean }) {
  const { accentColor } = useApp()
  return (
    <div className="flex justify-between items-baseline py-0.5 border-b border-[#111]">
      <span className="text-[#666]">{k}</span>
      <span className={accent ? "font-bold" : "text-[#aaa]"} style={{ color: accent ? accentColor : undefined }}>{v}</span>
    </div>
  )
}

export function GuideSection({ variant }: { variant?: "stormblade" }) {
  const { accentColor, setSection, setBuild, setSpec } = useApp()

  if (variant === "stormblade") {
    return (
      <div>
        <div className="mb-6">
          <div className="text-2xl font-bold tracking-tight text-white mb-1">Moonstrike Guide</div>
          <div className="text-[11px] text-[#555] max-w-xl leading-5">
            Full breakdown of the Stormblade Moonstrike spec — the meta single-target DPS with the highest
            burst ceiling in the current patch.
          </div>
        </div>

        <Block title="Overview">
          <p>
            Moonstrike is a <strong className="text-white">Stormblade</strong> spec optimized for sustained burst. Its kit revolves around
            building Lucky Strike stacks with your core rotation and then dumping them in a burst window.
            Luck and Haste are the primary stats, with the spec&apos;s kit being uniquely efficient with Lucky
            Strike DMG multiplier from modules and imagines.
          </p>
        </Block>

        <Block title="Stat Priority">
          <div className="space-y-0.5">
            <KV k="1st" v="Luck% — fills stacks faster and boosts Lucky Strike DMG" accent />
            <KV k="2nd" v="Haste% — reduces cooldowns, more cycles per fight" />
            <KV k="3rd" v="Crit% — secondary DPS stat, scales with Lucky Strike crits" />
            <KV k="4th" v="Mastery% — utility, flat multiplier on specialization skills" />
            <KV k="Versatility" v="Filler — take it when you have nothing else" />
          </div>
        </Block>

        <Block title="Gear Setup">
          <ul className="list-none space-y-1">
            <li><span className="text-white font-semibold">Weapon</span> — Raid. Locks Luck/Haste from spec auto-fill. Gives Luck +6% and Haste +6% weapon buffs.</li>
            <li><span className="text-white font-semibold">Helmet</span> — Gold. Primary: Luck. Secondary: Haste.</li>
            <li><span className="text-white font-semibold">Chest</span> — Gold. Primary: Luck. Secondary: Haste.</li>
            <li><span className="text-white font-semibold">Gloves</span> — Gold. Primary: Haste. Secondary: Luck.</li>
            <li><span className="text-white font-semibold">Boots</span> — Raid preferred. Primary: Luck/Haste.</li>
            <li><span className="text-white font-semibold">Earrings</span> — Gold. Luck primary.</li>
            <li><span className="text-white font-semibold">Necklace</span> — Gold. Haste primary.</li>
            <li><span className="text-white font-semibold">Ring</span> — Gold. Luck primary.</li>
            <li><span className="text-white font-semibold">Bracelets</span> — Raid if available. Luck/Haste split.</li>
            <li><span className="text-white font-semibold">Charm</span> — Gold. Haste or Luck.</li>
          </ul>
        </Block>

        <Block title="Reforge Priority">
          Reforge everything to <strong className="text-white">Luck</strong>. Luck has the second-best constant (16,230) after Versatility,
          making it your most efficient raw-stat investment per reforge slot.
          Exception: if you&apos;re below the 25% Haste breakpoint, reforge gear to Haste until you hit it.
        </Block>

        <Block title="Imagine Slots">
          <KV k="Slot 1" v="Storm Goblin King (Luck) — 500 Luck flat at any tier" accent />
          <KV k="Slot 2" v="Flamehorn (Luck) — 500 Luck flat at any tier" />
          <KV k="Upgrade Order" v="Phantom Arachnocrab/Celestial Flier if budget allows" />
        </Block>

        <Block title="Power Core Modules">
          <KV k="Slot 1 (Gold)" v="Luck Focus — Lucky Strike DMG 7.8% + Lucky Strike Healing 6.2% at Lv6" accent />
          <KV k="Slot 2 (Gold)" v="Team Luck & Crit — Crit DMG 10.4% + Lucky Strike DMG Multiplier 6.8% at Lv6" />
          <KV k="Slot 3 (Gold)" v="Attack SPD — for Haste if below 50% ASPD breakpoint" />
          <KV k="Slot 4 (Purple)" v="DMG Stack — for sustained fights with stacking buff" />
          <p className="mt-2 text-[10px] text-[#555]">
            Module points stack — if the same affix appears in multiple slots, the total reaches a higher level tier.
          </p>
        </Block>

        <Block title="Raid Bonus">
          Moonstrike&apos;s raid set bonus: <strong className="text-white">Luck +6%</strong> (multiplicative on your current raw Luck total).
          With 4+ raid pieces, this alone adds ~3–5% effective Luck percentage depending on your raw total.
        </Block>

        <div className="mt-4">
          <button
            onClick={() => { setBuild("Agility"); setSpec("Moonstrike"); setSection("planner") }}
            className="px-5 py-2.5 text-[11px] font-bold uppercase tracking-[1.5px] transition-all"
            style={{ background: accentColor, color: "#000" }}
          >
            Load Moonstrike Template →
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <div className="text-2xl font-bold tracking-tight text-white mb-1">Beginner Guide</div>
        <div className="text-[11px] text-[#555] max-w-xl leading-5">
          A no-fluff breakdown of the BPSR gear system and how to use this tool effectively.
        </div>
      </div>

      <Block title="Core Concept — Diminishing Returns">
        <p>
          Every substat uses the formula: <code className="bg-[#111] px-1.5 py-0.5 text-white font-mono text-[10px]">% = Base + Raw / (Raw + Constant)</code>.
          This means stacking one stat to extremes has rapidly diminishing returns.
          A balanced spread across 2–3 priority stats usually outperforms going deep into one.
        </p>
        <p className="mt-2">
          Versatility has the lowest constant (11,200), making it the cheapest stat to inflate but the least impactful.
          Mastery, Haste, Crit, and Luck all sit at ~16k–20k constants and require more raw investment.
        </p>
      </Block>

      <Block title="Raid vs. Gold Gear">
        <div className="space-y-0.5">
          <KV k="Gold weapon" v="1,512 Primary + 756 Secondary + 453 Reforge" />
          <KV k="Raid weapon" v="1,966 Primary + 1,966 Secondary (no reforge)" />
          <KV k="Gold armor" v="756 Primary + 378 Secondary + 226 Reforge" />
          <KV k="Raid armor" v="756 Primary + 756 Secondary + 226 Reforge" accent />
        </div>
        <p className="mt-2">
          Raid gear doubles the secondary stat but removes the reforge slot on the weapon.
          The extra secondary + raid set bonus almost always outweighs the loss of reforge flexibility.
        </p>
      </Block>

      <Block title="Build Types">
        <div className="space-y-0.5">
          <KV k="Strength" v="Heavy Guardian, Wind Knight, Shield Knight — ATK scaling, physical DPS/tank" />
          <KV k="Agility" v="Stormblade, Marksman — ATK scaling, fast-hitting DPS" />
          <KV k="Intellect" v="Frostmage, Verdant Oracle, Beat Performer — MATK scaling, magic DPS/support" />
        </div>
        <p className="mt-2">
          Build type restricts which substats can appear on each slot (see slot restrictions in the Planner).
          The restrictions are intentional — they force you toward your class&apos;s intended stat spread.
        </p>
      </Block>

      <Block title="Sigils">
        Each piece of gear has one sigil slot. Higher-tier sigils on your weapon slot (Emerald Caprahorn, Blackfire Foxen, etc.)
        can give significant primary stat (Strength/Agility/Intellect) alongside Endurance. Armor sigils typically
        give flat raw substats (500–600 at Lv3 for boss-tier sigils). Always prioritize slotting your weapon sigil first.
      </Block>

      <Block title="Purple Stats (Legendary)">
        Purple stats appear on specific slots. Weapon and accessories (Earrings, Necklace, Ring, Charm) get{" "}
        <strong className="text-white">percentage</strong> stats filtered by class.
        Armor pieces (Helmet, Chest, Gloves, Boots, Bracelets) get{" "}
        <strong className="text-white">flat</strong> defensive stats (Armor, Resistance, Max HP, Strength%).
        The purple field in the Planner accepts your actual in-game value.
      </Block>

      <Block title="How to Use This Tool">
        <ol className="list-decimal list-inside space-y-1">
          <li>Go to <strong className="text-white">Classes</strong> → pick your class → &quot;Apply &amp; Go to Planner&quot;</li>
          <li>In <strong className="text-white">Planner</strong>, check Raid on slots you have raid gear for</li>
          <li>Fill in primary/secondary/reforge for non-raid slots based on your spec&apos;s priority</li>
          <li>Add your sigils and purple stat values</li>
          <li>Input base raw stats from talents/account levels in the right panel</li>
          <li>Use <strong className="text-white">Optimizer</strong> if you want the engine to find the best combo automatically</li>
          <li>Check <strong className="text-white">Stat Curves</strong> to see when your current raw values hit diminishing returns</li>
        </ol>
      </Block>
    </div>
  )
}
