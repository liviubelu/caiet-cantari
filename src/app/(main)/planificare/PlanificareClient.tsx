"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"

// ── Types ─────────────────────────────────────────────────────────────────────

export type EventType = "slujba" | "nunta" | "binecuvantare" | "priveghi" | "inmormantare"

type SongItem = {
  id: string; songId: string; period: "morning" | "evening"
  position: number; key: string | null; title: string
  defaultKey: string | null; sung: boolean
}
type PersonItem = { id: string; name: string; position: number }
type ServicePlan = {
  id: string; date: string; eventType: EventType
  notesMorning: string | null; notesEvening: string | null
  songs: SongItem[]; people: PersonItem[]
}
type SongOption = {
  id: string; title: string; firstLine: string | null; defaultKey: string | null
}

// ── Event config ──────────────────────────────────────────────────────────────

const EVENT_CFG: Record<EventType, { label: string; color: string; dot: string; bg: string; dark: string }> = {
  slujba:        { label: "Slujbă",        color: "#6366f1", dot: "bg-indigo-500",  bg: "bg-indigo-50 dark:bg-indigo-950",   dark: "text-indigo-700 dark:text-indigo-300" },
  nunta:         { label: "Nuntă",          color: "#f43f5e", dot: "bg-rose-500",    bg: "bg-rose-50 dark:bg-rose-950",       dark: "text-rose-700 dark:text-rose-300"   },
  binecuvantare: { label: "Binecuvântare",  color: "#a855f7", dot: "bg-purple-500",  bg: "bg-purple-50 dark:bg-purple-950",   dark: "text-purple-700 dark:text-purple-300" },
  priveghi:      { label: "Priveghi",       color: "#10b981", dot: "bg-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950", dark: "text-emerald-700 dark:text-emerald-300" },
  inmormantare:  { label: "Înmormântare",   color: "#6b7280", dot: "bg-gray-400",    bg: "bg-gray-50 dark:bg-gray-800",       dark: "text-gray-600 dark:text-gray-300"  },
}

// ── Calendar helpers ──────────────────────────────────────────────────────────

const RO_MONTHS = ["Ianuarie","Februarie","Martie","Aprilie","Mai","Iunie","Iulie","August","Septembrie","Octombrie","Noiembrie","Decembrie"]
const RO_DAYS_S = ["Lu","Ma","Mi","Jo","Vi","Sâ","Du"]
const RO_WEEKDAYS = ["Duminică","Luni","Marți","Miercuri","Joi","Vineri","Sâmbătă"]

