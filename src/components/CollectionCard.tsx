import Link from "next/link"
import { getCategoryColor } from "@/lib/categories"

interface Props {
  category: string
  songs: { id: string; title: string }[]
}

export function CollectionCard({ category, songs }: Props) {
  const cat = getCategoryColor(category)

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-50">
        <div className="w-1 h-8 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
        <div className="flex-1">
          <p className="font-semibold text-gray-900 text-sm">{category}</p>
        </div>
        <span className="text-[11px] font-medium text-gray-400">
          {songs.length} {songs.length === 1 ? "CÂNTARE" : "CÂNTĂRI"}
        </span>
      </div>
      <ul className="px-4 py-2">
        {songs.map((song) => (
          <li key={song.id}>
            <Link
              href={`/song/${song.id}`}
              className="flex items-center gap-2 py-1.5 text-sm text-gray-700 hover:text-gray-900"
            >
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
              {song.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
