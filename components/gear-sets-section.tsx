"use client"
import { useState, useEffect } from "react"
import { useApp, type GearSet } from "@/lib/app-context"
import { getGearSetColorByIndex } from "@/lib/gear-set-colors"
import { DEFAULT_PSYCHOSCOPE_CONFIG } from "@/lib/psychoscope-data"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"

export function GearSetsSection() {
  const {
    gearSets, saveGearSet, deleteGearSet, loadGearSet, applyGearSet, updateGearSet, renameGearSet, importGearSets,
    accentColor,
    spec,
  } = useApp()

  type SharedSetSummary = {
    shareCode: string
    name: string
    spec: string
    uploaderName: string | null
    uploaderId: string | null
    createdAt: string
  }

  const getOrCreateUploaderId = (): string => {
    let id = localStorage.getItem('uploaderId')
    if (!id) {
      id = `user_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
      localStorage.setItem('uploaderId', id)
    }
    return id
  }

  const [uploaderId, setUploaderId] = useState('')

  // Load uploaderId after mount to avoid SSR hydration mismatch
  useEffect(() => {
    setUploaderId(getOrCreateUploaderId())
  }, [])

  const [newSetName, setNewSetName] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [setToDelete, setSetToDelete] = useState<GearSet | null>(null)
  const [shareCodeInput, setShareCodeInput] = useState("")
  const [loadingSharedSet, setLoadingSharedSet] = useState(false)
  const [uploadingSetId, setUploadingSetId] = useState<string | null>(null)
  const [browseDialogOpen, setBrowseDialogOpen] = useState(false)
  const [loadingUploadedSets, setLoadingUploadedSets] = useState(false)
  const [uploadedSets, setUploadedSets] = useState<SharedSetSummary[]>([])
  const [deletingShareCode, setDeletingShareCode] = useState<string | null>(null)
  const [updatingShareCode, setUpdatingShareCode] = useState<string | null>(null)
  const [sharedStatus, setSharedStatus] = useState<{ kind: "ok" | "err"; message: string } | null>(null)
  const [dontShowDeleteWarning, setDontShowDeleteWarning] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('dontShowDeleteWarning') === 'true'
    }
    return false
  })

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

  const handleDeleteClick = (set: GearSet) => {
    if (dontShowDeleteWarning) {
      deleteGearSet(set.id)
    } else {
      setSetToDelete(set)
      setDeleteDialogOpen(true)
    }
  }

  const handleDeleteConfirm = () => {
    if (setToDelete) {
      deleteGearSet(setToDelete.id)
      setSetToDelete(null)
    }
    setDeleteDialogOpen(false)
  }

  const handleDontShowChange = (checked: boolean) => {
    setDontShowDeleteWarning(checked)
    if (typeof window !== 'undefined') {
      localStorage.setItem('dontShowDeleteWarning', checked.toString())
    }
  }

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleDateString() + " " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const normalizeShareCode = (value: string) => value.trim().toUpperCase()

  const fetchUploadedSets = async () => {
    setLoadingUploadedSets(true)
    try {
      const res = await fetch("/api/shared-sets?limit=40")
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.error ?? data.message ?? `HTTP ${res.status}`)
      }
      setUploadedSets(Array.isArray(data.sets) ? data.sets : [])
    } catch (err) {
      setSharedStatus({
        kind: "err",
        message: err instanceof Error ? err.message : "Failed to browse uploaded sets",
      })
    } finally {
      setLoadingUploadedSets(false)
    }
  }

  const openBrowseDialog = async () => {
    setBrowseDialogOpen(true)
    await fetchUploadedSets()
  }

  const handleUploadSet = async (set: GearSet) => {
    setUploadingSetId(set.id)
    setSharedStatus(null)

    try {
      const res = await fetch("/api/shared-sets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gearSet: set, spec, uploaderId }),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.error ?? data.message ?? `HTTP ${res.status}`)
      }

      const shareCode = typeof data.shareCode === "string" ? data.shareCode : ""
      if (!shareCode) {
        throw new Error("Server returned no share code")
      }

      setShareCodeInput(shareCode)

      let copied = false
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        try {
          await navigator.clipboard.writeText(shareCode)
          copied = true
        } catch {
          copied = false
        }
      }

      setSharedStatus({
        kind: "ok",
        message: copied
          ? `Uploaded \"${set.name}\". Share code ${shareCode} copied to clipboard.`
          : `Uploaded \"${set.name}\". Share code: ${shareCode}`,
      })
    } catch (err) {
      setSharedStatus({
        kind: "err",
        message: err instanceof Error ? err.message : "Failed to upload set",
      })
    } finally {
      setUploadingSetId(null)
    }
  }

  const handleLoadSharedSetByCode = async (rawCode: string) => {
    const code = normalizeShareCode(rawCode)
    if (!code) return

    setLoadingSharedSet(true)
    setSharedStatus(null)

    try {
      const res = await fetch(`/api/shared-sets?code=${encodeURIComponent(code)}`)
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.error ?? data.message ?? `HTTP ${res.status}`)
      }

      const remoteSet = data.gearSet as GearSet | undefined
      if (!remoteSet || !Array.isArray(remoteSet.gear)) {
        throw new Error("Invalid shared set payload")
      }

      const localSet: GearSet = {
        id: `set_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        name: remoteSet.name || `Shared ${code}`,
        gear: remoteSet.gear.map(g => ({ ...g })),
        legendaryTypes: [...remoteSet.legendaryTypes],
        legendaryVals: [...remoteSet.legendaryVals],
        imagines: remoteSet.imagines.map(im => ({ ...im })),
        modules: remoteSet.modules.map(m => ({ ...m })),
        selectedTalents: [...remoteSet.selectedTalents],
        talentAspd: remoteSet.talentAspd,
        psychoscopeConfig: remoteSet.psychoscopeConfig ? { ...remoteSet.psychoscopeConfig } : { ...DEFAULT_PSYCHOSCOPE_CONFIG },
        createdAt: new Date().toISOString(),
      }

      importGearSets([localSet])
      applyGearSet(localSet)
      setShareCodeInput(code)

      setSharedStatus({
        kind: "ok",
        message: `Loaded shared set ${code} into your local library and applied it to planner state.`,
      })
    } catch (err) {
      setSharedStatus({
        kind: "err",
        message: err instanceof Error ? err.message : "Failed to load shared set",
      })
    } finally {
      setLoadingSharedSet(false)
    }
  }

  const handleLoadSharedSet = async () => {
    await handleLoadSharedSetByCode(shareCodeInput)
  }

  const handleUpdateSet = (set: GearSet) => {
    updateGearSet(set.id)
    setSharedStatus({
      kind: "ok",
      message: `Updated "${set.name}" with your current planner settings.`,
    })
  }

  const handleDeleteUploadedSet = async (shareCode: string) => {
    setDeletingShareCode(shareCode)
    setSharedStatus(null)

    try {
      const res = await fetch(`/api/shared-sets?code=${encodeURIComponent(shareCode)}&uploaderId=${encodeURIComponent(uploaderId)}`, {
        method: "DELETE",
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.error ?? data.message ?? `HTTP ${res.status}`)
      }

      setUploadedSets(prev => prev.filter(s => s.shareCode !== shareCode))
      setSharedStatus({ kind: "ok", message: `Deleted shared set ${shareCode}.` })
    } catch (err) {
      setSharedStatus({
        kind: "err",
        message: err instanceof Error ? err.message : "Failed to delete shared set",
      })
    } finally {
      setDeletingShareCode(null)
    }
  }

  const handleUpdateUploadedSet = async (shareCode: string, localSet: GearSet) => {
    setUpdatingShareCode(shareCode)
    setSharedStatus(null)

    try {
      const res = await fetch("/api/shared-sets", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shareCode, uploaderId, gearSet: localSet, spec }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.error ?? data.message ?? `HTTP ${res.status}`)
      }

      setUploadedSets(prev => prev.map(s => s.shareCode === shareCode ? { ...s, name: localSet.name } : s))
      setSharedStatus({ kind: "ok", message: `Updated shared set ${shareCode} with "${localSet.name}".` })
    } catch (err) {
      setSharedStatus({
        kind: "err",
        message: err instanceof Error ? err.message : "Failed to update shared set",
      })
    } finally {
      setUpdatingShareCode(null)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="mb-2">
        <div className="flex items-center justify-between gap-3 mb-1">
          <div className="text-2xl font-bold tracking-tight text-white">Gear Sets</div>
          <button
            onClick={openBrowseDialog}
            className="px-3 py-1.5 text-xs font-bold uppercase tracking-[1px] border rounded transition-all"
            style={{ borderColor: accentColor, color: accentColor }}
          >
            Browse Uploaded
          </button>
        </div>
        <div className="text-xs text-[var(--text-dim)] max-w-xl leading-5">
          Save your current gear configuration as a set for easy comparison in the DPS Simulator.
          Select multiple sets to overlay their DPS curves and see which performs better.
        </div>
      </div>

      {/* Save new set */}
      <div className="bg-muted border border-[#333] p-4 rounded-md">
        <h3 className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-3">Save Current Build as Set</h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={newSetName}
            onChange={e => setNewSetName(e.target.value)}
            placeholder="Enter set name..."
            className="flex-1 bg-card border border-[#333] px-3 py-2 text-sm rounded text-white focus:border-[#555] outline-none"
            onKeyDown={e => e.key === "Enter" && handleSave()}
          />
          <button
            onClick={handleSave}
            disabled={!newSetName.trim()}
            className="px-4 py-2 text-xs font-bold uppercase tracking-[1px] border rounded transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ borderColor: accentColor, color: accentColor }}
          >
            Save Set
          </button>
        </div>
      </div>

      {/* Browse uploaded sets dialog */}
      <Dialog open={browseDialogOpen} onOpenChange={setBrowseDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Shared Sets</DialogTitle>
          </DialogHeader>

          {/* Share code input */}
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={shareCodeInput}
              onChange={e => setShareCodeInput(e.target.value)}
              placeholder="Enter share code..."
              className="flex-1 bg-card border border-[#333] px-3 py-2 text-sm rounded text-white focus:border-[#555] outline-none"
              onKeyDown={e => e.key === "Enter" && handleLoadSharedSet()}
            />
            <button
              onClick={handleLoadSharedSet}
              disabled={!normalizeShareCode(shareCodeInput) || loadingSharedSet}
              className="px-4 py-2 text-xs font-bold uppercase tracking-[1px] border rounded transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ borderColor: accentColor, color: accentColor }}
            >
              {loadingSharedSet ? "Loading..." : "Load"}
            </button>
          </div>

          {sharedStatus && (
            <div
              className="mb-4 text-xs"
              style={{ color: sharedStatus.kind === "ok" ? accentColor : "#f87171" }}
            >
              {sharedStatus.message}
            </div>
          )}

          {/* Uploaded sets list */}
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Recently Uploaded</h3>
            <button
              onClick={fetchUploadedSets}
              disabled={loadingUploadedSets}
              className="px-2.5 py-1.5 text-xs font-bold uppercase tracking-[0.5px] border border-[#333] text-[var(--text-mid)] hover:text-white hover:border-[#555] rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loadingUploadedSets ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          {loadingUploadedSets ? (
            <div className="text-xs text-[var(--text-dim)]">Loading uploaded sets...</div>
          ) : uploadedSets.length > 0 ? (
            <div className="divide-y divide-[#1a1a1a] border border-[#2a2a2a] rounded-md overflow-hidden">
              {uploadedSets.map((item) => {
                const isOwner = item.uploaderId && item.uploaderId === uploaderId
                const matchingLocalSet = gearSets.find(s => s.name === item.name)
                return (
                <div key={item.shareCode} className="px-3 py-2.5 flex items-center gap-3 hover:bg-[#0d0d0d] transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-white truncate">{item.name}</div>
                    <div className="text-xs text-[var(--text-dim)] mt-0.5">
                      Code: {item.shareCode} • {item.spec || "Unknown spec"} • {formatDate(item.createdAt)}
                      {isOwner && <span className="ml-2 text-[var(--accent-color)]">(yours)</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {isOwner && (
                      <>
                        <button
                          onClick={() => handleDeleteUploadedSet(item.shareCode)}
                          disabled={deletingShareCode === item.shareCode}
                          className="px-2 py-1.5 text-xs font-bold uppercase tracking-[0.5px] border border-[#333] text-[var(--text-mid)] hover:text-red-400 hover:border-red-500/40 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          {deletingShareCode === item.shareCode ? "Deleting..." : "Delete"}
                        </button>
                        {matchingLocalSet && (
                          <button
                            onClick={() => handleUpdateUploadedSet(item.shareCode, matchingLocalSet)}
                            disabled={updatingShareCode === item.shareCode}
                            className="px-2 py-1.5 text-xs font-bold uppercase tracking-[0.5px] border border-[#333] text-[var(--text-mid)] hover:text-white hover:border-[#555] rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            {updatingShareCode === item.shareCode ? "Updating..." : "Update"}
                          </button>
                        )}
                      </>
                    )}
                    <button
                      onClick={() => handleLoadSharedSetByCode(item.shareCode)}
                      disabled={loadingSharedSet}
                      className="px-2.5 py-1.5 text-xs font-bold uppercase tracking-[0.5px] border border-[#333] text-[var(--text-mid)] hover:text-white hover:border-[#555] rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Load
                    </button>
                  </div>
                </div>
              )})}
            </div>
          ) : (
            <div className="text-xs text-[var(--text-dim)]">No uploaded sets found yet.</div>
          )}
        </DialogContent>
      </Dialog>

      {/* Saved sets list */}
      {gearSets.length > 0 ? (
        <div className="bg-muted border border-[#333] rounded-md overflow-hidden">
          <div className="px-4 py-2 border-b border-border flex items-center justify-between">
            <h3 className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Saved Sets ({gearSets.length})</h3>
            <span className="text-xs text-[var(--text-dim)]">Click to load • Compare in DPS Simulator</span>
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
                  style={{ backgroundColor: getGearSetColorByIndex(idx) }}
                />

                {/* Set info */}
                <div className="flex-1 min-w-0">
                  {editingId === set.id ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        className="flex-1 bg-card border border-[#333] px-2 py-1 text-sm rounded text-white focus:border-[#555] outline-none"
                        autoFocus
                        onKeyDown={e => {
                          if (e.key === "Enter") handleRename(set.id)
                          if (e.key === "Escape") { setEditingId(null); setEditName("") }
                        }}
                      />
                      <button
                        onClick={() => handleRename(set.id)}
                        className="text-xs px-2 py-1 bg-[#222] text-white rounded hover:bg-[#333]"
                      >
                        Save
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white truncate">{set.name}</span>
                      <span className="text-xs text-[var(--text-dim)]">({set.gear.filter(g => g.tier).length} pieces)</span>
                    </div>
                  )}
                  <div className="text-xs text-[var(--text-dim)] mt-0.5">
                    {formatDate(set.createdAt)}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleUploadSet(set)}
                    disabled={uploadingSetId === set.id}
                    className="px-2.5 py-1.5 text-xs font-bold uppercase tracking-[0.5px] border border-[#333] text-[var(--text-mid)] hover:text-white hover:border-[#555] rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {uploadingSetId === set.id ? "Uploading..." : "Upload"}
                  </button>
                  <button
                    onClick={() => loadGearSet(set.id)}
                    className="px-2.5 py-1.5 text-xs font-bold uppercase tracking-[0.5px] border border-[#333] text-[var(--text-mid)] hover:text-white hover:border-[#555] rounded transition-colors"
                  >
                    Load
                  </button>
                  <button
                    onClick={() => handleUpdateSet(set)}
                    className="px-2.5 py-1.5 text-xs font-bold uppercase tracking-[0.5px] border border-[#333] text-[var(--text-mid)] hover:text-white hover:border-[#555] rounded transition-colors"
                  >
                    Update
                  </button>
                  <button
                    onClick={() => { setEditingId(set.id); setEditName(set.name) }}
                    className="px-2.5 py-1.5 text-xs font-bold uppercase tracking-[0.5px] border border-[#333] text-[var(--text-mid)] hover:text-white hover:border-[#555] rounded transition-colors"
                  >
                    Rename
                  </button>
                  <button
                    onClick={() => handleDeleteClick(set)}
                    className="px-2.5 py-1.5 text-xs font-bold uppercase tracking-[0.5px] border border-[#333] text-[var(--text-mid)] hover:text-red-400 hover:border-red-500/40 rounded transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-muted border border-[#333] p-8 rounded-md text-center">
          <p className="text-[var(--text-dim)] text-sm">No gear sets saved yet.</p>
          <p className="text-[var(--text-dim)] text-xs mt-1">Configure your gear in the Planner, then save it here for comparison.</p>
        </div>
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Gear Set</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{setToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex items-center gap-2 py-2">
            <Checkbox
              id="dont-show-warning"
              checked={dontShowDeleteWarning}
              onCheckedChange={handleDontShowChange}
            />
            <label
              htmlFor="dont-show-warning"
              className="text-sm text-[var(--text-mid)] cursor-pointer select-none"
            >
              Don't show this warning again
            </label>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
