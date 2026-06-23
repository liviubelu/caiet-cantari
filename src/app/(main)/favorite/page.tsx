export const dynamic = "force-dynamic"

import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { songs, favorites } from "@/lib/schema"
import { eq } from "drizzle-orm"
import { SongCard } from "@/components/SongCard"
import Link from "next/link"
import { ChurchIcon } from "@/components/ChurchIcon"
import { CATEGORIES } from "@/lib/categories"

export default async function FavoritePage() {
  const session = await getSession()
  if (!session?.user?.id) redirect("/login")

  const favSongs = await db
    .select({
      id: songs.id,
      title: songs.title,
      firstLine: songs.firstLine,
      category: songs.category,
      defaultKey: songs.defaultKey,
      hasChords: songs.hasChords,
    })
    .from(favorites)
    .innerJoin(songs, eq(favorites.songId, songs.id))
    .where(eq(favorites.userId, session.user.id))

  const grouped = favSongs.reduce<Record<string, typeof favSongs>>((acc, song) => {
    const cat = song.category ?? "Altele"
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(song)
    return acc
  }, {})

  const categoryOrder = CATEGORIES.map((c) => c.value)
  const sortedCategories = Object.keys(grouped).sort(
    (a, b) => categoryOrder.indexOf(a) - categoryOrder.indexOf(b)
  )

  const initials = session.user.name
    ? session.user.name.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase()
    : "?"

  return (
    <div className="bg-[#f0f2f5] dark:bg-gray-950 flex-1">
      <div className="px-4 lg:px-8 pt-safe-header lg:pt-6 pb-4">
        {/* Mobile-only header row */}
        <div className="flex items-center justify-between mb-4 lg:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-indigo-700 rounded-lg flex items-center justify-center">
              <ChurchIcon size={14} />
            </div>
            <div>
              <p className="text-[9px] font-semibold tracking-widest text-gray-400 dark:text-gray-500 uppercase leading-none">
                Caietul tău de cântări
              </p>
              <p className="text-sm font-bold text-gray-900 dark:text-gray-100 leading-tight">Cântările mele</p>
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-[11px] font-bold text-gray-600 dark:text-gray-200">
            {initials}
          </div>
        </div>
        {/* Desktop page title */}
        <h1 className="hidden lg:block text-[28px] font-display font-bold text-gray-900 dark:text-gray-100 leading-tight mb-4">Favorite</h1>

        <p className="text-sm text-gray-500 dark:text-gray-400 italic leading-relaxed border-l-2 border-blue-400 dark:border-blue-600 pl-3 py-1 mb-4">
          „Voi cânta Domnului cât voi trăi, voi lăuda pe Dumnezeul meu cât voi fi.” — Psalm 104:33
        </p>
      </div>

      <div className="px-4 lg:px-8">
        {favSongs.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-sm">Nu ai melodii favorite încă.</p>
            <Link href="/" className="mt-3 inline-block text-sm font-semibold text-indigo-700 hover:underline">
              Explorează melodiile
            </Link>
          </div>
        ) : (
          sortedCategories.map((cat) => (
            <div key={cat} className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 italic">{cat}</p>
                <p className="text-[10px] text-gray-400 dark:text-gray-500">{grouped[cat].length}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
                {grouped[cat].map((song) => (
                  <SongCard
                    key={song.id}
                    song={song}
                    favorited={true}
                    showCategory={false}
                    authenticated={true}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
