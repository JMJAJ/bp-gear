"use client"
import { useApp } from "@/lib/app-context"
import type { NavSection, AccentColor } from "@/lib/app-context"
import { 
  Crown, LayoutDashboard, Package, Zap, Puzzle, Brain, Star, 
  User, TrendingUp, Database, BookOpen, BarChart3 
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

const NAV_ITEMS: { id: NavSection; label: string; icon: LucideIcon }[] = [
  { id: "classes", label: "Classes", icon: Crown },
  { id: "planner", label: "Planner", icon: LayoutDashboard },
  { id: "gear_sets", label: "Gear Sets", icon: Package },
  { id: "optimizer", label: "Optimizer", icon: Zap },
  { id: "modules", label: "Modules", icon: Puzzle },
  { id: "psychoscope", label: "Psychoscope", icon: Brain },
  { id: "talents", label: "Talents", icon: Star },
  { id: "profile", label: "Profile", icon: User },
  { id: "curves", label: "Stat Curves", icon: TrendingUp },
  { id: "database", label: "Database", icon: Database },
  { id: "guide", label: "Beginner Guide", icon: BookOpen },
  // { id: "guide_stormblade", label: "Moonstrike Guide", icon: "⚔" },
  { id: "dps_simulator", label: "DPS Simulator", icon: BarChart3 },
]

const ACCENT_OPTIONS: { id: AccentColor; color: string; label: string }[] = [
  { id: "yellow", color: "#e5c229", label: "Gold" },
  { id: "red", color: "#e84545", label: "Red" },
  { id: "blue", color: "#49A8FF", label: "Blue" },
  { id: "green", color: "#4ade80", label: "Green" },
]

export function Sidebar({ mobile }: { mobile?: boolean }) {
  const { section, setSection, accent, setAccent, accentColor } = useApp()

  return (
    <aside
      className="flex flex-col border-r border-[#222] bg-[#000] h-full overflow-y-auto"
      style={{ minWidth: mobile ? undefined : 200 }}
    >
      {/* Logo */}
      <div className="px-5 py-5 border-b border-[#222]">
        <div className="text-sm font-bold tracking-[3px] uppercase text-white">
          BPSR
        </div>
        <div
          className="text-[10px] font-light tracking-[1px] mt-0.5"
          style={{ color: accentColor }}
        >
          GEAR BUILDER v0.4.0-alpha-final
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3">
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            onClick={() => setSection(item.id)}
            className="w-full flex items-center gap-2.5 px-5 py-2.5 text-left text-[11px] font-medium tracking-[0.5px] uppercase transition-all"
            style={{
              color: section === item.id ? "#fff" : "#666",
              borderLeft: `2px solid ${section === item.id ? accentColor : "transparent"}`,
              background: section === item.id ? "#111" : "transparent",
            }}
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </button>
        ))}
      </nav>

      {/* Accent selector */}
      <div className="px-5 py-3 border-t border-[#222]">
        <div className="text-[9px] uppercase tracking-[1px] text-[#444] mb-2">
          Accent Color
        </div>
        <div className="flex gap-2">
          {ACCENT_OPTIONS.map(opt => (
            <button
              key={opt.id}
              title={opt.label}
              onClick={() => setAccent(opt.id)}
              className="w-5 h-5 transition-all"
              style={{
                background: opt.color,
                outline: accent === opt.id ? `2px solid ${opt.color}` : "2px solid transparent",
                outlineOffset: 2,
              }}
            />
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-[#222] text-[10px] text-[#444] leading-5">
        <a href="https://docs.google.com/spreadsheets/d/1Hf-w1o9do50UC9AWNLgY59Wky1Zj4P1es5Pe9TlJRxE/edit" className="text-[#555] hover:text-[#888]">
          Gear Calculator
        </a>{" "}
        by Luxxio
        <br />
        Made by{" "}
        <a href="https://discord.com/users/743448459029381221" className="text-[#555] hover:text-[#888]">
          Jxint
        </a>
        <br />
        <span className="text-[#333]">Data: S2 Exact Math Engine</span>
      </div>
    </aside>
  )
}
