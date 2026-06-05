"use client"

import { useState, useEffect, useMemo } from "react"
import { getAllSongs, type OfflineSong } from "@/lib/offline-db"
import { ChordProDisplay } from "@/components/ChordProDisplay"
import { Transposer } from "@/components/Transposer"
import { getCategoryColor } from "@/lib/categories"

const FONT_MIN = 11
const FONT_MAX = 23
const FONT_STEP = 2
const FONT_DEFAULT = 14

// ── Online/offline detection ──────────────────────────────────────────────────

function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    setIsOnline(navigator.onLine)
    const on = () => setIsOnline(true)
    const off = () => setIsOnline(false)
    window.addEventListener("online", on)
    window.addEventListener("offline", off)
    return () => {
      window.removeEventListener("online", on)
      window.removeEventListener("offline", off)
    }
  }, [])

  return isOnline
}

// ── Song list view ────────────────────────────────────────────────────────────

function SongList({
  songs,
  query,
  onQueryChange,
  onSelect,
}: {
  songs: OfflineSong[]
  query: string
  onQueryChange: (q: string) => void
  onSelect: (song: OfflineSong) => void
}) {
  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    if (!q) return songs
    return songs.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        (s.firstLine?.toLowerCase().includes(q) ?? false)
    )
  }, [songs, query])

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Search */}
      <div className="flex-none px-4 lg:px-8 pt-4 pb-3">
        <div className="relative">
          <svg
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
            width="16" height="16" viewBox="0 0 24 24" fill="none"
          >
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
            <path d="M20 20l-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Caută după titlu sau prima linie…"
            className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900 transition"
            autoFocus={false}
          />
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
          {songs.length === 0
            ? "Nicio melodie descărcată. Deschide aplicația cu internet pentru sincronizare."
            : `${filtered.length} din ${songs.length} melodii`}
        </p>
      </div>

      {/* Cards */}
      <div className="flex-1 overflow-y-auto overscroll-contain px-4 lg:px-8 pb-32 lg:pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
          {filtered.map((song) => (
            <button
              key={song.id}
              onClick={() => onSelect(song)}
              className="bg-white dark:bg-gray-800 rounded-2xl px-4 py-3.5 border border-gray-100 dark:border-gray-700 hover:border-indigo-200 dark:hover:border-indigo-700 hover:shadow-sm text-left transition-all"
            >
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-tight">
                {song.title}
              </p>
              {song.firstLine && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">{song.firstLine}</p>
              )}
              {!song.hasChords && (
                <span className="inline-block mt-1.5 text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500">
                  fără acorduri
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Song detail view ──────────────────────────────────────────────────────────

function SongDetail({
  song,
  onBack,
}: {
  song: OfflineSong
  onBack: () => void
}) {
  const [semitones, setSemitones] = useState(0)
  const [fontSize, setFontSize] = useState(FONT_DEFAULT)
  const cat = song.category ? getCategoryColor(song.category) : null

  return (
    <div className="flex-1 overflow-y-auto overscroll-contain">
      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-[#f0f2f5]/95 dark:bg-gray-950/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 px-4 lg:px-8 py-3 flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M12 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Înapoi
        </button>
      </div>

      {/* Title + category */}
      <div className="px-4 lg:px-10 pt-5 pb-4">
        <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-gray-100 leading-tight mb-2">
          {song.title}
        </h1>
        {cat && song.category && (
          <span
            className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
            style={{ backgroundColor: cat.light, color: cat.color }}
          >
            {song.category}
          </span>
        )}
      </div>

      {/* Controls */}
      <div className="px-4 py-3 border-t border-b border-gray-200 dark:border-gray-700 flex items-center justify-between gap-3 flex-wrap">
        <Transposer
          defaultKey={song.defaultKey}
          semitones={semitones}
          onChange={setSemitones}
        />
        {/* Font size */}
        <div className="flex items-center border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
          <button
            onClick={() => setFontSize((p) => Math.max(FONT_MIN, p - FONT_STEP))}
            disabled={fontSize <= FONT_MIN}
            className="px-2.5 py-1.5 text-xs font-bold text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-30 transition"
            title="Micșorează textul"
          >
            A−
          </button>
          <div className="w-px h-4 bg-gray-200 dark:bg-gray-600" />
          <button
            onClick={() => setFontSize((p) => Math.min(FONT_MAX, p + FONT_STEP))}
            disabled={fontSize >= FONT_MAX}
            className="px-2.5 py-1.5 text-sm font-bold text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-30 transition"
            title="Mărește textul"
          >
            A+
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-5 lg:px-10 lg:py-7 lg:max-w-3xl">
        <ChordProDisplay
          content={song.content}
          semitones={semitones}
          showChords={true}
          fontSize={fontSize}
          twoColumns={false}
        />
      </div>
    </div>
  )
}

// ── Main overlay ──────────────────────────────────────────────────────────────

export function OfflineOverlay() {
  const isOnline = useOnlineStatus()
  const [songs, setSongs] = useState<OfflineSong[]>([])
  const [ready, setReady] = useState(false)
  const [query, setQuery] = useState("")
  const [selected, setSelected] = useState<OfflineSong | null>(null)

  useEffect(() => {
    if (!isOnline) {
      getAllSongs().then((s) => {
        setSongs(s)
        setReady(true)

        const m = window.location.pathname.match(/^\/song\/([^/]+)$/)
        if (m) {
          const found = s.find((song) => song.id === m[1])
          if (found) setSelected(found)
        }
      })
    } else {
      setReady(false)
      setSelected(null)
      setQuery("")
    }
  }, [isOnline])

  if (isOnline) return null

  if (!ready) {
    return (
      <div className="fixed inset-0 z-50 bg-[#f0f2f5] dark:bg-gray-950 flex items-center justify-center">
        <p className="text-sm text-gray-400 dark:text-gray-500">Se încarcă melodiile…</p>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#f0f2f5] dark:bg-gray-950 flex flex-col pl-safe pr-safe pb-safe">
      {/* Offline banner */}
      <div className="flex-none bg-amber-50 dark:bg-amber-950 border-b border-amber-200 dark:border-amber-800 px-4 pt-safe-bar pb-2 flex items-center gap-2">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-amber-600 dark:text-amber-400">
          <path d="M1 1l22 22M16.72 11.06A10.94 10.94 0 0119 12.55M5 12.55a10.94 10.94 0 015.17-2.39M10.71 5.05A16 16 0 0122.56 9M1.42 9a15.91 15.91 0 014.7-2.88M8.53 16.11a6 6 0 016.95 0M12 20h.01"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="text-xs font-semibold text-amber-800 dark:text-amber-400">
          Mod offline — poți citi melodii, căuta și transpune
        </span>
      </div>

      {selected ? (
        <SongDetail song={selected} onBack={() => setSelected(null)} />
      ) : (
        <SongList
          songs={songs}
          query={query}
          onQueryChange={setQuery}
          onSelect={(song) => setSelected(song)}
        />
      )}
    </div>
  )
}
