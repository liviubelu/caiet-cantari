export const dynamic = "force-dynamic"

import { db } from "@/lib/db"
import { songs, favorites } from "@/lib/schema"
import { eq, and } from "drizzle-orm"
import { auth } from "@/auth"
import { notFound } from "next/navigation"
import { getCategoryColor } from "@/lib/categories"
import Link from "next/link"
import { SongDetailClient } from "./SongDetailClient"

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params
  const [song] = await db.select().from(songs).where(eq(songs.id, id)).limit(1)
  return { title: song?.title ?? "Melodie" }
}

export default async function SongPage({ params }: Props) {
  const { id } = await params
  const session = await auth()

  const [song] = await db.select().from(songs).where(eq(songs.id, id)).limit(1)
  if (!song) notFound()

  let isFavorited = false
  if (session?.user?.id) {
    const [fav] = await db
      .select()
      .from(favorites)
      .where(and(eq(favorites.userId, session.user.id), eq(favorites.songId, id)))
      .limit(1)
    isFavorited = !!fav
  }

  const cat = getCategoryColor(song.category)

  return (
    <div className="min-h-screen bg-white">
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M12 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Înapoi
        </Link>
        <div className="flex items-center gap-2">
          {session?.user && (
            <Link href={`/song/${id}/edit`} className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1">
              Editează
            </Link>
          )}
        </div>
      </div>

      <div className="px-4 pt-5 pb-4">
        <div className="flex items-start justify-between gap-3 mb-2">
          <h1 className="text-2xl font-display font-bold text-gray-900 leading-tight flex-1">
            {song.title}
          </h1>
        </div>
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

      <SongDetailClient
        content={song.content}
        defaultKey={song.defaultKey}
        songId={song.id}
        isFavorited={isFavorited}
        isAuthenticated={!!session?.user}
      />
    </div>
  )
}
