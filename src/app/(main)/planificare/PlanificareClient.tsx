"use client"

import { useState, useEffect, useRef, useCallback } from "react"

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

// ── Romanian calendar helpers ─────────────────────────────────────────────────

const RO_MONTHS = [
  "Ianuarie","Februarie","Martie","Aprilie","Mai","Iunie",
  "Iulie","August","Septembrie","Octombrie","Noiembrie","Decembrie",
]
const RO_DAYS = ["Lu","Ma","Mi","Jo","Vi","Sâ","Du"]

function daysInMonth(y: number, m: number) {
  return new Date(y, m + 1, 0).getDate()
}
// 0=Mon, …, 6=Sun (European)
function firstWeekday(y: number, m: number) {
  return (new Date(y, m, 1).getDay() + 6) % 7
}
function toDateStr(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`
}
function todayStr() {
  const t = new Date()
  return toDateStr(t.getFullYear(), t.getMonth(), t.getDate())
}

// ── Draggable list hook ───────────────────────────────────────────────────────

function useDragSort<T extends { id: string }>(
  items: T[],
  onReorder: (newItems: T[]) => void
) {
  const dragging = useRef<string | null>(null)
  const [overIdx, setOverIdx] = useState<number | null>(null)

  function onDragStart(id: string) { dragging.current = id }
  function onDragOver(e: React.DragEvent, idx: number) {
    e.preventDefault()
    setOverIdx(idx)
  }
  function onDrop(idx: number) {
    if (!dragging.current) return
    const from = items.findIndex((x) => x.id === dragging.current)
    if (from === idx) { dragging.current = null; setOverIdx(null); return }
    const next = [...items]
    const [removed] = next.splice(from, 1)
    next.splice(idx, 0, removed)
    onReorder(next)
    dragging.current = null
    setOverIdx(null)
  }
  function onDragEnd() { dragging.current = null; setOverIdx(null) }

  return { onDragStart, onDragOver, onDrop, onDragEnd, overIdx }
}

// ── Debounce util ─────────────────────────────────────────────────────────────

function useDebounce(fn: (...args: unknown[]) => void, ms: number) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  return useCallback((...args: unknown[]) => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => fn(...args), ms)
  }, [fn, ms])
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  allSongs: SongOption[]
  userNames: string[]
}

export function PlanificareClient({ allSongs, userNames }: Props) {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [services, setServices] = useState<Record<string, ServicePlan>>({})
  const [selected, setSelected] = useState<ServicePlan | null>(null)
  const [busy, setBusy] = useState(false)

  // Song search
  const [addingPeriod, setAddingPeriod] = useState<"morning" | "evening" | null>(null)
  const [songQ, setSongQ] = useState("")

  // Person input
  const [personInput, setPersonInput] = useState("")
  const [showPersonSug, setShowPersonSug] = useState(false)

  // Notes (debounced save)
  const [notesMorning, setNotesMorning] = useState("")
  const [notesEvening, setNotesEvening] = useState("")

  // ── Load month ──────────────────────────────────────────────────────────

  useEffect(() => {
    const key = `${year}-${String(month + 1).padStart(2, "0")}`
    fetch(`/api/services?month=${key}`)
      .then((r) => r.json())
      .then((data: ServicePlan[]) => {
        const map: Record<string, ServicePlan> = {}
        for (const s of data) map[s.date] = s
        setServices(map)
      })
  }, [year, month])

  // Sync notes state when selected changes
  useEffect(() => {
    setNotesMorning(selected?.notesMorning ?? "")
    setNotesEvening(selected?.notesEvening ?? "")
  }, [selected?.id])

  // ── Debounced notes save ────────────────────────────────────────────────

  const saveNotes = useCallback(
    async (planId: string, field: "notesMorning" | "notesEvening", value: string) => {
      await fetch(`/api/services/${planId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      })
    },
    []
  )

  // ── Select / create service for a Sunday ───────────────────────────────

  async function handleSelectDate(dateStr: string) {
    if (busy) return
    setBusy(true)
    const existing = services[dateStr]
    if (existing) {
      setSelected(existing)
      setBusy(false)
      return
    }
    const res = await fetch("/api/services", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: dateStr }),
    })
    const plan: ServicePlan = await res.json()
    setServices((s) => ({ ...s, [dateStr]: plan }))
    setSelected(plan)
    setBusy(false)
  }

  function updateSelected(plan: ServicePlan) {
    setSelected(plan)
    setServices((s) => ({ ...s, [plan.date]: plan }))
  }

  // ── Songs ───────────────────────────────────────────────────────────────

  async function addSong(song: SongOption, period: "morning" | "evening") {
    if (!selected) return
    const res = await fetch(`/api/services/${selected.id}/songs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ songId: song.id, period, key: song.defaultKey }),
    })
    const item: SongItem = await res.json()
    updateSelected({ ...selected, songs: [...selected.songs, item] })
    setSongQ("")
    setAddingPeriod(null)
  }

  async function removeSong(itemId: string) {
    if (!selected) return
    await fetch(`/api/services/${selected.id}/songs/${itemId}`, { method: "DELETE" })
    updateSelected({ ...selected, songs: selected.songs.filter((s) => s.id !== itemId) })
  }

  async function reorderSongs(period: "morning" | "evening", newItems: SongItem[]) {
    if (!selected) return
    const others = selected.songs.filter((s) => s.period !== period)
    const merged = [...others, ...newItems]
    updateSelected({ ...selected, songs: merged })
    await fetch(`/api/services/${selected.id}/songs/reorder`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: newItems.map((s) => s.id) }),
    })
  }

  // ── People ──────────────────────────────────────────────────────────────

  async function addPerson(name: string) {
    if (!selected || !name.trim()) return
    const res = await fetch(`/api/services/${selected.id}/people`, {
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

  // ── Calendar ────────────────────────────────────────────────────────────

  const days = daysInMonth(year, month)
  const offset = firstWeekday(year, month)
  const today = todayStr()
  const cells: (number | null)[] = [
    ...Array(offset).fill(null),
    ...Array.from({ length: days }, (_, i) => i + 1),
  ]
  // Pad to full rows
  while (cells.length % 7 !== 0) cells.push(null)

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }

  // ── Render ──────────────────────────────────────────────────────────────

  const mornings = selected ? selected.songs.filter((s) => s.period === "morning").sort((a, b) => a.position - b.position) : []
  const evenings = selected ? selected.songs.filter((s) => s.period === "evening").sort((a, b) => a.position - b.position) : []

  const filteredSongs = songQ.trim()
    ? allSongs.filter((s) =>
        s.title.toLowerCase().includes(songQ.toLowerCase()) ||
        (s.firstLine?.toLowerCase().includes(songQ.toLowerCase()) ?? false)
      ).slice(0, 8)
    : allSongs.slice(0, 8)

  const personSuggestions = personInput.trim()
    ? userNames.filter((n) => n.toLowerCase().includes(personInput.toLowerCase())).slice(0, 6)
    : userNames.slice(0, 6)

  return (
    <div className="flex-1 flex flex-col lg:flex-row lg:overflow-hidden h-full">

      {/* ── Calendar panel ─────────────────────────────────────────────── */}
      <div className={`${selected ? "hidden lg:flex" : "flex"} flex-col lg:w-80 xl:w-96 lg:border-r border-gray-200 dark:border-gray-700 lg:overflow-y-auto`}>

        {/* Header */}
        <div className="flex items-center justify-between px-4 lg:px-6 pt-safe-header lg:pt-6 pb-4">
          <div>
            <p className="text-[10px] font-semibold tracking-widest text-gray-400 dark:text-gray-500 uppercase">Planificare</p>
            <h1 className="text-[22px] font-display font-bold text-gray-900 dark:text-gray-100">Slujbe</h1>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={prevMonth} className="p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 min-w-[110px] text-center">
              {RO_MONTHS[month]} {year}
            </span>
            <button onClick={nextMonth} className="p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </div>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 px-2 lg:px-4 mb-1">
          {RO_DAYS.map((d, i) => (
            <div key={d} className={`text-center text-[11px] font-semibold py-1 ${i === 6 ? "text-indigo-600 dark:text-indigo-400" : "text-gray-400 dark:text-gray-500"}`}>
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 px-2 lg:px-4 pb-4 gap-y-0.5">
          {cells.map((day, i) => {
            if (!day) return <div key={i} />
            const col = i % 7
            const isSun = col === 6
            const dateStr = toDateStr(year, month, day)
            const isToday = dateStr === today
            const isSelected = selected?.date === dateStr
            const hasService = !!services[dateStr]
            const hasSongs = (services[dateStr]?.songs.length ?? 0) > 0
            const hasPeople = (services[dateStr]?.people.length ?? 0) > 0

            return (
              <button
                key={i}
                onClick={() => isSun ? handleSelectDate(dateStr) : undefined}
                disabled={!isSun}
                className={`
                  relative flex flex-col items-center justify-center h-10 rounded-xl text-sm font-medium transition-all
                  ${!isSun ? "cursor-default text-gray-400 dark:text-gray-600" : ""}
                  ${isSun && !isSelected ? "text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 hover:bg-indigo-100 dark:hover:bg-indigo-900 font-bold cursor-pointer" : ""}
                  ${isSelected ? "bg-indigo-700 dark:bg-indigo-600 text-white font-bold shadow-sm" : ""}
                  ${isToday && !isSelected ? "ring-2 ring-indigo-400 dark:ring-indigo-500" : ""}
                `}
              >
                {day}
                {/* Dot: service exists */}
                {isSun && hasService && (hasSongs || hasPeople) && (
                  <span className={`absolute bottom-1 w-1.5 h-1.5 rounded-full ${isSelected ? "bg-white" : "bg-indigo-400 dark:bg-indigo-500"}`} />
                )}
              </button>
            )
          })}
        </div>

        {/* Legend */}
        <div className="px-4 lg:px-6 pb-4 flex items-center gap-3 text-[11px] text-gray-400 dark:text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-indigo-50 dark:bg-indigo-950 border border-indigo-200 dark:border-indigo-800" />
            Duminică (selectabilă)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 dark:bg-indigo-500" />
            Are conținut
          </span>
        </div>
      </div>

      {/* ── Service panel ──────────────────────────────────────────────── */}
      {selected ? (
        <ServicePanel
          service={selected}
          mornings={mornings}
          evenings={evenings}
          allSongs={allSongs}
          userNames={userNames}
          personInput={personInput}
          setPersonInput={setPersonInput}
          showPersonSug={showPersonSug}
          setShowPersonSug={setShowPersonSug}
          personSuggestions={personSuggestions}
          addingPeriod={addingPeriod}
          setAddingPeriod={setAddingPeriod}
          songQ={songQ}
          setSongQ={setSongQ}
          filteredSongs={filteredSongs}
          notesMorning={notesMorning}
          setNotesMorning={setNotesMorning}
          notesEvening={notesEvening}
          setNotesEvening={setNotesEvening}
          onBack={() => setSelected(null)}
          onAddSong={addSong}
          onRemoveSong={removeSong}
          onReorderSongs={reorderSongs}
          onAddPerson={addPerson}
          onRemovePerson={removePerson}
          onReorderPeople={reorderPeople}
          onSaveNotes={saveNotes}
        />
      ) : (
        <div className="hidden lg:flex flex-1 items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center mx-auto mb-3">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-indigo-400 dark:text-indigo-500">
                <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.8"/>
                <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </div>
            <p className="text-sm text-gray-400 dark:text-gray-500">Selectează o duminică din calendar</p>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Service Panel ─────────────────────────────────────────────────────────────

interface PanelProps {
  service: ServicePlan
  mornings: SongItem[]
  evenings: SongItem[]
  allSongs: SongOption[]
  userNames: string[]
  personInput: string
  setPersonInput: (v: string) => void
  showPersonSug: boolean
  setShowPersonSug: (v: boolean) => void
  personSuggestions: string[]
  addingPeriod: "morning" | "evening" | null
  setAddingPeriod: (v: "morning" | "evening" | null) => void
  songQ: string
  setSongQ: (v: string) => void
  filteredSongs: SongOption[]
  notesMorning: string
  setNotesMorning: (v: string) => void
  notesEvening: string
  setNotesEvening: (v: string) => void
  onBack: () => void
  onAddSong: (song: SongOption, period: "morning" | "evening") => void
  onRemoveSong: (id: string) => void
  onReorderSongs: (period: "morning" | "evening", items: SongItem[]) => void
  onAddPerson: (name: string) => void
  onRemovePerson: (id: string) => void
  onReorderPeople: (items: PersonItem[]) => void
  onSaveNotes: (planId: string, field: "notesMorning" | "notesEvening", value: string) => void
}

function ServicePanel({
  service, mornings, evenings,
  userNames, personInput, setPersonInput, showPersonSug, setShowPersonSug, personSuggestions,
  addingPeriod, setAddingPeriod, songQ, setSongQ, filteredSongs,
  notesMorning, setNotesMorning, notesEvening, setNotesEvening,
  onBack, onAddSong, onRemoveSong, onReorderSongs,
  onAddPerson, onRemovePerson, onReorderPeople, onSaveNotes,
}: PanelProps) {
  const [date] = service.date.split("T")
  const [y, m, d] = date.split("-").map(Number)
  const dateObj = new Date(y, m - 1, d)
  const RO_WEEKDAYS = ["Duminică","Luni","Marți","Miercuri","Joi","Vineri","Sâmbătă"]
  const dateLabel = `${RO_WEEKDAYS[dateObj.getDay()]}, ${d} ${RO_MONTHS[m - 1]} ${y}`

  const notesTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleNoteChange(field: "notesMorning" | "notesEvening", value: string) {
    if (field === "notesMorning") setNotesMorning(value)
    else setNotesEvening(value)
    if (notesTimer.current) clearTimeout(notesTimer.current)
    notesTimer.current = setTimeout(() => onSaveNotes(service.id, field, value), 600)
  }

  const mDrag = useDragSort(mornings, (items) => onReorderSongs("morning", items))
  const eDrag = useDragSort(evenings, (items) => onReorderSongs("evening", items))
  const pDrag = useDragSort(service.people, (items) => onReorderPeople(items))

  return (
    <div className="flex-1 flex flex-col lg:overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#f0f2f5]/95 dark:bg-gray-950/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 px-4 lg:px-8 pt-safe-bar pb-3 lg:pt-4 flex items-center gap-3">
        <button
          onClick={onBack}
          className="lg:hidden flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M12 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div>
          <p className="text-[10px] font-semibold tracking-widest text-gray-400 dark:text-gray-500 uppercase">Slujbă</p>
          <h2 className="text-base font-display font-bold text-gray-900 dark:text-gray-100 leading-tight">{dateLabel}</h2>
        </div>
      </div>

      <div className="px-4 lg:px-8 py-5 space-y-6 pb-32 lg:pb-8">

        {/* ── Dimineață ─────────────────────────────────────────────── */}
        <ServiceSection
          title="Dimineață"
          icon="🌅"
          songs={mornings}
          period="morning"
          dragHooks={mDrag}
          notes={notesMorning}
          notesField="notesMorning"
          addingPeriod={addingPeriod}
          setAddingPeriod={setAddingPeriod}
          songQ={songQ}
          setSongQ={setSongQ}
          filteredSongs={filteredSongs}
          onAddSong={onAddSong}
          onRemoveSong={onRemoveSong}
          onNoteChange={handleNoteChange}
        />

        {/* ── Seară ─────────────────────────────────────────────────── */}
        <ServiceSection
          title="Seară"
          icon="🌙"
          songs={evenings}
          period="evening"
          dragHooks={eDrag}
          notes={notesEvening}
          notesField="notesEvening"
          addingPeriod={addingPeriod}
          setAddingPeriod={setAddingPeriod}
          songQ={songQ}
          setSongQ={setSongQ}
          filteredSongs={filteredSongs}
          onAddSong={onAddSong}
          onRemoveSong={onRemoveSong}
          onNoteChange={handleNoteChange}
        />

        {/* ── Echipă ────────────────────────────────────────────────── */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
            <span className="text-base">👥</span>
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Echipă</h3>
          </div>

          {/* People list */}
          <ul className="divide-y divide-gray-50 dark:divide-gray-700/50">
            {service.people.sort((a, b) => a.position - b.position).map((person, idx) => (
              <li
                key={person.id}
                draggable
                onDragStart={() => pDrag.onDragStart(person.id)}
                onDragOver={(e) => pDrag.onDragOver(e, idx)}
                onDrop={() => pDrag.onDrop(idx)}
                onDragEnd={pDrag.onDragEnd}
                className={`flex items-center gap-3 px-4 py-2.5 transition-colors ${pDrag.overIdx === idx ? "bg-indigo-50 dark:bg-indigo-950" : ""}`}
              >
                <span className="cursor-grab text-gray-300 dark:text-gray-600 hover:text-gray-500">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <circle cx="9" cy="7" r="1.5" fill="currentColor"/><circle cx="15" cy="7" r="1.5" fill="currentColor"/>
                    <circle cx="9" cy="12" r="1.5" fill="currentColor"/><circle cx="15" cy="12" r="1.5" fill="currentColor"/>
                    <circle cx="9" cy="17" r="1.5" fill="currentColor"/><circle cx="15" cy="17" r="1.5" fill="currentColor"/>
                  </svg>
                </span>
                <span className="flex-1 text-sm text-gray-800 dark:text-gray-200">{person.name}</span>
                <button
                  onClick={() => onRemovePerson(person.id)}
                  className="p-1 text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 transition"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                </button>
              </li>
            ))}
          </ul>

          {/* Add person */}
          <div className="px-4 py-3 border-t border-gray-50 dark:border-gray-700/50 relative">
            <div className="flex gap-2">
              <input
                value={personInput}
                onChange={(e) => { setPersonInput(e.target.value); setShowPersonSug(true) }}
                onFocus={() => setShowPersonSug(true)}
                onKeyDown={(e) => { if (e.key === "Enter") { onAddPerson(personInput); setShowPersonSug(false) } }}
                placeholder="Adaugă persoană…"
                className="flex-1 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100 dark:focus:ring-indigo-900 transition"
              />
              <button
                onClick={() => { onAddPerson(personInput); setShowPersonSug(false) }}
                disabled={!personInput.trim()}
                className="px-3 py-2 bg-indigo-700 text-white text-xs font-semibold rounded-xl hover:bg-indigo-600 transition disabled:opacity-40"
              >
                Adaugă
              </button>
            </div>
            {showPersonSug && personInput.length > 0 && personSuggestions.length > 0 && (
              <div className="absolute z-20 left-4 right-4 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-lg overflow-hidden">
                {personSuggestions.map((name) => (
                  <button
                    key={name}
                    onClick={() => { onAddPerson(name); setShowPersonSug(false) }}
                    className="w-full text-left px-3 py-2 text-sm text-gray-800 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-indigo-950 transition"
                  >
                    {name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}

// ── Service Section (Dimineață / Seară) ───────────────────────────────────────

interface SectionProps {
  title: string
  icon: string
  songs: SongItem[]
  period: "morning" | "evening"
  dragHooks: ReturnType<typeof useDragSort<SongItem>>
  notes: string
  notesField: "notesMorning" | "notesEvening"
  addingPeriod: "morning" | "evening" | null
  setAddingPeriod: (v: "morning" | "evening" | null) => void
  songQ: string
  setSongQ: (v: string) => void
  filteredSongs: SongOption[]
  onAddSong: (song: SongOption, period: "morning" | "evening") => void
  onRemoveSong: (id: string) => void
  onNoteChange: (field: "notesMorning" | "notesEvening", value: string) => void
}

function ServiceSection({
  title, icon, songs, period, dragHooks,
  notes, notesField, addingPeriod, setAddingPeriod,
  songQ, setSongQ, filteredSongs, onAddSong, onRemoveSong, onNoteChange,
}: SectionProps) {
  const isAdding = addingPeriod === period

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-base">{icon}</span>
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">{title}</h3>
          {songs.length > 0 && (
            <span className="text-[11px] font-medium text-gray-400 dark:text-gray-500">
              {songs.length} melodii
            </span>
          )}
        </div>
        <button
          onClick={() => { setAddingPeriod(isAdding ? null : period); setSongQ("") }}
          className="flex items-center gap-1 text-xs font-semibold text-indigo-700 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 transition"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
          Adaugă
        </button>
      </div>

      {/* Song list */}
      {songs.length > 0 && (
        <ul className="divide-y divide-gray-50 dark:divide-gray-700/50">
          {songs.map((song, idx) => (
            <li
              key={song.id}
              draggable
              onDragStart={() => dragHooks.onDragStart(song.id)}
              onDragOver={(e) => dragHooks.onDragOver(e, idx)}
              onDrop={() => dragHooks.onDrop(idx)}
              onDragEnd={dragHooks.onDragEnd}
              className={`flex items-center gap-3 px-4 py-2.5 transition-colors ${dragHooks.overIdx === idx ? "bg-indigo-50 dark:bg-indigo-950 border-l-2 border-indigo-400" : ""}`}
            >
              <span className="cursor-grab text-gray-300 dark:text-gray-600 hover:text-gray-500 flex-shrink-0">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <circle cx="9" cy="7" r="1.5" fill="currentColor"/><circle cx="15" cy="7" r="1.5" fill="currentColor"/>
                  <circle cx="9" cy="12" r="1.5" fill="currentColor"/><circle cx="15" cy="12" r="1.5" fill="currentColor"/>
                  <circle cx="9" cy="17" r="1.5" fill="currentColor"/><circle cx="15" cy="17" r="1.5" fill="currentColor"/>
                </svg>
              </span>
              <span className="flex-1 min-w-0">
                <span className="text-sm text-gray-800 dark:text-gray-200 truncate block">{song.title}</span>
              </span>
              {song.key && (
                <span className="text-[11px] font-mono font-semibold text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-md flex-shrink-0">
                  {song.key}
                </span>
              )}
              <button
                onClick={() => onRemoveSong(song.id)}
                className="p-1 text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 transition flex-shrink-0"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Song search */}
      {isAdding && (
        <div className="px-4 py-3 border-t border-gray-50 dark:border-gray-700/50">
          <input
            autoFocus
            value={songQ}
            onChange={(e) => setSongQ(e.target.value)}
            placeholder="Caută melodie…"
            className="w-full bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100 dark:focus:ring-indigo-900 transition mb-2"
          />
          <div className="space-y-0.5 max-h-48 overflow-y-auto">
            {filteredSongs.map((s) => (
              <button
                key={s.id}
                onClick={() => onAddSong(s, period)}
                className="w-full text-left px-3 py-2 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-950 transition group"
              >
                <span className="text-sm font-medium text-gray-800 dark:text-gray-200 group-hover:text-indigo-700 dark:group-hover:text-indigo-400">{s.title}</span>
                {s.defaultKey && (
                  <span className="ml-2 text-[11px] font-mono text-gray-400 dark:text-gray-500">{s.defaultKey}</span>
                )}
              </button>
            ))}
            {filteredSongs.length === 0 && (
              <p className="text-xs text-gray-400 dark:text-gray-500 px-3 py-2">Nicio melodie găsită.</p>
            )}
          </div>
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
