"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { getCategoryColor } from "@/lib/categories"

type Song = {
  id: string
  title: string
  firstLine: string | null
  defaultKey: string | null
  category: string | null
  hasChords: boolean
}

interface Props {
  allSongs: Song[]
  planId: string
  period: "morning" | "evening"
  returnDate: string
}

const RO_MONTHS = [
  "Ianuarie","Februarie","Martie","Aprilie","Mai","Iunie",
  "Iulie","August","Septembrie","Octombrie","Noiembrie","Decembrie",
]

function formatDate(dateStr: string) {
  if (!dateStr) return ""
  const [y, m, d] = dateStr.split("-").map(Number)
  return `${d} ${RO_MONTHS[m - 1]} ${y}`
}

export function SongPickerClient({ allSongs, planId, period, returnDate }: Props) {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [adding, setAdding] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    if (!q) return allSongs
    return allSongs.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        (s.firstLine?.toLowerCase().includes(q) ?? false)
    )
  }, [allSongs, query])

  async function addSong(song: Song) {
    if (adding) return
    setAdding(song.id)
    try {
      await fetch(`/api/services/${planId}/songs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ songId: song.id, period, key: song.defaultKey }),
      })
    } finally {
      router.push(`/planificare?date=${returnDate}`)
    }
  }

  const periodLabel = period === "morning" ? "Dimineață" : "Seară"
  const backUrl = returnDate ? `/planificare?date=${returnDate}` : "/planificare"

  // Group by first letter
  const grouped = filtered.reduce<Record<string, Song[]>>((acc, song) => {
    const letter = song.title[0]?.toUpperCase() ?? "#"
    if (!acc[letter]) acc[letter] = []
    acc[letter].push(song)
    return acc
  }, {})

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#f0f2f5] dark:bg-gray-950 border-b border-gray-200 dark:border-gray-700 px-4 lg:px-8 pt-safe-bar pb-3 flex items-center gap-3">
        <Link href={backUrl} className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition p-1 -ml-1 rounded-lg">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M12 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
        <div className="flex-1">
          <p className="text-[10px] font-semibold tracking-widest text-gray-400 dark:text-gray-500 uppercase">
            {periodLabel} · {formatDate(returnDate)}
          </p>
          <h2 className="text-base font-display font-bold text-gray-900 dark:text-gray-100">Alege melodie</h2>
        </div>
        <span className="text-xs text-gray-400 dark:text-gray-500">{filtered.length} melodii</span>
      </div>

      {/* Search */}
      <div className="px-4 lg:px-8 pt-3 pb-2 bg-[#f0f2f5] dark:bg-gray-950">
        <div className="relative">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" width="16" height="16" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
            <path d="M20 20l-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Caută după titlu sau primă linie…"
            className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900 transition"
          />
        </div>
      </div>

      {/* Song list */}
      <div className="flex-1 overflow-y-auto px-4 lg:px-8 pb-32 lg:pb-8">
        {Object.keys(grouped).sort().map((letter) => (
          <div key={letter} className="mb-3">
            <p className="text-xs font-bold text-gray-400 dark:text-gray-600 px-1 mb-1">{letter}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
              {grouped[letter].map((song) => {
                const cat = song.category ? getCategoryColor(song.category) : null
                const isAdding = adding === song.id
                return (
                  <button
                    key={song.id}
                    onClick={() => addSong(song)}
                    disabled={!!adding}
                    className={`bg-white dark:bg-gray-800 rounded-xl px-4 py-3.5 border text-left transition-all ${
                      isAdding
                        ? "border-indigo-400 dark:border-indigo-500 bg-indigo-50 dark:bg-indigo-950"
                        : "border-gray-100 dark:border-gray-700 hover:border-indigo-200 dark:hover:border-indigo-700 hover:shadow-sm"
                    } disabled:opacity-60`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold leading-tight ${isAdding ? "text-indigo-700 dark:text-indigo-400" : "text-gray-900 dark:text-gray-100"}`}>
                          {song.title}
                        </p>
                        {song.firstLine && (
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">{song.firstLine}</p>
                        )}
                        {cat && song.category && (
                          <span className="inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: `${cat.color}1a`, color: cat.color }}>
                            {song.category}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {song.defaultKey && (
                          <span className="text-[11px] font-mono font-semibold text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-md">
                            {song.defaultKey}
                          </span>
                        )}
                        {isAdding ? (
                          <svg className="animate-spin text-indigo-500" width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31 11" />
                          </svg>
                        ) : (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-gray-300 dark:text-gray-600">
                            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                          </svg>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-16">
            <p className="text-sm text-gray-400 dark:text-gray-500">Nicio melodie găsită pentru „{query}"</p>
          </div>
        )}
      </div>
    </div>
  )
}
