# DPS Simulator Improvement Plan

## Goal

Upgrade the current Stormblade Moonstrike DPS simulator from a hand-tuned, single-profile model into a log-validated simulator that is calibrated against your real combat database.

Primary objective:
- Use your ZDPS database at C:\Users\Jxint\Desktop\ZDPS.-.DPS.Meter\ZDPS - DPS Meter\Data\ZDatabase.db to learn how Moonstrike actually behaves in fights.

Secondary objectives:
- Compare your Moonstrike logs against other Moonstrike players in the same raids and parties.
- Replace hardcoded assumptions with measured timings, proc rates, uptime windows, and damage distributions.
- Build a repeatable validation loop so simulator changes can be tested against real encounters instead of intuition.

## What The Current Simulator Does Well

- It already models the Moonstrike resource system: Blade Intent, Sigils, Stormflash, Volt Surge, Moonblades, Thundercut, Moonstrike, Chaos Breaker, Divine Sickle, and several talents.
- It already uses planner-derived stats and some combat-aware stat conversions.
- It already has a readable execution loop and output surfaces for chart, breakdown, log, timeline, and gear-set comparison.

## Current Problems To Fix

The simulator is accurate in spirit, but not yet reliable as a predictive model.

Main issues in the current implementation:
- Too many constants are reverse-engineered from one or a few parses, especially Moonblade damage, Storm Scythe, Thunderstrike, Fantasia Impact, and Tachi lucky strike behavior.
- The rotation model is mostly deterministic. Real fights have drift, downtime, target loss, delayed casts, party buff overlap, and human variance.
- Proc logic is modeled as expected-value averages in several places instead of event-level behavior.
- Team context is mostly absent. Your note about other Moonstrikes in the party is important because it allows same-fight comparison under similar boss timing and raid conditions.
- The combat model is embedded directly inside the React component, which makes calibration, testing, and iteration harder than it should be.

## Data We Can Extract From Your Database

The existing ZDPS extraction script already proves the database contains enough signal for a strong calibration pass.

Relevant sources:
- ZDatabase.db
- extract_encounter.py
- SkillTable.json
- BuffTable.json
- EntityCache.json

Useful structures already visible from the extractor:
- Encounters: fight metadata, boss, start and end time, wipe state, total damage.
- Entities: per-entity combat payload.
- DamageStats: encounter and active DPS, hit counts, crit counts, averages.
- SkillMetrics: per-skill total damage, hits, crit rate, averages, skill level.
- SkillSnapshots: per-hit timeline snapshots with timestamp, damage, crit, and kill flags.
- BuffEvents: buff presence and stack-related information.
- Attributes: attack, crit, haste, luck, mastery, and other combat stats recorded on the entity.

This is enough to measure:
- Actual cast frequencies and ordering.
- Real Moonstrike to Thundercut ratios.
- Stormflash and Volt Surge timing patterns.
- Moonblade contribution over time.
- Proc rates and proc clustering.
- Damage distributions, not just averages.
- Fight-to-fight variance by boss, duration, and team composition.

## Highest-Value Analysis To Run First

### 1. Build A Moonstrike Encounter Corpus

Create a batch pipeline that scans the whole database and outputs only Moonstrike-relevant fights.

Filter rules:
- Only keep encounters where at least one entity is a Stormblade Moonstrike player.
- Identify your character separately from other Moonstrikes.
- Keep boss name, duration, wipe/kill state, total raid damage, and encounter id.
- Exclude corrupted, partial, or extremely short encounters unless marked for special handling.

Deliverable:
- A normalized Moonstrike encounter dataset, ideally one JSONL or parquet row per player per encounter.

### 2. Separate You From Other Moonstrikes

This matters because the best comparison set is not random public data, but same-fight players with similar kill windows.

For each Moonstrike entity, derive:
- Character name and UUID.
- Encounter id.
- Boss.
- Duration.
- Party or raid context if recoverable.
- Damage share by skill.
- Core combat stats from entity attributes.

Then group comparisons into:
- Your logs only.
- Other Moonstrikes only.
- Same encounter, same boss, same team.
- Same boss, different groups.

### 3. Measure The Core Moonstrike Model From Logs

Use the encounter corpus to estimate the simulator inputs that currently rely on hand tuning.

