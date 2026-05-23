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
  const [twoColumns, setTwoColumns] = useState(false)

  useEffect(() => {
    const savedSize = localStorage.getItem("songFontSize")
    if (savedSize) {
      const n = parseInt(savedSize)
      if (!isNaN(n)) setFontSize(n)
    }
    const savedCols = localStorage.getItem("songTwoColumns")
    if (savedCols !== null) setTwoColumns(savedCols === "1")
  }, [])

  function changeFontSize(delta: number) {
    setFontSize((prev) => {
      const next = Math.min(FONT_MAX, Math.max(FONT_MIN, prev + delta))
      localStorage.setItem("songFontSize", String(next))
      return next
    })
  }

  function toggleColumns() {
    setTwoColumns((prev) => {
      const next = !prev
      localStorage.setItem("songTwoColumns", next ? "1" : "0")
      return next
    })
  }

  return (
    <div>
      {/* Controls bar */}
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

          {/* Two-column toggle — desktop only */}
          <button
            onClick={toggleColumns}
            className={`hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
              twoColumns
                ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                : "bg-gray-100 border-gray-200 text-gray-600 hover:bg-gray-200"
            }`}
            title={twoColumns ? "O coloană" : "Două coloane"}
          >
            <svg width="13" height="13" viewBox="0 0 22 16" fill="none">
              <rect x="0.5" y="0.5" width="9" height="15" rx="1.5" stroke="currentColor" strokeWidth="1.5" fill={twoColumns ? "currentColor" : "none"} fillOpacity={twoColumns ? 0.15 : 0} />
              <rect x="12.5" y="0.5" width="9" height="15" rx="1.5" stroke="currentColor" strokeWidth="1.5" fill={twoColumns ? "currentColor" : "none"} fillOpacity={twoColumns ? 0.15 : 0} />
            </svg>
            {twoColumns ? "1 coloană" : "2 coloane"}
          </button>

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

      {/* Song content */}
      <div className={
        twoColumns
          ? "px-4 py-5 lg:px-10 lg:py-7"
          : "px-4 py-5 lg:px-10 lg:py-7 lg:max-w-3xl"
      }>
        <ChordProDisplay
          content={content}
          semitones={semitones}
          showChords={showChords}
          fontSize={fontSize}
          twoColumns={twoColumns}
        />
      </div>
    </div>
  )
}
