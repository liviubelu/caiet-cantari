export const dynamic = "force-dynamic"

import { canEditSongs } from "@/auth"
import { getSession } from "@/lib/session"
import { db } from "@/lib/db"
import { favorites } from "@/lib/schema"
import { eq } from "drizzle-orm"
import { getCachedSongs } from "@/lib/queries"
import { SongCard } from "@/components/SongCard"
import Link from "next/link"
import { ChurchIcon } from "@/components/ChurchIcon"

interface Props {
  searchParams: Promise<{ q?: string }>
}

export default async function HomePage({ searchParams }: Props) {
  const [session, { q }] = await Promise.all([getSession(), searchParams])

  // Songs come from cache (Vercel Data Cache, tag "songs").
  // Favorites must stay dynamic — they are per-user.
  const [allSongs, favs] = await Promise.all([
    getCachedSongs(q ?? ""),
    session?.user?.id
      ? db.select().from(favorites).where(eq(favorites.userId, session.user.id))
      : Promise.resolve([]),
  ])

  const favSet = new Set<string>(favs.map((f) => f.songId))

  const grouped = allSongs.reduce<Record<string, typeof allSongs>>((acc, song) => {
    const letter = song.title[0]?.toUpperCase() ?? "#"
    if (!acc[letter]) acc[letter] = []
    acc[letter].push(song)
    return acc
  }, {})

  const initials = session?.user?.name
    ? session.user.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
    : null

  return (
    <div className="bg-[#f0f2f5] dark:bg-gray-950 flex-1">
      {/* Sticky header — full width */}
      <div className="sticky top-0 z-40 bg-[#f0f2f5]/95 dark:bg-gray-950/95 backdrop-blur-sm px-4 lg:px-8 pt-safe-header lg:pt-6 pb-3">
        {/* Mobile-only header row — on desktop this is in the sidebar */}
        <div className="flex items-center justify-between mb-4 lg:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-indigo-700 rounded-lg flex items-center justify-center">
              <ChurchIcon size={14} />
            </div>
            <div>
              <p className="text-[9px] font-semibold tracking-widest text-gray-400 dark:text-gray-500 uppercase leading-none">
                Biserica
              </p>
              <p className="text-sm font-bold text-gray-900 dark:text-gray-100 leading-tight">Bartolomeu</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {session?.user && canEditSongs(session.user.role) && (
              <Link
                href="/adauga"
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
              <Link href="/login" className="text-xs font-semibold text-indigo-700 hover:underline">
                Login
              </Link>
            )}
          </div>
        </div>

        <h1 className="text-[28px] font-display font-bold text-gray-900 dark:text-gray-100 leading-tight">
          Caiet de cântări
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          {allSongs.length} {allSongs.length === 1 ? "cântare" : "cântări"}
          {favSet.size > 0 && ` · ${favSet.size} favorite`}
        </p>

        <div className="mt-4 relative">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" width="16" height="16" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
            <path d="M20 20l-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <form>
            <input
              name="q"
              defaultValue={q}
              placeholder="Caută după titlu sau prima linie…"
              className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900 transition"
            />
          </form>
        </div>
      </div>

      <div className="px-4 lg:px-8 py-2">
        {allSongs.length === 0 && (
          <div className="text-center py-16 text-gray-400 dark:text-gray-500">
            <p className="text-sm">
              {q ? `Nicio melodie găsită pentru „${q}"` : "Nicio melodie adăugată încă."}
            </p>
            {session?.user && !q && (
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
                  <SongCard
                    key={song.id}
                    song={song}
                    favorited={favSet.has(song.id)}
                    authenticated={!!session?.user}
                  />
                ))}
              </div>
            </div>
          ))}
      </div>
    </div>
  )
}
