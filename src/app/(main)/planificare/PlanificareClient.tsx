"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"

// ── Types ─────────────────────────────────────────────────────────────────────

type SongItem = {
  id: string
  songId: string
  period: "morning" | "evening"
  position: number
  key: string | null
  title: string
  defaultKey: string | null
}

type PersonItem = { id: string; name: string; position: number }

type ServicePlan = {
  id: string
  date: string
  notesMorning: string | null
  notesEvening: string | null
  songs: SongItem[]
  people: PersonItem[]
}

type SongOption = {
  id: string
  title: string
  firstLine: string | null
  defaultKey: string | null
}

// ── Calendar helpers ──────────────────────────────────────────────────────────

const RO_MONTHS = [
  "Ianuarie","Februarie","Martie","Aprilie","Mai","Iunie",
  "Iulie","August","Septembrie","Octombrie","Noiembrie","Decembrie",
]
const RO_WEEKDAYS = ["Duminică","Luni","Marți","Miercuri","Joi","Vineri","Sâmbătă"]
const RO_DAYS = ["Lu","Ma","Mi","Jo","Vi","Sâ","Du"]

function daysInMonth(y: number, m: number) { return new Date(y, m + 1, 0).getDate() }
function firstWeekday(y: number, m: number) { return (new Date(y, m, 1).getDay() + 6) % 7 }
function toDateStr(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`
}
function todayStr() {
  const t = new Date()
  return toDateStr(t.getFullYear(), t.getMonth(), t.getDate())
}
function formatServiceDate(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number)
  const date = new Date(y, m - 1, d)
  return `${RO_WEEKDAYS[date.getDay()]}, ${d} ${RO_MONTHS[m - 1]} ${y}`
}

// ── Sortable song list (pointer-events based, works on desktop + touch) ──────
// HTML5 DnD has known issues with React. Instead, we use pointer events:
// • onPointerDown on the drag handle → capture pointer, remember dragged id
// • onPointerMove → read DOM positions of sibling items, swap when cursor
//   crosses the midpoint of a neighbour
// • onPointerUp → release capture, persist new order via API
// The list shows the reordered state in real-time during drag.

function SortableSongList({
  songs,
  onRemoveSong,
  onReorder,
}: {
  songs: SongItem[]
  onRemoveSong: (id: string) => void
  onReorder: (newItems: SongItem[]) => void
}) {
  const [order, setOrder] = useState<SongItem[]>(songs)
  const listRef    = useRef<HTMLUListElement>(null)
  const draggingId = useRef<string | null>(null)

  // Keep order in sync when songs change from outside (add/remove)
  useEffect(() => { setOrder(songs) }, [songs])

  function handlePointerDown(e: React.PointerEvent<HTMLSpanElement>, id: string) {
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    draggingId.current = id
  }

  function handlePointerMove(e: React.PointerEvent<HTMLSpanElement>) {
    if (!draggingId.current || !listRef.current) return

    // Read current DOM order and cursor position
    const rows = Array.from(listRef.current.querySelectorAll<HTMLLIElement>("li[data-sid]"))
    const curId    = draggingId.current
    const curIdxInDom = rows.findIndex((r) => r.dataset.sid === curId)
    if (curIdxInDom < 0) return

    for (let i = 0; i < rows.length; i++) {
      if (i === curIdxInDom) continue
      const rect = rows[i].getBoundingClientRect()
      const mid  = rect.top + rect.height / 2

      if (i < curIdxInDom && e.clientY < mid) {
        // Swap with row above
        setOrder((prev) => {
          const next = [...prev]
          const from = next.findIndex((s) => s.id === curId)
          const [removed] = next.splice(from, 1)
          next.splice(i, 0, removed)
          return next
        })
        break
      }
      if (i > curIdxInDom && e.clientY > mid) {
        // Swap with row below
        setOrder((prev) => {
          const next = [...prev]
          const from = next.findIndex((s) => s.id === curId)
          const [removed] = next.splice(from, 1)
          next.splice(i, 0, removed)
          return next
        })
        break
      }
    }
  }

  function handlePointerUp(e: React.PointerEvent<HTMLSpanElement>) {
    if (!draggingId.current) return
    draggingId.current = null
    // Persist the new order
    setOrder((current) => {
      onReorder(current)
      return current
    })
  }

  return (
    <ul ref={listRef} className="divide-y divide-gray-50 dark:divide-gray-700/50">
      {order.map((song) => {
        const isDragging = draggingId.current === song.id
        return (
          <li
            key={song.id}
            data-sid={song.id}
            className={`flex items-center gap-2 px-4 py-2.5 group transition-opacity ${isDragging ? "opacity-40" : ""}`}
          >
            {/* Drag handle — pointer-captured */}
            <span
              onPointerDown={(e) => handlePointerDown(e, song.id)}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              className="cursor-grab active:cursor-grabbing touch-none text-gray-300 dark:text-gray-600 hover:text-gray-500 flex-shrink-0 p-0.5 select-none"
              title="Trage pentru a reordona"
            >
              <DragHandle />
            </span>

            {/* Title → song detail page */}
            <Link
              href={`/song/${song.songId}`}
              className="flex-1 min-w-0 text-sm text-gray-800 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400 truncate transition-colors"
            >
              {song.title}
            </Link>

            {song.key && (
              <span className="text-[11px] font-mono font-semibold text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-md flex-shrink-0 pointer-events-none">
                {song.key}
              </span>
            )}

            <button
              onClick={() => onRemoveSong(song.id)}
              className="p-1 text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 focus:opacity-100 transition flex-shrink-0"
            >
              <XIcon />
            </button>
          </li>
        )
      })}
    </ul>
  )
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  allSongs: SongOption[]
  userNames: string[]
}

// ── Main component ────────────────────────────────────────────────────────────

export function PlanificareClient({ allSongs, userNames }: Props) {
  const now = new Date()
  const [year, setYear]   = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [services, setServices] = useState<Record<string, ServicePlan>>({})
  const [selected, setSelected] = useState<ServicePlan | null>(null)
  const [busy, setBusy] = useState(false)

  // Person input state
  const [personInput, setPersonInput]   = useState("")
  const [showPersonSug, setShowPersonSug] = useState(false)
  const personRef = useRef<HTMLDivElement>(null)

  // ── Load month services ─────────────────────────────────────────────────

  useEffect(() => {
    const key = `${year}-${String(month + 1).padStart(2, "0")}`
    fetch(`/api/services?month=${key}`)
      .then((r) => r.json())
      .then((data: ServicePlan[]) => {
        const map: Record<string, ServicePlan> = {}
        for (const s of data) map[s.date] = s
        setServices(map)
      })
      .catch(() => {})
  }, [year, month])

  // ── Auto-select date from URL param (when returning from song picker) ───

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const date = params.get("date")
    if (date) {
      // Clear the param from URL without navigating
      const url = new URL(window.location.href)
      url.searchParams.delete("date")
      window.history.replaceState({}, "", url.toString())
      handleSelectDate(date)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Close person suggestions on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (personRef.current && !personRef.current.contains(e.target as Node)) {
        setShowPersonSug(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  // ── Select / create service ─────────────────────────────────────────────

  async function handleSelectDate(dateStr: string) {
    if (busy) return
    setBusy(true)
    try {
      const existing = services[dateStr]
      if (existing) {
        setSelected(existing)
        return
      }
      const res  = await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: dateStr }),
      })
      const plan: ServicePlan = await res.json()
      setServices((s) => ({ ...s, [dateStr]: plan }))
      setSelected(plan)
    } finally {
      setBusy(false)
    }
  }

  function updateSelected(plan: ServicePlan) {
    setSelected(plan)
    setServices((s) => ({ ...s, [plan.date]: plan }))
  }

  // ── Song helpers ────────────────────────────────────────────────────────

  async function removeSong(itemId: string) {
    if (!selected) return
    await fetch(`/api/services/${selected.id}/songs/${itemId}`, { method: "DELETE" })
    updateSelected({ ...selected, songs: selected.songs.filter((s) => s.id !== itemId) })
  }

  async function reorderSongs(period: "morning" | "evening", newItems: SongItem[]) {
    if (!selected) return
    const others = selected.songs.filter((s) => s.period !== period)
    updateSelected({ ...selected, songs: [...others, ...newItems] })
    await fetch(`/api/services/${selected.id}/songs/reorder`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: newItems.map((s) => s.id) }),
    })
  }

  // ── People helpers ──────────────────────────────────────────────────────

  async function addPerson(name: string) {
    if (!selected || !name.trim()) return
    const res  = await fetch(`/api/services/${selected.id}/people`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    })
    const person: PersonItem = await res.json()
    updateSelected({ ...selected, people: [...selected.people, person] })
    setPersonInput("")
    setShowPersonSug(false)
  }

  async function removePerson(personId: string) {
    if (!selected) return
    await fetch(`/api/services/${selected.id}/people/${personId}`, { method: "DELETE" })
    updateSelected({ ...selected, people: selected.people.filter((p) => p.id !== personId) })
  }

  async function reorderPeople(newPeople: PersonItem[]) {
    if (!selected) return
    updateSelected({ ...selected, people: newPeople })
    await fetch(`/api/services/${selected.id}/people/reorder`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: newPeople.map((p) => p.id) }),
    })
  }

  // ── Notes (debounced) ───────────────────────────────────────────────────

  const notesTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  function handleNoteChange(planId: string, field: "notesMorning" | "notesEvening", value: string) {
    if (!selected) return
    const updated = { ...selected, [field]: value }
    updateSelected(updated)
    if (notesTimer.current) clearTimeout(notesTimer.current)
    notesTimer.current = setTimeout(() => {
      fetch(`/api/services/${planId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      })
    }, 600)
  }

  // ── Calendar grid ───────────────────────────────────────────────────────

  const today  = todayStr()
  const days   = daysInMonth(year, month)
  const offset = firstWeekday(year, month)
  const cells: (number | null)[] = [
    ...Array(offset).fill(null),
    ...Array.from({ length: days }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  function prevMonth() {
    if (month === 0) { setYear((y) => y - 1); setMonth(11) }
    else setMonth((m) => m - 1)
  }
  function nextMonth() {
    if (month === 11) { setYear((y) => y + 1); setMonth(0) }
    else setMonth((m) => m + 1)
  }

  // Sorted song lists
  const mornings = selected
    ? [...selected.songs.filter((s) => s.period === "morning")].sort((a, b) => a.position - b.position)
    : []
  const evenings = selected
    ? [...selected.songs.filter((s) => s.period === "evening")].sort((a, b) => a.position - b.position)
    : []
  const people = selected
    ? [...selected.people].sort((a, b) => a.position - b.position)
    : []

  const pDrag = useDragList(people, (items) => reorderPeople(items))

  const personSuggestions = personInput.trim()
    ? userNames.filter((n) => n.toLowerCase().includes(personInput.toLowerCase())).slice(0, 6)
    : userNames.slice(0, 6)

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="flex-1 flex flex-col lg:flex-row lg:overflow-hidden">

      {/* ── Calendar panel ─────────────────────────────────────────────── */}
      <div className={`${selected ? "hidden lg:flex" : "flex"} flex-col lg:w-80 xl:w-96 lg:border-r border-gray-200 dark:border-gray-700 lg:overflow-y-auto`}>

        {/* Month header */}
        <div className="flex items-center justify-between px-4 lg:px-5 pt-safe-header lg:pt-6 pb-2">
          <div>
            <p className="text-[10px] font-semibold tracking-widest text-gray-400 dark:text-gray-500 uppercase">Planificare slujbe</p>
            <h1 className="text-xl font-display font-bold text-gray-900 dark:text-gray-100">Calendar</h1>
          </div>
          <div className="flex items-center gap-0.5">
            <button onClick={prevMonth} className="p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 min-w-[120px] text-center">
              {RO_MONTHS[month]} {year}
            </span>
            <button onClick={nextMonth} className="p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Day-of-week headers */}
        <div className="grid grid-cols-7 px-3 lg:px-4 mt-2 mb-1">
          {RO_DAYS.map((d, i) => (
            <div key={d} className={`text-center text-[11px] font-bold py-1 ${i === 6 ? "text-indigo-500 dark:text-indigo-400" : "text-gray-400 dark:text-gray-500"}`}>
              {d}
            </div>
          ))}
        </div>

        {/* Calendar cells */}
        <div className="grid grid-cols-7 px-3 lg:px-4 pb-4 gap-y-1">
          {cells.map((day, i) => {
            if (!day) return <div key={i} />
            const isSun    = i % 7 === 6
            const dateStr  = toDateStr(year, month, day)
            const isToday  = dateStr === today
            const isSel    = selected?.date === dateStr
            const hasDot   = (services[dateStr]?.songs.length ?? 0) + (services[dateStr]?.people.length ?? 0) > 0

            return (
              <button
                key={i}
                onClick={() => isSun ? handleSelectDate(dateStr) : undefined}
                disabled={!isSun || busy}
                className={[
                  "relative flex flex-col items-center justify-center h-10 rounded-xl text-sm transition-all",
                  !isSun ? "cursor-default text-gray-400 dark:text-gray-600" : "",
                  isSun && !isSel ? "font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 cursor-pointer" : "",
                  isSel ? "font-bold bg-indigo-600 dark:bg-indigo-700 text-white shadow-sm" : "",
                  isToday && !isSel ? "ring-2 ring-inset ring-indigo-400 dark:ring-indigo-600" : "",
                ].filter(Boolean).join(" ")}
              >
                {busy && isSun && dateStr === selected?.date ? (
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31 11" />
                  </svg>
                ) : day}
                {isSun && hasDot && (
                  <span className={`absolute bottom-1 w-1 h-1 rounded-full ${isSel ? "bg-white/70" : "bg-indigo-400 dark:bg-indigo-500"}`} />
                )}
              </button>
            )
          })}
        </div>

        {/* Legend */}
        <div className="px-4 pb-4 text-[11px] text-gray-400 dark:text-gray-500 space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-md bg-indigo-50 dark:bg-indigo-950 border border-indigo-200 dark:border-indigo-800 flex-shrink-0" />
            Duminică — selectează pentru a planifica
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 dark:bg-indigo-500 ml-1 flex-shrink-0" />
            Are melodii sau echipă planificate
          </div>
        </div>
      </div>

      {/* ── Service panel ──────────────────────────────────────────────── */}
      {selected ? (
        <div className="flex-1 flex flex-col lg:overflow-y-auto">

          {/* Panel header */}
          <div className="sticky top-0 z-20 bg-[#f0f2f5]/95 dark:bg-gray-950/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 px-4 lg:px-8 pt-safe-bar pb-3 lg:pt-4 flex items-center gap-3">
            <button
              onClick={() => setSelected(null)}
              className="lg:hidden p-1 -ml-1 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M19 12H5M12 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <div>
              <p className="text-[10px] font-semibold tracking-widest text-gray-400 dark:text-gray-500 uppercase">Slujbă</p>
              <h2 className="text-base font-display font-bold text-gray-900 dark:text-gray-100 leading-tight">
                {formatServiceDate(selected.date)}
              </h2>
            </div>
          </div>

          {/* Sections */}
          <div className="px-4 lg:px-8 py-5 space-y-4 pb-32 lg:pb-8">

            {/* ── Dimineață ──────────────────────────────────────────── */}
            <PeriodSection
              title="Dimineață"
              icon="🌅"
              songs={mornings}
              period="morning"
              planId={selected.id}
              serviceDate={selected.date}
              notes={selected.notesMorning ?? ""}
              notesField="notesMorning"
              onRemoveSong={removeSong}
              onReorderSongs={reorderSongs}
              onNoteChange={(field, val) => handleNoteChange(selected.id, field, val)}
            />

            {/* ── Seară ──────────────────────────────────────────────── */}
            <PeriodSection
              title="Seară"
              icon="🌙"
              songs={evenings}
              period="evening"
              planId={selected.id}
              serviceDate={selected.date}
              notes={selected.notesEvening ?? ""}
              notesField="notesEvening"
              onRemoveSong={removeSong}
              onReorderSongs={reorderSongs}
              onNoteChange={(field, val) => handleNoteChange(selected.id, field, val)}
            />

            {/* ── Echipă ─────────────────────────────────────────────── */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
              <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
                <span className="text-base">👥</span>
                <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Echipă</h3>
                {people.length > 0 && (
                  <span className="text-xs text-gray-400 dark:text-gray-500">{people.length} persoane</span>
                )}
              </div>

              {/* People list */}
              {people.length > 0 && (
                <ul className="divide-y divide-gray-50 dark:divide-gray-700/50">
                  {people.map((person, idx) => (
                    <li
                      key={person.id}
                      draggable
                      onDragStart={(e) => pDrag.handleDragStart(e, person.id)}
                      onDragOver={(e) => pDrag.handleDragOver(e)}
                      onDragLeave={(e) => pDrag.handleDragLeave(e)}
                      onDrop={(e) => pDrag.handleDrop(e, person.id)}
                      onDragEnd={pDrag.handleDragEnd}
                      className="flex items-center gap-3 px-4 py-2.5"
                    >
                      <span className="cursor-grab active:cursor-grabbing text-gray-300 dark:text-gray-600 hover:text-gray-400 flex-shrink-0">
                        <DragHandle />
                      </span>
                      <span className="flex-1 text-sm text-gray-800 dark:text-gray-200">{person.name}</span>
                      <button onClick={() => removePerson(person.id)} className="p-1 text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 transition">
                        <XIcon />
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {/* Add person — dropdown opens UPWARD to avoid clipping */}
              <div ref={personRef} className="px-4 py-3 border-t border-gray-50 dark:border-gray-700/50 relative">
                {/* Suggestions open upward */}
                {showPersonSug && personSuggestions.length > 0 && (
                  <div className="absolute bottom-full left-4 right-4 mb-1 z-30 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-lg overflow-hidden">
                    {personSuggestions.map((name) => (
                      <button
                        key={name}
                        onMouseDown={(e) => { e.preventDefault(); addPerson(name) }}
                        className="w-full text-left px-3 py-2.5 text-sm text-gray-800 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-indigo-950 transition"
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <input
                    value={personInput}
                    onChange={(e) => { setPersonInput(e.target.value); setShowPersonSug(true) }}
                    onFocus={() => setShowPersonSug(true)}
                    onKeyDown={(e) => { if (e.key === "Enter") { addPerson(personInput) } else if (e.key === "Escape") setShowPersonSug(false) }}
                    placeholder="Adaugă persoană…"
                    className="flex-1 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100 dark:focus:ring-indigo-900 transition"
                  />
                  <button
                    onClick={() => addPerson(personInput)}
                    disabled={!personInput.trim()}
                    className="px-3 py-2 bg-indigo-700 text-white text-xs font-semibold rounded-xl hover:bg-indigo-600 transition disabled:opacity-40"
                  >
                    Adaugă
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      ) : (
        <div className="hidden lg:flex flex-1 items-center justify-center">
          <div className="text-center max-w-xs">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center mx-auto mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-indigo-400 dark:text-indigo-500">
                <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.8"/>
                <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                <circle cx="8" cy="15" r="1.2" fill="currentColor"/>
                <circle cx="12" cy="15" r="1.2" fill="currentColor"/>
                <circle cx="16" cy="15" r="1.2" fill="currentColor"/>
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Selectează o duminică</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Duminicile sunt evidențiate în calendar</p>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Period Section (Dimineață / Seară) ────────────────────────────────────────

interface PeriodSectionProps {
  title: string
  icon: string
  songs: SongItem[]
  period: "morning" | "evening"
  planId: string
  serviceDate: string
  notes: string
  notesField: "notesMorning" | "notesEvening"
  onRemoveSong: (id: string) => void
  onReorderSongs: (period: "morning" | "evening", newItems: SongItem[]) => void
  onNoteChange: (field: "notesMorning" | "notesEvening", value: string) => void
}

function PeriodSection({
  title, icon, songs, period, planId, serviceDate,
  notes, notesField, onRemoveSong, onReorderSongs, onNoteChange,
}: PeriodSectionProps) {
  const pickerUrl = `/planificare/melodii?planId=${planId}&period=${period}&returnDate=${serviceDate}`

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-base">{icon}</span>
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">{title}</h3>
          {songs.length > 0 && (
            <span className="text-xs text-gray-400 dark:text-gray-500">{songs.length} melodii</span>
          )}
        </div>
        <Link
          href={pickerUrl}
          className="flex items-center gap-1 text-xs font-semibold text-indigo-700 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-200 transition"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
          Adaugă melodie
        </Link>
      </div>

      {/* Sortable song list */}
      {songs.length > 0 ? (
        <SortableSongList
          songs={songs}
          onRemoveSong={onRemoveSong}
          onReorder={(newItems) => onReorderSongs(period, newItems)}
        />
      ) : (
        <div className="px-4 py-4 text-center">
          <p className="text-xs text-gray-300 dark:text-gray-600 italic">Nicio melodie planificată</p>
        </div>
      )}

      {/* Notes */}
      <div className="px-4 py-3 border-t border-gray-50 dark:border-gray-700/50">
        <textarea
          value={notes}
          onChange={(e) => onNoteChange(notesField, e.target.value)}
          placeholder={`Note ${title.toLowerCase()}…`}
          rows={2}
          className="w-full bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100 dark:focus:ring-indigo-900 resize-none transition"
        />
      </div>
    </div>
  )
}

// ── Small reusable icons ──────────────────────────────────────────────────────

function DragHandle() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <circle cx="9"  cy="6"  r="1.5" fill="currentColor"/>
      <circle cx="15" cy="6"  r="1.5" fill="currentColor"/>
      <circle cx="9"  cy="12" r="1.5" fill="currentColor"/>
      <circle cx="15" cy="12" r="1.5" fill="currentColor"/>
      <circle cx="9"  cy="18" r="1.5" fill="currentColor"/>
      <circle cx="15" cy="18" r="1.5" fill="currentColor"/>
    </svg>
  )
}

function XIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}
