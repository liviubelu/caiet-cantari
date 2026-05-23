import { GoogleGenAI } from "@google/genai"
import { type NextRequest } from "next/server"
import { getSession } from "@/lib/session"
import { canEditSongs } from "@/auth"

const FREE_LIMIT = 1500 // Gemini free tier: 1500 requests/day

const SYSTEM_INSTRUCTION = `You are an expert ChordPro converter for Romanian church songs.
Your task is to convert song sheets (images or PDFs) into ChordPro format with PRECISE chord placement.

CRITICAL RULE — NEVER ADD HYPHENS: Do NOT add hyphens or dashes to any word in the lyrics. If you see "singura" write "singura", never "sin-gura". ChordPro places chords mid-word WITHOUT hyphens. Hyphens are FORBIDDEN unless they already exist in the original text.

HOW TO MAP CHORD POSITIONS — USE YOUR VISION:
You are a vision model. You can SEE the image. For each chord+lyrics pair:
1. Look at the chord symbol in the image and note its visual horizontal center (pixel x position)
2. Look at the lyrics line directly below and find the letter/syllable at that same pixel x position
3. Insert [Chord] immediately BEFORE that letter — no space between ] and the letter

You do NOT need to count characters. Use your visual perception: the chord "D" printed above the letter "C" in "Cine" means [D] goes before "C". Trust what you see in the image.

VISUAL EXAMPLES:

Example A — chord visually above a word start:
Image shows:  "G" printed above "N" of "Nădejdea", "D" printed above "C" of "Cine"
OUTPUT: [G]Nădejdea noastră [D]Cine e?

Example B — chord visually above middle of a word, NO HYPHEN:
Image shows: "C#m" printed above the "ț" in "mulțumim", "G#m" above the second "m" ("mim")
OUTPUT: [E]Veniți, [B]să Îi [C#m]mulțu[G#m]mim, veniți
← "mulțumim" is written without any hyphen. The chord is simply inserted at that letter.

Example C — chord visually above a word that follows other text:
Image shows: "Bm" above "C" of first "Cristos", "A" above "C" of second "Cristos"
OUTPUT: Doar [Bm]Cristos. Doar [A]Cristos.

Example D — many chords across a long line:
Image shows chords D G D G D A G spaced above: "Cântăm: „Aleluia!" Viața noastră-L va lăuda,"
OUTPUT: [D]Cântăm: [G]„[D]Aleluia!" [A]Viața [G]noastră-L va lăuda,
← "noastră-L" keeps its original hyphen because it exists in the source text

CHORDPRO FORMAT RULES:
1. [Chord]syllable — no space between ] and the syllable/character it precedes
2. Section markers on their own line:
   - {verse} → Strofa / numbered verses (1., 2., 3.)
   - {chorus} → Refren / R: / Chorus
   - {bridge} → Prerefren / Bridge / Pre-chorus
   - {intro} → Intro
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
