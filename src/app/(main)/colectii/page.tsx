export const dynamic = "force-dynamic"

import { db } from "@/lib/db"
import { songs } from "@/lib/schema"
import { asc } from "drizzle-orm"
import { CollectionCard } from "@/components/CollectionCard"
import { CATEGORIES } from "@/lib/categories"

export default async function ColectiiPage() {
  const allSongs = await db.select().from(songs).orderBy(asc(songs.title))

  const grouped = allSongs.reduce<Record<string, typeof allSongs>>((acc, song) => {
    const cat = song.category ?? "Altele"
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(song)
    return acc
  }, {})

  const categoryOrder = CATEGORIES.map((c) => c.value)
  const sortedCategories = Object.keys(grouped).sort(
    (a, b) => {
      const ai = categoryOrder.indexOf(a)
      const bi = categoryOrder.indexOf(b)
      if (ai < 0 && bi < 0) return a.localeCompare(b)
      if (ai < 0) return 1
      if (bi < 0) return -1
      return ai - bi
    }
  )

  return (
    <div>
      <div className="px-4 pt-12 pb-4">
        <p className="text-[10px] font-semibold tracking-widest text-gray-400 uppercase mb-1">
          Bibliotecă
        </p>
        <h1 className="text-[28px] font-display font-bold text-gray-900">Colecții</h1>
        <p className="text-sm text-gray-500 mt-1">Cântările grupate după tipul lor.</p>
      </div>

      <div className="px-4 space-y-3">
        {sortedCategories.length === 0 ? (
          <p className="text-center py-16 text-sm text-gray-400">Nicio melodie adăugată încă.</p>
        ) : (
          sortedCategories.map((cat) => (
            <CollectionCard
              key={cat}
              category={cat}
              songs={grouped[cat].map((s) => ({ id: s.id, title: s.title }))}
            />
          ))
        )}
      </div>
    </div>
  )
}
