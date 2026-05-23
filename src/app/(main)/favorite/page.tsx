export const dynamic = "force-dynamic"

import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { songs, favorites } from "@/lib/schema"
import { eq } from "drizzle-orm"
import { SongCard } from "@/components/SongCard"
import Link from "next/link"
import { ChurchIcon } from "@/components/ChurchIcon"
import { CATEGORIES } from "@/lib/categories"

export default async function FavoritePage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const rows = await db
    .select({ song: songs })
    .from(favorites)
    .innerJoin(songs, eq(favorites.songId, songs.id))
    .where(eq(favorites.userId, session.user.id))

  const favSongs = rows.map((r) => r.song)

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

  const uniqueKeys = new Set(favSongs.map((s) => s.defaultKey).filter(Boolean))
  const uniqueCategories = new Set(favSongs.map((s) => s.category).filter(Boolean))

  const initials = session.user.name
    ? session.user.name.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase()
    : "?"

  return (
    <div className="lg:max-w-2xl lg:mx-auto">
      <div className="px-4 pt-12 lg:pt-6 pb-4">
        {/* Mobile-only header row */}
        <div className="flex items-center justify-between mb-4 lg:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-indigo-700 rounded-lg flex items-center justify-center">
              <ChurchIcon size={14} />
            </div>
            <div>
              <p className="text-[9px] font-semibold tracking-widest text-gray-400 uppercase leading-none">
                Cartea ta de cântări
              </p>
              <p className="text-sm font-bold text-gray-900 leading-tight">Cântările mele</p>
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-[11px] font-bold text-gray-600">
            {initials}
          </div>
        </div>
        {/* Desktop page title */}
        <h1 className="hidden lg:block text-[28px] font-display font-bold text-gray-900 leading-tight mb-4">Favorite</h1>

        <p className="text-sm text-gray-500 italic leading-relaxed border-l-2 border-blue-400 pl-3 py-1 mb-4">
          „Voi cânta Domnului cât voi trăi, voi lăuda pe Dumnezeul meu cât voi fi." — Psalm 104:33
        </p>

        <div className="flex gap-4 mb-4">
          {[
            { label: "CÂNTĂRI", value: favSongs.length },
            { label: "COLECȚII", value: uniqueCategories.size },
            { label: "TONALITĂȚI", value: uniqueKeys.size },
          ].map((stat) => (
            <div key={stat.label} className="flex-1 bg-white rounded-xl p-3 text-center border border-gray-100">
              <p className="text-lg font-bold text-gray-900">{stat.value}</p>
              <p className="text-[10px] font-semibold tracking-widest text-gray-400 uppercase">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="px-4">
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
                <p className="text-xs font-bold text-gray-500 italic">{cat}</p>
                <p className="text-[10px] text-gray-400">{grouped[cat].length}</p>
              </div>
              <div className="space-y-2">
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
