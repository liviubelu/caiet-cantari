export const dynamic = "force-dynamic"

import { notFound } from "next/navigation"
import { getSongById } from "@/lib/queries"
import { SongSheet } from "@/components/SongSheet"
import { SheetToolbar } from "./SheetToolbar"

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params
  const song = await getSongById(id)
  return { title: song?.title ?? "Melodie" }
}

/**
 * In-app, always-light sheet viewer (with chords). Rendered as a full-screen
 * overlay so it covers the app chrome, with its own Back button — the friendly
 * alternative to opening the raw PDF (which, on iOS, has no back button).
 */
export default async function SheetPage({ params }: Props) {
  const { id } = await params
  const song = await getSongById(id)
  if (!song) notFound()

  return (
    <div className="fixed inset-0 z-[200] bg-white text-gray-900 overflow-y-auto overscroll-none">
      <SheetToolbar songId={id} title={song.title} />
      <div className="mx-auto max-w-4xl px-4 sm:px-8 pt-3 pb-16">
        <div className="flex items-baseline gap-2 mb-2">
          <h1 className="text-2xl font-display font-bold leading-tight">{song.title}</h1>
          {song.defaultKey && (
            <span className="text-sm font-bold border border-gray-300 rounded-md px-1.5 py-0.5">{song.defaultKey}</span>
          )}
        </div>
        <hr className="border-gray-200 mb-4" />
        <SongSheet content={song.content} />
      </div>
    </div>
  )
}
