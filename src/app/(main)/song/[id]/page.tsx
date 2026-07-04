export const dynamic = "force-dynamic"

import { favorites, servicePlans, servicePlanSongs } from "@/lib/schema"
import { eq, and, max } from "drizzle-orm"
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
import { parseSections, parseOrder, getPresentationSlides } from "@/lib/sections"
import { formatRoDate } from "@/lib/format"
import { PresentationButton } from "@/components/Presentation"
import { PdfExportButton } from "@/components/PdfExportButton"

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

  // For editors: when was this song last marked as sung in a service?
  const canEdit = !!session?.user && canEditSongs(session.user.role)
  let lastSung: string | null = null
  if (canEdit) {
    const [row] = await db
      .select({ last: max(servicePlans.date) })
      .from(servicePlanSongs)
      .innerJoin(servicePlans, eq(servicePlanSongs.planId, servicePlans.id))
      .where(and(eq(servicePlanSongs.songId, id), eq(servicePlanSongs.sung, true)))
    lastSung = row?.last ?? null
  }

  // Presentation (projector) slides — only when a singing order is set.
  const order = parseOrder(song.singingOrder)
  const slides = getPresentationSlides(song.content, order)

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
              order={order}
              sections={parseSections(song.content)}
              className="mt-3"
            />
            {/* Editors only: when was it last sung in a service? */}
            {canEdit && (
              <p className="mt-3 text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1.5">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
                  <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.8"/>
                  <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
                {lastSung ? (
                  <>Cântată ultima dată: <span className="font-semibold text-gray-600 dark:text-gray-300">{formatRoDate(lastSung)}</span></>
                ) : (
                  "Încă necântată în programe"
                )}
              </p>
            )}
            {/* Projector presentation (only with a singing order) + PDF export */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {slides.length > 0 && <PresentationButton title={song.title} slides={slides} />}
              <PdfExportButton title={song.title} content={song.content} />
            </div>
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