function daysInMonth(y: number, m: number) { return new Date(y, m + 1, 0).getDate() }
function firstWeekday(y: number, m: number) { return (new Date(y, m, 1).getDay() + 6) % 7 }
function toDateStr(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`
}
function todayStr() { const t = new Date(); return toDateStr(t.getFullYear(), t.getMonth(), t.getDate()) }
function isSunday(y: number, m: number, d: number) { return new Date(y, m, d).getDay() === 0 }
function formatDate(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number)
  const date = new Date(y, m - 1, d)
  return `${RO_WEEKDAYS[date.getDay()]}, ${d} ${RO_MONTHS[m - 1]} ${y}`
}
function getDayOfWeek(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number)
  return new Date(y, m - 1, d).getDay()
}
function getDay(dateStr: string) { return parseInt(dateStr.split("-")[2]) }
function getDayAbbr(dateStr: string) {
  const abbr = ["DU","LU","MA","MI","JO","VI","SÂ"]
  return abbr[getDayOfWeek(dateStr)]
}

// ── Key badge (same style as KeyBadge on home page) ──────────────────────────
// Rounded rectangle, gray background, mono font — matches the song list cards.
const KEY_BADGE = "inline-flex items-center justify-center min-w-[28px] h-7 px-1.5 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-[11px] font-semibold font-mono border border-gray-200 dark:border-gray-600 flex-shrink-0"

// ── Song list with up/down reorder buttons ─────────────────────────────────────
// No drag-and-drop — reordering uses explicit up/down buttons, which are far more
// reliable on touch. Each button swaps the row with its neighbour and persists the
// new order via onReorder. A mobile swipe-left still marks a song as sung; the
// reorder / delete / toggle controls carry [data-noswipe] so a tap never starts a
// swipe.

function SongList({
  songs, onRemoveSong, onReorder, onToggleSung,
}: {
  songs: SongItem[]
  onRemoveSong: (id: string) => void
  onReorder: (newItems: SongItem[]) => void
  onToggleSung: (id: string, sung: boolean) => void
}) {
  // Swap a row with its neighbour and persist the new order
  function move(index: number, dir: -1 | 1) {
    const target = index + dir
    if (target < 0 || target >= songs.length) return
    const next = [...songs]
    ;[next[index], next[target]] = [next[target], next[index]]
    onReorder(next)
  }

  // ── Mobile swipe-left to mark as sung ────────────────────────────────────
  // Entire row is the swipe zone ([data-noswipe] controls excluded).
  // setPointerCapture fires the moment we confirm horizontal intent,
  // preventing the browser from stealing the touch for scroll.

  const SWIPE_MAX  = 100
  const TRIGGER_PX = 72

  const swipeRef = useRef<{
    id: string; startX: number; startY: number
    decided: boolean; triggered: boolean
    pointerId: number; el: HTMLElement
  } | null>(null)
  const [swipeDxState, setSwipeDxState] = useState<{ id: string; dx: number } | null>(null)
  const didSwipeRef = useRef(false) // prevent link navigation after swipe

  function onRowPointerDown(e: React.PointerEvent<HTMLLIElement>, song: SongItem) {
    if (e.pointerType === "mouse") return
    // Exclude the reorder / delete / toggle controls so a tap never starts a swipe
    if ((e.target as HTMLElement).closest("[data-noswipe]")) return
    didSwipeRef.current = false
    swipeRef.current = {
      id: song.id, startX: e.clientX, startY: e.clientY,
      decided: false, triggered: false,
      pointerId: e.pointerId, el: e.currentTarget,
    }
  }

  function onRowPointerMove(e: React.PointerEvent<HTMLLIElement>, id: string) {
    const sr = swipeRef.current
    if (!sr || sr.id !== id) return
    const dx = e.clientX - sr.startX
    const dy = e.clientY - sr.startY

    if (!sr.decided) {
      if (Math.abs(dx) < 5 && Math.abs(dy) < 5) return
      if (Math.abs(dy) >= Math.abs(dx)) { swipeRef.current = null; return }
      sr.decided = true
      try { sr.el.setPointerCapture(sr.pointerId) } catch {}
    }

    if (dx < 0) {
      const clamped = Math.max(dx, -SWIPE_MAX)
      sr.triggered = clamped <= -TRIGGER_PX
      setSwipeDxState({ id, dx: clamped })
    } else {
      sr.triggered = false
      setSwipeDxState(null)
    }
  }

  function onRowPointerUp(e: React.PointerEvent<HTMLLIElement>, song: SongItem) {
    const sr = swipeRef.current
    if (!sr || sr.id !== song.id) return
    if (sr.decided && sr.triggered) {
      didSwipeRef.current = true
      onToggleSung(song.id, !song.sung)
    }
    swipeRef.current = null
    setSwipeDxState(null)
  }

  function onRowPointerCancel() { swipeRef.current = null; setSwipeDxState(null) }

  const getSwipeDx = (id: string) => swipeDxState?.id === id ? swipeDxState.dx : 0

  return (
    <ul className="divide-y divide-gray-50 dark:divide-gray-700/50">
      {songs.map((song, idx) => {
        const posNum      = String(idx + 1).padStart(2, "0")
        const dx          = getSwipeDx(song.id)
        const isSwiping   = dx < -4
        const isTriggered = dx <= -TRIGGER_PX
        const isFirst     = idx === 0
        const isLast      = idx === songs.length - 1

        return (
          <li
            key={song.id}
            className={`relative flex items-center gap-2 px-3 py-2.5 group overflow-hidden
              ${song.sung ? "bg-emerald-50/50 dark:bg-emerald-950/20" : ""}
            `}
            style={{
              touchAction: "pan-y",
              transform: isSwiping ? `translateX(${dx}px)` : undefined,
              transition: isSwiping ? "none" : "transform 0.3s cubic-bezier(0.25,1,0.5,1)",
              userSelect: "none",
            }}
            onPointerDown={(e) => onRowPointerDown(e, song)}
            onPointerMove={(e) => onRowPointerMove(e, song.id)}
            onPointerUp={(e) => onRowPointerUp(e, song)}
            onPointerCancel={onRowPointerCancel}
          >
            {/* Green action zone — only visible while swiping */}
            {isSwiping && (
              <div
                className={`absolute right-0 top-0 bottom-0 flex items-center justify-center pointer-events-none ${
                  isTriggered ? "bg-emerald-500" : "bg-emerald-400"
                }`}
                style={{ width: `${Math.abs(dx)}px` }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path d="M20 6L9 17l-5-5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            )}

            {/* Number / checkmark — tap to toggle sung */}
            <button
              data-noswipe
              onClick={() => onToggleSung(song.id, !song.sung)}
              title={song.sung ? "Marchează ca necântată" : "Marchează ca cântată"}
              className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold transition-all
                ${song.sung
                  ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"}
              `}
            >
              {song.sung
                ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                : posNum
              }
            </button>

            {/* Title — blocked if gesture was a swipe, not a tap */}
            <Link
              href={`/song/${song.songId}`}
              onClick={(e) => { if (didSwipeRef.current) { e.preventDefault(); didSwipeRef.current = false } }}
              className={`flex-1 min-w-0 text-sm truncate transition-colors ${
                song.sung
                  ? "text-emerald-700 dark:text-emerald-400 line-through decoration-1"
                  : "text-gray-800 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400"
              }`}
            >
              {song.title}
            </Link>

            {/* Key badge — same style as home page */}
            {song.key && (
              <span className={KEY_BADGE}>
                {song.key}
              </span>
            )}

            {/* Reorder up / down — replaces drag-and-drop */}
            <div data-noswipe className="flex items-center border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden flex-shrink-0 bg-white dark:bg-gray-800">
              <button
                onClick={() => move(idx, -1)}
                disabled={isFirst}
                title="Mută mai sus"
                className="px-2.5 py-1.5 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-25 disabled:hover:bg-transparent transition"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M18 15l-6-6-6 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
              <div className="w-px h-5 bg-gray-200 dark:bg-gray-600" />
              <button
                onClick={() => move(idx, 1)}
                disabled={isLast}
                title="Mută mai jos"
                className="px-2.5 py-1.5 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-25 disabled:hover:bg-transparent transition"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
            </div>

            {/* Delete — always visible (works on touch) */}
            <button
              data-noswipe
              onClick={() => onRemoveSong(song.id)}
              title="Șterge melodia"
              className="p-1 text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 transition flex-shrink-0"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </li>
        )
      })}
    </ul>
  )
}

