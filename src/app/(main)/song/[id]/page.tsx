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
    <div className="bg-[#f0f2f5] flex-1">
      {/* Sticky gray nav bar — sits above the white card */}
      <div className="sticky top-0 z-40 bg-[#f0f2f5]/95 backdrop-blur-sm px-4 lg:px-6 pt-safe-bar pb-3 lg:pt-3 flex items-center justify-between">
        <BackButton />
        <div className="flex items-center gap-2">
          {session?.user && canEditSongs(session.user.role) && (
            <Link href={`/song/${id}/edit`} className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1">
              Editează
            </Link>
          )}
        </div>
      </div>

      {/* White card framed by the gray background on all sides.
          px-3 lg:px-6 = gray margin left/right
          pb-3 = gray margin below the card */}
      <div className="px-3 lg:px-6 pb-3">
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">

          {/* Title + category */}
          <div className="px-5 pt-5 pb-4">
            <h1 className="text-2xl font-display font-bold text-gray-900 leading-tight mb-2">
              {song.title}
            </h1>
            <div className="flex items-center gap-2 flex-wrap">
              {song.category && (
                <span
                  className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                  style={{ backgroundColor: cat.light, color: cat.color }}
                >
                  {song.category}
                </span>
              )}
            </div>
          </div>

          {/* Controls + lyrics — rendered by the client component */}
          <SongDetailClient
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
