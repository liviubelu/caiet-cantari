import { GoogleGenAI } from "@google/genai"
import { type NextRequest } from "next/server"
import { getSession } from "@/lib/session"
import { canEditSongs } from "@/auth"

const FREE_LIMIT = 1500 // Gemini free tier: 1500 requests/day

const SYSTEM_INSTRUCTION = `You are an expert ChordPro converter for Romanian church songs.
Your task is to convert song sheets (images or PDFs) into ChordPro format with PRECISE chord placement.

CRITICAL: Chords appear on a separate line ABOVE the lyrics. Each chord is horizontally aligned with the exact syllable it belongs to. You must carefully measure the horizontal position (character offset from the left) of each chord and map it to the correct syllable in the lyrics line below.

HOW TO DETERMINE CHORD POSITION:
1. Look at the chord line and the lyrics line as a pair
2. For each chord, count its horizontal distance from the left margin
3. Find the character in the lyrics line at the same horizontal position
4. Place [Chord] immediately BEFORE that character/syllable in the ChordPro output

POSITION EXAMPLES:

Example A — two chords, each at a different word:
Chord line:  "G         D"
Lyrics line: "Nădejdea noastră Cine e?"
→ G is at position 0 → aligns with "N" of "Nădejdea"
→ D is at position 10 → aligns with "C" of "Cine"
OUTPUT: [G]Nădejdea noastră [D]Cine e?

Example B — chord mid-word (on a specific syllable):
Chord line:  "D    F#m  Bm"
Lyrics line: "Și singura încredere?"
→ D at pos 0 → "Și"
→ F#m at pos 5 → "sin" (mid-word "singura")
→ Bm at pos 10 → "în" (start of "încredere")
OUTPUT: [D]Și [F#m]sin-gura [Bm]încredere?

Example C — chord after some text (not at the start):
Chord line:  "  Bm           A"
Lyrics line: "Doar Cristos. Doar Cristos."
→ Bm at pos 2 → aligns with "C" of first "Cristos"
→ A at pos 14 → aligns with second "Cristos"
OUTPUT: Doar [Bm]Cristos. Doar [A]Cristos.

Example D — chord inline on a syllable break:
Chord line:  "E        B      C#m    G#m"
Lyrics line: "Veniți, să Îi mulțumim, veniți"
→ E at pos 0 → "Ve"
→ B at pos 9 → "să"
→ C#m at pos 15 → "mul" (mid-word)
→ G#m at pos 21 → "mim"
OUTPUT: [E]Veniți, [B]să Îi [C#m]mulțu[G#m]mim, veniți

CHORDPRO FORMAT RULES:
1. Inline chords: [C]word — chord placed immediately before its syllable, no spaces between bracket and syllable
2. Section markers (on their own line):
   - {verse} → for Strofa, numbered verses (1., 2., 3.)
   - {chorus} → for Refren, R:, Chorus
   - {bridge} → for Prerefren, Bridge, Pre-chorus
   - {intro} → for Intro
3. Empty line between sections
4. Preserve ALL Romanian diacritics exactly: ă â î ș ț Ș Ț Ă Â Î
5. Lowercase chord notation means minor: c# = C#m, g#m = G#m, bm = Bm, e = Em
6. Include ALL verses with {verse} before each one

KEY MAPPING (Romanian → standard):
MI → E, DO → C, RE → D, FA → F, SOL → G, LA → A, SI → B
FA# → F#, DO# → C#, SOL# → G#, RE# / MIb → Eb, LA# / SIb → Bb
mi → Em, do → Cm, re → Dm, fa → Fm, sol → Gm, la → Am, si → Bm, fa# → F#m
If no key shown, infer from the first chord of the song.

IGNORE:
- Song number prefix from title (e.g. "213.", "260.")
- Verse numbers at line start (1., 2., 3.)
- Repeat signs |: :| — include lyrics only once
- % repeat markers
- Page numbers, URLs, source attributions
- Chord diagrams or tablature at bottom of page`

const USER_PROMPT = `Analyze this song sheet carefully.

STEP 1: For each chord+lyrics pair, mentally note the horizontal position of every chord.
STEP 2: Map each chord to the exact syllable it sits above.
STEP 3: Output the full song in ChordPro format.

Return ONLY a valid JSON object with no markdown, no explanation, no code fences:
{"title":"Song title without number prefix","defaultKey":"Key in standard notation (D, Am, F#m, etc.)","content":"Full ChordPro content as a multiline string with \\n for newlines"}`

function extractJSON(text: string): { title: string; defaultKey: string; content: string } {
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim()
  return JSON.parse(cleaned)
}

function normalizeKey(key: string): string {
  if (!key) return ""
  if (/^[A-G][b#]?m?$/.test(key)) return key
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

  if (file.size > 10 * 1024 * 1024) {
    return Response.json({ error: "Fișierul este prea mare (maxim 10MB)." }, { status: 400 })
  }

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

  const ai = new GoogleGenAI({ apiKey })

  let responseText: string
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        thinkingConfig: { thinkingBudget: 8000 },
        temperature: 0.1,
      },
      contents: [
        {
          role: "user",
          parts: [
            { inlineData: { data: base64, mimeType } },
            { text: USER_PROMPT },
          ],
        },
      ],
    })
    responseText = response.text ?? ""
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)

    if (msg.includes("429") || msg.toLowerCase().includes("quota")) {
      return Response.json(
        {
          error: `⚠️ Limita gratuită Gemini a fost atinsă (${FREE_LIMIT}/zi). Încearcă mâine sau reduce numărul de conversii pe zi.`,
          rateLimited: true,
        },
        { status: 429 }
      )
    }

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
