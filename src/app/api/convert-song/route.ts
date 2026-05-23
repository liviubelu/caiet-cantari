import { GoogleGenAI } from "@google/genai"
import { type NextRequest } from "next/server"
import { getSession } from "@/lib/session"
import { canEditSongs } from "@/auth"

// Each conversion = 2 API calls → safe daily limit = 750 conversions
const FREE_LIMIT = 750

// ─── Step 1: Visual analysis ────────────────────────────────────────────────
const STEP1_SYSTEM = `You are a precise music notation analyzer.
Your only job is to look at a Romanian church song sheet image and report exactly which letter each chord is aligned above — nothing more.`

const STEP1_PROMPT = `Analyze this song sheet image with extreme care. Take all the time you need.

For every pair of (chord line, lyric line) in the image, apply the VERTICAL DROP METHOD:
  → Drop an imaginary vertical line straight down from the CENTER of each chord name
  → Find the exact letter in the lyric line that the vertical line passes through
  → That letter is where the chord belongs

Output format — repeat for every lyric line in the song:

LYRIC: [exact lyric text, preserve all Romanian characters: ă â î ș ț Ș Ț Ă Â Î]
CHORDS: D→[N]ădejdea | G→noastr[ă] | Bm→[C]ristos
         (the letter inside [ ] is the exact target letter)

For lyric lines with no chords: write CHORDS: (none)
For section headers (VERSE, CHORUS, BRIDGE, etc.): write SECTION: verse / chorus / bridge / intro

At the end write:
TITLE: [song title without any number prefix like "1." or "213."]
KEY: [the main key of the song in standard notation]

Rules:
- Be extremely precise about each chord's vertical position
- If a chord lands mid-word, report the mid-word letter — do NOT add hyphens
- Report chords in left-to-right order as they appear in the image
- Include every section and every verse`

// ─── Step 2: ChordPro conversion ────────────────────────────────────────────
const STEP2_SYSTEM = `You are a ChordPro formatter for Romanian church songs.
You receive a precise chord-position analysis and your only job is to format it correctly.`

const STEP2_PROMPT = `Using the chord analysis above, produce the ChordPro content.

Formatting rules:
1. For each lyric line, insert [Chord] immediately BEFORE the letter marked with [ ] in the analysis
   Example: LYRIC "Nădejdea" with D→[N] → output: [D]Nădejdea
   Example: LYRIC "mulțumim" with C#m→mul[ț] → output: mul[C#m]țumim
2. NEVER add hyphens to any word — not for mid-word chords, not for anything
   The word "singura" stays "singura" even if a chord falls on the "g"
3. Section markers on their own line (before the section, blank line after):
   {verse} · {chorus} · {bridge} · {intro}
4. Blank line between sections
5. Preserve all Romanian diacritics exactly: ă â î ș ț Ș Ț Ă Â Î
6. Include ALL verses (every {verse} section)
7. If a line has CHORDS: (none), write it as plain text with no chord brackets

Return ONLY a valid JSON object. No markdown. No code fences. No explanation:
{"title":"Song title","defaultKey":"Key (D, Am, F#m, etc.)","content":"full ChordPro with \\n for newlines"}`

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

  const callOptions = {
    thinkingConfig: { thinkingBudget: 24576 },
    temperature: 0 as const,
  }

  // ── Pas 1: Analiză vizuală ──────────────────────────────────────────────
  let analysis: string
  try {
    const step1 = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: { systemInstruction: STEP1_SYSTEM, ...callOptions },
      contents: [{
        role: "user",
        parts: [
          { inlineData: { data: base64, mimeType } },
          { text: STEP1_PROMPT },
        ],
      }],
    })
    analysis = step1.text ?? ""
    if (!analysis.trim()) {
      return Response.json({ error: "Analiza imaginii a eșuat. Încearcă o imagine mai clară." }, { status: 422 })
    }
  } catch (err: unknown) {
    return Response.json({ error: `Eroare la analiza imaginii: ${err instanceof Error ? err.message : String(err)}` }, { status: 500 })
  }

  // ── Pas 2: Conversie în ChordPro ────────────────────────────────────────
  let responseText: string
  try {
    const step2 = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: { systemInstruction: STEP2_SYSTEM, ...callOptions },
      contents: [{
        role: "user",
        parts: [{
          text: `Here is the precise chord-position analysis from Step 1:\n\n${analysis}\n\n---\n\n${STEP2_PROMPT}`,
        }],
      }],
    })
    responseText = step2.text ?? ""
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes("429") || msg.toLowerCase().includes("quota")) {
      return Response.json(
        {
          error: `⚠️ Limita gratuită Gemini a fost atinsă (${FREE_LIMIT}/zi). Încearcă mâine.`,
          rateLimited: true,
        },
        { status: 429 }
      )
    }
    return Response.json({ error: `Eroare la conversie: ${msg}` }, { status: 500 })
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