Priority measurements:
- Thundercut cast frequency, average spacing, and burst windows.
- Moonstrike cast timing relative to Sigil generation and Stormflash windows.
- Chaos Breaker usage rate and its timing inside Stormflash.
- Moonblade passive hit cadence and uptime loss around refreshes.
- Moonblade Whirl frequency per Moonstrike or Chaos Breaker.
- Storm Scythe trigger rate and whether it is truly one-per-cast, one-per-hit, or conditionally gated.
- Divine Sickle trigger cadence and whether the current threshold model matches logs.
- Thunderstrike proc rate from lucky strikes and whether the current formula is biased high or low.
- Lightning Strike rate during Stormflash and whether it maps to cast events or hit events.
- Buff uptimes for Stormflash, Volt Surge, imagines, and other relevant party buffs.

### 4. Measure Real Damage Distributions

Do not calibrate only to mean hit size.

Capture for each relevant skill:
- Non-crit mean and median.
- Crit mean and median.
- Lucky strike mean and median if separable.
- Hit-count per cast.
- Cast-to-cast variance.
- Distribution by boss and fight duration.

This will expose whether a mismatch comes from:
- Wrong base motion value.
- Wrong multiplier stack order.
- Wrong crit or lucky strike modeling.
- Wrong hit-count assumption.
- Missing buff windows.

## Recommended Refactor In The App

### 1. Move The Sim Engine Out Of The Component

Refactor the current logic in components/dps-simulator.tsx into a reusable engine module.

Suggested split:
- lib/sim/moonstrike-engine.ts: state machine and event simulation.
- lib/sim/moonstrike-constants.ts: defaults and fallback constants.
- lib/sim/moonstrike-calibration.ts: values learned from logs.
- lib/sim/moonstrike-types.ts: encounter model, events, config, outputs.

Why this matters:
- Calibration code should not live in the UI component.
- The engine needs unit tests.
- Comparison mode and future specs can reuse the same simulation interface.

### 2. Replace Flat Constants With Calibration Profiles

The current constants should become versioned calibration data.

Examples:
- Moonblade base hit profile.
- Moonblade whirl profile.
- Storm Scythe proc profile.
- Thunderstrike proc profile.
- Lightning Strike trigger rule.
- Divine Sickle trigger rule.
- Tachi lucky strike extra damage profile.

Use a structure like:
- global defaults
- boss-specific overrides when needed
- patch-version overrides if the game changed
- confidence score per measured value

### 3. Support Two Simulation Modes

Mode A: expected-value fast simulation
- Good for instant UI response.
- Uses averaged proc rates and simplified distributions.

Mode B: event simulation or Monte Carlo
- Simulates hit events and proc rolls across many runs.
- Useful when comparing high-variance mechanics like lucky strike chains, Thunderstrike, or burst-window alignment.

The UI can stay fast by default while exposing a higher-fidelity mode for analysis.

### 4. Add Encounter Context Inputs

The simulator should eventually allow environment presets, not just player stats.

Important context knobs:
- Fight duration.
- Single target vs downtime profile.
- Boss movement or untargetable windows.
- Party buffs present.
- Whether another Moonstrike is in the party.
- Encounter-specific burst alignment presets.

This is how the simulator stops being a target dummy model only.

## Concrete Data Pipeline To Build

### Phase 1: Extraction

Create a new script set in the repo, for example under scripts/moonstrike-analysis/.

Recommended scripts:
- scan_database.py: enumerate encounters, entities, and candidate Moonstrike players.
- export_moonstrike_encounters.py: write normalized encounter rows.
- export_moonstrike_timelines.py: write skill snapshot timelines for selected encounters.
- compare_moonstrikes.py: compare your profile against other Moonstrikes.
- fit_sim_constants.py: estimate calibrated simulator values from the dataset.

Preferred outputs:
- data/moonstrike/encounters.jsonl
- data/moonstrike/players.jsonl
- data/moonstrike/skill_timelines.jsonl
- data/moonstrike/calibration.json
- data/moonstrike/validation-report.md

### Phase 2: Normalization

Normalize raw logs into a stable schema.

