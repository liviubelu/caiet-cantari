"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { SongCard } from "@/components/SongCard"
import { InstallBanner } from "@/components/InstallBanner"
import { ChurchIcon } from "@/components/ChurchIcon"
import { matchesSearch } from "@/lib/search"

type Song = React.ComponentProps<typeof SongCard>["song"]

interface Props {
  songs: Song[]
  favIds: string[]
  authenticated: boolean
  canEdit: boolean
  initials: string | null
}

export function HomeClient({ songs, favIds, authenticated, canEdit, initials }: Props) {
  const [query, setQuery] = useState("")
  const favSet = useMemo(() => new Set(favIds), [favIds])

  // Live, accent- and punctuation-insensitive filtering as you type.
  const filtered = useMemo(
    () => (query.trim() ? songs.filter((s) => matchesSearch(query, s.title, s.firstLine)) : songs),
    [songs, query],
  )

  const grouped = useMemo(() => {
    return filtered.reduce<Record<string, Song[]>>((acc, song) => {
      const letter = song.title[0]?.toUpperCase() ?? "#"
      ;(acc[letter] ??= []).push(song)
      return acc
    }, {})
  }, [filtered])

  return (
    <div className="bg-[#f0f2f5] dark:bg-gray-950 flex-1">
      {/* Sticky header — full width */}
      <div className="sticky top-0 z-40 bg-[#f0f2f5] dark:bg-gray-950 px-4 lg:px-8 pt-safe-header lg:pt-6 pb-3">
        {/* Mobile-only header row — on desktop this is in the sidebar */}
        <div className="flex items-center justify-between mb-4 lg:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-indigo-700 rounded-lg flex items-center justify-center">
              <ChurchIcon size={14} />
            </div>
            <div>
              <p className="text-[9px] font-semibold tracking-widest text-gray-400 dark:text-gray-500 uppercase leading-none">
                Tineri
              </p>
              <p className="text-sm font-bold text-gray-900 dark:text-gray-100 leading-tight">Bartolomeu</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {authenticated && canEdit && (
              <Link
                href="/adauga"
                aria-label="Adaugă melodie"
                className="w-8 h-8 rounded-full bg-indigo-700 flex items-center justify-center shadow-sm hover:bg-indigo-600 transition"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M12 5v14M5 12h14" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </Link>
            )}
            {initials ? (
              <Link href="/cont" className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-[11px] font-bold text-gray-600 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition">
                {initials}
              </Link>
            ) : (
              <Link href="/login" className="text-xs font-semibold text-indigo-700 dark:text-indigo-400 hover:underline">
                Conectează-te
              </Link>
            )}
          </div>
        </div>

        <h1 className="text-[28px] font-display font-bold text-gray-900 dark:text-gray-100 leading-tight">
          Caiet de cântări
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          {filtered.length} {filtered.length === 1 ? "cântare" : "cântări"}
          {favSet.size > 0 && ` · ${favSet.size} favorite`}
        </p>

        <div className="mt-4 relative">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" width="16" height="16" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
            <path d="M20 20l-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <label htmlFor="song-search" className="sr-only">Caută cântări</label>
          <input
            id="song-search"
            type="search"
            enterKeyHint="search"
            autoComplete="off"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Caută după titlu sau prima linie…"
            className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900 transition"
          />
        </div>
      </div>

      <div className="px-4 lg:px-8 py-2">
        {/* Install promo for new visitors — hides itself once installed/dismissed */}
        <InstallBanner />

        {filtered.length === 0 && (
          <div className="text-center py-16 text-gray-400 dark:text-gray-500">
            <p className="text-sm">
              {query.trim() ? `Nicio melodie găsită pentru „${query}"` : "Nicio melodie adăugată încă."}
            </p>
            {authenticated && !query.trim() && (
              <Link href="/adauga" className="mt-4 inline-block text-sm font-semibold text-indigo-700 hover:underline">
                Adaugă prima melodie
              </Link>
            )}
          </div>
        )}

        {Object.keys(grouped)
          .sort()
          .map((letter) => (
            <div key={letter} className="mb-4">
              <p className="text-xs font-bold text-gray-400 dark:text-gray-600 px-1 mb-2">{letter}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
                {grouped[letter].map((song) => (
                  <SongCard key={song.id} song={song} favorited={favSet.has(song.id)} authenticated={authenticated} />
                ))}
              </div>
            </div>
          ))}
      </div>
    </div>
  )
}
