import { GoogleGenerativeAI } from "@google/generative-ai"
import { type NextRequest } from "next/server"
import { getSession } from "@/lib/session"
import { canEditSongs } from "@/auth"

const FREE_LIMIT = 1500 // Gemini free tier: 1500 requests/day

const PROMPT = `You are a ChordPro converter for Romanian church songs.

The image or PDF shows a song sheet where chord names appear on SEPARATE LINES above the lyrics.
Each chord is horizontally positioned above the syllable it applies to.

Convert to ChordPro format where chords are INLINE, placed immediately before the syllable they belong to.

Example:
INPUT:
  E        B      c#     g#
Veniți, să Îi mulțumim, veniți

OUTPUT:
[E]Veniți, [B]să Îi [c#]mulțu[g#]mim, veniți

=== ChordPro RULES ===
1. Inline chords: [C]word [G]word [Am]word — chord directly before its syllable
2. Section markers (on their own line, before the section):
   - {verse} for Strofa / numbered verses (1., 2., 3.)
   - {chorus} for Refren (R:) / Chorus
   - {bridge} for Prerefren / Bridge / Pre-chorus
   - {intro} for Intro
3. Empty line between sections
4. Keep all Romanian diacritics: ă â î ș ț Ș Ț Ă Â Î
5. Lowercase chord = minor: c# means C#m, g# means G#m, e means Em, a means Am
6. Include ALL verses (1, 2, 3...) with {verse} before each

=== KEY MAPPING (Romanian → standard notation) ===
MI MAJOR → E    DO MAJOR → C    RE MAJOR → D    FA MAJOR → F
SOL MAJOR → G   LA MAJOR → A    SI MAJOR → B
FA# MAJOR → F#  DO# MAJOR → C#  SOL# MAJOR → G#
RE# MAJOR → Eb  LA# MAJOR → Bb
mi minor → Em   do minor → Cm   re minor → Dm   fa minor → Fm
sol minor → Gm  la minor → Am   si minor → Bm   fa# minor → F#m
If no key is shown, infer it from the first chord.

=== IGNORE ===
- Song number prefix (213., 260., etc.) from the title
- Verse numbers (1., 2., 3.) at the start of lyric lines
- Repeat signs |: :| — include lyrics once
- Percent signs % (repeat markers)
- Page numbers, URLs, source attributions
- Chord diagrams at the bottom

Return ONLY a valid JSON object, no markdown, no explanation:
{
  "title": "Song title without number prefix",
  "defaultKey": "Key in standard notation (E, C, Am, etc.)",
  "content": "Full ChordPro content as a multiline string"
}`

function extractJSON(text: string): { title: string; defaultKey: string; content: string } {
  // Strip markdown code fences if present
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim()
  return JSON.parse(cleaned)
}

function normalizeKey(key: string): string {
  // Normalize keys like "c#" → "C#m", already-standard keys pass through
  if (!key) return ""
  // If it looks like a standard key already, return as-is
  if (/^[A-G][b#]?m?$/.test(key)) return key
  // Lowercase single letter = minor
  if (/^[a-g][b#]?$/.test(key)) return key.toUpperCase() + "m"
  return key
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session?.user || !canEditSongs(session.user.role)) {
    return Response.json({ error: "Nu ai permisiunea să faci asta." }, { status: 401 })
  }

  const apiKey = process.env.GOOGLE_AI_KEY
  if (!apiKey) {
    return Response.json(
      { error: "GOOGLE_AI_KEY nu este configurat. Adaugă-l în variabilele de mediu Vercel." },
      { status: 500 }
    )
  }

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return Response.json({ error: "Eroare la citirea fișierului." }, { status: 400 })
  }

  const file = formData.get("file") as File | null
  if (!file) {
    return Response.json({ error: "Niciun fișier primit." }, { status: 400 })
  }

  // File size limit: 10MB
  if (file.size > 10 * 1024 * 1024) {
    return Response.json({ error: "Fișierul este prea mare (maxim 10MB)." }, { status: 400 })
  }

  // Validate mime type
  const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp", "application/pdf"]
  const mimeType = file.type === "image/jpg" ? "image/jpeg" : file.type
  if (!allowed.includes(mimeType)) {
    return Response.json(
      { error: "Format neacceptat. Folosește JPG, PNG, WebP sau PDF." },
      { status: 400 }
    )
  }

  const bytes = await file.arrayBuffer()
  const base64 = Buffer.from(bytes).toString("base64")

  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

  let responseText: string
  try {
    const result = await model.generateContent([
      { inlineData: { data: base64, mimeType: mimeType as string } },
      PROMPT,
    ])
    responseText = result.response.text()
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)

    // Rate limit hit
    if (msg.includes("429") || msg.toLowerCase().includes("quota")) {
      return Response.json(
        {
          error: `⚠️ Limita gratuită Gemini a fost atinsă (${FREE_LIMIT}/zi). Încearcă mâine sau reduce numărul de conversii pe zi.`,
          rateLimited: true,
        },
        { status: 429 }
      )
    }

    // Invalid API key
    if (msg.includes("400") || msg.toLowerCase().includes("api key")) {
      return Response.json(
        { error: "GOOGLE_AI_KEY invalid. Verifică key-ul în Vercel → Environment Variables." },
        { status: 400 }
      )
    }

    return Response.json({ error: `Eroare Gemini: ${msg}` }, { status: 500 })
  }

  let parsed: { title: string; defaultKey: string; content: string }
  try {
    parsed = extractJSON(responseText)
  } catch {
    return Response.json(
      {
        error: "Gemini nu a returnat un format valid. Încearcă din nou sau folosește o imagine mai clară.",
        raw: responseText,
      },
      { status: 422 }
    )
  }

  return Response.json({
    title: parsed.title ?? "",
    defaultKey: normalizeKey(parsed.defaultKey ?? ""),
    content: parsed.content ?? "",
    freeLimit: FREE_LIMIT,
  })
}
