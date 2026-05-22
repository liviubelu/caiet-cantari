"use client"

import { useState } from "react"
import { ChordProDisplay } from "@/components/ChordProDisplay"
import { Transposer } from "@/components/Transposer"
import { FavoriteButton } from "@/components/FavoriteButton"

interface Props {
  content: string
  defaultKey: string | null
  songId: string
  isFavorited: boolean
  isAuthenticated: boolean
}

export function SongDetailClient({ content, defaultKey, songId, isFavorited, isAuthenticated }: Props) {
  const [semitones, setSemitones] = useState(0)
  const [showChords, setShowChords] = useState(true)

  return (
    <div>
      <div className="px-4 py-3 border-t border-b border-gray-100 flex items-center justify-between gap-3 flex-wrap">
        <Transposer defaultKey={defaultKey} semitones={semitones} onChange={setSemitones} />

        <div className="flex items-center gap-3">
          {/* Lyrics / Chords toggle */}
          <button
            onClick={() => setShowChords(!showChords)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
              showChords
                ? "bg-blue-50 border-blue-200 text-blue-700"
                : "bg-gray-100 border-gray-200 text-gray-600"
            }`}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
              {showChords ? (
                /* music note icon when chords visible */
                <path d="M9 18V5l12-2v13M9 18a3 3 0 11-6 0 3 3 0 016 0zm12-2a3 3 0 11-6 0 3 3 0 016 0z"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              ) : (
                /* text lines icon when lyrics only */
                <>
                  <path d="M4 6h16M4 12h16M4 18h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </>
              )}
            </svg>
            {showChords ? "Acorduri" : "Versuri"}
          </button>

          {isAuthenticated && (
            <FavoriteButton songId={songId} initialFavorited={isFavorited} />
          )}
        </div>
      </div>

      <div className="px-4 py-5">
        <ChordProDisplay content={content} semitones={semitones} showChords={showChords} />
      </div>
    </div>
  )
}
