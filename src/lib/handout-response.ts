import { getSongById } from "@/lib/queries"
import { generateHandoutPdf } from "@/lib/song-handout"
import { transposeContent, getTransposedKey } from "@/lib/transpose"
import { parseSections, parseOrder, resolveOrder } from "@/lib/sections"
import { handoutFileName } from "@/lib/handout-name"

// Builds the inline-PDF response for a song. `?st=N` transposes by N semitones.
// Used by both /song/[id]/handout and /song/[id]/handout/[name] — the [name]
// variant puts the song name as the last URL segment, so the browser's PDF
// viewer saves it as "<Song>.pdf" instead of "handout".
export async function handoutResponse(id: string, reqUrl: string): Promise<Response> {
  const song = await getSongById(id)
  if (!song) return new Response("Melodie negăsită", { status: 404 })

  const stRaw = parseInt(new URL(reqUrl).searchParams.get("st") ?? "0", 10)
  const st = Math.max(-11, Math.min(11, Number.isNaN(stRaw) ? 0 : stRaw))

  const order = resolveOrder(parseOrder(song.singingOrder), parseSections(song.content))
    .map((s) => ({ abbr: s.abbr, color: s.color }))

  const pdf = await generateHandoutPdf({
    title: song.title,
    content: transposeContent(song.content, st),
    defaultKey: getTransposedKey(song.defaultKey, st) || null,
    order,
  })

  const fn = handoutFileName(song.title)
  // ASCII fallback for old clients + UTF-8 filename* for the real (diacritics) name.
  const ascii = fn.normalize("NFKD").replace(/[^\x20-\x7e]/g, "").replace(/["\\]/g, "") || "melodie.pdf"
  const disposition = `inline; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(fn)}`

  return new Response(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": disposition,
      "Cache-Control": "private, max-age=0, must-revalidate",
    },
  })
}
