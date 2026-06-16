export const dynamic = "force-dynamic"

import { favorites } from "@/lib/schema"
import { eq, and } from "drizzle-orm"
import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import { getCategoryColor } from "@/lib/categories"
import { canEditSongs } from "@/auth"
import { getSession } from "@/lib/session"
import { getSongById } from "@/lib/queries"
import Link from "next/link"
import { SongDetailClient } from "./SongDetailClient"
import { BackButton } from "./BackButton"
import { OrderBar } from "@/components/OrderBar"
import { parseSections, parseOrder } from "@/lib/sections"

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params
  const song = await getSongById(id)
  return { title: song?.title ?? "Melodie" }
}

export default async function SongPage({ params }: Props) {
  const { id } = await params

  const [session, song] = await Promise.all([getSession(), getSongById(id)])
  if (!song) notFound()

  const [fav] = session?.user?.id
    ? await db
        .select()
        .from(favorites)
        .where(and(eq(favorites.userId, session.user.id), eq(favorites.songId, id)))
        .limit(1)
    : []

  const isFavorited = !!fav
  const cat = getCategoryColor(song.category)

  return (
    <div className="bg-[#f0f2f5] dark:bg-gray-950 flex-1 flex flex-col">
      {/* Sticky gray nav bar — sits above the white card */}
      <div className="sticky top-0 z-40 bg-[#f0f2f5] dark:bg-gray-950 px-4 lg:px-6 pt-safe-bar pb-3 lg:pt-3 flex items-center justify-between">
        <BackButton />
        <div className="flex items-center gap-2">
          {session?.user && canEditSongs(session.user.role) && (
            <Link href={`/song/${id}/edit`} className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 px-2 py-1">
              Editează
            </Link>
          )}
        </div>
      </div>

      {/* White card framed by the gray background on all sides.
          px-3 lg:px-6 = gray margin left/right
          pb-3 = gray margin below the card */}
      <div className="px-3 lg:px-6 pb-3 flex-1 flex flex-col">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden flex-1">

          {/* Title + category */}
          <div className="px-5 pt-5 pb-4">
            <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-gray-100 leading-tight mb-2">
              {song.title}
            </h1>
            <div className="flex items-center gap-2 flex-wrap">
              {song.category && (
                <span
                  className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                  style={{ backgroundColor: `${cat.color}1a`, color: cat.color }}
                >
                  {song.category}
                </span>
              )}
            </div>
            {/* Custom singing order — guide bar (hidden when none set) */}
            <OrderBar
              order={parseOrder(song.singingOrder)}
              sections={parseSections(song.content)}
              className="mt-3"
            />
          </div>

          {/* Controls + lyrics — rendered by the client component.
              key={song.id} forces a fresh instance per song so transpose /
              chords-toggle state never bleeds from a previously opened song. */}
          <SongDetailClient
            key={song.id}
            content={song.content}
            defaultKey={song.defaultKey}
            songId={song.id}
            isFavorited={isFavorited}
            isAuthenticated={!!session?.user}
          />

        </div>
      </div>
    </div>
  )
}
