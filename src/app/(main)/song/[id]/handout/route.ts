import { getSongById } from "@/lib/queries"
import { generateHandoutPdf } from "@/lib/song-handout"

export const dynamic = "force-dynamic"

// Serves the song as a real PDF (chords above lyrics, auto-fit to one A4 page),
// opened inline in the browser's PDF viewer — the user prints/saves from there.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const song = await getSongById(id)
  if (!song) return new Response("Melodie negăsită", { status: 404 })

  const pdf = await generateHandoutPdf({
    title: song.title,
    content: song.content,
    defaultKey: song.defaultKey,
  })

  // ASCII-safe filename (strip diacritics) for the Content-Disposition header.
  const safe =
    (song.title || "melodie")
      .normalize("NFKD")
      .replace(/[^\w\s-]/g, "") // drops combining diacritics + punctuation → ASCII
      .trim()
      .replace(/\s+/g, "-") || "melodie"

  return new Response(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${safe}-acorduri.pdf"`,
      "Cache-Control": "private, max-age=0, must-revalidate",
    },
  })
}
