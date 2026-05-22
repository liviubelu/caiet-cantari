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

  return (
    <div>
      <div className="px-4 py-3 border-t border-b border-gray-100 flex items-center justify-between">
        <Transposer defaultKey={defaultKey} semitones={semitones} onChange={setSemitones} />
        {isAuthenticated && (
          <FavoriteButton songId={songId} initialFavorited={isFavorited} />
        )}
      </div>

      <div className="px-4 py-5">
        <ChordProDisplay content={content} semitones={semitones} />
      </div>
    </div>
  )
}
