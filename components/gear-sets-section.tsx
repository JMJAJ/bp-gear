"use client"
import { useState } from "react"
import { useApp, type GearSet } from "@/lib/app-context"

const SET_COLORS = [
  "#f59e0b", "#ef4444", "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16",
]

export function GearSetsSection() {
  const {
    gearSets, saveGearSet, deleteGearSet, loadGearSet, renameGearSet,
    accentColor,
  } = useApp()

  const [newSetName, setNewSetName] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")

  const handleSave = () => {
    if (!newSetName.trim()) return
    saveGearSet(newSetName.trim())
    setNewSetName("")
  }

  const handleRename = (id: string) => {
    if (!editName.trim()) return
    renameGearSet(id, editName.trim())
    setEditingId(null)
    setEditName("")
  }

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleDateString() + " " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="mb-2">
        <div className="text-2xl font-bold tracking-tight text-white mb-1">Gear Sets</div>
        <div className="text-[11px] text-[#555] max-w-xl leading-5">
          Save your current gear configuration as a set for easy comparison in the DPS Simulator.
          Select multiple sets to overlay their DPS curves and see which performs better.
        </div>
      </div>

      {/* Save new set */}
      <div className="bg-[#111] border border-[#333] p-4 rounded-md">
        <h3 className="text-[10px] text-[#666] uppercase tracking-wider font-bold mb-3">Save Current Build as Set</h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={newSetName}
            onChange={e => setNewSetName(e.target.value)}
            placeholder="Enter set name..."
            className="flex-1 bg-[#0a0a0a] border border-[#333] px-3 py-2 text-sm rounded text-white focus:border-[#555] outline-none"
            onKeyDown={e => e.key === "Enter" && handleSave()}
          />
          <button
            onClick={handleSave}
            disabled={!newSetName.trim()}
            className="px-4 py-2 text-[11px] font-bold uppercase tracking-[1px] border rounded transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ borderColor: accentColor, color: accentColor }}
          >
            Save Set
          </button>
        </div>
      </div>

      {/* Saved sets list */}
      {gearSets.length > 0 ? (
        <div className="bg-[#111] border border-[#333] rounded-md overflow-hidden">
          <div className="px-4 py-2 border-b border-[#222] flex items-center justify-between">
            <h3 className="text-[10px] text-[#666] uppercase tracking-wider font-bold">Saved Sets ({gearSets.length})</h3>
            <span className="text-[9px] text-[#444]">Click to load • Compare in DPS Simulator</span>
          </div>
          <div className="divide-y divide-[#1a1a1a]">
            {gearSets.map((set, idx) => (
              <div
                key={set.id}
                className="group flex items-center gap-3 px-4 py-3 hover:bg-[#0d0d0d] transition-colors"
              >
                {/* Color indicator */}
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: SET_COLORS[idx % SET_COLORS.length] }}
                />

                {/* Set info */}
                <div className="flex-1 min-w-0">
                  {editingId === set.id ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        className="flex-1 bg-[#0a0a0a] border border-[#333] px-2 py-1 text-sm rounded text-white focus:border-[#555] outline-none"
                        autoFocus
                        onKeyDown={e => {
                          if (e.key === "Enter") handleRename(set.id)
                          if (e.key === "Escape") { setEditingId(null); setEditName("") }
                        }}
                      />
                      <button
                        onClick={() => handleRename(set.id)}
                        className="text-[10px] px-2 py-1 bg-[#222] text-white rounded hover:bg-[#333]"
                      >
                        Save
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white truncate">{set.name}</span>
                      <span className="text-[9px] text-[#444]">({set.gear.filter(g => g.tier).length} pieces)</span>
                    </div>
                  )}
                  <div className="text-[10px] text-[#555] mt-0.5">
                    {formatDate(set.createdAt)}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => loadGearSet(set.id)}
                    className="px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-[0.5px] border border-[#333] text-[#888] hover:text-white hover:border-[#555] rounded transition-colors"
                  >
                    Load
                  </button>
                  <button
                    onClick={() => { setEditingId(set.id); setEditName(set.name) }}
                    className="px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-[0.5px] border border-[#333] text-[#888] hover:text-white hover:border-[#555] rounded transition-colors"
                  >
                    Rename
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete "${set.name}"?`)) deleteGearSet(set.id)
                    }}
                    className="px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-[0.5px] border border-[#333] text-[#888] hover:text-red-400 hover:border-red-500/40 rounded transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-[#111] border border-[#333] p-8 rounded-md text-center">
          <p className="text-[#555] text-sm">No gear sets saved yet.</p>
          <p className="text-[#444] text-xs mt-1">Configure your gear in the Planner, then save it here for comparison.</p>
        </div>
      )}
    </div>
  )
}
