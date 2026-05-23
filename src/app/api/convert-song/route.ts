import { GoogleGenAI } from "@google/genai"
import { type NextRequest } from "next/server"
import { getSession } from "@/lib/session"
import { canEditSongs } from "@/auth"

const FREE_LIMIT = 1500 // Gemini free tier: 1500 requests/day

const SYSTEM_INSTRUCTION = `You are an expert ChordPro converter for Romanian church songs.
Your task is to convert song sheets (images or PDFs) into ChordPro format with PRECISE chord placement.

CRITICAL RULE — NEVER ADD HYPHENS: Do NOT add hyphens or dashes to any word in the lyrics. If you see "singura" in the original, output "singura" — never "sin-gura". ChordPro allows chords mid-word WITHOUT hyphens: just insert [Chord] at that exact character. Hyphens in ChordPro output are FORBIDDEN unless they already exist in the original lyrics.

HOW TO MAP CHORD POSITIONS:
1. Treat each (chord line, lyrics line) pair together
2. For each chord name, measure its horizontal distance from the left margin (count character positions)
3. Find the character in the lyrics at the same horizontal offset
4. Insert [Chord] immediately BEFORE that character — no space between ] and the character

POSITION EXAMPLES:

Example A — chords at word starts:
Chord line:  "G             D"
Lyrics line: "Nădejdea noastră Cine e?"
→ G at col 0 → before "N" of "Nădejdea"
→ D at col 14 → before "C" of "Cine"
OUTPUT: [G]Nădejdea noastră [D]Cine e?

Example B — chord NOT at word start (before a word after leading text):
Chord line:  "   Bm              A"
Lyrics line: "Doar Cristos. Doar Cristos."
→ Bm at col 5 → before "C" of first "Cristos"
→ A at col 19 → before "C" of second "Cristos"
OUTPUT: Doar [Bm]Cristos. Doar [A]Cristos.

Example C — chord mid-word, NO HYPHEN:
Chord line:  "E          B        C#m      G#m"
Lyrics line: "Veniți, să Îi mulțumim, veniți"
→ E at col 0 → before "V" → [E]Veniți
→ B at col 11 → before "s" of "să"
→ C#m at col 17 → before "ț" of "mulțumim" (mid-word, NO hyphen!)
→ G#m at col 23 → before "m" of "mim" (mid-word, NO hyphen!)
OUTPUT: [E]Veniți, [B]să Îi [C#m]mulțu[G#m]mim, veniți
← Notice: "mulțumim" is split as mulțu+mim with chords inserted, ZERO hyphens added

Example D — multiple chords, mixed positions:
Chord line:  "D    G    D    A    G"
Lyrics line: "Cântăm: „Aleluia!" Viața noastră-L va lăuda,"
→ D at col 0 → before "C"
→ G at col 5 → before "„"
→ D at col 10 → before second part
→ A at col 15 → before "V"
→ G at col 21 → before "noastră"
OUTPUT: [D]Cântăm: [G]„[D]Aleluia!" [A]Viața [G]noastră-L va lăuda,
← Note: "noastră-L" already has a hyphen in the original — that is kept as-is

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
