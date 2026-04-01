"use client"
import { AppProvider, useApp } from "@/lib/app-context"
import { Sidebar } from "@/components/sidebar"
import { StatsPanel } from "@/components/stats-panel"
import { ClassesSection } from "@/components/classes-section"
import { PlannerSection } from "@/components/planner-section"
import { OptimizerSection } from "@/components/optimizer-section"
import { ModulesSection } from "@/components/modules-section"
import { CurvesSection } from "@/components/curves-section"
import { DatabaseSection } from "@/components/database-section"
import { GuideSection } from "@/components/guide-section"
import { TalentsSection } from "@/components/talents-section"
import { ProfileSection } from "@/components/profile-section"
import { DpsSimulator } from "@/components/dps-simulator"
import { GearSetsSection } from "@/components/gear-sets-section"
import { PsychoscopeSection } from "@/components/psychoscope-section"
import { DetailsSection } from "@/components/details-section"
import { useState, useEffect } from "react"

const SECTION_TITLES: Record<string, string> = {
  classes: "Classes",
  profile: "Profile",
  planner: "Gear Planner",
  gear_sets: "Gear Sets",
  optimizer: "Auto-Optimizer",
  modules: "Power Core",
  psychoscope: "Psychoscope",
  curves: "Stat Curves",
  database: "Database",
  guide: "Beginner Guide",
  guide_stormblade: "Moonstrike Guide",
  talents: "Talents",
  dps_simulator: "DPS Simulator",
  details: "Calculation Details",
}

function AppShell() {
  const { section, accentColor, spec, setSection } = useApp()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [mobileStatsOpen, setMobileStatsOpen] = useState(false)

  // Auto-forward to planner if class is already chosen
  useEffect(() => {
    if (section === "classes" && spec) {
      setSection("planner")
    }
  }, [section, spec, setSection])

  // Scale the entire UI so it looks identical on any physical screen width.
  // window.screen.width returns physical pixels regardless of OS DPI scaling.
  // We normalise to a 1920px base so users on any resolution see the same visual density.
  const [uiScale, setUiScale] = useState({ zoom: 1, w: "100vw", h: "100vh" })
  useEffect(() => {
    // Use CSS pixels (innerWidth) so OS DPI scaling is already factored in.
    // BASE is the viewport width the UI was designed for.
    // z > 1 on larger screens (content scales up), z < 1 on smaller (scales down).
    const cssW = window.innerWidth
    const BASE = 1920
    const z = Math.min(Math.max(cssW / BASE, 0.5), 2.0)
    setUiScale({ zoom: z, w: `${(100 / z).toFixed(4)}vw`, h: `${(100 / z).toFixed(4)}vh` })
  }, [])

  return (
    <div
      className="flex bg-background overflow-hidden font-sans scanlines"
      style={{ zoom: uiScale.zoom, width: uiScale.w, height: uiScale.h }}
    >

      {/* ── Mobile nav overlay ── */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="flex-1 bg-[var(--overlay)]" onClick={() => setMobileNavOpen(false)} />
          <div className="w-52 h-full bg-background border-l border-border overflow-y-auto">
            <Sidebar />
          </div>
        </div>
      )}

      {/* ── Mobile stats overlay ── */}
      {mobileStatsOpen && (
        <div className="fixed inset-0 z-50 flex xl:hidden">
          <div className="flex-1 bg-[var(--overlay)]" onClick={() => setMobileStatsOpen(false)} />
          <div className="w-64 h-full bg-background border-l border-border overflow-y-auto">
            <StatsPanel />
          </div>
        </div>
      )}

      {/* ── Left nav sidebar (desktop only) ── */}
      <div className="hidden lg:flex flex-col shrink-0 border-r border-border" style={{ width: 200 }}>
        <Sidebar />
      </div>

      {/* ── Center + right column ── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

        {/* Top bar */}
        <header className="flex items-center gap-3 px-4 lg:px-5 border-b border-border shrink-0 bg-background" style={{ height: 44 }}>
          {/* Mobile hamburger */}
          <button
            className="lg:hidden shrink-0 text-[var(--text-dim)] hover:text-foreground transition-colors"
            onClick={() => setMobileNavOpen(true)}
            aria-label="Open menu"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <rect y="2" width="16" height="1.5" fill="currentColor" />
              <rect y="7" width="16" height="1.5" fill="currentColor" />
              <rect y="12" width="16" height="1.5" fill="currentColor" />
            </svg>
          </button>

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="text-[9px] font-black tracking-[3px] uppercase hidden sm:block shrink-0"
              style={{ color: accentColor }}>
              BPSR
            </span>
            <span className="text-[var(--panel-border)] hidden sm:block">/</span>
            <span className="text-[11px] font-bold uppercase tracking-[1.5px] text-foreground truncate">
              {SECTION_TITLES[section] ?? section}
            </span>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              className="xl:hidden text-[9px] uppercase tracking-[1px] px-2 py-1 border border-[var(--panel-border)] transition-colors"
              style={{ color: mobileStatsOpen ? accentColor : "var(--text-dim)" }}
              onClick={() => setMobileStatsOpen(v => !v)}
            > 
              Stats
            </button>
            <span className="text-[10px] text-[var(--panel-border)] hidden md:block">v0.5.1-alpha</span>
          </div>
        </header>

        {/* Main body row */}
        <div className="flex flex-1 min-h-0 overflow-hidden">

          {/* Scrollable content area */}
          <main className="flex-1 min-w-0 overflow-y-auto">
            <div className="px-4 lg:px-6 xl:px-10 py-5 w-full">
              {section === "classes" && <ClassesSection />}
              {section === "profile" && <ProfileSection />}
              {section === "planner" && <PlannerSection />}
              {section === "gear_sets" && <GearSetsSection />}
              {section === "optimizer" && <OptimizerSection />}
              {section === "modules" && <ModulesSection />}
              {section === "psychoscope" && <PsychoscopeSection />}
              {section === "curves" && <CurvesSection />}
              {section === "database" && <DatabaseSection />}
              {section === "guide" && <GuideSection />}
              {section === "guide_stormblade" && <GuideSection variant="stormblade" />}
              {section === "talents" && <TalentsSection />}
              {section === "dps_simulator" && <DpsSimulator />}
              {section === "details" && <DetailsSection />}
            </div>
          </main>

          {/* Right stats panel (desktop always visible) */}
          <div
            className="hidden xl:flex flex-col shrink-0 border-l border-border overflow-y-auto"
            style={{ width: 248 }}
          >
            <StatsPanel />
          </div>

        </div>
      </div>
    </div>
  )
}

export default function Page() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  )
}