One row per player-encounter should include:
- encounter_id
- boss_name
- duration_s
- player_name
- player_uuid
- is_you
- skill totals
- skill hit counts
- crit rates
- average hit sizes
- top buffs
- recorded attack, crit, haste, luck, mastery

One row per hit event should include:
- encounter_id
- player_uuid
- timestamp_s_from_pull
- skill_id
- skill_name
- damage
- is_crit
- is_kill

### Phase 3: Calibration

Fit or estimate the simulator assumptions from the normalized data.

Start with:
- skill damage coefficients
- hit-count per cast
- proc chance estimates
- internal cooldown behavior
- buff uptime distributions
- cast gap distributions
- opener templates and refresh timings

Then write the result to a calibration file consumed by the app.

### Phase 4: Validation

For every sampled encounter, compare:
- simulated total DPS vs real DPS
- simulated skill breakdown vs real skill breakdown
- simulated cast counts vs real cast counts
- simulated buff uptime vs observed uptime
- simulated burst windows vs observed burst windows

Track error metrics like:
- mean absolute percentage error on total DPS
- mean absolute error on casts per skill
- skill-share deviation
- percentile error by encounter duration bucket

## Specific Moonstrike Questions The Data Should Answer

These are the mechanics worth proving from logs instead of guessing:

- Does Storm Scythe trigger once per Thundercut cast, once per hit package, or under another hidden condition?
- Does Lightning Strike scale with every qualifying expertise cast, or are there hidden cooldown or packeting rules?
- How often does real Moonblade cadence drift from the nominal 2.0 second interval?
- Does Stormflash extension from talents materially change uptime in real encounters?
- Is Chaos Breaker being used optimally in real logs, or are players effectively treating it as a lower-priority sigil dump?
- Does your real play produce more Moonstrike casts than the current deterministic opener model assumes?
- How much of your DPS variance comes from crit/lucky strike RNG versus rotational timing mistakes?
- Do other Moonstrikes achieve higher Moonblade or Thunderstrike contribution under the same boss timing, implying a missing mechanic in the sim?

## MVP Scope

To keep this manageable, the first working milestone should not try to perfect the entire sim.

MVP target:
- Batch-export all Moonstrike encounters from the ZDPS database.
- Identify your logs and at least one comparison cohort of other Moonstrikes.
- Generate a validation report for the top 5 to 10 damage sources.
- Replace the most uncertain constants with calibrated values.
- Add a validation panel or dev-only output showing simulated vs observed breakdown for a selected encounter.

If that is done well, the simulator will already be much more trustworthy.

## Longer-Term Upgrades

- Boss-specific presets based on real encounter timing.
- Auto-generated rotation suggestions from your highest-performing logs.
- Separate calibration packs per patch or game version.
- Confidence intervals in the UI instead of a single DPS number.
- A comparison mode that overlays your build against your own historical logs and top observed Moonstrike logs.
- Support for non-Moonstrike specs once the pipeline exists.

## Practical Implementation Order

1. Build batch database extraction for all Moonstrike encounters.
2. Identify your character and other Moonstrikes in the same fights.
3. Export per-skill totals and per-hit timelines.
4. Produce a first validation report comparing observed skill shares and cast counts against the current simulator.
5. Refactor the simulator engine out of the UI component.
6. Introduce calibration.json and swap the most fragile constants to data-driven values.
7. Add encounter presets and optional high-fidelity simulation mode.
8. Iterate until total DPS and skill-share error are acceptably low.

## What I Would Build First In Practice

If the goal is fastest useful progress, start here:

- Write a batch extractor over ZDatabase.db.
- Produce a Moonstrike-only dataset with your logs flagged.
- Compare your best 100 to 300 clean fights against other Moonstrikes on the same bosses.
- Use that to recalibrate Moonblades, Storm Scythe, Thunderstrike, and Lightning Strike first.

Those four areas are the most likely to move the simulator from good-looking to actually reliable.

## Inputs I Still Need From You Later

- Which entity name or UUID is yours in the ZDPS database.
- Whether there are patch boundaries in the 2k+ fights that should be split.
- Which encounters are clean benchmark fights versus messy progression or mechanics-heavy downtime fights.
- Whether you want the final simulator optimized for target dummy accuracy, boss accuracy, or ranking accuracy.
