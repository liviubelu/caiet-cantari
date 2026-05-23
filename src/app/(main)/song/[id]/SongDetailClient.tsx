"use client"

import { useState, useEffect } from "react"
import { ChordProDisplay } from "@/components/ChordProDisplay"
import { Transposer } from "@/components/Transposer"
import { FavoriteButton } from "@/components/FavoriteButton"

const FONT_MIN = 11
const FONT_MAX = 23
const FONT_STEP = 2
const FONT_DEFAULT = 14

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
  const [fontSize, setFontSize] = useState(FONT_DEFAULT)

  useEffect(() => {
    const saved = localStorage.getItem("songFontSize")
    if (saved) {
      const n = parseInt(saved)
      if (!isNaN(n)) setFontSize(n)
    }
  }, [])

  function changeFontSize(delta: number) {
    setFontSize((prev) => {
      const next = Math.min(FONT_MAX, Math.max(FONT_MIN, prev + delta))
      localStorage.setItem("songFontSize", String(next))
      return next
    })
  }

  return (
    <div>
      <div className="px-4 py-3 border-t border-b border-gray-100 flex items-center justify-between gap-3 flex-wrap">
        <Transposer defaultKey={defaultKey} semitones={semitones} onChange={setSemitones} />

        <div className="flex items-center gap-2">
          {/* Font size */}
          <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => changeFontSize(-FONT_STEP)}
              disabled={fontSize <= FONT_MIN}
              className="px-2.5 py-1.5 text-xs font-bold text-gray-500 hover:bg-gray-50 disabled:opacity-30 transition"
              title="Micșorează textul"
            >
              A−
            </button>
            <div className="w-px h-4 bg-gray-200" />
            <button
              onClick={() => changeFontSize(+FONT_STEP)}
              disabled={fontSize >= FONT_MAX}
              className="px-2.5 py-1.5 text-sm font-bold text-gray-500 hover:bg-gray-50 disabled:opacity-30 transition"
              title="Mărește textul"
            >
              A+
            </button>
          </div>

          {/* Chords / Lyrics toggle */}
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
                <path d="M9 18V5l12-2v13M9 18a3 3 0 11-6 0 3 3 0 016 0zm12-2a3 3 0 11-6 0 3 3 0 016 0z"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              )}
            </svg>
            {showChords ? "Acorduri" : "Versuri"}
          </button>

          {isAuthenticated && (
            <FavoriteButton songId={songId} initialFavorited={isFavorited} />
          )}
        </div>
      </div>

      <div className="px-4 py-5 lg:px-8 lg:py-7">
        <ChordProDisplay content={content} semitones={semitones} showChords={showChords} fontSize={fontSize} />
      </div>
    </div>
  )
}
