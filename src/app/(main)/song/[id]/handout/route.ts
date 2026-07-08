import { getSongById } from "@/lib/queries"
import { generateHandoutPdf } from "@/lib/song-handout"
import { transposeContent, getTransposedKey } from "@/lib/transpose"
import { parseSections, parseOrder, resolveOrder } from "@/lib/sections"

export const dynamic = "force-dynamic"

// Serves the song as a real PDF (chords above lyrics, auto-fit to one A4 page),
// opened inline in the browser's PDF viewer — the user prints/saves from there.
// `?st=N` transposes by N semitones (the key currently shown on the song page);
// the singing order (S1 Ref S2 …) is rendered as badges in the header.
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const song = await getSongById(id)
  if (!song) return new Response("Melodie negăsită", { status: 404 })

  const stRaw = parseInt(new URL(req.url).searchParams.get("st") ?? "0", 10)
  const st = Math.max(-11, Math.min(11, Number.isNaN(stRaw) ? 0 : stRaw))

  const order = resolveOrder(parseOrder(song.singingOrder), parseSections(song.content))
    .map((s) => ({ abbr: s.abbr, color: s.color }))

  const pdf = await generateHandoutPdf({
    title: song.title,
    content: transposeContent(song.content, st),
    defaultKey: getTransposedKey(song.defaultKey, st) || null,
    order,
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
