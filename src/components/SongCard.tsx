import Link from "next/link"
import { KeyBadge } from "./KeyBadge"
import { FavoriteButton } from "./FavoriteButton"
import { getCategoryColor } from "@/lib/categories"

interface Song {
  id: string
  title: string
  firstLine: string | null
  category: string | null
  defaultKey: string | null
}

interface Props {
  song: Song
  favorited?: boolean
  showCategory?: boolean
  authenticated?: boolean
}

export function SongCard({ song, favorited = false, showCategory = false, authenticated = false }: Props) {
  const cat = getCategoryColor(song.category)

  return (
    <div className="flex items-center gap-3 bg-white rounded-xl px-4 py-3.5 border border-gray-100 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
      <Link href={`/song/${song.id}`} className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 text-sm leading-tight truncate">{song.title}</p>
        {song.firstLine && (
          <p className="text-gray-400 text-xs mt-0.5 truncate">{song.firstLine}</p>
        )}
        {showCategory && song.category && (
          <span
            className="inline-block mt-1.5 text-[10px] font-medium px-2 py-0.5 rounded-full"
            style={{ backgroundColor: cat.light, color: cat.color }}
          >
            {song.category}
          </span>
        )}
      </Link>
      <div className="flex items-center gap-2 flex-shrink-0">
        {song.defaultKey && <KeyBadge keyName={song.defaultKey} />}
        {authenticated ? (
          <FavoriteButton songId={song.id} initialFavorited={favorited} />
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
              d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z"
              stroke="#d1d5db"
              strokeWidth="1.8"
            />
          </svg>
        )}
      </div>
    </div>
  )
}