// ── Period column ─────────────────────────────────────────────────────────────

function PeriodColumn({
  title, emoji, songs, period, planId, serviceDate,
  notes, notesField, onRemoveSong, onReorderSongs, onToggleSung, onNoteChange,
}: {
  title: string; emoji: string; songs: SongItem[]
  period: "morning" | "evening"; planId: string; serviceDate: string
  notes: string; notesField: "notesMorning" | "notesEvening"
  onRemoveSong: (id: string) => void
  onReorderSongs: (period: "morning"|"evening", items: SongItem[]) => void
  onToggleSung: (id: string, sung: boolean) => void
  onNoteChange: (field: "notesMorning"|"notesEvening", value: string) => void
}) {
  const pickerUrl = `/planificare/melodii?planId=${planId}&period=${period}&returnDate=${serviceDate}`
  const sungCount = songs.filter(s => s.sung).length

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <span>{emoji}</span>
          <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{title}</span>
          {songs.length > 0 && (
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {sungCount > 0 ? `${sungCount}/${songs.length}` : songs.length} melodii
            </span>
          )}
        </div>
        <Link href={pickerUrl} className="flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200 transition">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>
          Adaugă
        </Link>
      </div>

      {/* Songs */}
      <div className="flex-1">
        {songs.length > 0
          ? <SongList songs={songs} onRemoveSong={onRemoveSong} onReorder={(items) => onReorderSongs(period, items)} onToggleSung={onToggleSung} />
          : <div className="px-4 py-5 text-center text-xs text-gray-300 dark:text-gray-600 italic">Nicio melodie planificată</div>
        }
      </div>

      {/* Notes — auto-resize so all content is always visible */}
      <div className="px-4 py-3 border-t border-gray-50 dark:border-gray-700/50 flex-shrink-0">
        <textarea
          value={notes}
          onChange={(e) => {
            onNoteChange(notesField, e.target.value)
            // Auto-grow: reset to auto then set to scrollHeight
            e.target.style.height = "auto"
            e.target.style.height = `${e.target.scrollHeight}px`
          }}
          onFocus={(e) => {
            e.target.style.height = "auto"
            e.target.style.height = `${e.target.scrollHeight}px`
          }}
          placeholder={`Notă ${title.toLowerCase()}…`}
          rows={2}
          style={{ overflow: "hidden" }}
          className="w-full bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-sm text-gray-700 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100 dark:focus:ring-indigo-900 resize-none transition"
        />
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props { allSongs: SongOption[]; userNames: string[] }

export function PlanificareClient({ allSongs, userNames }: Props) {
  const now = new Date()
  const [year, setYear]   = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [events, setEvents] = useState<ServicePlan[]>([])
  const [selected, setSelected] = useState<ServicePlan | null>(null)
  const [activeTab, setActiveTab] = useState<"morning"|"evening">("morning")
  const [restoredId, setRestoredId]   = useState<string | null>(null)
  const [isRestoring, setIsRestoring] = useState(false)

  // Create event modal
  const [showCreate, setShowCreate] = useState(false)
  const [newType, setNewType]       = useState<EventType>("slujba")
  const [newDate, setNewDate]       = useState("")
  const [creating, setCreating]     = useState(false)

  // Edit menu
  const [showEditMenu, setShowEditMenu]   = useState(false)
  const [editType, setEditType]           = useState<EventType>("slujba")
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const editMenuRef = useRef<HTMLDivElement>(null)

  // Notes debounce
  const notesTimer = useRef<ReturnType<typeof setTimeout>|null>(null)
  const [notesMorning, setNotesMorning] = useState("")
  const [notesEvening, setNotesEvening] = useState("")

  // People input
  const [personInput, setPersonInput]   = useState("")
  const [showPersonSug, setShowPersonSug] = useState(false)
  const personRef = useRef<HTMLDivElement>(null)

  // ── Load month ──────────────────────────────────────────────────────────
  useEffect(() => {
    const key = `${year}-${String(month + 1).padStart(2, "0")}`
    fetch(`/api/services?month=${key}`).then(r => r.json()).then((data: ServicePlan[]) => {
      setEvents(data.sort((a, b) => a.date.localeCompare(b.date)))
    })
  }, [year, month])

  // Sync selected with refreshed events
  useEffect(() => {
    if (selected) {
      const updated = events.find(e => e.id === selected.id)
      if (updated) setSelected(updated)
    }
  }, [events])

  // Sync notes when selected changes
  useEffect(() => {
    setNotesMorning(selected?.notesMorning ?? "")
    setNotesEvening(selected?.notesEvening ?? "")
  }, [selected?.id])

  // Persist selected event to sessionStorage (for back-navigation restore)
  useEffect(() => {
    if (selected) {
      sessionStorage.setItem("planSelectedId",   selected.id)
      sessionStorage.setItem("planSelectedDate", selected.date)
    }
  }, [selected?.id])

  // When events load, restore the previously-selected event (after back-nav)
  useEffect(() => {
    if (!restoredId || events.length === 0) return
    const byId   = events.find(e => e.id === restoredId)
    const byDate = events.find(e => e.date === restoredId)
    const plan   = byId ?? byDate
    if (plan) { setSelected(plan); setRestoredId(null); setIsRestoring(false) }
  }, [events, restoredId])

  // On mount: restore selected event from sessionStorage (back-navigation)
  // or from URL params (returning from song picker).
  useEffect(() => {
    const params  = new URLSearchParams(window.location.search)
    const urlDate = params.get("date")
    const urlPlan = params.get("planId")

    if (urlPlan || urlDate) {
      // Came back from the song picker page
      const url = new URL(window.location.href)
      url.searchParams.delete("date")
      url.searchParams.delete("planId")
      window.history.replaceState({}, "", url.toString())
      const id = urlPlan ?? null
      const dt = urlDate ?? null
      if (id) {
        const [y, m] = (dt ?? "").split("-").map(Number)
        if (y && m) { setYear(y); setMonth(m - 1) }
        setRestoredId(id)
      } else if (dt) {
        const [y, m] = dt.split("-").map(Number)
        if (y && m) { setYear(y); setMonth(m - 1) }
        setRestoredId(dt) // will be matched by date below
      }
      return
    }

    // Came back via browser Back button → restore from sessionStorage
    const savedId   = sessionStorage.getItem("planSelectedId")
    const savedDate = sessionStorage.getItem("planSelectedDate")
    if (savedId && savedDate) {
      const [y, m] = savedDate.split("-").map(Number)
      if (y && m) { setYear(y); setMonth(m - 1) }
      setRestoredId(savedId)
      setIsRestoring(true)  // show spinner until events load + selection restored
    }
  }, [])

  // Close menus on outside click
  useEffect(() => {
    function h(e: MouseEvent) {
      if (editMenuRef.current && !editMenuRef.current.contains(e.target as Node)) setShowEditMenu(false)
      if (personRef.current && !personRef.current.contains(e.target as Node)) setShowPersonSug(false)
    }
    document.addEventListener("mousedown", h)
    return () => document.removeEventListener("mousedown", h)
  }, [])

  // ── Helpers ─────────────────────────────────────────────────────────────
  function updateSelected(plan: ServicePlan) {
    setSelected(plan)
    setEvents(ev => ev.map(e => e.id === plan.id ? plan : e))
  }

  async function createEvent() {
    if (!newDate || creating) return
    if (newType === "slujba" && getDayOfWeek(newDate) !== 0) {
      alert("Slujba duminicală poate fi adăugată doar duminica.")
      return
    }
    setCreating(true)
    const res = await fetch("/api/services", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: newDate, eventType: newType }),
    })
    const plan: ServicePlan = await res.json()
    setEvents(ev => [...ev, plan].sort((a, b) => a.date.localeCompare(b.date)))
    setSelected(plan)
    setShowCreate(false); setCreating(false)
    // auto-open the right month
    const [y, m] = newDate.split("-").map(Number)
    setYear(y); setMonth(m - 1)
  }

  async function deleteEvent() {
    if (!selected) return
    await fetch(`/api/services/${selected.id}`, { method: "DELETE" })
    setEvents(ev => ev.filter(e => e.id !== selected.id))
    setSelected(null)
    setShowEditMenu(false); setShowDeleteConfirm(false)
  }

  async function updateEventType(type: EventType) {
    if (!selected) return
    await fetch(`/api/services/${selected.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventType: type }),
    })
    updateSelected({ ...selected, eventType: type })
    setShowEditMenu(false)
  }

  function handleNoteChange(field: "notesMorning"|"notesEvening", value: string) {
    if (!selected) return
    if (field === "notesMorning") setNotesMorning(value)
    else setNotesEvening(value)
    updateSelected({ ...selected, [field]: value })
    if (notesTimer.current) clearTimeout(notesTimer.current)
    notesTimer.current = setTimeout(() => {
      fetch(`/api/services/${selected.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      })
    }, 600)
  }

  async function removeSong(itemId: string) {
    if (!selected) return
    await fetch(`/api/services/${selected.id}/songs/${itemId}`, { method: "DELETE" })
    updateSelected({ ...selected, songs: selected.songs.filter(s => s.id !== itemId) })
  }

  async function reorderSongs(period: "morning"|"evening", newItems: SongItem[]) {
    if (!selected) return
    // Re-stamp positions so the optimistic re-sort (by position) keeps the new order
    const reordered = newItems.map((s, i) => ({ ...s, position: i }))
    const others = selected.songs.filter(s => s.period !== period)
    updateSelected({ ...selected, songs: [...others, ...reordered] })
    await fetch(`/api/services/${selected.id}/songs/reorder`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: reordered.map(s => s.id) }),
    })
  }

  async function toggleSung(itemId: string, sung: boolean) {
    if (!selected) return
    updateSelected({ ...selected, songs: selected.songs.map(s => s.id === itemId ? { ...s, sung } : s) })
    await fetch(`/api/services/${selected.id}/songs/${itemId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sung }),
    })
  }

  async function addPerson(name: string) {
    if (!selected || !name.trim()) return
    const res = await fetch(`/api/services/${selected.id}/people`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    })
    const person = await res.json()
    updateSelected({ ...selected, people: [...selected.people, person] })
    setPersonInput(""); setShowPersonSug(false)
  }

  async function removePerson(personId: string) {
    if (!selected) return
    await fetch(`/api/services/${selected.id}/people/${personId}`, { method: "DELETE" })
    updateSelected({ ...selected, people: selected.people.filter(p => p.id !== personId) })
  }

  // ── Calendar grid ───────────────────────────────────────────────────────
  const today  = todayStr()
  const days   = daysInMonth(year, month)
  const offset = firstWeekday(year, month)
  const cells: (number|null)[] = [...Array(offset).fill(null), ...Array.from({length: days}, (_, i) => i + 1)]
  while (cells.length % 7 !== 0) cells.push(null)

  // Events by date for dot indicators
  const eventsByDate: Record<string, EventType[]> = {}
  for (const e of events) {
    if (!eventsByDate[e.date]) eventsByDate[e.date] = []
    eventsByDate[e.date].push(e.eventType)
  }

  const mornings = selected ? [...selected.songs.filter(s => s.period === "morning")].sort((a,b) => a.position - b.position) : []
  const evenings = selected ? [...selected.songs.filter(s => s.period === "evening")].sort((a,b) => a.position - b.position) : []
  const people   = selected ? [...selected.people].sort((a,b) => a.position - b.position) : []
  const personSuggestions = personInput.trim()
    ? userNames.filter(n => n.toLowerCase().includes(personInput.toLowerCase())).slice(0, 5)
    : userNames.slice(0, 5)

  const selectedCfg = selected ? EVENT_CFG[selected.eventType] : null
  const teamInitials = (name: string) => name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()
  const avatarColors = ["bg-indigo-500","bg-rose-500","bg-emerald-500","bg-amber-500","bg-purple-500","bg-teal-500"]

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="flex-1 flex flex-col lg:flex-row lg:overflow-hidden">

      {/* ── LEFT PANEL ─────────────────────────────────────────────────── */}
      <div className={`${(selected || isRestoring) ? "hidden lg:flex" : "flex"} flex-col lg:w-72 xl:w-80 lg:border-r border-gray-200 dark:border-gray-700 lg:overflow-y-auto flex-shrink-0`}>

        {/* Month nav + create button */}
        <div className="px-4 lg:px-5 pt-safe-header lg:pt-5 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <button onClick={() => { if (month===0){setYear(y=>y-1);setMonth(11)}else setMonth(m=>m-1) }} className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>
            </button>
            <span className="text-sm font-bold text-gray-800 dark:text-gray-200 min-w-[110px] text-center">{RO_MONTHS[month]} {year}</span>
            <button onClick={() => { if (month===11){setYear(y=>y+1);setMonth(0)}else setMonth(m=>m+1) }} className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>
            </button>
          </div>
          <button onClick={() => { setShowCreate(true); setNewDate(""); setNewType("slujba") }}
            className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>
            Eveniment
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 px-3 mb-0.5">
          {RO_DAYS_S.map((d, i) => (
            <div key={d} className={`text-center text-[10px] font-bold py-1 ${i===6?"text-indigo-500 dark:text-indigo-400":"text-gray-400 dark:text-gray-500"}`}>{d}</div>
          ))}
        </div>

        {/* Calendar cells — gap-1 so adjacent cells (e.g. today + selected) don't merge visually */}
        <div className="grid grid-cols-7 px-3 gap-1">
          {cells.map((day, i) => {
            if (!day) return <div key={i}/>
            const dateStr   = toDateStr(year, month, day)
            const isToday   = dateStr === today
            const types     = eventsByDate[dateStr] ?? []
            const hasEvent  = types.length > 0
            const isSel     = selected?.date === dateStr
            const isSun     = i % 7 === 6

            return (
              <button key={i} onClick={() => {
                const evs = events.filter(e => e.date === dateStr)
                if (evs.length === 1) setSelected(evs[0])
                else if (evs.length > 1) setSelected(evs[0]) // show first
              }}
                className={`relative flex flex-col items-center justify-center h-9 rounded-lg text-sm transition-all
                  ${isSel ? "bg-indigo-600 dark:bg-indigo-700 text-white font-bold shadow-sm" : ""}
                  ${!isSel && isSun ? "text-indigo-600 dark:text-indigo-400 font-semibold" : ""}
                  ${!isSel && !isSun ? "text-gray-600 dark:text-gray-400" : ""}
                  ${!isSel && hasEvent ? "bg-gray-100 dark:bg-gray-800 font-semibold hover:bg-gray-200 dark:hover:bg-gray-700" : ""}
                  ${!isSel && !hasEvent ? "hover:bg-gray-100 dark:hover:bg-gray-800" : ""}
                  ${isToday && !isSel ? "ring-2 ring-inset ring-indigo-400 dark:ring-indigo-600" : ""}
                `}
              >
                {day}
                {/* Colored dots for event types */}
                {types.length > 0 && (
                  <div className="absolute bottom-0.5 flex gap-0.5 justify-center">
                    {types.slice(0,3).map((t, ti) => (
                      <span key={ti} className={`w-1 h-1 rounded-full ${isSel ? "bg-white/70" : EVENT_CFG[t].dot}`}/>
                    ))}
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* Legend */}
        <div className="px-4 py-3 flex flex-wrap gap-x-3 gap-y-1">
          {(Object.entries(EVENT_CFG) as [EventType, typeof EVENT_CFG[EventType]][]).map(([key, cfg]) => (
            <div key={key} className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${cfg.dot}`}/>
              <span className="text-[10px] text-gray-500 dark:text-gray-400">{cfg.label}</span>
            </div>
          ))}
        </div>

        {/* Events list for month */}
        {events.length > 0 && (
          <div className="px-3 pb-4">
            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-2 mb-2">
              Evenimente · {RO_MONTHS[month]}
            </p>
            <div className="space-y-1">
              {events.map(ev => {
                const cfg = EVENT_CFG[ev.eventType]
                const day = getDay(ev.date)
                const abbr = getDayAbbr(ev.date)
                const isActive = selected?.id === ev.id
                return (
                  <button key={ev.id} onClick={() => setSelected(ev)}
                    className={`w-full text-left flex items-center gap-2.5 px-2 py-2 rounded-xl transition-all ${isActive ? "bg-indigo-50 dark:bg-indigo-950" : "hover:bg-gray-100 dark:hover:bg-gray-800"}`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center flex-shrink-0 ${cfg.bg}`}>
                      <span className={`text-xs font-bold leading-none ${cfg.dark}`}>{day}</span>
                      <span className={`text-[9px] font-semibold ${cfg.dark}`}>{abbr}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold truncate ${isActive ? "text-indigo-700 dark:text-indigo-300" : "text-gray-900 dark:text-gray-100"}`}>
                        {cfg.label}
                      </p>
                      <p className={`text-xs ${cfg.dark}`}>
                        {ev.songs.length} melodii
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── RIGHT PANEL ────────────────────────────────────────────────── */}
      {selected && selectedCfg ? (
        <div className="flex-1 flex flex-col lg:overflow-hidden">

          {/* Event header */}
          <div className="flex-shrink-0 sticky top-0 z-20 bg-[#f0f2f5] dark:bg-gray-950 border-b border-gray-200 dark:border-gray-700 px-4 lg:px-6 pt-safe-bar pb-3 lg:pt-4">
            <div className="flex items-center gap-3">
              {/* Back (mobile) */}
              <button onClick={() => setSelected(null)} className="lg:hidden p-1 -ml-1 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M12 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              </button>
              {/* Type badge */}
              <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${selectedCfg.bg} ${selectedCfg.dark}`}>
                {selectedCfg.label}
              </span>
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-display font-bold text-gray-900 dark:text-gray-100 leading-tight">
                  {selectedCfg.label}
                </h2>
                <p className="text-xs text-gray-400 dark:text-gray-500">{formatDate(selected.date)}</p>
              </div>
              {/* Team avatars */}
              <div className="flex -space-x-1.5 flex-shrink-0">
                {people.slice(0, 4).map((p, i) => (
                  <div key={p.id} title={p.name}
                    className={`w-7 h-7 rounded-full ${avatarColors[i % avatarColors.length]} flex items-center justify-center text-[10px] font-bold text-white border-2 border-white dark:border-gray-900`}
                  >
                    {teamInitials(p.name)}
                  </div>
                ))}
                {people.length > 4 && (
                  <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-[10px] font-bold text-gray-600 dark:text-gray-300 border-2 border-white dark:border-gray-900">
                    +{people.length - 4}
                  </div>
                )}
              </div>
              {/* "..." edit menu */}
              <div ref={editMenuRef} className="relative flex-shrink-0">
                <button onClick={() => { setShowEditMenu(v => !v); setEditType(selected.eventType); setShowDeleteConfirm(false) }}
                  className="p-1.5 rounded-lg text-gray-400 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="5" cy="12" r="1.5" fill="currentColor"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/><circle cx="19" cy="12" r="1.5" fill="currentColor"/></svg>
                </button>
                {showEditMenu && (
                  <div className="absolute right-0 top-full mt-1 z-30 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-lg p-3 min-w-[200px]">
                    {!showDeleteConfirm ? (
                      <>
                        <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Tip eveniment</p>
                        <div className="space-y-1">
                          {(Object.entries(EVENT_CFG) as [EventType, typeof EVENT_CFG[EventType]][]).map(([key, cfg]) => (
                            <button key={key} onClick={() => updateEventType(key)}
                              className={`w-full text-left flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition ${selected.eventType === key ? "bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 font-semibold" : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"}`}
                            >
                              <span className={`w-2 h-2 rounded-full ${cfg.dot}`}/>
                              {cfg.label}
                            </button>
                          ))}
                        </div>
                        <div className="border-t border-gray-100 dark:border-gray-700 mt-2 pt-2">
                          <button onClick={() => setShowDeleteConfirm(true)}
                            className="w-full text-left px-2 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg transition"
                          >
                            Șterge evenimentul
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-sm text-gray-800 dark:text-gray-200 font-medium">Confirmi ștergerea?</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Toate melodiile și persoanele vor fi șterse.</p>
                        <div className="flex gap-2">
                          <button onClick={deleteEvent} className="flex-1 bg-red-600 text-white text-xs font-semibold py-2 rounded-lg hover:bg-red-700 transition">Șterge</button>
                          <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-semibold py-2 rounded-lg hover:bg-gray-200 transition">Anulează</button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Content area */}
          <div className="flex-1 lg:overflow-y-auto px-4 lg:px-6 py-4 space-y-4 pb-24 lg:pb-6">

            {/* Mobile tabs */}
            <div className="flex lg:hidden gap-2 mb-2">
              {(["morning","evening"] as const).map(tab => {
                const cnt = tab === "morning" ? mornings.length : evenings.length
                return (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${activeTab === tab ? "bg-indigo-600 text-white shadow-sm" : "bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-600"}`}
                  >
                    {tab === "morning" ? "☀️" : "🌙"} {tab === "morning" ? "Dimineață" : "Seară"} {cnt > 0 && <span className="ml-1 opacity-70">{cnt}</span>}
                  </button>
                )
              })}
            </div>

            {/* Desktop: two columns */}
            <div className="hidden lg:grid lg:grid-cols-2 gap-4">
              <PeriodColumn title="Dimineață" emoji="☀️" songs={mornings} period="morning" planId={selected.id} serviceDate={selected.date} notes={notesMorning} notesField="notesMorning" onRemoveSong={removeSong} onReorderSongs={reorderSongs} onToggleSung={toggleSung} onNoteChange={handleNoteChange}/>
              <PeriodColumn title="Seară" emoji="🌙" songs={evenings} period="evening" planId={selected.id} serviceDate={selected.date} notes={notesEvening} notesField="notesEvening" onRemoveSong={removeSong} onReorderSongs={reorderSongs} onToggleSung={toggleSung} onNoteChange={handleNoteChange}/>
            </div>

            {/* Mobile: single column with tabs */}
            <div className="lg:hidden">
              {activeTab === "morning"
                ? <PeriodColumn title="Dimineață" emoji="☀️" songs={mornings} period="morning" planId={selected.id} serviceDate={selected.date} notes={notesMorning} notesField="notesMorning" onRemoveSong={removeSong} onReorderSongs={reorderSongs} onToggleSung={toggleSung} onNoteChange={handleNoteChange}/>
                : <PeriodColumn title="Seară" emoji="🌙" songs={evenings} period="evening" planId={selected.id} serviceDate={selected.date} notes={notesEvening} notesField="notesEvening" onRemoveSong={removeSong} onReorderSongs={reorderSongs} onToggleSung={toggleSung} onNoteChange={handleNoteChange}/>
              }
            </div>

            {/* Team */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
              <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
                <span>👥</span>
                <span className="text-sm font-bold text-gray-900 dark:text-gray-100">Echipă</span>
                {people.length > 0 && <span className="text-xs text-gray-400 dark:text-gray-500">{people.length} persoane</span>}
              </div>
              {people.length > 0 && (
                <div className="px-4 py-3 flex flex-wrap gap-2">
                  {people.map((p, i) => (
                    <div key={p.id} className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-full px-3 py-1">
                      <div className={`w-5 h-5 rounded-full ${avatarColors[i % avatarColors.length]} flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0`}>
                        {teamInitials(p.name)}
                      </div>
                      <span className="text-xs font-medium text-gray-800 dark:text-gray-200">{p.name}</span>
                      <button onClick={() => removePerson(p.id)} className="text-gray-300 dark:text-gray-600 hover:text-red-500 transition ml-0.5">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {/* Add person */}
              <div ref={personRef} className="px-4 py-3 border-t border-gray-50 dark:border-gray-700/50 relative">
                {showPersonSug && personSuggestions.length > 0 && (
                  <div className="absolute bottom-full left-4 right-4 mb-1 z-30 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-lg overflow-hidden">
                    {personSuggestions.map(name => (
                      <button key={name} onMouseDown={e => { e.preventDefault(); addPerson(name) }}
                        className="w-full text-left px-3 py-2.5 text-sm text-gray-800 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-indigo-950 transition"
                      >{name}</button>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <input value={personInput}
                    onChange={e => { setPersonInput(e.target.value); setShowPersonSug(true) }}
                    onFocus={() => setShowPersonSug(true)}
                    onKeyDown={e => { if (e.key === "Enter") addPerson(personInput); else if (e.key === "Escape") setShowPersonSug(false) }}
                    placeholder="Adaugă persoană…"
                    className="flex-1 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100 dark:focus:ring-indigo-900 transition"
                  />
                  <button onClick={() => addPerson(personInput)} disabled={!personInput.trim()}
                    className="px-3 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-700 transition disabled:opacity-40"
                  >Adaugă</button>
                </div>
              </div>
            </div>

          </div>
        </div>
      ) : isRestoring ? (
        /* Loading spinner while restoring selection after Back navigation */
        <div className="hidden lg:flex flex-1 items-center justify-center">
          <div className="text-center">
            <svg className="animate-spin w-8 h-8 text-indigo-400 dark:text-indigo-500 mx-auto mb-3" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31 11" strokeLinecap="round"/>
            </svg>
            <p className="text-sm text-gray-400 dark:text-gray-500">Se încarcă…</p>
          </div>
        </div>
      ) : (
        /* Empty state */
        <div className="hidden lg:flex flex-1 items-center justify-center">
          <div className="text-center max-w-xs">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center mx-auto mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-indigo-400 dark:text-indigo-500">
                <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.8"/>
                <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                <circle cx="8" cy="16" r="1.2" fill="currentColor"/>
                <circle cx="12" cy="16" r="1.2" fill="currentColor"/>
                <circle cx="16" cy="16" r="1.2" fill="currentColor"/>
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Selectează un eveniment</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">sau creează unul nou cu butonul „+ Eveniment"</p>
          </div>
        </div>
      )}

      {/* ── Create event modal ──────────────────────────────────────────── */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setShowCreate(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-sm p-5" onClick={e => e.stopPropagation()}>
            <h3 className="text-base font-display font-bold text-gray-900 dark:text-gray-100 mb-4">Adaugă eveniment</h3>

            {/* Type selection */}
            <div className="space-y-1.5 mb-4">
              {(Object.entries(EVENT_CFG) as [EventType, typeof EVENT_CFG[EventType]][]).map(([key, cfg]) => (
                <button key={key} onClick={() => setNewType(key)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border-2 transition ${newType === key ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950" : "border-transparent bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600"}`}
                >
                  <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${cfg.dot}`}/>
                  <span className={`text-sm font-semibold ${newType === key ? "text-indigo-700 dark:text-indigo-300" : "text-gray-700 dark:text-gray-200"}`}>{cfg.label}</span>
                  {key === "slujba" && <span className="ml-auto text-[10px] text-gray-400 dark:text-gray-500">Doar duminica</span>}
                </button>
              ))}
            </div>

            {/* Date */}
            <div className="mb-4">
              <label className="block text-[11px] font-semibold tracking-widest text-gray-500 dark:text-gray-400 uppercase mb-1.5">Data</label>
              <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2.5 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:border-indigo-400 transition"
              />
            </div>

            <div className="flex gap-2">
              <button onClick={() => setShowCreate(false)} className="flex-1 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-semibold hover:bg-gray-200 transition">Anulează</button>
              <button onClick={createEvent} disabled={!newDate || creating}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
              >{creating ? "Se creează…" : "Creează"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
